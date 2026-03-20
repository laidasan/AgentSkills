# Agent Skill 設計文件：Jira 子任務追蹤快取

## 1. Skill Overview

### 問題與目標

追蹤 Jira parent task 下的子任務進度時，需反覆手動查看 Jira，且難以掌握各子任務的狀態變化（誰從 Open 變成 In Progress、誰新增、誰已完成消失）。此 Skill 自動查詢、篩選、快取子任務資料，並比對歷史差異，讓使用者一個 command 就能掌握最新狀況與變動。

### 使用情境

使用者主動透過 command 呼叫，通常在需要了解某個 parent task 下子任務最新進展時使用。

### 輸入 / 輸出

| 項目 | 說明 |
|---|---|
| 輸入 | Jira parent task 號碼（如 `PROJ-123`） |
| 輸出 | 1. 對話中顯示篩選後子任務 Markdown table（含前端/後端判斷） |
| | 2. 對話中顯示與上次資料的差異 Markdown table |
| | 3. `./jiraIssuesCaching/${指定號碼}_issues.md` 檔案（含 YAML frontmatter + Markdown table） |

---

## 2. Workflow Steps

| # | 步驟 | 動作描述 | 輸入 → 輸出 | 類型 | 實作備註 |
|---|---|---|---|---|---|
| 1 | 取得 cloudId | 呼叫 `getAccessibleAtlassianResources` 取得 Jira cloudId | 無 → cloudId | Script | Jira MCP tool call |
| 2 | 查詢並篩選子任務 | 用 JQL `parent = {號碼} AND status in ("Open","In Sprint","In Progress","In Testing","Reopen")` 查詢，取回 key, summary, status, description, created, updated；設定 `maxResults: 100` | cloudId + 指定號碼 → 篩選後列表 | Script | Jira MCP `searchJiraIssuesUsingJql`，fields: `["summary","status","description","created","updated"]` |
| 3 | 讀取舊檔案 | 檢查 `./jiraIssuesCaching/${指定號碼}_issues.md` 是否存在，存在則解析 YAML frontmatter 取得舊資料 | 檔案路徑 → 舊資料（或空） | Script | 可與步驟 2 並行執行 |
| 4 | 判斷前端/後端類型 | LLM 閱讀每筆 issue 的 description，判斷該 issue 屬於前端、後端或不確定，並給出一句話判斷依據 | 篩選後列表（含 description） → 列表附加類型與依據 | LLM | description 為空時標注「無法判斷」；判斷結果不參與差異比對 |
| 5 | 比對差異 | 以 issue key 為基準比對新舊資料，產出三類差異：(A) 狀態變更 (B) 新增任務 (C) 不再出現於篩選結果 | 篩選後列表 + 舊資料 → 差異資料 | Script | key-to-key 比對，差異比對欄位為 key, summary, status, created, updated（不含類型判斷） |
| 6 | 輸出當前任務 table | 依樣板將篩選後列表以 Markdown table 輸出到對話中，包含類型與判斷依據欄位 | 篩選後列表 → 對話輸出 | LLM | 依固定樣板填值 |
| 7 | 輸出差異 table | 依樣板將差異資料以 Markdown table 輸出到對話中；首次執行提示「無歷史資料，本次為首次快取」 | 差異資料 → 對話輸出 | LLM | 依固定樣板填值 |
| 8 | 寫入/更新檔案 | 建立 `jiraIssuesCaching/` 目錄（如不存在），依樣板寫入 md 檔案（YAML frontmatter + 當前任務 table + 差異 table）；YAML 中包含類型判斷結果 | 篩選後列表 + 差異資料 → md 檔案 | LLM | 依方案 B 格式產出 |

---

## 3. Dependencies & Constraints

### 步驟間關係

- 步驟 2、3 可並行（查 Jira 同時讀舊檔案）
- 步驟 4 依賴步驟 2（需要 description）
- 步驟 5 依賴步驟 2 + 3 完成
- 步驟 6 依賴步驟 4 + 5（需要類型判斷 + 差異資料）
- 步驟 7 依賴步驟 5
- 步驟 8 依賴步驟 4 + 5

### 例外處理

- 指定號碼不存在或查無子任務 → 提示「查無資料」，跳過後續步驟
- `jiraIssuesCaching/` 目錄不存在 → 自動建立
- 舊檔案不存在 → 差異比對視為「首次執行」，差異 table 顯示「無歷史資料，本次為首次快取」
- 查詢結果超過 100 筆 → 輸出警告「子任務超過 100 筆，僅顯示前 100 筆」，快取仍寫入已取得的資料
- issue 的 description 為空 → 類型標注「無法判斷」，依據標注「description 為空」

### 特殊偏好與限制

- 檔案格式採用 **YAML frontmatter + Markdown table**（方案 B），YAML 作為結構化資料來源供差異比對，Markdown table 供人讀
- 篩選狀態固定為：Open、In Sprint、In Progress、In Testing、Reopen（使用 Jira `status.name` 原始值）
- 時間格式統一為 `YYYY/MM/DD HH:mm`（例如 `2026/03/20 13:32`），從 Jira API 回傳的 ISO 8601 格式轉換
- 透過 Jira MCP 存取 Jira，不需要使用者提供 site URL
- cloudId 透過 `getAccessibleAtlassianResources` 自動取得（僅支援單一 Jira site）
- 查詢上限為 100 筆（`maxResults: 100`），超過時顯示警告
- 前端/後端類型判斷由 LLM 基於 description 內容自行判斷（v1 不提供明確判斷規則），判斷結果存入快取但不參與差異比對
- description 不直接寫入快取檔案，僅作為 LLM 判斷類型的輸入

---

## 4. 討論紀錄與決策

| 議題 | 決策 | 原因 |
|---|---|---|
| 狀態名稱大小寫 | 使用 `status.name` 原始值（如 `In Testing`） | Jira API 回傳即為此格式，JQL 查詢不區分大小寫 |
| 「消失任務」語意 | 標注為「不再出現於篩選結果」，不額外查原因 | 消失原因多種（Closed、parent 變更、刪除等），逐一查 API 成本不划算，使用者可自行到 Jira 確認 |
| Pagination | 先採方案 1：maxResults=100 + 超過時警告 | 實際場景不太可能超過 100 筆；未來可考慮支援分頁參數（如 `--page 2`），但需同步處理快取追加邏輯 |
| cloudId | 每次執行自動取得，僅支援單一 site | 使用者目前只有一個 Jira site |
| 時間格式 | `YYYY/MM/DD HH:mm` | 平衡可讀性與精確度 |
| Reopen 狀態 | 加入篩選條件 | 實際使用中 subtask 可能被 Reopen |
| 前端/後端類型判斷 | LLM 閱讀 description 自行判斷，結果存入快取但不參與差異比對 | v1 先跑起來觀察準確度，未來可抽成獨立 Skill 提供判斷規則 |
| description 處理 | 不寫入快取檔案，僅作為判斷輸入 | 避免快取檔案膨脹，description 長短不一且含圖片連結等雜訊 |
| 類型判斷選項 | 前端 / 後端 / 不確定 | 部分 issue 可能前後端都涉及或資訊不足，需要「不確定」作為安全選項 |
