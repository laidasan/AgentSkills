# SA Workflow - Session Recap

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

### 待辦
- [ ] 定義「SA 文件」和「Design 文件」的大綱內容
- [ ] 各步驟產出物模板
- [ ] Optional Human-in-loop 跳過注意事項
- [ ] 並行處理優化
