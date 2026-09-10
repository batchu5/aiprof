import logging
from datetime import datetime, timezone
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
)

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(tutor.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(mastery.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    init_supabase()
    logger.info("AI Study Companion API started")
