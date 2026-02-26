---
description: Actualizar estado, stats o campos de flujos/stories existentes
---

// turbo-all

# /update-status — Actualizar estado

## Paso 1 — Indicar qué actualizar

```
@update.md — marcar FLOW-003 como implemented
```

Ejemplos:
```
@update.md — marcar FLOW-003, FLOW-004 como implemented y sprint_status: done
@update.md — actualizar test_status de FLOW-005 a covered
@update.md — cambiar prioridad de FLOW-008 a critical
@update.md — recalcular meta.stats
```

> La IA edita el YAML (modular o legacy) y recalcula stats.

## Paso 2 — Verificar

```bash
flowdocs status
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Ver el viewer** | `flowdocs open` |
| **Implementar otro flujo** | `/implement-flow` |
| **Agregar criterios** | `/add-acceptance` |
| **Auditar** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Estados de flujos/stories actualizados
- Stats recalculados
- Cambios reflejados en el viewer
