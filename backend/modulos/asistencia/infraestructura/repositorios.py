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
