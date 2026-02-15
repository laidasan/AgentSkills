---
name: skill-authoring-best-practices
description: Authoring constraints and guidelines for writing SKILL.md files. Provides metadata rules, structure limits, content standards, and anti-patterns. Triggers when creating or reviewing a SKILL.md to ensure it meets quality standards.
user-invocable: true
---

# 前置
1. 確認有沒有 `skill-core-principles` 這項 SKILL。
1-1. 有，進入第二步驟。
1-2. 無，進入 Phase 1。
2. 確認是否已經載入 `skill-core-principles` 這項 SKILL.md。
2-1. 已載入，進入 Phase 1。
2.2. 未載入，進入第三步驟。
3. 載入 `skill-core-principles` 這項 SKILL，載入完成後，進入 Phase 1。

# SKILL 最佳實踐原則

## 必須遵守（Constraints）

> 以下規範為硬性約束

### Metadata 規範

#### name
- 最多 64 字元
- 僅限小寫字母、數字、連字號（`-`）
- 不可包含 XML tags
- 不可包含保留字：`anthropic`、`claude`

#### description
- 不可為空，最多 1024 字元
- 不可包含 XML tags
- **必須使用第三人稱**（避免 "I can help..." 或 "You can use..."）
- 必須同時包含 **what**（做什麼）和 **when**（何時觸發）

### SKILL.md 結構規範

- 一個 SKILL 最低限度只需要一個 SKILL.md（含 YAML frontmatter），其餘檔案皆為 optional
- Body 控制在 **500 行以內**
- 超過時拆分至額外檔案
- Reference 檔案只維持 **一層深**（SKILL.md 直接引用，不做巢狀引用）
- 超過 100 行的 reference 檔案要加 **Table of Contents**
- 檔案命名要有描述性（`form_validation_rules.md`，非 `doc2.md`）
- 路徑一律使用 forward slash（`/`）

### 可執行腳本規範

- 腳本自己處理錯誤，不丟給 Claude 處理（solve, don't punt）
- 常數要有註解說明（避免 voodoo constants）
- 明確區分「執行腳本」vs「讀取腳本作為參考」
- 不假設套件已安裝，明確列出依賴
- MCP tool 使用完整限定名稱（`ServerName:tool_name`）

---

## 建議遵循（Guidelines）

> 以下為品質指引，遵循可提升 SKILL 的可維護性與一致性。

### 命名慣例

推薦使用 **gerund form**（動名詞）：
- `processing-pdfs`、`analyzing-spreadsheets`、`writing-documentation`

可接受的替代：
- 名詞片語：`pdf-processing`
- 動作導向：`process-pdfs`

避免：
- 模糊命名：`helper`、`utils`、`tools`
- 過度泛化：`documents`、`data`、`files`
- 同一組 SKILL 內命名模式不一致

### 內容規範

#### 簡潔是關鍵

挑戰每一段內容：「這段值得佔用 token 嗎？」

**Good example: Concise**（approximately 50 tokens）：

````markdown
## Extract PDF text

Use pdfplumber for text extraction:

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**Bad example: Too verbose**（approximately 150 tokens）：

```markdown
## Extract PDF text

PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available for PDF processing, but we
recommend pdfplumber because it's easy to use and handles most cases well.
First, you'll need to install it using pip. Then you can use the code below...
```

The concise version assumes Claude knows what PDFs are and how libraries work.

#### 用語一致性
選定一個用語後全 SKILL 統一使用，避免同義詞混用。

#### 避免時間敏感資訊
不寫「如果在 2025 年 8 月之前...」，改用「Current method」vs「Old patterns」結構。

#### Workflow 過大時
推入獨立檔案，在 SKILL.md 中依任務類型指引 Claude 讀取對應檔案。

### 避免的反模式
- 提供過多選項讓 Claude 選擇（給預設方案 + escape hatch）
- 深層巢狀引用（A → B → C → 實際內容）
- Windows 風格路徑（`\`）
