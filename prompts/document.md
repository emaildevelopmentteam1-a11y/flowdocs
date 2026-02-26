# FlowDocs — Generar documentación (tests + evidencia + YAML)

> **Un solo prompt** para después de implementar: crea o ejecuta tests, guarda evidencia y actualiza la documentación FlowDocs.

---

## DETECCIÓN DE MODO

- **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Flujos en `.flowdocs/flows/`, stories en `.flowdocs/stories/`, sprints en `.flowdocs/sprints/`.
- **Si NO existe** → Modo **legacy**. Todo en `.flowdocs/flows.yaml`.

---

## USO

```
@document.md
@document.md — para la historia US-001 (flujos ya implementados)
@document.md — documenta los tests existentes de FLOW-003 y FLOW-004
@document.md — esta story ya tiene tests en src/tests/e2e; mapea a criterios y añade evidencia
```

---

## ESTRUCTURA DE ALMACENAMIENTO (obligatoria)

Sigue **@evidence.md** siempre. No inventes otras carpetas.

- **Por flujo:** `.flowdocs/evidence/flows/<FLOW-ID>/` — ej. `FLOW-001/run.png`
- **Por criterio:** `.flowdocs/evidence/stories/<US-ID>/<AC-ID>.<ext>` — ej. `US-001/AC-001.png`
- En el YAML las rutas son relativas a `.flowdocs/` (ej. `evidence/flows/FLOW-001/run.png`).

---

## LO QUE DEBES HACER (en un solo paso)

1. **Lee** la documentación FlowDocs (modular: archivos individuales; legacy: `flows.yaml`) y céntrate en la story/flujo indicado.
2. **Tests:** escribe/ejecuta tests o mapea specs existentes.
3. **Ejecuta** los tests y **guarda evidencia** en `.flowdocs/evidence/`.
4. **Actualiza** la documentación FlowDocs:
   - **Modular:** edita `.flowdocs/flows/FLOW-XXX.yaml` (`test_files`, `test_status`, `test_evidence`), `.flowdocs/stories/US-XXX.yaml` (criterios `validated`, `evidence`), `.flowdocs/project.yaml` (`updated_at`).
   - **Legacy:** edita `.flowdocs/flows.yaml` (flujos, criterios, `meta.stats`, `meta.updated_at`).
5. Opcional: usa @update.md solo si necesitas cambios más amplios.

---

## REGLAS

- **Cobertura por flujo:** `test_files` + `test_status` + opcionalmente `test_evidence`.
- **Cobertura por criterio:** `validated: true` (o `validated_by`) + opcionalmente `evidence`.
- No cambies `name`, `steps` ni la estructura de stories; solo campos de estado y evidencia.

---

## ENTREGA

1. Resumen: qué tests creaste/ejecutaste o qué specs documentaste.
2. Lista de archivos de evidencia creados bajo `.flowdocs/evidence/`.
3. El YAML actualizado (o las secciones modificadas).

Tras recargar el viewer se verá la evidencia y la cobertura por flujo vs por criterios.
