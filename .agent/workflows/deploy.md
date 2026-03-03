---
description: Guardar cambios locales y/o deployar a producción en Render
---

# Workflow: Commit y Deploy

## Solo guardar cambios localmente (SIN subir a producción)

Usa esto después de terminar una feature o arreglo. No afecta Render.

```powershell
cd C:\Users\JUAN DAVID\Desktop\Upn\CIAR\asistencia
git add -A
git commit -m "mensaje descriptivo del cambio"
```

## Subir a producción (commit + push)

Solo cuando hayas probado que todo funciona en local.

```powershell
cd C:\Users\JUAN DAVID\Desktop\Upn\CIAR\asistencia
git add -A
git commit -m "mensaje descriptivo del cambio"
git push origin main
```

## Ver qué cambios hay pendientes de commit

```powershell
git status
```

## Ver historial de commits recientes

```powershell
git log --oneline -10
```

## Reglas
- Siempre probar en local antes de hacer push
- Un commit por feature/arreglo (no mezclar cosas)
- El mensaje del commit debe describir QUÉ cambia, no CÓMO
