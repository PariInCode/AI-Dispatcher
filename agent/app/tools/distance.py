from math import radians, sin, cos, asin, sqrt

ROAD_FACTOR = 1.3  # straight-line underestimates road distance


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


def road_km_estimate(lat1, lng1, lat2, lng2):
    return haversine_km(lat1, lng1, lat2, lng2) * ROAD_FACTOR