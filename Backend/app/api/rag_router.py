from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api import deps
from app.models.user import User
from app.schemas.rag import (
    RagQueryRequest,
    RagQueryResponse,
    SemanticSearchResponse,
    SourceDocumentChunk,
)
from app.services.rag import RAGService

router = APIRouter()


@router.post("/query", response_model=RagQueryResponse, status_code=status.HTTP_200_OK)
async def query_rag_documentation(
    query_in: RagQueryRequest,
    current_user: User = Depends(deps.get_current_user),
    rag_service: RAGService = Depends(deps.get_rag_service),
):
    """Submit a question to the ARGO documentation database.

    Retrieves semantic document context and generates a cited answer.
    """
    try:
        response = await rag_service.query_rag_system(
            query=query_in.query, top_k=query_in.top_k
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while executing the RAG query: {str(e)}",
        )


@router.post("/ingest", status_code=status.HTTP_200_OK)
async def trigger_document_ingestion(
    current_user: User = Depends(deps.get_current_user),
    rag_service: RAGService = Depends(deps.get_rag_service),
):
    """Scan and index all markdown files inside the ARGO knowledge base directories."""
    try:
        chunks_indexed = await rag_service.ingest_knowledge_base()
        return {
            "status": "success",
            "message": f"Successfully ingested and indexed {chunks_indexed} chunks from documentation.",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during documentation ingestion: {str(e)}",
        )


@router.get("/search", response_model=SemanticSearchResponse, status_code=status.HTTP_200_OK)
async def semantic_search_chunks(
    query: str = Query(..., description="The query parameter to search in index"),
    top_k: int = Query(3, description="Number of results to return"),
    current_user: User = Depends(deps.get_current_user),
    rag_service: RAGService = Depends(deps.get_rag_service),
):
    """Retrieve raw document context text segments matching the semantic query search."""
    try:
        # Auto-ingest if vector database is empty
        if not rag_service.db.index:
            await rag_service.ingest_knowledge_base()

        results = await rag_service.semantic_search(query, top_k=top_k)
        chunks = [SourceDocumentChunk(**r) for r in results]
        return {"query": query, "chunks": chunks}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while searching: {str(e)}",
        )
