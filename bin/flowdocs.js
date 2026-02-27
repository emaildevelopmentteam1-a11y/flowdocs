#!/usr/bin/env node

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

// ─── Configuración ────────────────────────────────────────────────────────────

const REPO_BASE = 'https://raw.githubusercontent.com/emaildevelopmentteam1-a11y/flowdocs/main';
const SWARM_REPO = 'https://github.com/wjgoarxiv/antigravity-swarm.git';
const SWARM_DIR_DEFAULT = '.gemini/skills/antigravity-swarm'; // relativo a HOME

// Prompts base del AGENT_POOL de antigravity-swarm (Oh-My-Opencode) — dan contexto real al rol, no solo el nombre
const SWARM_AGENT_PROMPTS = {
  Oracle: 'You are Oracle. Your role is to provide deep architectural insights, debug complex issues, and find root causes. You do not write simple code; you solve hard problems.',
  Frontend: 'You are Frontend. Your role is to implement the user interface. You care about pixel-perfect design, accessibility, and smooth interactions. Apply UX/UI best practices: accessibility (a11y), responsive layout, clear feedback, and consistent design system.',
  Junior: 'You are Junior. Your role is to do the work. You write the code, run the commands, and fix the bugs.',
  Quality_Validator: 'You are Quality_Validator. Your role is to verify the work. You run tests, check files, and ensure the mission is complete. You are the final gatekeeper.'
};
const SWARM_AGENT_COLORS = { Oracle: 'magenta', Frontend: 'green', Junior: 'yellow', Quality_Validator: 'green' };
const UI_MODULES = ['pos', 'catalog', 'orders', 'customers', 'reports', 'settings', 'auth']; // módulos que suelen tener UI

// Keywords que deben aparecer en el nombre del skill (carpeta) para considerarlo UX/UI — así no se cuelan skills genéricos
const UX_UI_SKILL_NAME_KEYWORDS = ['ux', 'ui', 'a11y', 'accessibility', 'usability', 'frontend', 'design-system', 'usabilidad', 'diseño', 'accesibilidad'];
// Además se comprueba el contenido: si el nombre no coincide, pero el body tiene 2+ de estos, también cuenta
const UX_UI_SKILL_BODY_KEYWORDS = ['ux', 'ui', 'accessibility', 'a11y', 'frontend', 'usability', 'user experience', 'figma', 'usabilidad', 'diseño', 'accesibilidad'];

/** Descubre skills registrados en el sistema que tratan de UX/UI y devuelve su contenido para inyectar en agentes Frontend. */
function getUxUiSkillsContent(cwd) {
  const home = os.homedir();
  const base = cwd || process.cwd();
  const skillsDirs = [
    path.join(base, '.agent', 'skills'),   // gravity / antigravity (p. ej. sarchi)
    path.join(home, '.cursor', 'skills-cursor'),
    path.join(base, '.cursor', 'skills')
  ].filter(dir => fs.existsSync(dir));

  const collected = [];
  for (const dir of skillsDirs) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const skillPath = path.join(dir, ent.name, 'SKILL.md');
      if (!fs.existsSync(skillPath)) continue;
      let raw = '';
      try {
        raw = fs.readFileSync(skillPath, 'utf8');
      } catch (_) {
        continue;
      }
      const lowerName = ent.name.toLowerCase();
      const lower = raw.toLowerCase();
      const nameMatches = UX_UI_SKILL_NAME_KEYWORDS.some(kw => lowerName.includes(kw));
      const bodyKeywordCount = UX_UI_SKILL_BODY_KEYWORDS.filter(kw => lower.includes(kw)).length;
      const isUxUi = nameMatches || bodyKeywordCount >= 3;
      if (!isUxUi) continue;
      const maxPerSkill = 10000;
      const excerpt = raw.length > maxPerSkill ? raw.slice(0, maxPerSkill) + '\n\n[... truncado ...]' : raw;
      collected.push({ name: ent.name, text: `### Skill: ${ent.name}\n\n${excerpt}` });
    }
  }
  const maxSkills = 5;
  const maxTotalChars = 35000;
  let total = 0;
  const selected = [];
  for (const item of collected) {
    if (selected.length >= maxSkills || total + item.text.length > maxTotalChars) break;
    selected.push(item.text);
    total += item.text.length;
  }
  if (selected.length === 0) return '';
  return '\n\n## Registered UX/UI skills (read and apply when relevant)\n\n' + selected.join('\n\n---\n\n');
}

const FILES = {
  viewer: 'viewer.html',
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
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const ok = (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const err = (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.blue}→${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}!${c.reset} ${msg}`);
const dim = (msg) => console.log(`${c.gray}${msg}${c.reset}`);

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
  const promptsDir = path.join(flowdocsDir, 'prompts');

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
    } catch (e) {
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
  let failed = 0;

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
      { remote: 'viewer.html', local: path.join(flowdocsDir, 'viewer.html') },
      { remote: '.cursorrules', local: path.join(flowdocsDir, '.cursorrules') },
      { remote: 'bin/flowdocs.js', local: path.join(flowdocsDir, 'bin', 'flowdocs.js') },
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
      } catch (e) { }
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

function cmdPull() {
  const cwd = process.cwd();
  const flowdocsDir = path.join(cwd, '.flowdocs');

  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs${c.reset} — sincronizar desde node_modules`);
  console.log('');

  if (!fileExists(flowdocsDir)) {
    err('.flowdocs/ no encontrado — ejecuta "flowdocs init" primero');
    console.log('');
    process.exit(1);
  }

  // Buscar flowdocs en node_modules
  const nmSource = path.join(cwd, 'node_modules', 'flowdocs');
  if (!fileExists(nmSource) || !fileExists(path.join(nmSource, 'viewer.html'))) {
    err('No se encontró flowdocs en node_modules/');
    info('Asegúrate de tener "flowdocs": "file:../flowdocs" en package.json y ejecutar npm install');
    console.log('');
    process.exit(1);
  }

  info(`Origen: ${c.bold}${nmSource}${c.reset}`);
  let count = 0;

  // 1. Copiar viewer.html
  const viewerSrc = path.join(nmSource, 'viewer.html');
  if (fileExists(viewerSrc)) {
    fs.copyFileSync(viewerSrc, path.join(flowdocsDir, 'viewer.html'));
    ok('viewer.html');
    count++;
  }

  // 2. Copiar prompts
  const promptsSrc = path.join(nmSource, 'prompts');
  const promptsDest = path.join(flowdocsDir, 'prompts');
  if (fileExists(promptsSrc)) {
    ensureDir(promptsDest);
    const files = fs.readdirSync(promptsSrc).filter(f => f.endsWith('.md'));
    for (const f of files) {
      fs.copyFileSync(path.join(promptsSrc, f), path.join(promptsDest, f));
      count++;
    }
    ok(`${files.length} prompts`);
  }

  // 3. Copiar workflows (.agent/workflows/)
  const wfSrc = path.join(nmSource, '.agent', 'workflows');
  const wfDest = path.join(cwd, '.agent', 'workflows');
  if (fileExists(wfSrc)) {
    ensureDir(wfDest);
    const files = fs.readdirSync(wfSrc).filter(f => f.endsWith('.md'));
    for (const f of files) {
      fs.copyFileSync(path.join(wfSrc, f), path.join(wfDest, f));
      count++;
    }
    ok(`${files.length} workflows`);
  }

  // 4. Copiar skills (.agent/skills/)
  const skillsSrc = path.join(nmSource, '.agent', 'skills');
  const skillsDest = path.join(cwd, '.agent', 'skills');
  if (fileExists(skillsSrc)) {
    ensureDir(skillsDest);
    const entries = fs.readdirSync(skillsSrc, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const srcDir = path.join(skillsSrc, ent.name);
        const destDir = path.join(skillsDest, ent.name);
        ensureDir(destDir);
        // Copiar recursivamente archivos del skill
        const skillFiles = fs.readdirSync(srcDir);
        for (const sf of skillFiles) {
          const sfPath = path.join(srcDir, sf);
          if (fs.statSync(sfPath).isFile()) {
            fs.copyFileSync(sfPath, path.join(destDir, sf));
            count++;
          }
        }
      }
    }
    ok(`skills sincronizados`);
  }

  // 5. Copiar .cursorrules si existe
  const rulesSrc = path.join(nmSource, '.cursorrules');
  if (fileExists(rulesSrc)) {
    fs.copyFileSync(rulesSrc, path.join(flowdocsDir, '.cursorrules'));
    ok('.cursorrules');
    count++;
  }

  // 6. Copiar bin/flowdocs.js
  const binSrc = path.join(nmSource, 'bin', 'flowdocs.js');
  const binDest = path.join(flowdocsDir, 'bin', 'flowdocs.js');
  if (fileExists(binSrc)) {
    ensureDir(path.dirname(binDest));
    fs.copyFileSync(binSrc, binDest);
    ok('bin/flowdocs.js');
    count++;
  }

  console.log('');
  ok(`${c.bold}${count} archivos${c.reset} sincronizados desde node_modules/flowdocs`);
  warn('flows.yaml, bugs/ y datos del proyecto NO fueron modificados');
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
  const flowdocsDir = path.join(cwd, '.flowdocs');

  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs Status${c.reset}`);
  console.log('');

  const project = loadProjectData(cwd);

  if (project.source === 'none') {
    err('flows.yaml no encontrado');
    info('Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  try {
    let app, version, total, impl, partial, pending, tests, cover, sprint, goal, days;
    let criticalNoTestList = [];

    if (project.source === 'modular' && project.data) {
      // Modo modular: datos ya ensamblados
      const d = project.data;
      app = d.meta?.app || 'Sin nombre';
      version = d.meta?.version || '?';
      total = d.meta?.stats?.total || 0;
      impl = d.meta?.stats?.implemented || 0;
      partial = d.meta?.stats?.partial || 0;
      pending = d.meta?.stats?.pending || 0;
      tests = d.meta?.stats?.with_tests || 0;
      cover = d.meta?.stats?.coverage_pct || 0;
      sprint = d.meta?.sprint?.number || '?';
      goal = d.meta?.sprint?.goal || 'Sin objetivo';
      days = d.meta?.sprint?.days_left != null ? d.meta.sprint.days_left : '?';

      // Flujos críticos sin tests
      criticalNoTestList = (d.flows || []).filter(f => f.priority === 'critical' && (f.test_status === 'none' || !f.test_status));
    } else {
      // Modo legacy: regex sobre flows.yaml
      const content = project.raw;
      const appMatch = content.match(/^\s+app:\s+"?([^"\n]+)"?/m);
      const versionMatch = content.match(/^\s+version:\s+"?([^"\n]+)"?/m);
      const totalMatch = content.match(/^\s+total:\s+(\d+)/m);
      const implMatch = content.match(/^\s+implemented:\s+(\d+)/m);
      const partialMatch = content.match(/^\s+partial:\s+(\d+)/m);
      const pendingMatch = content.match(/^\s+pending:\s+(\d+)/m);
      const testsMatch = content.match(/^\s+with_tests:\s+(\d+)/m);
      const coverMatch = content.match(/^\s+coverage_pct:\s+(\d+)/m);
      const sprintMatch = content.match(/^\s+number:\s+(\d+)/m);
      const goalMatch = content.match(/^\s+goal:\s+"?([^"\n]+)"?/m);
      const daysMatch = content.match(/^\s+days_left:\s+(\d+)/m);

      app = appMatch?.[1] || 'Sin nombre';
      version = versionMatch?.[1] || '?';
      total = parseInt(totalMatch?.[1] || '0');
      impl = parseInt(implMatch?.[1] || '0');
      partial = parseInt(partialMatch?.[1] || '0');
      pending = parseInt(pendingMatch?.[1] || '0');
      tests = parseInt(testsMatch?.[1] || '0');
      cover = parseInt(coverMatch?.[1] || '0');
      sprint = sprintMatch?.[1] || '?';
      goal = goalMatch?.[1] || 'Sin objetivo';
      days = daysMatch?.[1] || '?';

      // Flujos críticos sin tests (regex)
      const criticalNoTest = [...content.matchAll(/id:\s*"?(FLOW-\d+)"?[\s\S]*?priority:\s*"?critical"?[\s\S]*?test_status:\s*"?none"?/gm)];
      criticalNoTestList = criticalNoTest.map(m => {
        const nameMatch = content.slice(m.index).match(/name:\s*"?([^"\n]+)"?/);
        return { id: m[1], name: nameMatch?.[1] || '' };
      });
    }

    const impPct = total > 0 ? Math.round(impl / total * 100) : 0;
    const bar = buildBar(impPct, 30);

    console.log(`  ${c.bold}${app}${c.reset} ${c.gray}v${version}${c.reset}`);
    if (project.source === 'modular') dim(`  Modo: estructura modular`);
    console.log('');
    console.log(`  ${c.bold}Sprint ${sprint}${c.reset} ${c.gray}— ${days} días restantes${c.reset}`);
    console.log(`  ${c.dim}${goal}${c.reset}`);
    console.log('');
    console.log(`  Progreso  ${bar} ${c.bold}${impPct}%${c.reset}`);
    console.log('');
    console.log(`  ${c.green}${impl}${c.reset} implementados   ${c.yellow}${partial}${c.reset} parciales   ${c.gray}${pending}${c.reset} pendientes   de ${c.bold}${total}${c.reset} flujos`);
    console.log(`  ${c.cyan}${tests}${c.reset} con tests   ${c.bold}${cover}%${c.reset} cobertura`);

    // Bugs abiertos
    let openBugs = 0;
    if (project.source === 'modular' && project.data) {
      openBugs = (project.data.bugs || []).filter(b => b.status === 'open' || b.status === 'in_progress' || b.status === 'reopened').length;
    }
    if (openBugs > 0) {
      console.log(`  ${c.red}${openBugs}${c.reset} bugs abiertos`);
    }
    console.log('');

    if (criticalNoTestList.length > 0) {
      warn(`${criticalNoTestList.length} flujos críticos sin tests:`);
      criticalNoTestList.slice(0, 5).forEach(f => {
        console.log(`    ${c.red}•${c.reset} ${f.id} ${c.gray}${f.name || ''}${c.reset}`);
      });
      if (criticalNoTestList.length > 5) dim(`    ... y ${criticalNoTestList.length - 5} más`);
      console.log('');
    }

  } catch (e) {
    err(`Error leyendo datos: ${e.message}`);
  }

  console.log('');
}

const FLOWDOCS_PORT = 4848;
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
  const modular = isModular(flowdocsDir);

  const server = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0];

    // API: /api/project-data — devuelve datos ensamblados (modular o legacy)
    if (urlPath === '/api/project-data') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      const result = loadProjectData(cwd);
      if (result.source === 'modular' && result.data) {
        res.end(JSON.stringify(result.data));
      } else if (result.source === 'legacy') {
        // El viewer parseará el YAML él mismo en modo legacy
        res.end(JSON.stringify({ _legacy: true }));
      } else {
        res.end(JSON.stringify({ error: 'no data' }));
      }
      return;
    }

    // API: /api/hash — devuelve hash rápido de mtimes para detectar cambios
    if (urlPath === '/api/hash') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      try {
        let hashSum = 0;
        const dirs = ['sprints', 'stories', 'flows', 'bugs'];
        // mtime de project.yaml
        const projPath = path.join(flowdocsDirResolved, 'project.yaml');
        if (fileExists(projPath)) hashSum += fs.statSync(projPath).mtimeMs;
        // mtime de cada archivo en las carpetas
        for (const d of dirs) {
          const dirPath = path.join(flowdocsDirResolved, d);
          if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
            for (const f of files) {
              hashSum += fs.statSync(path.join(dirPath, f)).mtimeMs;
            }
            // También contar número de archivos para detectar creaciones/eliminaciones
            hashSum += files.length * 1000000;
          }
        }
        // También legacy flows.yaml
        const legacyPath = path.join(flowdocsDirResolved, 'flows.yaml');
        if (fileExists(legacyPath)) hashSum += fs.statSync(legacyPath).mtimeMs;
        res.end(JSON.stringify({ hash: String(hashSum) }));
      } catch (e) {
        res.end(JSON.stringify({ hash: '0' }));
      }
      return;
    }

    const subPath = (urlPath === '/' ? '/viewer.html' : urlPath).replace(/^\/+/, '');
    let filePath = path.resolve(flowdocsDirResolved, subPath);
    // Seguridad: no salir del directorio .flowdocs
    if (!filePath.startsWith(flowdocsDirResolved)) filePath = viewerPath;
    if (!fileExists(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
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
    } catch (_) { }
    ok('Viewer abierto — ' + url);
    if (modular) {
      info('Modo: estructura modular (project.yaml + carpetas)');
    } else {
      info('Modo: legacy (flows.yaml)');
    }
    dim('  Ctrl+C para cerrar.');
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
  console.log(`    ${c.cyan}flowdocs migrate${c.reset}     migrar flows.yaml a estructura modular`);
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
  console.log(`    ${c.cyan}migrate${c.reset}   Migra flows.yaml a estructura modular (project.yaml + carpetas)`);
  console.log(`    ${c.cyan}status${c.reset}    Muestra el resumen del proyecto en la terminal`);
  console.log(`    ${c.cyan}open${c.reset}     Abre el viewer (tablero visual) en el navegador`);
  console.log(`    ${c.cyan}tui${c.reset}          Modo terminal: navegar historias, flujos, prompts y estados`);
  console.log(`    ${c.cyan}plan-sprint${c.reset}  Genera task_plan.md y swarm-plan.yaml para cerrar el sprint con antigravity-swarm`);
  console.log(`    ${c.cyan}publish${c.reset}     (solo en repo flowdocs) Sube cambios: git add, commit, push`);
  console.log(`    ${c.cyan}usage${c.reset}    Muestra la descripción de uso completa`);
  console.log('');
  console.log(`  ${c.bold}Uso:${c.reset}`);
  console.log('');
  console.log(`    flowdocs init | update | migrate | status | open | tui | plan-sprint | publish | usage`);
  console.log('');
  console.log(`  ${c.bold}Primer paso:${c.reset} En Cursor/Antigravity escribe ${c.cyan}@discover.md${c.reset}`);
  console.log(`  ${c.bold}Ver protocolo:${c.reset} ${c.cyan}flowdocs usage${c.reset}`);
  console.log('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectProjectName(cwd) {
  // Intenta leer el nombre desde package.json, Gemfile, composer.json, etc.
  const files = [
    { path: 'package.json', parse: (c) => JSON.parse(c).name },
    { path: 'composer.json', parse: (c) => JSON.parse(c).name },
    { path: 'pubspec.yaml', parse: (c) => c.match(/^name:\s+(.+)/m)?.[1] },
    { path: 'Cargo.toml', parse: (c) => c.match(/^name\s*=\s*"(.+)"/m)?.[1] },
    { path: 'pyproject.toml', parse: (c) => c.match(/^name\s*=\s*"(.+)"/m)?.[1] },
  ];

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(cwd, f.path), 'utf8');
      const name = f.parse(content);
      if (name) return name;
    } catch { }
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
  } catch { }
}

function buildBar(pct, width) {
  const filled = Math.round(pct / 100 * width);
  const empty = width - filled;
  const color = pct === 100 ? c.green : pct > 50 ? c.cyan : c.yellow;
  return `${color}${'█'.repeat(filled)}${c.gray}${'░'.repeat(empty)}${c.reset}`;
}

/** Parse básico de flows.yaml para el TUI (sin dependencias YAML). */
function parseYamlForTui(content) {
  const meta = {};
  const appMatch = content.match(/^\s+app:\s*["']?([^"\n]+)["']?/m);
  const totalMatch = content.match(/^\s+total:\s+(\d+)/m);
  const implMatch = content.match(/^\s+implemented:\s+(\d+)/m);
  const partMatch = content.match(/^\s+partial:\s+(\d+)/m);
  const pendMatch = content.match(/^\s+pending:\s+(\d+)/m);
  const testsMatch = content.match(/^\s+with_tests:\s+(\d+)/m);
  const coverMatch = content.match(/^\s+coverage_pct:\s+(\d+)/m);
  const sprintMatch = content.match(/^\s+number:\s+(\d+)/m);
  const goalMatch = content.match(/^\s+goal:\s*["']?([^"\n]+)["']?/m);
  const daysMatch = content.match(/^\s+days_left:\s+(\d+)/m);
  meta.app = appMatch?.[1]?.trim() || 'Sin nombre';
  meta.total = parseInt(totalMatch?.[1] || '0');
  meta.impl = parseInt(implMatch?.[1] || '0');
  meta.partial = parseInt(partMatch?.[1] || '0');
  meta.pending = parseInt(pendMatch?.[1] || '0');
  meta.tests = parseInt(testsMatch?.[1] || '0');
  meta.cover = parseInt(coverMatch?.[1] || '0');
  meta.sprint = sprintMatch?.[1] || '?';
  meta.goal = goalMatch?.[1]?.trim() || '';
  meta.days = daysMatch?.[1] || '?';

  const flows = [];
  const flowIdRe = /^\s+-\s+id:\s*["']?(FLOW-[^\s"']+)["']?\s*$/gm;
  let m;
  while ((m = flowIdRe.exec(content)) !== null) {
    const start = m.index;
    const next = content.indexOf('\n  - ', start + 1);
    const block = next === -1 ? content.slice(start, start + 2000) : content.slice(start, next);
    const name = block.match(/name:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
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
      } catch (_) { }
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
  const sprintNumMatch = content.match(/\bsprint:\s*[\n\s]*number:\s*(\d+)/);
  const goalMatch = content.match(/\bgoal:\s*["']?([^"\n]+)["']?/);
  const appMatch = content.match(/^\s+app:\s*["']?([^"\n]+)["']?/m);
  const activeSprint = activeSprintMatch ? parseInt(activeSprintMatch[1], 10) : (sprintNumMatch ? parseInt(sprintNumMatch[1], 10) : 1);
  const goal = goalMatch ? goalMatch[1].trim() : 'Sprint ' + activeSprint;
  const app = appMatch ? appMatch[1].trim() : 'Proyecto';

  const flows = [];
  let m;
  FLOW_ID_RE.lastIndex = 0;
  while ((m = FLOW_ID_RE.exec(content)) !== null) {
    const start = m.index;
    const next = content.indexOf('\n  - ', start + 1);
    const block = next === -1 ? content.slice(start, start + 2500) : content.slice(start, next);
    const status = block.match(/status:\s*["']?(\w+)["']?/)?.[1] || 'pending';
    if (status !== 'pending' && status !== 'partial') continue;
    const sprint_status = block.match(/sprint_status:\s*["']?(\w+)["']?/)?.[1] || 'todo';
    const name = block.match(/name:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const story = block.match(/story:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const module = block.match(/module:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const trigger = block.match(/trigger:\s*["']?([^"\n]+)["']?/)?.[1]?.trim() || '';
    const stepsBlock = block.match(/steps:\s*\[([\s\S]*?)\]/);
    let steps = [];
    if (stepsBlock) {
      try {
        steps = stepsBlock[1].split(/,\s*/).map(s => s.replace(/^["'\s]+|["'\s]+$/g, '').trim()).filter(Boolean).slice(0, 12);
      } catch (_) { }
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
  const outDir = cwd;
  const flowdocsDir = path.join(cwd, '.flowdocs');

  const project = loadProjectData(cwd);

  if (project.source === 'none') {
    err('flows.yaml no encontrado. Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  let activeSprint, goal, app, flows, openBugs = [];

  if (project.source === 'modular' && project.data) {
    // Modo modular
    const d = project.data;
    activeSprint = d.meta?.active_sprint || 1;
    goal = d.meta?.sprint?.goal || 'Sprint ' + activeSprint;
    app = d.meta?.app || 'Proyecto';
    // Solo flujos pendientes o parciales
    flows = (d.flows || []).filter(f => f.status === 'pending' || f.status === 'partial').map(f => ({
      id: f.id, name: f.name || '', story: f.story || '', module: f.module || '',
      status: f.status || 'pending', sprint_status: f.sprint_status || 'todo',
      trigger: f.trigger || '', steps: Array.isArray(f.steps) ? f.steps.slice(0, 12) : []
    }));
    // Bugs abiertos vinculados al sprint activo
    const sprintData = d.meta?.sprint;
    const sprintBugIds = new Set((sprintData?.bugs || []).map(b => b.id || b));
    openBugs = (d.bugs || []).filter(b =>
      (b.status === 'open' || b.status === 'in_progress') &&
      (sprintBugIds.size === 0 || sprintBugIds.has(b.id))
    ).map(b => ({
      id: b.id, title: b.title || b.description || '', severity: b.severity || 'medium',
      status: b.status || 'open', flow_id: b.flow_id || '', story_id: b.story_id || '',
      sprint_status: b.sprint_status || 'todo'
    }));
  } else {
    // Modo legacy
    const content = project.raw;
    ({ activeSprint, goal, app, flows } = parseYamlForSprintPlan(content));
  }

  console.log('');
  console.log(`  ${c.bold}${c.cyan}FlowDocs — Plan de sprint para swarm${c.reset}`);
  console.log(`  ${c.bold}${app}${c.reset}  Sprint ${activeSprint} — ${c.dim}${goal}${c.reset}`);
  if (openBugs.length) console.log(`  ${c.red}${openBugs.length} bugs abiertos${c.reset}`);
  console.log('');

  if (flows.length === 0 && openBugs.length === 0) {
    warn('No hay flujos pendientes ni bugs abiertos.');
    info('Actualiza status/sprint_status en los flujos o añade bugs al sprint.');
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

  // Bugs abiertos
  if (openBugs.length) {
    taskLines.push('## Bugs por resolver');
    taskLines.push('');
    for (const b of openBugs) {
      const prompt = `@implement.md ${b.flow_id || b.id}`;
      taskLines.push(`- [ ] **${b.id}** — ${b.title}`);
      taskLines.push(`  - Severidad: ${b.severity} · Estado: ${b.status}`);
      if (b.flow_id) taskLines.push(`  - Flujo: ${b.flow_id}`);
      if (b.story_id) taskLines.push(`  - Historia: ${b.story_id}`);
      taskLines.push(`  - Prompt: \`${prompt}\``);
      taskLines.push('');
    }
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
  taskLines.push('3. El Quality_Validator al final: verifica, actualiza .flowdocs/flows.yaml (como @update.md) y ejecuta flowdocs open para que veas la documentación actualizada.');
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

  // Generar subagents.yaml: Oracle (arquitecto) → Juniors/Frontends (serial, según módulo UI) → Quality_Validator
  const subagentsPath = path.join(outDir, 'subagents.yaml');
  const subagentLines = [
    '# Generado por flowdocs plan-sprint — prompts del AGENT_POOL de antigravity-swarm (Oh-My-Opencode)',
    '# Orden: Oracle (fase arquitecto) → implementadores en serial (Frontend para UI, Junior para resto) → Quality_Validator',
    '',
    'subagents:'
  ];

  // 1. Oracle: corre primero (parallel), analiza dependencias y migraciones, escribe findings.md
  const oracleMission = [
    'Mission (run FIRST): Read task_plan.md and .flowdocs/flows.yaml.',
    'Identify: 1) Dependencies between stories/flows (same module, shared entities, story order).',
    '2) Migration and backend touch points (schema, APIs, shared files) that could conflict if done in parallel.',
    '3) Recommended execution order so implementers do not clash.',
    'Write everything to findings.md: section "Execution order" (list FLOW-IDs in order), "Migration strategy", "Constraints for implementers".',
    'Implementers will read findings.md before starting.'
  ].join(' ');
  const oraclePrompt = SWARM_AGENT_PROMPTS.Oracle + '\n\n' + oracleMission;
  subagentLines.push('  - name: "Oracle"');
  subagentLines.push('    description: "Analizar dependencias entre historias/flujos y estrategia de migraciones"');
  subagentLines.push('    color: "magenta"');
  subagentLines.push('    model: "auto-gemini-3"');
  subagentLines.push('    mode: "parallel"');
  subagentLines.push('    prompt: |');
  subagentLines.push('      ' + oraclePrompt.split('\n').join('\n      '));
  subagentLines.push('');

  const uxUiSkillsBlock = getUxUiSkillsContent(cwd);
  let frontendCount = 0;
  let juniorCount = 0;
  const colors = ['yellow', 'cyan', 'green', 'blue', 'magenta'];
  flows.forEach((f, i) => {
    const isUI = UI_MODULES.indexOf((f.module || '').toLowerCase()) >= 0;
    const role = isUI ? 'Frontend' : 'Junior';
    if (isUI) frontendCount++; else juniorCount++;
    const safeName = f.id.replace(/[^a-zA-Z0-9-]/g, '_');
    const roleName = `${role}_${safeName}`;
    const color = SWARM_AGENT_COLORS[role] || colors[i % colors.length];
    const stepsList = f.steps.length ? f.steps.slice(0, 8).map(s => '  - ' + s.replace(/"/g, "'")).join('\n') : '  (ver .flowdocs/flows.yaml)';
    const implementMission = [
      'Read findings.md FIRST (Oracle wrote execution order and migration/backend constraints). Follow them.',
      'Your ONLY task is to implement the FlowDocs flow ' + f.id + '.',
      'Read .flowdocs/flows.yaml and .flowdocs/prompts/implement.md.',
      'Flow: ' + (f.name || f.id) + '. Module: ' + (f.module || '') + '. Story: ' + (f.story || '') + '.',
      (f.trigger ? 'Trigger: ' + f.trigger + '.' : ''),
      'Steps:', stepsList,
      'When done, append to progress.md: "' + f.id + ' implemented" and, if you added tests, the test file path (e.g. "tests: src/tests/foo.spec.ts").'
    ].filter(Boolean).join('\n');
    const basePrompt = SWARM_AGENT_PROMPTS[role] + (role === 'Frontend' && uxUiSkillsBlock ? uxUiSkillsBlock : '');
    const fullPrompt = basePrompt + '\n\n' + implementMission;
    const promptEscaped = fullPrompt.split('\n').map(l => '      ' + l).join('\n');
    subagentLines.push(`  - name: "${roleName}"`);
    subagentLines.push(`    description: "Implement ${f.id} — ${(f.name || '').slice(0, 50)}"`);
    subagentLines.push(`    color: "${color}"`);
    subagentLines.push(`    model: "auto-gemini-3"`);
    subagentLines.push(`    mode: "serial"`);
    subagentLines.push(`    prompt: |`);
    subagentLines.push(promptEscaped);
    subagentLines.push('');
  });

  const validatorMission = [
    '1) Verify every flow in task_plan.md was implemented (check progress.md and codebase). Run tests if present.',
    '2) Update .flowdocs/flows.yaml: for each flow in progress.md as implemented, set status to "implemented", sprint_status to "done", test_status to "covered" or "none" (use test paths from progress.md). Follow .flowdocs/prompts/update.md.',
    '3) Run: flowdocs open (or node .flowdocs/bin/flowdocs.js open) so the user sees the updated documentation. If headless, tell the user to run flowdocs open.'
  ].join(' ');
  const validatorPrompt = SWARM_AGENT_PROMPTS.Quality_Validator + '\n\n' + validatorMission;
  subagentLines.push('  - name: "Quality_Validator"');
  subagentLines.push('    description: "Verify, update flows.yaml and run flowdocs open"');
  subagentLines.push('    color: "green"');
  subagentLines.push('    model: "auto-gemini-3"');
  subagentLines.push('    mode: "validator"');
  subagentLines.push('    prompt: |');
  subagentLines.push('      ' + validatorPrompt.split('\n').join('\n      '));

  fs.writeFileSync(subagentsPath, subagentLines.join('\n'), 'utf8');
  ok(`subagents.yaml escrito en ${path.relative(cwd, subagentsPath)} (para antigravity-swarm)`);

  console.log('');
  dim(`  Flujos: ${flows.length} → 1 Oracle + ${frontendCount} Frontend (UI) + ${juniorCount} Junior (serial) + 1 Quality_Validator`);
  dim(`  Siguiente: python3 ~/.gemini/skills/antigravity-swarm/scripts/orchestrator.py`);
  console.log('');
}

function cmdTui() {
  const cwd = process.cwd();
  const promptsDir = path.join(cwd, '.flowdocs', 'prompts');

  const project = loadProjectData(cwd);

  if (project.source === 'none') {
    err('flows.yaml no encontrado. Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  let meta, flows, stories;

  if (project.source === 'modular' && project.data) {
    // Modo modular: convertir datos ensamblados al formato del TUI
    const d = project.data;
    meta = {
      app: d.meta?.app || 'Sin nombre',
      total: d.meta?.stats?.total || 0,
      impl: d.meta?.stats?.implemented || 0,
      partial: d.meta?.stats?.partial || 0,
      pending: d.meta?.stats?.pending || 0,
      tests: d.meta?.stats?.with_tests || 0,
      cover: d.meta?.stats?.coverage_pct || 0,
      sprint: d.meta?.sprint?.number || '?',
      goal: d.meta?.sprint?.goal || '',
      days: d.meta?.sprint?.days_left != null ? d.meta.sprint.days_left : '?'
    };
    flows = (d.flows || []).map(f => ({
      id: f.id, name: f.name || '', status: f.status || 'pending',
      test_status: f.test_status || 'none', sprint_status: f.sprint_status || 'todo',
      module: f.module || '', story: f.story || '', trigger: f.trigger || '',
      steps: Array.isArray(f.steps) ? f.steps : []
    }));
    stories = (d.stories || []).map(s => ({
      id: s.id, title: s.title || '', status: s.status || 'pending',
      flow_ids: Array.isArray(s.flow_ids) ? s.flow_ids : [],
      criteria: Array.isArray(s.acceptance_criteria)
        ? s.acceptance_criteria.map(ac => typeof ac === 'object' ? ac.description || '' : ac)
        : []
    }));
  } else {
    // Modo legacy: regex
    const content = project.raw;
    ({ meta, flows, stories } = parseYamlForTui(content));
  }

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
    } catch (_) { }
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

// ─── Estructura modular ───────────────────────────────────────────────────────

/** Detecta si el proyecto usa estructura modular (project.yaml) o legacy (flows.yaml). */
function isModular(flowdocsDir) {
  return fileExists(path.join(flowdocsDir, 'project.yaml'));
}

/** Parse minimalista de YAML simple (sin dependencias). Soporta listas, mapas anidados y escalares. */
function parseSimpleYaml(text) {
  // Usa JSON inline si exist  — algunos campos como steps, test_files, etc. son arrays inline
  // Para archivos sencillos con indentación estándar, parsear manualmente.
  // En producción usa jsyaml si está disponible; si no, fallback a regex.
  try {
    // Intentar cargar jsyaml: busca en el CLI local, global y en el proyecto
    const searchPaths = [path.join(__dirname, '..'), __dirname, path.join(process.cwd(), '.flowdocs'), process.cwd()];
    const jsyaml = require(require.resolve('js-yaml', { paths: searchPaths }));
    return jsyaml.load(text);
  } catch (_) { }
  // Fallback: solo soporta formato "key: value" simple con listas inline
  // Para la estructura modular los archivos son bastante simples
  const result = {};
  const lines = text.split('\n');
  let currentKey = null;
  let currentIndent = 0;
  const stack = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Lista inline: key: [val1, val2]
    const inlineListMatch = trimmed.match(/^(\w[\w_-]*):\s*\[(.*)]\s*$/);
    if (inlineListMatch) {
      const key = inlineListMatch[1];
      const vals = inlineListMatch[2].split(',').map(v => v.replace(/^[\s"']+|[\s"']+$/g, '')).filter(Boolean);
      const parent = stack[stack.length - 1].obj;
      if (parent) parent[key] = vals;
      continue;
    }

    // key: value
    const kvMatch = trimmed.match(/^(\w[\w_-]*):\s*(.+)$/);
    if (kvMatch && !kvMatch[2].startsWith('{')) {
      // Ajustar stack
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
      const parent = stack[stack.length - 1].obj;
      if (parent) {
        let val = kvMatch[2].replace(/^["']|["']$/g, '').trim();
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val === 'null' || val === '~') val = null;
        else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
        else if (/^-?\d+\.\d+$/.test(val)) val = parseFloat(val);
        parent[kvMatch[1]] = val;
      }
      continue;
    }

    // key: (sin valor — comienza objeto anidado)
    const objMatch = trimmed.match(/^(\w[\w_-]*):\s*$/);
    if (objMatch) {
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
      const parent = stack[stack.length - 1].obj;
      const child = {};
      if (parent) parent[objMatch[1]] = child;
      stack.push({ obj: child, indent });
      continue;
    }

    // - item (lista)
    const listMatch = trimmed.match(/^-\s+(.+)$/);
    if (listMatch) {
      // Por ahora ignoramos listas complejas en el fallback
      continue;
    }
  }
  return result;
}

/** Lee un archivo YAML y devuelve el objeto parseado. Retorna null si falla. */
function readYamlFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    // Intentar js-yaml primero (parsea arrays de objetos correctamente)
    try {
      const searchPaths = [path.join(__dirname, '..'), __dirname, path.join(process.cwd(), '.flowdocs'), process.cwd()];
      const jsyaml = require(require.resolve('js-yaml', { paths: searchPaths }));
      return jsyaml.load(text);
    } catch (_) { }
    // Fallback a parser regex (solo soporta YAML simple)
    return parseSimpleYaml(text);
  } catch (_) {
    return null;
  }
}

/** Lee todos los archivos .yaml de un directorio y devuelve un array de objetos. */
function readYamlDir(dirPath) {
  if (!fileExists(dirPath)) return [];
  try {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).sort();
    return files.map(f => readYamlFile(path.join(dirPath, f))).filter(Boolean);
  } catch (_) {
    return [];
  }
}

/**
 * Ensambla los datos del proyecto desde la estructura modular.
 * Lee project.yaml + carpetas stories/, flows/, sprints/, bugs/ y
 * devuelve un objeto unificado compatible con el formato del viewer.
 */
function assembleModular(flowdocsDir) {
  const projectData = readYamlFile(path.join(flowdocsDir, 'project.yaml'));
  if (!projectData) return null;

  const meta = projectData.meta || {};
  const modules = projectData.modules || [];
  const entities = projectData.entities || [];

  // Leer sprints
  const sprintsRaw = readYamlDir(path.join(flowdocsDir, 'sprints'));
  const sprints = sprintsRaw.map(s => s.sprint || s).filter(s => s && s.number != null);

  // Leer historias
  const storiesRaw = readYamlDir(path.join(flowdocsDir, 'stories'));
  const stories = storiesRaw.map(s => s.story || s).filter(s => s && s.id);

  // Leer flujos
  const flowsRaw = readYamlDir(path.join(flowdocsDir, 'flows'));
  const flows = flowsRaw.map(f => f.flow || f).filter(f => f && f.id);

  // Leer bugs
  const bugsRaw = readYamlDir(path.join(flowdocsDir, 'bugs'));
  const bugs = bugsRaw.map(b => b.bug || b).filter(b => b && b.id);

  // Resolver sprint_status de flujos desde el sprint activo
  const activeSprint = meta.active_sprint || (sprints.length ? Math.max(...sprints.map(s => s.number)) : 1);
  const activeSprintData = sprints.find(s => s.number === activeSprint);
  if (activeSprintData && Array.isArray(activeSprintData.flows)) {
    for (const sf of activeSprintData.flows) {
      const flow = flows.find(f => f.id === sf.id);
      if (flow && sf.sprint_status) {
        flow.sprint_status = sf.sprint_status;
      }
    }
  }

  // Resolver sprint_status de bugs desde los sprints
  for (const sp of sprints) {
    if (Array.isArray(sp.bugs)) {
      for (const sb of sp.bugs) {
        const bugId = sb.id || sb;
        const bug = bugs.find(b => b.id === bugId);
        if (bug) {
          if (sb.sprint_status) bug.sprint_status = sb.sprint_status;
          bug.sprint = sp.number;
        }
      }
    }
  }

  // Construir stats
  const total = flows.length;
  const implemented = flows.filter(f => f.status === 'implemented').length;
  const partial = flows.filter(f => f.status === 'partial').length;
  const pending = total - implemented - partial;
  const withTests = flows.filter(f => f.test_status === 'covered' || f.test_status === 'partial').length;
  const coveragePct = total > 0 ? Math.round(withTests / total * 100) : 0;

  // Sprint activo como objeto para atrás compatibilidad
  const sprintObj = activeSprintData || sprints[sprints.length - 1] || { number: 1, goal: '', start: '', end: '', days_left: 0 };

  return {
    meta: {
      ...meta,
      active_sprint: activeSprint,
      sprint: sprintObj,
      sprints,
      stats: { total, implemented, partial, pending, with_tests: withTests, coverage_pct: coveragePct }
    },
    modules,
    entities,
    stories,
    flows,
    bugs
  };
}

/**
 * Carga los datos del proyecto: detecta modular vs legacy y retorna
 * un objeto unificado { meta, modules, entities, stories, flows, bugs }.
 * También retorna { data, source: 'modular'|'legacy' }.
 */
function loadProjectData(cwd) {
  const flowdocsDir = path.join(cwd, '.flowdocs');

  // Modular: project.yaml + carpetas
  if (isModular(flowdocsDir)) {
    const data = assembleModular(flowdocsDir);
    if (data) return { data, source: 'modular' };
  }

  // Legacy: flows.yaml
  const yamlPath = path.join(flowdocsDir, 'flows.yaml');
  if (fileExists(yamlPath)) {
    const content = fs.readFileSync(yamlPath, 'utf8');
    return { data: null, source: 'legacy', raw: content };
  }

  return { data: null, source: 'none' };
}

/** Genera manifest.yaml con los IDs de todos los archivos en las carpetas modulares. */
function writeManifest(flowdocsDir) {
  const dirs = ['sprints', 'stories', 'flows', 'bugs'];
  const manifest = {};

  for (const dir of dirs) {
    const fullDir = path.join(flowdocsDir, dir);
    if (!fileExists(fullDir)) {
      manifest[dir] = [];
      continue;
    }
    try {
      manifest[dir] = fs.readdirSync(fullDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
        .sort()
        .map(f => f.replace(/\.(yaml|yml)$/, ''));
    } catch (_) {
      manifest[dir] = [];
    }
  }

  // Serializar como YAML simple (sin dependencias)
  let out = '# FlowDocs manifest — generado automáticamente\n';
  out += `# Última actualización: ${new Date().toISOString().split('T')[0]}\n\n`;
  for (const [key, files] of Object.entries(manifest)) {
    out += `${key}: [${files.map(f => `"${f}"`).join(', ')}]\n`;
  }

  writeFile(path.join(flowdocsDir, 'manifest.yaml'), out);
  return manifest;
}

/** Serializa un objeto JavaScript como YAML simple (sin dependencias externas). */
function serializeYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let out = '';

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    // Arrays de escalares simples: inline
    if (obj.every(v => typeof v !== 'object' || v === null)) {
      return '[' + obj.map(v => typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : String(v)).join(', ') + ']';
    }
    // Arrays de objetos: items con -
    for (const item of obj) {
      out += `${pad}- `;
      if (typeof item === 'object' && item !== null) {
        const entries = Object.entries(item);
        if (entries.length === 0) { out += '{}\n'; continue; }
        // Primera propiedad en la misma línea que -
        const [k0, v0] = entries[0];
        if (typeof v0 === 'object' && v0 !== null && !Array.isArray(v0)) {
          out += `${k0}:\n`;
          out += serializeYaml(v0, indent + 2);
        } else {
          const val = serializeValue(v0, indent + 1);
          out += `${k0}: ${val}\n`;
        }
        // Resto de propiedades indentadas bajo el -
        for (let i = 1; i < entries.length; i++) {
          const [k, v] = entries[i];
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            out += `${pad}  ${k}:\n`;
            out += serializeYaml(v, indent + 2);
          } else {
            out += `${pad}  ${k}: ${serializeValue(v, indent + 1)}\n`;
          }
        }
      } else {
        out += `${serializeValue(item, indent)}\n`;
      }
    }
    return out;
  }

  if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
        out += `${pad}${key}:\n`;
        out += serializeYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        const arr = serializeValue(value, indent + 1);
        if (arr.includes('\n')) {
          out += `${pad}${key}:\n${arr}`;
        } else {
          out += `${pad}${key}: ${arr}\n`;
        }
      } else {
        out += `${pad}${key}: ${serializeValue(value, indent)}\n`;
      }
    }
    return out;
  }

  return `${pad}${serializeValue(obj, indent)}\n`;
}

function serializeValue(val, indent) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    if (val === '') return '""';
    // Multiline strings (diagramas, etc)
    if (val.includes('\n')) {
      const pad = '  '.repeat(indent + 1);
      return '|\n' + val.split('\n').map(l => pad + l).join('\n');
    }
    // Strings que necesitan comillas
    if (val.match(/[:#{}[\],&*?|>!%@`]/)) return `"${val.replace(/"/g, '\\"')}"`;
    return `"${val}"`;
  }
  if (Array.isArray(val)) return serializeYaml(val, indent);
  return String(val);
}

/** Migra flows.yaml monolítico a estructura modular. */
function cmdMigrate() {
  const cwd = process.cwd();
  const flowdocsDir = path.join(cwd, '.flowdocs');
  const yamlPath = path.join(flowdocsDir, 'flows.yaml');
  const projectPath = path.join(flowdocsDir, 'project.yaml');

  console.log('');
  console.log(`${c.bold}${c.cyan}  FlowDocs${c.reset} — migrar a estructura modular`);
  console.log('');

  if (isModular(flowdocsDir)) {
    warn('project.yaml ya existe — el proyecto ya usa estructura modular.');
    console.log('');
    process.exit(0);
  }

  if (!fileExists(yamlPath)) {
    err('flows.yaml no encontrado. Ejecuta: flowdocs init');
    console.log('');
    process.exit(1);
  }

  // Parsear flows.yaml con el parseo existente (regex) para los datos que necesitamos
  let raw = null;
  const content = fs.readFileSync(yamlPath, 'utf8');
  try {
    const searchPaths = [path.join(__dirname, '..'), __dirname, path.join(process.cwd(), '.flowdocs'), process.cwd()];
    const jsyaml = require(require.resolve('js-yaml', { paths: searchPaths }));
    raw = jsyaml.load(content);
  } catch (_) {
    // Fallback: intentar parseSimpleYaml
    raw = parseSimpleYaml(content);
  }

  if (!raw) {
    err('No se pudo parsear flows.yaml. Verifica que el archivo sea YAML válido.');
    console.log('');
    process.exit(1);
  }

  const meta = raw.meta || {};
  const modules = raw.modules || [];
  const entities = raw.entities || [];
  const stories = raw.stories || [];
  const flows = raw.flows || [];

  // Crear carpetas
  const dirs = ['sprints', 'stories', 'flows', 'bugs'];
  for (const dir of dirs) {
    ensureDir(path.join(flowdocsDir, dir));
    ok(`carpeta ${dir}/`);
  }

  // 1. project.yaml — meta + modules + entities (sin stories ni flows)
  const projectObj = {
    meta: {
      app: meta.app || 'Proyecto',
      version: meta.version || '0.1.0',
      description: meta.description || '',
      updated_at: new Date().toISOString().split('T')[0],
      active_sprint: meta.active_sprint || (meta.sprint ? meta.sprint.number : 1)
    },
    modules,
    entities
  };
  writeFile(projectPath, serializeYaml(projectObj));
  ok('project.yaml');

  // 2. Sprint(s)
  const sprintsList = meta.sprints || (meta.sprint ? [meta.sprint] : []);
  if (sprintsList.length === 0) {
    // Crear sprint 1 vacío
    const sprint = { sprint: { number: 1, goal: meta.sprint?.goal || 'Sprint inicial', start: meta.sprint?.start || new Date().toISOString().split('T')[0], end: meta.sprint?.end || '', status: 'active', stories: stories.map(s => s.id), flows: flows.map(f => ({ id: f.id, sprint_status: f.sprint_status || 'todo' })), tasks: [] } };
    writeFile(path.join(flowdocsDir, 'sprints', 'sprint-1.yaml'), serializeYaml(sprint));
    ok('sprints/sprint-1.yaml');
  } else {
    for (const sp of sprintsList) {
      const num = sp.number || 1;
      // Buscar flujos y stories asignados a este sprint
      const sprintStories = stories.filter(s => s.sprint === num || (!s.sprint && num === 1)).map(s => s.id);
      const sprintFlows = flows.filter(f => {
        const fStory = stories.find(s => (s.flow_ids || []).includes(f.id));
        return fStory && (fStory.sprint === num || (!fStory.sprint && num === 1));
      }).map(f => ({ id: f.id, sprint_status: f.sprint_status || 'todo' }));

      // Extraer tareas de los flujos de este sprint
      const tasks = [];
      flows.forEach(f => {
        if (!Array.isArray(f.tasks)) return;
        const fStory = stories.find(s => (s.flow_ids || []).includes(f.id));
        if (!fStory || (fStory.sprint !== num && (fStory.sprint || num !== 1))) return;
        f.tasks.forEach(t => {
          tasks.push({ id: t.id || `TASK-${tasks.length + 1}`, title: t.name || t.title || '', status: t.status || 'todo', story: f.story || '', flow: f.id, module: f.module || '' });
        });
      });

      const sprintObj = { sprint: { number: num, goal: sp.goal || '', start: sp.start || '', end: sp.end || '', days_left: sp.days_left != null ? sp.days_left : 0, status: sp.status || (num === (meta.active_sprint || 1) ? 'active' : 'completed'), stories: sprintStories, flows: sprintFlows, tasks } };
      writeFile(path.join(flowdocsDir, 'sprints', `sprint-${num}.yaml`), serializeYaml(sprintObj));
      ok(`sprints/sprint-${num}.yaml`);
    }
  }

  // 3. Stories
  for (const s of stories) {
    const storyObj = { story: { ...s } };
    // Añadir created_sprint si tiene sprint
    if (s.sprint && !s.created_sprint) {
      storyObj.story.created_sprint = s.sprint;
    }
    // Agregar added_sprint a criterios que no lo tengan
    if (Array.isArray(storyObj.story.acceptance_criteria)) {
      storyObj.story.acceptance_criteria = storyObj.story.acceptance_criteria.map(ac => {
        if (typeof ac === 'object' && ac !== null && !ac.added_sprint) {
          return { ...ac, added_sprint: s.sprint || 1 };
        }
        return ac;
      });
    }
    writeFile(path.join(flowdocsDir, 'stories', `${s.id}.yaml`), serializeYaml(storyObj));
  }
  if (stories.length) ok(`${stories.length} historias en stories/`);

  // 4. Flows
  for (const f of flows) {
    // Remover tasks del flujo (ya se movieron al sprint)
    const flowClean = { ...f };
    delete flowClean.tasks;
    delete flowClean.sprint_status; // sprint_status vive en el sprint
    const flowObj = { flow: flowClean };
    writeFile(path.join(flowdocsDir, 'flows', `${f.id}.yaml`), serializeYaml(flowObj));
  }
  if (flows.length) ok(`${flows.length} flujos en flows/`);

  // 5. Bugs
  const bugs = raw.bugs || [];
  for (const b of bugs) {
    const bugObj = { bug: { ...b } };
    writeFile(path.join(flowdocsDir, 'bugs', `${b.id}.yaml`), serializeYaml(bugObj));
  }
  if (bugs.length) ok(`${bugs.length} bugs en bugs/`);

  // 6. Generar manifest
  writeManifest(flowdocsDir);
  ok('manifest.yaml');

  // Backup del flows.yaml original
  const backupPath = path.join(flowdocsDir, 'flows.yaml.bak');
  if (!fileExists(backupPath)) {
    fs.copyFileSync(yamlPath, backupPath);
    ok('flows.yaml.bak (backup del original)');
  }

  console.log('');
  console.log(`${c.bold}  ¡Migración completa!${c.reset}`);
  console.log('');
  info('La estructura modular está lista en .flowdocs/');
  info('flows.yaml original guardado como flows.yaml.bak');
  dim('  El flows.yaml original sigue existiendo como fallback.');
  dim('  Para usar la estructura modular, el sistema detecta project.yaml automáticamente.');
  console.log('');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const cmd = process.argv[2];

(async () => {
  switch (cmd) {
    case 'init': await cmdInit(); break;
    case 'update': await cmdUpdate(); break;
    case 'install-swarm': await cmdInstallSwarm(); break;
    case 'status': cmdStatus(); break;
    case 'open': cmdOpen(); break;
    case 'tui': cmdTui(); break;
    case 'plan-sprint': cmdPlanSprint(); break;
    case 'publish': await cmdPublish(); break;
    case 'usage': cmdUsage(); break;
    case 'migrate': cmdMigrate(); break;
    case 'pull': cmdPull(); break;
    default: cmdHelp(); break;
  }
})().catch(e => {
  console.error(`\n  ${c.red}Error:${c.reset} ${e.message}\n`);
  process.exit(1);
});
