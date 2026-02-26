---
description: Planificar un nuevo sprint con historias y tareas
---

// turbo-all

# /plan-sprint — Planificar sprint

## Paso 1 — Planificar el sprint

```bash
flowdocs plan-sprint
```

O con la IA:

```
Planifica el Sprint 2 con las siguientes historias: US-002, US-003.
Incluye las tareas pendientes de US-001.
Duración: 2 semanas desde hoy.
```

## Paso 2 — Crear el archivo de sprint (modo modular)

Si estás en modo modular, la IA debe crear `.flowdocs/sprints/sprint-N.yaml` con:
- `number`, `goal`, `start`, `end`
- `stories: [US-XXX, ...]`
- `flows: [{id: FLOW-XXX, sprint_status: todo}, ...]`  
- `tasks: [{id: TASK-XXX, title, status, story, flow, module}, ...]`

## Paso 3 — Verificar

```bash
flowdocs status
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Implementar el primer flujo del sprint** | `/implement-flow` |
| **Agregar más historias** | `/add-backlog` |
| **Agregar tareas a una historia** | `/add-acceptance` |
| **Ver estado** | `flowdocs status` |

## Resumen esperado

Al completar este workflow tendrás:
- Sprint N definido con goal, fechas, historias y flujos
- Tareas asignadas por historia y flujo
- Filtro de sprint funcionando en el viewer
