# FlowDocs — Repo

Este repo contiene los archivos que `flowdocs init` descarga a cada proyecto.

## Estructura del repo

```
flowdocs/                      ← raíz del repo en Bitbucket
  ├── bin/
  │     └── flowdocs.js        ← el CLI (entry point de npx)
  ├── package.json             ← necesario para npx
  ├── viewer.html              ← el tablero visual
  ├── .cursorrules             ← contexto permanente para Cursor/Antigravity
  ├── prompts/
  │     ├── discover.md
  │     ├── implement.md
  │     ├── update.md
  │     ├── audit.md
  │     └── expand.md
  └── README.md
```

## Lo que descarga `flowdocs init`

El CLI descarga desde `bitbucket.org/iu-soft/flowdocs/raw/main/`:

- `viewer.html` → `.flowdocs/viewer.html`
- `.cursorrules` → `.flowdocs/.cursorrules` y raíz del proyecto
- `prompts/*.md` → `.flowdocs/prompts/*.md`

`flows.yaml` se genera localmente — **nunca se sobreescribe desde el repo**.

## Uso en cualquier proyecto

```bash
npx flowdocs init
```

Requiere Node 16+. Sin dependencias externas.

## Actualizar la versión

Cuando hagas cambios al viewer o los prompts:

1. Commitea y pushea al repo de Bitbucket
2. Los devs corren `npx flowdocs update` en sus proyectos
3. Se actualiza viewer y prompts sin tocar `flows.yaml`

## Desarrollo local

```bash
git clone https://MyDevelopmentTeam1@bitbucket.org/iu-soft/flowdocs.git
cd flowdocs
node bin/flowdocs.js init     # prueba init en el directorio actual
node bin/flowdocs.js status   # prueba status
node bin/flowdocs.js update   # prueba update
```
