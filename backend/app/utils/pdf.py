import logging
from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError

logger = logging.getLogger(__name__)


class PdfExtractionError(Exception):
    """Raised when PDF text cannot be extracted."""


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extract text from a PDF byte payload."""
    if not data:
        raise PdfExtractionError("PDF file is empty.")

    try:
        reader = PdfReader(BytesIO(data), strict=False)
    except PdfReadError as exc:
        logger.warning("Corrupted or invalid PDF: %s", exc)
        raise PdfExtractionError("Corrupted or invalid PDF file.") from exc
    except Exception as exc:
        logger.warning("Failed to open PDF: %s", exc)
        raise PdfExtractionError("Unable to read PDF file.") from exc

    if len(reader.pages) == 0:
        raise PdfExtractionError("PDF has no pages.")

    chunks: list[str] = []
    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
        except Exception as exc:
            logger.debug("Page extraction warning: %s", exc)
            page_text = ""
        if page_text.strip():
            chunks.append(page_text)

    text = "\n".join(chunks).strip()
    if not text:
        raise PdfExtractionError(
            "No extractable text found. The PDF may be scanned/image-only."
        )

    return text
