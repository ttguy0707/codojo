#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const skillsSourceDir = path.join(repoRoot, 'skills');
const sharedSourceDir = path.join(skillsSourceDir, '_shared');
const managedSkillPrefix = 'dojo-';
const manifestName = 'manifest.json';

const toolTargets = {
  codex: {
    label: 'Codex',
    dir: '.codex/skills',
    next: '在目标项目中对 Codex 说：dojo init。',
  },
  claude: {
    label: 'Claude Code',
    dir: '.claude/skills',
    next: '在目标项目中对 Claude Code 说：dojo init。',
  },
};

function usage() {
  console.log(`Codojo 安装脚本

用法：
  dojo install [--path <项目目录>] [-t <工具>] [--force]

选项：
  --path <项目目录>  目标项目目录，默认是当前目录。
  --tools, -t <工具> 逗号分隔：codex,claude，或 all。默认 all。
  --force            替换已存在的受管技能。
  --help             显示帮助。

兼容用法：
  node scripts/install.mjs [--path <项目目录>] [--tools <工具>] [--force]
`);
}

function parseArgs(argv) {
  const options = {
    path: process.cwd(),
    tools: 'all',
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--path') {
      const value = argv[++i];
      if (!value) throw new Error('--path 需要一个目录值');
      options.path = path.resolve(value);
    } else if (arg === '--tools' || arg === '-t') {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} 需要一个工具列表`);
      options.tools = value;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`未知选项：${arg}`);
    }
  }

  return options;
}

function resolveTools(value) {
  if (value === 'all') return Object.keys(toolTargets);

  const tools = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (tools.length === 0) {
    throw new Error('工具列表不能为空');
  }

  const invalid = tools.filter((tool) => !toolTargets[tool]);
  if (invalid.length > 0) {
    throw new Error(`不支持的工具：${invalid.join(', ')}。可用值：codex, claude, all`);
  }

  return [...new Set(tools)];
}

function ensureProjectDir(projectPath) {
  if (!existsSync(projectPath)) {
    mkdirSync(projectPath, { recursive: true });
    return;
  }

  if (!statSync(projectPath).isDirectory()) {
    throw new Error(`目标路径不是目录：${projectPath}`);
  }
}

function ensureCodojoFiles(projectPath) {
  const stateDir = path.join(projectPath, '.codojo');
  mkdirSync(stateDir, { recursive: true });
  return stateDir;
}

function listManagedSkills() {
  return readdirSync(skillsSourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(managedSkillPrefix))
    .map((entry) => entry.name)
    .sort();
}

function readPackageVersion() {
  const packagePath = path.join(repoRoot, 'package.json');
  if (!existsSync(packagePath)) return null;

  try {
    return JSON.parse(readFileSync(packagePath, 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

function writeManifest(projectPath, payload) {
  const stateDir = path.join(projectPath, '.codojo');
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    path.join(stateDir, manifestName),
    `${JSON.stringify({ version: 1, ...payload }, null, 2)}\n`
  );
}

function readManifest(projectPath) {
  const manifestPath = path.join(projectPath, '.codojo', manifestName);
  if (!existsSync(manifestPath)) return null;

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function sameDirectory(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return path.resolve(a) === path.resolve(b);
  }
}

function installDirectory(source, target, options) {
  if (existsSync(target)) {
    if (!options.force) {
      throw new Error(`目标已存在：${target}。如需替换受管内容，请加 --force。`);
    }
    rmSync(target, { recursive: true, force: true });
  }

  cpSync(source, target, { recursive: true });
}

function install(projectPath, options) {
  if (!existsSync(skillsSourceDir)) {
    throw new Error(`找不到 skills 源目录：${skillsSourceDir}`);
  }
  if (!existsSync(sharedSourceDir)) {
    throw new Error(`找不到共享方法论目录：${sharedSourceDir}`);
  }

  ensureProjectDir(projectPath);
  ensureCodojoFiles(projectPath);

  const selectedTools = resolveTools(options.tools);
  const selectedToolSet = new Set(selectedTools);
  const managedSkills = listManagedSkills();
  const installations = [];

  for (const tool of selectedTools) {
    const targetInfo = toolTargets[tool];
    const targetSkillsDir = path.join(projectPath, targetInfo.dir);

    if (sameDirectory(targetSkillsDir, skillsSourceDir)) {
      console.log(`跳过 ${targetInfo.label}：目标目录与 Codojo 源码 skills/ 相同。`);
      continue;
    }

    mkdirSync(targetSkillsDir, { recursive: true });
    installDirectory(sharedSourceDir, path.join(targetSkillsDir, '_shared'), options);

    const installedSkills = [];
    for (const skillName of managedSkills) {
      installDirectory(
        path.join(skillsSourceDir, skillName),
        path.join(targetSkillsDir, skillName),
        options
      );
      installedSkills.push(skillName);
    }

    installations.push({
      tool,
      label: targetInfo.label,
      target: targetInfo.dir,
      shared: '_shared',
      skills: installedSkills,
    });

    console.log(`已安装 ${installedSkills.length} 个 Codojo 技能到 ${targetInfo.label}：${targetSkillsDir}`);
  }

  const currentManifest = readManifest(projectPath);
  const preservedTools = Array.isArray(currentManifest?.tools)
    ? currentManifest.tools.filter((item) => !selectedToolSet.has(item.tool))
    : [];

  writeManifest(projectPath, {
    installedAt: new Date().toISOString(),
    source: repoRoot,
    packageVersion: readPackageVersion(),
    tools: [...preservedTools, ...installations],
  });

  for (const item of installations) {
    console.log(`下一步（${item.label}）：${toolTargets[item.tool].next}`);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    process.exit(0);
  }

  install(path.resolve(options.path), options);
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exit(1);
}
