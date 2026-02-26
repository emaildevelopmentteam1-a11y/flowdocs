# FlowDocs — UPDATE
> Actualiza la documentación FlowDocs para reflejar el estado real actual del proyecto.

---

## DETECCIÓN DE MODO

**Antes de modificar**, verifica qué estructura usa el proyecto:

1. **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Edita archivos individuales:
   - Flujos: `.flowdocs/flows/FLOW-XXX.yaml`
   - Stories: `.flowdocs/stories/US-XXX.yaml`
   - Sprints: `.flowdocs/sprints/sprint-N.yaml`
   - Meta: `.flowdocs/project.yaml`
2. **Si NO existe `project.yaml`** → Modo **legacy**. Todo se edita en `.flowdocs/flows.yaml`.

---

## USO

Usa este prompt cuando:
- Terminaste de implementar un flujo y quieres marcarlo como `done`
- Escribiste tests y quieres actualizar `test_status`
- Cambiaste el `sprint_status` de varios flujos
- Las tasks de un sprint cambiaron de estado
- El sprint terminó y quieres abrir uno nuevo

Dime qué cambió. Ejemplos de cómo invocarlo:

```
@update.md — FLOW-003 está implementado y tiene tests en spec/e2e/checkout.spec.ts
@update.md — FLOW-003, FLOW-011 y FLOW-015 pasaron a doing en el sprint
@update.md — Las tasks TASK-007 y TASK-008 están done
@update.md — El sprint 1 terminó, abre sprint 2 con goal "Checkout y pagos"
```

**Migrar de legacy a modular:** Si el proyecto tiene `flows.yaml` pero no `project.yaml`, el usuario puede ejecutar `flowdocs migrate` en la terminal para migrar automáticamente.

Para rellenar criterios de aceptación en todas las stories, el usuario puede ejecutar **@acceptance.md**.

---

## LO QUE DEBES HACER

### Modo legacy (flows.yaml)

1. **Lee `.flowdocs/flows.yaml`** completo antes de modificar nada
2. **Aplica exactamente los cambios descritos** — no toques lo que no se mencionó
3. **Actualiza los stats del meta** — recalcula `total`, `implemented`, `partial`, `pending`, `with_tests`, `coverage_pct`
4. **Actualiza `updated_at`** con la fecha de hoy
5. **Si marcas un flujo como `implemented`**, verifica que tenga sentido con sus tasks/criterios
6. **Si el sprint cambió:** actualiza `sprint.number`, `goal`, `start`, `end`, `days_left`

### Modo modular (project.yaml + carpetas)

1. **Lee los archivos afectados** — solo los que necesitas modificar
2. **Aplica los cambios en el archivo individual correspondiente:**
   - Cambiar status de un flujo → edita `.flowdocs/flows/FLOW-XXX.yaml`
   - Cambiar status de una historia → edita `.flowdocs/stories/US-XXX.yaml`
   - Cambiar sprint_status de flujos → edita `.flowdocs/sprints/sprint-N.yaml` (la propiedad `flows[].sprint_status`)
   - Cambiar status de tasks → edita `.flowdocs/sprints/sprint-N.yaml` (la propiedad `tasks[]`)
   - Abrir nuevo sprint → crea `.flowdocs/sprints/sprint-N.yaml` y actualiza `active_sprint` en `project.yaml`
   - Agregar criterio de aceptación a historia → edita `.flowdocs/stories/US-XXX.yaml`
3. **Actualiza `updated_at`** en `project.yaml`
4. **No necesitas recalcular stats** — el CLI los calcula automáticamente al ensamblar

---

## REGLAS

- **No inventes campos nuevos** que no estaban en el YAML original
- **No cambies el `name` ni los `steps`** de ningún flujo a menos que se te pida explícitamente
- **No cambies `story_points`** sin que se te indique
- **`test_files`** — agrega la ruta real del archivo de test solo si se mencionó explícitamente
- **`acceptance_criteria`** — formatos: (1) string; (2) `{ text, validated_by }`; (3) extendido `{ id, description, validated, flow_ids, evidence }`. En modo modular cada criterio tiene `added_sprint` (sprint donde se añadió). Cobertura por criterio = criterios con `validated: true`.
- **`test_evidence`** (en flujos) — opcional, array de rutas relativas a `.flowdocs/`. Ver @evidence.md.
- **Un flujo es `implemented`** cuando todo su código core funciona. Si hay features menores pendientes, usa `partial`
- **Un flujo tiene `test_status: covered`** cuando tiene tests que cubren el camino principal (happy path)

---

## ENTREGA (obligatorio)

### Modo legacy:
1. **Aplica los cambios** en `.flowdocs/flows.yaml` (edita el archivo en el workspace).
2. **Incluye el YAML completo** en tu respuesta dentro de un bloque `` ```yaml ``.
3. Lista qué cambió: flujos actualizados, stats antes → después.

### Modo modular:
1. **Aplica los cambios** en los archivos individuales afectados.
2. **Incluye el contenido** de cada archivo modificado en tu respuesta.
3. Lista qué archivos modificaste y qué cambió en cada uno.

Si detectas inconsistencias mientras actualizas, señálalo sin cambiarlo a menos que se te pidió.

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden:** Lee los datos → aplica solo los cambios pedidos → actualiza `updated_at` → recalcula stats (solo legacy).
2. **Estructura:** Mantén las secciones del YAML originales. No inventes campos que no existían.
3. **Para el viewer:** El usuario recarga el viewer (`flowdocs open` o botón Recargar) para ver los cambios.
