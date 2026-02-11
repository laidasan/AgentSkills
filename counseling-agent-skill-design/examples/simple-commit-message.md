# Example: Commit Message Skill（簡單需求）

> 展示一個簡單需求如何走過 Phase 1-3，並產出設計文件。

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

---

## 設計文件產出

以下為依 `templates/skill-design-doc.md` 格式產出的設計文件：

### 1. Skill Overview

#### 問題與目標

每次 commit 前手動撰寫 commit message，格式不一致、品質不穩定。需要一個 Skill 自動根據 staged changes 產生符合 Conventional Commits 格式的 message。

#### 使用情境

使用者在 commit 前主動呼叫，每次 commit 使用一次。

#### 輸入 / 輸出

| 項目 | 說明 |
|---|---|
| 輸入 | Git staged changes（diff）+ 近期 commit 歷史 |
| 輸出 | 一則 Conventional Commits 格式的 commit message |

### 2. Workflow Steps

| # | 步驟 | 動作描述 | 輸入 → 輸出 | 類型 | 實作備註 |
|---|---|---|---|---|---|
| 1 | 讀取 staged diff | 取得目前 staged 的變更內容 | git 狀態 → diff 文字 | Script | `git diff --cached` |
| 2 | 讀取 commit log | 取得近期 commit 風格參考 | git repo → 近 10 筆 commit | Script | `git log --oneline -10` |
| 3 | 分析變更內容 | 語義理解 diff，摘要變更意圖 | diff → 變更摘要 | LLM | 需判斷框架 |
| 4 | 判斷 commit type | 根據摘要決定 type | 變更摘要 → type | LLM | feat/fix/refactor/docs/test |
| 5 | 產生 commit message | 組合 type + 摘要 + 風格 | type + 摘要 + 風格參考 → message | LLM | 使用 Conventional Commits 模板 |
| 6 | 呈現確認 | 輸出結果等待使用者確認 | message → 使用者回饋 | Script | 直接輸出 |

### 3. Dependencies & Constraints

#### 步驟間關係

- 步驟 1、2 可並行執行
- 步驟 3-5 必須循序（3 → 4 → 5）
- 步驟 6 在 5 完成後執行

#### 例外處理

- 無 staged changes 時，告知使用者並結束

#### 特殊偏好與限制

（無）
