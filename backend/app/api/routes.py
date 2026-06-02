import logging

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_app_settings, get_classification_service
from app.core.config import Settings
from app.core.errors import AppError, ModelNotLoadedError
from app.ml.inference import get_classifier
from app.schemas.responses import (
    ClassifyResponse,
    ClassifyTextRequest,
    ClassifyTextResponse,
    HealthResponse,
    ModelInfoResponse,
)
from app.services.classification import ClassificationService

logger = logging.getLogger(__name__)

router = APIRouter()


def _ensure_model_loaded() -> None:
    classifier = get_classifier()
    if not classifier.is_loaded:
        raise ModelNotLoadedError(classifier.load_error or "Model failed to load")


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_app_settings)) -> HealthResponse:
    classifier = get_classifier()
    return HealthResponse(
        status="ok",
        modelLoaded=classifier.is_loaded,
        modelPath=str(settings.resolve_path(settings.model_dir)),
        numClasses=len(classifier.classes) if classifier.is_loaded else None,
    )


@router.get("/model-info", response_model=ModelInfoResponse)
async def model_info(settings: Settings = Depends(get_app_settings)) -> ModelInfoResponse:
    _ensure_model_loaded()
    classifier = get_classifier()
    return ModelInfoResponse(
        modelType="transformers-sequence-classification",
        modelDir=str(settings.resolve_path(settings.model_dir)),
        classes=classifier.classes,
        labelMappingPath=str(settings.resolve_path(settings.label_mapping_path)),
    )


@router.post("/classify-resumes", response_model=ClassifyResponse)
@router.post("/classify", response_model=ClassifyResponse)
async def classify_resumes(
    files: list[UploadFile] = File(..., description="One or more PDF resume files"),
    service: ClassificationService = Depends(get_classification_service),
    settings: Settings = Depends(get_app_settings),
) -> ClassifyResponse:
    _ensure_model_loaded()

    if not files:
        raise AppError("No files uploaded. Attach PDF files under form field 'files'.", 400)

    if len(files) > settings.max_files_per_request:
        raise AppError(
            f"Too many files. Maximum allowed per request is {settings.max_files_per_request}.",
            400,
        )

    logger.info("Classify request received with %d file(s)", len(files))
    return await service.classify_uploads(
        files=files,
        max_bytes=settings.max_upload_bytes,
        preview_len=settings.text_preview_length,
        max_text_chars=settings.max_text_chars,
    )


@router.post("/classify-text", response_model=ClassifyTextResponse)
async def classify_text(
    payload: ClassifyTextRequest,
    service: ClassificationService = Depends(get_classification_service),
    settings: Settings = Depends(get_app_settings),
) -> ClassifyTextResponse:
    _ensure_model_loaded()
    item = service.classify_plain_text(
        text=payload.text,
        preview_len=settings.text_preview_length,
        max_text_chars=settings.max_text_chars,
    )
    return ClassifyTextResponse(
        prediction=item.prediction or "UNKNOWN",
        confidence=item.confidence or 0.0,
        textPreview=item.textPreview or "",
    )
