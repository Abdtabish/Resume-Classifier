from functools import lru_cache

from app.core.config import Settings, get_settings
from app.ml.inference import ResumeClassifier, get_classifier
from app.services.classification import ClassificationService


@lru_cache
def get_classification_service() -> ClassificationService:
    return ClassificationService(classifier=get_classifier())


def get_app_settings() -> Settings:
    return get_settings()
