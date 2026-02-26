---
description: Documentar un proyecto nuevo desde cero — clasificación, discovery, backlog inicial
---

// turbo-all

# /new-project — Documentar proyecto nuevo

## Paso 1 — Clasificar el proyecto

Ejecuta el prompt de adaptación para clasificar el proyecto automáticamente.

```
@adapt.md
```

> Esto genera `.flowdocs/discovery-hints.md` con las pistas para el siguiente paso.

## Paso 2 — Descubrir y documentar flujos

Usa las pistas generadas para documentar todos los flujos del proyecto.

```
@discover.md
```

> Genera `flows.yaml` (o la estructura modular si ya existe `project.yaml`).

## Paso 3 — Migrar a estructura modular (opcional)

Si quieres escalar a múltiples sprints:

```bash
flowdocs migrate
```

## Paso 4 — Revisar en el viewer

```bash
flowdocs open
```

---

## Siguiente paso

Elige una opción:

| Quiero... | Comando |
|-----------|---------|
| **Expandir un módulo incompleto** | `/expand-module` |
| **Agregar historias al backlog** | `/add-backlog` |
| **Planificar un sprint** | `/plan-sprint` |
| **Implementar un flujo** | `/implement-flow` |
| **Auditar la documentación** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Proyecto clasificado (tipo, dominio, roles)
- Todos los módulos, entidades, historias y flujos documentados
- Viewer funcional con el tablero de estado
