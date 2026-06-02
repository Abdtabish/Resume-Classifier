import logging
from dataclasses import dataclass
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.core.config import Settings, get_settings
from app.ml.loader import load_label_mapping

logger = logging.getLogger(__name__)


@dataclass
class PredictionOutput:
    label: str
    confidence: float  # percentage 0..100
    raw_label: str


class ResumeClassifier:
    """Loads HuggingFace sequence-classification model once and runs inference."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.model_dir = self.settings.resolve_path(self.settings.model_dir)
        self.label_mapping_path = self.settings.resolve_path(
            self.settings.label_mapping_path
        )

        self.model = None
        self.tokenizer = None
        self.id2label: dict[int, str] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._loaded = False
        self._load_error: str | None = None

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def load_error(self) -> str | None:
        return self._load_error

    @property
    def classes(self) -> list[str]:
        return sorted(set(self.id2label.values()))

    def load(self) -> None:
        """Load model/tokenizer at startup. Retries are not attempted here."""
        if self._loaded:
            return

        try:
            if not self.model_dir.exists():
                raise FileNotFoundError(f"Model directory not found: {self.model_dir}")

            logger.info("Loading tokenizer from %s", self.model_dir)
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)

            logger.info("Loading model from %s", self.model_dir)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_dir
            )
            self.model.to(self.device)
            self.model.eval()

            mapping = load_label_mapping(self.label_mapping_path)
            config_labels = getattr(self.model.config, "id2label", {}) or {}

            self.id2label = {}
            for idx, raw in config_labels.items():
                key = int(idx)
                mapped = mapping.get(str(raw), mapping.get(raw, raw))
                self.id2label[key] = mapped

            if not self.id2label and mapping:
                for i, label in enumerate(mapping.values()):
                    self.id2label[i] = label

            self._loaded = True
            self._load_error = None
            logger.info(
                "Model loaded on %s with %d classes",
                self.device,
                len(self.id2label),
            )
        except Exception as exc:
            self._loaded = False
            self._load_error = str(exc)
            logger.exception("Failed to load model: %s", exc)
            raise

    def predict(self, text: str) -> PredictionOutput:
        if not self._loaded or self.model is None or self.tokenizer is None:
            raise RuntimeError(self._load_error or "Model is not loaded")

        cleaned = text.strip()
        if not cleaned:
            raise ValueError("Text is empty after preprocessing.")

        encoded = self.tokenizer(
            cleaned,
            truncation=True,
            padding=True,
            max_length=min(512, getattr(self.tokenizer, "model_max_length", 512)),
            return_tensors="pt",
        )
        encoded = {k: v.to(self.device) for k, v in encoded.items()}

        with torch.no_grad():
            outputs = self.model(**encoded)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]

        confidence, pred_idx = torch.max(probs, dim=0)
        idx = int(pred_idx.item())
        raw_label = self.model.config.id2label.get(idx, f"LABEL_{idx}")
        label = self.id2label.get(idx, str(raw_label))
        confidence_pct = round(float(confidence.item()) * 100, 2)

        return PredictionOutput(
            label=label,
            confidence=confidence_pct,
            raw_label=str(raw_label),
        )


_classifier: ResumeClassifier | None = None


def get_classifier() -> ResumeClassifier:
    global _classifier
    if _classifier is None:
        _classifier = ResumeClassifier()
    return _classifier
