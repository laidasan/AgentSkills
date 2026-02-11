# Example: Version Tracker Skill（複雜需求）

> 展示一個多步驟、Script/LLM 混合的複雜需求如何走過 Phase 1-6。

---

## Phase 1 產出：需求摘要

- **問題：** 手動追蹤 Claude Code 版本更新，寫文章、翻譯、發佈太繁瑣
- **情境：** 定期或手動觸發，檢查新版本後自動產出文章
- **輸入：** GitHub release API
- **輸出：** 三語文章（EN/ZH/JA），存到對應目錄

## Phase 2 產出：步驟清單

1. 查詢最新版本號 → 輸入：GitHub API → 輸出：版本字串
2. 比對已知版本 → 輸入：版本字串 + 本地紀錄 → 輸出：是否有更新
3. 抓取 changelog → 輸入：版本號 → 輸出：changelog 文字
4. 分析重要變更 → 輸入：changelog → 輸出：分級摘要
5. 決定文章角度與標題 → 輸入：摘要 → 輸出：標題 + 大綱
6. 用模板撰寫文章 → 輸入：大綱 + 模板 → 輸出：文章草稿
7. 翻譯為三語 → 輸入：文章 → 輸出：EN/ZH/JA 三版
8. 存檔到對應目錄 → 輸入：三版文章 → 輸出：檔案路徑

## Phase 3 產出：Script / LLM 標記

| # | 步驟 | 類型 | 理由 |
|---|---|---|---|
| 1 | 查詢最新版本 | Script | `gh api` 固定指令 |
| 2 | 比對版本 | Script | 字串比較，純邏輯 |
| 3 | 抓取 changelog | Script | WebFetch 固定 URL |
| 4 | 分析重要變更 | LLM | 需語義理解哪些變更對使用者重要 |
| 5 | 決定角度與標題 | LLM | 需創意判斷 |
| 6 | 用模板撰寫 | 混合 | 模板結構固定（Script），內容填充需 LLM |
| 7 | 三語翻譯 | LLM | 需語言能力 |
| 8 | 存檔 | Script | 固定路徑規則 |

**灰色地帶討論：** 步驟 6 是典型的混合型 — 模板用 Template Pattern 固定結構，LLM 負責填入分析內容。

## Phase 4 產出：Metadata

```yaml
name: tracking-ecosystem-updates
description: >
  Tracks Claude Code version releases, analyzes changelogs, writes articles
  in three languages, and saves to publish directories. Triggers when checking
  for updates or when a new version is detected.
model: sonnet
```

結構：SKILL.md + `templates/article.md`（文章模板獨立）

## Phase 5 重點：組裝策略

- 步驟 1-3（Script）：直接給 code block
- 步驟 4-5（LLM）：給判斷框架 + few-shot examples
- 步驟 6（混合）：引用 `@templates/article.md`，LLM 填空
- 步驟 7（LLM）：給翻譯約束（保留技術詞不翻譯、語氣一致）
- 步驟 8（Script）：固定路徑 `articles/{lang}/yyyy-mm-dd-title.md`
