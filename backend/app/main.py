import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.core.errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.logging import setup_logging
from app.ml.inference import get_classifier

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    settings = get_settings()
    classifier = get_classifier()
    try:
        classifier.load()
        logger.info("Resume classifier backend started successfully.")
    except Exception as exc:
        # Keep API alive for /health diagnostics even if model load fails.
        logger.error("Model failed to load at startup: %s", exc)
    yield
    logger.info("Shutting down resume classifier backend.")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Resume Field Classifier API",
        description=(
            "Upload PDF resumes for job-field classification using a trained ML model."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    from fastapi import HTTPException

    app.add_exception_handler(HTTPException, http_exception_handler)

    return app


app = create_app()
