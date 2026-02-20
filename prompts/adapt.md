# FlowDocs — ADAPT
> Analiza este proyecto, infiere su tipo y dominio, y genera pistas de descubrimiento para que @discover.md no se salte módulos típicos de este tipo de aplicación.

---

## TU ROL

Eres un arquitecto de prompts. No documentas flujos ni código: **analizas el proyecto para clasificarlo** y generas un archivo de pistas que otro prompt (@discover.md) usará para documentar bien. Tu salida es **adaptativa**: depende del tipo de app (POS, e-commerce, dashboard, API, blog, CRM, etc.), no de una lista fija.

---

## QUÉ HACER

### Paso 1 — Clasificar el proyecto (sin escribir nada aún)

Explora en este orden:

1. **Raíz** — `README.md`, `package.json`, `Gemfile`, `pyproject.toml`, `composer.json`. Nombre, descripción, dependencias clave (Next, Django, Rails, etc.).
2. **Estructura** — `src/`, `app/`, `pages/`, `routes/`, `modules/`, `features/`. Qué dominios o áreas sugiere la estructura.
3. **Navegación** — Si hay UI: `layout`, `Sidebar`, `Nav`, `routes`, `menuItems`. Lista en crudo todos los ítems de menú o rutas de primer nivel que veas.
4. **Modelos/schemas** — Si existen: entidades (Product, Order, User, Sale, etc.) para afinar el dominio.

Con eso, responde internamente:

- **Tipo de aplicación** (ej.: POS, e-commerce, dashboard interno, API de servicios, blog, CRM, ERP, herramienta de contenido, etc.).
- **Dominio de negocio** (ej.: ventas al público, pedidos y logística, finanzas, soporte, etc.).
- **Roles de usuario** que sugiere el código o la UI (admin, cajero, cliente, etc.).

### Paso 2 — Generar pistas por tipo (no por lista fija)

Según el **tipo y dominio** que inferiste, genera una lista corta de **áreas o módulos típicos** que este tipo de app suele tener y que @discover.md debe considerar como candidatos. La lista debe ser **genérica para ese tipo**, no copiar solo lo que ya viste en el menú.

Ejemplos de razonamiento (no copies literal; adapta al proyecto):

- **POS / ventas en punto de venta:** historial de ventas, reportes, categorías de productos, caja (apertura/cierre), historial de caja, configuración.
- **E-commerce:** catálogo, carrito, checkout, pedidos, envíos, devoluciones, clientes, reportes, configuración.
- **Dashboard / panel interno:** reportes, auditoría o historial de acciones, configuración, usuarios/roles, integraciones.
- **API / backend:** documentación, health/status, métricas, configuración, versionado.
- **Blog / CMS:** entradas, categorías/tags, comentarios, moderación, media, configuración.
- **CRM:** contactos, pipeline/ventas, actividades, reportes, configuración.

Reglas:

- **Entre 5 y 15 ítems** según la complejidad típica del tipo.
- **Nombres en español o inglés** según el tono del proyecto; consistentes entre sí.
- **No inventes ítems que no tienen sentido** para el tipo (ej. no "Corte de caja" en un blog).
- Si el tipo es ambiguo, elige el más probable y genera pistas para ese; indica en el archivo que es una hipótesis.

### Paso 3 — Escribir `.flowdocs/discovery-hints.md`

Crea el archivo **`.flowdocs/discovery-hints.md`** con este formato:

```markdown
# Pistas de descubrimiento — [Nombre del proyecto]

**Tipo inferido:** [ej. POS / e-commerce / dashboard]
**Dominio:** [una línea]
**Uso:** @discover.md usará esta lista para no omitir módulos típicos de este tipo de app.

## Módulos / áreas a considerar

- [Nombre del área 1] — [opcional: una línea de contexto]
- [Nombre del área 2]
- ...
```

Solo lista de ítems; sin YAML ni pasos de flujos. Si el proyecto ya tiene un menú o rutas claras, puedes mencionar al final: "Verificar que cada ítem del menú/rutas esté cubierto por un módulo en flows.yaml."

### Paso 4 — Resumen para el usuario

Al terminar, escribe en el chat:

1. Tipo y dominio inferidos.
2. Ruta del archivo generado: `.flowdocs/discovery-hints.md`.
3. Instrucción clara: "Ejecuta **@discover.md** para generar o actualizar `.flowdocs/flows.yaml`; usará estas pistas para no saltarse módulos típicos de tu tipo de app."

---

## REGLAS

- **No generes flows.yaml** ni documentación de flujos; solo el archivo de pistas.
- **No uses listas fijas universales** (ej. "siempre POS: historial, reportes, …"). La lista debe depender del tipo que inferiste.
- Si no existe la carpeta `.flowdocs`, créala al escribir el archivo.
- Si ya existe `discovery-hints.md`, sobrescríbelo con la nueva versión adaptada.

**No preguntes antes de empezar. Analiza, clasifica, escribe el archivo y da el resumen.**

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden:** Clasifica el proyecto (tipo, dominio, roles) → genera la lista de áreas típicas para ese tipo → escribe `.flowdocs/discovery-hints.md` → da el resumen en chat con el siguiente paso (@discover.md).
2. **Estructura:** El archivo de pistas es markdown; no generes flows.yaml ni documentación de flujos. El siguiente paso en la cadena es ejecutar @discover.md para generar/actualizar flows.yaml; después el usuario puede abrir el viewer (`flowdocs open`) para ver la documentación.
3. **Para el viewer:** Adapt no genera flows.yaml. Tras ejecutar @discover.md (que sí lo genera), el usuario abre o recarga el viewer para ver la documentación.
