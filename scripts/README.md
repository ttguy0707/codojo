# Codojo 安装脚本说明（AI 版）

本文给 AI agent 使用，用于帮助用户把 Codojo skills 安装到目标代码项目。

## 前置判断

1. 确认用户机器有 Node.js 20+：

   ```bash
   node --version
   ```

2. 确认当前目录是 Codojo 仓库根目录，且存在：

   ```text
   scripts/install.mjs
   scripts/uninstall.mjs
   skills/_shared/
   skills/dojo-*/
   ```

3. 确认目标项目目录。若用户没有指定，默认使用当前工作目录。

## 安装

默认同时安装到 Codex 和 Claude Code：

```bash
node scripts/install.mjs --path /path/to/project
```

只安装 Codex：

```bash
node scripts/install.mjs --path /path/to/project --tools codex
```

只安装 Claude Code：

```bash
node scripts/install.mjs --path /path/to/project --tools claude
```

覆盖已存在的 Codojo 受管技能：

```bash
node scripts/install.mjs --path /path/to/project --force
```

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
node scripts/uninstall.mjs --path /path/to/project --yes
```

只卸载 Codex：

```bash
node scripts/uninstall.mjs --path /path/to/project --tools codex --yes
```

只卸载 Claude Code：

```bash
node scripts/uninstall.mjs --path /path/to/project --tools claude --yes
```

卸载只删除：

```text
<project>/.codex/skills/dojo-*/
<project>/.codex/skills/_shared/
<project>/.claude/skills/dojo-*/
<project>/.claude/skills/_shared/
```

卸载会保留 `.codojo/`，避免删除用户学习进度。

## 安全规则

- 默认不覆盖已存在目录；用户明确要求时才加 `--force`。
- 卸载必须带 `--yes`。
- 不要手动删除 `.codojo/`，除非用户明确要求清空学习进度。
- 不要删除非 `dojo-*` 的其他 skill。
- `_shared` 是 Codojo skills 的共享方法论目录，会随安装和卸载一起处理。

## 安装后提示用户

Codex：

```text
在目标项目中让 Codex 使用 $dojo-init。
```

Claude Code：

```text
在目标项目中让 Claude Code 使用 dojo-init。
```

`dojo-init` 会读取方法论、检测 `.codojo/` 状态，并路由到正确阶段。
