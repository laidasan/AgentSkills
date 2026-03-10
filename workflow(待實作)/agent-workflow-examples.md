# Agent Workflow — 案例對照

以「AIResumeList 新增 LastActionDate / ContactPrivacy 篩選條件」為實際案例，對照 5 Phase Workflow 各階段的互動內容。

---

## Phase 1: Discussion（討論需求與確認）

**目標：** 對齊需求、釐清模糊點、確認方向

### 案例：LastActionDate

使用者提供初始需求：

> 我想要在 AIResumeList.vue 的查詢條件，加上「最近活動日（LastActionDate）」。
> 實作風格參考：ExpectJobPanel、AotFlexibleFilterPanel。

Agent 探索 codebase 後，發現參考對象不正確，主動提出 3 個問題：

1. **Query 參數命名** — `plastActionDateType` vs `lastActionDateType`？
2. **Enum 值** — 是否沿用 vip25 的定義？
3. **組件模式** — `AotFlexibleFilterPanel`（tag 多選）vs `ResumeUpdatePanel`（radio 單選），哪個才對？

使用者確認：
- 使用 `lastActionDateType`
- 值沿用 vip25
- 「對，是我搞錯了，應該是和 ResumeUpdatePanel 結構一樣」

### 案例：ContactPrivacy

使用者提供需求時已修正參考對象：

> 實作風格參考：ResumeUpdatePanel、ResumeUpdatePanelManager

Agent 提出 3 個問題：

1. **API 參數名** — `contactPrivacy`？
2. **UI 標題** — 「姓名及聯絡資訊」vs「E-mail 及聯絡電話」？
3. **放置位置** — 在哪個 panel 之後？

使用者確認：`contactPrivacy`、「E-mail 及聯絡電話」、放在「履歷更新」下方。

### Phase 1 觀察

- Agent 應主動質疑不合理的地方（如錯誤的參考組件）
- 問題數量以 3～5 個為宜，一次問完
- 第二次任務中，使用者已學會提供更精確的參考，討論效率明顯提升

---

## Phase 2: Planning（規劃）

**目標：** 產出包含「決策摘要 + 實作步驟」的規劃文件

### 案例：LastActionDate

Agent 進入 PlanMode，產出 `last-action-date-plan.md`，包含：

- **異動檔案清單**（10 個 Step）
- 每個 Step 標明：新增 / 修改、檔案路徑、具體變更內容
- 程式碼片段示意（state 結構、mutation 簽名、template 寫法等）

使用者要求：「先不實作，先將計劃輸出成 md 文件」→ 輸出為 md 後再進入下一階段。

### 案例：ContactPrivacy

同樣產出 `contact-privacy-plan.md`，結構完全一致。
因為已有 LastActionDate 先例，規劃速度更快。

### Phase 2 觀察

- 規劃文件應包含足夠細節，讓使用者能逐條審查
- 使用者偏好「先輸出 md，不直接實作」— 這是進入 Phase 3 的前提
- 規劃文件同時作為實作時的 checklist

---

## Phase 3: Review Planning（審查規劃）

**目標：** 3a 審查決策方向、3b 審查實作步驟

### 案例：LastActionDate & ContactPrivacy

在這兩次任務中，使用者審查規劃文件後沒有提出修改，直接進入實作：

> 「開始實作 last-action-date-plan.md」
> 「開始實作 contact-privacy-plan.md」

**但 Phase 3 的價值在於：** 如果規劃有問題，能在寫程式之前就修正，成本遠低於實作後才發現方向錯誤。

### Phase 3 觀察

- 使用者傾向「直接告訴 Agent 要改什麼並且直接更新規劃」，而非來回討論
- 即使這次沒有觸發修改，這個階段仍是必要的 checkpoint

---

## Phase 4: Implementation（實作）

**目標：** 依據規劃文件逐步實作，實作前先讀取檔案最新狀態

### 案例：LastActionDate

Agent 依照 `last-action-date-plan.md` 的 10 個 Step 逐一實作：

| Step | 類型 | 檔案 |
|------|------|------|
| 1 | 新增 | `LastActionDateType.js` |
| 2 | 新增 | `LastActionDatePanel.vue` |
| 3 | 新增 | `LastActionDatePanelManager.js` |
| 4 | 修改 | `store/state.js` |
| 5 | 修改 | `mutations/index.js` |
| 6 | 修改 | `actions/index.js` |
| 7 | 修改 | `AiResumeListManager.js` |
| 8 | 修改 | `ResumePageManager.js` |
| 9 | 修改 | `AIResumeList.vue` |
| 10 | 修改 | `locales/zh_TW/aiResumeList/index.js` |

**踩到的坑：** Agent 嘗試編輯 `state.js`、`mutations/index.js`、`actions/index.js`、`locales/index.js` 時，因為沒有先讀取檔案而失敗。修正方式：先 Read 再 Edit。

→ 這驗證了「實作前先讀取最新狀態」的重要性。

### 案例：ContactPrivacy

同樣 10 個 Step，因為有 LastActionDate 的經驗，Agent 這次實作更順利，沒有再犯相同錯誤。

### Phase 4 觀察

- 修改既有檔案前，必須先讀取最新內容
- 新增檔案可以直接寫入
- 按照 Plan 的順序實作，降低遺漏風險

---

## Phase 5: Review Implementation（審查實作）

**目標：** 確認實作結果，作為下一輪的 checkpoint

### 案例：LastActionDate

使用者在實作完成後，自行做了調整：

- **調整 template 順序：** 將 `last-action-date-panel` 從「履歷更新」下方移到上方

這個調整不影響功能，屬於 UI 排列偏好。Agent 在後續的 ContactPrivacy 實作中，尊重了使用者調整後的順序。

### 案例：ContactPrivacy

使用者在實作完成後，自行做了調整：

- **修改 `ContactPrivacyType.js`：** 調整 JSDoc，在 `@property` 加上值的描述
- **修改 `ContactPrivacyPanel.vue`：** 新增 CSS 樣式處理 radio 對齊

### Phase 5 觀察

- 使用者的調整多為細節微調（UI 排列、JSDoc 格式、CSS 樣式）
- 這些調整反映了使用者的 coding style 偏好，Agent 應觀察並學習
- Phase 5 同時是下一個任務的起點 — 確保 Agent 基於最新狀態工作

---

## 整體觀察

| 面向 | 第一次（LastActionDate） | 第二次（ContactPrivacy） |
|------|--------------------------|--------------------------|
| Phase 1 討論 | 3 個問題，修正了錯誤的參考組件 | 3 個問題，使用者已給出正確參考 |
| Phase 2 規劃 | 首次建立 10 Step 結構 | 複製相同結構，更快完成 |
| Phase 3 審查 | 無修改 | 無修改 |
| Phase 4 實作 | 遇到「未先讀取檔案」錯誤 | 無錯誤 |
| Phase 5 審查 | 調整 template 順序 | 調整 JSDoc + CSS |

**關鍵學習：** 重複性任務中，Agent 和使用者都在迭代中優化 — 使用者提供更精確的輸入，Agent 避免已知的錯誤模式。
