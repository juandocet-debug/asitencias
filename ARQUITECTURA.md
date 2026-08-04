# Arquitectura objetivo del ecosistema AGON + ILINYX

## Proposito

AGON y ILINYX evolucionaran como un ecosistema integrado sin perder registros,
identificadores, migraciones ni contratos utilizados en produccion. AGON es la
fuente de identidad, roles, cursos, sesiones, asistencia, practicas y
gamificacion. ILINYX gestiona actas, firmas, grupos, rubricas, calificaciones y
entornos de seguimiento.

Durante la transicion cada sistema conserva su base de datos. Ninguna tabla
existente se renombra y ninguna migracion aplicada se edita o elimina.

## Backend modular

Cada contexto funcional se migrara progresivamente a una unidad vertical:

```text
backend/modulos/<modulo>/
|-- dominio/          # Entidades, reglas y puertos
|-- aplicacion/       # Casos de uso y DTO
`-- infraestructura/  # Django ORM, DRF, repositorios y servicios externos
```

Reglas de dependencia:

1. El dominio no importa Django, DRF, HTTP ni almacenamiento.
2. Aplicacion depende solo del dominio y sus puertos.
3. Infraestructura implementa los puertos y conecta frameworks.
4. Controladores y serializers no contienen reglas de negocio.
5. Ningun archivo fuente puede superar 500 lineas.
6. Toda operacion mutable genera auditoria sin registrar secretos.

La estructura Django actual permanece operativa mientras cada modulo obtiene
pruebas de caracterizacion y es reemplazado. Se mantiene una capa de
compatibilidad para los endpoints existentes.

## Cliente mobile-first

La interfaz objetivo usa TypeScript, React Native y Expo. Expo Web sera la
salida desplegada en Vercel y la misma base permitira empaquetado movil.

```text
frontend/src/modules/<modulo>/
|-- domain/
|-- application/
|-- infrastructure/
`-- presentation/
```

Presentacion no importa Axios ni crea repositorios. En aplicaciones nativas los
tokens persistentes usan SecureStore; en web se prefieren cookies seguras
administradas por el servidor para credenciales renovables.

La experiencia se disena desde 360 px, con objetivos tactiles de al menos 44
px, navegacion inferior en celular, formularios por pasos y tarjetas en lugar
de tablas extensas. La salida web debe ser instalable como PWA.

## Compatibilidad de datos

Antes de cambiar un modelo se exige:

1. Inventario de tablas, columnas, restricciones e indices.
2. Conteos y relaciones criticas.
3. Respaldo verificable y restauracion ensayada.
4. Migracion Django aditiva y reversible cuando sea posible.
5. Pruebas de contratos HTTP y reglas actuales.
6. Comparacion de datos antes y despues del despliegue.

Los cambios destructivos requieren aprobacion expresa y ventana de
mantenimiento. No se ejecuta SQL manual sobre produccion.

## Integracion

AGON permanece inicialmente como autoridad de identidad. ILINYX valida la
sesion y consulta usuarios/cursos mediante contratos versionados y credenciales
de servicio rotatorias. Los endpoints actuales se conservan como compatibilidad
hasta comprobar que no tienen consumidores.

La evolucion sera:

1. Caracterizar los contratos actuales.
2. Publicar contratos documentados bajo `/api/v1/`.
3. Crear sesion y portal unificados.
4. Retirar contratos antiguos solo con metricas y plan de reversion.

## Seguridad

- Secretos unicamente en variables de entorno.
- CORS explicito en produccion.
- Rate limiting en autenticacion y operaciones sensibles.
- Autorizacion por rol, pertenencia y objeto.
- Listados paginados y serializers de campos explicitos.
- Validacion real de tipo, extension y tamano de archivos.
- Auditoria de `POST`, `PUT`, `PATCH` y `DELETE`.
- Analisis de dependencias, pruebas y controles arquitectonicos en CI.

## Infraestructura objetivo

- Django/DRF en Railway.
- PostgreSQL administrado, conservando inicialmente la base existente.
- Expo Web en Vercel.
- Cloudinary se conserva mientras existan archivos historicos.
- R2/S3 solo se introduce despues mediante un adaptador y migracion aprobada.

Primero se construye staging. Produccion cambia solo despues de pruebas,
comparacion de datos, smoke tests y plan de reversion.

## Orden de migracion

1. Baseline, inventario y pruebas de caracterizacion.
2. Seguridad y auditoria.
3. Migracion vertical de usuarios y autenticacion.
4. Migracion vertical de cursos, sesiones y asistencia.
5. Migracion vertical de practicas y gamificacion.
6. Shell Expo y sistema de diseno compartido.
7. Integracion con ILINYX.
8. Staging Railway/Vercel y corte controlado.

Cada etapa debe desplegarse y revertirse independientemente.
