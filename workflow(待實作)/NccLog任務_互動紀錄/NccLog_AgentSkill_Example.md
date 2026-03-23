# NccLog 埋設工作流程 — Example 文件（履歷功能_AI 智慧查詢）

> 本文件記錄「履歷功能_AI 智慧查詢」NccLog 埋設的完整對話流程，作為 Pattern 文件的具體實例。
> 每個段落標注對應的 Phase，以及該階段的輸入、產出、決策點。

---

## Phase 1：建立脈絡

### 輸入
使用者要求閱讀三份文件：
- `NccLog_脈絡總整理.md`（導讀索引）
- `B_Agent_驗證版_NccLog_相關文件.md`（API 與 ext 欄位說明）
- `B_Agent+測試版_NCC Log拷貝.xlsx`（Excel 規格）

### Agent 行為
1. 逐一讀取三份文件
2. 讀完後向使用者回報：
   - 已完成哪些類別（AI 智慧查詢結果列表、FeedBack）
   - 未完成哪些類別（AI 智慧查詢、其他）
   - Excel 中還有哪些之前分析文件未涵蓋的 sheet
3. 表達準備就緒，詢問使用者想接著處理哪個部分

### 產出
Agent 對脈絡有完整掌握，使用者指定處理「履歷功能_AI 智慧查詢」

---

## Phase 2：分析差異

### 輸入
- 使用者要求重新審視 `NccLog_分析_履歷功能_AI智慧查詢.md`
- 指出應和 AiResumeList 的實作方向相同

### Agent 行為
1. 使用 Explore subagent 深入探索兩個頁面的代碼：
   - AiSearchRecommendResumeListManager（待實作）
   - AiResumeListManager（已完成，作為參照）
2. 產出差異對照表，涵蓋 6 個項目：RC 設定、customNccLogExt、操作方法、serialNumber、pddScore、sendFeedbackNccLog

### 產出：需補齊項目表

| # | 項目 | 說明 |
|---|------|------|
| 1 | RC 設定 | Vue 中 `// TODO rc`，singleEventRc 未設定 |
| 2 | customNccLogExt getter | Manager 中不存在 |
| 3 | garId / pr 存儲 | ResumePageManager API 回傳後沒有保存 |
| 4 | serialNumber | convertResumesToResumePageList 中未計算 |
| 5 | pddScore | AiResumeBO 本身有，不需額外處理 |
| 6 | sendFeedbackNccLog 的 pr/Gar_id | hardcode 空字串 |

---

## Phase 3：議題討論（第一輪）

### Agent 浮現的議題

**議題 1：garId / pr 的存儲位置**
- 問題：`/resume/key-jobs/recommend` API 是否回傳 garId / pr？
- 影響：決定是否需要存儲邏輯
- 使用者決策：**API 不回傳，固定帶空字串**

**議題 2：serialNumber 的計算方式**
- 問題：每個職缺履歷數不同，如何跨分頁編號？
- 使用者決策：**跨分頁連續編號**（第一頁 [1,2,3]，第二頁 [4,5,6]）

**議題 3：jobNo 來源**
- 問題：每個 resumeCard 的 jobNo 不同，不能放在 Manager getter
- 使用者提出 Solution：從 resumeCardUid 取 pageId，可能就是 jobNo
- Agent 行為：**不直接附和，而是去探索驗證**

### Agent 驗證使用者的 Solution（議題 3 深入）

使用 Explore subagent 探索後發現：
- `pageUid ≠ jobNo`（pageUid 是隨機 UUID）
- 但 resumeCard 上已直接掛有 `jobNo` 屬性
- 正確做法：`getResumeCardByUid(resumePageList)(resumeCardUid).jobNo`

### 產出：三個議題的結論

| 議題 | 結論 |
|------|------|
| garId / pr | 固定空字串，不需存儲 |
| serialNumber | 跨分頁累計 offset |
| jobNo | 從 `resumeCard.jobNo` 直接取得 |

---

## Phase 4：實作規劃

### 輸入
使用者確認方向 OK，要求進 PlanMode 進行實作規劃

### Agent 行為
1. 進入 PlanMode
2. 使用 Explore subagent 取得所有需修改檔案的精確代碼（行號、方法簽名）
3. 撰寫實作計畫（7 個 Step）
4. 輸出 plan file

### 產出
Plan file，包含 Step 1~7 的修改步驟

---

## Phase 5：規劃審視（兩輪）

### 第一輪：Agent 主動審視

使用者要求：「重新審視規劃內容，你認為有沒有其他問題、想法、議題」

Agent 提出 4 個議題：

**議題 A：ResumeLinkFactory 的 RC 用途**
- 問題：ResumeLinkFactory 的 rc 和 resumeModalsManager.singleEventRc 是不是同一件事？
- 使用者決策：**使用 AiResumeRc.Single 即可**

**議題 B：input 欄位**
- 問題：Excel 規格中「履歷功能_AI 智慧查詢」的 ext 沒有列 input
- Agent 自己發現的問題，主動提出

**議題 C：getCustomNccLogExt 是否需要**
- 問題：如果只有 3 個欄位（Gar_id、pr、jobno），是否值得抽方法？
- 使用者決策：**需要 getCustomNccLogExt 方法**，input 不需要帶

**議題 D：serialNumber 累計順序依賴 keyJobs 順序**
- 問題：keyJobs 順序是否穩定？
- 使用者決策：**沒問題，使用跨分頁累計 offset**

### 第二輪：使用者挑戰 serialNumber 計算方式

使用者提出：「能不能用 keyJobs.map 的 index 來計算？`index + resumeCardIndex + 1`」

Agent 行為：
- **不直接否定**，而是用具體數字舉例說明為什麼不行
- 列出表格展示：Job 0 (3筆) 正確，但 Job 1 (2筆) 開始就算錯
- 結論：index 只增加 1，但前一個職缺可能貢獻多筆履歷

使用者再提出：「那用 `(page - 1) * perPage + (resumeCardIndex + 1)` 呢？和 AiResumeList 相同」

Agent 行為：
- 再次用具體數字舉例
- 說明此公式的前提是「每頁筆數固定」，但此頁面每職缺履歷數不固定
- 結論：AiResumeList 能用是因為有固定的 perPage，此頁面不適用

使用者最終確認：使用 offset 方案

### 產出
所有議題確認完畢，使用者說「開始實作」

---

## Phase 6：實作執行

### Agent 行為
1. 讀取所有需修改的檔案（確認最新內容）
2. 建立 Task 追蹤進度（3 個 task）
3. 逐步修改：
   - Task 1: ResumePageManager — serialNumber 計算（累計 offset）
   - Task 2: AiSearchRecommendResumeListManager — import AiResumeRc、pddScore、getCustomNccLogExt、4 個操作方法、setup RC
   - Task 3: AISearchRecommendResumeList.vue — import AiResumeRc、ResumeLinkFactory RC
4. 每個 task 完成後標記 completed
5. 輸出修改摘要表

### 產出：修改摘要

| 檔案 | 修改 |
|------|------|
| ResumePageManager.js | serialNumber 跨分頁累計計算 |
| AiSearchRecommendResumeListManager.js | import AiResumeRc、pddScore、getCustomNccLogExt、4 方法補齊、setup RC |
| AISearchRecommendResumeList.vue | import AiResumeRc、RC 設定、移除 TODO |

---

## 關鍵觀察：對話中的決策演進

以下記錄幾個值得注意的決策演進過程：

### 觀察 1：使用者主動提出 Solution → Agent 驗證 → 修正

- 使用者提出「pageId 可能就是 jobNo」→ Agent 探索後發現 pageUid 是隨機 UUID → 找到正確方案 `resumeCard.jobNo`
- 使用者提出「用 index 計算 serialNumber」→ Agent 用具體數字反駁 → 使用者再提出 `(page-1)*perPage` → Agent 再次用數字反駁 → 最終確認 offset 方案

**Pattern**：Agent 不直接附和也不直接否定，而是**用具體例子驗證**可行性。

### 觀察 2：Agent 主動發現規劃遺漏

- 議題 B（input 欄位）是 Agent 在審視規劃時自己發現的，不是使用者提出的
- 議題 A（ResumeLinkFactory RC 用途）也是 Agent 主動質疑

**Pattern**：規劃審視階段 Agent 要**主動找問題**，不只是等使用者確認。

### 觀察 3：「不需修改的部分」同樣重要

- sendFeedbackNccLog 的 pr/Gar_id 已經 hardcode 空字串，恰好是此頁面的正確值
- 明確列出「不需修改」避免後續誤認為遺漏

**Pattern**：實作計畫要**明確列出不需修改的部分及原因**。
