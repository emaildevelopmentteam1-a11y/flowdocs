# FlowDocs — Ejecutar tests y documentar evidencia

> Para el flujo normal (implementar → documentar) usa **@document.md**, que hace todo en un solo paso. Este prompt (@run-tests.md) sirve cuando quieres solo ejecutar tests o solo documentar tests existentes sin pasar por implement.

---

## USO

**Modo 1 — Ejecutar tests y guardar evidencia**

```
@run-tests.md
@run-tests.md — ejecuta los e2e de la story US-001 y guarda evidencia
@run-tests.md — corre los tests de FLOW-003 y captura pantalla
```

**Modo 2 — Documentar tests ya existentes**

```
@run-tests.md — documenta los tests que ya tenemos: mapea specs a flujos y criterios, añade evidencia si puedes
@run-tests.md — esta historia ya está implementada y tiene tests en src/tests/e2e; documenta en el YAML y añade evidencia
```

---

## ESTRUCTURA DE ALMACENAMIENTO (obligatoria)

Sigue **@evidence.md** siempre:

- **Por flujo**: `.flowdocs/evidence/flows/<FLOW-ID>/` — ej. `FLOW-001/run-2026-02-20.png`
- **Por criterio**: `.flowdocs/evidence/stories/<US-ID>/<AC-ID>.<ext>` — ej. `US-001/AC-001.png`
- Rutas en el YAML: relativas a `.flowdocs/` (ej. `evidence/flows/FLOW-001/run.png`).

No inventes otras carpetas ni nombres. Si no existe la carpeta, créala.

---

## LO QUE DEBES HACER

### Si el usuario pide ejecutar tests

1. **Lee** `.flowdocs/flows.yaml` — identifica los flujos y stories indicados (o todos los que tengan `test_files`).
2. **Ejecuta** los tests (npm test, pnpm test, etc.) y captura evidencia:
   - Capturas de pantalla o grabación de vídeo de la ejecución.
   - Guarda los archivos en `.flowdocs/evidence/flows/<FLOW-ID>/` para cada flujo ejecutado.
   - Si un test valida criterios concretos, guarda también en `.flowdocs/evidence/stories/<US-ID>/<AC-ID>.<ext>`.
3. **Actualiza** el YAML:
   - En cada flujo: `test_evidence: ["evidence/flows/FLOW-XXX/archivo.png"]` (añadir o completar).
   - En cada criterio con evidencia: `evidence: ["evidence/stories/US-XXX/AC-XXX.png"]`.
   - Mantén `test_status`, `test_files`, `validated`, `validated_by` coherentes.
4. Recalcula `meta.stats` y `meta.updated_at`. Usa @update.md si aplica.

### Si el usuario pide documentar tests existentes

1. **Lee** el código de tests existente (carpetas tipo `src/tests/`, `e2e/`, `spec/`, etc.) y `.flowdocs/flows.yaml`.
2. **Mapea** cada archivo o bloque de test a:
   - Un flujo (por nombre, steps o comentarios) → actualiza `test_files` del flujo y `test_status: covered` si aplica.
   - Los criterios de aceptación que ese test valida → en formato simple `validated_by: "ruta/al/spec.ts"`; en extendido `validated: true` y `flow_ids`.
3. **Evidencia**: si puedes ejecutar los tests, genera capturas/vídeo y guárdalas en la estructura de @evidence.md; luego añade `test_evidence` (flujo) y `evidence` (criterio) en el YAML. Si no puedes ejecutar, deja al menos `test_files` y `validated_by`/`validated` actualizados.
4. **Actualiza** `meta.stats` (with_tests, coverage_pct) y `meta.updated_at`.

---

## REGLAS

- **Cobertura por flujo**: un flujo tiene cobertura cuando tiene `test_files` y `test_status: covered` (o `partial`). Opcionalmente `test_evidence`.
- **Cobertura por criterio**: un criterio está cubierto cuando tiene `validated: true` (o `validated_by` en formato simple). Opcionalmente `evidence`.
- No borres ni cambies `name`, `steps` ni la estructura de stories; solo campos de estado y evidencia.
- Si un test cubre varios criterios, indica todos en `flow_ids` o `validated_by` según el formato de la story.

---

## ENTREGA

1. Resumen: qué tests ejecutaste o qué specs documentaste.
2. Lista de archivos de evidencia creados (rutas bajo `.flowdocs/evidence/`).
3. El YAML actualizado (o las secciones modificadas) con `test_evidence`, `evidence`, `test_files`, `validated`/`validated_by`.

El usuario puede recargar el viewer para ver la evidencia y la cobertura por flujo vs por criterios.
