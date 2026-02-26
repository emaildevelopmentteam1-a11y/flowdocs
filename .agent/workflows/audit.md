---
description: Auditar la documentación FlowDocs vs el código real del proyecto
---

// turbo-all

# /audit — Auditar documentación

## Paso 1 — Ejecutar auditoría

```
@audit.md
```

Opciones de enfoque:
```
@audit.md --module=pos           — solo el módulo POS
@audit.md --focus=tests          — solo cobertura de tests
@audit.md --focus=critical       — solo flujos críticos
```

> La IA compara YAML vs código y genera un reporte con severidades (🔴 Crítico, 🟡 Importante, 🟢 Menor).

## Paso 2 — Corregir hallazgos

Según los hallazgos, usa el prompt apropiado:

```
@update.md — corregir los stats y estados reportados en la auditoría
```

## Paso 3 — Verificar correcciones

```bash
flowdocs status
flowdocs open
```

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Corregir stats incorrectos** | `@update.md — recalcular stats` |
| **Documentar flujos faltantes** | `/expand-module` |
| **Agregar tests faltantes** | `@run-tests.md` |
| **Agregar funcionalidad sin documentar** | `/add-backlog` |

## Resumen esperado

Al completar este workflow tendrás:
- Reporte de inconsistencias YAML vs código
- Stats reales vs documentados
- Lista de flujos críticos sin tests
- Funcionalidad sin documentar identificada
