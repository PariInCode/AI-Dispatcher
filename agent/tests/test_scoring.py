from app.tools.scoring import rank_candidates


def mk(id, name, lat, lng, cap, covered=True, refrigerated=False, loader=False,
       rating=4.5, skills=None, status="available"):
    return {
        "id": id, "name": name, "status": status, "rating": rating,
        "skills": skills or [], "location": {"lat": lat, "lng": lng},
        "vehicle": {"plate": id, "type": "x", "capacityKg": cap, "covered": covered,
                    "refrigerated": refrigerated, "hasLoader": loader},
    }


PICKUP = {"lat": 28.57, "lng": 77.32}


def order(**load):
    return {"pickup": PICKUP, "drop": {"lat": 28.45, "lng": 77.02}, "load": load}


def test_overweight_vehicle_rejected():
    drivers = [mk("a", "Small", 28.57, 77.32, 750), mk("b", "Big", 28.60, 77.35, 5000)]
    res = rank_candidates(order(weightKg=2000), drivers)
    assert [r["driver_id"] for r in res["ranked"]] == ["b"]
    assert res["rejected"][0]["driver_id"] == "a"


def test_perishable_needs_covered():
    drivers = [mk("open", "Open", 28.57, 77.32, 5000, covered=False),
               mk("cov", "Covered", 28.80, 77.50, 5000, covered=True)]
    res = rank_candidates(order(weightKg=500, handling=["perishable"]), drivers)
    assert [r["driver_id"] for r in res["ranked"]] == ["cov"]


def test_nearer_driver_wins_when_equal():
    drivers = [mk("far", "Far", 28.90, 77.60, 5000), mk("near", "Near", 28.58, 77.33, 5000)]
    res = rank_candidates(order(weightKg=3000), drivers)
    assert res["ranked"][0]["driver_id"] == "near"


def test_excluded_and_busy_drivers_skipped():
    drivers = [mk("a", "A", 28.57, 77.32, 5000), mk("b", "B", 28.58, 77.33, 5000, status="busy"),
               mk("c", "C", 28.60, 77.35, 5000)]
    res = rank_candidates(order(weightKg=3000), drivers, exclude_driver_ids=["a"])
    assert [r["driver_id"] for r in res["ranked"]] == ["c"]
    assert len(res["rejected"]) == 2