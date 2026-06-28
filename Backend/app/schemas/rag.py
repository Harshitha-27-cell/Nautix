from typing import List, Optional
from pydantic import BaseModel, Field


class RagQueryRequest(BaseModel):
    query: str = Field(..., description="The natural language question to search in documentation")
    top_k: Optional[int] = Field(
        3, description="The maximum number of document chunks to retrieve as context"
    )


class SourceDocumentChunk(BaseModel):
    text: str = Field(..., description="The matching text content from the document chunk")
    source: str = Field(..., description="The source document filename")
    score: float = Field(..., description="The cosine similarity metric score (0.0 to 1.0)")


class RagQueryResponse(BaseModel):
    query: str = Field(..., description="The initial query submitted by the user")
    answer: str = Field(..., description="The RAG generated response")
    sources: List[SourceDocumentChunk] = Field(
        default=[], description="The document context sources references"
    )


class SemanticSearchResponse(BaseModel):
    query: str = Field(..., description="The query parameter text")
    chunks: List[SourceDocumentChunk] = Field(
        default=[], description="Top semantically similar document fragments"
    )
