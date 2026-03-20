---
name: caching-jira-mission
description: Queries Jira sub-tasks under a parent task, caches results with diff tracking, and classifies each issue as frontend or backend. Triggers when a user provides a Jira parent task key (e.g. "/caching-jira-mission VIPOP-44083"), wants to check sub-task progress, track Jira issue changes over time, or needs a quick overview of what's new/changed under a parent task.
user-invocable: true
---

# Jira 子任務追蹤快取

查詢 Jira parent task 下的子任務，快取結果並比對歷史差異，同時判斷每筆 issue 屬於前端或後端。

## Usage

```
/caching-jira-mission <parent-task-key>
```

## Workflow

### Step 1｜取得 cloudId

呼叫 `mcp__claude_ai_Atlassian__getAccessibleAtlassianResources`，從回傳結果取得第一筆的 cloudId。

若回傳結果為空 → 輸出「無法取得 Jira 資源，請確認 Atlassian 連線設定」，結束流程。

### Step 2 + 3（並行執行）

Step 2 和 Step 3 皆不依賴彼此的結果，且 parent-task-key 來自使用者輸入（非 Step 1 產物），因此可並行。

#### Step 2｜查詢子任務

呼叫 `mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql`：

- **cloudId**: Step 1 取得的值
- **jql**: `parent = {parent-task-key} AND status in ("Open","In Sprint","In Progress","In Testing","Reopen")`
- **fields**: `["summary","status","description","assignee","created","updated"]`
- **maxResults**: `100`
- **responseContentFormat**: `"markdown"`

若 `total` 為 0 → 輸出「查無符合條件的子任務」，結束流程。
若 `total` 超過 100 → 在後續輸出中加入警告：「子任務超過 100 筆，僅顯示前 100 筆」。

從回傳結果中取出每筆 issue 的：
- `key`（頂層欄位）
- `fields.summary`
- `fields.status.name`
- `fields.assignee.displayName`（若為 null 則填「未指派」）
- `fields.description`（供 Step 4 使用，不寫入快取）
- `fields.created`
- `fields.updated`

**時間格式轉換**：將 `created` 和 `updated` 從 ISO 8601（如 `2026-03-17T19:31:05.195+0800`）轉為 `YYYY/MM/DD HH:mm`（如 `2026/03/17 19:31`）。

#### Step 3｜讀取舊快取

執行腳本解析舊快取檔案：

```bash
node ./scripts/parse-cache.cjs "./jiraIssuesCaching/{parent-task-key}_issues.md"
```

解析輸出的 JSON：
- `exists: true` → 取得 `issues` 陣列和 `lastUpdated` 供 Step 5 使用
- `exists: false` → 標記為首次執行
- 若回傳含 `error` 欄位 → 視為首次執行，並在最終輸出中附帶警告：「舊快取檔案解析失敗：{error}，本次視為首次快取」

### Step 4｜判斷前端/後端類型

對 Step 2 取得的每筆 issue，閱讀其 `description` 內容，判斷該 issue 屬於：
- **前端**：涉及 UI、畫面、樣式、文案、互動行為等
- **後端**：涉及 API、資料庫、邏輯處理、伺服器等
- **不確定**：前後端皆涉及、資訊不足、或 description 為空

每筆產出：
- `type`：前端 / 後端 / 不確定
- `typeReason`：一句話說明判斷依據（description 為空時填「description 為空」）

### Step 5｜比對差異

以 issue `key` 為基準，比對 Step 2（新資料）與 Step 3（舊資料），產出三類差異：

| 變更類型 | 條件 |
|---|---|
| 狀態變更 | 同一 key 存在於新舊資料，但 `status` 不同 |
| 新增 | key 存在於新資料，不存在於舊資料 |
| 不再出現 | key 存在於舊資料，不存在於新資料 |

**注意**：差異比對欄位為 key, summary, status, assignee, created, updated。`type` 和 `typeReason` 不參與比對。

若 Step 3 為首次執行 → 跳過比對，差異結果為空。

### Step 6｜輸出當前任務 Table

依以下格式輸出到對話中：

```
## 當前子任務（{parent-task-key}）

> 查詢時間：{當前時間 YYYY/MM/DD HH:mm}
> 篩選狀態：Open, In Sprint, In Progress, In Testing, Reopen
> 子任務數量：{數量} 筆

| Key | Summary | Status | Assignee | Type | Type Reason | Created | Updated |
|---|---|---|---|---|---|---|---|
| {key} | {summary} | {status} | {assignee} | {type} | {typeReason} | {created} | {updated} |

### 狀態統計

| Status | 數量 |
|---|---|
| {status} | {count} |
```

### Step 7｜輸出差異 Table

依以下格式輸出到對話中：

**有差異時：**

```
## 與上次快取的差異

> 上次查詢時間：{lastUpdated}

| 變更類型 | Key | Summary | 說明 |
|---|---|---|---|
| 狀態變更 | {key} | {summary} | {舊status} → {新status} |
| 新增 | {key} | {summary} | 新出現於篩選結果 |
| 不再出現 | {key} | {summary} | 不再出現於篩選結果 |
```

**首次執行：**

```
## 與上次快取的差異

> 無歷史資料，本次為首次快取。
```

**無差異時：**

```
## 與上次快取的差異

> 上次查詢時間：{lastUpdated}
> 與上次資料相同，無差異。
```

### Step 8｜寫入快取檔案

1. 若 `jiraIssuesCaching/` 目錄不存在，先建立（快取目錄位於**使用者當前工作目錄**下的 `jiraIssuesCaching/`）
2. 依 @templates/cache-file-template.md 的格式，寫入 `./jiraIssuesCaching/{parent-task-key}_issues.md`

檔案內容依序為：
1. YAML frontmatter（含 parentKey, lastUpdated, issues 陣列——每筆含 key, summary, status, assignee, created, updated, type, typeReason）
   - **所有 value 一律用雙引號包裹**（確保含冒號、特殊字元的 summary 不會破壞解析）
2. 當前任務 Markdown table（同 Step 6 格式）
3. 差異 Markdown table（同 Step 7 格式）
