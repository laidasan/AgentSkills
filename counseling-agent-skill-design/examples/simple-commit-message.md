# Example: Commit Message Skill（簡單需求）

> 展示一個簡單需求如何走過 Phase 1-6。

---

## Phase 1 產出：需求摘要

- **問題：** 每次寫 commit message 都要想格式，品質不一致
- **情境：** 使用者主動呼叫，每次 commit 前使用
- **輸入：** staged changes（git diff --cached）
- **輸出：** 符合 Conventional Commits 格式的 commit message

## Phase 2 產出：步驟清單

1. 讀取 staged diff → 輸入：git 狀態 → 輸出：diff 文字
2. 讀取最近 commit log → 輸入：git repo → 輸出：近 10 筆 commit
3. 分析變更內容 → 輸入：diff → 輸出：變更摘要
4. 判斷 commit type → 輸入：變更摘要 → 輸出：feat/fix/refactor/...
5. 產生 commit message → 輸入：type + 摘要 + 風格參考 → 輸出：完整 message
6. 呈現給使用者確認

## Phase 3 產出：Script / LLM 標記

| # | 步驟 | 類型 | 理由 |
|---|---|---|---|
| 1 | 讀取 staged diff | Script | `git diff --cached`，固定指令 |
| 2 | 讀取 commit log | Script | `git log --oneline -10`，固定指令 |
| 3 | 分析變更內容 | LLM | 需要語義理解 diff 的意圖 |
| 4 | 判斷 commit type | LLM | 需要根據內容判斷分類 |
| 5 | 產生 commit message | LLM | 需要組合資訊 + 遵循風格 |
| 6 | 呈現確認 | Script | 直接輸出結果 |

## Phase 4 產出：Metadata

```yaml
name: writing-commit-message
description: >
  Generates Conventional Commits messages from staged changes.
  Triggers when the user asks to write or draft a commit message.
```

結構：單檔 SKILL.md（預估 < 100 行）

## Phase 5 產出：SKILL.md 草稿片段

```markdown
## Workflow

1. 執行 `git diff --cached`，取得 staged changes
2. 執行 `git log --oneline -10`，取得近期 commit 風格
3. 分析 diff 內容，摘要變更意圖
4. 判斷 commit type：
   - 新增功能 → `feat`
   - 修復 bug → `fix`
   - 重構（不改行為）→ `refactor`
   - 文件 → `docs`
   - 測試 → `test`
5. 用以下格式產生 commit message：
   ```
   <type>(<scope>): <summary>

   <body — 列出主要變更>
   ```
6. 呈現給使用者，等待確認或修改
```
