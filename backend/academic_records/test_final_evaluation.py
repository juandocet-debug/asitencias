from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from academic.models import Attendance, Course, Session
from academic_records.models import CourseEvaluation, Grade, Rubric, RubricCriterion, RubricLevel
from modulos.evaluacion_final.aplicacion.resultados import student_result
from modulos.evaluacion_final.dominio.calculo import attendance_rate, weighted_grade


class FinalCalculationTests(SimpleTestCase):
    def test_weight_rounding_zero_and_pending(self):
        self.assertEqual(weighted_grade([(100, Decimal('3.125'))]), Decimal('3.13'))
        self.assertIsNone(weighted_grade([(100, None)]))
        self.assertEqual(weighted_grade([(0, None), (100, Decimal(0))]), Decimal('0.00'))
        self.assertEqual(attendance_rate(2, 3), 66.7)

    def test_attendance_and_rubric_contribute_to_student_result(self):
        result = student_result(4, 2, 1, Decimal(40), [(2, Decimal(60), Decimal(4))])
        self.assertEqual(result['attendance_rate'], 50)
        self.assertEqual(result['final_grade'], Decimal('3.40'))
        self.assertIsNone(student_result(4, 0, 0, Decimal(100), [])['final_grade'])


class FinalEvaluationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model().objects
        cls.teacher = users.create_user(username='final-teacher', role='TEACHER')
        cls.other = users.create_user(username='other-teacher', role='TEACHER')
        cls.student = users.create_user(username='final-student', role='STUDENT')
        cls.course = Course.objects.create(teacher=cls.teacher, name='Narración')
        cls.course.students.add(cls.student)
        cls.rubric = Rubric.objects.create(creator=cls.teacher, title='Proyecto')
        cls.criterion = RubricCriterion.objects.create(rubric=cls.rubric, name='Guion')
        cls.level = RubricLevel.objects.create(criterion=cls.criterion, value=4)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.teacher)
        self.url = f'/api/records/courses/{self.course.pk}/final-evaluation/'
        self.weights = {'attendance_weight': '40', 'rubric_weights': {str(self.rubric.pk): '60'}}

    def test_plan_persists_and_reuses_assignment_and_grade(self):
        self.assertEqual(self.client.put(self.url, self.weights, format='json').status_code, 200)
        evaluation = CourseEvaluation.objects.get(course=self.course, rubric=self.rubric)
        session = Session.objects.create(course=self.course, date=date(2026, 11, 3))
        Session.objects.create(course=self.course, date=date(2026, 11, 4))
        Attendance.objects.create(session=session, student=self.student, status='EXCUSED')
        self.assertIsNone(self.client.get(self.url).json()['results'][0]['final_grade'])
        grade = self.client.post('/api/records/grades/save-batch/', {
            'evaluation': evaluation.pk, 'student': self.student.pk, 'final_grade': '4.00',
            'scores': {str(self.criterion.pk): 4},
        }, format='json')
        self.assertEqual(grade.status_code, 201, grade.data)
        response = self.client.put(self.url, self.weights, format='json')
        self.assertEqual(response.json()['results'][0]['final_grade'], 3.4)
        self.assertEqual(self.client.get(self.url).json()['rubric_weights'], {str(self.rubric.pk): '60.00'})
        self.assertEqual(CourseEvaluation.objects.count(), 1)
        self.assertEqual(Grade.objects.count(), 1)
        self.assertEqual(self.client.delete(f'/api/records/evaluations/{evaluation.pk}/').status_code, 400)

    def test_invalid_totals_unavailable_rubric_and_permissions(self):
        wrong_total = {**self.weights, 'attendance_weight': 39}
        self.assertEqual(self.client.put(self.url, wrong_total, format='json').status_code, 400)
        foreign = Rubric.objects.create(creator=self.other, title='Privada')
        self.assertEqual(self.client.put(self.url, {
            'attendance_weight': 0, 'rubric_weights': {str(foreign.pk): 100},
        }, format='json').status_code, 400)
        self.assertIsNone(self.client.get(self.url).json()['attendance_weight'])
        for actor in (self.other, self.student):
            self.client.force_authenticate(actor)
            self.assertEqual(self.client.get(self.url).status_code, 403)
            self.assertEqual(self.client.put(self.url, self.weights, format='json').status_code, 403)

    def test_edit_preserves_criteria_and_rollback_protects_scores(self):
        evaluation = CourseEvaluation.objects.create(course=self.course, rubric=self.rubric)
        score_key = str(self.criterion.pk)
        grade = Grade.objects.create(evaluation=evaluation, student=self.student,
                                     evaluator=self.teacher, scores={score_key: 4}, final_grade=4)
        url = f'/api/records/rubrics/{self.rubric.pk}/'
        response = self.client.patch(url, {'criteria': [{
            'id': self.criterion.pk, 'name': 'Guion revisado',
            'levels': [{'value': 4, 'description': 'Cumple'}],
        }]}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['criteria'][0]['id'], self.criterion.pk)
        self.assertEqual(response.data['criteria'][0]['levels'][0]['id'], self.level.pk)
        rejected = self.client.patch(url, {'title': 'Debe revertirse', 'criteria': []}, format='json')
        self.assertEqual(rejected.status_code, 400)
        self.rubric.refresh_from_db()
        grade.refresh_from_db()
        self.assertEqual(self.rubric.title, 'Proyecto')
        self.assertEqual(grade.scores, {score_key: 4})
        self.assertEqual(self.client.delete(url).status_code, 400)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(url, {'title': 'Sin permiso'}, format='json').status_code, 403)
