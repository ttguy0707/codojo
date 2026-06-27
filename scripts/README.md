# Codojo 安装脚本说明（AI 版）

本文给 AI agent 使用，用于帮助用户把 Codojo skills 安装到目标代码项目。

## 前置判断

1. 确认用户机器有 Node.js 20+：

   ```bash
   node --version
   ```

2. 确认当前目录是 Codojo 仓库根目录，且存在：

   ```text
   package.json
   scripts/dojo.mjs
   scripts/install.mjs
   scripts/status.mjs
   scripts/update.mjs
   scripts/uninstall.mjs
   skills/_shared/
   skills/dojo-*/
   ```

3. 确认目标项目目录。若用户没有指定，默认使用当前工作目录。

## 安装

首次在 Codojo 仓库根目录创建本地 CLI：

```bash
npm link
```

然后进入用户要学习的代码仓，执行默认安装：

```bash
cd /path/to/project
dojo install
```

默认使用当前目录作为目标项目。也就是说，`npm link` 在 Codojo 仓库中执行，`dojo install` 在用户的代码仓中执行。

如果 AI 当前不在目标代码仓，可以用 `--path` 指定目标项目；默认仍然同时安装到 Codex 和 Claude Code：

```bash
dojo install --path /path/to/project
```

只安装 Codex：

```bash
dojo install --path /path/to/project -t codex
```

只安装 Claude Code：

```bash
dojo install --path /path/to/project -t claude
```

重复执行安装会更新已存在的 Codojo 受管技能。人在目标项目目录时，直接执行：

```bash
dojo install
```

如果用户重开终端后 `dojo` 失效，执行：

```bash
dojo install --fix-shell
```

该命令会把 npm 全局 bin 目录写入 shell profile。普通 `dojo install` 不会修改 shell 配置，也不会输出这类修复提示。

安装后会创建或更新：

```text
<project>/.codex/skills/_shared/
<project>/.codex/skills/dojo-*/
<project>/.claude/skills/_shared/
<project>/.claude/skills/dojo-*/
<project>/.codojo/manifest.json
```

安装脚本不会预创建 `open-questions.md`、`task.md`、`schedule.md`、`plan.md`、`notebook.md`。这些学习产物由对应 skill 在流程中生成。

## 卸载

卸载必须显式确认：

```bash
dojo uninstall --path /path/to/project --yes
```

只卸载 Codex：

```bash
dojo uninstall --path /path/to/project -t codex -y
```

只卸载 Claude Code：

```bash
dojo uninstall --path /path/to/project -t claude -y
```

卸载只删除：

```text
<project>/.codex/skills/dojo-*/
<project>/.codex/skills/_shared/
<project>/.claude/skills/dojo-*/
<project>/.claude/skills/_shared/
```

卸载会保留 `.codojo/`，避免删除用户学习进度。

## 状态查看

查看当前目录的安装状态：

```bash
dojo status
```

查看指定项目：

```bash
dojo status --path /path/to/project
```

只查看某个工具：

```bash
dojo status --path /path/to/project -t codex
dojo status --path /path/to/project -t claude
```

`dojo status` 只读文件，不会修改目标项目。它会检查 `.codojo/manifest.json`、`_shared` 和 `dojo-*` skills。

## 更新

更新 Codojo 本体并重新安装受管 skills：

```bash
dojo update
```

如果 AI 当前不在目标项目目录：

```bash
dojo update --path /path/to/project
```

只更新某个工具：

```bash
dojo update --path /path/to/project -t codex
dojo update --path /path/to/project -t claude
```

`dojo update` 会先在 Codojo 仓库执行 `git pull --ff-only`，再执行一次幂等安装。它只更新 `_shared` 和 `dojo-*` skills，不会删除 `.codojo/` 学习文件。

## 安全规则

- 安装可重复执行，只更新 Codojo 受管的 `_shared` 和 `dojo-*` 目录。
- 状态查看只读文件，不修改任何目录。
- 更新会执行 `git pull --ff-only`，如果本地 Codojo 仓库有未处理冲突或不能快进，应先让用户处理。
- 只有用户明确执行 `--fix-shell` 时，才修改 shell profile。
- 卸载必须带 `-y` 或 `--yes`。
- 不要手动删除 `.codojo/`，除非用户明确要求清空学习进度。
- 不要删除非 `dojo-*` 的其他 skill。
- `_shared` 是 Codojo skills 的共享方法论目录，会随安装和卸载一起处理。

## 安装后提示用户

Codex：

```text
在目标项目中对 Codex 说：dojo init。
```

Claude Code：

```text
在目标项目中对 Claude Code 说：dojo init。
```

`dojo init` 是对话里的 skill 触发关键词，不是 CLI 命令。也可以说 `道场启动`、`开始学习`、`启动` 或 `dojo start`。它会读取方法论、检测 `.codojo/` 状态，并路由到正确阶段。
