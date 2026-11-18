from app.tools.scoring import rank_candidates


def rank_node(state):
    order = state["order"]
    pickup = order.get("pickup") or {}
    if "lat" not in pickup or "lng" not in pickup:
        return {"status": "needs_clarification"}

    result = rank_candidates(order, state["drivers"], state.get("exclude_driver_ids"))
    status = "ranked" if result["ranked"] else "no_candidates"
    return {"ranked": result["ranked"], "rejected": result["rejected"], "status": status}