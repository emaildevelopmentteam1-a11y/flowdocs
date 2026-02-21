#!/usr/bin/env node

'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

// ─── Configuración ────────────────────────────────────────────────────────────

const REPO_BASE = 'https://raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main';

const FILES = {
  viewer:   'viewer.html',
  cursorrules: '.cursorrules',
  prompts: [
    'prompts/adapt.md',
    'prompts/discover.md',
    'prompts/implement.md',
    'prompts/update.md',
    'prompts/audit.md',
    'prompts/expand.md',
    'prompts/acceptance.md',
    'prompts/backlog.md',
    'prompts/evidence.md',
    'prompts/run-tests.md',
    'prompts/document.md',
  ]
};

/** Origen local: --from <path> o env FLOWDOCS_SOURCE. Si está definido, init/update copian desde ahí en vez de descargar. */
function getLocalSourcePath() {
  const fromEnv = process.env.FLOWDOCS_SOURCE;
  const argv = process.argv.slice(2);
  const fromIdx = argv.findIndex(a => a === '--from' || a === '-f');
  if (fromIdx !== -1 && argv[fromIdx + 1]) return path.resolve(process.cwd(), argv[fromIdx + 1]);
  if (fromEnv) return path.resolve(process.cwd(), fromEnv);
  return null;
}

// ─── Colores ──────────────────────────────────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  blue:   '\x1b[34m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

const ok  = (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const err = (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.blue}→${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}!${c.reset} ${msg}`);
const dim  = (msg) => console.log(`${c.gray}${msg}${c.reset}`);

// ─── Utilidades ───────────────────────────────────────────────────────────────

function download(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, (res) => {
      // Seguir redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} — ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/** Copia viewer, prompts y .cursorrules desde un directorio local (repo flowdocs) al .flowdocs del proyecto. */
function copyFromLocal(sourceDir, flowdocsDir, opts = {}) {
  const { includeBin = false } = opts;
  let copied = 0;
  const copyOne = (relativePath) => {
    const src = path.join(sourceDir, relativePath);
    const dest = path.join(flowdocsDir, relativePath);
    if (!fileExists(src)) return false;
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    copied++;
    return true;
  };
  copyOne('viewer.html');
  copyOne('.cursorrules');
  FILES.prompts.forEach(p => copyOne(p));
  if (includeBin) copyOne('bin/flowdocs.js');
  return copied;
}

/** Comprueba si cwd es la raíz del repo flowdocs (tiene viewer.html y prompts/). */
function isFlowdocsRepoRoot(dir) {
  return fileExists(path.join(dir, 'viewer.html')) && fileExists(path.join(dir, 'prompts'));
}

// ─── Comandos ─────────────────────────────────────────────────────────────────

async function cmdInit() {
  const cwd = process.cwd();
  const flowdocsDir = path.join(cwd, '.flowdocs');
  const promptsDir  = path.join(flowdocsDir, 'prompts');

  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs${c.reset} — inicializando en este proyecto`);
  console.log(`${c.gray}  ${cwd}${c.reset}`);
  console.log('');

  // Verificar si ya existe
  if (fileExists(flowdocsDir)) {
    warn('.flowdocs/ ya existe — usa "flowdocs update" para actualizar');
    console.log('');
    process.exit(0);
  }

  // Detectar el proyecto
  const projectName = detectProjectName(cwd);
  info(`Proyecto detectado: ${c.bold}${projectName}${c.reset}`);
  console.log('');

  const localSource = getLocalSourcePath();
  if (localSource) {
    if (!fileExists(path.join(localSource, 'viewer.html'))) {
      err(`Origen local no válido (falta viewer.html): ${localSource}`);
      console.log('');
      process.exit(1);
    }
    info(`Copiando desde: ${c.bold}${localSource}${c.reset}`);
    ensureDir(flowdocsDir);
    ensureDir(path.join(flowdocsDir, 'prompts'));
    const n = copyFromLocal(localSource, flowdocsDir);
    ok(`${n} archivos copiados desde el repo flowdocs local`);
  } else {
    // Descargar viewer.html
    process.stdout.write(`  ${c.dim}Descargando viewer.html...${c.reset}`);
    try {
      const viewer = await download(`${REPO_BASE}/viewer.html`);
      writeFile(path.join(flowdocsDir, 'viewer.html'), viewer);
      process.stdout.write(`\r${c.green}  ✓${c.reset} viewer.html\n`);
    } catch (e) {
      process.stdout.write(`\r${c.red}  ✗${c.reset} viewer.html — ${e.message}\n`);
      warn('Usando viewer local como fallback');
    }

    // Descargar prompts
    for (const prompt of FILES.prompts) {
      const name = path.basename(prompt);
      process.stdout.write(`  ${c.dim}Descargando ${name}...${c.reset}`);
      try {
        const content = await download(`${REPO_BASE}/${prompt}`);
        writeFile(path.join(flowdocsDir, prompt), content);
        process.stdout.write(`\r${c.green}  ✓${c.reset} prompts/${name}\n`);
      } catch (e) {
        process.stdout.write(`\r${c.red}  ✗${c.reset} prompts/${name} — ${e.message}\n`);
      }
    }

    // Descargar .cursorrules
    process.stdout.write(`  ${c.dim}Descargando .cursorrules...${c.reset}`);
    try {
      const rules = await download(`${REPO_BASE}/.cursorrules`);
      writeFile(path.join(flowdocsDir, '.cursorrules'), rules);
      process.stdout.write(`\r${c.green}  ✓${c.reset} .flowdocs/.cursorrules\n`);
    } catch (e) {
      process.stdout.write(`\r${c.red}  ✗${c.reset} .cursorrules — ${e.message}\n`);
    }
  }

  // Crear flows.yaml vacío
  const yamlPath = path.join(flowdocsDir, 'flows.yaml');
  if (!fileExists(yamlPath)) {
    writeFile(yamlPath, buildEmptyYaml(projectName));
    ok('flows.yaml creado (vacío)');
  }

  // Copiar .cursorrules a la raíz si no existe
  const rootRules = path.join(cwd, '.cursorrules');
  if (!fileExists(rootRules)) {
    try {
      const rulesContent = fs.readFileSync(path.join(flowdocsDir, '.cursorrules'), 'utf8');
      writeFile(rootRules, rulesContent);
      ok('.cursorrules copiado a la raíz del proyecto');
    } catch(e) {
      warn('No se pudo copiar .cursorrules a la raíz');
    }
  } else {
    warn('.cursorrules ya existe en la raíz — no sobreescrito');
    info('Revisa .flowdocs/.cursorrules para ver el contenido de FlowDocs');
  }

  // Agregar .flowdocs a .gitignore excepto flows.yaml
  updateGitignore(cwd);

  console.log('');
  console.log(`${c.bold}  ¡Listo!${c.reset}`);
  console.log('');
  console.log(`  ${c.cyan}Siguiente paso:${c.reset}`);
  console.log(`  Abre Cursor o Antigravity y escribe: ${c.bold}@discover.md${c.reset}`);
  console.log('');
  dim('  Ver descripción de uso completa: flowdocs usage');
  console.log('');
}

async function cmdUpdate() {
  const cwd = process.cwd();
  const flowdocsDir = path.join(cwd, '.flowdocs');

  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs${c.reset} — actualizando`);
  console.log('');

  if (!fileExists(flowdocsDir)) {
    err('.flowdocs/ no encontrado — ejecuta "flowdocs init" primero');
    console.log('');
    process.exit(1);
  }

  const localSource = getLocalSourcePath();
  let updated = 0;
  let failed  = 0;

  if (localSource) {
    if (!fileExists(path.join(localSource, 'viewer.html'))) {
      err(`Origen local no válido (falta viewer.html): ${localSource}`);
      console.log('');
      process.exit(1);
    }
    info(`Actualizando desde repo local: ${c.bold}${localSource}${c.reset}`);
    ensureDir(path.join(flowdocsDir, 'prompts'));
    ensureDir(path.join(flowdocsDir, 'bin'));
    updated = copyFromLocal(localSource, flowdocsDir, { includeBin: true });
    ok(`${updated} archivos actualizados desde flowdocs local`);
  } else {
    // Actualizar viewer, prompts, CLI (NO flows.yaml) desde la red
    const toUpdate = [
      { remote: 'viewer.html',           local: path.join(flowdocsDir, 'viewer.html') },
      { remote: '.cursorrules',          local: path.join(flowdocsDir, '.cursorrules') },
      { remote: 'bin/flowdocs.js',       local: path.join(flowdocsDir, 'bin', 'flowdocs.js') },
      ...FILES.prompts.map(p => ({
        remote: p,
        local: path.join(flowdocsDir, p)
      }))
    ];

    for (const file of toUpdate) {
      const name = file.remote;
      process.stdout.write(`  ${c.dim}Actualizando ${name}...${c.reset}`);
      try {
        const content = await download(`${REPO_BASE}/${file.remote}`);
        writeFile(file.local, content);
        process.stdout.write(`\r${c.green}  ✓${c.reset} ${name}\n`);
        updated++;
      } catch (e) {
        process.stdout.write(`\r${c.red}  ✗${c.reset} ${name} — ${e.message}\n`);
        failed++;
      }
    }

    // Si actualizamos el CLI del proyecto, actualizar también el global si existe
    const localCli = path.join(flowdocsDir, 'bin', 'flowdocs.js');
    const globalCli = path.join(process.env.HOME || process.env.USERPROFILE || '', '.flowdocs', 'bin', 'flowdocs.js');
    if (fileExists(localCli) && fileExists(globalCli)) {
      try {
        fs.copyFileSync(localCli, globalCli);
        ok('Comando global flowdocs actualizado');
      } catch (e) {}
    }
  }

  console.log('');
  if (failed === 0) {
    if (!localSource) ok(`${updated} archivos actualizados`);
    warn('flows.yaml no fue modificado');
  } else {
    warn(`${updated} actualizados, ${failed} fallaron`);
    dim('  Comprueba conexión a internet y que GitHub esté accesible.');
  }
  dim('  Para bajar desde el repo flowdocs local: flowdocs update --from ../flowdocs');
  console.log('');
}

async function cmdPublish() {
  const cwd = process.cwd();
  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs${c.reset} — subir cambios al remoto`);
  console.log('');

  if (!isFlowdocsRepoRoot(cwd)) {
    err('Este comando debe ejecutarse desde la raíz del repositorio flowdocs (donde está viewer.html y prompts/).');
    info('Desde un proyecto (ej. sarchi), usa "flowdocs update --from ../flowdocs" para bajar los cambios.');
    console.log('');
    process.exit(1);
  }

  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'pipe' });
  } catch (_) {
    err('No es un repositorio git. Inicializa con: git init');
    console.log('');
    process.exit(1);
  }

  const msg = process.argv.slice(3).join(' ').trim() || 'flowdocs: actualizar viewer y prompts';
  try {
    execSync('git add -A', { cwd, stdio: 'inherit' });
    execSync('git', ['commit', '-m', msg], { cwd, stdio: 'inherit' });
    execSync('git push', { cwd, stdio: 'inherit' });
    ok('Cambios subidos al remoto.');
  } catch (e) {
    const stderr = (e.stderr && e.stderr.toString()) || '';
    if (e.status === 1 && (stderr.includes('nothing to commit') || stderr.includes('no changes added'))) {
      warn('No hay cambios que commitear. Haz tus ediciones y vuelve a ejecutar flowdocs publish.');
    } else {
      err('Error al subir. Revisa: git status y, si aplica, git push.');
    }
    console.log('');
    process.exit(1);
  }
  console.log('');
}

function cmdStatus() {
  const cwd = process.cwd();
  const yamlPath = path.join(cwd, '.flowdocs', 'flows.yaml');

  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs Status${c.reset}`);
  console.log('');

  if (!fileExists(yamlPath)) {
    err('flows.yaml no encontrado');
    info('Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(yamlPath, 'utf8');

    // Parse básico sin dependencias externas
    const appMatch      = content.match(/^\s+app:\s+"?([^"\n]+)"?/m);
    const versionMatch  = content.match(/^\s+version:\s+"?([^"\n]+)"?/m);
    const totalMatch    = content.match(/^\s+total:\s+(\d+)/m);
    const implMatch     = content.match(/^\s+implemented:\s+(\d+)/m);
    const partialMatch  = content.match(/^\s+partial:\s+(\d+)/m);
    const pendingMatch  = content.match(/^\s+pending:\s+(\d+)/m);
    const testsMatch    = content.match(/^\s+with_tests:\s+(\d+)/m);
    const coverMatch    = content.match(/^\s+coverage_pct:\s+(\d+)/m);
    const sprintMatch   = content.match(/^\s+number:\s+(\d+)/m);
    const goalMatch     = content.match(/^\s+goal:\s+"?([^"\n]+)"?/m);
    const daysMatch     = content.match(/^\s+days_left:\s+(\d+)/m);

    const app      = appMatch?.[1]     || 'Sin nombre';
    const version  = versionMatch?.[1] || '?';
    const total    = parseInt(totalMatch?.[1]   || '0');
    const impl     = parseInt(implMatch?.[1]    || '0');
    const partial  = parseInt(partialMatch?.[1] || '0');
    const pending  = parseInt(pendingMatch?.[1] || '0');
    const tests    = parseInt(testsMatch?.[1]   || '0');
    const cover    = parseInt(coverMatch?.[1]   || '0');
    const sprint   = sprintMatch?.[1]  || '?';
    const goal     = goalMatch?.[1]    || 'Sin objetivo';
    const days     = daysMatch?.[1]    || '?';

    const impPct = total > 0 ? Math.round(impl / total * 100) : 0;
    const bar = buildBar(impPct, 30);

    console.log(`  ${c.bold}${app}${c.reset} ${c.gray}v${version}${c.reset}`);
    console.log('');
    console.log(`  ${c.bold}Sprint ${sprint}${c.reset} ${c.gray}— ${days} días restantes${c.reset}`);
    console.log(`  ${c.dim}${goal}${c.reset}`);
    console.log('');
    console.log(`  Progreso  ${bar} ${c.bold}${impPct}%${c.reset}`);
    console.log('');
    console.log(`  ${c.green}${impl}${c.reset} implementados   ${c.yellow}${partial}${c.reset} parciales   ${c.gray}${pending}${c.reset} pendientes   de ${c.bold}${total}${c.reset} flujos`);
    console.log(`  ${c.cyan}${tests}${c.reset} con tests   ${c.bold}${cover}%${c.reset} cobertura`);
    console.log('');

    // Flujos críticos sin tests
    const criticalNoTest = [...content.matchAll(/id:\s*"?(FLOW-\d+)"?[\s\S]*?priority:\s*"?critical"?[\s\S]*?test_status:\s*"?none"?/gm)];
    if (criticalNoTest.length > 0) {
      warn(`${criticalNoTest.length} flujos críticos sin tests:`);
      criticalNoTest.slice(0, 5).forEach(m => {
        const nameMatch = content.slice(m.index).match(/name:\s*"?([^"\n]+)"?/);
        console.log(`    ${c.red}•${c.reset} ${m[1]} ${c.gray}${nameMatch?.[1] || ''}${c.reset}`);
      });
      if (criticalNoTest.length > 5) dim(`    ... y ${criticalNoTest.length - 5} más`);
      console.log('');
    }

  } catch (e) {
    err(`Error leyendo flows.yaml: ${e.message}`);
  }

  console.log('');
}

const FLOWDOCS_PORT = 3847;
const MIME = { '.html': 'text/html', '.yaml': 'text/yaml', '.yml': 'text/yaml', '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain' };

function cmdOpen() {
  const cwd = process.cwd();
  const flowdocsDir = path.join(cwd, '.flowdocs');
  const viewerPath = path.join(flowdocsDir, 'viewer.html');
  if (!fileExists(viewerPath)) {
    err('.flowdocs/viewer.html no encontrado — ejecuta "flowdocs init" primero');
    console.log('');
    process.exit(1);
  }
  const flowdocsDirResolved = path.resolve(flowdocsDir);
  const server = http.createServer((req, res) => {
    const subPath = (req.url === '/' ? '/viewer.html' : req.url).split('?')[0].replace(/^\/+/, '');
    let filePath = path.resolve(flowdocsDirResolved, subPath);
    if (!filePath.startsWith(flowdocsDirResolved)) filePath = viewerPath;
    if (!fileExists(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  });
  server.listen(FLOWDOCS_PORT, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${FLOWDOCS_PORT}/viewer.html`;
    try {
      setTimeout(() => {
        if (process.platform === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' });
        else if (process.platform === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' });
        else execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
      }, 300);
    } catch (_) {}
    ok('Viewer abierto — ' + url);
    dim('  El servidor sirve tu flows.yaml automáticamente. Ctrl+C para cerrar.');
    console.log('');
  });
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      err(`Puerto ${FLOWDOCS_PORT} en uso. Cierra la otra ventana del viewer o ejecuta: kill-port ${FLOWDOCS_PORT}`);
    } else {
      err(e.message);
    }
    console.log('');
    process.exit(1);
  });
}

function cmdUsage() {
  console.log('');
  console.log(`  ${c.bold}${c.cyan}FlowDocs — Descripción de uso${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}1. Generar documentación (una vez)${c.reset}`);
  dim(`    Opcional: ${c.cyan}@adapt.md${c.reset} — infiere tipo de app y genera pistas.`);
  dim(`    Luego: ${c.cyan}@discover.md${c.reset} — analiza el proyecto y genera .flowdocs/flows.yaml`);
  console.log('');
  console.log(`  ${c.bold}1b. Añadir al backlog (historias y flujos desde requisitos)${c.reset}`);
  dim(`    ${c.cyan}@backlog.md${c.reset} — describe requisitos en lenguaje natural; la IA crea stories, flujos y criterios (o complementa existentes)`);
  console.log('');
  console.log(`  ${c.bold}2. Implementar un flujo${c.reset}`);
  dim('    En el chat:');
  console.log(`    ${c.cyan}@implement.md FLOW-003${c.reset}`);
  dim('    La IA implementa siguiendo los steps del YAML');
  console.log('');
  console.log(`  ${c.bold}3. Actualizar estado en el YAML${c.reset}`);
  dim('    En el chat:');
  console.log(`    ${c.cyan}@update.md — FLOW-003 implementado, tests en spec/e2e/checkout.spec.ts${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}4. Ver tablero visual${c.reset}`);
  console.log(`    ${c.cyan}flowdocs open${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}Comandos de terminal:${c.reset}`);
  console.log(`    ${c.cyan}flowdocs status${c.reset}   resumen del proyecto`);
  console.log(`    ${c.cyan}flowdocs update${c.reset}   actualizar viewer y prompts (bajar)`);
  console.log(`    ${c.cyan}flowdocs update --from ../flowdocs${c.reset}   bajar desde el repo flowdocs local`);
  console.log(`    ${c.cyan}flowdocs open${c.reset}     abrir viewer en el navegador`);
  console.log(`    ${c.cyan}flowdocs usage${c.reset}   ver esta descripción`);
  console.log(`  ${c.bold}En el repo flowdocs:${c.reset}`);
  console.log(`    ${c.cyan}flowdocs publish${c.reset}   subir cambios (git add, commit, push)`);
  console.log('');
}

function cmdHelp() {
  console.log('');
  console.log(`  ${c.bold}${c.cyan}flowdocs${c.reset} — Control de documentación para desarrollo con IA`);
  console.log('');
  console.log(`  ${c.bold}Comandos:${c.reset}`);
  console.log('');
  console.log(`    ${c.cyan}init${c.reset}      Instala FlowDocs en el proyecto actual`);
  console.log(`    ${c.cyan}update${c.reset}    Actualiza viewer y prompts (no toca flows.yaml)`);
  console.log(`    ${c.cyan}update --from <path>${c.reset}  Bajar desde el repo flowdocs local (ej. ../flowdocs)`);
  console.log(`    ${c.cyan}status${c.reset}    Muestra el resumen del proyecto en la terminal`);
  console.log(`    ${c.cyan}open${c.reset}     Abre el viewer (tablero visual) en el navegador`);
  console.log(`    ${c.cyan}publish${c.reset}   (solo en repo flowdocs) Sube cambios: git add, commit, push`);
  console.log(`    ${c.cyan}usage${c.reset}    Muestra la descripción de uso completa`);
  console.log('');
  console.log(`  ${c.bold}Uso:${c.reset}`);
  console.log('');
  console.log(`    flowdocs init | update | status | open | publish | usage`);
  console.log('');
  console.log(`  ${c.bold}Primer paso:${c.reset} En Cursor/Antigravity escribe ${c.cyan}@discover.md${c.reset}`);
  console.log(`  ${c.bold}Ver protocolo:${c.reset} ${c.cyan}flowdocs usage${c.reset}`);
  console.log('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectProjectName(cwd) {
  // Intenta leer el nombre desde package.json, Gemfile, composer.json, etc.
  const files = [
    { path: 'package.json',    parse: (c) => JSON.parse(c).name },
    { path: 'composer.json',   parse: (c) => JSON.parse(c).name },
    { path: 'pubspec.yaml',    parse: (c) => c.match(/^name:\s+(.+)/m)?.[1] },
    { path: 'Cargo.toml',      parse: (c) => c.match(/^name\s*=\s*"(.+)"/m)?.[1] },
    { path: 'pyproject.toml',  parse: (c) => c.match(/^name\s*=\s*"(.+)"/m)?.[1] },
  ];

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(cwd, f.path), 'utf8');
      const name = f.parse(content);
      if (name) return name;
    } catch {}
  }

  // Fallback: nombre de la carpeta
  return path.basename(cwd);
}

function buildEmptyYaml(projectName) {
  const today = new Date().toISOString().split('T')[0];
  return `meta:
  app: "${projectName}"
  version: "0.1.0"
  description: "Descripción del sistema"
  updated_at: "${today}"
  sprint:
    number: 1
    goal: "Documentar el proyecto con @discover.md"
    start: "${today}"
    end: "${today}"
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
`;
}

function updateGitignore(cwd) {
  const gitignorePath = path.join(cwd, '.gitignore');
  const entry = '\n# FlowDocs — solo commitear flows.yaml\n.flowdocs/viewer.html\n.flowdocs/prompts/\n.flowdocs/.cursorrules\n';

  try {
    if (fileExists(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      if (!content.includes('FlowDocs')) {
        fs.appendFileSync(gitignorePath, entry);
        ok('.gitignore actualizado — viewer y prompts ignorados, flows.yaml se commitea');
      }
    }
  } catch {}
}

function buildBar(pct, width) {
  const filled = Math.round(pct / 100 * width);
  const empty  = width - filled;
  const color  = pct === 100 ? c.green : pct > 50 ? c.cyan : c.yellow;
  return `${color}${'█'.repeat(filled)}${c.gray}${'░'.repeat(empty)}${c.reset}`;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const cmd = process.argv[2];

(async () => {
  switch (cmd) {
    case 'init':    await cmdInit();    break;
    case 'update':  await cmdUpdate();  break;
    case 'status':  cmdStatus();       break;
    case 'open':    cmdOpen();         break;
    case 'publish': await cmdPublish(); break;
    case 'usage':   cmdUsage();        break;
    default:        cmdHelp();         break;
  }
})().catch(e => {
  console.error(`\n  ${c.red}Error:${c.reset} ${e.message}\n`);
  process.exit(1);
});
