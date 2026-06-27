#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const installScript = path.join(__dirname, 'install.mjs');

const toolTargets = {
  codex: 'Codex',
  claude: 'Claude Code',
};

function usage() {
  console.log(`Codojo 更新脚本

用法：
  dojo update [--path <项目目录>] [-t <工具>]

选项：
  --path <项目目录>  目标项目目录，默认是当前目录。
  --tools, -t <工具> 逗号分隔：codex,claude，或 all。默认 all。
  --help             显示帮助。

说明：
  update 会先在 Codojo 仓库执行 git pull --ff-only，
  然后对目标项目执行一次幂等安装，更新受管 skills。
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

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function ensureProjectDir(projectPath) {
  if (!existsSync(projectPath) || !statSync(projectPath).isDirectory()) {
    throw new Error(`目标路径不是目录：${projectPath}`);
  }
}

function pullRepository() {
  git(['rev-parse', '--is-inside-work-tree']);
  const before = git(['rev-parse', '--short', 'HEAD']);

  console.log(`${red('●')} Codojo source -> ${repoRoot}`);
  console.log(`${red('●')} git pull ${red('--ff-only')}`);

  const result = spawnSync('git', ['pull', '--ff-only'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('git pull --ff-only 失败，请先处理本地改动或分支状态。');
  }

  const after = git(['rev-parse', '--short', 'HEAD']);
  const state = before === after ? 'up to date' : 'updated';
  console.log(`${red('●')} Repository is ${red(state)} -> ${bold(after)}`);
}

function reinstall(projectPath, options) {
  const args = ['--path', projectPath, '--tools', options.tools];
  const result = spawnSync(process.execPath, [installScript, ...args], {
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function update(projectPath, options) {
  ensureProjectDir(projectPath);
  resolveTools(options.tools);
  pullRepository();
  reinstall(projectPath, options);
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    process.exit(0);
  }

  update(path.resolve(options.path), options);
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exit(1);
}
