---
name: executing-sa
description: >
  Team-specific SA workflow runner. Configures rules, output directory
  structure, and delivery conventions, then invokes the analyst-system
  workflow. Use this skill to execute a full SA pipeline with team
  conventions applied. Triggers on phrases like "執行 SA", "跑 SA 流程",
  "開始系統分析", "run SA workflow".
---

# Executing SA

執行 SA Workflow，套用團隊規範與產出結構。

## 遵循規範

執行過程中，依據以下規範產出文件：

- @rules/analysis/Vue-SFC-分析原則.md
- @rules/analysis/Vue-SFC-組件分析規範.md
- @rules/diagram/繪製flowchart基本原則.md
- @rules/diagram/Codebase分析繪製flowchart原則.md
- @rules/diagram/繪製SequenceDiagram原則.md
- @rules/development/Class結構原則.md
- @rules/development/JSDoc規範.md
- @rules/development/Task文件規範.md
- @rules/development/TDD開發原則.md
- @rules/development/程式開發原則.md
- @rules/development/編碼風格原則.md

---

## 產出目錄對照

| 產出物 | 路徑 |
|--------|------|
| Codebase 規格文件 | .sa/codebase-analyze/ |
| Codebase 架構文件 | .sa/codebase-analyze/ |
| 新舊規格差異比對 | .sa/新舊規格差異比對.md |
| SA 文件 | .sa/SA文件.md |
| Design 文件 | .sa/design/ |
| Task 文件 | .tasks/ |

## 交付規則

- 所有產出物寫成檔案，放置於對應目錄。
- Task 引用 SA/Design 文件時，使用相對路徑（如 `.sa/design/xxx.md`）。

---

## 執行

載入 analyst-system skill，依照本 skill 定義的規範與規則，執行 analyst-system 的 workflow。
