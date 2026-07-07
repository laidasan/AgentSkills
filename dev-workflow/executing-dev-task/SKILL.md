---
name: executing-dev-tasks
description: >
  Executes development tasks from a task directory following project coding standards.
  Reads tasks, identifies applicable development rules, then implements each task with compliance checks.
  Triggered when development tasks need to be executed for a project.
---

# Dev Workflow

## 步驟一：確認有哪些 Tasks

搜尋當前專案根目錄的 `.tasks/` 目錄，列出所有 task。未標記「完成」的 task 視為需要執行。

---

## 步驟二：確認要執行的 Tasks（Human-in-loop・optional）

將未完成的 task 清單呈現給使用者，確認要執行哪些。

跳過條件：使用者選擇跳過。跳過時，默認執行所有未完成的 task。

---

## 步驟三：確認現有 Context 的開發原則與規範

從現有的 LLM 上下文中，尋找開發原則與規範。

來源不限定特定路徑，可能來自：
- 執行專案的 `.claude/rules/`
- 使用者在對話中提供的規範
- 執行專案目錄下的其他文件

此步驟不與任何特定開發規範耦合。

---

## 步驟四：確認開發原則與規範（Human-in-loop・optional）

將步驟三找到的開發原則與規範呈現給使用者確認。

跳過條件：使用者選擇跳過。可能現有 Context 已存在規範、使用者啟用流程時已提供，或確認沒有開發原則與規範。

---

## 步驟五～七：逐個執行 Task（Loop）

對每個待執行的 task，依序執行以下流程：

### 步驟五：依照開發規範執行 Task

依照步驟三、四確認的開發原則與規範，執行當前 task。

### 步驟六：檢查產出是否符合開發規範

依照步驟三、四確認的開發原則與規範，逐項檢查當前 task 的產出。若有不符合之處，立即調整，直到全部符合。

若步驟三、四有找到開發原則與規範，此步驟**必須嚴格執行**。若沒有規範，跳過此步驟。

### 步驟七：標記 Task 完成

將當前 task 的狀態標記為 `done`。

---

回到步驟五，執行下一個 task，直到所有 task 完成。
