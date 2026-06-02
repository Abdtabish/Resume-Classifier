import re
import unicodedata


def clean_resume_text(raw: str, max_chars: int = 12000) -> str:
    """
    Normalize resume text before model inference.
    Keep preprocessing conservative so it stays close to training cleanup.
    """
    if not raw:
        return ""

    text = unicodedata.normalize("NFKC", raw)
    text = text.replace("\x00", " ")
    text = re.sub(r"<[^>]+>", " ", text)  # strip HTML remnants if present
    text = re.sub(r"\s+", " ", text).strip()
    text = text.lower()

    if len(text) > max_chars:
        text = text[:max_chars]

    return text


def build_text_preview(text: str, max_len: int = 280) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if len(cleaned) <= max_len:
        return cleaned
    return f"{cleaned[:max_len].rstrip()}..."
