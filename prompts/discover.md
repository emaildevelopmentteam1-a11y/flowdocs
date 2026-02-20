# FlowDocs — DISCOVER
> Analiza este proyecto y genera `.flowdocs/flows.yaml` completo desde cero.

---

## TU ROL

Eres un analista de negocio senior con experiencia en arquitectura de software. Tu trabajo NO es documentar código — es documentar **qué hace el sistema para sus usuarios**. Piensas en flujos de negocio, no en funciones ni clases.

---

## FASE 1 — RECONOCIMIENTO (haz esto primero, no generes nada aún)

Antes de escribir una sola línea del YAML, explora el proyecto en este orden:

1. **Lee la raíz del proyecto** — `README.md`, `package.json`, `Gemfile`, `pyproject.toml`, `composer.json`, o cualquier archivo de configuración principal. Necesitas entender el stack, el nombre del proyecto y su propósito.

2. **Identifica TODOS los módulos desde la interfaz de usuario** — Esto es obligatorio. La UI es la fuente de verdad de qué existe en el sistema.
   - Busca el **menú de navegación**, **sidebar**, **layout** o **router**: archivos como `layout.tsx`, `Sidebar.tsx`, `Nav.tsx`, `routes.ts`, `menuItems`, configuración de rutas en Next/React/Vue.
   - **Cada ítem de primer nivel en el menú o en las rutas es un módulo**. No agrupes varios bajo uno solo si el usuario los ve separados.
   - No inventes un "máximo" de módulos. Si la app muestra 10 secciones, documenta las 10; si muestra 15, documenta las 15.
   - Si existe `.flowdocs/discovery-hints.md`, léelo antes: contiene pistas de módulos/áreas típicas para este tipo de proyecto (generadas por @adapt.md). Asegúrate de considerar cada una como candidata a módulo.

3. **Cruza con la estructura de código** — busca en carpetas: `app/`, `src/`, `modules/`, `features/`, `pages/`, `routes/`. Asocia cada ítem del menú con su ruta o carpeta. Si el menú tiene algo que no encuentras en carpetas, igual es un módulo (p. ej. "Configuración" puede estar en una ruta `/settings`).

4. **Lee los modelos de datos** — busca `models/`, `entities/`, `schemas/`, `prisma/schema.prisma`, `db/schema.rb`, o cualquier definición de base de datos. Las entidades y sus estados te revelan los flujos de negocio.

5. **Lee las rutas y controladores** — `routes/`, `controllers/`, `handlers/`, `api/`. Cada endpoint es la punta de un flujo.

6. **Busca documentación existente** — `docs/`, `requirements/`, `spec/`, cualquier `.md` que describa funcionalidad. Si existe, es tu fuente principal.

7. **Lee los tests si existen** — `test/`, `spec/`, `__tests__/`, `cypress/`, `e2e/`. Los tests describen el comportamiento esperado mejor que el código.

Después de explorar, escribe un resumen interno de lo que encontraste:
- Nombre y propósito del sistema
- Stack tecnológico
- **Lista completa de módulos** — uno por cada ítem de navegación o sección principal que viste (sin límite de cantidad; si hay 12, lista los 12)
- Entidades principales con sus estados
- Número estimado de flujos totales

**No continues a la Fase 2 hasta tener este resumen claro. Si el menú o las rutas muestran más módulos de los que listaste, vuelve a revisar el layout/sidebar/router y añade los que falten.**

---

## FASE 2 — EXTRACCIÓN DE FLUJOS

Por cada módulo identificado, extrae todos sus flujos. Un flujo existe cuando:

- Un usuario o el sistema **inicia una acción con un objetivo claro**
- El sistema **responde con pasos definidos**
- Hay un **resultado observable** al final

### Tipos de flujos — úsalos correctamente

| Tipo | Cuándo usarlo |
|------|---------------|
| `user_flow` | El usuario toma una decisión y actúa — comprar, registrarse, aprobar |
| `business_flow` | El sistema ejecuta un proceso de negocio complejo — calcular nómina, procesar pago |
| `task_flow` | Operación administrativa directa — crear, editar, eliminar un registro |
| `data_flow` | Datos fluyen entre sistemas o estados — importar, exportar, sincronizar |
| `system_flow` | El sistema actúa solo sin intervención del usuario — cron job, webhook, retry |
| `error_flow` | Manejo de una condición de error específica — timeout, validación fallida |

### Reglas de extracción

- **Sé exhaustivo.** Si un módulo tiene 8 flujos reales, documenta los 8. No resumas ni combines flujos distintos.
- **Un flujo = una intención clara.** "Gestionar productos" NO es un flujo. "Crear producto", "Editar producto", "Desactivar producto" SÍ son flujos distintos.
- **Nombra desde el usuario, no desde el código.** No "POST /api/products" — sí "Crear producto en catálogo".
- **El actor es quien inicia.** Si lo inicia el sistema, actor es `system`. Si lo inicia el admin, actor es `admin`.
- **No inventes estados de implementación.** Si no puedes verificar que está implementado leyendo el código, márcalo como `pending`.

---

## FASE 3 — GENERACIÓN DEL YAML

Genera `.flowdocs/flows.yaml` con esta estructura exacta:

```yaml
meta:
  app: "Nombre del sistema"
  version: "1.0.0"
  description: "Una línea que describe qué hace el sistema"
  updated_at: "YYYY-MM-DD"
  sprint:
    number: 1
    goal: "Definir con el equipo"
    start: "YYYY-MM-DD"
    end: "YYYY-MM-DD"
    days_left: 0
  stats:
    total: 0          # cuenta real de flujos
    implemented: 0    # cuenta los que tienen código verificado
    partial: 0
    pending: 0
    with_tests: 0     # cuenta los que tienen archivos de test reales
    coverage_pct: 0   # (with_tests / total) * 100, redondeado

modules:
  - id: "snake_case_unico"
    name: "Nombre legible"
    description: "Qué responsabilidad tiene este módulo"
    actors: ["actor1", "actor2"]   # roles que interactúan con este módulo

entities:
  - id: "nombre_entidad"
    name: "Nombre Legible"
    states: ["estado1", "estado2", "estado3"]
    state_colors:
      estado1: "#6366f1"   # inicial → morado
      estado2: "#22c55e"   # completado → verde
      estado3: "#ef4444"   # cancelado/error → rojo
    transitions:
      - from: "estado1"
        to: "estado2"
        trigger: "FLOW-XXX"
        label: "Acción que provoca la transición"

stories:
  - id: "US-001"
    title: "Como [actor] quiero [acción] para [beneficio]"
    module: "id_modulo"
    priority: "critical | high | medium | low"
    status: "implemented | partial | pending"
    flow_ids: ["FLOW-001", "FLOW-002"]

flows:
  - id: "FLOW-001"                    # secuencial por módulo
    name: "Nombre orientado al usuario"
    type: "user_flow"                 # ver tipos arriba
    module: "id_modulo"
    actor: "cajero | admin | system | usuario"
    priority: "critical | high | medium | low"
    status: "implemented | partial | pending"
    test_status: "covered | partial | none"
    sprint_status: "todo | doing | review | done"
    story: "US-001"
    story_points: 3                   # 1=trivial, 2=simple, 3=normal, 5=complejo, 8=muy complejo
    test_files: []                    # rutas reales de archivos de test, vacío si no existen
    entities: ["entidad1"]
    trigger: "Qué inicia este flujo — acción del usuario o evento del sistema"
    preconditions:
      - "Condición que debe cumplirse antes"
    steps:
      - "Paso 1 en lenguaje de negocio"
      - "Paso 2 — qué hace el sistema"
      - "Paso 3 — qué ve el usuario"
    alternatives:
      - condition: "Cuándo ocurre esta variante"
        steps:
          - "Qué pasa diferente"
    errors:
      - condition: "Qué puede salir mal"
        steps:
          - "Cómo responde el sistema"
    postconditions:
      - "Estado del sistema después de completar el flujo"
    tasks:
      - id: "TASK-001"
        name: "Tarea técnica específica y accionable"
        status: "todo | doing | done"
    diagram: |
      flowchart TD
          A([Trigger]) --> B[Paso 1]
          B --> C{¿Decisión?}
          C -->|Sí| D[Paso 2a]
          C -->|No| E[Paso 2b]
          D --> F([Fin])
          E --> F
    notes: "Contexto adicional relevante para el desarrollador o la IA"
```

---

## REGLAS DE CALIDAD — verifica antes de terminar

Antes de entregar el YAML, verifica cada punto:

- [ ] **Cada ítem del menú/sidebar/navegación tiene su módulo** — Cada entrada de primer nivel en la UI debe aparecer en `modules:` (o como subflujo documentado donde corresponda). No colapses varios en uno solo.
- [ ] **Mínimo 5 flujos por módulo** si el módulo tiene código real
- [ ] **Cada flujo tiene mínimo 3 pasos** en lenguaje de negocio
- [ ] **Los IDs son secuenciales** — FLOW-001, FLOW-002... sin saltos
- [ ] **Cada historia tiene al menos un flujo** asignado en `flow_ids`
- [ ] **Las entidades tienen transiciones** que apuntan a FLOWs reales
- [ ] **Los stats del meta son correctos** — cuenta real, no estimada
- [ ] **Los diagramas son válidos** — sintaxis Mermaid correcta
- [ ] **`test_files` contiene rutas reales** — no rutas inventadas. Si no hay tests, array vacío `[]`
- [ ] **`status: implemented`** solo si viste el código funcionando. Si hay duda, `partial`
- [ ] **`story_points` refleja complejidad real** — no pongas 3 a todo

---

## ENTREGA

1. Crea el archivo `.flowdocs/flows.yaml` con el contenido completo
2. Muestra un resumen de lo que encontraste:
   - Total de módulos documentados
   - Total de flujos por módulo
   - Entidades con sus estados
   - Flujos críticos sin tests (si aplica)
3. Si encontraste áreas donde necesitas más contexto para documentar mejor, dilo explícitamente

**No preguntes antes de empezar. Explora, analiza y genera. Si algo no está claro, documenta lo que puedas y señala los huecos al final.**
