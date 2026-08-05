from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Iterable


class AsistenciaInvalidaError(ValueError):
    """Datos de un llamado que violan reglas del dominio."""


class CursoNoEncontradoError(LookupError):
    """El curso solicitado no existe."""


class SesionNoEncontradaError(LookupError):
    """No existe una sesion para el curso y fecha solicitados."""


class AccesoAsistenciaDenegadoError(PermissionError):
    """El actor no puede ejecutar la operacion de asistencia."""


@dataclass(frozen=True, slots=True)
class ActorAsistencia:
    usuario_id: int
    roles: frozenset[str]
    es_superusuario: bool = False

    @classmethod
    def crear(
        cls,
        usuario_id: int,
        roles: Iterable[str],
        es_superusuario: bool = False,
    ) -> "ActorAsistencia":
        return cls(usuario_id, frozenset(roles), es_superusuario)

    def puede_administrar(self, docente_id: int) -> bool:
        return (
            self.es_superusuario
            or "ADMIN" in self.roles
            or self.usuario_id == docente_id
        )


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
