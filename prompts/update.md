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
```

---

## LO QUE DEBES HACER

1. **Lee `.flowdocs/flows.yaml`** completo antes de modificar nada
2. **Aplica exactamente los cambios descritos** — no toques lo que no se mencionó
3. **Actualiza los stats del meta** — recalcula `total`, `implemented`, `partial`, `pending`, `with_tests`, `coverage_pct`
4. **Actualiza `updated_at`** con la fecha de hoy
5. **Si marcas un flujo como `implemented`**, verifica que sus tasks relevantes estén en `done`
6. **Si el sprint cambió**, actualiza `sprint.number`, `goal`, `start`, `end`, `days_left`

---

## REGLAS

- **No inventes campos nuevos** que no estaban en el YAML original
- **No cambies el `name` ni los `steps`** de ningún flujo a menos que se te pida explícitamente
- **No cambies `story_points`** sin que se te indique
- **`test_files`** — agrega la ruta real del archivo de test solo si se mencionó explícitamente
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
