---
name: counseling-agent-skill-design
description: Guides users through designing Agent Skills via a structured multi-phase workflow. Triggers when users want to create a new skill or need help clarifying their skill's purpose, workflow steps, and Script/LLM split. Outputs a structured design document for downstream skill authoring.
user-invocable: true
---

# Skill Design Counselor

> 透過結構化的引導流程，協助使用者釐清 Agent Skill 的需求、拆解工作流程、標記 Script/LLM 分類，最終產出一份設計文件。

## Workflow

> 每個 Phase 開始前，LLM 先判斷使用者是否已提供足夠資訊。
> 若資訊足夠，快速確認後進入下一階段，不強制執行每個 Phase 的完整流程。

### Phase 0:
1. 確認有沒有 `skill-core-principles` 這項 SKILL。
1-1. 有，進入第二步驟。
1-2. 無，進入 Phase 1。
2. 確認是否已經載入 `skill-core-principles` 這項 SKILL.md。
2-1. 已載入，進入 Phase 1。
2.2. 未載入，進入第三步驟。
3. 載入 `skill-core-principles` 這項 SKILL，載入完成後，進入 Phase 1。

### Phase 1: 釐清需求與脈絡

**跳過條件：** 使用者已明確提供以下三項 → 快速確認後進入 Phase 2：
1. Skill 要解決的具體問題或痛點
2. 預期的使用情境（何時觸發、多常使用）
3. 期望的輸入與輸出

**引導策略：**

針對缺少的資訊，從以下問題中挑選最關鍵的 1-2 題發問，避免一次丟出所有問題：

| 缺少的資訊 | 引導問題 |
|---|---|
| 問題不明確 | 「你現在重複在做的事情是什麼？哪個環節最煩？」 |
| 使用情境模糊 | 「這個 Skill 會在什麼時候被觸發？是你主動呼叫，還是某個事件後自動執行？」 |
| 輸入輸出不清 | 「執行這個 Skill 時，你會提供什麼資訊？最後期望拿到什麼結果？」 |
| 範圍過大 | 「如果只能做一件事，你最希望它先處理哪個部分？」 |

**Phase 1 產出：** 一段簡短的需求摘要（問題 + 情境 + 輸入/輸出），與使用者確認後進入 Phase 2。

### Phase 2: 拆解工作流程

**跳過條件：** 使用者已提供明確的步驟清單（≥ 3 步且邏輯連貫） → 確認後進入 Phase 3。

**分析策略：**

根據 Phase 1 的需求摘要，將工作拆解為 5-10 個具體步驟：

1. 從「觸發點」開始，到「最終產出」結束，列出中間每一個動作
2. 每個步驟用「動詞 + 對象」描述（如：讀取 git log、比對 diff、產生摘要）
3. 標記步驟之間的依賴關係（哪些可以並行、哪些必須循序）
4. 識別分支點：有條件判斷的地方獨立成步驟

**Workflow Pattern 參考：**

根據使用者任務的特徵，參考適合的 workflow pattern：

- 多步驟、需追蹤進度 → See [checklist-workflow.md](reference/checklist-workflow.md)
- 產出需驗證、品質敏感 → See [feedback-loop.md](reference/feedback-loop.md)
- 有分支判斷、條件路徑 → See [conditional-workflow.md](reference/conditional-workflow.md)
- 不可逆操作、需先驗證計畫 → See [plan-validate-execute.md](reference/plan-validate-execute.md)

**向使用者確認的關鍵問題：**

- 「這些步驟的順序對嗎？有沒有漏掉的環節？」
- 「步驟 X 和 Y 之間，有沒有需要人工判斷的地方？」（用來預判 Phase 3 的 Script/LLM 分類）
- 「有沒有例外狀況？例如輸入格式不對、找不到檔案時該怎麼處理？」

**Phase 2 產出：** 編號步驟清單，每步包含：動作描述 + 輸入 → 輸出。確認後進入 Phase 3。

### Phase 3: 標記 Script / LLM

**判斷框架：**

對 Phase 2 的每個步驟，用以下規則分類：

| 條件 | 類型 | 典型範例 |
|---|---|---|
| 輸入/輸出格式固定，邏輯可窮舉 | Script | 讀檔、建目錄、跑 CLI 指令、字串替換 |
| 需要語義理解、摘要、判斷、生成 | LLM | 分析 diff 產生 commit message、決定分類 |
| 格式固定但有例外需彈性處理 | LLM + Script | 解析 log 後由 LLM 判斷嚴重程度 |

**灰色地帶的決策原則：**
- 偏好 Script：能用確定性邏輯處理的，不丟給 LLM（省 token、結果穩定）
- 若猶豫不決 → 問使用者：「步驟 X 的判斷規則能寫成 if/else 嗎？還是需要『理解』內容？」
- LLM 步驟結果不穩定時：拆成更小的子步驟、用 few-shot examples 穩定產出、用 quality gate 設定通過門檻

詳細分類依據參考 @reference/Skill-Design.md

**向使用者確認：**
- 將分類結果以表格呈現，請使用者逐步確認
- 特別標出灰色地帶的步驟，說明你的判斷理由，讓使用者決定

**Phase 3 產出：**

| # | 步驟 | 類型 | 理由 |
|---|---|---|---|
| 1 | （從 Phase 2 帶入） | Script / LLM / 混合 | （一句話說明） |

確認後進入產出階段。

---

## 產出規格

Phase 1-3 完成後，依照 @templates/skill-design-doc.md 模板產出設計文件。

**產出原則：**
- 結構必須符合模板的三段式架構（Skill Overview / Workflow Steps / Dependencies & Constraints）
- 內容可依實際引導結果延伸擴充，不限於模板中的欄位
- Workflow Steps 表格中的「實作備註」為彈性欄位，如實記錄使用者給出的資訊深度，不強制要求具體方案

**產出文件的用途：**
此設計文件供下游 skill（如撰寫 SKILL.md 的 skill）閱讀，LLM 應能從中理解 Skill 的目的，並依表格規劃實作 TODO 清單。

### 設計文件檢查

產出設計文件後，依以下 Checklist 逐項檢查。若未通過，向使用者說明問題所在並提供修正建議。

**結構完整性：**

- [ ] Skill Overview 三個欄位皆有內容（問題與目標、使用情境、輸入/輸出）
- [ ] Workflow Steps 表格每列的必填欄位皆有值（步驟、動作描述、輸入 → 輸出、類型）
- [ ] Dependencies & Constraints 至少涵蓋步驟間關係

**內容品質（LLM 判斷）：**

- [ ] 步驟描述使用「動詞 + 對象」格式，無模糊詞（「適當地」「合理的」）
- [ ] Script/LLM 分類合理 — 能寫成 if/else 的步驟未誤標為 LLM
- [ ] 步驟間依賴關係與表格順序一致，無矛盾
- [ ] 輸入/輸出鏈連貫 — 前一步的輸出能作為下一步的輸入
- [ ] 步驟拆解粒度適當 — 檢查是否有步驟隱含多個動作需進一步拆分

**未通過時：**
- 列出未通過的項目與具體問題
- 針對每個問題提供修正建議或引導使用者補充資訊
- 修正後重新檢查，直到全部通過

### 產出方式

Checklist 全部通過後，詢問使用者是否要將設計文件建立為 Markdown 檔案。若使用者同意，將設計文件寫入指定路徑。
