import json
import re
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.conversation import (
    create_conversation,
    get_conversation_by_id,
    update_conversation,
)
from app.crud.message import create_message, get_messages_by_conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate
from app.schemas.message import MessageCreate
from app.services.argo import ArgoService

logger = logging.getLogger(__name__)


class PromptTemplates:
    SYSTEM_PROMPT = """You are an expert oceanographer AI assistant for the Nautix ARGO Ocean Float Data Portal.
Your goal is to help users discover, understand, and visualize ARGO ocean float data.

You have access to real-time physical ocean measurements injected as context:
- Float Metadata: coordinates, regions, and dates.
- Profile Cycles: depth levels tracking temperature, salinity, and pressure.

Use the following guidelines:
1. Provide concise, expert, and structured answers (using tables or markdown).
2. Answer based ON the provided context when ARGO data is relevant. If data is not in the context, use your general knowledge to help.
3. You CAN and SHOULD answer general questions, greetings, casual conversation, and non-ARGO topics helpfully — while gently offering ocean data assistance when appropriate.
4. Quality Control (QC) Flags info:
   - QC Flag 1: Good data
   - QC Flag 2: Probably good data
   - QC Flag 3: Probably bad data
   - QC Flag 4: Bad data (do not use)
   - QC Flag 0: No QC performed
5. Maintain a friendly, professional, scientific tone.
"""

    @staticmethod
    def build_user_prompt(
        user_message: str, context_str: str, history_str: str
    ) -> str:
        return f"""CONVERSATION MEMORY HISTORY:
{history_str}

ARGO CONTEXT OCEANOGRAPHIC DATA:
{context_str}

USER QUESTION: {user_message}

Please reply to the user question utilizing the provided context and history. Keep it concise.
"""


class IntentParser:
    """Regex-based parser for Intent detection, Entity extraction, and Memory resolution."""

    WMO_REGEX = re.compile(r"\b\d{7}\b")
    REGION_KEYWORDS = ["atlantic", "pacific", "indian", "mediterranean", "southern"]
    PARAMETER_KEYWORDS = {
        "temperature": ["temp", "temperature", "warm", "cold"],
        "salinity": ["salinity", "salt", "psal", "fresh"],
        "pressure": ["depth", "pressure", "pres", "dbar"],
    }

    @classmethod
    def extract_entities(cls, content: str, history: List[Dict[str, str]]) -> Dict:
        """Extract WMO platforms, parameters, and regions. Resolves pronouns using history memory."""
        # 1. Platform WMO code
        wmos = cls.WMO_REGEX.findall(content)
        platform_number = wmos[0] if wmos else None

        # Resolve pronouns ("its", "this float", "that float") using history memory
        words = content.lower().split()
        if not platform_number and (
            "its" in words
            or "it" in words
            or "this float" in content.lower()
            or "that float" in content.lower()
            or "the float" in content.lower()
        ):
            # Look back in history for the last mentioned WMO code
            for msg in reversed(history):
                found_wmos = cls.WMO_REGEX.findall(msg["content"])
                if found_wmos:
                    platform_number = found_wmos[0]
                    break

        # 2. Ocean Region
        region = None
        for keyword in cls.REGION_KEYWORDS:
            if keyword in content.lower():
                region = keyword.title()
                break

        # 3. Parameters
        parameters = []
        for param, kw_list in cls.PARAMETER_KEYWORDS.items():
            if any(kw in content.lower() for kw in kw_list):
                parameters.append(param)

        return {
            "platform_number": platform_number,
            "region": region,
            "parameters": parameters,
        }


class ChatService:
    """Conversational AI Chat Engine handling memory, prompts, context, and fallback rules."""

    def __init__(self, argo_service: ArgoService):
        self.argo = argo_service
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            logger.warning(
                "OPENAI_API_KEY not found in settings. AI Chat Engine will degrade gracefully to rule-based fallback."
            )

    async def get_chat_history(
        self, db: AsyncSession, conversation_id: int
    ) -> List[Dict[str, str]]:
        messages = await get_messages_by_conversation(db, conversation_id)
        return [
            {"sender": msg.sender, "content": msg.content} for msg in messages
        ]

    async def process_chat_message(
        self, db: AsyncSession, user_id: int, content: str, conversation_id: Optional[int] = None
    ) -> Dict[str, Any]:
        start_time = datetime.now()

        # 1. Initialize or load Conversation
        if not conversation_id:
            # Create new conversation with temporary title
            title = content[:40] + ("..." if len(content) > 40 else "")
            conv_in = ConversationCreate(title=title)
            conversation = await create_conversation(db, obj_in=conv_in, user_id=user_id)
            conversation_id = conversation.id
        else:
            conversation = await get_conversation_by_id(db, conversation_id)
            if not conversation:
                raise ValueError("Conversation session not found.")

        # 2. Get history (memory)
        history = await self.get_chat_history(db, conversation_id)

        # 3. Save User message to DB
        user_msg_in = MessageCreate(sender="user", content=content)
        await create_message(db, obj_in=user_msg_in, conversation_id=conversation_id)

        # 4. Intent & Entity Extraction (supports follow-up resolutions)
        entities = IntentParser.extract_entities(content, history)
        p_num = entities["platform_number"]
        region = entities["region"]
        params = entities["parameters"]

        # 5. Context Gathering from ArgoService
        context_data = {}
        if p_num:
            # Fetch float details
            fl_meta = await self.argo.get_float_by_platform_number(p_num)
            if fl_meta:
                context_data["float_metadata"] = fl_meta.model_dump()
            # Fetch profile details
            profiles = await self.argo.get_float_profiles(p_num)
            if profiles:
                context_data["recent_profiles"] = [
                    p.model_dump() for p in profiles[:2]
                ]  # limit context size
        elif region:
            # Search floats in region
            search_profiles = await self.argo.search_argo_data(region=region)
            if search_profiles:
                context_data["region_profiles_summary"] = [
                    {
                        "profile_id": p.profile_id,
                        "platform_number": p.platform_number,
                        "latitude": p.latitude,
                        "longitude": p.longitude,
                    }
                    for p in search_profiles[:4]
                ]

        # 6. Execute Response Generation
        reply = ""
        context_str = json.dumps(context_data, default=str, indent=2)
        history_str = "\n".join([f"{h['sender']}: {h['content']}" for h in history[-5:]])

        if self.openai_client:
            # Query OpenAI API
            try:
                user_prompt = PromptTemplates.build_user_prompt(
                    content, context_str, history_str
                )
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": PromptTemplates.SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=500,
                    temperature=0.3,
                )
                reply = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}. Falling back to Rule Engine.")
                reply = self._generate_rule_based_response(content, entities, context_data)
        else:
            # Fallback local parser
            reply = self._generate_rule_based_response(content, entities, context_data)

        # 7. Save Bot response to DB
        bot_msg_in = MessageCreate(sender="bot", content=reply)
        await create_message(db, obj_in=bot_msg_in, conversation_id=conversation_id)

        # 8. Log Query Log metrics
        execution_time = (datetime.now() - start_time).total_seconds()
        from app.crud.query_log import create_query_log

        await create_query_log(
            db,
            user_id=user_id,
            query=content,
            execution_time=execution_time,
            status="success",
        )

        # Update conversation title if it was first message
        if len(history) == 0:
            await update_conversation(
                db,
                db_conversation=conversation,
                obj_in=ConversationUpdate(title=title),
            )

        return {
            "conversation_id": conversation_id,
            "reply": reply,
            "extracted_entities": {
                "platform_number": p_num,
                "region": region,
                "parameters": params,
            },
        }

    def _generate_rule_based_response(
        self, message: str, entities: Dict, context_data: Dict
    ) -> str:
        """A high-fidelity rule-based local generator answering queries using Argo context data."""
        p_num = entities["platform_number"]
        region = entities["region"]
        params = entities["parameters"]

        # QC Flag explanations
        if "qc" in message.lower() or "flag" in message.lower():
            return (
                "### Argo Quality Control (QC) Flags Explanation:\n\n"
                "ARGO measurements are assigned QC flags to indicate data quality thresholds:\n"
                "- **QC Flag 1 (Good)**: High-quality data, verified and ready for scientific analysis.\n"
                "- **QC Flag 2 (Probably Good)**: Probably good data, minor anomalies detected but usable.\n"
                "- **QC Flag 3 (Probably Bad)**: Probably bad data, potentially affected by sensor drift or biofouling.\n"
                "- **QC Flag 4 (Bad)**: Invalid data, fails testing constraints. Do not use.\n"
                "- **QC Flag 0 (No QC performed)**: Raw telemetry data before automated checking cycles."
            )

        # Float profile requests
        if p_num:
            fl = context_data.get("float_metadata")
            profiles = context_data.get("recent_profiles", [])

            if not fl:
                return f"I could not locate WMO platform number **{p_num}** in the ARGO registry. Please verify the code."

            response = (
                f"### ⚓ Argo Float {p_num} Details:\n"
                f"- **Region**: {fl.get('region')}\n"
                f"- **Last Location**: Lat {fl.get('latitude')}, Lon {fl.get('longitude')}\n"
                f"- **Deployment Date**: {fl.get('deployment_date')}\n\n"
            )

            if "salinity" in params:
                response += f"#### Salinity Profile Data for Float {p_num}:\n"
            elif "pressure" in params or "depth" in params:
                response += f"#### Depth / Pressure Data for Float {p_num}:\n"
            else:
                response += f"#### Temperature Profile Data for Float {p_num}:\n"

            if profiles:
                p = profiles[0]
                ts = p.get('timestamp')
                ts_str = ts.strftime('%Y-%m-%d') if hasattr(ts, 'strftime') else str(ts)[:10]
                response += f"Values recorded on {ts_str}:\n\n"
                response += "| Depth/Pressure (dbar) | Temperature (°C) | Salinity (PSU) |\n"
                response += "| --- | --- | --- |\n"
                for m in p.get("measurements", [])[:6]:
                    response += f"| {m.get('pressure')} | {m.get('temperature')} | {m.get('salinity')} |\n"
            else:
                response += "\n*No profiles cycle recordings found for this float.*"

            return response

        # Region requests
        if region:
            profiles_summary = context_data.get("region_profiles_summary", [])
            if profiles_summary:
                response = f"### 🌊 Active Argo Floats in the {region}:\n\n"
                response += "I found several active floats operating in this area:\n"
                for p in profiles_summary:
                    response += f"- **Platform {p['platform_number']}**: Last active profile {p['profile_id']} (Coordinates: {p['latitude']}, {p['longitude']})\n"
                return response
            else:
                return f"I searched the active registry but could not find any active floats operating in the **{region}**."

        # Generic / general questions
        msg_lower = message.lower().strip()
        greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"]
        if any(g in msg_lower for g in greetings):
            return (
                "Hello! I'm your Nautix oceanographic AI assistant. "
                "I can help you explore ARGO float data, explain ocean science concepts, "
                "or answer general questions. What would you like to know?"
            )

        general_starters = ["what is", "who is", "tell me about", "explain", "define", "why", "how does"]
        if any(msg_lower.startswith(s) for s in general_starters) and not p_num and not region:
            topic = message.strip().rstrip("?.")
            return (
                f"Great question about **{topic}**!\n\n"
                "While I specialize in ARGO ocean float data, I can share general knowledge on many topics. "
                "For the most detailed answer, please ensure your OpenAI API key is configured in the backend.\n\n"
                "In the meantime, try asking me about:\n"
                "- ARGO float profiles and WMO codes\n"
                "- Ocean regions and float locations\n"
                "- Quality control flags\n"
                "- Temperature and salinity data"
            )

        # Generic Help response
        return (
            "Hello! I'm your Nautix Oceanographic AI assistant. I can help with ARGO data and general questions. Try asking:\n\n"
            "1. *'Show temperature profile for float 1901234'*\n"
            "2. *'Explain QC flags'*\n"
            "3. *'Show floats in the Pacific Ocean'*\n"
            "4. *'What is salinity?'* or any general oceanography question"
        )
