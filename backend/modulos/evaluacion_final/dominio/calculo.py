from decimal import Decimal, ROUND_HALF_UP


def attendance_rate(credited, sessions):
    return round(credited / sessions * 100, 1) if sessions else 0


def weighted_grade(components):
    total = Decimal(0)
    for weight, grade in components:
        if not weight:
            continue
        if grade is None:
            return None
        total += weight * grade / 100
    return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
