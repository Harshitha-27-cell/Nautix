import logging
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import setup_logging
from app.database.session import engine
from app.middleware.error_handler import ErrorHandlerMiddleware

from app.api.v1.api import api_router
from app.api.auth_router import router as auth_router
from app.api.argo_router import router as argo_router
from app.api.chat_router import router as chat_router
from app.api.rag_router import router as rag_router
from app.api.visualization_router import router as visualization_router

# Initialize Logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run Alembic migrations automatically
    try:
        logger.info("Running Alembic migrations...")
        subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            check=True
        )
        logger.info("Alembic migrations completed successfully.")
    except Exception as e:
        logger.error(f"Alembic migration failed: {e}")

    # Startup validation check: Test database connectivity
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info(
            "Successfully connected to the database. Database validation check passed!"
        )
    except Exception as e:
        logger.critical(f"Database connection failed: {e}")

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for ARGO Ocean Data Conversational Chatbot",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {
        "message": "Nautix Backend is running successfully 🚀",
        "docs": "/docs",
        "redoc": "/redoc",
        "api": settings.API_V1_STR,
    }


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nautix.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Error Handling Middleware
app.add_middleware(ErrorHandlerMiddleware)

# Include Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(argo_router, prefix="/argo", tags=["argo"])
app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(rag_router, prefix="/rag", tags=["rag"])
app.include_router(
    visualization_router,
    prefix="/visualization",
    tags=["visualization"],
)
app.include_router(api_router, prefix=settings.API_V1_STR)