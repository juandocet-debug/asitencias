import platform
import sys

import django
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, datetime, timedelta

from academic.models import Course, Session, Attendance

User = get_user_model()


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        today = date.today()
        today_code = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][today.weekday()]

        year = request.query_params.get('year')
        period = request.query_params.get('period')

        user_roles = user.roles or [user.role]
        if 'ADMIN' in user_roles or user.is_superuser:
            effective = 'ADMIN'
        elif 'COORDINATOR' in user_roles:
            effective = 'ADMIN'
        elif 'TEACHER' in user_roles:
            effective = 'TEACHER'
        elif 'PRACTICE_TEACHER' in user_roles:
            effective = 'TEACHER'
        else:
            effective = 'STUDENT'

        if effective == 'STUDENT':
            courses = Course.objects.filter(students=user)
            if year:
                courses = courses.filter(year=year)
            if period:
                courses = courses.filter(period=period)

            total_courses = courses.count()
            total_sessions = total_present = total_absent = total_late = excused = 0
            today_classes = []
            alerts = []

            for course in courses:
                attendances = Attendance.objects.filter(session__course=course, student=user)
                course_sessions = Session.objects.filter(course=course).count()
                presences = attendances.filter(status='PRESENT').count()
                lates = attendances.filter(status='LATE').count()
                absences = attendances.filter(status='ABSENT').count()
                excused = attendances.filter(status='EXCUSED').count()

                total_sessions += course_sessions
                total_present += presences
                total_late += lates
                total_absent += absences

                if absences >= 3:
                    alerts.append({
                        'course_name': course.name,
                        'absences': absences,
                        'limit': 3
                    })

                has_class_today = False
                class_time = "Sin horario"
                if course.schedule:
                    for slot in course.schedule:
                        if slot.get('day') == today_code:
                            has_class_today = True
                            class_time = f"{slot.get('start')} - {slot.get('end')}"
                            break

                if has_class_today:
                    today_classes.append({
                        'id': course.id,
                        'name': course.name,
                        'code': course.code,
                        'schedule': class_time,
                        'teacher': f"{course.teacher.first_name} {course.teacher.last_name}",
                        'all_schedules': course.schedule
                    })

            total_recorded = total_present + total_late + total_absent + excused
            global_rate = round(((total_present + total_late + excused) / total_recorded) * 100, 1) if total_recorded > 0 else 0

            return Response({
                'role': 'STUDENT',
                'stats': {
                    'total_courses': total_courses,
                    'attendance_rate': global_rate,
                    'total_absences': total_absent,
                    'total_lates': total_late,
                    'alerts': alerts
                },
                'today_classes': today_classes
            })

        elif effective == 'ADMIN':
            courses = Course.objects.all()
            if year:
                courses = courses.filter(year=year)
            if period:
                courses = courses.filter(period=period)

            total_students = User.objects.filter(role='STUDENT').count()
            total_teachers = User.objects.filter(role='TEACHER').count()

            today_classes = []
            for c in courses:
                has_class_today = False
                class_time = "Sin horario"
                if c.schedule:
                    for slot in c.schedule:
                        if slot.get('day') == today_code:
                            has_class_today = True
                            class_time = f"{slot.get('start')} - {slot.get('end')}"
                            break
                if has_class_today:
                    today_classes.append({
                        'id': c.id,
                        'name': c.name,
                        'code': c.code,
                        'schedule': class_time,
                        'teacher': f"{c.teacher.first_name} {c.teacher.last_name}",
                        'all_schedules': c.schedule
                    })

            today_sessions = Session.objects.filter(date=today)
            today_attendance_rate = 0
            if today_sessions.exists():
                total_att = Attendance.objects.filter(session__in=today_sessions).count()
                present_att = Attendance.objects.filter(session__in=today_sessions, status='PRESENT').count()
                if total_att > 0:
                    today_attendance_rate = round((present_att / total_att) * 100, 1)

            return Response({
                'role': 'ADMIN',
                'stats': {
                    'total_courses': courses.count(),
                    'total_students': total_students,
                    'total_teachers': total_teachers,
                    'today_sessions': len(today_classes),
                    'today_attendance_rate': today_attendance_rate
                },
                'today_classes': today_classes
            })

        elif effective == 'TEACHER':
            my_courses = Course.objects.filter(teacher=user)
            if year:
                my_courses = my_courses.filter(year=year)
            if period:
                my_courses = my_courses.filter(period=period)

            total_students = 0
            today_classes = []

            for c in my_courses:
                total_students += c.students.count()
                has_class_today = False
                class_time = "Sin horario"
                if c.schedule:
                    for slot in c.schedule:
                        if slot.get('day') == today_code:
                            has_class_today = True
                            class_time = f"{slot.get('start')} - {slot.get('end')}"
                            break
                if has_class_today:
                    today_classes.append({
                        'id': c.id,
                        'name': c.name,
                        'code': c.code,
                        'schedule': class_time,
                        'students_count': c.students.count(),
                        'all_schedules': c.schedule
                    })

            today_sessions = Session.objects.filter(course__in=my_courses, date=today)
            today_attendance_rate = 0
            if today_sessions.exists():
                total_att = Attendance.objects.filter(session__in=today_sessions).count()
                present_att = Attendance.objects.filter(session__in=today_sessions, status='PRESENT').count()
                if total_att > 0:
                    today_attendance_rate = round((present_att / total_att) * 100, 1)

            return Response({
                'role': 'TEACHER',
                'stats': {
                    'total_courses': my_courses.count(),
                    'total_students': total_students,
                    'today_sessions': len(today_classes),
                    'today_attendance_rate': today_attendance_rate
                },
                'today_classes': today_classes
            })

        return Response({'error': 'Rol no reconocido o no autorizado'}, status=403)

    @action(detail=False, methods=['get'], url_path='admin-analytics')
    def admin_analytics(self, request):
        """
        Endpoint exclusivo ADMIN: métricas detalladas tipo Power BI.
        Devuelve indicadores de usuarios, asistencia, cursos y sistema.
        """
        from django.conf import settings as django_settings

        user = request.user
        user_roles = user.roles or [user.role]
        if 'ADMIN' not in user_roles and not user.is_superuser:
            return Response({'error': 'Acceso restringido a administradores'}, status=403)

        today = date.today()

        # ── 1. Distribución de usuarios por rol
        total_users = User.objects.count()
        students_count = User.objects.filter(role='STUDENT').count()
        teachers_count = User.objects.filter(role='TEACHER').count()
        admins_count = User.objects.filter(role='ADMIN').count()

        # ── 2. Registros de nuevos usuarios por mes (últimos 6 meses)
        six_months_ago = today - timedelta(days=180)
        monthly_users = (
            User.objects.filter(date_joined__gte=six_months_ago)
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        monthly_users_data = [
            {'month': entry['month'].strftime('%b %Y'), 'count': entry['count']}
            for entry in monthly_users
        ]

        # ── 3. Estadísticas globales de cursos
        total_courses = Course.objects.count()
        active_courses = Course.objects.filter(year=str(today.year)).count()
        total_sessions = Session.objects.count()

        # ── 4. Asistencia global por mes (últimos 6 meses)
        monthly_attendance = []
        for i in range(5, -1, -1):
            month_date = (today.replace(day=1) - timedelta(days=i * 28))
            month_start = month_date.replace(day=1)
            if month_date.month == 12:
                month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
            else:
                month_end = month_date.replace(month=month_date.month + 1, day=1)

            sessions_in_month = Session.objects.filter(date__gte=month_start, date__lt=month_end)
            total_att = Attendance.objects.filter(session__in=sessions_in_month).count()
            present_att = Attendance.objects.filter(session__in=sessions_in_month, status='PRESENT').count()
            late_att = Attendance.objects.filter(session__in=sessions_in_month, status='LATE').count()
            absent_att = Attendance.objects.filter(session__in=sessions_in_month, status='ABSENT').count()
            rate = round(((present_att + late_att) / total_att) * 100, 1) if total_att > 0 else 0

            monthly_attendance.append({
                'month': month_start.strftime('%b'),
                'rate': rate,
                'present': present_att,
                'absent': absent_att,
                'late': late_att,
                'total': total_att,
            })

        # ── 5. Top 5 cursos por asistencia
        top_courses = []
        for course in Course.objects.all()[:20]:
            sessions = Session.objects.filter(course=course)
            total = Attendance.objects.filter(session__in=sessions).count()
            present = Attendance.objects.filter(session__in=sessions, status='PRESENT').count()
            rate = round((present / total) * 100, 1) if total > 0 else 0
            top_courses.append({
                'name': course.name[:30],
                'code': course.code,
                'students': course.students.count(),
                'sessions': sessions.count(),
                'attendance_rate': rate,
                'teacher': f"{course.teacher.first_name} {course.teacher.last_name}" if course.teacher else 'Sin docente',
            })
        top_courses = sorted(top_courses, key=lambda x: x['attendance_rate'], reverse=True)[:5]

        # ── 6. Rendimiento por docente (top 5)
        teacher_stats = []
        for teacher in User.objects.filter(role='TEACHER')[:10]:
            courses = Course.objects.filter(teacher=teacher)
            student_count = sum(c.students.count() for c in courses)
            sessions = Session.objects.filter(course__in=courses)
            total = Attendance.objects.filter(session__in=sessions).count()
            present = Attendance.objects.filter(session__in=sessions, status='PRESENT').count()
            rate = round((present / total) * 100, 1) if total > 0 else 0
            teacher_stats.append({
                'name': f"{teacher.first_name} {teacher.last_name}",
                'courses': courses.count(),
                'students': student_count,
                'attendance_rate': rate,
            })
        teacher_stats = sorted(teacher_stats, key=lambda x: x['attendance_rate'], reverse=True)[:5]

        # ── 7. Asistencia global hoy
        today_sessions = Session.objects.filter(date=today)
        today_total = Attendance.objects.filter(session__in=today_sessions).count()
        today_present = Attendance.objects.filter(session__in=today_sessions, status='PRESENT').count()
        today_absent = Attendance.objects.filter(session__in=today_sessions, status='ABSENT').count()
        today_rate = round((today_present / today_total) * 100, 1) if today_total > 0 else 0

        # ── 8. Alertas de estudiantes en riesgo
        at_risk_count = 0
        for student in User.objects.filter(role='STUDENT'):
            for course in Course.objects.filter(students=student):
                absences = Attendance.objects.filter(
                    session__course=course, student=student, status='ABSENT'
                ).count()
                if absences >= 3:
                    at_risk_count += 1
                    break

        # ── 9. Info del sistema
        python_version = sys.version.split(' ')[0]
        django_version = django.get_version()
        os_info = f"{platform.system()} {platform.release()}"
        db_backend = 'PostgreSQL' if 'psycopg2' in str(sys.modules) else 'SQLite (dev)'
        is_production = not django_settings.DEBUG

        return Response({
            'generated_at': today.isoformat(),
            'kpis': {
                'total_users': total_users,
                'total_students': students_count,
                'total_teachers': teachers_count,
                'total_admins': admins_count,
                'total_courses': total_courses,
                'active_courses': active_courses,
                'total_sessions': total_sessions,
                'at_risk_students': at_risk_count,
                'today_attendance_rate': today_rate,
                'today_present': today_present,
                'today_absent': today_absent,
                'today_sessions': today_sessions.count(),
            },
            'charts': {
                'monthly_attendance': monthly_attendance,
                'monthly_new_users': monthly_users_data,
                'top_courses': top_courses,
                'teacher_performance': teacher_stats,
                'user_distribution': [
                    {'label': 'Estudiantes', 'value': students_count, 'color': '#3B82F6'},
                    {'label': 'Docentes', 'value': teachers_count, 'color': '#8B5CF6'},
                    {'label': 'Admins', 'value': admins_count, 'color': '#0EA5E9'},
                ],
            },
            'system': {
                'python_version': python_version,
                'django_version': django_version,
                'os': os_info,
                'database': db_backend,
                'environment': 'Production' if is_production else 'Development',
                'debug_mode': django_settings.DEBUG,
                'total_db_records': {
                    'users': total_users,
                    'courses': total_courses,
                    'sessions': total_sessions,
                    'attendance_records': Attendance.objects.count(),
                },
            }
        })
