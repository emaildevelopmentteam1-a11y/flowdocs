---
description: Corregir un bug existente — implementar fix + resolver bug + documentar
---

// turbo-all

# /fix-bug — Corregir un bug

## Paso 1 — Implementar la corrección

Pide a la IA corregir el bug indicando su ID:

```
@implement.md — corregir BUG-001: el total no se actualiza al remover producto
```

> La IA lee el bug, identifica el flujo afectado, implementa la corrección.

## Paso 2 — Marcar bug como resuelto

```
@bugs.md — resolver BUG-001: corregido en FLOW-015, Sprint 2
```

> Actualiza el bug: `status: resolved`, `sprint_fixed`, `fix_flow`.

## Paso 3 — Documentar la corrección

```
@document.md — documentar tests del fix de BUG-001
```

## Paso 4 — Verificar

```bash
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Corregir otro bug** | Repite con otro BUG-XXX |
| **Ver bugs abiertos** | `@bugs.md — listar bugs abiertos` |
| **Implementar un flujo normal** | `/implement-flow` |
| **Auditar documentación** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Bug corregido en código
- Bug marcado como `resolved` con `sprint_fixed` y `fix_flow`
- Tests del fix documentados
- Cross-refs actualizados (bug → flow fix)
