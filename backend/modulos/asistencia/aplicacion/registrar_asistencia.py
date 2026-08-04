from __future__ import annotations

from datetime import date
from typing import Iterable, Mapping

from modulos.asistencia.dominio.entidades import (
    AsistenciaInvalidaError,
    RegistroAsistencia,
)
from modulos.asistencia.dominio.puertos import AsistenciaRepositoryPort


class RegistrarAsistenciaUseCase:
    def __init__(self, repositorio: AsistenciaRepositoryPort):
        self._repositorio = repositorio

    def ejecutar(
        self,
        curso_id: int,
        fecha: date,
        asistencias: Iterable[Mapping[str, object]],
    ) -> int:
        if not isinstance(curso_id, int) or curso_id <= 0:
            raise AsistenciaInvalidaError(
                "El identificador del curso debe ser positivo."
            )
        if not isinstance(fecha, date):
            raise AsistenciaInvalidaError("La fecha de asistencia no es valida.")

        registros = [
            RegistroAsistencia.crear(
                estudiante_id=item.get("student_id"),
                estado=item.get("status"),
            )
            for item in asistencias
        ]
        if not registros:
            raise AsistenciaInvalidaError(
                "Debe incluir al menos un registro de asistencia."
            )

        estudiantes = [registro.estudiante_id for registro in registros]
        if len(estudiantes) != len(set(estudiantes)):
            raise AsistenciaInvalidaError(
                "Un estudiante no puede repetirse en el llamado."
            )

        return self._repositorio.registrar_lote(curso_id, fecha, registros)
