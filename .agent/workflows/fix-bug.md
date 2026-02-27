---
description: Corregir un bug existente — implementar fix + resolver/reabrir + documentar con historial
---

// turbo-all

# /fix-bug — Corregir un bug

## Prerequisito — Leer el schema de bugs

Antes de cualquier operación, lee el schema completo en `prompts/bugs.md`. El YAML de cada bug vive en `.flowdocs/bugs/BUG-XXX.yaml`.

## Paso 1 — Leer el bug y entender el problema

1. Leer el YAML completo del bug en `.flowdocs/bugs/BUG-XXX.yaml`
2. Identificar: `description`, `steps_to_reproduce`, `expected`, `actual`
3. Identificar referencias cruzadas: `story`, `flow`, `module`, `related_flows`
4. Localizar el código afectado según las refs

## Paso 2 — Implementar la corrección en código

1. Corregir el código según la descripción del bug
2. Agregar/actualizar tests si aplica
3. Verificar que el fix no rompe flujos relacionados

## Paso 3 — Actualizar el YAML del bug como "resolved"

Abrir `.flowdocs/bugs/BUG-XXX.yaml` y actualizar los siguientes campos:

```yaml
# Campos a ACTUALIZAR:
status: "resolved"
resolved_at: "2026-02-27T13:45:00-06:00"  # timestamp ISO 8601 actual con hora y zona
sprint_fixed: 3                             # número de sprint actual
fix_flow: "FLOW-XXX"                        # ID del flow donde se implementó el fix

# Campos a AGREGAR al array history:
history:
  # ... eventos anteriores se conservan ...
  - date: "2026-02-27T13:45:00-06:00"    # timestamp ISO 8601 actual
    action: "resolved"
    detail: "Descripción de qué se hizo para resolver el bug"
```

> **IMPORTANTE:** 
> - El timestamp DEBE incluir fecha Y hora en formato ISO 8601 con zona horaria
> - Los eventos anteriores del `history` NO se borran, solo se agrega al final
> - El `detail` del evento debe describir qué se hizo, no solo "resuelto"

## Paso 3b — Si el bug REAPARECE (reabrir)

Abrir `.flowdocs/bugs/BUG-XXX.yaml` y actualizar:

```yaml
# Campos a ACTUALIZAR:
status: "reopened"
resolved_at: null        # se limpia
closed_at: null          # se limpia si existía
reopen_count: 2          # incrementar en 1 el valor actual

# Campos a AGREGAR al array history:
history:
  # ... eventos anteriores se conservan ...
  - date: "2026-02-27T14:00:00-06:00"
    action: "reopened"
    detail: "El bug reapareció en [contexto]"
    new_characteristics: "Descripción de las nuevas condiciones o síntomas que presenta el bug"
```

> **IMPORTANTE:**
> - `reopen_count` se INCREMENTA, no se reemplaza. Si era 1, ahora es 2
> - `new_characteristics` es OBLIGATORIO en reaperturas — describe qué es diferente esta vez
> - `resolved_at` y `closed_at` se ponen en `null`

## Paso 4 — Cerrar definitivamente

Solo cuando el fix se confirma en producción:

```yaml
# Campos a ACTUALIZAR:
status: "closed"
closed_at: "2026-02-27T15:00:00-06:00"   # timestamp ISO 8601 actual

# Campos a AGREGAR al array history:
history:
  # ... eventos anteriores se conservan ...
  - date: "2026-02-27T15:00:00-06:00"
    action: "closed"
    detail: "Fix confirmado en producción"
```

## Paso 5 — Verificar

```bash
flowdocs open
```

> En el panel del bug se ve la timeline completa: creación → resolución → (reapertura si hubo) → cierre.

---

## Referencia rápida de campos por acción

| Acción | `status` | `resolved_at` | `closed_at` | `reopen_count` | Evento en `history` |
|--------|----------|---------------|-------------|----------------|---------------------|
| **Resolver** | `resolved` | timestamp actual | — | — | `action: resolved` + `detail` |
| **Reabrir** | `reopened` | `null` | `null` | +1 | `action: reopened` + `detail` + `new_characteristics` |
| **Cerrar** | `closed` | se conserva | timestamp actual | — | `action: closed` + `detail` |
| **En progreso** | `in_progress` | — | — | — | `action: in_progress` + `detail` |

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Corregir otro bug** | Repite con otro BUG-XXX |
| **Ver bugs abiertos** | `@bugs.md — listar bugs abiertos` |
| **Reportar nuevos bugs** | `/report-bug` |
| **Implementar un flujo normal** | `/implement-flow` |
| **Auditar documentación** | `/audit` |
