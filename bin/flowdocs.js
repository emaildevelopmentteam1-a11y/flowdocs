#!/usr/bin/env node

'use strict';

const https     = require('https');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const { execSync } = require('child_process');

// ─── Configuración ────────────────────────────────────────────────────────────

const REPO_BASE = 'https://raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main';
const SWARM_REPO = 'https://github.com/wjgoarxiv/antigravity-swarm.git';
const SWARM_DIR_DEFAULT = '.gemini/skills/antigravity-swarm'; // relativo a HOME

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
  if (process.argv.includes('--with-swarm')) {
    await cmdInstallSwarm();
  }
  console.log('');
}

async function cmdInstallSwarm() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (!home) {
    err('No se pudo determinar HOME');
    return;
  }
  const swarmDir = process.env.FLOWDOCS_SWARM_DIR || path.join(home, SWARM_DIR_DEFAULT);

  console.log('');
  console.log(`  ${c.bold}${c.cyan}FlowDocs${c.reset} — instalar antigravity-swarm`);
  console.log(`  ${c.dim}Destino: ${swarmDir}${c.reset}`);
  console.log('');

  try {
    if (!fileExists(path.join(swarmDir, '.git'))) {
      ensureDir(path.dirname(swarmDir));
      try {
        execSync(`git clone --depth 1 "${SWARM_REPO}" "${swarmDir}"`, { stdio: 'inherit', shell: true });
        ok('antigravity-swarm clonado');
      } catch (gitErr) {
        err('git clone falló. ¿Tienes git instalado y acceso a GitHub?');
        throw gitErr;
      }
    } else {
      execSync('git pull', { cwd: swarmDir, stdio: 'inherit', shell: true });
      ok('antigravity-swarm actualizado');
    }
    const reqPath = path.join(swarmDir, 'requirements.txt');
    if (fileExists(reqPath)) {
      try {
        execSync('pip install -r requirements.txt', { cwd: swarmDir, stdio: 'inherit', shell: true });
        ok('Dependencias Python instaladas (pip -r requirements.txt)');
      } catch (pipErr) {
        warn('pip install falló. Ejecuta manualmente: cd ' + swarmDir + ' && pip install -r requirements.txt');
      }
    }
    info(`Orquestador: ${c.bold}python3 ${path.join(swarmDir, 'scripts', 'orchestrator.py')}${c.reset}`);
    dim('  Después de flowdocs plan-sprint, ejecuta el orquestador desde la raíz del proyecto.');
  } catch (e) {
    err('Fallo al instalar antigravity-swarm: ' + (e.message || e));
    dim('  Comprueba: git instalado, pip instalado, acceso a GitHub.');
  }
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
  console.log(`    ${c.cyan}flowdocs open${c.reset}  (navegador)  o  ${c.cyan}flowdocs tui${c.reset}  (terminal)`);
  console.log('');
  console.log(`  ${c.bold}Comandos de terminal:${c.reset}`);
  console.log(`    ${c.cyan}flowdocs status${c.reset}   resumen del proyecto`);
  console.log(`    ${c.cyan}flowdocs update${c.reset}   actualizar viewer y prompts (bajar)`);
  console.log(`    ${c.cyan}flowdocs update --with-swarm${c.reset}   actualizar e instalar/actualizar antigravity-swarm`);
  console.log(`    ${c.cyan}flowdocs install-swarm${c.reset}   instalar antigravity-swarm en ~/.gemini/skills/antigravity-swarm`);
  console.log(`    ${c.cyan}flowdocs update --from ../flowdocs${c.reset}   bajar desde el repo flowdocs local`);
  console.log(`    ${c.cyan}flowdocs open${c.reset}     abrir viewer en el navegador`);
  console.log(`    ${c.cyan}flowdocs tui${c.reset}         navegar historias, flujos y prompts en la terminal`);
  console.log(`    ${c.cyan}flowdocs plan-sprint${c.reset} generar task_plan.md y swarm-plan.yaml para antigravity-swarm`);
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
  console.log(`    ${c.cyan}update --with-swarm${c.reset}  Actualizar e instalar/actualizar antigravity-swarm`);
  console.log(`    ${c.cyan}install-swarm${c.reset}  Instala antigravity-swarm (clone + pip) en ~/.gemini/skills/antigravity-swarm`);
  console.log(`    ${c.cyan}update --from <path>${c.reset}  Bajar desde el repo flowdocs local (ej. ../flowdocs)`);
  console.log(`    ${c.cyan}status${c.reset}    Muestra el resumen del proyecto en la terminal`);
  console.log(`    ${c.cyan}open${c.reset}     Abre el viewer (tablero visual) en el navegador`);
  console.log(`    ${c.cyan}tui${c.reset}          Modo terminal: navegar historias, flujos, prompts y estados`);
  console.log(`    ${c.cyan}plan-sprint${c.reset}  Genera task_plan.md y swarm-plan.yaml para cerrar el sprint con antigravity-swarm`);
  console.log(`    ${c.cyan}publish${c.reset}     (solo en repo flowdocs) Sube cambios: git add, commit, push`);
  console.log(`    ${c.cyan}usage${c.reset}    Muestra la descripción de uso completa`);
  console.log('');
  console.log(`  ${c.bold}Uso:${c.reset}`);
  console.log('');
  console.log(`    flowdocs init | update | install-swarm | status | open | tui | plan-sprint | publish | usage`);
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

/** Parse básico de flows.yaml para el TUI (sin dependencias YAML). */
function parseYamlForTui(content) {
  const meta = {};
  const appMatch   = content.match(/^\s+app:\s*["']?([^"\n]+)["']?/m);
  const totalMatch = content.match(/^\s+total:\s+(\d+)/m);
  const implMatch  = content.match(/^\s+implemented:\s+(\d+)/m);
  const partMatch  = content.match(/^\s+partial:\s+(\d+)/m);
  const pendMatch  = content.match(/^\s+pending:\s+(\d+)/m);
  const testsMatch = content.match(/^\s+with_tests:\s+(\d+)/m);
  const coverMatch = content.match(/^\s+coverage_pct:\s+(\d+)/m);
  const sprintMatch= content.match(/^\s+number:\s+(\d+)/m);
  const goalMatch  = content.match(/^\s+goal:\s*["']?([^"\n]+)["']?/m);
  const daysMatch  = content.match(/^\s+days_left:\s+(\d+)/m);
  meta.app     = appMatch?.[1]?.trim() || 'Sin nombre';
  meta.total   = parseInt(totalMatch?.[1] || '0');
  meta.impl    = parseInt(implMatch?.[1] || '0');
  meta.partial = parseInt(partMatch?.[1] || '0');
  meta.pending = parseInt(pendMatch?.[1] || '0');
  meta.tests   = parseInt(testsMatch?.[1] || '0');
  meta.cover   = parseInt(coverMatch?.[1] || '0');
  meta.sprint  = sprintMatch?.[1] || '?';
  meta.goal    = goalMatch?.[1]?.trim() || '';
  meta.days    = daysMatch?.[1] || '?';

  const flows = [];
  const flowIdRe = /^\s+-\s+id:\s*["']?(FLOW-[^\s"']+)["']?\s*$/gm;
  let m;
  while ((m = flowIdRe.exec(content)) !== null) {
    const start = m.index;
    const next = content.indexOf('\n  - ', start + 1);
    const block = next === -1 ? content.slice(start, start + 2000) : content.slice(start, next);
    const name  = block.match(/name:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const status = block.match(/status:\s*["']?(\w+)["']?/)?.[1] || 'pending';
    const test_status = block.match(/test_status:\s*["']?(\w+)["']?/)?.[1] || 'none';
    const sprint_status = block.match(/sprint_status:\s*["']?(\w+)["']?/)?.[1] || 'todo';
    const module = block.match(/module:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const story = block.match(/story:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const trigger = block.match(/trigger:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const stepsBlock = block.match(/steps:\s*\[([\s\S]*?)\]/);
    let steps = [];
    if (stepsBlock) {
      try {
        steps = stepsBlock[1].split(/,\s*/).map(s => s.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 10));
      } catch (_) {}
    }
    flows.push({ id: m[1], name, status, test_status, sprint_status, module, story, trigger, steps });
  }

  const stories = [];
  const storyIdRe = /^\s+-\s+id:\s*["']?(US-\d+)["']?\s*$/gm;
  while ((m = storyIdRe.exec(content)) !== null) {
    const start = m.index;
    const next = content.indexOf('\n  - ', start + 1);
    const block = next === -1 ? content.slice(start, start + 3000) : content.slice(start, next);
    const title = block.match(/title:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const status = block.match(/status:\s*["']?(\w+)["']?/)?.[1] || 'pending';
    const flowIdsBlock = block.match(/flow_ids:\s*\[([^\]]*)\]/);
    const flow_ids = flowIdsBlock ? (flowIdsBlock[1].match(/FLOW-[^\s,"']+/g) || []) : [];
    const criteriaBlock = block.match(/acceptance_criteria:\s*\[([\s\S]*?)\](?=\s*\n\s+\w+:|\s*\n\s+-\s+id:|\s*$)/);
    let criteria = [];
    if (criteriaBlock) {
      const descRe = /description:\s*["']?([^"\n]+)["']?/g;
      let dm;
      while ((dm = descRe.exec(criteriaBlock[1])) !== null) criteria.push(dm[1].trim());
    }
    stories.push({ id: m[1], title, status, flow_ids, criteria });
  }

  return { meta, flows, stories };
}

/** Flujos con id FLOW-xxx o FUT-xxx. */
const FLOW_ID_RE = /^\s+-\s+id:\s*["']?((?:FLOW|FUT)-[^\s"']+)["']?\s*$/gm;

/** Parsea flows.yaml para plan de sprint: active_sprint, goal, flujos pendientes/parciales. */
function parseYamlForSprintPlan(content) {
  const activeSprintMatch = content.match(/\bactive_sprint:\s*(\d+)/);
  const sprintNumMatch    = content.match(/\bsprint:\s*[\n\s]*number:\s*(\d+)/);
  const goalMatch         = content.match(/\bgoal:\s*["']?([^"\n]+)["']?/);
  const appMatch          = content.match(/^\s+app:\s*["']?([^"\n]+)["']?/m);
  const activeSprint      = activeSprintMatch ? parseInt(activeSprintMatch[1], 10) : (sprintNumMatch ? parseInt(sprintNumMatch[1], 10) : 1);
  const goal              = goalMatch ? goalMatch[1].trim() : 'Sprint ' + activeSprint;
  const app               = appMatch ? appMatch[1].trim() : 'Proyecto';

  const flows = [];
  let m;
  FLOW_ID_RE.lastIndex = 0;
  while ((m = FLOW_ID_RE.exec(content)) !== null) {
    const start = m.index;
    const next  = content.indexOf('\n  - ', start + 1);
    const block = next === -1 ? content.slice(start, start + 2500) : content.slice(start, next);
    const status = block.match(/status:\s*["']?(\w+)["']?/)?.[1] || 'pending';
    if (status !== 'pending' && status !== 'partial') continue;
    const sprint_status = block.match(/sprint_status:\s*["']?(\w+)["']?/)?.[1] || 'todo';
    const name    = block.match(/name:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const story   = block.match(/story:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const module  = block.match(/module:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const trigger = block.match(/trigger:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const stepsBlock = block.match(/steps:\s*\[([\s\S]*?)\]/);
    let steps = [];
    if (stepsBlock) {
      try {
        steps = stepsBlock[1].split(/,\s*/).map(s => s.replace(/^["'\s]+|["'\s]+$/g, '').trim()).filter(Boolean).slice(0, 12);
      } catch (_) {}
    }
    flows.push({
      id: m[1],
      name,
      story,
      module,
      status,
      sprint_status,
      trigger,
      steps
    });
  }
  return { activeSprint, goal, app, flows };
}

function cmdPlanSprint() {
  const cwd = process.cwd();
  const yamlPath = path.join(cwd, '.flowdocs', 'flows.yaml');
  const outDir = cwd;
  const flowdocsDir = path.join(cwd, '.flowdocs');

  if (!fileExists(yamlPath)) {
    err('flows.yaml no encontrado. Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  const content = fs.readFileSync(yamlPath, 'utf8');
  const { activeSprint, goal, app, flows } = parseYamlForSprintPlan(content);

  console.log('');
  console.log(`  ${c.bold}${c.cyan}FlowDocs — Plan de sprint para swarm${c.reset}`);
  console.log(`  ${c.bold}${app}${c.reset}  Sprint ${activeSprint} — ${c.dim}${goal}${c.reset}`);
  console.log('');

  if (flows.length === 0) {
    warn('No hay flujos pendientes o parciales en flows.yaml.');
    info('Actualiza status/sprint_status en los flujos o añade flujos al sprint.');
    console.log('');
    process.exit(0);
  }

  ensureDir(flowdocsDir);

  const taskPlanPath = path.join(outDir, 'task_plan.md');
  const swarmPlanPath = path.join(flowdocsDir, 'swarm-plan.yaml');

  const taskLines = [
    `# Sprint ${activeSprint} — ${goal}`,
    '',
    `Proyecto: **${app}**. Cerrar flujos pendientes/parciales usando los prompts de FlowDocs.`,
    'Cada ítem = un subagente ejecuta el prompt indicado (mismo que usarías en el chat).',
    '',
    '## Tareas por flujo',
    ''
  ];

  const swarmTasks = [];

  for (const f of flows) {
    const prompt = `@implement.md ${f.id}`;
    taskLines.push(`- [ ] **${f.id}** — ${f.name}`);
    taskLines.push(`  - Historia: ${f.story || '—'} · Módulo: ${f.module || '—'}`);
    taskLines.push(`  - Prompt: \`${prompt}\``);
    if (f.trigger) taskLines.push(`  - Trigger: ${f.trigger}`);
    if (f.steps.length) taskLines.push(`  - Pasos: ${f.steps.slice(0, 3).join(' → ')}${f.steps.length > 3 ? '…' : ''}`);
    taskLines.push('');

    swarmTasks.push({
      id: f.id,
      name: f.name,
      story: f.story || null,
      module: f.module || null,
      status: f.status,
      sprint_status: f.sprint_status,
      prompt,
      trigger: f.trigger || null,
      steps: f.steps
    });
  }

  taskLines.push('---');
  taskLines.push('');
  taskLines.push('## Cómo usar con antigravity-swarm (multiagente)');
  taskLines.push('');
  taskLines.push('Se generó también **subagents.yaml** en la raíz: un subagente por flujo + Quality_Validator.');
  taskLines.push('El orquestador del swarm lo lee y lanza todos en paralelo (o según modo).');
  taskLines.push('');
  taskLines.push('1. Desde la raíz del proyecto:');
  taskLines.push('   ```');
  taskLines.push('   python3 ~/.gemini/skills/antigravity-swarm/scripts/orchestrator.py');
  taskLines.push('   ```');
  taskLines.push('2. Confirma con `y` cuando pregunte. Cada subagente implementa un flujo (leyendo .flowdocs/).');
  taskLines.push('3. Al final, ejecuta `@update.md` con los flujos implementados y rutas de tests.');
  taskLines.push('');

  const taskPlanMd = taskLines.join('\n');
  fs.writeFileSync(taskPlanPath, taskPlanMd, 'utf8');
  ok(`task_plan.md escrito en ${path.relative(cwd, taskPlanPath)}`);

  const swarmYaml = [
    '# Plan de sprint generado por FlowDocs — para antigravity-swarm',
    `# Sprint ${activeSprint} — ${goal}`,
    '',
    'sprint: ' + activeSprint,
    'goal: "' + goal.replace(/"/g, '\\"') + '"',
    'app: "' + app.replace(/"/g, '\\"') + '"',
    '',
    'tasks:',
    ...swarmTasks.map(t => {
      const lines = [
        `  - id: "${t.id}"`,
        `    name: "${(t.name || '').replace(/"/g, '\\"')}"`,
        `    prompt: "${t.prompt}"`,
        `    story: "${t.story || ''}"`,
        `    module: "${t.module || ''}"`,
        `    status: "${t.status}"`,
        `    sprint_status: "${t.sprint_status}"`
      ];
      if (t.trigger) lines.push(`    trigger: "${(t.trigger || '').replace(/"/g, '\\"')}"`);
      if (t.steps && t.steps.length) lines.push('    steps: [' + t.steps.map(s => '"' + String(s).replace(/"/g, '\\"') + '"').join(', ') + ']');
      return lines.join('\n');
    })
  ].join('\n');

  fs.writeFileSync(swarmPlanPath, swarmYaml, 'utf8');
  ok(`swarm-plan.yaml escrito en .flowdocs/swarm-plan.yaml`);

  // Generar subagents.yaml para antigravity-swarm (un subagente por flujo + Quality_Validator)
  const subagentsPath = path.join(outDir, 'subagents.yaml');
  const subagentLines = [
    '# Generado por flowdocs plan-sprint — formato antigravity-swarm',
    '# Un subagente por flujo (parallel) + Quality_Validator al final.',
    '',
    'subagents:'
  ];

  const colors = ['yellow', 'cyan', 'green', 'blue', 'magenta'];
  flows.forEach((f, i) => {
    const safeName = f.id.replace(/[^a-zA-Z0-9-]/g, '_');
    const roleName = `Junior_${safeName}`;
    const color = colors[i % colors.length];
    const stepsList = f.steps.length ? f.steps.slice(0, 8).map(s => '  - ' + s.replace(/"/g, "'")).join('\n') : '  (ver .flowdocs/flows.yaml)';
    const promptBlock = [
      'You are Junior. Your ONLY task is to implement the FlowDocs flow ' + f.id + '.',
      'Read .flowdocs/flows.yaml for the flow definition and .flowdocs/prompts/implement.md for the implementation protocol.',
      'Flow name: ' + (f.name || f.id) + '. Module: ' + (f.module || '') + '. Story: ' + (f.story || '') + '.',
      (f.trigger ? 'Trigger: ' + f.trigger + '.' : ''),
      'Steps for this flow:',
      stepsList,
      'Implement the flow in the codebase. When done, append to progress.md: "' + f.id + ' implemented".'
    ].filter(Boolean).join('\n');
    const promptEscaped = promptBlock.split('\n').map(l => '      ' + l).join('\n');
    subagentLines.push(`  - name: "${roleName}"`);
    subagentLines.push(`    description: "Implement ${f.id} — ${(f.name || '').slice(0, 50)}"`);
    subagentLines.push(`    color: "${color}"`);
    subagentLines.push(`    model: "auto-gemini-3"`);
    subagentLines.push(`    mode: "parallel"`);
    subagentLines.push(`    prompt: |`);
    subagentLines.push(promptEscaped);
    subagentLines.push('');
  });

  subagentLines.push('  - name: "Quality_Validator"');
  subagentLines.push('    description: "Verify all flows in task_plan.md were implemented"');
  subagentLines.push('    color: "green"');
  subagentLines.push('    model: "auto-gemini-3"');
  subagentLines.push('    mode: "validator"');
  subagentLines.push('    prompt: |');
  subagentLines.push('      You are Quality_Validator. Check that every flow listed in task_plan.md has');
  subagentLines.push('      "implemented" in progress.md or that the codebase reflects the implementation.');
  subagentLines.push('      Run tests if present. Report any missing or failed items.');

  fs.writeFileSync(subagentsPath, subagentLines.join('\n'), 'utf8');
  ok(`subagents.yaml escrito en ${path.relative(cwd, subagentsPath)} (para antigravity-swarm)`);

  console.log('');
  dim(`  Flujos en el plan: ${flows.length} → ${flows.length} subagentes Junior + 1 Quality_Validator`);
  dim(`  Siguiente: desde la raíz del proyecto ejecuta el orquestador del swarm:`);
  dim(`    python3 ~/.gemini/skills/antigravity-swarm/scripts/orchestrator.py`);
  dim(`  (o la ruta donde tengas instalado antigravity-swarm)`);
  console.log('');
}

function cmdTui() {
  const cwd = process.cwd();
  const yamlPath = path.join(cwd, '.flowdocs', 'flows.yaml');
  const promptsDir = path.join(cwd, '.flowdocs', 'prompts');

  if (!fileExists(yamlPath)) {
    err('flows.yaml no encontrado. Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  const content = fs.readFileSync(yamlPath, 'utf8');
  const { meta, flows, stories } = parseYamlForTui(content);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
  }

  function pause() {
    return ask(`\n  ${c.dim}[Enter para continuar]${c.reset} `);
  }

  function showDashboard() {
    console.clear();
    console.log('');
    console.log(`  ${c.bold}${c.cyan}FlowDocs TUI${c.reset} — ${c.bold}${meta.app}${c.reset}`);
    console.log(`  ${c.dim}Sprint ${meta.sprint} · ${meta.days} días · ${meta.goal}${c.reset}`);
    console.log('');
    const total = meta.total || 1;
    const pct = Math.round((meta.impl / total) * 100);
    const bar = buildBar(pct, 28);
    console.log(`  Progreso  ${bar} ${c.bold}${pct}%${c.reset}`);
    console.log(`  ${c.green}${meta.impl}${c.reset} implementados  ${c.yellow}${meta.partial}${c.reset} parciales  ${c.gray}${meta.pending}${c.reset} pendientes  ${c.cyan}${meta.tests}${c.reset} con tests  ${c.bold}${meta.cover}%${c.reset} cobertura`);
    console.log('');
    console.log(`  ${c.dim}Historias: ${stories.length}  ·  Flujos: ${flows.length}${c.reset}`);
    console.log('');
  }

  function showStoriesList() {
    console.clear();
    console.log(`\n  ${c.bold}Historias de usuario${c.reset}\n`);
    if (stories.length === 0) {
      dim('  (ninguna en flows.yaml)');
      return [];
    }
    stories.forEach((s, i) => {
      const st = s.status === 'implemented' ? c.green : s.status === 'partial' ? c.yellow : c.gray;
      console.log(`  ${c.cyan}${i + 1}.${c.reset} ${s.id} ${st}${s.status}${c.reset}  ${s.title.slice(0, 50)}${s.title.length > 50 ? '…' : ''}`);
    });
    console.log(`\n  ${c.dim}0. Volver al menú${c.reset}`);
    return stories;
  }

  function showFlowsList() {
    console.clear();
    console.log(`\n  ${c.bold}Flujos${c.reset}\n`);
    if (flows.length === 0) {
      dim('  (ninguno en flows.yaml)');
      return [];
    }
    flows.forEach((f, i) => {
      const st = f.status === 'implemented' ? c.green : f.status === 'partial' ? c.yellow : c.gray;
      console.log(`  ${c.cyan}${i + 1}.${c.reset} ${f.id} ${st}${f.status}${c.reset}  ${f.name.slice(0, 45)}${f.name.length > 45 ? '…' : ''}`);
    });
    console.log(`\n  ${c.dim}0. Volver al menú${c.reset}`);
    return flows;
  }

  function showPromptsList() {
    console.clear();
    console.log(`\n  ${c.bold}Prompts (copiar en el chat)${c.reset}\n`);
    let files = [];
    try {
      if (fileExists(promptsDir)) {
        files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.md')).sort();
      }
    } catch (_) {}
    if (files.length === 0) {
      dim('  (no hay .flowdocs/prompts/*.md)');
      return [];
    }
    files.forEach((f, i) => {
      console.log(`  ${c.cyan}${i + 1}.${c.reset} ${f}`);
    });
    console.log(`\n  ${c.dim}0. Volver al menú${c.reset}`);
    return files;
  }

  function showStoryDetail(s) {
    console.log(`\n  ${c.bold}${s.id}${c.reset}  ${s.title}`);
    console.log(`  ${c.dim}Estado: ${s.status}  ·  Flujos: ${s.flow_ids.join(', ') || '—'}${c.reset}`);
    if (s.criteria.length) {
      console.log(`\n  ${c.bold}Criterios de aceptación:${c.reset}`);
      s.criteria.slice(0, 8).forEach((ac, i) => console.log(`    ${i + 1}. ${ac}`));
    }
    const prompt = s.flow_ids.length ? `@implement.md ${s.flow_ids[0]}` : `@implement.md`;
    console.log(`\n  ${c.cyan}Prompt para implementar:${c.reset}  ${c.bold}${prompt}${c.reset}`);
  }

  function showFlowDetail(f) {
    console.log(`\n  ${c.bold}${f.id}${c.reset}  ${f.name}`);
    console.log(`  ${c.dim}Módulo: ${f.module}  ·  Historia: ${f.story || '—'}  ·  ${f.status} / ${f.test_status}${c.reset}`);
    if (f.trigger) console.log(`  ${c.dim}Trigger: ${f.trigger}${c.reset}`);
    if (f.steps.length) {
      console.log(`\n  ${c.bold}Pasos:${c.reset}`);
      f.steps.forEach((step, i) => console.log(`    ${i + 1}. ${step}`));
    }
    console.log(`\n  ${c.cyan}Prompt:${c.reset}  ${c.bold}@implement.md ${f.id}${c.reset}`);
  }

  function showPromptDetail(filename) {
    const fullPath = path.join(promptsDir, filename);
    if (!fileExists(fullPath)) return;
    const text = fs.readFileSync(fullPath, 'utf8');
    const lines = text.split('\n').slice(0, 25);
    console.log(`\n  ${c.bold}${filename}${c.reset}`);
    console.log(`  ${c.dim}Ruta: .flowdocs/prompts/${filename}${c.reset}\n`);
    console.log(lines.join('\n'));
    if (lines.length >= 25) console.log('\n  ...');
    const copyCmd = process.platform === 'darwin' ? `cat .flowdocs/prompts/${filename} | pbcopy` : process.platform === 'win32' ? `type .flowdocs\\prompts\\${filename} | clip` : `cat .flowdocs/prompts/${filename} | xclip -selection clipboard`;
    console.log(`\n  ${c.cyan}Para copiar:${c.reset} ${c.dim}${copyCmd}${c.reset}`);
    console.log(`  ${c.cyan}En el chat:${c.reset} @${filename}`);
  }

  async function mainMenu() {
    showDashboard();
    console.log(`  ${c.bold}1.${c.reset} Dashboard (resumen)`);
    console.log(`  ${c.bold}2.${c.reset} Historias de usuario`);
    console.log(`  ${c.bold}3.${c.reset} Flujos`);
    console.log(`  ${c.bold}4.${c.reset} Prompts a copiar`);
    console.log(`  ${c.bold}q.${c.reset} Salir`);
    const a = await ask(`\n  Opción: `);
    const choice = (a || '').trim().toLowerCase();
    if (choice === 'q' || choice === '0') {
      rl.close();
      process.exit(0);
    }
    if (choice === '1') { await pause(); return mainMenu(); }
    if (choice === '2') { await submenuStories(); return mainMenu(); }
    if (choice === '3') { await submenuFlows(); return mainMenu(); }
    if (choice === '4') { await submenuPrompts(); return mainMenu(); }
    return mainMenu();
  }

  async function submenuStories() {
    showStoriesList();
    const a = await ask(`\n  Opción: `);
    const n = parseInt(a, 10);
    if (n === 0 || isNaN(n)) return;
    const s = stories[n - 1];
    if (!s) return submenuStories();
    showStoryDetail(s);
    await pause();
    await submenuStories();
  }

  async function submenuFlows() {
    showFlowsList();
    const a = await ask(`\n  Opción: `);
    const n = parseInt(a, 10);
    if (n === 0 || isNaN(n)) return;
    const f = flows[n - 1];
    if (!f) return submenuFlows();
    showFlowDetail(f);
    await pause();
    await submenuFlows();
  }

  async function submenuPrompts() {
    const files = showPromptsList();
    const a = await ask(`\n  Opción: `);
    const n = parseInt(a, 10);
    if (n === 0 || isNaN(n)) return;
    const filename = files[n - 1];
    if (!filename) return submenuPrompts();
    showPromptDetail(filename);
    await pause();
    await submenuPrompts();
  }

  mainMenu();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const cmd = process.argv[2];

(async () => {
  switch (cmd) {
    case 'init':         await cmdInit();         break;
    case 'update':       await cmdUpdate();      break;
    case 'install-swarm': await cmdInstallSwarm(); break;
    case 'status':       cmdStatus();            break;
    case 'open':         cmdOpen();              break;
    case 'tui':          cmdTui();               break;
    case 'plan-sprint':  cmdPlanSprint();        break;
    case 'publish':      await cmdPublish();     break;
    case 'usage':        cmdUsage();             break;
    default:             cmdHelp();              break;
  }
})().catch(e => {
  console.error(`\n  ${c.red}Error:${c.reset} ${e.message}\n`);
  process.exit(1);
});
