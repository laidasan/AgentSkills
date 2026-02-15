---
name: skill-core-principles
description: Core design principles for Agent Skills. Load this skill before designing or authoring any SKILL to calibrate constraints: single responsibility, conciseness, and degrees of freedom.
user-invocable: true
---

# SKILL 核心原則

適用對象：所有 SKILL 的設計與撰寫階段皆須遵守。

## 1. 單一職責

每個 SKILL 需要符合單一職責。

## 2. 簡潔

只提供 LLM 不知道的資訊。SKILL.md 內容過多時，拆分到額外檔案而非全部塞進 SKILL.md。

## 3. 適當的自由度（Degrees of Freedom）

根據任務的脆弱性與變異性，決定指令的嚴格程度。

類比：窄橋（兩側懸崖）→ 低自由度；開闊平原 → 高自由度。

**高自由度**（文字指引）— 多種方式皆可行、依賴上下文判斷：

```markdown
## Code review process

1. Analyze the code structure and organization
2. Check for potential bugs or edge cases
3. Suggest improvements for readability and maintainability
4. Verify adherence to project conventions
```

**中自由度**（pseudocode / 帶參數腳本）— 有偏好模式、允許部分變化：

````markdown
## Generate report

Use this template and customize as needed:

```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data
    # Generate output in specified format
    # Optionally include visualizations
```
````

**低自由度**（精確腳本、無參數）— 操作脆弱易錯、一致性至關重要：

````markdown
## Database migration

Run exactly this script:

```bash
python scripts/migrate.py --verify --backup
```

Do not modify the command or add additional flags.
````
