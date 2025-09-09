import json
import os
from functools import lru_cache
from typing import List, Optional

# Determine path to principles.json relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "principles.json")

@lru_cache(maxsize=1)
def _load_principles() -> List[dict]:
    """Load principles from the JSON file once and cache the result."""
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def get_principles(
    category: Optional[str] = None,
    stage: Optional[str] = None,
    limit: int = 5,
) -> List[dict]:
    """Retrieve principles filtered by category and stage."""
    principles = _load_principles()
    if category:
        principles = [
            p for p in principles if category in (p.get("categories") or [])
        ]
    if stage:
        principles = [
            p for p in principles if stage in (p.get("business_stage") or [])
        ]
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 5
    return principles[:limit]
