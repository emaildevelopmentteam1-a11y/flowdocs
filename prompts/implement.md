# FlowDocs — IMPLEMENT
> Implementa un flujo de negocio específico usando la documentación FlowDocs como fuente de verdad.

---

## DETECCIÓN DE MODO

- **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Lee flujos de `.flowdocs/flows/FLOW-XXX.yaml`, stories de `.flowdocs/stories/US-XXX.yaml`.
- **Si NO existe** → Modo **legacy**. Todo está en `.flowdocs/flows.yaml`.

---

## USO

```
@implement.md FLOW-003
@implement.md FLOW-011 — solo el backend, sin UI
@implement.md FLOW-003 FLOW-004 — implementa ambos en orden
```

---

## LO QUE DEBES HACER

### Paso 1 — Lee el contexto completo

1. Lee el flujo solicitado por su ID:
   - **Modular:** `.flowdocs/flows/FLOW-XXX.yaml`
   - **Legacy:** busca en `.flowdocs/flows.yaml`
2. Lee la **historia de usuario** (`story`) a la que pertenece y sus **`acceptance_criteria`**:
   - **Modular:** `.flowdocs/stories/US-XXX.yaml`
   - **Legacy:** sección `stories:` en `flows.yaml`
3. Lee las entidades que usa (`entities`) y sus transiciones de estado
4. Lee los flujos relacionados del mismo módulo — pueden compartir lógica
5. Si hay tests existentes en `test_files`, léelos

### Paso 2 — Entiende qué construir

Antes de escribir código, describe en 3-5 líneas:
- Qué hace este flujo desde la perspectiva del usuario
- Qué componentes o archivos necesita crear o modificar
- Qué entidades de base de datos afecta
- Si hay dependencias con otros flujos que deben existir primero

**Si hay dependencias no implementadas, dilo antes de continuar.**

### Paso 3 — Implementa

Implementa siguiendo exactamente los `steps` del flujo en el YAML. Cada paso del YAML debe tener código correspondiente.

Respeta:
- **`preconditions`** — agrega las validaciones necesarias
- **`alternatives`** — implementa los caminos alternativos, no solo el happy path
- **`errors`** — maneja los errores descritos
- **`postconditions`** — verifica que el estado final es correcto

### Paso 4 — Valida contra criterios de aceptación

Antes de dar por terminado, **comprueba cada `acceptance_criteria`** de la historia. Si falta alguno en el YAML, proponlo y sugiere al usuario actualizar con `@update.md`.

### Paso 5 — Actualiza la documentación

Cuando termines, actualiza los archivos FlowDocs:

**Modo modular:**
- Edita `.flowdocs/flows/FLOW-XXX.yaml`: `status`, `test_status`, `test_files`, `test_evidence`
- Edita `.flowdocs/sprints/sprint-N.yaml`: `sprint_status` del flujo, tasks completadas
- Edita `.flowdocs/stories/US-XXX.yaml`: `validated` en criterios si aplica
- Actualiza `updated_at` en `.flowdocs/project.yaml`

**Modo legacy:**
- Edita `.flowdocs/flows.yaml`: `status`, `sprint_status`, `test_status`, `test_files`, tasks
- Actualiza `meta.updated_at` y `meta.stats`

Si creaste archivos de test: guarda evidencia en `.flowdocs/evidence/flows/<FLOW-ID>/` (ver @evidence.md).

---

## REGLAS DE IMPLEMENTACIÓN

- **Sigue las convenciones del proyecto** — lee el código existente antes de escribir el tuyo
- **No sobre-engineerices** — implementa lo que dice el flujo, nada más
- **Si el flujo dice "el sistema valida X"**, implementa esa validación
- **Si el flujo dice "el sistema notifica"**, implementa la notificación aunque sea un log por ahora
- **No cambies los `steps` del YAML** para que encajen con tu implementación — cambia tu implementación para que encaje con los steps
- **Si encuentras que el flujo está mal descrito**, dilo y propón la corrección antes de implementar

---

## ENTREGA

1. El código implementado
2. Un resumen de qué se creó/modificó
3. Instrucciones para probar manualmente el flujo
4. El YAML actualizado con el nuevo estado
5. Si quedó algo pendiente, describe exactamente qué y por qué

**Al terminar la implementación**, el usuario debe ejecutar **un solo prompt** para la documentación: **@document.md**. Ese prompt genera tests (o documenta los existentes), evidencia y actualiza el YAML en un solo paso. No hace falta usar @run-tests.md ni @update.md por separado; @document.md cubre todo el paso de documentación.

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden:** Implementa el código según los steps → valida contra acceptance_criteria → actualiza los archivos FlowDocs correspondientes → actualiza `updated_at`.
2. **Estructura:** No cambies la estructura existente; solo los campos de estado del flujo y de la story afectada.
3. **Para el viewer:** El usuario recarga el viewer (`flowdocs open` o botón Recargar) para ver el nuevo estado.
