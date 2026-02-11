# Skill Authoring Guide

> Best practices and conventions for writing SKILL.md files.

---

## 1. Core Principles

### Brevity First

The context window is a shared resource. Only write what the LLM does not already know.

For every paragraph, ask:
- Does the agent actually need this explanation?
- Is this paragraph worth the tokens it costs?

**Good** (~50 tokens):
````markdown
## Extract PDF text
Use pdfplumber for text extraction:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**Bad** (~150 tokens):
```markdown
PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available...
```

### Match Flexibility to Fragility

Choose instruction strictness based on how fragile the task is:

| Flexibility | Use When | Form |
|-------------|----------|------|
| **High** | Multiple valid approaches (e.g., code review) | Prose guidelines listing considerations |
| **Medium** | Preferred pattern but variation is acceptable | Pseudocode / parameterized scripts |
| **Low** | Fragile operation, order-critical (e.g., DB migration) | Exact script, explicit prohibition on modification |

**Analogy**: narrow bridge with cliffs → low flexibility, precise guardrails; open meadow → high flexibility, just point the direction.

### Test Across Model Tiers

| Model Tier | Focus |
|------------|-------|
| Small | Does the skill provide enough guidance? |
| Medium | Are instructions clear and efficient? |
| Large | Is there over-explanation the model ignores? |

> **Claude Platform Note:** Small / Medium / Large correspond to Haiku / Sonnet / Opus respectively.

A small model needs more guidance than a large one. If the skill targets multiple tiers, ensure the small model can execute correctly as the minimum bar.

---

## 2. Metadata Conventions

> **Claude Platform Note:** The fields below (`name`, `description`) refer to the YAML frontmatter in Claude Platform skills. Other platforms may use different metadata formats.

### `name`

- ≤ 64 characters, lowercase letters + digits + hyphens only
- No XML tags or reserved words (`anthropic`, `claude`)
- Prefer **gerund form** (verb + ing)

**Good**: `processing-pdfs`, `analyzing-spreadsheets`, `writing-documentation`
**Acceptable**: `pdf-processing`, `process-pdfs`
**Bad**: `helper`, `utils`, `tools`, `documents`

### `description`

- ≤ 1024 characters, must not be empty
- **Third person** (injected into system prompt; mismatched person hurts discovery)
- Explain both "what it does" and "when to trigger"
- Include concrete domain terms (the agent selects from 100+ skills based on description)

**Good**:
```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Bad**:
```yaml
description: Helps with documents
```

---

## 3. SKILL.md Structure

### Keep the Body < 500 Lines

Beyond that, split into sub-files using Progressive Disclosure:

```
my-skill/
├── SKILL.md              # Main instructions (loaded on trigger)
├── FORMS.md              # Form guide (read on demand)
├── reference.md          # API reference
└── scripts/
    └── validate.py       # Tool script (executed, not loaded)
```

SKILL.md acts as a table of contents pointing to sub-files:

```markdown
## Quick start
[Core usage written directly here]

## Advanced features
**Form filling**: See [FORMS.md](FORMS.md)
**API reference**: See [reference.md](reference.md)
```

### References: One Level Deep Only

The agent may only do a partial read when encountering nested references (A → B → C).

> **Claude Platform Note:** Claude's file-reading behavior may truncate deeply nested references. Always link sub-files directly from SKILL.md.

**Bad**: `SKILL.md → advanced.md → details.md` (actual content buried at level 3)
**Good**: `SKILL.md` links all sub-files directly

### Add a Table of Contents for Long Files

For reference files over 100 lines, place a TOC at the top so the agent can see the full scope even on a partial read.

---

## 4. Common Patterns

### Template Pattern

**Strict** (API response, fixed format):
```markdown
ALWAYS use this exact template structure:
# [Title]
## Executive summary
...
```

**Flexible** (allow adaptation):
```markdown
Here is a sensible default format, but use your best judgment:
# [Title]
## Executive summary
...
Adjust sections as needed.
```

### Examples Pattern

Use Input / Output pairs to demonstrate expected style — more effective than prose descriptions:

````markdown
**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication
Add login endpoint and token validation middleware
```
````

### Conditional Workflow Pattern

Guide the agent through decision points:

```markdown
1. Determine the modification type:
   **Creating new content?** → Follow "Creation workflow"
   **Editing existing content?** → Follow "Editing workflow"
```

When a workflow grows too large, split it into a separate file and let SKILL.md act as a router.

### Feedback Loop Pattern

Validate → fix → repeat significantly improves output quality:

```markdown
1. Make edits
2. Validate: `python scripts/validate.py output/`
3. If fails → fix → re-validate
4. Only proceed when validation passes
```

---

## 5. Directory Organization

- Group by domain: `reference/finance.md`, `reference/sales.md`
- Use descriptive filenames: `form_validation_rules.md`, not `doc2.md`
- Always use forward-slash paths (`reference/guide.md`, not `reference\guide.md`)

---

## 6. Executable Scripts

### Scripts Must Handle Their Own Errors

**Good**:
```python
try:
    with open(path) as f:
        return f.read()
except FileNotFoundError:
    print(f"File {path} not found, creating default")
    with open(path, 'w') as f:
        f.write('')
    return ''
```

**Bad**: bare `open(path).read()` — failure is left for the agent to guess at.

### Annotate Constants

**Good**:
```python
REQUEST_TIMEOUT = 30  # HTTP requests typically complete within 30s
MAX_RETRIES = 3       # Most intermittent failures resolve by 2nd retry
```

**Bad**:
```python
TIMEOUT = 47  # Why 47?
```

### Distinguish "Execute" vs "Read"

```markdown
Run `analyze_form.py` to extract fields      ← execute
See `analyze_form.py` for the algorithm       ← read for reference
```

### List Dependencies Explicitly

Never assume packages are pre-installed. Write out install commands such as `pip install pypdf`.

### Use Fully Qualified Tool Names

> **Claude Platform Note:** In the Claude Platform, MCP tools use the format `ServerName:tool_name` (e.g., `BigQuery:bigquery_schema`). Omitting the server prefix may cause tool-not-found errors.

---

## 7. Development Workflow

### Establish an Evaluation Baseline Before Writing

1. **Find gaps**: Run representative tasks without the skill; record failure points
2. **Build evaluation**: At least 3 test scenarios
3. **Baseline**: Quantify performance without the skill
4. **Write minimal instructions**: Only fill the gaps
5. **Iterate**: Run evaluation → compare to baseline → refine

### Use Two LLM Instances: Designer + Tester

- **LLM instance A** (Designer): Collaborate with it to design the skill
- **LLM instance B** (Tester): Load the skill and execute real tasks
- Observe instance B's behavior → bring findings back to instance A for improvement

### Observe Actual Reading Paths

- Does the agent read files in the expected order?
- Does it skip important references? → Links are not prominent enough
- Does it re-read the same file? → That content should be promoted into SKILL.md
- Does it never read a file? → The file may be unnecessary or insufficiently signaled

---

## 8. Content Guidelines

### Avoid Time-Sensitive Information

**Bad**: `If before August 2025, use old API.`

**Good**: Write "Current method" and put the legacy method in a collapsed `<details>` block.

### Keep Terminology Consistent

Pick one term and use it everywhere. Do not mix `API endpoint` / `URL` / `API route` / `path`.

### Don't Overwhelm with Options

**Bad**: `You can use pypdf, or pdfplumber, or PyMuPDF, or...`
**Good**: Provide one default approach + an alternative for special cases.

