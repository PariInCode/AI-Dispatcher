"""Offline dispatch simulation. No LLM, no network.
Run from the agent folder:  python simulate.py
"""
import json
import random
from pathlib import Path

from app.tools.capacity import check_fit
from app.tools.distance import road_km_estimate
from app.tools.geo import PLACES
from app.tools.scoring import rank_candidates

SEED = 42
TRIALS = 500
AVAILABILITY = 0.7  # each driver is free with this probability
SEED_DIR = Path(__file__).resolve().parents[1] / "server" / "src" / "seed"

PLACE_NAMES = [
    "noida", "greater noida", "gurgaon", "faridabad", "ghaziabad", "connaught place",
    "azadpur", "dwarka", "nehru place", "okhla", "sonipat", "meerut", "manesar",
]

# (material, min kg, max kg, handling, relative frequency)
MATERIALS = [
    ("cement", 500, 4000, ["needs_cover", "needs_loader"], 20),
    ("vegetables", 200, 1500, ["perishable", "needs_cover"], 20),
    ("furniture", 300, 2000, ["fragile", "needs_cover", "needs_loader"], 15),
    ("steel pipes", 1000, 8000, ["needs_loader"], 10),
    ("boxed parcels", 50, 600, [], 30),
    ("dairy", 200, 1200, ["perishable", "needs_cover", "needs_refrigeration"], 5),
]


def load_fleet():
    vehicles = {v["plate"]: v for v in json.loads((SEED_DIR / "vehicles.json").read_text(encoding="utf-8"))}
    drivers = json.loads((SEED_DIR / "drivers.json").read_text(encoding="utf-8"))
    fleet = []
    for i, d in enumerate(drivers):
        v = vehicles[d["plate"]]
        fleet.append({
            "id": f"d{i}", "name": d["name"], "status": "available",
            "rating": d["rating"], "skills": d["skills"],
            "location": {"lat": d["lat"], "lng": d["lng"]},
            "vehicle": {k: v[k] for k in ("plate", "type", "capacityKg", "covered", "refrigerated", "hasLoader")},
        })
    return fleet


def make_order(rng):
    name, lo, hi, handling, _ = rng.choices(MATERIALS, weights=[m[4] for m in MATERIALS])[0]
    a, b = rng.sample(PLACE_NAMES, 2)
    weight = round(rng.uniform(lo, hi) / 50) * 50
    return {
        "pickup": {"lat": PLACES[a][0], "lng": PLACES[a][1]},
        "drop": {"lat": PLACES[b][0], "lng": PLACES[b][1]},
        "load": {"material": name, "weightKg": weight, "handling": handling},
    }


def pick_first_free(order, avail):
    return avail[0] if avail else None


def pick_nearest_eligible(order, avail):
    ok = [d for d in avail if check_fit(d["vehicle"], d["skills"], order["load"])[0]]
    p = order["pickup"]
    return min(
        ok,
        key=lambda d: road_km_estimate(d["location"]["lat"], d["location"]["lng"], p["lat"], p["lng"]),
        default=None,
    )


def pick_ours(order, avail):
    ranked = rank_candidates(order, avail)["ranked"]
    if not ranked:
        return None
    return next(d for d in avail if d["id"] == ranked[0]["driver_id"])


STRATEGIES = {
    "First free driver": pick_first_free,
    "Nearest eligible driver": pick_nearest_eligible,
    "Our ranking": pick_ours,
}


def main():
    rng = random.Random(SEED)
    fleet = load_fleet()
    stats = {s: {"assigned": 0, "unassigned": 0, "wrong": 0, "km": 0.0, "oversized": 0} for s in STRATEGIES}

    for _ in range(TRIALS):
        order = make_order(rng)
        avail = [d for d in fleet if rng.random() < AVAILABILITY]
        while len(avail) < 3:
            avail = [d for d in fleet if rng.random() < AVAILABILITY]
        p, load = order["pickup"], order["load"]

        for name, fn in STRATEGIES.items():
            d = fn(order, avail)
            s = stats[name]
            if d is None:
                s["unassigned"] += 1
                continue
            s["assigned"] += 1
            s["km"] += road_km_estimate(d["location"]["lat"], d["location"]["lng"], p["lat"], p["lng"])
            if not check_fit(d["vehicle"], d["skills"], load)[0]:
                s["wrong"] += 1
            if d["vehicle"]["capacityKg"] > 3 * load["weightKg"]:
                s["oversized"] += 1

    print(f"\n{TRIALS} simulated orders, seed {SEED}, each driver free with p={AVAILABILITY}\n")
    print(f"{'Strategy':<26}{'Assigned':>9}{'No truck':>10}{'Wrong truck':>13}{'Avg pickup km':>15}{'Oversized':>11}")
    for name, s in stats.items():
        n = s["assigned"] or 1
        print(
            f"{name:<26}{s['assigned']:>9}{s['unassigned']:>10}"
            f"{100 * s['wrong'] / n:>12.1f}%{s['km'] / n:>15.1f}{100 * s['oversized'] / n:>10.1f}%"
        )
    print("\nWrong truck = vehicle cannot carry the load or lacks cover/refrigeration/loading help.")
    print("Oversized = truck capacity more than 3x the load weight.")
    print("Simulation on synthetic orders and the 8-driver demo fleet, not real-world data.\n")


if __name__ == "__main__":
    main()