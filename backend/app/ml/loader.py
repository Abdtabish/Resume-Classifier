import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def load_label_mapping(path: Path) -> dict[str, str]:
    """
    Load label mapping from JSON.

    Supported formats:
    - {"LABEL_0": "ENGINEERING", ...}
    - {"0": "ENGINEERING", ...}
    - ["ENGINEERING", "SALES", ...]  (index-ordered list)
    """
    if not path.exists():
        logger.warning("Label mapping not found at %s", path)
        return {}

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return {f"LABEL_{i}": label for i, label in enumerate(data)}

    if isinstance(data, dict):
        normalized: dict[str, str] = {}
        for key, value in data.items():
            if not isinstance(value, str):
                continue
            k = str(key)
            if k.isdigit():
                normalized[f"LABEL_{k}"] = value
            else:
                normalized[k] = value
        return normalized

    raise ValueError(f"Unsupported label mapping format in {path}")
