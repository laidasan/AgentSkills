# Jira 子任務追蹤快取 — 使用指南

查詢 Jira parent task 底下的子任務，自動分類前端/後端、快取結果，並在下次執行時比對差異。

## 前置條件

- Claude Code 已連線 Atlassian MCP（能存取你的 Jira 站台）

## 使用方式

### 1. Slash command 直接觸發

```
/caching-jira-mission VIPOP-42892
```

### 2. 自然語言觸發

```
幫我查一下 VIPOP-42892 底下的子任務目前狀態
```

兩種方式的輸出結果相同。

---

## 輸出範例

### 正常查詢

輸入：

```
/caching-jira-mission VIPOP-42892
```

輸出：

```markdown
## 當前子任務（VIPOP-42892）

> 查詢時間：2026/03/20 15:30
> 篩選狀態：Open, In Sprint, In Progress, In Testing, Reopen
> 子任務數量：23 筆

| Key | Summary | Status | Assignee | Type | Type Reason | Created | Updated |
|---|---|---|---|---|---|---|---|
| VIPOP-43460 | [Agent 產品驗證][UI] 查詢完會記憶相同的結果嗎？ | Open | 未指派 | 前端 | 涉及 UI 查詢結果記憶與呈現行為 | 2026/01/30 10:21 | 2026/02/02 11:57 |
| VIPOP-43427 | [Agent 產品驗證][API] API Response 欄位格式？ | Open | 未指派 | 後端 | 涉及 API Response 欄位格式定義 | 2026/01/29 15:59 | 2026/01/29 16:00 |
| VIPOP-43153 | [API][Agent] 串接 - 起始頁面是否需要打 API | Open | 未指派 | 不確定 | 同時涉及前端頁面載入與後端 API 串接 | 2026/01/16 16:45 | 2026/01/19 16:56 |
| ... | | | | | | | |

### 狀態統計

| Status | 數量 |
|---|---|
| Open | 23 |

## 與上次快取的差異

> 無歷史資料，本次為首次快取。
```

### 第二次執行（有差異時）

再次執行同一個 parent task key 時，會與上次快取比對，顯示變化：

```markdown
## 與上次快取的差異

> 上次查詢時間：2026/03/19 10:00

| 變更類型 | Key | Summary | 說明 |
|---|---|---|---|
| 狀態變更 | VIPOP-44121 | [AI 智慧查詢] 每日瀏覽上限，彈跳提醒異常 | In Progress → In Testing |
| 新增 | VIPOP-44125 | 新功能：批次匯出 | 新出現於篩選結果 |
| 不再出現 | VIPOP-44100 | 登入頁面樣式調整 | 不再出現於篩選結果 |
```

### 查無結果

輸入：

```
/caching-jira-mission VIPOP-99999
```

輸出：

```
查無符合條件的子任務。
```

---

## 欄位說明

| 欄位 | 說明 |
|---|---|
| Key | Jira issue key |
| Summary | issue 標題 |
| Status | 目前狀態（僅顯示 Open / In Sprint / In Progress / In Testing / Reopen） |
| Assignee | 指派人（未指派時顯示「未指派」） |
| Type | 前端 / 後端 / 不確定 |
| Type Reason | 分類的判斷依據 |
| Created | 建立時間 |
| Updated | 最後更新時間 |

## 快取機制

每次執行會將查詢結果寫入 `jiraIssuesCaching/{parent-task-key}_issues.md`。下次對同一個 parent task key 執行時，會自動比對兩次結果的差異，顯示哪些 issue 狀態改變了、哪些是新增的、哪些不再出現。

快取檔案位於你的當前工作目錄下。
