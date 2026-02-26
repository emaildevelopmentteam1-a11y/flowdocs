---
description: Agregar historias y flujos al backlog desde requisitos en lenguaje natural
---

// turbo-all

# /add-backlog — Agregar al backlog

## Paso 1 — Describir requisitos

Describe lo que necesitas en lenguaje natural:

```
@backlog.md

Quiero que el cajero pueda anular una venta ya cobrada y que el stock se revierta.
También necesito un reporte diario de ventas por método de pago.
```

Ejemplos:
```
@backlog.md — Solo módulo inventario
- Alertas de stock mínimo
- Ajuste masivo de precios por categoría

@backlog.md
Complementar US-001: que el cajero pueda aplicar descuento antes de cobrar.
```

> La IA decide si crear historia nueva, flujo nuevo, o complementar algo existente.

## Paso 2 — Revisar en el viewer

```bash
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Implementar un flujo nuevo** | `/implement-flow` |
| **Planificar un sprint con las nuevas historias** | `/plan-sprint` |
| **Agregar criterios de aceptación** | `/add-acceptance` |
| **Expandir un módulo con más detalle** | `/expand-module` |

## Resumen esperado

Al completar este workflow tendrás:
- Nuevas historias (US-XXX) con mínimo 8 criterios de aceptación
- Nuevos flujos (FLOW-XXX) con pasos de negocio
- Stats recalculados
- Todo visible en el viewer
