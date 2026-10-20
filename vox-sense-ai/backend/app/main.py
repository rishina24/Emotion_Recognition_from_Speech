"""VoxSense AI FastAPI Application Entry Point"""
from __future__ import annotations

from contextlib import asynccontextmanager
# pyrefly: ignore[missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore[missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore[missing-import]
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import get_logger
from app.api.routes import router
from app.services.inference import get_inference_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model at startup."""
    logger.info("VoxSense AI backend starting up...")
    # Eagerly initialize the inference service (loads model)
    svc = get_inference_service()
    if svc.is_ready:
        logger.info(f"Model ready: version={svc.model_version}, classes={svc.supported_classes}")
    else:
        logger.warning(
            "Model not loaded. Service starts in model-not-ready state. "
            "Train the model using the ml/ scripts."
        )
    yield
    logger.info("VoxSense AI backend shutting down.")


app = FastAPI(
    title="VoxSense AI API",
    description="Speech Emotion Recognition and Acoustic Analysis API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Include versioned router
app.include_router(router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )
