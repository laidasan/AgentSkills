# SA Workflow - Session Recap

## Session 4 — 2026-07-07

### 進度
- 討論 analyst-system SKILL.md 的架構重構方向
- 確立「純 workflow」定位：rules 和輸出目錄結構從 skill 移出，由 caller 注入

### 關鍵決策
- analyst-system 定位為純流程引擎，不內建任何外部規範引用或目錄結構
- 穩定性由 caller 端透過「疊加規則、規範」達成，底層 flow 保持彈性
- 不在 analyst-system 加前置條件聲明，需要的話寫使用文件
- 接受 silent failure 風險，這是 LLM + SKILL 模式的固有特性
- 輸出樣板暫留 skill 內，但認知到未來可能也移出以維持一致性
- 分層架構：使用者 → caller（穩定端）→ analyst-system（彈性端）

### 討論紀錄
- [analyst-system 架構重構方向](../.improve/mind.md)

### 待辦
- [ ] 修改 analyst-system SKILL.md：移除「遵循規範」section 和「產出物目錄結構」section
- [ ] 建立或更新 executing-sa command：注入 rules 和目錄結構
- [ ] 決定樣板最終歸屬（留在 skill 或移出）
- [ ] 根據 Task 樣板反推 Design 樣板（含面向拆分與抽象層級定義）（Session 3 遺留）
- [ ] 執行第二輪 SA Workflow 驗證修正效果（Session 3 遺留）
- [ ] Optional Human-in-loop 跳過注意事項（Session 3 遺留）
- [ ] 並行處理優化（Session 3 遺留）

---

## Session 3 — 2026-07-02

### 進度
- 逐條討論 `.improve/改善建議-round-1.md` 的 AI 端想法（共 6 條）
- 將確認的改善項目落地到 `workflow.md`

### workflow.md 變更內容
1. **新增「產出物目錄結構」section** — 定義 `.sa/` 與 `.tasks/` 的目錄結構與各步驟產出物放置位置
2. **新增「產出物交付規則」** — 統一寫檔、Human-in-loop 步驟額外提供檔案連結與摘要
3. **初始化追加詢問** — 若有既有 codebase，追加詢問入口檔案/目錄與相關模組範圍
4. **不確定/多重解讀標記規則** — 產出物交付規則：文件內直接標記；Human-in-loop 通用規則：摘要中列出標記處引導使用者重點確認
5. **步驟十 Task 產出要求** — 遵循 Task 文件規範、摘要自足原則

### 討論後決定不加的項目
- AI 想法 3（分析策略「以新規格引導分析範圍」）— 屬於使用者行為，不放 workflow
- AI 想法 4（步驟八設計提問指引）— 步驟八九的 loop 機制已覆蓋討論需求
- AI 想法 5（允許功能合併）— LLM 本來就會做的推理，不需要顯式規範
- 建議 7（分析範圍確認機制）— 已被建議 2（初始化追加詢問）+ 步驟三 Human-in-loop 覆蓋，不需額外步驟

### 關鍵決策
- 產出目錄：`.sa/` 放分析與設計產物，`.tasks/` 放 Task，兩者分離
- 交付形式：統一寫檔，不分 Human-in-loop 與否；Human-in-loop 多提供連結與摘要
- Task 引用路徑：從專案根目錄起算
- 步驟八的設計討論不需要額外指引，依賴步驟九的 Human-in-loop 循環處理

### 步驟十 Task 產出要求
- 在 workflow.md 步驟十新增 Task 產出要求：遵循 Task 文件規範、摘要自足
- 不另外定義 Task 樣板，沿用既有的 Task 文件規範（預期放在執行專案的 `.claude/rules/` 下）
- 引用 SA/Design 路徑作為細節參考，非前置必讀
- 「摘要自足」定義：開發者單獨看 Task 就能理解做什麼、怎麼做、為什麼

### 待辦（Round 2 剩餘工作）
- [x] 定義 Task 樣板（由終點開始）— 沿用既有 Task 文件規範 + workflow 步驟十補充摘要自足要求
- [ ] 根據 Task 樣板反推 Design 樣板（含面向拆分與抽象層級定義）
- [x] 定義產出目錄結構
- [x] 將改善建議中可直接修改 workflow.md 的項目落地
- [ ] 執行第二輪 SA Workflow 驗證修正效果
- [ ] Optional Human-in-loop 跳過注意事項
- [ ] 並行處理優化

---

## Session 2 — 2026-07-02

### 進度
- 建立優化循環機制與相關文件結構
- 完成第一輪 SA Workflow 測試執行（使用 `.test-doc/` 測試素材）
- 完整走過步驟零～步驟十，所有 Human-in-loop 步驟皆保留
- 產出改善建議 `.improve/改善建議-round-1.md`

### 第一輪測試執行摘要
- 測試素材：B Agent 互動回饋模組（整體流程 + 模組規格）
- 既有 codebase：`recruitment` 專案，入口 `AIResumeList.vue`
- 結果：既有 codebase 僅有 per-resume 回饋（按讚/倒讚），五個情境提示為全新功能
- SA 文件拆為 7 個功能分類，Design 文件 6 份（功能二併入功能一），Task 7 份

### 產出物
- `.test-doc/步驟一-既有Codebase規格文件.md`
- `.test-doc/步驟二-既有Codebase架構文件.md`
- `.test-doc/步驟四-新舊規格差異比對.md`
- `.test-doc/步驟六-SA文件.md`
- `.test-doc/步驟八-Design-01-回饋收集與累計機制.md`
- `.test-doc/步驟八-Design-03-情境判斷引擎.md`
- `.test-doc/步驟八-Design-04-情境提示UI.md`
- `.test-doc/步驟八-Design-05-情境按鈕行為與Agent整合.md`
- `.test-doc/步驟八-Design-06-倒讚標籤擴充.md`
- `.test-doc/步驟八-Design-07-自然語言觸發.md`
- `.test-doc/.tasks/bgaent-feedback/01~07.md`（7 份 Task）
- `.improve/優化-workflow.md`
- `.improve/改善建議-round-1.md`

### 關鍵決策
- 先不執行量化評分，先跑一輪完整 workflow 暴露問題
- 量化評分方向先記錄四個維度：產出物品質、流程銜接、Human-in-loop 互動、規範遵循
- 改善建議獨立一份文件（按輪次），不拆評分報告與問題紀錄
- 功能二（回饋重置機制）的 Design 併入功能一，避免重複

### 執行中發現的 Workflow 問題（流程機制面）
- 產出物的交付形式（對話 vs 檔案）未在 workflow 中定義
- 使用者每次都需要手動要求「獨立輸出文件」
- 步驟之間的產出物存放目錄未規範
- 功能設計時可能出現跨功能合併的情況，workflow 未定義處理方式
- 初始化階段缺少 codebase 分析範圍的確認
- 步驟八缺少設計提問的指引（何時該先討論、何時直接出方案）

### 融合觀察（產出物品質與結構面）
Round 1 執行後使用者與 AI 討論，融合雙方觀點產出的深度觀察：
- 需要制定產出文件樣板，且應「由終往前推」（Task → Design → SA → 前序步驟）
- Task 內容深度不足，缺少具體行為描述，開發者需回翻 Design 才能開工
- Design 應區分抽象層級（架構決策 vs 實作細節）
- Design 應按面向拆分（UI / 架構 / 程式），目前混在一起降低針對性
- 產出目錄結構需與樣板連動定義

詳見 `.improve/改善建議-round-1.md` 第四節。

### 待辦（Round 2 優先工作）
- [ ] 定義 Task 樣板（由終點開始）
- [ ] 根據 Task 樣板反推 Design 樣板（含面向拆分與抽象層級定義）
- [ ] 定義產出目錄結構
- [ ] 將改善建議 1~7 中可直接修改 workflow.md 的項目落地
- [ ] 執行第二輪 SA Workflow 驗證修正效果
- [ ] Optional Human-in-loop 跳過注意事項
- [ ] 並行處理優化

---

## Session 1 — 2026-07-01

### 進度
- 確立了 SA workflow 的前提：已完成 RA 階段，使用者提供確認好的新規格。
- 針對 mind.md 提出 8 個設計議題，全數討論完畢並做出決策。
- 確立先讓流程跑通，模板/產出物格式後續優化的策略。
- 建立了 session 延續機制（CLAUDE.md + .recap/）。
- 完成 workflow.md 初版撰寫，涵蓋初始化階段、Human-in-loop 通用規則、步驟一～十。
- 步驟三的確認範圍已明確化（根據步驟一、二實際執行狀況決定確認內容）。

### 關鍵決策
- 步驟一二不並行、步驟八九不並行（後續可優化）
- SA 文件結構統一，不分有/無 codebase 模板
- Human-in-loop 支持「部分修正後繼續」
- Task 拆解由 LLM 綜合判斷
- Optional 處理採 A 方案：流程開頭一次性收集（兩輪）
- 先不定義模板，用實際產出校準後再固定

### 討論紀錄
- [討論 01 — Workflow 設計議題](discussion-01-workflow-design.md)
- [討論 02 — Workflow 機制設計](discussion-02-workflow-mechanism.md)

### 產出物
- `workflow.md` — SA workflow 規範文件（初版）
- `.recap/discussion-01-workflow-design.md` — 設計議題討論紀錄
- `.recap/discussion-02-workflow-mechanism.md` — 機制設計討論紀錄

### 待辦（已結轉至 Session 2）
- [ ] 定義「SA 文件」和「Design 文件」的大綱內容
- [ ] 各步驟產出物模板
- [ ] Optional Human-in-loop 跳過注意事項
- [ ] 並行處理優化
