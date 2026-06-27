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
  status: {
    description: '查看目标项目中的 Codojo 安装状态',
    script: 'status.mjs',
  },
  update: {
    description: '更新 Codojo 本体并重新安装受管 skills',
    script: 'update.mjs',
  },
  uninstall: {
    description: '卸载目标项目中的 Codojo 受管 skills',
    script: 'uninstall.mjs',
  },
};

function usage() {
  console.log(`Codojo CLI

用法：
  dojo install [-t <工具>] [--path <项目目录>] [--fix-shell]
  dojo status [-t <工具>] [--path <项目目录>]
  dojo update [-t <工具>] [--path <项目目录>]
  dojo uninstall [-t <工具>] [--path <项目目录>] -y

命令：
  install    ${commands.install.description}
  status     ${commands.status.description}
  update     ${commands.update.description}
  uninstall  ${commands.uninstall.description}

通用选项：
  --help, -h  显示帮助。

安装选项：
  -t, --tools <工具>  安装目标：codex, claude, codex,claude, all。
  --path <项目目录>   目标项目目录，默认当前目录。
  --fix-shell        修复新终端找不到 dojo：写入 npm 全局 bin 到 shell profile。

卸载选项：
  -y, --yes          确认卸载。

示例：
  dojo install -t codex
  dojo install -t claude
  dojo status
  dojo update
  dojo install --fix-shell
  dojo uninstall -y
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
