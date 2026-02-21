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
  │     ├── expand.md
  │     ├── acceptance.md
  │     └── backlog.md
  └── README.md
```

## Lo que descarga `flowdocs init`

El CLI descarga desde `raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main/`:

- `viewer.html` → `.flowdocs/viewer.html`
- `.cursorrules` → `.flowdocs/.cursorrules` y raíz del proyecto
- `prompts/*.md` → `.flowdocs/prompts/*.md`

`flows.yaml` se genera localmente — **nunca se sobreescribe desde el repo**.

## Uso en cualquier proyecto

```bash
curl -fsSL https://raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main/install.sh | bash
```

Requiere Node 16+. Sin dependencias externas.

## Actualizar la versión

Cuando hagas cambios al viewer o los prompts:

1. Commitea y pushea al repo de GitHub
2. Los devs corren el comando de instalación en sus proyectos
3. Se actualiza viewer y prompts sin tocar `flows.yaml`

## Subir cambios y bajar en un proyecto (ej. sarchi)

Si tienes el repo **flowdocs** y un proyecto (ej. **sarchi**) en paralelo:

- **Subir cambios** (desde la raíz del repo flowdocs):
  ```bash
  cd flowdocs
  node bin/flowdocs.js publish
  ```
  Hace `git add -A`, `git commit -m "flowdocs: actualizar viewer y prompts"` y `git push`. Opcional: `flowdocs publish "mensaje custom"`.

- **Bajar en sarchi** (actualizar viewer y prompts desde el repo flowdocs local, sin tocar `flows.yaml`):
  ```bash
  cd sarchi
  node ../flowdocs/bin/flowdocs.js update --from ../flowdocs
  ```
  O con variable de entorno: `FLOWDOCS_SOURCE=../flowdocs node ../flowdocs/bin/flowdocs.js update`.

Así puedes probar cambios del viewer en flowdocs y llevarlos a sarchi sin pasar por GitHub.

## Desarrollo local

```bash
git clone https://github.com/emaildevelopmentteam1-a11y/flowdocs.git
cd flowdocs
node bin/flowdocs.js init     # prueba init en el directorio actual
node bin/flowdocs.js status   # prueba status
node bin/flowdocs.js update   # prueba update
```
