# FlowDocs — Generar documentación (tests + evidencia + YAML)

> **Un solo prompt** para después de implementar: crea o ejecuta tests, guarda evidencia en la estructura acordada y actualiza el YAML. También sirve para documentar tests ya existentes en una historia o flujo.

Usa este prompt **después de @implement.md** (o cuando la implementación ya está hecha y quieres registrar tests y evidencia). No hace falta ejecutar run-tests ni update por separado; este prompt cubre todo el paso de documentación.

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

1. **Lee** `.flowdocs/flows.yaml` y, si el usuario indicó una story o flujo, céntrate en esa.
2. **Tests:**
   - Si hay que crear tests: escribe o amplía los specs e2e que validen los criterios de aceptación de la historia.
   - Si los tests ya existen: mapea cada spec a los flujos y criterios que cubre.
3. **Ejecuta** los tests y **guarda evidencia** (capturas de pantalla o vídeo) en `.flowdocs/evidence/` según la estructura anterior. Si no puedes ejecutar, documenta al menos `test_files` y `validated_by`/`validated`.
4. **Actualiza** `.flowdocs/flows.yaml` en un solo paso:
   - En cada flujo: `test_files`, `test_status: covered` (o `partial`), y `test_evidence` con las rutas a las capturas/vídeo.
   - En cada criterio cubierto: formato simple `validated_by: "ruta/al/spec.ts"`; formato extendido `validated: true`, `flow_ids`, y `evidence: ["evidence/stories/US-XXX/AC-XXX.png"]`.
   - Recalcula `meta.stats` (with_tests, coverage_pct) y `meta.updated_at`.
5. Opcional: usa @update.md solo si necesitas aplicar cambios más amplios; para este paso de documentación suele bastar con editar el YAML directamente.

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
