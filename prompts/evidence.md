# FlowDocs — Evidencia de tests (capturas y vídeo)

> Convención única de almacenamiento para que todos guarden la evidencia en el mismo sitio.

---

## Estructura de carpetas (obligatoria)

Toda la evidencia vive bajo **`.flowdocs/evidence/`**. Rutas relativas al repo.

### Por flujo

```
.flowdocs/evidence/flows/<FLOW-ID>/
```

- Ejemplo: `.flowdocs/evidence/flows/FLOW-001/run-2026-02-20.png`
- Un flujo puede tener varias capturas o un vídeo: `checkout-completo.mp4`, `paso-cobro.png`, etc.
- En el YAML el flujo tiene `test_evidence: ["evidence/flows/FLOW-001/run-2026-02-20.png"]` (ruta relativa a `.flowdocs/` para que el viewer la resuelva).

### Por criterio de aceptación

```
.flowdocs/evidence/stories/<US-ID>/<AC-ID>.<ext>
```

- Ejemplo: `.flowdocs/evidence/stories/US-001/AC-001.png`
- Si el criterio tiene `id: "AC-001"`, la evidencia va en `stories/US-001/AC-001.png` (o `.mp4`, etc.).
- En el YAML, en ese criterio (formato extendido): `evidence: ["evidence/stories/US-001/AC-001.png"]`.

### Formatos admitidos

- Imágenes: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- Vídeo: `.mp4`, `.webm`

---

## Qué va en el YAML

### En cada flujo (`flows`)

```yaml
- id: "FLOW-001"
  name: "..."
  test_status: "covered"
  test_files: ["src/tests/e2e/checkout.spec.ts"]
  test_evidence: ["evidence/flows/FLOW-001/run-2026-02-20.png"]   # opcional
```

- **`test_evidence`**: array de rutas relativas a `.flowdocs/`. Capturas o vídeo de la ejecución del test del flujo.

### En cada criterio (formato extendido en `acceptance_criteria`)

```yaml
acceptance_criteria:
  - id: "AC-001"
    description: "El usuario ve el total actualizado"
    validated: true
    flow_ids: ["FLOW-001"]
    evidence: ["evidence/stories/US-001/AC-001.png"]   # opcional
```

- **`evidence`**: array de rutas relativas a `.flowdocs/`. Evidencia de que ese criterio se cumple (captura o vídeo del test que lo valida).

---

## Cobertura: por flujo vs por criterio

- **Cobertura por flujo**: el flujo tiene `test_status: covered` (o `partial`) y opcionalmente `test_files` y `test_evidence`. Indica que hay tests que ejercitan el flujo.
- **Cobertura por criterio**: el criterio tiene `validated: true` (y opcionalmente `evidence`). Indica que hay test (o demo) que demuestra ese criterio.
- En el viewer se muestran por separado: “X de Y flujos con tests” y “Z de W criterios validados”.

---

## Cuándo usar qué prompt

- **Después de implementar**: usa **@document.md** (o el bloque “2. Generar documentación” del viewer). Un solo prompt para tests, evidencia y actualización del YAML. No hace falta usar varios.
- **Solo ejecutar tests / solo documentar existentes**: si necesitas solo eso sin implementar, usa `@run-tests.md`. Para el flujo normal (implementar → documentar), basta con @document.md.
