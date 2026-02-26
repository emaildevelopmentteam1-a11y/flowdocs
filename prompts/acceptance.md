# FlowDocs — ACCEPTANCE (rellenar criterios de aceptación)
> Añade o completa `acceptance_criteria` en las stories. El viewer acepta formato simple (string / text + validated_by) o extendido (id, description, validated, flow_ids).

---

## DETECCIÓN DE MODO

- **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Stories están en `.flowdocs/stories/US-XXX.yaml`.
- **Si NO existe** → Modo **legacy**. Stories están en `.flowdocs/flows.yaml`.

---

## USO

```
@acceptance.md
@acceptance.md — solo US-001 y US-002
@acceptance.md — mínimo 8 por story
@acceptance.md — usa formato extendido (id, description, validated, flow_ids)
```

---

## FORMATOS DE CRITERIOS (ambos válidos)

**Formato simple:**
- `- "Texto del criterio"`
- `- text: "Texto del criterio"\n  validated_by: "src/tests/e2e/ruta/spec.ts"` cuando ese spec ya existe.

**Formato extendido:**
```yaml
- id: "AC-001"
  description: "El cajero puede agregar productos y cobrar"
  validated: false
  flow_ids: ["FLOW-001", "FLOW-002"]
  added_sprint: 1            # en qué sprint se añadió (solo modo modular)
```
- **HU done**: cuando todos los criterios tienen `validated: true`.

No cambies el formato de criterios que ya existen; añade los nuevos en el mismo estilo salvo que el usuario pida formato extendido.

---

## LO QUE DEBES HACER

### Modo legacy
1. **Lee `.flowdocs/flows.yaml`** — stories, sus `flow_ids`, y para cada flujo: `steps`, `name`, `test_files`.
2. **Por cada story indicada (o todas):** genera mínimo 8 criterios comprobables.
3. **Actualiza `updated_at`** en `meta`.

### Modo modular
1. **Lee los archivos de stories** en `.flowdocs/stories/` y los flujos referenciados en `.flowdocs/flows/`.
2. **Por cada story indicada (o todas):** edita el archivo `.flowdocs/stories/US-XXX.yaml` y añade criterios.
3. **Agrega `added_sprint`** con el número del sprint activo (léelo de `project.yaml`→`meta.active_sprint`).
4. **Actualiza `updated_at`** en `.flowdocs/project.yaml`.

---

## REGLAS

- **Mínimo 8 criterios por story.** Reparte por flujo y por comportamiento (happy path, errores, precondiciones).
- **Comprobables:** cada criterio debe poder verificarse con test o demo manual.
- **`validated_by`** (formato simple) solo cuando el archivo de test **ya existe** y está en `test_files` de algún flujo.
- **`validated: true`** (formato extendido) solo cuando ya exista un test que cubra ese criterio.
- No inventes flujos ni stories; solo rellena o actualiza criterios en las stories existentes.

---

## ENTREGA

### Modo legacy:
1. El archivo `.flowdocs/flows.yaml` actualizado.
2. Incluye la sección `stories:` modificada en un bloque `` ```yaml ``.

### Modo modular:
1. Los archivos `.flowdocs/stories/US-XXX.yaml` actualizados.
2. Incluye el contenido de cada archivo modificado.

3. Resumen: qué stories actualizaste y cuántos criterios tiene ahora cada una.

---

## SECUENCIA FINAL

1. **Orden:** Lee datos → añade/completa acceptance_criteria (mínimo 8) → actualiza `updated_at`.
2. **Estructura:** Mantén el formato ya usado. En modo modular, cada criterio tiene `added_sprint`.
3. **Para el viewer:** El usuario recarga el viewer para ver los criterios y el badge X/Y ✓.
