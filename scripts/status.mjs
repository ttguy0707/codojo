#!/usr/bin/env node
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
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
  console.log(`Codojo 状态脚本

用法：
  dojo status [--path <项目目录>] [-t <工具>]

选项：
  --path <项目目录>  目标项目目录，默认是当前目录。
  --tools, -t <工具> 逗号分隔：codex,claude，或 all。默认 all。
  --help             显示帮助。
`);
}

function parseArgs(argv) {
  const options = {
    path: process.cwd(),
    tools: 'all',
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

function shouldUseColor() {
  return Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
}

function red(text) {
  if (!shouldUseColor()) return text;
  return `\x1b[38;2;220;38;38m${text}\x1b[0m`;
}

function bold(text) {
  if (!shouldUseColor()) return text;
  return `\x1b[1m${text}\x1b[0m`;
}

function colorSegment(line, start, end) {
  return `${line.slice(0, start)}${red(line.slice(start, end))}${line.slice(end)}`;
}

function printHeader() {
  const logoLines = [
    '   ______          __        _     ',
    '  / ____/___  ____/ /___    (_)___ ',
    ' / /   / __ \\/ __  / __ \\  / / __ \\',
    '/ /___/ /_/ / /_/ / /_/ / / / /_/ /',
    '\\____/\\____/\\____/\\____/_/ /\\____/ ',
    '                       /___/        ',
  ];

  const logoColorSegments = [
    [19, 21],
    [14, 24],
    [13, 25],
    [12, 25],
    [12, 24],
    null,
  ];

  const coloredLogoLines = logoLines.map((line, index) => {
    const segment = logoColorSegments[index];
    if (!segment) return line;
    return colorSegment(line, segment[0], segment[1]);
  });

  console.log(`\n${coloredLogoLines.join('\n')}`);
  console.log('');
  console.log(`  ${red('-----')} ${bold('Code Dojo')} · ${bold('代码道场')} ${red('-----')}\n`);
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
  if (!existsSync(manifestPath)) {
    return { manifest: null, path: manifestPath, valid: false };
  }

  try {
    return {
      manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
      path: manifestPath,
      valid: true,
    };
  } catch {
    return { manifest: null, path: manifestPath, valid: false };
  }
}

function manifestTarget(manifest, tool) {
  if (!Array.isArray(manifest?.tools)) return null;
  return manifest.tools.find((item) => item.tool === tool) ?? null;
}

function countInstalledSkills(targetDir, expectedSkills) {
  const missing = [];
  let installed = 0;

  for (const skillName of expectedSkills) {
    const skillPath = path.join(targetDir, skillName);
    if (existsSync(skillPath)) {
      installed++;
    } else {
      missing.push(skillName);
    }
  }

  return { installed, missing };
}

function learningFiles(projectPath) {
  const names = ['open-questions.md', 'task.md', 'schedule.md', 'plan.md', 'notebook.md'];
  return names.filter((name) => existsSync(path.join(projectPath, '.codojo', name)));
}

function printToolStatus(projectPath, tool, manifest, expectedSkills) {
  const fallback = toolTargets[tool];
  const manifestInfo = manifestTarget(manifest, tool);
  const label = manifestInfo?.label ?? fallback.label;
  const target = manifestInfo?.target ?? fallback.dir;
  const targetDir = path.isAbsolute(target) ? target : path.join(projectPath, target);
  const sharedName = manifestInfo?.shared ?? '_shared';
  const sharedPath = path.join(targetDir, sharedName);
  const sharedReady = existsSync(sharedPath);
  const { installed, missing } = countInstalledSkills(targetDir, expectedSkills);

  let state = 'missing';
  if (sharedReady && installed === expectedSkills.length) {
    state = 'ready';
  } else if (sharedReady || installed > 0) {
    state = 'partial';
  }

  console.log(`${red('●')} ${bold(label)} is ${red(state)} -> ${targetDir}`);
  console.log(`  skills ${installed}/${expectedSkills.length}, shared ${sharedReady ? 'yes' : 'no'}`);
  if (missing.length > 0 && missing.length <= 5) {
    console.log(`  missing: ${missing.join(', ')}`);
  } else if (missing.length > 5) {
    console.log(`  missing: ${missing.length} skills`);
  }
}

function status(projectPath, options) {
  if (!existsSync(projectPath) || !statSync(projectPath).isDirectory()) {
    throw new Error(`目标路径不是目录：${projectPath}`);
  }

  const selectedTools = resolveTools(options.tools);
  const expectedSkills = listManagedSkills();
  const { manifest, path: manifestPath, valid } = readManifest(projectPath);
  const files = learningFiles(projectPath);

  printHeader();
  console.log(`${red('●')} Project -> ${projectPath}`);

  if (valid) {
    console.log(`${red('●')} Manifest is ${red('found')} -> ${manifestPath}`);
    if (manifest?.packageVersion) {
      console.log(`  package ${manifest.packageVersion}`);
    }
    if (manifest?.installedAt) {
      console.log(`  installed ${manifest.installedAt}`);
    }
  } else if (existsSync(manifestPath)) {
    console.log(`${red('●')} Manifest is ${red('invalid')} -> ${manifestPath}`);
  } else {
    console.log(`${red('●')} Manifest is ${red('missing')} -> ${manifestPath}`);
  }

  for (const tool of selectedTools) {
    printToolStatus(projectPath, tool, manifest, expectedSkills);
  }

  if (files.length > 0) {
    console.log(`${red('●')} Learning files -> ${files.join(', ')}`);
  } else {
    console.log(`${red('●')} Learning files -> none yet`);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    process.exit(0);
  }

  status(path.resolve(options.path), options);
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exit(1);
}
