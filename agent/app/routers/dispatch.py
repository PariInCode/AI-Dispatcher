from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.graph.builder import dispatch_graph

router = APIRouter()


class DispatchRequest(BaseModel):
    rawText: Optional[str] = None
    order: Optional[Dict[str, Any]] = None
    drivers: List[Dict[str, Any]]
    excludeDriverIds: List[str] = []


@router.post("/dispatch")
def dispatch(req: DispatchRequest):
    if not req.rawText and not req.order:
        raise HTTPException(status_code=400, detail="Provide rawText or order")
    try:
        state = dispatch_graph.invoke({
            "raw_text": req.rawText or "",
            "order": req.order,
            "drivers": req.drivers,
            "exclude_driver_ids": req.excludeDriverIds,
            "situation": {"type": "new"},
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {
        "status": state.get("status"),
        "order": state.get("order"),
        "decision": state.get("decision"),
        "rejected": state.get("rejected", []),
    }