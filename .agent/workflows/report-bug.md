---
description: Reportar bugs desde lista o texto — explotar, vincular y documentar
---

// turbo-all

# /report-bug — Reportar bugs

## Paso 1 — Pasar la lista de bugs

Pasa tu lista de bugs al agente. Puede ser un archivo MD o texto directo:

```
@bugs.md — explotar lista de bugs:

1. Al cerrar caja, el reporte no incluye las ventas anuladas. Solo muestra ventas completadas. El cajero no puede cuadrar contra los tickets impresos porque falta el registro de anulaciones.
2. Login falla con contraseñas que tienen caracteres especiales como ñ, á, ü. El sistema devuelve "credenciales inválidas" aunque la contraseña sea correcta.
3. El total del carrito no se actualiza al eliminar productos cuando hay más de 5 items. Hay que recargar la página para que se recalcule.
```

Alternativa con archivo:
```
@bugs.md — explotar lista de bugs desde docs/mis-bugs.md
```

> **IMPORTANTE:** La IA no acortará tus descripciones. Se transcriben tal cual al YAML.

## Paso 2 — La IA procesa automáticamente

La IA:
1. Lee los bugs existentes en `.flowdocs/bugs/` para obtener la numeración actual
2. Compara cada bug de tu lista con los existentes:
   - **Relacionado** → Reabre el bug anterior (incrementa `reopen_count`, agrega evento en `history`)
   - **Nuevo** → Crea `BUG-XXX.yaml` con schema completo y timestamp de creación
3. Crea los YAML en `.flowdocs/bugs/` con todos los campos, incluyendo:
   - `created_at` con fecha y hora exacta
   - `history` con evento `created`
   - Cross-refs a story, flow y módulo
   - Descripción completa sin acortar

## Paso 3 — Revisar el resumen

La IA presenta una tabla resumen:

| Bug | Acción | Título | Severidad | Módulo |
|-----|--------|--------|-----------|--------|
| BUG-006 | 🆕 Creado | Login falla con caracteres especiales | high | auth |
| BUG-003 | 🔄 Reabierto | Total no se actualiza en carrito | critical | pos |

## Paso 4 — Verificar en el viewer

```bash
flowdocs open
```

> Los bugs aparecen en la pestaña Bugs con su historial, timestamps y badges de reapertura.

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Corregir un bug** | `/fix-bug` |
| **Reportar más bugs** | Repite Paso 1 |
| **Ver todos los bugs** | `@bugs.md — listar bugs abiertos` |
| **Auditar documentación** | `/audit` |

## Resumen esperado

Al completar este workflow tendrás:
- Bugs documentados con BUG-XXX en `.flowdocs/bugs/`
- Cada YAML con schema completo: description, timestamps, history, cross-refs
- Bugs existentes reabiertos si aplica (con `reopen_count` y nuevas características en history)
- Cross-refs a HU, flujo y módulo
- Visible en viewer: tab Bugs con timeline de historial
