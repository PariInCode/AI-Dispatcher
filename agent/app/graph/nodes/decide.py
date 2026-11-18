import json
from pathlib import Path

from app.llm.client import get_llm
from app.schemas.decision import LLMDecision

PROMPT = (Path(__file__).resolve().parents[2] / "llm" / "prompts" / "decide.txt").read_text(encoding="utf-8")
SHORTLIST_MAX = 3
SCORE_WINDOW = 8  # LLM may only pick candidates within this many points of the best


def _order_summary(order):
    load = order.get("load") or {}
    return {
        "pickup": (order.get("pickup") or {}).get("label"),
        "drop": (order.get("drop") or {}).get("label"),
        "material": load.get("material"),
        "weightKg": load.get("weightKg"),
        "quantity": load.get("quantity"),
        "handling": load.get("handling"),
        "deadline": order.get("deadline"),
        "priority": order.get("priority"),
        "customerText": order.get("rawText"),
    }


def _fallback_texts(order, best, situation):
    o = _order_summary(order)
    vtype = (best.get("vehicle_type") or "vehicle").replace("_", " ")
    cap = best.get("capacity_kg")
    cap_txt = f" with {int(cap)} kg capacity" if cap else ""
    reasoning = (
        f"{best['name']} is assigned a {vtype}{cap_txt} ({best['vehicle_plate']}), "
        f"about {best['pickup_km']} km from pickup. "
        f"This was the best match among drivers whose vehicles meet the load's requirements."
    )
    if situation.get("type") == "reassignment":
        reasoning = (
            f"{situation.get('previous_driver')} dropped out ({situation.get('reason')}). "
            + reasoning
        )
    if best.get("bumps_current_job"):
        reasoning += " This driver's current normal-priority job will be moved to another driver because this order is urgent."
    driver_msg = (
        f"Naya job: {o['pickup']} se {o['drop']}, {o['material'] or 'maal'} "
        f"{o['weightKg'] or ''} kg. Confirm karein."
        
    )
    customer_msg = (
        f"A driver has been assigned to your order: {best['name']} ({best['vehicle_plate']})."
    )
    return reasoning, driver_msg, customer_msg
   


def decide_node(state):
    order = state["order"]
    ranked = state["ranked"]
    rejected = state.get("rejected", [])
    situation = state.get("situation") or {"type": "new"}

    best = ranked[0]
    shortlist = [r for r in ranked[:SHORTLIST_MAX] if r["score"] >= best["score"] - SCORE_WINDOW]
    by_id = {r["driver_id"]: r for r in shortlist}
    others = [
        {"name": r["name"], "vehicle_type": r["vehicle_type"], "capacity_kg": r["capacity_kg"],
         "pickup_km": r["pickup_km"], "score": r["score"]}
        for r in ranked if r["driver_id"] not in by_id
    ][:3]

    chosen, source, llm_error = best, "fallback", None
    reasoning, driver_msg, customer_msg = _fallback_texts(order, best, situation)

    try:
        prompt = (
            PROMPT.replace("{order}", json.dumps(_order_summary(order), ensure_ascii=False))
            .replace("{situation}", json.dumps(situation, ensure_ascii=False))
            .replace("{candidates}", json.dumps(shortlist, ensure_ascii=False))
            .replace("{rejected}", json.dumps(rejected[:6], ensure_ascii=False))
            .replace("{others}", json.dumps(others, ensure_ascii=False))
        )
        llm = get_llm().with_structured_output(LLMDecision)
        out = llm.invoke([("system", prompt), ("human", "Decide now.")])
        if out.chosen_driver_id in by_id:
            chosen = by_id[out.chosen_driver_id]
            reasoning, driver_msg, customer_msg = out.reasoning, out.driver_message, out.customer_message
            source = "llm"
        else:
            llm_error = f"LLM chose an id outside the shortlist: {out.chosen_driver_id}"
    except Exception as e:
        llm_error = f"{type(e).__name__}: {e}"
        print("LLM decide failed:", llm_error)

    decision = {
        "driver_id": chosen["driver_id"],
        "name": chosen["name"],
        "vehicle_plate": chosen["vehicle_plate"],
        "vehicle_type": chosen["vehicle_type"],
        "score": chosen["score"],
        "breakdown": chosen["breakdown"],
        "pickup_km": chosen["pickup_km"],
        "reasoning": reasoning,
        "driverMessage": driver_msg,
        "customerMessage": customer_msg,
        "bumpsCurrentJob": chosen.get("bumps_current_job", False),
        "alternatives": [
            {"driver_id": r["driver_id"], "name": r["name"], "score": r["score"]}
            for r in ranked if r["driver_id"] != chosen["driver_id"]
        ][:4],
        "rejected": rejected,
        "source": source,
        "llmError": llm_error,
    }
    return {"decision": decision, "status": "assigned"}