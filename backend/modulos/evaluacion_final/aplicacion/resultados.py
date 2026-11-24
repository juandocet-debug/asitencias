from decimal import Decimal

from ..dominio.calculo import attendance_rate, weighted_grade


def student_result(student, sessions, credited, attendance_weight, rubrics):
    rate = attendance_rate(credited, sessions) if sessions else None
    attendance_grade = Decimal(str(rate)) / 20 if rate is not None else None
    return {
        'student': student,
        'attendance_rate': rate,
        'rubrics': [{'evaluation': evaluation, 'grade': grade} for evaluation, _, grade in rubrics],
        'final_grade': weighted_grade([
            (attendance_weight, attendance_grade),
            *((weight, grade) for _, weight, grade in rubrics),
        ]),
    }
