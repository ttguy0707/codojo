---
name: dojo-reset
category: management
stage: cross-stage
version: 0.1.0
description: |
  Codojo 进度回档工具（跨阶段管理）。用户说"重来"、"重置"、"回到某阶段"时触发。
  工作流：读取 `.codojo/` 下所有文件状态 → 整理出当前进度表（含每阶段
  完成情况和关键产出物）→ 展示给用户并询问回档目标 → 用户选择回档阶段 →
  列出将被删除/重置的文件清单 → 等用户确认 → 执行删除/重置 → 路由到目标阶段。
  四种回档模式：
    - 回到 S1 : 删除所有文件（open-questions.md / task.md / schedule.md / plan.md）
    - 回到 S2 : 保留 open-questions.md，删除 task.md / schedule.md / plan.md
    - 回到 S3 : 保留 open-questions.md + task.md，重置 schedule.md 进度为 0%，删除 plan.md
    - 回到 S4 : 保留 S1-S3 产出，仅删除 plan.md
  触发关键词：重来、重置、reset、回到 S1、回到 S2、回到 S3、回到 S4、回档、
  清除进度、重新开始、从头来、rollback、我想回退、回退进度。
  安全约束：删除文件前必须向用户展示将删除的文件列表，等用户回复"确认"后才执行。
  不可静默删除。如果用户说"取消"则不做任何操作。
  注意：本 skill **只做文件删除/重置**，不执行任何教学或评估动作。
  回档完成后自动调用 dojo-stage 重新路由到目标阶段。
  如果 .codojo/ 目录不存在（尚未开始），提示用户"还没有任何进度，无需重置"。
---

# dojo-reset — 进度回档工具

> 一句话定位：展示当前进度，让用户选择回到任意阶段，安全删除后续文件。

## 何时使用

- ✅ 用户说"重来"、"重新开始"、"从头来"
- ✅ 用户说"回到 S1/S2/S3/S4"
- ✅ 用户说"清除进度"、"重置"、"reset"
- ✅ 用户对当前阶段不满意，想回退重做

## 前置条件

- `.codojo/` 目录存在（否则提示"还没有任何进度，无需重置"）

## 工作流

### Step 1：读取状态并展示进度表

读取 `.codojo/` 下所有文件，整理并输出：

```markdown
## 📍 当前学习进度

| 阶段 | 状态 | 产出文件 |
|---|---|---|
| S1 能力评估 | ✅ 已完成 | `open-questions.md` (含 ASSESS_DONE) |
| S2 计划生成 | ✅ 已完成 | `task.md` + `schedule.md` |
| S3 正式教学 | 🔄 进行中 (58%) | `schedule.md` 进度 58% |
| S4 魔改阶段 | ⚪ 未开始 | — |

你想回到哪个阶段？（S1 / S2 / S3 / S4）
```

### Step 2：等待用户选择

用户选择目标阶段后，根据下表确定操作：

| 回档目标 | 保留 | 删除/重置 |
|---|---|---|
| 回到 S1（重头开始） | 无 | 删除 `open-questions.md` + `task.md` + `schedule.md` + `plan.md` |
| 回到 S2（重新规划） | `open-questions.md` | 删除 `task.md` + `schedule.md` + `plan.md` |
| 回到 S3（重新学习） | `open-questions.md` + `task.md` | 重置 `schedule.md` 进度为 0% + 删除 `plan.md` |
| 回到 S4（重新魔改） | `open-questions.md` + `task.md` + `schedule.md` | 删除 `plan.md` |

### Step 3：确认删除

列出将被操作的文件，请求用户确认：

```markdown
## ⚠️ 回档确认

你选择回到 **S2（重新规划）**，以下文件将被删除：

- ❌ `.codojo/task.md`
- ❌ `.codojo/schedule.md`
- ❌ `.codojo/plan.md`（不存在，跳过）

以下文件保留：
- ✅ `.codojo/open-questions.md`

确认执行？（输入"确认"执行 / "取消"放弃）
```

### Step 4：执行删除/重置

用户确认后：
- 对于"删除"的文件：直接删除
- 对于"重置 schedule.md 进度为 0%"：将 schedule.md 中所有 ✅ 替换为 ⚪，总进度行改为 0%

### Step 5：完成报告 + 路由

```markdown
## ✅ 回档完成

已回到 **S2（计划生成）** 阶段。

输入"继续"进入 S2 重新生成学习计划。
```

回档完成后，用户下一句话会被 dojo-stage 路由器捕获并进入目标阶段。

## Gotchas

- 如果 `.codojo/` 不存在，直接提示"还没有任何进度，无需重置"，不要创建目录
- 如果用户选择的目标阶段已经是当前阶段（如当前在 S2，用户选"回到 S2"），提示"你已经在 S2，是否要清除 S2 产出重新做？"
- schedule.md 重置时只改进度标记和总进度行，不删除知识点列表本身
- 删除操作不可逆——确认前务必展示完整文件列表
- 如果存在用户自行在 `.codojo/` 下创建的额外文件（非标准产出），**不要删除**，只操作已知的 4 个标准文件

## 产出

- 无新文件产出（纯删除/重置操作）

## 输出风格约束

详见共用 reference：[`../_shared/output-style-guide.md`](../_shared/output-style-guide.md)