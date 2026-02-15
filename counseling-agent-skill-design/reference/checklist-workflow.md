# Checklist Workflow

## 適用條件（When to Use）

- 任務為多步驟（≥ 5 步），步驟間有順序依賴
- 需要追蹤進度，避免跳步或遺漏
- 每個步驟的完成狀態明確（做了 / 沒做）

## 概念說明

將複雜流程拆為編號步驟清單，提供可勾選的 checklist。Claude 逐步執行並標記完成狀態，確保不遺漏關鍵步驟。

## 範例

以「git commit message 生成 Skill」為例，workflow 可設計為：

````markdown
## Commit Message 生成流程

複製此 checklist 追蹤進度：

```
Task Progress:
- [ ] Step 1: 讀取 staged changes（git diff --cached）
- [ ] Step 2: 分析變更類型（feat / fix / refactor / ...）
- [ ] Step 3: 識別影響範圍（scope）
- [ ] Step 4: 產生 commit message
- [ ] Step 5: 與使用者確認
```

**Step 1: 讀取 staged changes**

執行 `git diff --cached`，取得所有已 staged 的變更內容。

→ 輸入：git repo 路徑
→ 輸出：diff 文字內容

**Step 2: 分析變更類型**

根據 diff 內容判斷屬於哪種變更類型。

→ 輸入：diff 文字內容
→ 輸出：變更類型標籤（feat / fix / refactor / ...）

**Step 3: 識別影響範圍**

從變更的檔案路徑與內容推斷 scope。

→ 輸入：diff 文字內容
→ 輸出：scope 字串

**Step 4: 產生 commit message**

依據類型、scope、diff 內容，產生符合 Conventional Commits 格式的訊息。

→ 輸入：變更類型 + scope + diff 內容
→ 輸出：commit message 草稿

**Step 5: 與使用者確認**

將草稿呈現給使用者，確認或修改後執行 commit。

→ 輸入：commit message 草稿
→ 輸出：最終 commit message
````

### 設計重點

- 每個步驟用「動詞 + 對象」描述，明確標註輸入 → 輸出
- Checklist 放在流程最前面，讓 Claude 一目了然整體進度
- 步驟間的順序依賴清楚：Step 2-3 依賴 Step 1 的輸出，Step 4 依賴 Step 2-3
