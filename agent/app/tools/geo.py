PLACES = {
    "noida": (28.5355, 77.3910),
    "noida sector 62": (28.6272, 77.3649),
    "noida sector 18": (28.5700, 77.3219),
    "greater noida": (28.4744, 77.5040),
    "gurgaon": (28.4595, 77.0266),
    "gurugram": (28.4595, 77.0266),
    "manesar": (28.3540, 76.9366),
    "faridabad": (28.4089, 77.3178),
    "ghaziabad": (28.6692, 77.4538),
    "delhi": (28.6139, 77.2090),
    "connaught place": (28.6315, 77.2167),
    "azadpur": (28.7075, 77.1747),
    "dwarka": (28.5921, 77.0460),
    "nehru place": (28.5494, 77.2501),
    "okhla": (28.5380, 77.2740),
    "sonipat": (28.9931, 77.0151),
    "meerut": (28.9845, 77.7064),
}

_KEYS_LONGEST_FIRST = sorted(PLACES, key=len, reverse=True)


def resolve_place(name):
    """Returns {'label','lat','lng'} or None if the place isn't in our table."""
    if not name:
        return None
    text = name.lower().strip()
    if text in PLACES:
        key = text
    else:
        key = next((k for k in _KEYS_LONGEST_FIRST if k in text), None)
    if not key:
        return None
    lat, lng = PLACES[key]
    return {"label": name.strip(), "lat": lat, "lng": lng}