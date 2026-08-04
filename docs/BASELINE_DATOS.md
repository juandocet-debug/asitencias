# Baseline de datos de AGON

## Objetivo

Este inventario identifica los agregados que deben conservar datos, IDs y
relaciones durante la adopcion de arquitectura limpia. Los conteos reales se
obtendran de cada base autorizada antes de cualquier cambio de infraestructura.

## Aplicaciones y modelos existentes

| Aplicacion | Modelos persistentes | Responsabilidad |
|---|---|---|
| `users` | `Faculty`, `Program`, `User`, `CoordinatorProfile`, `PasswordResetToken` | Identidad, roles y estructura academica |
| `academic` | `Course`, `Session`, `Attendance` | Cursos, sesiones, llamado de asistencia y excusas |
| `practicas` | `SitioPractica`, `ObjetivoPractica`, `Practica`, `SeguimientoPractica`, `AsistenciaPractica`, `ReflexionEstudiante`, `TareaPractica`, `EntregaTarea`, `EvidenciaEntrega` | Practicas, diario de campo, tareas y evidencias |
| `gamification` | `Badge`, `UserBadge` | Insignias y reconocimientos |

## Relaciones e integraciones criticas

- `User` es el modelo de autenticacion y la fuente de identidad de ILINYX.
- Cursos relacionan docentes y estudiantes; sesiones y asistencias dependen de
  esos cursos y usuarios.
- Practicas, seguimientos, reflexiones, tareas y evidencias forman un historial
  academico que debe conservar orden y autoria.
- Fotografias, excusas y evidencias pueden estar almacenadas en Cloudinary.
- Los endpoints de integracion con ILINYX usan `ILINYX_API_KEY`.

## Historial de migraciones protegido

- `users`: `0001` a `0007`.
- `academic`: `0001` a `0008`.
- `practicas`: `0001` a `0005`.
- `gamification`: `0001` a `0002`.

No se editaran, eliminaran ni reordenaran estas migraciones. Los modelos Django
actuales permanecen como adaptadores de persistencia durante la transicion.

## Funcionalidades de asistencia que deben caracterizarse

- Creacion y administracion de cursos.
- Vinculacion de docentes y estudiantes.
- Programacion y registro de sesiones.
- Llamado y modificacion de asistencia.
- Estados de presencia, tardanza, ausencia y excusa.
- Archivos y notas de excusas.
- Reportes por clase, sesion y estudiante.
- Resumen de ausencias del estudiante.
- Exportacion PDF e historial de fechas.

Ninguna reestructuracion se acepta si cambia silenciosamente alguno de estos
comportamientos.

## Evidencia requerida antes del corte

- motor, version y nombre logico de la base;
- ultima migracion aplicada por aplicacion;
- conteo de filas por tabla y relaciones muchos-a-muchos;
- conteo y accesibilidad de archivos historicos;
- restricciones, indices y posibles registros huerfanos;
- fecha, ubicacion y checksum del respaldo;
- restauracion completa ensayada en staging;
- pruebas de contratos HTTP actuales.

## Criterios de aceptacion

1. Los conteos esperados coinciden antes y despues.
2. Los IDs, usuarios, cursos y relaciones historicas se conservan.
3. Todas las variantes del llamado de asistencia siguen funcionando.
4. Los reportes reproducen los resultados del sistema anterior.
5. Los archivos historicos siguen disponibles.
6. ILINYX puede autenticar y consultar usuarios/cursos.
7. El despliegue tiene una reversion ensayada.
