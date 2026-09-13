import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from collections import defaultdict
from typing import Dict
import time as _time
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_supabase
from app.routers import (
    auth,
    spaces,
    projects,
    materials,
    tutor,
    quiz,
    mastery,
    analytics,
    recommendations,
    admin,
    home,
)

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    init_supabase()
    logger.info("AI Study Companion API started")
    yield
    logger.info("AI Study Companion API shutting down")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Simple in-memory rate limiter (60 requests per minute per IP)
_rate_limit_store: Dict = defaultdict(list)
RATE_LIMIT_MAX = 60
RATE_LIMIT_WINDOW = 60  # seconds


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks and docs
    if request.url.path in ["/api/health", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = _time.time()

    # Clean old entries outside window
    _rate_limit_store[client_ip] = [
        t for t in _rate_limit_store[client_ip] if now - t < RATE_LIMIT_WINDOW
    ]

    if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Please try again later."},
        )

    _rate_limit_store[client_ip].append(now)
    return await call_next(request)

# Error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(f"Unhandled exception on path {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred.",
                "path": request.url.path,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Include all routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(spaces.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(materials.router, prefix="/api")
app.include_router(materials.knowledge_router, prefix="/api")
app.include_router(tutor.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(mastery.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(home.router, prefix="/api")
