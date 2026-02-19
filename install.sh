#!/usr/bin/env bash
set -e

# ─── Config ───────────────────────────────────────────────────────────────────

REPO="https://raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main"
FLOWDOCS_DIR=".flowdocs"
PROMPTS_DIR=".flowdocs/prompts"

# ─── Colores ──────────────────────────────────────────────────────────────────

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
GRAY="\033[90m"

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
err()  { echo -e "  ${RED}✗${RESET} $1"; }
info() { echo -e "  ${CYAN}→${RESET} $1"; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }

# ─── Verificar dependencias ───────────────────────────────────────────────────

if ! command -v curl &>/dev/null; then
  err "curl no está instalado"
  exit 1
fi

if ! command -v node &>/dev/null; then
  warn "Node.js no encontrado — flowdocs status no estará disponible"
  warn "Instala Node desde https://nodejs.org"
fi

# ─── Verificar que estamos en un proyecto ─────────────────────────────────────

if [ ! -f "package.json" ] && [ ! -f "Gemfile" ] && [ ! -f "composer.json" ] && \
   [ ! -f "pyproject.toml" ] && [ ! -f "Cargo.toml" ] && [ ! -d ".git" ]; then
  warn "No se detectó un proyecto en este directorio"
  warn "Ejecuta flowdocs init desde la raíz de tu proyecto"
  read -p "  ¿Continuar de todas formas? (s/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 0
  fi
fi

# ─── Verificar si ya existe ───────────────────────────────────────────────────

if [ -d "$FLOWDOCS_DIR" ]; then
  warn ".flowdocs/ ya existe en este proyecto"
  warn "Usa 'flowdocs update' para actualizar"
  echo ""
  exit 0
fi

# ─── Inicio ───────────────────────────────────────────────────────────────────

echo ""
echo -e "  ${BOLD}${CYAN}FlowDocs${RESET} — instalando en $(basename $PWD)"
echo ""

# Crear directorios
mkdir -p "$FLOWDOCS_DIR"
mkdir -p "$PROMPTS_DIR"

# ─── Descargar archivos ───────────────────────────────────────────────────────

download() {
  local url="$REPO/$1"
  local dest="$2"
  if curl -fsSL "$url" -o "$dest" 2>/dev/null; then
    ok "$dest"
  else
    err "$dest — fallo al descargar"
    return 1
  fi
}

download "viewer.html"              "$FLOWDOCS_DIR/viewer.html"
download ".cursorrules"             "$FLOWDOCS_DIR/.cursorrules"
download "prompts/discover.md"      "$PROMPTS_DIR/discover.md"
download "prompts/implement.md"     "$PROMPTS_DIR/implement.md"
download "prompts/update.md"        "$PROMPTS_DIR/update.md"
download "prompts/audit.md"         "$PROMPTS_DIR/audit.md"
download "prompts/expand.md"        "$PROMPTS_DIR/expand.md"

# ─── Descargar CLI para uso local ─────────────────────────────────────────────

mkdir -p "$FLOWDOCS_DIR/bin"
download "bin/flowdocs.js"          "$FLOWDOCS_DIR/bin/flowdocs.js"
chmod +x "$FLOWDOCS_DIR/bin/flowdocs.js"

# ─── Crear flows.yaml vacío ───────────────────────────────────────────────────

PROJECT_NAME=$(basename "$PWD")

# Intentar leer nombre del proyecto
if [ -f "package.json" ]; then
  PKG_NAME=$(node -e "try{console.log(require('./package.json').name)}catch(e){}" 2>/dev/null)
  [ -n "$PKG_NAME" ] && PROJECT_NAME="$PKG_NAME"
fi

TODAY=$(date +%Y-%m-%d)

cat > "$FLOWDOCS_DIR/flows.yaml" << EOF
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
EOF
ok "$FLOWDOCS_DIR/flows.yaml"

# ─── Copiar .cursorrules a la raíz ────────────────────────────────────────────

if [ ! -f ".cursorrules" ]; then
  cp "$FLOWDOCS_DIR/.cursorrules" ".cursorrules"
  ok ".cursorrules copiado a la raíz"
else
  warn ".cursorrules ya existe en la raíz — no sobreescrito"
  info "Revisa .flowdocs/.cursorrules para el contenido de FlowDocs"
fi

# ─── Actualizar .gitignore ────────────────────────────────────────────────────

if [ -f ".gitignore" ]; then
  if ! grep -q "FlowDocs" ".gitignore" 2>/dev/null; then
    cat >> ".gitignore" << 'EOF'

# FlowDocs — solo commitear flows.yaml
.flowdocs/viewer.html
.flowdocs/prompts/
.flowdocs/bin/
.flowdocs/.cursorrules
EOF
    ok ".gitignore actualizado"
  fi
fi

# ─── Crear alias flowdocs (opcional) ─────────────────────────────────────────

if command -v node &>/dev/null; then
  # Crear script wrapper en el proyecto
  cat > "$FLOWDOCS_DIR/flowdocs" << 'EOF'
#!/usr/bin/env bash
node "$(dirname "$0")/bin/flowdocs.js" "$@"
EOF
  chmod +x "$FLOWDOCS_DIR/flowdocs"
fi

# ─── Fin ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "  ${BOLD}¡Listo!${RESET} FlowDocs instalado en ${CYAN}$(basename $PWD)${RESET}"
echo ""
echo -e "  ${BOLD}Siguiente paso:${RESET}"
echo -e "  Abre Cursor o Antigravity y escribe:"
echo ""
echo -e "  ${BOLD}  @discover.md${RESET}"
echo ""
echo -e "  ${GRAY}La IA analizará tu proyecto y generará flows.yaml${RESET}"
echo ""
echo -e "  ${GRAY}Ver estado del proyecto:${RESET}"
echo -e "  ${GRAY}  node .flowdocs/bin/flowdocs.js status${RESET}"
echo ""
