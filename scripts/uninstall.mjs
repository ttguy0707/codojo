#!/usr/bin/env node
import {
  existsSync,
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
const managedSkillPrefix = 'dojo-';
const manifestName = 'manifest.json';

const toolTargets = {
  codex: {
    label: 'Codex',
    dir: '.codex/skills',
  },
  claude: {
    label: 'Claude Code',
    dir: '.claude/skills',
  },
};

function usage() {
  console.log(`Codojo 卸载脚本

用法：
  dojo uninstall [--path <项目目录>] [--tools <工具>] --yes

选项：
  --path <项目目录>  目标项目目录，默认是当前目录。
  --tools <工具>     逗号分隔：codex,claude，或 all。默认 all。
  --yes, -y          确认卸载。卸载只删除受管技能，不删除 .codojo 学习文件。
  --help             显示帮助。

兼容用法：
  node scripts/uninstall.mjs [--path <项目目录>] [--tools <工具>] --yes
`);
}

function parseArgs(argv) {
  const options = {
    path: process.cwd(),
    tools: 'all',
    yes: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--path') {
      const value = argv[++i];
      if (!value) throw new Error('--path 需要一个目录值');
      options.path = path.resolve(value);
    } else if (arg === '--tools') {
      const value = argv[++i];
      if (!value) throw new Error('--tools 需要一个工具列表');
      options.tools = value;
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
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

function listManagedSkills() {
  if (!existsSync(skillsSourceDir)) return [];

  return readdirSync(skillsSourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(managedSkillPrefix))
    .map((entry) => entry.name)
    .sort();
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

function writeManifest(projectPath, payload) {
  const manifestPath = path.join(projectPath, '.codojo', manifestName);
  writeFileSync(manifestPath, `${JSON.stringify({ version: 1, ...payload }, null, 2)}\n`);
}

function removeManifest(projectPath) {
  const manifestPath = path.join(projectPath, '.codojo', manifestName);
  rmSync(manifestPath, { force: true });
}

function sameDirectory(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return path.resolve(a) === path.resolve(b);
  }
}

function manifestTargetsFor(projectPath, selectedTools) {
  const manifest = readManifest(projectPath);
  if (Array.isArray(manifest?.tools)) {
    const wanted = new Set(selectedTools);
    return manifest.tools
      .filter((item) => wanted.has(item.tool))
      .map((item) => ({
        tool: item.tool,
        label: item.label ?? toolTargets[item.tool]?.label ?? item.tool,
        target: item.target ?? toolTargets[item.tool]?.dir,
        shared: item.shared ?? '_shared',
        skills: item.skills ?? listManagedSkills(),
      }));
  }

  return selectedTools.map((tool) => ({
    tool,
    label: toolTargets[tool].label,
    target: toolTargets[tool].dir,
    shared: '_shared',
    skills: listManagedSkills(),
  }));
}

function uninstall(projectPath, options) {
  if (!options.yes) {
    throw new Error('拒绝卸载：请加 --yes 确认。卸载只删除受管 dojo-* 技能和 _shared，不删除 .codojo 学习文件。');
  }

  if (existsSync(projectPath) && !statSync(projectPath).isDirectory()) {
    throw new Error(`目标路径不是目录：${projectPath}`);
  }

  const selectedTools = resolveTools(options.tools);
  const selectedToolSet = new Set(selectedTools);
  const targets = manifestTargetsFor(projectPath, selectedTools);
  const manifest = readManifest(projectPath);

  let removed = 0;
  for (const item of targets) {
    const targetSkillsDir = path.isAbsolute(item.target)
      ? item.target
      : path.join(projectPath, item.target);

    if (sameDirectory(targetSkillsDir, skillsSourceDir)) {
      console.log(`跳过 ${item.label}：目标目录与 Codojo 源码 skills/ 相同。`);
      continue;
    }

    for (const skillName of item.skills ?? []) {
      if (!skillName.startsWith(managedSkillPrefix)) continue;
      const skillPath = path.join(targetSkillsDir, skillName);
      if (existsSync(skillPath)) {
        rmSync(skillPath, { recursive: true, force: true });
        removed++;
      }
    }

    const sharedName = item.shared ?? '_shared';
    const sharedPath = path.join(targetSkillsDir, sharedName);
    if (existsSync(sharedPath)) {
      rmSync(sharedPath, { recursive: true, force: true });
      removed++;
    }
  }

  if (Array.isArray(manifest?.tools)) {
    const remainingTools = manifest.tools.filter((item) => !selectedToolSet.has(item.tool));
    if (remainingTools.length > 0) {
      writeManifest(projectPath, {
        ...manifest,
        uninstalledAt: new Date().toISOString(),
        tools: remainingTools,
      });
    } else {
      removeManifest(projectPath);
    }
  }

  console.log(`已删除 ${removed} 个 Codojo 受管目录。`);
  console.log('已保留 .codojo 学习文件。');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    process.exit(0);
  }

  uninstall(path.resolve(options.path), options);
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exit(1);
}
