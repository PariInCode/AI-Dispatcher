from .distance import road_km_estimate
from .capacity import check_fit

# Sums to 100
WEIGHTS = {"proximity": 40, "capacity_fit": 25, "rating": 15, "skills": 20}
MAX_PICKUP_KM = 60  # beyond this, proximity score is 0
BUMP_PENALTY = 15



def _proximity(km):
    return max(0.0, 1 - km / MAX_PICKUP_KM)


def _capacity_fit(ratio):
    if ratio is None:
        return 0.5                      # weight unknown: neutral
    if ratio > 0.95:
        return 0.7                      # fits, but tight
    if ratio >= 0.5:
        return 1.0                      # sweet spot
    return max(0.2, ratio / 0.5)        # oversized truck for a small load


def _skills(load, skills):
    handling = set(load.get("handling") or [])
    wanted = set()
    if "fragile" in handling: wanted.add("fragile")
    if "perishable" in handling: wanted.add("perishable")
    if "needs_loader" in handling: wanted.add("loading_help")
    if (load.get("weightKg") or 0) >= 2000: wanted.add("heavy")
    if not wanted:
        return 0.5                      # nothing special needed: neutral
    return len(wanted & set(skills or [])) / len(wanted)


def rank_candidates(order: dict, drivers: list, exclude_driver_ids=None):
    """Filter by hard rules, score the rest. Returns {'ranked': [...], 'rejected': [...]}."""
    exclude = set(exclude_driver_ids or [])
    load = order.get("load") or {}
    pickup = order["pickup"]
    ranked, rejected = [], []

    for d in drivers:
        name = d["name"]
        if d["id"] in exclude:
            rejected.append({"driver_id": d["id"], "name": name, "reasons": ["excluded (e.g. cancelled this job)"]})
            continue
        if d.get("status") != "available":
            rejected.append({"driver_id": d["id"], "name": name, "reasons": [f"not available ({d.get('status')})"]})
            continue

        ok, reasons, ratio = check_fit(d["vehicle"], d.get("skills"), load)
        if not ok:
            rejected.append({"driver_id": d["id"], "name": name, "reasons": reasons})
            continue

        km = road_km_estimate(d["location"]["lat"], d["location"]["lng"], pickup["lat"], pickup["lng"])
        parts = {
            "proximity": _proximity(km),
            "capacity_fit": _capacity_fit(ratio),
            "rating": min(1.0, (d.get("rating") or 0) / 5),
            "skills": _skills(load, d.get("skills")),
        }
        breakdown = {k: round(parts[k] * WEIGHTS[k], 1) for k in parts}
        bumps = bool(d.get("bumpable"))
        total = sum(breakdown.values()) - (BUMP_PENALTY if bumps else 0)
        ranked.append({
            "driver_id": d["id"],
            "name": name,
            "vehicle_plate": d["vehicle"].get("plate"),
            "vehicle_type": d["vehicle"].get("type"),
            "capacity_kg": d["vehicle"].get("capacityKg"),
            "pickup_km": round(km, 1),
            "score": round(total, 1),
            "bumps_current_job": bumps,
            "breakdown": breakdown,
        })

    ranked.sort(key=lambda r: r["score"], reverse=True)
    return {"ranked": ranked, "rejected": rejected}