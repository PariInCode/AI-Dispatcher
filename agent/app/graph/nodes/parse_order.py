import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from app.llm.client import get_llm
from app.schemas.order import LLMParsedOrder
from app.tools.geo import resolve_place

PROMPT = (Path(__file__).resolve().parents[2] / "llm" / "prompts" / "parse_order.txt").read_text(encoding="utf-8")
CACHE_FILE = Path(__file__).resolve().parents[2] / "fallback" / "cached_parses.json"


def _llm_parse(raw_text: str, now: datetime) -> LLMParsedOrder:
    llm = get_llm().with_structured_output(LLMParsedOrder)
    messages = [("system", PROMPT.replace("{now}", now.isoformat())), ("human", raw_text)]
    last_err = None
    for _ in range(2):  # one retry
        try:
            return llm.invoke(messages)
        except Exception as e:
            last_err = e
    raise last_err


def _cached_parse(raw_text: str):
    try:
        cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return None
    hit = cache.get(raw_text.strip().lower())
    return LLMParsedOrder(**hit) if hit else None


def parse_order_text(raw_text: str) -> dict:
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    source = "llm"
    try:
        parsed = _llm_parse(raw_text, now)
    except Exception as e:
        parsed = _cached_parse(raw_text)
        if parsed is None:
            raise RuntimeError(f"LLM parse failed and no cached fallback: {e}")
        source = "cache"

    pickup = resolve_place(parsed.pickup_place)
    drop = resolve_place(parsed.drop_place)
    missing = list(parsed.missing_fields)
    if parsed.pickup_place and not pickup:
        missing.append(f"pickup location '{parsed.pickup_place}' not recognized")
    if parsed.drop_place and not drop:
        missing.append(f"drop location '{parsed.drop_place}' not recognized")

    return {
        "rawText": raw_text,
        "pickup": pickup or ({"label": parsed.pickup_place} if parsed.pickup_place else None),
        "drop": drop or ({"label": parsed.drop_place} if parsed.drop_place else None),
        "load": {
            "material": parsed.material,
            "weightKg": parsed.weight_kg,
            "quantity": parsed.quantity,
            "sizeCategory": parsed.size_category,
            "handling": parsed.handling,
            "source": "text",
            "confidence": parsed.confidence,
        },
        "deadline": parsed.deadline_iso,
        "priority": parsed.priority,
        "missingFields": missing,
        "needsClarification":  not (pickup and drop),
        "parseSource": source,
    }
def parse_node(state):
    order = parse_order_text(state["raw_text"])
    status = "needs_clarification" if order.get("needsClarification") else "parsed"
    return {"order": order, "status": status}