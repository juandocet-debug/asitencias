from __future__ import annotations

from datetime import date
from typing import Sequence

from django.db import transaction

from academic.models import Attendance, Course, Session
from modulos.asistencia.dominio.entidades import (
    AsistenciaInvalidaError,
    RegistroAsistencia,
)
from modulos.asistencia.dominio.puertos import AsistenciaRepositoryPort


class DjangoAsistenciaRepository(AsistenciaRepositoryPort):
    @transaction.atomic
    def registrar_lote(
        self,
        curso_id: int,
        fecha: date,
        registros: Sequence[RegistroAsistencia],
    ) -> int:
        curso = Course.objects.get(id=curso_id)
        estudiantes = {registro.estudiante_id for registro in registros}
        matriculados = set(
            curso.students.filter(id__in=estudiantes).values_list('id', flat=True)
        )
        if estudiantes != matriculados:
            raise AsistenciaInvalidaError(
                "Todos los estudiantes deben estar matriculados en el curso."
            )
        sesion, _ = Session.objects.get_or_create(course=curso, date=fecha)

        for registro in registros:
            Attendance.objects.update_or_create(
                session=sesion,
                student_id=registro.estudiante_id,
                defaults={"status": registro.estado.value},
            )
        return len(registros)

    def obtener_docente_id(self, curso_id: int) -> int | None:
        return Course.objects.filter(id=curso_id).values_list(
            'teacher_id', flat=True
        ).first()

    def usuario_matriculado(self, curso_id: int, usuario_id: int) -> bool:
        return Course.objects.filter(id=curso_id, students__id=usuario_id).exists()

    def obtener_asistencia_sesion(self, curso_id: int, fecha: date) -> dict[int, str]:
        return dict(
            Attendance.objects.filter(
                session__course_id=curso_id,
                session__date=fecha,
            ).values_list('student_id', 'status')
        )

    @transaction.atomic
    def eliminar_sesion(self, curso_id: int, fecha: date) -> bool:
        eliminados, _ = Session.objects.filter(
            course_id=curso_id,
            date=fecha,
        ).delete()
        return eliminados > 0
