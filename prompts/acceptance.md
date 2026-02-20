# FlowDocs — ACCEPTANCE (rellenar criterios de aceptación)
> Añade o completa `acceptance_criteria` en las stories de `.flowdocs/flows.yaml` para que el viewer y los prompts de implementación/e2e funcionen bien.

---

## USO

El **usuario** ejecuta este prompt cuando el YAML ya tiene stories y flujos pero les faltan criterios de aceptación (o tienen pocos). **Tú (la IA)** actualizas el YAML.

```
@acceptance.md
@acceptance.md — solo US-001 y US-002
@acceptance.md — mínimo 8 por story, y enlaza validated_by donde ya haya test_files en los flujos
```

---

## LO QUE DEBES HACER

1. **Lee `.flowdocs/flows.yaml`** — lista de stories y sus `flow_ids`; para cada flujo, revisa `steps`, `test_files`, `name`.
2. **Por cada story indicada (o todas si no se indica):**
   - Si ya tiene `acceptance_criteria` con al menos 8 criterios, opcionalmente revisa que estén bien redactados y que donde exista un spec e2e en `test_files` de algún flujo de la story, los criterios que cubra ese spec tengan `validated_by: "ruta/al/spec.ts"`.
   - Si le faltan criterios o tiene menos de 8: genera **mínimo 8** criterios de aceptación comprobables (Given/When/Then o frases que se puedan validar con test o demo). Deriva los criterios de los `steps` y del `name` de los flujos de esa story.
3. **Formato en el YAML:** cada criterio puede ser:
   - `- "Texto del criterio"` (sin e2e aún), o
   - `- text: "Texto del criterio"\n  validated_by: "src/tests/e2e/ruta/spec.ts"` cuando ese spec ya existe y está en `test_files` de algún flujo de la story.
4. **Actualiza `updated_at`** en `meta`.
5. **No cambies** `name`, `steps`, `flow_ids` ni otros campos que no sean `acceptance_criteria` (y `updated_at`).

---

## REGLAS

- **Mínimo 8 criterios por story.** Si la story tiene pocos flujos, reparte criterios por flujo y por comportamiento (happy path, errores, precondiciones).
- **Comprobables:** cada criterio debe poder verificarse con un test o una demo manual (evita vaguedades).
- **`validated_by`** solo cuando el archivo de test **ya existe** y está en `test_files` de algún flujo de esa story; si no, deja el criterio como string.
- **No inventes flujos ni stories;** solo rellena criterios en las stories existentes.

---

## ENTREGA

1. El archivo `.flowdocs/flows.yaml` actualizado (edita el archivo en el workspace).
2. Incluye en tu respuesta el YAML completo de la sección `stories:` (o al menos las stories que modificaste) dentro de un bloque `` ```yaml ``.
3. Resumen: qué stories actualizaste y cuántos criterios tiene ahora cada una.
