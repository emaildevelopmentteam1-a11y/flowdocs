---
description: Ciclo completo de un sprint — planificar → implementar → documentar → revisar
---

// turbo-all

# /sprint-cycle — Ciclo completo de sprint

> Este workflow guía el ciclo completo de un sprint: planificación, implementación de cada flujo, documentación de tests, y cierre.

## Fase 1 — Planificar

```
Planifica el Sprint N con las historias US-XXX, US-YYY.
Duración: 2 semanas desde hoy.
Goal: [descripción del objetivo del sprint]
```

## Fase 2 — Implementar (repetir por cada flujo)

Para cada flujo del sprint:

```
@implement.md — implementa FLOW-XXX
```

> Repite para cada flujo pendiente. La IA actualiza `sprint_status: done` automáticamente.

## Fase 3 — Documentar tests

Para cada historia implementada:

```
@document.md — para la historia US-XXX
```

## Fase 4 — Auditar el sprint

```
@audit.md --focus=critical
```

## Fase 5 — Cerrar sprint

```
@update.md — cerrar Sprint N: marcar como completed, crear resumen
```

## Fase 6 — Revisar

```bash
flowdocs status
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Empezar nuevo sprint** | `/plan-sprint` |
| **Reportar bugs del sprint** | `/report-bug` |
| **Agregar nuevas historias** | `/add-backlog` |
| **Auditar todo el proyecto** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Sprint completo: todos los flujos implementados
- Tests documentados con evidencia
- Stats finales del sprint
- Listo para planificar el siguiente sprint
