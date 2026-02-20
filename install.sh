#!/usr/bin/env bash
set -e

REPO="https://raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main"
FLOWDOCS_DIR=".flowdocs"
PROMPTS_DIR=".flowdocs/prompts"

RESET="\033[0m"; BOLD="\033[1m"; GREEN="\033[32m"; CYAN="\033[36m"
YELLOW="\033[33m"; RED="\033[31m"; GRAY="\033[90m"; DIM="\033[2m"

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
err()  { echo -e "  ${RED}✗${RESET} $1"; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
dim()  { echo -e "  ${GRAY}${DIM}$1${RESET}"; }

if ! command -v curl &>/dev/null; then err "curl no está instalado"; exit 1; fi
if ! command -v node &>/dev/null; then warn "Node.js no encontrado — instala desde nodejs.org"; fi

if [ ! -f "package.json" ] && [ ! -f "Gemfile" ] && [ ! -f "composer.json" ] && \
   [ ! -f "pyproject.toml" ] && [ ! -f "Cargo.toml" ] && [ ! -d ".git" ]; then
  warn "No se detectó un proyecto en este directorio"
  read -p "  ¿Continuar de todas formas? (s/N) " -n 1 -r; echo ""
  [[ ! $REPLY =~ ^[Ss]$ ]] && exit 0
fi

if [ -d "$FLOWDOCS_DIR" ]; then
  warn ".flowdocs/ ya existe — usa 'flowdocs update' para actualizar"
  echo ""; exit 0
fi

echo ""
echo -e "  ${BOLD}${CYAN}FlowDocs${RESET} — instalando en ${BOLD}$(basename $PWD)${RESET}"
echo ""

mkdir -p "$FLOWDOCS_DIR" "$PROMPTS_DIR" "$FLOWDOCS_DIR/bin"

download() {
  local dest="$2"
  mkdir -p "$(dirname $dest)"
  if curl -fsSL "$REPO/$1" -o "$dest" 2>/dev/null; then ok "$dest"
  else err "$dest — fallo al descargar"; fi
}

echo -e "  ${DIM}Descargando archivos...${RESET}"; echo ""
download "viewer.html"          "$FLOWDOCS_DIR/viewer.html"
download "bin/flowdocs.js"      "$FLOWDOCS_DIR/bin/flowdocs.js"
download "prompts/discover.md"  "$PROMPTS_DIR/discover.md"
download "prompts/implement.md" "$PROMPTS_DIR/implement.md"
download "prompts/update.md"    "$PROMPTS_DIR/update.md"
download "prompts/audit.md"     "$PROMPTS_DIR/audit.md"
download "prompts/expand.md"    "$PROMPTS_DIR/expand.md"
[ -f "$FLOWDOCS_DIR/bin/flowdocs.js" ] && chmod +x "$FLOWDOCS_DIR/bin/flowdocs.js"

# Detectar nombre del proyecto
PROJECT_NAME=$(basename "$PWD")
if [ -f "package.json" ] && command -v node &>/dev/null; then
  PKG=$(node -e "try{console.log(require('./package.json').name)}catch(e){}" 2>/dev/null)
  [ -n "$PKG" ] && PROJECT_NAME="$PKG"
fi
TODAY=$(date +%Y-%m-%d)

# Crear flows.yaml
cat > "$FLOWDOCS_DIR/flows.yaml" << YAML
meta:
  app: "$PROJECT_NAME"
  version: "0.1.0"
  description: "Descripción del sistema"
  updated_at: "$TODAY"
  sprint:
    number: 1
    goal: "Documentar el proyecto con @discover.md"
    start: "$TODAY"
    end: "$TODAY"
    days_left: 0
  stats:
    total: 0
    implemented: 0
    partial: 0
    pending: 0
    with_tests: 0
    coverage_pct: 0
modules: []
entities: []
stories: []
flows: []
YAML
ok "$FLOWDOCS_DIR/flows.yaml"

# Contenido de contexto compartido entre editores
read -r -d '' CONTEXT << 'CONTEXT_END' || true
# FlowDocs — Contexto Permanente

Este proyecto usa FlowDocs. `.flowdocs/flows.yaml` es la fuente de verdad.

## Siempre

- Lee `.flowdocs/flows.yaml` al inicio de cualquier tarea de desarrollo
- Sigue los `steps` del flujo al implementar — no improvises
- Al terminar una implementación, actualiza `status` y `sprint_status` en el YAML

## Nunca

- Implementar funcionalidad sin flujo documentado (pregunta primero)
- Marcar `implemented` si hay funcionalidad core faltante
- Inventar rutas de archivos de test

## Comandos disponibles

| Archivo | Qué hace |
|---------|----------|
| `.flowdocs/prompts/discover.md`   | Documenta el proyecto desde cero |
| `.flowdocs/prompts/implement.md`  | Implementa un flujo específico |
| `.flowdocs/prompts/update.md`     | Actualiza estado de flujos |
| `.flowdocs/prompts/audit.md`      | Encuentra inconsistencias |
| `.flowdocs/prompts/expand.md`     | Profundiza en un módulo |
CONTEXT_END

echo ""
echo -e "  ${DIM}Configurando editores...${RESET}"; echo ""

# CURSOR
if [ ! -f ".cursorrules" ]; then
  echo "$CONTEXT" > ".cursorrules"
  ok ".cursorrules  ${GRAY}(Cursor)${RESET}"
else
  warn ".cursorrules ya existe — no sobreescrito  ${GRAY}(Cursor)${RESET}"
fi

# ANTIGRAVITY
mkdir -p ".agent/skills/flowdocs" ".agent/workflows"
cat > ".agent/skills/flowdocs/SKILL.md" << 'SKILL'
# FlowDocs Skill

Este proyecto usa FlowDocs. `.flowdocs/flows.yaml` es la fuente de verdad.

## Siempre
- Lee `.flowdocs/flows.yaml` antes de implementar cualquier cosa
- Sigue los `steps` del flujo — no improvises
- Al terminar, actualiza `status` y `sprint_status` en el YAML

## Nunca
- Implementar sin flujo documentado (pregunta primero)
- Marcar `implemented` si falta funcionalidad core
- Inventar rutas de test

## Workflows
- `flowdocs-discover`   — documentar proyecto desde cero
- `flowdocs-implement`  — implementar un flujo
- `flowdocs-update`     — actualizar estado
- `flowdocs-audit`      — auditar inconsistencias
- `flowdocs-expand`     — profundizar en un módulo
SKILL
ok ".agent/skills/flowdocs/SKILL.md  ${GRAY}(Antigravity)${RESET}"

for p in discover implement update audit expand; do
  cp "$PROMPTS_DIR/${p}.md" ".agent/workflows/flowdocs-${p}.md" 2>/dev/null && true
done
ok ".agent/workflows/  ${GRAY}(Antigravity — 5 workflows)${RESET}"

# CLAUDE CODE
if [ ! -f "CLAUDE.md" ]; then
  echo "$CONTEXT" > "CLAUDE.md"
  ok "CLAUDE.md  ${GRAY}(Claude Code)${RESET}"
elif ! grep -q "FlowDocs" "CLAUDE.md" 2>/dev/null; then
  echo "" >> "CLAUDE.md"
  echo "$CONTEXT" >> "CLAUDE.md"
  ok "CLAUDE.md actualizado  ${GRAY}(Claude Code)${RESET}"
else
  warn "CLAUDE.md ya tiene FlowDocs — no modificado  ${GRAY}(Claude Code)${RESET}"
fi

# .gitignore
if [ -f ".gitignore" ] && ! grep -q "FlowDocs" ".gitignore" 2>/dev/null; then
  printf '\n# FlowDocs\n.flowdocs/viewer.html\n.flowdocs/prompts/\n.flowdocs/bin/\n' >> ".gitignore"
  ok ".gitignore actualizado"
fi

# Comando global
if command -v node &>/dev/null; then
  mkdir -p "$HOME/.flowdocs/bin" "$HOME/.local/bin"
  cp "$FLOWDOCS_DIR/bin/flowdocs.js" "$HOME/.flowdocs/bin/flowdocs.js"
  printf '#!/usr/bin/env bash\nnode "$HOME/.flowdocs/bin/flowdocs.js" "$@"\n' > "$HOME/.local/bin/flowdocs"
  chmod +x "$HOME/.local/bin/flowdocs"

  SHELL_RC="${HOME}/.zshrc"
  [ ! -f "$SHELL_RC" ] && SHELL_RC="${HOME}/.bashrc"
  if [ -f "$SHELL_RC" ] && ! grep -q '\.local/bin' "$SHELL_RC" 2>/dev/null; then
    printf '\n# FlowDocs CLI\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$SHELL_RC"
  fi
  export PATH="$HOME/.local/bin:$PATH"
  ok "comando 'flowdocs' instalado globalmente"
fi

echo ""
echo -e "  ${BOLD}¡Listo!${RESET} FlowDocs instalado en ${CYAN}$(basename $PWD)${RESET}"
echo ""
echo -e "  ${BOLD}Editores configurados:${RESET}"
dim "Cursor       → .cursorrules"
dim "Antigravity  → .agent/skills/flowdocs/ + .agent/workflows/"
dim "Claude Code  → CLAUDE.md"
echo ""
echo -e "  ${BOLD}Primer paso — abre tu editor y escribe:${RESET}"
echo -e "  ${BOLD}  @discover.md${RESET}"
echo ""
echo -e "  ${BOLD}Comandos de terminal:${RESET}"
echo -e "  ${CYAN}flowdocs status${RESET}   resumen del proyecto"
echo -e "  ${CYAN}flowdocs update${RESET}   actualizar viewer y prompts"
echo ""
echo -e "  ${YELLOW}Nota:${RESET} reinicia la terminal o ejecuta:"
echo -e "  ${GRAY}  source ~/.zshrc${RESET}"
echo ""
