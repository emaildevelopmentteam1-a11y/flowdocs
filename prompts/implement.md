# FlowDocs — IMPLEMENT
> Implementa un flujo de negocio específico usando `.flowdocs/flows.yaml` como fuente de verdad.

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

1. Lee `.flowdocs/flows.yaml`
2. Localiza el flujo solicitado por su ID
3. Lee la **historia de usuario** (`story`) a la que pertenece y sus **`acceptance_criteria`** — son las condiciones que validan que la implementación está correcta
4. Lee las entidades que usa (`entities`) y sus transiciones de estado
5. Lee los flujos relacionados del mismo módulo — pueden compartir lógica
6. Si hay tests existentes en `test_files`, léelos para entender el comportamiento esperado

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

### Paso 5 — Actualiza el YAML

Cuando termines, actualiza `.flowdocs/flows.yaml`:
- `status`: `implemented` si completaste todo y los criterios de aceptación se cumplen, `partial` si falta algo
- `sprint_status`: `review` — listo para revisión
- Las tasks completadas: `status: done`
- Si creaste archivos de test: agrega las rutas a `test_files`
- Si añadiste o refinaste criterios de aceptación: actualiza `acceptance_criteria` en la story (o indica que el usuario debe hacerlo con @update.md)

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
