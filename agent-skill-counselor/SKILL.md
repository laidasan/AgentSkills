---
name: agent-skill-counselor
description: Guides users through designing and writing Agent Skills via a structured multi-phase workflow. Triggers when users want to create a new skill, ask for help structuring a SKILL.md, or need guidance on the Script vs LLM split.
user-invocable: true
---

# Skill Counselor

> 協助使用者設計並撰寫 Agent Skill。
> 透過結構化的引導流程，幫助使用者從需求釐清到產出完整的 SKILL.md。

---

## Workflow

> 每個 Phase 開始前，LLM 先判斷使用者是否已提供足夠資訊。
> 若資訊足夠，快速確認後進入下一階段，不強制執行每個 Phase 的完整流程。

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

**向使用者確認：**
- 將分類結果以表格呈現，請使用者逐步確認
- 特別標出灰色地帶的步驟，說明你的判斷理由，讓使用者決定

**Phase 3 產出：**

| # | 步驟 | 類型 | 理由 |
|---|---|---|---|
| 1 | （從 Phase 2 帶入） | Script / LLM / 混合 | （一句話說明） |

確認後進入 Phase 4。

### Phase 4: 定義 Skill 結構與 Metadata

**Metadata 引導：**

協助使用者定義以下欄位：

| 欄位 | 規則 | 引導問題 |
|---|---|---|
| `name` | 小寫 kebab-case，2-4 個詞，動詞開頭 | 「用一個動作短語描述這個 Skill：『做什麼-對什麼』」 |
| `description` | 一句話，說明 Skill 做什麼 + 何時觸發 | 「別人看到這句話就知道什麼時候該用它」 |
| `model` | 依複雜度建議 | 純 Script 多 → Haiku；需深度推理 → Sonnet/Opus |

**檔案結構判斷：**

- 預設單檔 `SKILL.md`
- 若 SKILL.md 超過 500 行或邏輯區塊可獨立 → 拆分為子檔案，用 `@reference` 引用
- 拆分原則：一個子檔案 = 一個獨立職責（如 `prompts.md`、`scripts/build.sh`）
- `@reference` 只允許一層深，不可嵌套引用

**Phase 4 產出：** Metadata 草稿 + 檔案結構規劃。確認後進入 Phase 5。

### Phase 5: 撰寫 SKILL.md

**組裝策略：**

根據 Phase 3 的分類，用不同方式撰寫每個步驟的指令：

| 步驟類型 | 寫法 | 範例 |
|---|---|---|
| Script | 給出具體指令或 code block，LLM 照做 | `執行 git diff --cached` |
| LLM | 給判斷框架 + 約束條件，讓 LLM 推理 | 「根據 diff 內容，用 Conventional Commits 格式產生摘要。若變更超過 3 個檔案，分類列出。」 |
| 混合 | Script 取得資料 → LLM 處理結果 | 先 `git log --oneline -10`，再由 LLM 分析 commit 風格 |

**常用 Pattern（依情境選用）：**

- **Template**：產出格式固定時，提供模板讓 LLM 填空
- **Examples**：判斷標準難以規則化時，用 2-3 個範例示範期望行為
- **Conditional Workflow**：有分支邏輯時，用 `if/then` 結構明確列出條件與對應動作
- **Feedback Loop**：產出需要迭代時，定義「完成條件」讓 LLM 自行檢查並修正

**撰寫原則：**
- Brevity First：LLM 已知的常識不重複解釋
- 每個指令段落用動詞開頭，直接說要做什麼
- 避免模糊詞（「適當地」「合理的」），改用具體條件

**Phase 5 產出：** 完整的 SKILL.md 草稿。與使用者逐段確認後進入 Phase 6。

### Phase 6: 檢查與驗證建議

**通用品質檢查：** 依照 @reference/Skill-Authoring-Checklist.md 逐項檢查。

**流程特有檢查：**

- [ ] Phase 1-5 每個階段的產出都已完成且經使用者確認
- [ ] Phase 3 的 Script/LLM 分類與 Phase 5 的寫法一致（Script 步驟給了具體指令，LLM 步驟給了判斷框架）
- [ ] 所有 Conditional Workflow 的分支完整覆蓋
- [ ] 產出格式無歧義（模板或範例已提供）

**LLM 補充檢查：**

根據該 Skill 的特性，額外檢查是否有遺漏的邊界情況。

**驗證建議：**

建議使用者用兩輪驗證：
1. **Designer 視角**：用一個簡單需求走一遍流程，確認引導是否自然、產出是否符合預期
2. **Tester 視角**：用一個邊界案例（異常輸入、極端情境）測試，確認錯誤處理與分支邏輯

**Phase 6 產出：** 勾選完成的 Checklist + LLM 補充建議 + 修正項目清單
