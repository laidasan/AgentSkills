---
name: summarizing-commits
description: Analyzes commits from a given base ref (branch name or commit hash) to HEAD and produces an MD table documenting the problem/bug and fix/adjustment per commit. Triggers when reviewing branch work after development is done.
user-invocable: true
argument-hint: "[base-ref (branch name or commit hash)]"
arguments: [base-ref]
---

# Summarizing Commits

> 逐個分析從指定起點到 HEAD 的 commit，產出兩份 MD 文件：分析計畫與分析結果表格。

`$base-ref` 可為 branch name 或 commit hash。若已提供，直接使用；若未提供，詢問使用者。

## Workflow

### Step 1 — 取得分支資訊與 commit 清單

```bash
CURRENT_BRANCH=$(git branch --show-current)
MERGE_BASE=$(git merge-base HEAD $base-ref)
git log --reverse --oneline $MERGE_BASE..HEAD
```

若無獨有 commit，提示使用者並終止。

若結果只有一個 commit → 跳過 Step 2-4，直接進入 Step 5 處理該 commit。

### Step 2 — 輸出分析計畫

建立第一份 MD 檔案 `<branch-name>-commit-plan.md`，寫入 commit 清單表格：

```markdown
| # | Hash | Title |
|---|------|-------|
```

### Step 3 — 掃描檔案變更與判斷 diff 讀取策略

逐個 commit 執行 `git diff-tree --no-commit-id --name-only -r <hash>`，取得檔案變更清單。

LLM 根據檔案路徑與名稱判斷是否需要讀取完整 diff：
- mock 資料、fixture、locale 大量新增等 → 標記為「可能不需要完整 diff」
- 業務邏輯、元件、工具函式等 → 標記為「需要完整 diff」

將每個 commit 的檔案變更清單與判斷結果追加到分析計畫 MD 中。

### Step 4 — 詢問使用者確認 diff 讀取策略

僅在 Step 3 中有 commit 被標記為「可能不需要完整 diff」時才執行此步驟。若所有 commit 皆需要完整 diff，跳過此步驟。

將所有被標記的 commit 一次性彙整，詢問使用者確認哪些 commit 不需要讀取完整 diff。

### Step 5 — 逐個 commit 分析與寫入

建立第二份 MD 檔案 `<branch-name>-commit-analysis.md`，使用 @templates/analysis-table.md 的表頭格式。

依序（舊→新）對每個 commit 執行，嚴格一次處理一個：

1. 讀取 diff：
   - 需要完整 diff：`git show <hash>`
   - 不需要完整 diff：`git show <hash> --stat` + commit message
2. 分析內容，歸納：
   - **問題 / Bug：** 這個 commit 要解決什麼問題或處理什麼需求
   - **修正 / 調整方式：** 具體做了什麼改動來解決
3. 將分析結果作為一列追加寫入分析結果表格
4. 「花費時間」欄位留空

完成一個 commit 的寫入後，再處理下一個。

## 產出物

| 檔案 | 內容 |
|------|------|
| `<branch-name>-commit-plan.md` | 分析計畫：commit 清單、檔案變更、diff 讀取策略 |
| `<branch-name>-commit-analysis.md` | 分析結果表格：問題/Bug、修正/調整方式、花費時間 |

預設輸出至專案根目錄，使用者可指定其他路徑。
