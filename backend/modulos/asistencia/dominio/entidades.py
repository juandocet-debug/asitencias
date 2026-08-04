from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class AsistenciaInvalidaError(ValueError):
    """Datos de un llamado que violan reglas del dominio."""


class EstadoAsistencia(StrEnum):
    PRESENT = "PRESENT"
    LATE = "LATE"
    ABSENT = "ABSENT"
    EXCUSED = "EXCUSED"


@dataclass(frozen=True, slots=True)
class RegistroAsistencia:
    estudiante_id: int
    estado: EstadoAsistencia

    @classmethod
    def crear(cls, estudiante_id: int, estado: str) -> "RegistroAsistencia":
        if not isinstance(estudiante_id, int) or estudiante_id <= 0:
            raise AsistenciaInvalidaError(
                "El identificador del estudiante debe ser positivo."
            )
        try:
            estado_valido = EstadoAsistencia(estado)
        except ValueError as error:
            raise AsistenciaInvalidaError(
                "El estado de asistencia no es valido."
            ) from error
        return cls(estudiante_id=estudiante_id, estado=estado_valido)
