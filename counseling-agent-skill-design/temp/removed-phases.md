# 從 SKILL.md 移除的內容

> 以下為原 counseling-agent-skill-design SKILL.md 中 Phase 4-6 的完整原文，以及相關的 Checklist 檔案。

---

## Phase 4: 定義 Skill 結構與 Metadata

**Metadata 引導：**

協助使用者定義以下欄位：

| 欄位 | 規則 | 引導問題 |
|---|---|---|
| `name` | 小寫 kebab-case，2-4 個詞，gerund form（動詞+ing） | 「用 verb-ing + 對象描述：如 `writing-commits`、`processing-pdfs`」 |
| `description` | 一句話，說明 Skill 做什麼 + 何時觸發 | 「別人看到這句話就知道什麼時候該用它」 |

**檔案結構判斷：**

- 預設單檔 `SKILL.md`
- 若 SKILL.md 超過 500 行或邏輯區塊可獨立 → 拆分為子檔案，用 `@reference` 引用
- 拆分原則：一個子檔案 = 一個獨立職責（如 `prompts.md`、`scripts/build.sh`）
- `@reference` 只允許一層深，不可嵌套引用
- 超過 100 行的子檔案，在頂部加 Table of Contents，確保 LLM partial read 時仍能看到全貌

**Phase 4 產出：** Metadata 草稿 + 檔案結構規劃。確認後進入 Phase 5。

## Phase 5: 撰寫 SKILL.md

**組裝策略：**

根據 Phase 3 的分類，用不同方式撰寫每個步驟的指令：

| 步驟類型 | 寫法 | 範例 |
|---|---|---|
| Script | 給出具體指令或 code block，LLM 照做 | `執行 git diff --cached` |
| LLM | 給判斷框架 + 約束條件，讓 LLM 推理 | 「根據 diff 內容，用 Conventional Commits 格式產生摘要。若變更超過 3 個檔案，分類列出。」 |
| 混合 | Script 取得資料 → LLM 處理結果 | 先 `git log --oneline -10`，再由 LLM 分析 commit 風格 |

**Good vs Bad 範例：**

Script 步驟 —

Good:
```markdown
執行 `git diff --cached --stat` 取得變更檔案清單。
若無 staged changes，告知使用者並結束。
```

Bad:
```markdown
適當地取得目前的變更資訊。
```

LLM 步驟 —

Good:
```markdown
根據 diff 內容判斷 commit type：
- 新增功能 → `feat`
- 修復 bug → `fix`
- 重構（不改外部行為）→ `refactor`
- 文件更新 → `docs`
若變更橫跨多個類型，以影響最大的為主，並在 body 說明其餘變更。
```

Bad:
```markdown
分析變更內容，產生合適的 commit type。
```

**常用 Pattern（依情境選用）：**

**Template** — 產出格式固定時，提供模板讓 LLM 填空：
```markdown
用以下格式產生 commit message：
<type>(<scope>): <summary>

<body — 列出主要變更，每項一行>
```

**Examples** — 判斷標準難以規則化時，用 Input/Output pair 示範：
```markdown
Example 1:
Input: 修改 src/auth/login.ts，新增 JWT 驗證邏輯
Output: feat(auth): implement JWT-based authentication

Example 2:
Input: 修正 utils/date.ts 中時區轉換的 off-by-one 錯誤
Output: fix(utils): correct timezone conversion off-by-one error
```

**Conditional Workflow** — 有分支邏輯時，明確列出條件：
```markdown
判斷變更規模：
- 變更 ≤ 3 個檔案 → 直接產生單一 commit message
- 變更 > 3 個檔案 → 按模組分組摘要，建議是否拆成多個 commit
```

**Feedback Loop** — 產出需要迭代時，定義完成條件：
```markdown
1. 產生 commit message 草稿
2. 自我檢查：summary ≤ 50 字元？type 正確？scope 存在？
3. 若不通過 → 修正後重新檢查
4. 通過後呈現給使用者
```

**撰寫原則：**
- Brevity First：LLM 已知的常識不重複解釋
- Match Flexibility to Fragility：根據步驟的風險程度決定指令嚴格度

| 風險程度 | 適用情境 | 寫法 |
|---|---|---|
| 高（不可出錯）| DB migration、刪檔、發佈 | 給精確腳本，禁止修改 |
| 中（有偏好）| 格式轉換、命名規則 | 給 pseudocode 或參數化腳本 |
| 低（多種正確答案）| code review、摘要 | 給方向性指引 |

- 每個指令段落用動詞開頭，直接說要做什麼
- 避免模糊詞（「適當地」「合理的」），改用具體條件

**Phase 5 產出：** 完整的 SKILL.md 草稿。與使用者逐段確認後進入 Phase 6。

## Phase 6: 檢查與驗證建議

**通用品質檢查：** 依照 Skill-Authoring-Checklist.md 逐項檢查。

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

---

## 附錄：Skill Authoring Checklist（原 reference/Skill-Authoring-Checklist.md）

> Standalone checklist for reviewing SKILL.md quality before publishing.

### Core Quality

- [ ] `description` is specific and includes key domain terms
- [ ] `description` explains both what the skill does and when to trigger it
- [ ] `description` uses third person
- [ ] SKILL.md body < 500 lines
- [ ] Extra details are split into separate files
- [ ] No time-sensitive information (or placed in collapsed `<details>` blocks)
- [ ] Terminology is consistent throughout
- [ ] Examples are concrete, not abstract
- [ ] References are one level deep — no nested chains
- [ ] Progressive Disclosure is used appropriately
- [ ] Workflows have explicit steps

### Scripts & Code

- [ ] Scripts handle their own errors — never leave the agent guessing
- [ ] No magic numbers (all constants are annotated)
- [ ] Dependencies are listed and confirmed available
- [ ] All file paths use forward slashes
- [ ] Critical operations include validation / feedback loops
- [ ] Clear distinction between "run this script" vs "read this for reference"

### Testing

- [ ] At least 3 evaluation scenarios defined
- [ ] Tested on all model tiers intended for use
- [ ] Tested with realistic use cases (not hypothetical scenarios)
- [ ] Team feedback collected (if applicable)
