---
name: analyst-system
description: >
  Executes the SA (System Analysis) workflow: analyzes existing codebase,
  compares old/new specs, produces SA documents, Design documents (with
  ClassDiagram/SequenceDiagram), and Task breakdowns.
  Use this skill whenever the user wants to: start system analysis for a new
  feature or module, analyze how a new spec impacts existing code, produce
  architecture design from a spec, break down a feature spec into
  implementation tasks, or do any SA/Design/Task pipeline work. Triggers on
  phrases like "系統分析", "SA workflow", "分析這個新功能", "規格拆成 Task",
  "幫我做 SA", "Design 文件", "架構設計".
---

# SA Workflow

## 定義

- 新規格：使用者持有且提供的規格文件，在 AgentSkill `analyst-system` 內稱為「新規格」

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

## 產出物目錄結構

所有產出文件放置在當前工作目錄下：

```
./
├── .sa/
│   ├── codebase-analyze/        # 步驟一、二：既有 Codebase 分析
│   ├── 新舊規格差異比對.md        # 步驟四
│   ├── SA文件.md                 # 步驟六
│   └── design/                  # 步驟八
└── .tasks/                      # 步驟十
```

### 交付規則

- 所有產出物寫成檔案，放置於對應目錄。
- 不確定或多重解讀的部分，在文件內直接標記。
- Human-in-loop 步驟：寫檔後，在對話中提供檔案路徑與摘要供使用者確認。
- Task 引用 SA/Design 文件時，使用相對路徑（如 `.sa/design/xxx.md`）。

---

## 階段零：初始化

執行兩輪資訊收集，決定執行路徑。

### 第一輪：收集輸入物

向使用者詢問：

1. **新規格**（必要）：請使用者提供新規格文件。
2. **既有 Codebase**：是否有既有線上代碼？
   - 若有，追加詢問：入口檔案/目錄、相關模組範圍。
3. **既有規格文件**：是否已有既有 codebase 的規格文件？
4. **既有架構文件**：是否已有既有 codebase 的架構文件？

根據回應決定步驟執行狀態：

| 條件 | 影響 |
|------|------|
| 無既有 codebase | 跳過步驟一～五，步驟六用六-B |
| 有 codebase，無既有規格文件 | 執行步驟一 |
| 有 codebase，有既有規格文件 | 跳過步驟一 |
| 有 codebase，無既有架構文件 | 執行步驟二 |
| 有 codebase，有既有架構文件 | 跳過步驟二 |
| 有 codebase | 步驟六用六-A |

### 第二輪：確認 Human-in-loop 偏好

列出以下 optional 步驟，詢問使用者哪些要保留：

- **步驟三**：確認既有 codebase 的規格/架構文件
- **步驟五**：確認新舊規格差異
- **步驟九**：確認 Design 文件

步驟七（確認 SA 文件）為必要，不可跳過。

### 初始化完成

整理執行路徑呈現給使用者確認：

```
本次 SA Workflow 執行路徑：
- 步驟一：[執行 / 跳過]（原因）
- 步驟二：[執行 / 跳過]（原因）
- 步驟三：[執行 / 跳過]
- 步驟四：[執行 / 跳過]
- 步驟五：[執行 / 跳過]
- 步驟六：[六-A / 六-B]
- 步驟七：執行（必要）
- 步驟八：執行
- 步驟九：[執行 / 跳過]
- 步驟十：執行
```

使用者確認後開始執行。

---

## Human-in-loop 通用規則

所有 Human-in-loop 步驟遵循：

1. 將產出物完整呈現給使用者。
2. 若有標記不確定/多重解讀的部分，在摘要中列出，引導使用者重點確認。
3. 詢問：內容是否正確？是否需要修正？
4. **等待使用者回應，不可自行往下執行。**
5. 確認通過 → 進入下一步驟。提出修正 → 更新產出物，重新呈現，再次確認。循環直到通過。

---

## 步驟一：既有 Codebase 規格分析

**條件**：有既有 codebase，且無既有規格文件。

分析既有 codebase，撰寫規格文件，描述目前系統的功能與行為。

**產出**：`.sa/codebase-analyze/` 下的規格文件。

---

## 步驟二：既有 Codebase 架構分析

**條件**：有既有 codebase，且無既有架構文件。

分析既有 codebase，繪製架構文件：ClassDiagram、SequenceDiagram。

**產出**：`.sa/codebase-analyze/` 下的架構文件。

---

## 步驟三：確認規格/架構文件（Human-in-loop・optional）

**條件**：使用者選擇保留此步驟。

依 Human-in-loop 通用規則確認：
- 步驟一有執行 → 確認規格文件。
- 步驟二有執行 → 確認架構文件。
- 皆有執行 → 兩份都確認。

---

## 步驟四：新舊規格差異比對

**條件**：有既有 codebase。

將既有規格（步驟一產出或使用者提供）與新規格比對。

**產出**：`.sa/新舊規格差異比對.md`。

---

## 步驟五：確認新舊規格差異（Human-in-loop・optional）

**條件**：使用者選擇保留此步驟。

依 Human-in-loop 通用規則確認步驟四產出物。

---

## 步驟六：撰寫 SA 文件

### 六-A：有 Codebase

針對新舊規格差異與既有 codebase：
1. 依功能分類。
2. 拆解每個需異動的組件/模組。
3. 寫出檔案位置與功能間的依賴關係。

### 六-B：無 Codebase

根據新規格：
1. 依功能分類。
2. 標記功能間的依賴關係。

**產出**：`.sa/SA文件.md`。

---

## 步驟七：確認 SA 文件（Human-in-loop・必要）

不可跳過。依 Human-in-loop 通用規則確認步驟六產出物。

---

## 步驟八～九：Design 文件循環

步驟八與九組成循環，依 SA 文件中的功能分類逐一執行。完成一個功能的 Design 並確認後，再進行下一個。不平行處理。

### 步驟八：產出 Design 文件

針對當前功能進行架構設計：
- 參考既有 codebase 設計（若有）
- 依新規格設計架構
- 繪製 ClassDiagram
- 繪製 SequenceDiagram

**產出**：`.sa/design/` 下該功能的 Design 文件。

### 步驟九：確認 Design 文件（Human-in-loop・optional）

**條件**：使用者選擇保留此步驟。

依 Human-in-loop 通用規則確認步驟八產出物。確認通過後，若仍有未處理功能，回到步驟八。全部完成後進入步驟十。

---

## 步驟十：產出 Task

根據所有 Design 文件、SA 文件、規格文件，將實作工作拆解為 Task。

拆解策略由功能依賴關係、架構層次等因素綜合判斷。

### Task 產出要求

- 遵循 Task 文件規範（@rules/development/Task文件規範.md）。
- 每份 Task 須「摘要自足」— 開發者單獨看 Task 就能理解做什麼、怎麼做、為什麼。
- 引用 SA/Design 文件路徑作為細節參考，非前置必讀。

**產出**：`.tasks/` 下的 Task 文件。
