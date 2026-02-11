# Example: Version Tracker Skill（複雜需求）

> 展示一個多步驟、Script/LLM 混合的複雜需求如何走過 Phase 1-3，並產出設計文件。

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

---

## 設計文件產出

以下為依 `templates/skill-design-doc.md` 格式產出的設計文件：

### 1. Skill Overview

#### 問題與目標

手動追蹤 Claude Code 版本更新、撰寫介紹文章、翻譯成多語、存檔發佈，流程繁瑣且重複。需要一個 Skill 自動化從版本偵測到多語文章產出的完整流程。

#### 使用情境

定期或手動觸發，檢查是否有新版本。有更新時自動產出三語文章。

#### 輸入 / 輸出

| 項目 | 說明 |
|---|---|
| 輸入 | GitHub release API（anthropics/claude-code） |
| 輸出 | 三語文章（EN/ZH/JA），存到 `articles/{lang}/` 目錄 |

### 2. Workflow Steps

| # | 步驟 | 動作描述 | 輸入 → 輸出 | 類型 | 實作備註 |
|---|---|---|---|---|---|
| 1 | 查詢最新版本 | 呼叫 GitHub API 取得最新 release | GitHub API → 版本字串 | Script | `gh api repos/anthropics/claude-code/releases/latest --jq '.tag_name'` |
| 2 | 比對已知版本 | 與本地紀錄比較是否有更新 | 版本字串 + 本地紀錄 → boolean | Script | 讀取 `last-known-version.txt` 做字串比較 |
| 3 | 抓取 changelog | 取得該版本的變更日誌 | 版本號 → changelog 文字 | Script | WebFetch 固定 URL pattern |
| 4 | 分析重要變更 | 判斷哪些變更對使用者重要並分級 | changelog → 分級摘要 | LLM | 分級標準：High=影響日常使用、Medium=新指令/參數、Low=bug fix |
| 5 | 決定角度與標題 | 決定文章切入點和標題 | 摘要 → 標題 + 大綱 | LLM | 角度：告訴讀者「這對你意味著什麼」 |
| 6 | 用模板撰寫文章 | 以固定模板結構填入動態內容 | 大綱 + 模板 → 文章草稿 | 混合 | 模板結構固定，LLM 填充分析內容 |
| 7 | 翻譯為三語 | 將文章翻譯成 EN/ZH/JA | 文章 → 三版翻譯 | LLM | 技術詞保留原文不翻譯，語氣一致 |
| 8 | 存檔 | 存到對應語言目錄 | 三版文章 → 檔案路徑 | Script | `articles/{lang}/yyyy-mm-dd-title.md` |

### 3. Dependencies & Constraints

#### 步驟間關係

- 步驟 1 → 2 → 3：嚴格循序（版本比對通過才繼續）
- 步驟 2 若無更新：直接結束，不執行後續步驟
- 步驟 4 → 5 → 6 → 7 → 8：循序執行

#### 例外處理

- GitHub API 無法連線 → 記錄錯誤，下次重試
- 無更新 → 告知使用者，正常結束
- 翻譯品質不確定 → 產出後提示使用者人工審閱

#### 特殊偏好與限制

- 文章模板需獨立管理（`templates/article.md`）
- 技術術語（如 Claude Code、Agent Teams）不翻譯
- 標題格式：`Claude Code vX.Y.Z: {one-line highlight}`
