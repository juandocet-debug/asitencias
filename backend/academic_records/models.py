from django.conf import settings
from django.db import models

from academic.models import Course


class MeetingMinute(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Borrador'),
        ('PUBLISHED', 'Publicada'),
        ('CLOSED', 'Cerrada'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='meeting_minutes')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_minutes')
    title = models.CharField(max_length=180)
    date = models.DateField()
    data = models.JSONField(default=dict, blank=True)
    achievements = models.TextField(blank=True)
    agreements = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    attendees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='attended_minutes')
    absentees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='missed_minutes')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='participating_minutes')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-date', '-created_at')

    def __str__(self):
        return f'{self.title} - {self.course.name}'


class MinuteSignature(models.Model):
    minute = models.ForeignKey(MeetingMinute, on_delete=models.CASCADE, related_name='signatures')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='minute_signatures')
    signature_data = models.TextField(blank=True)
    signed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('minute', 'user')
        ordering = ('signed_at',)


class StoredSignature(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stored_signature')
    signature_data = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)


class Rubric(models.Model):
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='rubrics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    evaluator_count = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return self.title


class RubricCriterion(models.Model):
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name='criteria')
    name = models.CharField(max_length=255)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ('order', 'id')


class RubricLevel(models.Model):
    criterion = models.ForeignKey(RubricCriterion, on_delete=models.CASCADE, related_name='levels')
    value = models.PositiveSmallIntegerField()
    description = models.TextField(blank=True)

    class Meta:
        ordering = ('value',)
        unique_together = ('criterion', 'value')


class CourseEvaluation(models.Model):
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name='course_evaluations')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='evaluations')
    date = models.DateField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ('-date',)
        unique_together = ('rubric', 'course')


class Grade(models.Model):
    evaluation = models.ForeignKey(CourseEvaluation, on_delete=models.CASCADE, related_name='grades')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='grades')
    evaluator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='given_grades')
    scores = models.JSONField(default=dict)
    final_grade = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('evaluation', 'student', 'evaluator')
        ordering = ('student__last_name', 'student__first_name')
