---
description: Expandir un módulo incompleto con flujos faltantes
---

// turbo-all

# /expand-module — Expandir módulo

## Paso 1 — Expandir el módulo

Indica qué módulo profundizar:

```
@expand.md --module=pos
```

Opciones:
```
@expand.md --module=cash --read=app/services/cash_register_service.rb
@expand.md --story=US-004
```

> La IA lee el código del módulo, compara con lo documentado, y genera los flujos faltantes.

## Paso 2 — Verificar

```bash
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Implementar los flujos nuevos** | `/implement-flow` |
| **Agregar criterios de aceptación** | `/add-acceptance` |
| **Expandir otro módulo** | Repite con otro `--module=XXX` |
| **Auditar todo** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Flujos faltantes del módulo documentados
- IDs en secuencia correcta
- Stats recalculados
- flow_ids de stories actualizados
