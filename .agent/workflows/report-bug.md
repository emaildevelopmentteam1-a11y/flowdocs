---
description: Reportar un bug vinculándolo a historias, flujos y módulos
---

// turbo-all

# /report-bug — Reportar un bug

## Paso 1 — Describir el bug

Describe el bug y la IA lo vincula automáticamente a la HU, flujo y módulo:

```
@bugs.md — reportar: El total no se actualiza al remover un producto del carrito
```

Ejemplos:
```
@bugs.md — reportar: Al cerrar caja, el reporte no incluye ventas anuladas. Módulo: caja. Severidad: high.
@bugs.md — reportar: Login falla con contraseñas que tienen caracteres especiales
@bugs.md — listar bugs abiertos del módulo POS
```

> La IA crea `BUG-XXX` con cross-refs a story/flow/module, severity, steps to reproduce.

## Paso 2 — Verificar en el viewer

```bash
flowdocs open
```

> El bug aparece en la pestaña Bugs y en los paneles de la HU y flujo afectados.

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Corregir el bug (implementar fix)** | `/fix-bug` |
| **Reportar otro bug** | Repite Paso 1 |
| **Ver todos los bugs** | `@bugs.md — listar bugs abiertos` |
| **Auditar documentación** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Bug documentado con BUG-XXX
- Cross-refs a HU, flujo y módulo
- Steps to reproduce, expected/actual
- Visible en viewer: tab Bugs + paneles de HU/flujo
