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
