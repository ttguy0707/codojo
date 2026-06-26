#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = {
  install: {
    description: '安装 Codojo skills 到目标项目',
    script: 'install.mjs',
  },
  uninstall: {
    description: '卸载目标项目中的 Codojo 受管 skills',
    script: 'uninstall.mjs',
  },
};

function usage() {
  console.log(`Codojo CLI

用法：
  dojo install [--path <项目目录>] [--tools <工具>] [--force]
  dojo uninstall [--path <项目目录>] [--tools <工具>] --yes

命令：
  install    ${commands.install.description}
  uninstall  ${commands.uninstall.description}

通用选项：
  --help, -h  显示帮助。

示例：
  dojo install --path /path/to/project
  dojo install --path /path/to/project --tools codex
  dojo uninstall --path /path/to/project --yes
`);
}

function run(command, args) {
  const commandInfo = commands[command];
  if (!commandInfo) {
    throw new Error(`未知命令：${command}`);
  }

  const scriptPath = path.join(__dirname, commandInfo.script);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

try {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h') {
    usage();
    process.exit(0);
  }

  run(command, args);
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exit(1);
}
