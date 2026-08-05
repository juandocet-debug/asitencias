from __future__ import annotations

from datetime import date

from modulos.asistencia.dominio import (
    AccesoAsistenciaDenegadoError,
    ActorAsistencia,
    AsistenciaRepositoryPort,
    CursoNoEncontradoError,
)


class ConsultarAsistenciaSesionUseCase:
    def __init__(self, repositorio: AsistenciaRepositoryPort):
        self._repositorio = repositorio

    def ejecutar(
        self,
        actor: ActorAsistencia,
        curso_id: int,
        fecha: date,
    ) -> dict[str, str]:
        docente_id = self._repositorio.obtener_docente_id(curso_id)
        if docente_id is None:
            raise CursoNoEncontradoError("Curso no encontrado")
        puede_consultar = actor.puede_administrar(docente_id) or (
            "STUDENT" in actor.roles
            and self._repositorio.usuario_matriculado(curso_id, actor.usuario_id)
        )
        if not puede_consultar:
            raise AccesoAsistenciaDenegadoError("No autorizado")
        estados = self._repositorio.obtener_asistencia_sesion(curso_id, fecha)
        return {str(estudiante_id): estado for estudiante_id, estado in estados.items()}
