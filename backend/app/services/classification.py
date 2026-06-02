import logging
from typing import BinaryIO

from fastapi import UploadFile

from app.ml.inference import ResumeClassifier, get_classifier
from app.schemas.responses import ClassifyResponse, ResumeResultItem, SummaryStats
from app.utils.pdf import PdfExtractionError, extract_text_from_pdf_bytes
from app.utils.preprocessing import build_text_preview, clean_resume_text

logger = logging.getLogger(__name__)

PDF_CONTENT_TYPES = {
    "application/pdf",
    "application/x-pdf",
    "application/acrobat",
    "application/vnd.pdf",
}


class ClassificationService:
    """Orchestrates PDF validation, extraction, preprocessing, and inference."""

    def __init__(self, classifier: ResumeClassifier | None = None) -> None:
        self.classifier = classifier or get_classifier()

    def _validate_upload(self, upload: UploadFile, max_bytes: int) -> str | None:
        filename = upload.filename or "unknown.pdf"
        if not filename.lower().endswith(".pdf"):
            return "Only PDF files are supported."

        content_type = (upload.content_type or "").lower()
        if content_type and content_type not in PDF_CONTENT_TYPES:
            return f"Unsupported content type: {content_type}"

        return None

    async def _read_upload_bytes(self, upload: UploadFile, max_bytes: int) -> bytes:
        data = await upload.read()
        if not data:
            raise PdfExtractionError("Uploaded file is empty.")
        if len(data) > max_bytes:
            raise PdfExtractionError(
                f"File exceeds maximum allowed size ({max_bytes // (1024 * 1024)} MB)."
            )
        return data

    def _failed_item(self, file_name: str, error: str) -> ResumeResultItem:
        return ResumeResultItem(
            fileName=file_name,
            prediction=None,
            confidence=None,
            textPreview=None,
            status="failed",
            error=error,
        )

    def _process_pdf_bytes(
        self,
        file_name: str,
        data: bytes,
        preview_len: int,
        max_text_chars: int,
    ) -> ResumeResultItem:
        logger.info("Extracting text from %s", file_name)
        raw_text = extract_text_from_pdf_bytes(data)
        cleaned = clean_resume_text(raw_text, max_chars=max_text_chars)
        preview = build_text_preview(raw_text, max_len=preview_len)

        logger.info("Running inference for %s", file_name)
        prediction = self.classifier.predict(cleaned)

        return ResumeResultItem(
            fileName=file_name,
            prediction=prediction.label,
            confidence=prediction.confidence,
            textPreview=preview,
            status="processed",
            error=None,
        )

    async def classify_uploads(
        self,
        files: list[UploadFile],
        max_bytes: int,
        preview_len: int,
        max_text_chars: int,
    ) -> ClassifyResponse:
        results: list[ResumeResultItem] = []

        for upload in files:
            file_name = upload.filename or "unknown.pdf"
            logger.info("Processing upload: %s", file_name)

            validation_error = self._validate_upload(upload, max_bytes)
            if validation_error:
                logger.warning("Validation failed for %s: %s", file_name, validation_error)
                results.append(self._failed_item(file_name, validation_error))
                continue

            try:
                data = await self._read_upload_bytes(upload, max_bytes)
                item = self._process_pdf_bytes(
                    file_name, data, preview_len, max_text_chars
                )
                results.append(item)
                logger.info(
                    "Prediction success for %s -> %s (%.2f%%)",
                    file_name,
                    item.prediction,
                    item.confidence or 0,
                )
            except PdfExtractionError as exc:
                logger.warning("Extraction failed for %s: %s", file_name, exc)
                results.append(self._failed_item(file_name, str(exc)))
            except Exception as exc:
                logger.exception("Inference failed for %s", file_name)
                results.append(
                    self._failed_item(file_name, f"Inference failed: {exc}")
                )
            finally:
                await upload.close()

        processed = sum(1 for r in results if r.status == "processed")
        failed = len(results) - processed
        summary = SummaryStats(
            totalFiles=len(results),
            processed=processed,
            failed=failed,
        )
        return ClassifyResponse(results=results, summary=summary)

    def classify_plain_text(
        self,
        text: str,
        preview_len: int,
        max_text_chars: int,
    ) -> ResumeResultItem:
        cleaned = clean_resume_text(text, max_chars=max_text_chars)
        preview = build_text_preview(text, max_len=preview_len)
        prediction = self.classifier.predict(cleaned)
        return ResumeResultItem(
            fileName="text-input",
            prediction=prediction.label,
            confidence=prediction.confidence,
            textPreview=preview,
            status="processed",
            error=None,
        )
