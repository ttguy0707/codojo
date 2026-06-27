---
name: dojo-init
category: entry
stage: init
version: 0.1.0
description: |
  Codojo 初始化入口（必须最先触发的 skill）。
  触发词：dojo init、道场启动、开始学习、启动、dojo start。
  职责：
    1. 强制读取 _shared/methodology.md，让 AI 完整理解四阶段教学方法论
    2. 读取完成后，直接转入 dojo-stage 进行阶段调度
  本 skill 只做一件事：让 AI 加载方法论上下文。路由调度统一由 dojo-stage 负责。
  适用场景：首次使用、新开 session 恢复上下文。
---

# dojo-init — 初始化入口

> 一句话定位：让 AI 读取方法论、恢复学习上下文，是所有 session 的第一步。

## 触发词

- `dojo init`
- `道场启动`
- `开始学习`
- `启动`
- `dojo start`

## 何时使用

- ✅ 用户首次安装后第一次使用
- ✅ 新开 session，AI 尚无方法论上下文
- ✅ 用户想确认当前学习进度

## 前置条件

- Codojo skills 已安装
- `_shared/methodology.md` 存在（随 skills 一起安装到 `skills/_shared/` 下）

## 工作流

### Step 1：读取方法论

**必须**读取 `../_shared/methodology.md`（即 skills/_shared/methodology.md）。

读完后在心中建立完整的四阶段流程理解，但**不要向用户输出方法论全文**。

### Step 2：转入 dojo-stage

向用户输出一句确认：

```markdown
## 🎓 Codojo 已就绪

已读取教学方法论，正在检测学习进度...
```

然后**立即转入 `dojo-stage`**，由 stage 负责检测进度、展示状态、路由到目标 skill。

## Gotchas

- **每个新 session 都应先触发本 skill**——推荐说 `dojo init`，也可以说 `道场启动`、`开始学习`、`启动` 或 `dojo start`
- 不要跳过读取 methodology.md 的步骤，即使你"记得"方法论内容
- 本 skill **只做读取方法论**，不做进度检测、不做路由判断、不做教学/评估/编码
- 如果找不到 `_shared/methodology.md`，提示用户可能未正确安装，给出重新安装的命令

## 产出

- 无文件产出（纯初始化功能）

## 输出风格约束

详见共用 reference：[`../_shared/output-style-guide.md`](../_shared/output-style-guide.md)
