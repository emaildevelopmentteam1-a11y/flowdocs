# FlowDocs — Ejecutar tests y documentar evidencia

> Para el flujo normal (implementar → documentar) usa **@document.md**. Este prompt sirve cuando quieres solo ejecutar tests o documentar tests existentes.

---

## DETECCIÓN DE MODO

- **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Flujos en `.flowdocs/flows/`, stories en `.flowdocs/stories/`.
- **Si NO existe** → Modo **legacy**. Todo en `.flowdocs/flows.yaml`.

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

1. **Lee** la documentación FlowDocs (modular: archivos de flujos/stories individuales; legacy: `flows.yaml`).
2. **Ejecuta** los tests y captura evidencia en `.flowdocs/evidence/flows/<FLOW-ID>/`.
3. **Actualiza:**
   - **Modular:** `.flowdocs/flows/FLOW-XXX.yaml` (`test_evidence`), `.flowdocs/stories/US-XXX.yaml` (criterios `evidence`), `.flowdocs/project.yaml` (`updated_at`).
   - **Legacy:** `.flowdocs/flows.yaml` (flujos, criterios, `meta.stats`, `meta.updated_at`).

### Si el usuario pide documentar tests existentes

1. **Lee** el código de tests existente y la documentación FlowDocs.
2. **Mapea** cada archivo o bloque de test a flujos y criterios.
3. **Evidencia**: genera capturas/vídeo si puedes; guárdalas según @evidence.md.
4. **Actualiza:** archivos individuales (modular) o `flows.yaml` (legacy) con `test_files`, `test_status`, `validated`.

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
