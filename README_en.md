<div align="center">

![Codojo Logo](docs/codojo-logo.png)

# Codojo

### A code dojo where AI helps you go from "I cannot read this project" to "I can modify it"

[![Version](https://img.shields.io/badge/version-0.1.0-6B7280.svg?labelColor=DC2626)](package.json)
[![Node](https://img.shields.io/badge/Node.js-20+-6B7280.svg?logo=node.js&logoColor=white&labelColor=339933)](https://nodejs.org)
[![Codex](https://img.shields.io/badge/Codex-supported-6B7280.svg?labelColor=0099FF)](#-installation)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-supported-6B7280.svg?labelColor=D97757)](#-installation)
[![License](https://img.shields.io/badge/License-MIT-6B7280.svg?labelColor=16A34A)](LICENSE)

**Code Dojo · 代码道场**

English · [简体中文](README.md)

[Quick Start](#-quick-start) · [Learning Flow](#-learning-flow) · [File Protocol](#-file-protocol) · [Skills](#-skills) · [CLI](#-cli)

</div>

---

## Introduction

Codojo is a code-learning dojo for Codex and Claude Code.

It is not a generic "explain this code" prompt pack. Codojo defines a project-centered learning protocol: the agent scans the codebase, assesses your current ability, generates a personalized learning plan, and then teaches each topic through theory plus real code practice. Progress is persisted in `.codojo/`, so learning can continue across sessions.

It is designed for:

- Students onboarding into an open-source project
- Engineers taking over an existing codebase
- Developers learning a new stack through a real project
- Learners who want to validate understanding through a small project modification

---

## Core Ideas

### Progress as Files

Codojo does not depend on a single chat session to remember progress. Assessment results, learning plans, schedules, notes, and modification plans are written into `.codojo/` inside the target project.

This lets you:

- Continue learning in a new session
- Ask the agent to reload current progress
- Review what was learned, skipped, or blocked
- Keep the learning process close to the codebase

### Real-Code Learning

Every topic must connect to real files in the target project. After theory, Codojo asks you to make a small, concrete code change. You can complete the practice task or explicitly skip it; either way, progress is recorded.

---

## Learning Flow

![Codojo four-stage learning flow](docs/flow-en.svg)

| Stage | Skill | What it does | Output |
|---|---|---|---|
| S0 Project Scan | `dojo-init` / `dojo-stage` | Loads methodology, scans the project, and detects current progress | Routes to the right stage |
| S1 Assessment | `dojo-assess` | Generates a project-specific questionnaire and records answers | `open-questions.md` |
| S2 Plan | `dojo-plan` | Creates a personalized learning path and progress schedule | `task.md`, `schedule.md` |
| S3 Teaching | `dojo-teach` | Teaches topic by topic with theory and real code practice | Updates `schedule.md` |
| S4 Modification | `dojo-hack` | Proposes and implements project modifications after learning | `plan.md` and code changes |

Helper skills:

| Skill | Purpose |
|---|---|
| `dojo-stage` | Routes to the correct stage based on `.codojo/` |
| `dojo-reset` | Rolls progress back to a selected stage |
| `dojo-notebook` | Records and organizes learning notes |
| `dojo-quiz` | Runs lightweight knowledge checks |

---

## System Structure

![Codojo system structure](docs/architecture-en.svg)

---

## Quick Start

### 1. Clone Codojo

```bash
git clone <repo-url>
cd codojo
```

For the current local development version, register the CLI with:

```bash
npm link
```

Verify the command:

```bash
dojo --help
```

### 2. Install into a Target Project

Enter the project you want to learn:

```bash
cd /path/to/your/project
dojo install
```

The current directory is the default target project. In other words, run `npm link` inside the Codojo repository, then run `dojo install` inside the code repository you want to learn.

If `dojo` disappears after opening a new terminal, run once from any directory:

```bash
dojo install --fix-shell
```

It writes the current npm global bin directory into your shell profile, such as `~/.zshrc` or `~/.bashrc`. Plain `dojo install` does not modify shell configuration and does not print this repair hint.

By default, Codojo installs into:

```text
.codex/skills/
.claude/skills/
.codojo/manifest.json
```

Codex only:

```bash
dojo install -t codex
```

Claude Code only:

```bash
dojo install -t claude
```

Install from any directory by passing a target path:

```bash
dojo install --path /path/to/your/project
```

`dojo install` is idempotent. It updates only Codojo-managed `_shared` and `dojo-*` skills, preserves unrelated skills, and never deletes `.codojo/` learning files.

### 3. Start Learning

After installation, open Codex or Claude Code in the target project and tell the agent:

```text
dojo init
```

Alternative triggers:

```text
道场启动
开始学习
启动
dojo start
```

Note: `dojo init` is a chat trigger for the skill workflow, not a CLI command.

---

## CLI

The CLI currently installs and uninstalls skills.

```bash
dojo install
dojo install -t codex
dojo install -t claude
dojo install --path /path/to/project
```

```bash
dojo uninstall -y
dojo uninstall -t codex -y
dojo uninstall -t claude -y
dojo uninstall --path /path/to/project -y
```

Options:

| Option | Description |
|---|---|
| `-t, --tools` | Target tools: `codex`, `claude`, `codex,claude`, or `all` |
| `--path` | Target project path. Defaults to the current directory |
| `-y, --yes` | Required confirmation for `uninstall` |
| `--force` | Legacy compatibility. Install is already idempotent |
| `--fix-shell` | Writes npm global bin into the shell profile so `dojo` works in new terminals |

---

## File Protocol

Codojo stores learning state in `.codojo/` inside the target project.

![Codojo file protocol](docs/files-en.svg)

```text
<your-project>/.codojo/
├── manifest.json        # install metadata
├── open-questions.md    # S1 assessment result
├── task.md              # S2 learning plan
├── schedule.md          # S2 schedule, updated during S3
├── plan.md              # S4 modification plan
└── notebook.md          # learning notes
```

`manifest.json` is managed by the CLI. Other files are created and updated by skills during the learning workflow.

---

## Skills

Codojo currently includes 9 skills:

```text
dojo-init       Entry point. Loads methodology and routes to stage detection
dojo-stage      Stage router. Decides what should happen next
dojo-assess     Assessment. Generates and records the questionnaire
dojo-plan       Learning plan generator
dojo-teach      Teaching loop with theory and practice
dojo-quiz       Lightweight knowledge checks
dojo-notebook   Learning notes
dojo-reset      Progress rollback
dojo-hack       Project modification stage
```

Shared methodology files:

```text
skills/_shared/methodology.md
skills/_shared/output-style-guide.md
```

---

## Teaching Protocol

S3 follows a strict interaction rhythm:

1. The agent explains one topic and references real project files
2. The user replies "理解" or confirms understanding
3. The agent assigns a small real-code practice task
4. The user replies "完成" after finishing
5. The agent checks the change and updates `schedule.md`

Users may skip a practice task. The skipped state is recorded in the progress file.

---

## Uninstall

Remove Codojo-managed skills:

```bash
dojo uninstall -y
```

Uninstall removes only:

```text
.codex/skills/dojo-*
.codex/skills/_shared/
.claude/skills/dojo-*
.claude/skills/_shared/
```

`.codojo/` is preserved so learning progress is not lost.

---

## Scope

The first version supports:

- Codex
- Claude Code
- Node.js CLI
- Skills as the main carrier

Not supported yet:

- Standalone teaching web UI
- `dojo init` as a CLI command
- Automatic remote update

---

## License

MIT
