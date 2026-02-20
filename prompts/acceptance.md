# FlowDocs — ACCEPTANCE (rellenar criterios de aceptación)
> Añade o completa `acceptance_criteria` en las stories de `.flowdocs/flows.yaml`. El viewer acepta formato simple (string / text + validated_by) o extendido (id, description, validated, flow_ids).

---

## USO

El **usuario** ejecuta este prompt cuando el YAML ya tiene stories y flujos pero les faltan criterios de aceptación (o tienen pocos). **Tú (la IA)** actualizas el YAML.

```
@acceptance.md
@acceptance.md — solo US-001 y US-002
@acceptance.md — mínimo 8 por story
@acceptance.md — usa formato extendido (id, description, validated, flow_ids)
```

---

## FORMATOS DE CRITERIOS (ambos válidos)

**Formato simple (el que ya tenías):**
- `- "Texto del criterio"`
- `- text: "Texto del criterio"\n  validated_by: "src/tests/e2e/ruta/spec.ts"` cuando ese spec ya existe y está en `test_files` de algún flujo de la story. El viewer marca ✓ automáticamente.

**Formato extendido (añadido):**
```yaml
- id: "AC-001"
  description: "El cajero puede agregar productos y cobrar"
  validated: false
  flow_ids: ["FLOW-001", "FLOW-002"]
```
- **HU → Flujos:** `story.flow_ids` = todos los flujos de la historia.
- **Criterio → Flujos:** `ac.flow_ids` = flujos que implementan ese criterio. El viewer muestra estos flujos como tags bajo el criterio.
- **HU done** (en formato extendido): cuando todos los criterios tienen `validated: true`.

No cambies el formato de criterios que ya existen; si la story usa strings o text/validated_by, añade los nuevos en el mismo estilo salvo que el usuario pida formato extendido.

---

## LO QUE DEBES HACER

1. **Lee `.flowdocs/flows.yaml`** — stories, sus `flow_ids`, y para cada flujo: `steps`, `name`, `test_files`.
2. **Por cada story indicada (o todas si no se indica):**
   - Si ya tiene `acceptance_criteria` con al menos 8 criterios, opcionalmente revisa redacción y, en formato simple, que donde exista un spec en `test_files` de algún flujo de la story los criterios que cubra tengan `validated_by: "ruta/al/spec.ts"`.
   - Si le faltan criterios o tiene menos de 8: genera **mínimo 8** criterios comprobables. Usa el mismo formato que ya tenga la story (string o text/validated_by), o formato extendido si el usuario lo pidió. Deriva los criterios de los `steps` y del `name` de los flujos.
3. **Formato simple:** cada criterio puede ser `- "Texto"` o `- text: "..."` con `validated_by` cuando el spec ya exista y esté en `test_files` de algún flujo de la story.
4. **Formato extendido:** cada criterio con `id`, `description`, `validated` (true si ya hay test que lo cubra), `flow_ids` (flujos que implementan ese criterio, solo IDs de la story).
5. **Actualiza `updated_at`** en `meta`. **No cambies** `name`, `steps`, `flow_ids` ni otros campos que no sean `acceptance_criteria` y `updated_at`.

---

## REGLAS

- **Mínimo 8 criterios por story.** Reparte por flujo y por comportamiento (happy path, errores, precondiciones).
- **Comprobables:** cada criterio debe poder verificarse con test o demo manual.
- **`validated_by`** (formato simple) solo cuando el archivo de test **ya existe** y está en `test_files` de algún flujo de esa story.
- **`validated: true`** (formato extendido) solo cuando ya exista un test que cubra ese criterio.
- No inventes flujos ni stories; solo rellena o actualiza criterios en las stories existentes.

---

## ENTREGA

1. El archivo `.flowdocs/flows.yaml` actualizado (edita el archivo en el workspace).
2. Incluye en tu respuesta el YAML completo de la sección `stories:` (o al menos las stories que modificaste) dentro de un bloque `` ```yaml ``.
3. Resumen: qué stories actualizaste y cuántos criterios tiene ahora cada una.
