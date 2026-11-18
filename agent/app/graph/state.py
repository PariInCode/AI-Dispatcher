from typing import Any, Dict, List, Optional, TypedDict


class DispatchState(TypedDict, total=False):
    raw_text: str
    order: Dict[str, Any]
    drivers: List[Dict[str, Any]]
    exclude_driver_ids: List[str]
    situation: Dict[str, Any]       # {"type": "new"} or {"type": "reassignment", ...}
    ranked: List[Dict[str, Any]]
    rejected: List[Dict[str, Any]]
    decision: Dict[str, Any]
    status: str                     # needs_clarification | no_candidates | assigned