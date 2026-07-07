# 討論：analyst-system SKILL.md 架構重構方向

> 日期：2026-07-07
> 參與：使用者、Claude

---

## 議題

analyst-system SKILL.md 目前在流程定義前，內建了「遵循規範」（@rules/...）和「產出物目錄結構」。是否應該將這些移出 skill，改由外部 caller 注入？

## 使用者提案

將 analyst-system 定位為「純 workflow」：

- **移出**：rules 引用、輸出目錄結構
- **保留（暫定）**：輸出樣板（格式），但後續可能也移出
- **注入方式**：由 caller（如 `executing-sa` command）在調用 analyst-system 前，透過 context 指定 rules 路徑、輸出目錄等
- **使用者參數**：caller 可接受自然語言參數，讓最終使用者補充額外 context 或規範路徑

### 架構分層

```
使用者（自然語言 context / 額外規範）
  ↓ 參數
caller（executing-sa command）— 注入 rules、目錄結構、樣板
  ↓ 調用
analyst-system（純 workflow 流程定義）
```

## 討論過程

### 1. 注入機制

- 決定：由 caller 的 md 文件中，在調用 analyst-system 前以自然語言指定 rules 路徑與輸出目錄
- 不在 analyst-system 內部聲明「預期外部提供什麼」

### 2. analyst-system 是否需要聲明前置條件？

- **使用者立場**：不需要。analyst-system 不應該知道外部存在什麼，它只知道自己要執行哪些流程。如果加了前置條件聲明，就會綁死 caller 必須提供特定的東西，破壞彈性。
- **如果擔心 caller 遺漏**：應該寫使用文件（documentation），而不是在流程中制定約束。
- **結論**：不加前置條件。

### 3. Silent failure 風險

- **問題**：LLM 不像編譯器，caller 漏注入 rules 時不會報錯，會 silent failure（用 LLM 預設行為產出）。
- **使用者觀點**：
  - 使用 SKILL + LLM 本身就存在這個潛在問題，需要在「彈性」和「穩定」之間找平衡
  - caller 是決定「穩定」的端點，底層 flow 要保持「彈性」
  - 透過「疊加規則、規範」來達成穩定，而非由底層自己鎖死
  - 如果 analyst-system 內建了必須遵守的規範、必須有的產出、必須用的方式，就會讓底層 flow 變得「穩定」但失去調整空間
- **結論**：接受 silent failure 風險，由 caller 端負責穩定性。

### 4. 樣板（template）的歸屬

- 樣板本質上是一種規範（規定產出的結構），與 rules 性質相同
- 把 rules 移出但樣板留下，邏輯上不對稱
- **使用者觀點**：如果追求一致性，樣板也應該移出，或由中間層提供
- **結論（暫定）**：目前可接受樣板留在 skill 內，但認知到這是一個 tradeoff，未來可能進一步抽離

### 5. 一致性 vs 上手成本

- 拆得越乾淨，caller 要準備的東西越多（rules、目錄結構、樣板），寫新 caller 的門檻越高
- 目前 caller 數量少且由使用者自己控制，門檻不是問題
- 此 tradeoff 留待實際使用情境決定要多乾淨

## 關鍵決策

| 項目 | 決策 |
|------|------|
| rules 引用 | 從 analyst-system 移出，由 caller 注入 |
| 輸出目錄結構 | 從 analyst-system 移出，由 caller 定義 |
| 輸出樣板（格式） | 暫留 analyst-system，未來可能移出 |
| 前置條件聲明 | 不加，靠使用文件而非流程約束 |
| silent failure | 接受風險，caller 端負責穩定性 |
| 分層架構 | 使用者 → caller（穩定端）→ analyst-system（彈性端） |

## 待執行

- [ ] 修改 analyst-system SKILL.md：移除「遵循規範」section 和「產出物目錄結構」section
- [ ] 建立或更新 executing-sa command：注入 rules 和目錄結構
- [ ] 決定樣板最終歸屬（留在 skill 或移出）
