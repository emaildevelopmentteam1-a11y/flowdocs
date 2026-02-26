---
description: Implementar un flujo específico — código + actualización de estado + evidencia
---

// turbo-all

# /implement-flow — Implementar un flujo

## Paso 1 — Elegir el flujo

Dile a la IA qué flujo implementar. Si no sabes cuáles hay:

```bash
flowdocs status
```

Luego pide la implementación:

```
@implement.md — implementa el flujo FLOW-XXX
```

Ejemplos:
```
@implement.md — implementa FLOW-003 (crear venta) siguiendo los pasos del YAML
@implement.md — implementa todos los flujos pendientes de US-001
@implement.md — retoma FLOW-005, está parcial
```

> La IA lee el YAML, implementa el código y actualiza el estado del flujo a `implemented`.

## Paso 2 — Documentar tests y evidencia

Una vez implementado, documenta los tests:

```
@document.md — para la historia US-XXX (flujos implementados)
```

> Crea/ejecuta tests, captura evidencia, actualiza test_status y coverage.

## Paso 3 — Verificar en el viewer

```bash
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Implementar otro flujo** | Repite Paso 1 con otro FLOW-XXX |
| **Reportar un bug encontrado** | `/report-bug` |
| **Actualizar estado de un flujo** | `/update-status` |
| **Agregar criterios de aceptación** | `/add-acceptance` |
| **Ver estado general** | `flowdocs status` |

## Resumen esperado

Al completar este workflow tendrás:
- Flujo implementado en código
- Estado actualizado en FlowDocs (implemented + sprint_status: done)
- Tests documentados con evidencia
- Cobertura recalculada
