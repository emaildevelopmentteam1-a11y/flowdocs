---
description: Corregir un bug existente — implementar fix + resolver/reabrir + documentar con historial
---

// turbo-all

# /fix-bug — Corregir un bug

## Precondiciones

Antes de iniciar, verifica:

1. **El bug existe** — Debe haber un `BUG-XXX.yaml` en `.flowdocs/bugs/`
2. **El bug está abierto** — `status` debe ser `open`, `reopened` o `in_progress`
3. **Tienes acceso al código** — El proyecto donde vive el bug debe estar disponible
4. **Leíste el schema** — Lee `prompts/bugs.md` para conocer la estructura YAML

> Si el bug no tiene YAML, primero usa `/report-bug` para registrarlo.

---

## Paso 1 — Leer y analizar el bug

1. Leer el YAML completo en `.flowdocs/bugs/BUG-XXX.yaml`
2. Estudiar todos los campos:
   - `description` — qué pasa exactamente
   - `steps_to_reproduce` — cómo replicar el error
   - `expected` — qué debería pasar
   - `actual` — qué pasa en vez
   - `environment` — dónde ocurre
3. Identificar las referencias cruzadas: `story`, `flow`, `module`, `related_flows`
4. Localizar el código afectado en el proyecto según las refs
5. Si tiene `history` con reaperturas, leer `new_characteristics` para entender qué cambió

## Paso 2 — Definir criterios de aceptación del fix

Antes de escribir código, definir explícitamente qué debe cumplirse para que el bug se considere resuelto:

1. **Reproducción** — El bug debe ser reproducible antes del fix (verificar con navegador)
2. **Corrección** — Después del fix, los `steps_to_reproduce` ya no generan el error
3. **Resultado esperado** — El campo `expected` del YAML se cumple
4. **Sin regresiones** — No se rompen flujos relacionados (`related_flows`)
5. **Evidencia visual** — Screenshot o grabación del antes y después

> Estos criterios son **obligatorios**. No se puede marcar un bug como resuelto sin verificación.

## Paso 3 — Reproducir el bug (ANTES del fix)

Usar el **navegador** para confirmar que el bug existe:

1. Abrir la aplicación en el navegador
2. Seguir los `steps_to_reproduce` del YAML paso a paso
3. **Capturar screenshot del error** → guardar en `.flowdocs/evidence/BUG-XXX-before.png`
4. Confirmar que el `actual` del YAML coincide con lo que se ve

> Si el bug NO se puede reproducir, agregar una nota en `history` y marcar como `closed` con `detail: "No reproducible"`.

## Paso 4 — Implementar la corrección

1. Corregir el código según el análisis del Paso 1
2. Agregar/actualizar tests unitarios o e2e si aplica
3. Verificar que los tests existentes no fallen
4. Si el fix afecta un flujo documentado, actualizar su YAML también

## Paso 5 — Verificar el fix con navegador (DESPUÉS del fix)

**OBLIGATORIO** — La IA debe usar el navegador para verificar:

1. Abrir la aplicación en el navegador
2. Repetir los mismos `steps_to_reproduce` del YAML
3. Verificar que ahora se cumple el `expected`
4. **Capturar screenshot del fix** → guardar en `.flowdocs/evidence/BUG-XXX-after.png`
5. Verificar flujos relacionados para descartar regresiones
6. Si hay regresiones → NO marcar como resuelto, reportar el problema

## Paso 6 — Actualizar el YAML del bug

### 6a — Marcar como resuelto

```yaml
# Campos a ACTUALIZAR:
status: "resolved"
resolved_at: "2026-02-27T13:45:00-06:00"  # timestamp ISO 8601 actual con hora y zona
sprint_fixed: 3                             # número de sprint actual
fix_flow: "FLOW-XXX"                        # ID del flow donde se implementó el fix

# Campos a AGREGAR al array history (al final, sin borrar eventos anteriores):
history:
  - date: "2026-02-27T13:45:00-06:00"
    action: "resolved"
    detail: "Descripción de qué se hizo para resolver. Incluir archivos modificados y lógica del fix."

# Agregar evidencia al array attachments:
attachments:
  - ".flowdocs/evidence/BUG-XXX-before.png"
  - ".flowdocs/evidence/BUG-XXX-after.png"
```

> **IMPORTANTE:**
> - El timestamp DEBE incluir fecha Y hora en formato ISO 8601 con zona horaria
> - Los eventos anteriores del `history` NO se borran, solo se agrega al final
> - El `detail` debe describir QUÉ se hizo, no solo "resuelto"
> - Los `attachments` deben incluir la evidencia visual

### 6b — Si el bug REAPARECE (reabrir)

```yaml
# Campos a ACTUALIZAR:
status: "reopened"
resolved_at: null        # se limpia
closed_at: null          # se limpia si existía
reopen_count: 2          # incrementar en 1 el valor actual

# Campos a AGREGAR al array history:
history:
  - date: "2026-02-27T14:00:00-06:00"
    action: "reopened"
    detail: "El bug reapareció en [contexto]"
    new_characteristics: "Descripción de las nuevas condiciones o síntomas que presenta el bug"
```

> **IMPORTANTE:**
> - `reopen_count` se INCREMENTA, no se reemplaza
> - `new_characteristics` es OBLIGATORIO — describe qué es diferente esta vez
> - `resolved_at` y `closed_at` se ponen en `null`

### 6c — Cerrar definitivamente

Solo cuando el fix se confirma en producción:

```yaml
status: "closed"
closed_at: "2026-02-27T15:00:00-06:00"

history:
  - date: "2026-02-27T15:00:00-06:00"
    action: "closed"
    detail: "Fix confirmado en producción"
```

## Paso 7 — Verificar en el viewer

```bash
flowdocs open
```

> En el panel del bug se ve:
> - Timeline completa: creación → resolución → (reapertura si hubo) → cierre
> - Evidencia en attachments
> - Timestamps con fecha y hora

---

## Checklist final (criterios de aceptación)

- [ ] Bug reproducido antes del fix (screenshot guardado)
- [ ] Código corregido
- [ ] Fix verificado con navegador (screenshot guardado)
- [ ] Sin regresiones en flujos relacionados
- [ ] YAML actualizado con `status`, timestamps e `history`
- [ ] Evidencia guardada en `.flowdocs/evidence/`
- [ ] Evidencia referenciada en `attachments` del YAML

---

## Referencia rápida de campos por acción

| Acción | `status` | `resolved_at` | `closed_at` | `reopen_count` | Evento en `history` |
|--------|----------|---------------|-------------|----------------|---------------------|
| **Resolver** | `resolved` | timestamp actual | — | — | `action: resolved` + `detail` |
| **Reabrir** | `reopened` | `null` | `null` | +1 | `action: reopened` + `detail` + `new_characteristics` |
| **Cerrar** | `closed` | se conserva | timestamp actual | — | `action: closed` + `detail` |

---

## Siguiente paso

| Quiero... | Comando |
|-----------|---------|
| **Corregir otro bug** | Repite con otro BUG-XXX |
| **Ver bugs abiertos** | `@bugs.md — listar bugs abiertos` |
| **Reportar nuevos bugs** | `/report-bug` |
| **Implementar un flujo normal** | `/implement-flow` |
| **Auditar documentación** | `/audit` |
