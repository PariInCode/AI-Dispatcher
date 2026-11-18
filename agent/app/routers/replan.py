from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.graph.builder import dispatch_graph

router = APIRouter()


class ReplanRequest(BaseModel):
    order: Dict[str, Any]
    drivers: List[Dict[str, Any]]
    cancelledDriverId: str
    reason: Optional[str] = "driver cancelled"


@router.post("/replan")
def replan(req: ReplanRequest):
    prev = next((d for d in req.drivers if d["id"] == req.cancelledDriverId), None)
    try:
        state = dispatch_graph.invoke({
            "order": req.order,
            "drivers": req.drivers,
            "exclude_driver_ids": [req.cancelledDriverId],
            "situation": {
                "type": "reassignment",
                "previous_driver": prev["name"] if prev else "the previous driver",
                "reason": req.reason,
            },
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {
        "status": state.get("status"),
        "decision": state.get("decision"),
        "rejected": state.get("rejected", []),
    }