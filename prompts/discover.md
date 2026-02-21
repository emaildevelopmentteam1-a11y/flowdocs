# FlowDocs — DISCOVER
> Lee la aplicación como un arquitecto: con orden, notas y un plan de seguimiento. Sin notas y sin plan, el contexto se pierde y solo se entrega una parte.

---

## TU ROL (arquitecto de software + ejecución en IA)

Eres un arquitecto de software. Tu trabajo es **leer** la aplicación de principio a fin, **anotar** lo que encuentras para no perderlo, y **documentar** en `.flowdocs/flows.yaml` qué hace el sistema para sus usuarios.

**Cómo debe comportarse la IA:** No puedes “recordar” todo el proyecto en una sola pasada. Si lees todo en la cabeza y al final generas solo el YAML, perderás contexto y entregarás una parte. Por eso **obligatorio**: construir primero las notas (sección por sección) y el plan, escribirlos en archivos, y **solo después** generar el YAML desde esas notas. Las notas son tu memoria externa; el plan es el seguimiento removible para esta y las siguientes sesiones. Sin escribir los 3 archivos (notas, plan, YAML), la entrega no es válida.

---

## POR DÓNDE EMPIEZA Y POR DÓNDE TERMINA UNA LECTURA DE APLICACIÓN

**Empieza por:** qué es el sistema (propósito, stack) y **el mapa de la aplicación** — qué “habitaciones” tiene (navegación, rutas). Ese mapa es tu índice: todo lo que esté ahí debe ser visitado y anotado.

**Sigue con:** para cada habitación del mapa, qué carpetas/archivos la implementan, qué datos toca y qué flujos tiene. Vas anotando en un mismo sitio (notas) para no perder nada.

**Termina cuando:** cada ítem del mapa tiene su entrada en las notas y en el plan, y el YAML refleja eso. Si algo del mapa no está en las notas ni en el plan, la lectura no está terminada.

**Dónde está el mapa (concreto para la IA):** Busca en el codebase archivos que contengan `navItems`, `sidebar`, `menuItems`, `routes` o un array de navegación. Abre el archivo que define el menú (p. ej. `Sidebar.tsx`, `Nav.tsx`, `Layout.tsx`, `routes.ts`). La lista de ítems que veas ahí (nombre + href/path) es tu mapa. No inventes el mapa; debe salir de ese archivo.

---

## ARTEFACTOS OBLIGATORIOS (no opcionales)

Debes crear o actualizar estos archivos. Sin ellos, la documentación se pierde o queda a medias.

### 1. `.flowdocs/discovery-notes.md` — Notas de lectura

Archivo donde anotas **mientras lees**. Si no anotas, el contexto se pierde entre pasos. Estructura sugerida:

```markdown
# Notas de descubrimiento — [nombre del proyecto]
Fecha: YYYY-MM-DD

## 1. Entrada
- Propósito del sistema (una línea).
- Stack (frameworks, lenguaje).
- Fuente: README, package.json, etc.

## 2. Mapa de la aplicación (navegación)
Lista exacta de ítems del menú/sidebar/rutas con nombre y ruta (href/path).
Cada ítem es un área a cubrir. Origen: Sidebar.tsx / Nav / routes / etc.

| Área (nombre en UI) | Ruta | Carpeta/archivos que lo implementan |
|--------------------|------|--------------------------------------|
| ...                | ...  | ...                                  |

## 3. Estructura por área
Por cada ítem del mapa: qué carpetas en app/, src/, pages/, etc. corresponden.
Breve qué hace (leyendo página principal o componente).

## 4. Modelo de datos (TODAS las entidades)
**Obligatorio:** Busca y lista **cada** entidad/tabla/modelo del sistema. No documentes solo una (ej. "sale"). Busca en: `schema.ts`, `schema.js`, `prisma/schema.prisma`, `models/`, `types/`, definiciones de tablas (Drizzle, TypeORM, Sequelize), tipos TypeScript de dominio. Cada entidad: nombre, estados posibles (si aplica), dónde se define. Si el código tiene product, order, customer, category, sale, cash_session, printer, etc., **todas** deben aparecer aquí. El YAML tendrá una entrada en `entities:` por cada una.

## 5. Flujos por área (exhaustivo)
Por cada área del mapa: lista **todos** los flujos que identificaste (no solo uno o dos). Fuente: pantallas, botones, handlers, API, tests. Un flujo = una acción con inicio y fin (ej. "Crear producto", "Editar categoría", "Ver historial de ventas", "Cerrar caja"). Si un módulo tiene varias pantallas o acciones, debe tener varios flujos. No dejes módulos con 0 o 1 flujo si el código tiene más.

## 6. Pendientes / dudas
Lo que no pudo leerse o queda para profundizar después.
```

**Cómo hacerlo en una sola ejecución:** Completa mentalmente o en tu respuesta cada sección (1 → 2 → 3 → 4 → 5 → 6) según avances en la lectura. **Antes de generar el YAML**, escribe el archivo `discovery-notes.md` completo con todas las secciones llenas. No generes el YAML hasta tener las notas completas; si generas el YAML sin haber escrito antes las notas, es muy probable que falten módulos o flujos.

### 2. `.flowdocs/doc-plan.md` — Plan de documentación (seguimiento removible)

Plan para **seguimiento**: qué está documentado, qué falta. Sirve para retomar en otra sesión o para que otro agente sepa por dónde seguir.

```markdown
# Plan de documentación — [nombre del proyecto]
Última actualización: YYYY-MM-DD

## Cobertura por área (según mapa de navegación)

| Área | En notas | En flows.yaml (módulo) | Flujos documentados | Estado |
|------|----------|------------------------|---------------------|--------|
| [nombre] | sí/no | id módulo o — | FLOW-XXX, ... o — | pendiente / en progreso / documentado |

## Próximos pasos (si la sesión se corta o se retoma)
- [ ] Áreas aún sin visitar.
- [ ] Áreas visitadas pero sin flujos en el YAML.
- [ ] Revisar consistencia meta/stats.
```

Al terminar discover, actualiza el estado de cada área a "documentado" o indica qué falta. Este archivo es el “plan removible”: se puede abrir en la siguiente conversación y decir “continúa desde doc-plan.md”.

---

## ORDEN DE LECTURA (respétalo; es el guion que evita perder contexto)

1. **Entrada** — Lee README, package.json (o equivalente). Completa sección 1 de las notas (Entrada).
2. **Mapa** — Busca el archivo del menú (navItems, sidebar, routes). Transcribe en sección 2 de las notas la lista completa: nombre + ruta. Crea `doc-plan.md` con una fila por ítem del mapa, estado "pendiente".
3. **Estructura por área** — Por cada ítem del mapa, localiza la carpeta que lo implementa (app/, src/app/, pages/). Completa sección 3 de las notas. Actualiza doc-plan ("en notas" = sí).
4. **Modelo de datos** — Busca **todas** las entidades (schema, prisma, models, types). Completa sección 4 con **cada** entidad encontrada; si solo anotas una, el YAML quedará incompleto.
5. **Flujos por área** — Por cada área, lista **todos** los flujos (crear, editar, listar, aprobar, etc.). Completa sección 5 y la columna "Flujos documentados" del doc-plan. Módulos con varias pantallas = varios flujos.
6. **Escribir notas y plan** — **Ahora sí** escribe los archivos `.flowdocs/discovery-notes.md` y `.flowdocs/doc-plan.md` con todo lo anterior. No pases al paso 7 sin haber escrito estos dos archivos.
7. **Generación del YAML** — A partir de las notas y del plan, escribe `.flowdocs/flows.yaml` completo. Cada área del mapa (sección 2 de las notas) debe tener su módulo en el YAML; no agrupes dos áreas en un solo módulo si tienen rutas distintas. Excepción: dos ítems con la misma ruta base (ej. /cash-register y /cash-register/history) pueden ser un módulo "Caja".
8. **Cierre** — Actualiza `doc-plan.md` con estado "documentado" por área y "Próximos pasos" si algo quedó pendiente.

---

## GENERACIÓN DEL YAML

Estructura exacta para `.flowdocs/flows.yaml`:

```yaml
meta:
  app: "Nombre del sistema"
  version: "1.0.0"
  description: "Una línea que describe qué hace el sistema"
  updated_at: "YYYY-MM-DD"
  # Sprint activo (formato simple: un solo sprint)
  sprint:
    number: 1
    goal: "Definir con el equipo"
    start: "YYYY-MM-DD"
    end: "YYYY-MM-DD"
    days_left: 0
  # Opcional: varios sprints (ir subiendo historial). El viewer muestra el que coincida con active_sprint.
  # sprints:
  #   - number: 1
  #     goal: "MVP inicial"
  #     start: "2026-01-01"
  #     end: "2026-01-14"
  #     days_left: 0
  #   - number: 2
  #     goal: "Estabilización"
  #     start: "2026-02-15"
  #     end: "2026-02-28"
  #     days_left: 9
  # active_sprint: 2
  stats:
    total: 0
    implemented: 0
    partial: 0
    pending: 0
    with_tests: 0      # número de flujos con test_status covered o partial (cobertura por flujo)
    coverage_pct: 0    # (with_tests / total) * 100. Cobertura por criterios = criterios con validated: true (el viewer lo muestra aparte).

modules:
  - id: "snake_case_unico"
    name: "Nombre legible"
    description: "Descripción de 2-4 líneas: qué hace el módulo, qué pantallas principales tiene, qué responsabilidad tiene. No una sola frase genérica."
    actors: ["actor1", "actor2"]

entities:
  # OBLIGATORIO: una entrada por cada entidad de la sección 4 de las notas. Si el código tiene product, order, customer, category, sale, cash_session, etc., todas deben estar aquí con sus states y transitions.
  - id: "nombre_entidad"
    name: "Nombre Legible"
    states: ["estado1", "estado2"]
    state_colors: {}   # opcional
    transitions: []

stories:
  - id: "US-001"
    title: "Como [rol] quiero [objetivo] para [beneficio]."
    module: "id_modulo"
    priority: "critical | high | medium | low"
    status: "implemented | partial | pending"
    sprint: 1   # opcional: número de sprint; sin sprint = backlog sin asignar. El viewer filtra Backlog/Tablero por sprint.
    flow_ids: ["FLOW-001", "FLOW-002"]   # todos los flujos de la HU
    acceptance_criteria:
      - id: "AC-001"
        description: "Criterio comprobable 1 (Given/When/Then)"
        validated: false
        flow_ids: ["FLOW-001"]            # flujos que satisfacen ESTE criterio
        # evidence: ["evidence/stories/US-001/AC-001.png"]   # opcional: captura o vídeo. Ver prompts/evidence.md
      - id: "AC-002"
        description: "Criterio 2"
        validated: true
        flow_ids: ["FLOW-001", "FLOW-002"]
      # ... mínimo 8 criterios. validated = criterio cubierto por test. evidence = rutas relativas a .flowdocs/. La HU está done cuando todos tienen validated: true.

flows:
  - id: "FLOW-001"
    name: "Nombre orientado al usuario"
    type: "user_flow | business_flow | task_flow | data_flow | system_flow | error_flow"
    module: "id_modulo"
    actor: "admin | cajero | system | usuario"
    priority: "critical | high | medium | low"
    status: "implemented | partial | pending"
    test_status: "covered | partial | none"   # cobertura por flujo: hay tests que ejercitan este flujo
    test_files: []                            # rutas a specs (ej. src/tests/e2e/checkout.spec.ts)
    test_evidence: []                         # opcional: capturas/vídeo de ejecución. Rutas relativas a .flowdocs/ (ej. evidence/flows/FLOW-001/run.png). Ver prompts/evidence.md
    sprint_status: "todo | doing | review | done"
    story: "US-001"
    story_points: 1
    entities: []
    trigger: "Qué inicia este flujo"
    preconditions: []
    steps: []
    alternatives: []
    errors: []
    postconditions: []
    tasks: []
    diagram: ""
    notes: ""
```

- **Módulos:** Uno por cada ítem del mapa. Descripción rica (2-4 líneas), no una frase genérica.
- **Entities:** Debe incluir **todas** las entidades de la sección 4 de las notas. Si en el código hay 6 u 8 entidades, el YAML debe tener 6 u 8 entradas en `entities:`. No documentes solo "sale" u otra sola.
- **Stories:** Agrupa flujos en historias de usuario. Cada historia tiene `flow_ids` y `acceptance_criteria`: mínimo 8 criterios comprobables. Formato: string, o `{ text: "...", validated_by: "ruta/spec.ts" }` (el viewer marca ✓ cuando esa ruta está en `test_files` de algún flujo). Opcionalmente puedes usar el formato extendido: `{ id: "AC-001", description: "...", validated: true|false, flow_ids: ["FLOW-001", ...] }` — entonces el criterio muestra qué flujos lo implementan y la HU está done cuando todos tienen `validated: true`.
- **Flujos:** Extrae de las notas (sección 5). Un flujo = una intención clara. Por cada módulo, tantos flujos como acciones hayas identificado (mínimo varios por módulo si el código tiene varias pantallas/acciones). Mínimo 3 pasos por flujo en lenguaje de negocio.
- **Stats:** Recalcula total, implemented, partial, pending, with_tests, coverage_pct al final.

---

## REGLAS DE CALIDAD

- Cada ítem del **mapa** (discovery-notes sección 2) tiene su módulo en el YAML o está justificado en el plan (ej. agrupado por ruta).
- Las notas y el plan están actualizados antes de entregar; no entregues solo el YAML sin notas ni plan.
- No inventes flujos que no anotaste; si algo no se leyó, márcalo en "Pendientes" en las notas y en doc-plan.
- Si la sesión se corta, doc-plan debe permitir retomar: qué áreas faltan, qué flujos faltan.

---

## ENTREGA

**Debes escribir exactamente estos 3 archivos en el workspace** (con write/edit). Describir el contenido en el chat no cuenta como entrega.

1. `.flowdocs/discovery-notes.md` — Notas completas (secciones 1–6).
2. `.flowdocs/doc-plan.md` — Tabla por área + próximos pasos.
3. `.flowdocs/flows.yaml` — YAML completo.

**Orden de escritura recomendado:** primero discovery-notes.md, luego doc-plan.md, luego flows.yaml. Así el YAML se apoya en las notas ya persistidas.

**Resumen en chat:** Qué anotaste en el mapa (áreas y nombres), qué quedó documentado y qué pendiente (según doc-plan). Si algo no pudo leerse, dilo y anótalo en Pendientes.

---

## CHECKLIST ANTES DE ENTREGAR (autoverificación)

- [ ] Escribí los 3 archivos (notas, plan, flows.yaml). No solo los describí.
- [ ] El mapa en las notas (sección 2) viene del archivo real del menú (Sidebar/Nav/routes).
- [ ] Cada ítem del mapa tiene su módulo en `flows.yaml` con descripción de 2-4 líneas.
- [ ] Cada **story** tiene `acceptance_criteria` con al menos 8 criterios comprobables.
- [ ] **Cada entidad** de la sección 4 de las notas tiene su entrada en `entities:` del YAML (no solo una).
- [ ] Cada módulo tiene **varios flujos** documentados si el código tiene varias acciones/pantallas.
- [ ] doc-plan.md tiene una fila por área y el estado final actualizado.

Si falla alguno, completa antes de dar por terminado. No preguntes antes de empezar; sigue el orden: entrada → mapa → estructura por área → modelo → flujos → **escribir notas y plan** → YAML → cierre del plan.

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden de escritura:** discovery-notes.md → doc-plan.md → flows.yaml. No generes el YAML sin haber escrito antes las notas y el plan.
2. **Estructura del YAML:** `meta` (app, version, description, updated_at, sprint, stats) → `modules` → `entities` → `stories` (id, title, module, priority, flow_ids, acceptance_criteria) → `flows` (id, name, type, module, actor, steps, etc.). Recalcula `meta.stats` al final.
3. **Para el viewer:** Tras escribir `flows.yaml`, el usuario debe abrir o recargar el viewer (`flowdocs open` o botón Recargar) para ver la documentación actualizada.
