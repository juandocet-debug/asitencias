from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import Sequence

from .entidades import RegistroAsistencia


class AsistenciaRepositoryPort(ABC):
    @abstractmethod
    def registrar_lote(
        self,
        curso_id: int,
        fecha: date,
        registros: Sequence[RegistroAsistencia],
    ) -> int:
        """Crea o actualiza registros y retorna la cantidad procesada."""

    @abstractmethod
    def obtener_docente_id(self, curso_id: int) -> int | None:
        """Retorna el propietario o None cuando el curso no existe."""

    @abstractmethod
    def usuario_matriculado(self, curso_id: int, usuario_id: int) -> bool:
        """Indica si el usuario pertenece al curso como estudiante."""

    @abstractmethod
    def obtener_asistencia_sesion(self, curso_id: int, fecha: date) -> dict[int, str]:
        """Retorna los estados; una sesion inexistente produce un mapa vacio."""

    @abstractmethod
    def eliminar_sesion(self, curso_id: int, fecha: date) -> bool:
        """Elimina la sesion y retorna False cuando no existe."""
