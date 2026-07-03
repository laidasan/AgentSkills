# Dev Workflow Project

## 啟動時自動執行

每次啟動新 session 時：

1. 讀取 `.recap/RECAP.md`，了解當前進度與上次的決策脈絡
2. 讀取 `.improve/優化-workflow.md`，了解優化方向與做法
3. 檢查 `.improve/` 下是否有改善建議文件（`改善建議-round-*.md`），若有則讀取最新一份
4. 向使用者 report 當前進度摘要，包含：
   - 目前在第幾輪迭代
   - 上次的待辦事項
   - 下一步建議

## Session 延續機制

結束 session 前（或使用者要求時），將本次 session 的進展、決策、待辦事項更新到 `.recap/RECAP.md`。
