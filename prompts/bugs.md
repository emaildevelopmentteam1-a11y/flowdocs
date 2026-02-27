# FlowDocs — BUGS (reportar, gestionar, reabrir y resolver bugs)

> Reporta bugs vinculándolos a historias, flujos y módulos. Gestiona el ciclo de vida completo: open → in_progress → resolved → closed, con historial de eventos, reaperturas y timestamps precisos.

---

## DETECCIÓN DE MODO

- **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Bugs en `.flowdocs/bugs/BUG-XXX.yaml`.
- **Si NO existe** → Modo **legacy**. Sección `bugs:` en `.flowdocs/flows.yaml`.

---

## USO

```
@bugs.md — reportar: El total de la venta no se actualiza al remover un producto del carrito. Ocurre cuando el carrito tiene más de 5 items y se elimina uno del medio. El subtotal se recalcula pero el total con impuestos no.
@bugs.md — explotar lista de bugs desde mi_bugs.md
@bugs.md — resolver BUG-001: corregido en FLOW-015
@bugs.md — reabrir BUG-003: el error persiste cuando se usa con datos especiales
@bugs.md — listar bugs abiertos del módulo POS
@bugs.md — cambiar estado de BUG-003 a resolved
```

---

## SCHEMA DE BUG (YAML completo)

```yaml
bug:
  id: "BUG-001"
  title: "El total no se actualiza al remover producto del carrito"
  description: |
    Cuando el carrito tiene más de 5 items y se elimina uno del medio,
    el subtotal se recalcula correctamente pero el total con impuestos
    no se actualiza. El usuario ve un total incorrecto hasta que recarga
    la página o agrega otro producto. Esto causa confusión y puede llevar
    a cobros incorrectos si el cajero no lo nota.
  severity: "critical"              # critical | high | medium | low
  status: "open"                    # open | in_progress | resolved | closed | reopened
  category: "funcional"             # funcional | visual | datos | rendimiento | seguridad | ux
  environment: "producción"         # producción | staging | desarrollo | todos
  reported_by: "Martin"

  # --- Timestamps con fecha y hora ISO 8601 ---
  created_at: "2026-02-27T13:15:00-06:00"
  resolved_at: null                 # timestamp ISO 8601 cuando se resuelve
  closed_at: null                   # timestamp ISO 8601 cuando se cierra
  reopen_count: 0                   # veces que se ha reabierto

  # --- Cross-references ---
  story: "US-001"                   # HU afectada
  flow: "FLOW-003"                  # Flujo donde se manifiesta
  module: "pos"                     # Módulo afectado
  related_flows: ["FLOW-001"]       # Otros flujos involucrados
  related_bugs: []                  # Bugs relacionados (ej: ["BUG-002"])

  # --- Reproducción ---
  steps_to_reproduce:
    - "Abrir el POS y agregar 6 productos al carrito"
    - "Seleccionar el tercer producto de la lista"
    - "Presionar el botón 'Eliminar' del producto seleccionado"
    - "Observar que el subtotal cambia pero el total con impuestos permanece igual"
  expected: "El total con impuestos debe recalcularse inmediatamente al eliminar cualquier producto del carrito"
  actual: "El total con impuestos no se actualiza después de eliminar un producto. Solo se actualiza si se recarga la página o se agrega otro producto"

  # --- Sprint tracking ---
  sprint_found: 3                   # Sprint donde se encontró
  sprint_fixed: null                # Sprint donde se corrigió
  fix_flow: null                    # FLOW que corrige el bug

  # --- Extras ---
  notes: ""
  attachments: []                   # Rutas a capturas o evidencia: [".flowdocs/evidence/BUG-001/screenshot.png"]

  # --- Historial de eventos (timeline) ---
  history:
    - date: "2026-02-27T13:15:00-06:00"
      action: "created"
      detail: "Bug reportado inicialmente desde lista de bugs del usuario"
    # Ejemplo de reapertura:
    # - date: "2026-02-28T10:30:00-06:00"
    #   action: "reopened"
    #   detail: "Se detectó que el error persiste con productos de tipo combo"
    #   new_characteristics: "También falla cuando el producto eliminado es un combo con sub-items"
    # Ejemplo de resolución:
    # - date: "2026-03-01T09:00:00-06:00"
    #   action: "resolved"
    #   detail: "Corregido en FLOW-018 — se recalcula el total tras cada mutación del carrito"
```

---

## TU ROL

### Reportar bugs (uno o lista)

1. **Lee** la documentación FlowDocs (modular o legacy) para obtener IDs existentes y determinar el siguiente `BUG-XXX`.
2. **Si el usuario pasa una lista (archivo MD o texto):**
   - Explosiona **cada item** de la lista en un bug individual.
   - La numeración del usuario en su lista (1, 2, 3...) **NO es la numeración del bug**. Usa la secuencia del proyecto.
   - **NO acortes ni resumas** las descripciones del usuario. Transcribe la información tal cual en el campo `description`.
3. **Para cada bug de la lista, compara con bugs existentes:**
   - Si el bug **está claramente relacionado** con un bug anterior existente (misma funcionalidad, mismo módulo, síntomas similares) → **REABRE** el bug anterior:
     - Cambia `status: "reopened"`
     - Incrementa `reopen_count`
     - Limpia `resolved_at` y `closed_at` (ponlos en null)
     - Agrega entrada `reopened` en `history` con `new_characteristics` describiendo lo nuevo
   - Si el bug **no tiene relación** con ninguno existente → **CREA** nuevo `BUG-XXX.yaml`
4. **Identifica** la HU, flujo y módulo afectados automáticamente.
5. **Crea** el bug con **TODOS los campos** del schema. NO omitas campos. Usa null para los que no apliquen.
6. **Timestamps:** Usa la hora actual del sistema en formato ISO 8601 con zona horaria.
7. **Modular:** crea `.flowdocs/bugs/BUG-XXX.yaml`. Actualiza `manifest.yaml` si existe.
8. **Legacy:** añade a la sección `bugs:` de `flows.yaml`.

### Resolver un bug

1. **Lee** el bug existente.
2. **Actualiza:**
   - `status: "resolved"`
   - `resolved_at: "<timestamp ISO 8601 actual>"`
   - `sprint_fixed: N`
   - `fix_flow: "FLOW-XXX"` si aplica
3. **Agrega** entrada `resolved` en `history` con detalle de la corrección.
4. **Modular:** edita `.flowdocs/bugs/BUG-XXX.yaml`.
5. **Legacy:** edita la entrada del bug en `flows.yaml`.

### Cerrar un bug

1. **Lee** el bug (debe estar en `resolved`).
2. **Actualiza:**
   - `status: "closed"`
   - `closed_at: "<timestamp ISO 8601 actual>"`
3. **Agrega** entrada `closed` en `history`.

### Reabrir un bug

1. **Lee** el bug existente.
2. **Actualiza:**
   - `status: "reopened"`
   - `resolved_at: null`
   - `closed_at: null`
   - `reopen_count: +1`
3. **Agrega** entrada `reopened` en `history` con `detail` y `new_characteristics`.

### Listar bugs

1. **Lee** todos los bugs y filtra por estado, módulo, severidad o sprint según el usuario pida.
2. **Presenta** tabla con id, title, severity, status, reopen_count, created_at, story, flow.

---

## REGLAS

- **IDs:** Siguen la secuencia del proyecto. Si el último bug es BUG-005, el nuevo es BUG-006.
- **Cross-refs obligatorias:** Todo bug debe tener al menos `story` o `flow` o `module`.
- **Severidad:** Usa `critical` para bugs que afectan dinero/datos, `high` para funcionalidad rota, `medium` para UX malo, `low` para cosméticos.
- **No borres bugs:** Solo cambia su estado. Los bugs `closed` son históricos.
- **No acortes descripciones:** El campo `description` debe contener toda la información que el usuario proporcionó, sin resumir ni sintetizar.
- **Timestamps siempre con hora:** Formato ISO 8601 completo: `YYYY-MM-DDTHH:MM:SS±HH:MM`.
- **Historial obligatorio:** Todo cambio de estado debe tener su entrada en `history`.
- **Reaperturas:** Si un bug reaparece con nuevas características, se reabre el existente en vez de crear uno nuevo. El campo `new_characteristics` en el evento de history debe detallar qué cambió.

---

## ENTREGA

### Modo modular:
1. **Crea/edita** `.flowdocs/bugs/BUG-XXX.yaml` para cada bug.
2. **Actualiza** `manifest.yaml` si es nuevo.
3. **Resumen:** tabla con bugs creados/reabiertos, sus IDs, títulos, severidad, y si fue creación nueva o reapertura.

### Modo legacy:
1. **Edita** `.flowdocs/flows.yaml` (sección `bugs:`).
2. **Resumen:** tabla con bugs creados/reabiertos.

El usuario puede recargar el viewer para ver los bugs en la pestaña Bugs, incluyendo el historial de eventos y las reaperturas.
