---
description: Agregar o completar criterios de aceptación en historias existentes
---

// turbo-all

# /add-acceptance — Agregar criterios de aceptación

## Paso 1 — Indicar la historia y criterios

```
@acceptance.md — agregar criterios a US-001 para el nuevo flujo de descuentos
```

Ejemplos:
```
@acceptance.md — completar criterios de US-003
@acceptance.md — US-001: agregar criterio de validación de stock negativo
@acceptance.md — marcar AC-003 de US-001 como validado
```

> La IA lee la historia, añade criterios con `added_sprint`, y marca los validados.

## Paso 2 — Verificar

```bash
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Implementar los flujos de la historia** | `/implement-flow` |
| **Documentar tests de los criterios** | `@document.md — para US-XXX` |
| **Agregar más historias** | `/add-backlog` |

## Resumen esperado

Al completar este workflow tendrás:
- Criterios de aceptación actualizados con `added_sprint`
- Nuevos criterios vinculados a flujos
- Progreso visible en el viewer (barra AC)
