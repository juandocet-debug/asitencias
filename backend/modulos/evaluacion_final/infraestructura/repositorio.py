from collections import defaultdict
from decimal import Decimal

from django.db.models import Count

from academic.models import Attendance, Session
from academic_records.models import CourseEvaluation, Grade
from ..aplicacion.resultados import student_result


def course_results(course, plan):
    weights = {int(pk): Decimal(value) for pk, value in plan.rubric_weights.items()}
    evaluations = {evaluation.rubric_id: evaluation for evaluation in (
        CourseEvaluation.objects.filter(course=course, rubric_id__in=weights)
        .select_related('rubric').prefetch_related('rubric__criteria__levels')
    )}
    grades = defaultdict(list)
    for grade in Grade.objects.filter(evaluation__in=evaluations.values()):
        grades[grade.evaluation_id, grade.student_id].append(grade)

    sessions = Session.objects.filter(course=course).count()
    attendance = Attendance.objects.filter(
        session__course=course, status__in=['PRESENT', 'LATE', 'EXCUSED'],
    ).values('student_id').annotate(credited=Count('pk'))
    credited = {row['student_id']: row['credited'] for row in attendance}

    return [
        student_result(
            student.pk, sessions, credited.get(student.pk, 0), plan.attendance_weight,
            [
                rubric_result(evaluations.get(rubric_id), weight, student.pk, grades)
                for rubric_id, weight in weights.items()
            ],
        )
        for student in course.students.all()
    ]


def rubric_result(evaluation, weight, student_id, grades):
    if evaluation is None:
        return None, weight, None
    return evaluation.pk, weight, evaluation_grade(
        evaluation.rubric, grades[evaluation.pk, student_id],
    )


def evaluation_grade(rubric, grades):
    criteria = list(rubric.criteria.all())
    max_grade = max(
        Decimal(5),
        sum(max((level.value for level in criterion.levels.all()), default=5)
            for criterion in criteria) / Decimal(len(criteria) or 1),
    )
    # Existing manual grades have no criterion scores. Retain their recorded value.
    complete = [
        grade.final_grade * 5 / max_grade if grade.scores else grade.final_grade
        for grade in grades
        if not grade.scores or len(grade.scores) >= len(criteria)
    ]
    if len(complete) < max(rubric.evaluator_count, 1):
        return None
    return sum(complete) / len(complete)
