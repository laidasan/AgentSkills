# 快取檔案格式樣板

## YAML Frontmatter 結構

```yaml
---
parentKey: "VIPOP-44083"
lastUpdated: "2026/03/20 15:30"
issues:
  - key: "VIPOP-44121"
    summary: "[AI 智慧查詢] 每日瀏覽上限，彈跳提醒異常"
    status: "In Testing"
    created: "2026/03/17 19:31"
    updated: "2026/03/20 15:19"
    type: "前端"
    typeReason: "涉及 UI 彈跳提醒與文案顯示"
  - key: "VIPOP-44122"
    summary: "API 回傳格式錯誤"
    status: "In Progress"
    created: "2026/03/18 10:00"
    updated: "2026/03/19 14:30"
    type: "後端"
    typeReason: "涉及 API response 格式處理"
---
```

## 當前任務 Table

```markdown
## 當前子任務（VIPOP-44083）

> 查詢時間：2026/03/20 15:30
> 篩選狀態：Open, In Sprint, In Progress, In Testing, Reopen
> 子任務數量：2 筆

| Key | Summary | Status | Type | Type Reason | Created | Updated |
|---|---|---|---|---|---|---|
| VIPOP-44121 | [AI 智慧查詢] 每日瀏覽上限，彈跳提醒異常 | In Testing | 前端 | 涉及 UI 彈跳提醒與文案顯示 | 2026/03/17 19:31 | 2026/03/20 15:19 |
| VIPOP-44122 | API 回傳格式錯誤 | In Progress | 後端 | 涉及 API response 格式處理 | 2026/03/18 10:00 | 2026/03/19 14:30 |
```

## 差異 Table

### 有差異時

```markdown
## 與上次快取的差異

> 上次查詢時間：2026/03/19 10:00

| 變更類型 | Key | Summary | 說明 |
|---|---|---|---|
| 狀態變更 | VIPOP-44121 | [AI 智慧查詢] 每日瀏覽上限，彈跳提醒異常 | In Progress → In Testing |
| 新增 | VIPOP-44125 | 新功能：批次匯出 | 新出現於篩選結果 |
| 不再出現 | VIPOP-44100 | 登入頁面樣式調整 | 不再出現於篩選結果 |
```

### 首次執行（無歷史資料）

```markdown
## 與上次快取的差異

> 無歷史資料，本次為首次快取。
```

### 無差異時

```markdown
## 與上次快取的差異

> 上次查詢時間：2026/03/19 10:00
> 與上次資料相同，無差異。
```

## 完整檔案範例

完整的快取檔案結構為：YAML frontmatter + 當前任務 Table + 差異 Table，三者依序組合。
