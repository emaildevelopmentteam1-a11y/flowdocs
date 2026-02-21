# FlowDocs — UPDATE
> Actualiza `.flowdocs/flows.yaml` para reflejar el estado real actual del proyecto.

---

## USO

Usa este prompt cuando:
- Terminaste de implementar un flujo y quieres marcarlo como `done`
- Escribiste tests y quieres actualizar `test_status`
- Cambiaste el `sprint_status` de varios flujos
- Las tasks de un flujo cambiaron de estado

Dime qué cambió. Ejemplos de cómo invocarlo:

```
@update.md — FLOW-003 está implementado y tiene tests en spec/e2e/checkout.spec.ts
@update.md — FLOW-003, FLOW-011 y FLOW-015 pasaron a doing en el sprint
@update.md — Las tasks TASK-007 y TASK-008 de FLOW-003 están done
@update.md — El sprint 3 terminó, actualiza todos los done y abre sprint 4
@update.md — Usamos varios sprints: añade sprint 3 a meta.sprints y pon active_sprint: 3
```

**Migrar a la nueva estructura (criterios de aceptación):** Si el proyecto ya tiene `flows.yaml` pero las stories no tienen `acceptance_criteria`, el usuario puede pedirte que los añadas. Ejemplo de invocación:

```
@update.md — Añade acceptance_criteria a todas las stories: mínimo 8 por historia (string o { text, validated_by } donde el flujo tenga ese spec en test_files). Opcional: formato extendido { id, description, validated, flow_ids }.
```

Para un rellenado guiado de todas las stories de una vez, el usuario puede ejecutar **@acceptance.md**.

---

## LO QUE DEBES HACER

1. **Lee `.flowdocs/flows.yaml`** completo antes de modificar nada
2. **Aplica exactamente los cambios descritos** — no toques lo que no se mencionó
3. **Actualiza los stats del meta** — recalcula `total`, `implemented`, `partial`, `pending`, `with_tests`, `coverage_pct`
4. **Actualiza `updated_at`** con la fecha de hoy
5. **Si marcas un flujo como `implemented`**, verifica que sus tasks relevantes estén en `done`
6. **Si el sprint cambió:** Con un solo sprint (`meta.sprint`), actualiza `sprint.number`, `goal`, `start`, `end`, `days_left`. Si usas varios sprints (`meta.sprints` + `meta.active_sprint`), añade el nuevo sprint a la lista `sprints:` y pon `active_sprint:` al número del sprint activo; opcionalmente rellena `days_left` en cada ítem o déjalo y el viewer lo calcula por las fechas. Las stories pueden tener un campo opcional **`sprint: N`** (número) para asignar la historia a un sprint; el viewer filtra Backlog y Tablero por el sprint seleccionado.

---

## REGLAS

- **No inventes campos nuevos** que no estaban en el YAML original (salvo `sprint` en stories si usas varios sprints y quieres filtrar por sprint en el viewer)
- **No cambies el `name` ni los `steps`** de ningún flujo a menos que se te pida explícitamente
- **No cambies `story_points`** sin que se te indique
- **`test_files`** — agrega la ruta real del archivo de test solo si se mencionó explícitamente
- **`acceptance_criteria`** (en stories) — formatos: (1) string; (2) `{ text: "...", validated_by: "ruta/al/spec.ts" }`; (3) extendido `{ id, description, validated, flow_ids, evidence: ["evidence/stories/US-001/AC-001.png"] }`. `evidence` = rutas relativas a `.flowdocs/` (capturas/vídeo). Ver **@evidence.md** para estructura de carpetas. Cobertura por criterio = criterios con `validated: true`; cobertura por flujo = flujos con `test_status: covered` y `test_files`.
- **`test_evidence`** (en flujos) — opcional, array de rutas relativas a `.flowdocs/` (ej. `evidence/flows/FLOW-001/run.png`). Evidencia de ejecución del test del flujo. Ver @evidence.md.
- **Un flujo es `implemented`** cuando todo su código core funciona. Si hay features menores pendientes, usa `partial`
- **Un flujo tiene `test_status: covered`** cuando tiene tests que cubren el camino principal (happy path)

---

## ENTREGA (obligatorio para que el update funcione)

1. **Aplica los cambios** en `.flowdocs/flows.yaml` (edita el archivo en el workspace).
2. **Incluye en tu respuesta el contenido completo del archivo** `.flowdocs/flows.yaml` actualizado dentro de un bloque de código (por ejemplo con cabecera `` ```yaml ``). Así el usuario puede comprobar el resultado o reemplazar el archivo si la edición automática falló.
3. Lista exactamente qué cambió:
   - Flujos actualizados y qué campo cambió
   - Stats antes → después
4. Si detectas inconsistencias mientras actualizas, señálalo sin cambiarlo a menos que se te pidió

**Por qué:** Si solo describes los cambios ("cambia FLOW-003 a implemented") pero no escribes el archivo ni muestras el YAML completo, el usuario no puede aplicar el update. Para que el update funcione, el archivo debe quedar modificado o el YAML completo debe estar en tu respuesta para copiar y pegar.

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden:** Lee el YAML completo → aplica solo los cambios pedidos → actualiza `meta.updated_at` (fecha de hoy) → recalcula `meta.stats` (total, implemented, partial, pending, with_tests, coverage_pct).
2. **Estructura:** Mantén las secciones del YAML en este orden: `meta`, `modules`, `entities`, `stories`, `flows`. No inventes campos que no existían.
3. **Para el viewer:** Incluye el YAML completo en tu respuesta (bloque `` ```yaml ``). El usuario recarga el viewer (botón Recargar o `flowdocs open`) para ver los cambios.
