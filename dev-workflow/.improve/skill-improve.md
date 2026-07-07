# Skill 改善紀錄

## 2026-07-07 — SKILL.md 檢驗（基於 skill-core-principles + skill-authoring-best-practices）

### 已確認要處理

1. **Metadata 修正**
   - name：`dev-workflow` 偏泛化，調整為更具描述性的名稱
   - description：違反第三人稱約束（「Use when the user wants to...」），需改寫

2. **移除「遵循規範」區塊**
   - 硬編碼 8 個 `@rules/` 引用與步驟三四「不與特定規範耦合」的設計意圖矛盾
   - 移除後，規範的注入由外層 command/skill 負責

3. **刪除 workflow.md**
   - 已確認無任何引用，僅為歷史副本
   - SKILL.md body 已包含完整 workflow 內容

### 架構決策：外層 command 的組合模式

使用者可建立外層 command/skill 來包裝 `executing-dev-task`，指定：
- 跳過哪些步驟
- 預填步驟所需的資料（如 task 路徑、規範檔案）

**採用方向 A：靠 prompt context 傳遞，不改 SKILL.md 的步驟結構。**

理由：
- SKILL.md 各步驟已有「使用者選擇跳過」的跳過條件設計
- LLM 從 context 讀到外層 command 的指示後，自然會按指示跳過或使用預填資料
- 不增加 SKILL.md 的複雜度

備選方向（未來如果方向 A 行為不夠穩定時考慮）：
- 方向 B：在 SKILL.md 步驟中明確設計 override 接口，每個可跳過/可預填的步驟加入「若上下文中已提供 X，直接使用」的檢查邏輯

### 待處理（非本次範圍）

- Round 1 的 6 個流程改善問題（依賴解析、步驟三細化等）— 待 skill 結構穩定後再整合
