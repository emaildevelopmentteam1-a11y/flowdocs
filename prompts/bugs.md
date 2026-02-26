# FlowDocs — BUGS (reportar, gestionar y resolver bugs)

> Reporta bugs vinculándolos a historias, flujos y módulos. Gestiona el ciclo de vida: open → in_progress → resolved → closed.

---

## DETECCIÓN DE MODO

- **Si existe `.flowdocs/project.yaml`** → Modo **modular**. Bugs en `.flowdocs/bugs/BUG-XXX.yaml`.
- **Si NO existe** → Modo **legacy**. Sección `bugs:` en `.flowdocs/flows.yaml`.

---

## USO

```
@bugs.md — reportar: El total de la venta no se actualiza al remover un producto del carrito
@bugs.md — resolver BUG-001: corregido en FLOW-015
@bugs.md — listar bugs abiertos del módulo POS
@bugs.md — cambiar estado de BUG-003 a resolved
```

---

## SCHEMA DE BUG

```yaml
bug:
  id: "BUG-001"
  title: "Descripción corta del bug"
  severity: "critical"          # critical | high | medium | low
  status: "open"                # open | in_progress | resolved | closed
  story: "US-001"               # HU afectada (cross-ref)
  flow: "FLOW-003"              # Flujo donde se manifiesta (cross-ref)
  module: "pos"                 # Módulo afectado (cross-ref)
  related_flows: ["FLOW-001"]   # Otros flujos involucrados
  steps_to_reproduce:
    - "Paso 1"
    - "Paso 2"
  expected: "Qué debería pasar"
  actual: "Qué pasa realmente"
  sprint_found: 1               # Sprint donde se encontró
  sprint_fixed: null             # Sprint donde se corrigió
  fix_flow: null                 # FLOW que corrige el bug
  notes: ""
```

---

## TU ROL

### Reportar un bug

1. **Lee** la documentación FlowDocs (modular o legacy) para obtener IDs existentes y determinar el siguiente `BUG-XXX`.
2. **Identifica** la HU, flujo y módulo afectados.
3. **Crea** el bug con cross-references obligatorias (`story`, `flow`, `module`).
4. **Modular:** crea `.flowdocs/bugs/BUG-XXX.yaml`. Actualiza `manifest.yaml`.
5. **Legacy:** añade a la sección `bugs:` de `flows.yaml`.

### Resolver un bug

1. **Lee** el bug existente.
2. **Actualiza** `status: resolved`, `sprint_fixed: N`, `fix_flow: "FLOW-XXX"` si aplica.
3. **Modular:** edita `.flowdocs/bugs/BUG-XXX.yaml`.
4. **Legacy:** edita la entrada del bug en `flows.yaml`.

### Listar bugs

1. **Lee** todos los bugs y filtra por estado, módulo o severidad según el usuario pida.
2. **Presenta** tabla con id, title, severity, status, story, flow.

---

## REGLAS

- **IDs:** Siguen la secuencia del proyecto. Si el último bug es BUG-005, el nuevo es BUG-006.
- **Cross-refs obligatorias:** Todo bug debe tener al menos `story` o `flow` o `module`.
- **Severidad:** Usa `critical` para bugs que afectan dinero/datos, `high` para funcionalidad rota, `medium` para UX malo, `low` para cosméticos.
- **No borres bugs:** Solo cambia su estado. Los bugs `closed` son históricos.

---

## ENTREGA

### Modo modular:
1. **Crea/edita** `.flowdocs/bugs/BUG-XXX.yaml`.
2. **Actualiza** `manifest.yaml` si es nuevo.
3. **Resumen:** qué bug reportaste/actualizaste y sus cross-refs.

### Modo legacy:
1. **Edita** `.flowdocs/flows.yaml` (sección `bugs:`).
2. **Resumen:** qué bug reportaste/actualizaste.

El usuario puede recargar el viewer para ver los bugs en la pestaña Bugs y en los paneles de HU/flujo.
