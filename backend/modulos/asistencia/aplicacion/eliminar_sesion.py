from __future__ import annotations

from datetime import date

from modulos.asistencia.dominio import (
    AccesoAsistenciaDenegadoError,
    ActorAsistencia,
    AsistenciaRepositoryPort,
    CursoNoEncontradoError,
    SesionNoEncontradaError,
)


class EliminarSesionAsistenciaUseCase:
    def __init__(self, repositorio: AsistenciaRepositoryPort):
        self._repositorio = repositorio

    def ejecutar(self, actor: ActorAsistencia, curso_id: int, fecha: date) -> None:
        docente_id = self._repositorio.obtener_docente_id(curso_id)
        if docente_id is None:
            raise CursoNoEncontradoError("Curso no encontrado")
        if not actor.puede_administrar(docente_id):
            raise AccesoAsistenciaDenegadoError("No autorizado")
        if not self._repositorio.eliminar_sesion(curso_id, fecha):
            raise SesionNoEncontradaError("No existe sesion para esa fecha")
