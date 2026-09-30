def calculate_score(requirements):
    total = weighted = 0.0
    for item in requirements:
        weight = 2 if item["requirement_type"] == "required" else 1
        total += weight
        weighted += weight * float(item["rating"])
    score = round(100 * weighted / total, 2) if total else 0.0
    level = "Strong" if score >= 75 else "Good" if score >= 55 else "Partial" if score >= 35 else "Low"
    return score, level
