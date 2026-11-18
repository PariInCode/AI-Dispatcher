def check_fit(vehicle: dict, driver_skills: list, load: dict):
    """Returns (ok, reasons, fill_ratio). fill_ratio is None if weight is unknown."""
    reasons = []
    weight = load.get("weightKg")
    handling = set(load.get("handling") or [])
    cap = vehicle["capacityKg"]

    if weight is not None and weight > cap:
        reasons.append(f"load {weight} kg exceeds capacity {cap} kg")
    if ("needs_cover" in handling or "perishable" in handling) and not vehicle.get("covered"):
        reasons.append("load needs a covered vehicle")
    if "needs_refrigeration" in handling and not vehicle.get("refrigerated"):
        reasons.append("load needs a refrigerated vehicle")
    if "needs_loader" in handling and not (
        vehicle.get("hasLoader") or "loading_help" in (driver_skills or [])
    ):
        reasons.append("load needs loading help")

    ratio = (weight / cap) if weight else None
    return (len(reasons) == 0), reasons, ratio