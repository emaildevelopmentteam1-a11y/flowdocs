# FlowDocs — BACKLOG (añadir historias y flujos desde requisitos en lenguaje natural)
> El usuario describe requisitos o necesidades en texto libre. Tú interpretas, decides si corresponde a historia nueva, flujo nuevo o complemento a algo existente, y generas/actualizas el YAML.

---

## USO

El usuario describe requisitos en lenguaje natural. Ejemplos:

```
@backlog.md

Quiero que el cajero pueda anular una venta ya cobrada y que el stock se revierta automáticamente. 
También necesito un reporte diario de ventas por método de pago.
```

```
@backlog.md — Solo el módulo inventario

- Alertas cuando un producto baja de stock mínimo
- Ajuste masivo de precios por categoría
- Historial de quién modificó cada producto
```

```
@backlog.md

Complementar US-001: que el cajero pueda aplicar un descuento por porcentaje o monto fijo antes de cobrar, 
y que quede registrado en la venta.
```

---

## TU ROL

1. **Leer** el mensaje del usuario: requisitos, features, mejoras, reportes, permisos, etc.
2. **Leer** `.flowdocs/flows.yaml` completo para saber: últimos IDs (US-XXX, FLOW-XXX, AC-XXX), módulos existentes, historias y sus `flow_ids`.
3. **Decidir por cada requisito:**
   - **Nueva historia:** si es una capacidad o epic nuevo → crea una story nueva (siguiente US-XXX), sus flujos (FLOW-XXX) y mínimo 8 criterios de aceptación (formato simple o extendido según el resto del YAML).
   - **Nuevo flujo en historia existente:** si encaja en una story ya existente → añade el/los flujo(s) a esa story (en `flow_ids` de la story y en cada criterio que corresponda con `flow_ids`), y crea los criterios de aceptación que cubran el nuevo flujo.
   - **Solo criterios o pasos:** si es un matiz o condición sobre algo ya documentado → añade criterios a la story existente o steps/alternatives/errors al flujo existente.
4. **Generar** el YAML en el mismo formato que el archivo actual (stories con `id`, `title`, `module`, `priority`, `status`, `flow_ids`, `acceptance_criteria`; opcionalmente `sprint: N` para asignar la historia a un sprint y filtrar en el viewer; flows con `id`, `name`, `type`, `module`, `actor`, `priority`, `status`, `test_status`, `sprint_status`, `story`, `story_points`, `entities`, `trigger`, `preconditions`, `steps`, etc.). Continuar la numeración de IDs.
5. **Actualizar** `meta.stats` (total, implemented, partial, pending, with_tests, coverage_pct) y `meta.updated_at`.

---

## REGLAS

- **IDs:** Siguen la secuencia del YAML. Si el último flujo es FLOW-020, el nuevo es FLOW-021. Si la última story es US-005, la nueva es US-006. Criterios: AC-001, AC-002, … por story.
- **Módulos:** Usa solo `module` que ya existan en `modules:` del YAML. Si el requisito implica un área nueva, propón un nuevo módulo y añádelo a `modules:` con `id`, `name`, `description`, `actors`.
- **Stories:** Formato "Como [rol] quiero [objetivo] para [beneficio]." Mínimo 8 criterios de aceptación por historia nueva. `flow_ids` = todos los flujos de esa historia. Opcional: `sprint: N` (número) para asignar la historia a un sprint; sin `sprint` = backlog sin asignar (el viewer filtra por sprint). Criterios con `description` (o `text`) y, si usas formato extendido, `validated: false`, `flow_ids` por criterio.
- **Flujos:** Cada flujo tiene `story: "US-XXX"` (la historia a la que pertenece). Mínimo 3 `steps` en lenguaje de negocio. Asigna `type` (user_flow, business_flow, task_flow, data_flow, system_flow, error_flow), `actor`, `priority`, `status: "pending"`, `test_status: "none"`, `sprint_status: "todo"` por defecto.
- **No borres** ni reescribas flujos o historias existentes salvo que el usuario pida explícitamente modificar uno. Solo añade o complementa.
- Si algo es ambiguo, elige la opción más razonable y coméntalo en la respuesta.

---

## ENTREGA

1. **Edita** `.flowdocs/flows.yaml`: añade las nuevas stories, flujos y criterios (o las modificaciones a existentes).
2. **Incluye** en tu respuesta el YAML completo actualizado dentro de un bloque `` ```yaml `` (o al menos las secciones `stories:` y `flows:` que cambiaste).
3. **Resumen:** qué interpretaste, qué creaste (US-XXX, FLOW-XXX, criterios) y qué complementaste (story/flujo existente).

Así el usuario puede revisar en el viewer y seguir con @implement.md cuando quiera desarrollar un flujo.

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden:** Lee flows.yaml (IDs, módulos, stories) → interpreta los requisitos del usuario → decide historia nueva vs complemento → genera/edita YAML (stories, flows, acceptance_criteria) → actualiza `meta.stats` y `meta.updated_at`. Incluye el YAML completo o las secciones modificadas en tu respuesta.
2. **Estructura:** Misma que el YAML existente: `meta` → `modules` → `entities` → `stories` → `flows`. IDs en secuencia (US-XXX, FLOW-XXX, AC-XXX). Mínimo 8 criterios por story nueva.
3. **Para el viewer:** El usuario recarga el viewer (Recargar o `flowdocs open`) para ver las nuevas historias, flujos y criterios.
