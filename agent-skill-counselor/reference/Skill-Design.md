# Skill Design: The Script vs. LLM Split

> Every workflow can be turned into a Skill. The key is knowing which parts should be deterministic scripts and which parts need LLM judgment. A practical methodology from requirement analysis to Skill design.

Source: https://claude-world.com/articles/skill-design-script-vs-llm

---

## The Problem with Chat-Based Workflows

Most people use Claude Code like this:

```
You: "Generate a newsletter for me"
// Claude figures it out from scratch
// Quality varies every time
// Steps might be missed

You: "Do it again"
// Starts from scratch again...
```

Three fundamental problems:

- **Unstable** — Same instruction, different quality each run
- **Token waste** — Re-understands the entire flow every time
- **Not cumulative** — A great run is forgotten by the next session

## The Mindset Shift

You're not "chatting with AI."

**You're designing an assembly line.**

On this line, some stations are robotic arms (deterministic scripts), and some are human workers (LLM judgment). The Skill is what makes this assembly line permanent.

## The Core Split: Script vs. LLM

Every workflow decomposes into two types of steps:

| | Script (Deterministic) | LLM (Dynamic) |
|---|---|---|
| Nature | Same every time | Requires contextual judgment |
| Examples | API calls, file ops, build commands | Content analysis, creative decisions, translation |
| In a Skill | Write the actual script, LLM just executes | Describe the judgment framework |
| Stability | 100% predictable | Controlled by prompt quality |

**The key insight:**

> If it can be written as a script, don't waste LLM brainpower on it.
> The LLM's value is in **connecting results** and **making judgment calls**.

The rhythm: **script gets results → LLM analyzes and decides → next script runs → LLM judges again.**

A Skill crystallizes this rhythm.

## The Three-Step Method

### Step 1: List All Steps

Break the requirement into 5-10 concrete steps. Don't worry about classification yet.

### Step 2: Mark Each Step

Ask yourself: **"Can this step be written as a script?"**

- **Yes** → Write the script. LLM just runs it and gets the result.
- **No** → This is where LLM earns its keep. Give it a judgment framework.

### Step 3: Assemble the Skill

- Script steps → actual code (Python, Bash, API calls)
- LLM steps → judgment framework (criteria, constraints, examples)

## Real Example: Version Update Tracker

**Requirement:** "Automatically track Claude Code releases, write an article when a new version drops, publish in three languages."

### Step 1 — List the steps:

1. Check latest version number
2. Compare with known version
3. Fetch changelog
4. Analyze which changes matter to users
5. Decide article angle and title
6. Write article in specified format
7. Translate to three languages
8. Save to corresponding directories

### Step 2 — Mark each step:

| Step | Type | Why |
|---|---|---|
| 1. Check latest version | **Script** | `gh api` — one line |
| 2. Compare versions | **Script** | Python string comparison |
| 3. Fetch changelog | **Script** | WebFetch with fixed URL pattern |
| 4. Analyze important changes | **LLM** | Needs semantic understanding |
| 5. Decide angle and title | **LLM** | Needs creativity |
| 6. Write with template | **Mixed** | Template is fixed, content is dynamic |
| 7. Three-language translation | **LLM** | Needs language ability |
| 8. Save files | **Script** | Fixed path rules |

### Step 3 — Write the Skill:

**Script steps — give LLM a script to execute:**

```bash
## Step 1: Check latest version
## Execute this Bash, store result as $LATEST_VERSION
gh api repos/anthropics/claude-code/releases/latest \
  --jq '.tag_name'

## Step 2: Compare versions
## Execute this Python script
known = open('last-known-version.txt').read().strip()
if known == latest:
    print("NO_UPDATE")
    sys.exit(0)
```

**LLM steps — give a judgment framework:**

```markdown
## Step 4: Analyze Changes
## Previous script already fetched the changelog
## Now LLM needs to understand semantics — scripts can't do this
Classify by priority:
  High: Changes affecting daily usage
  Medium: New CLI commands or parameters
  Low: Bug fixes (unless critical)
List the 3-5 most noteworthy points.

## Step 5: Decide Title
## Needs creativity — scripts can't generate good titles
Format: Claude Code vX.Y.Z: {one-line highlight}
Angle: Tell readers "what this means for you"
```

## Stabilizing Dynamic Steps

LLM steps aren't a free-for-all. Three techniques to make them more reliable:

### 1. Quality Gates

```
>= 80 → Pass
60-79 → Auto-revise and re-score
< 60  → Stop, escalate to human
```

### 2. Give Examples (Few-shot)

```
Good: "v2.1.37: Agent Teams Now Supports Split-Pane Mode"
Bad:  "Claude Code Updated"
Bad:  "Contains multiple important improvements and fixes"
```

### 3. Break It Smaller

If a dynamic step is too large and results are unstable — keep splitting.

```
Too big:  "Analyze changelog and write article"

Split into:
  1. List all change items           (simple listing)
  2. Score each item 1-5             (structured scoring)
  3. Write about top 3               (narrowed scope)
```

**Principle: Smaller dynamic steps + clearer constraints = more stable results.**

## More Examples

### News → Article → Social Post

| Step | Type | Tool |
|---|---|---|
| Fetch news sources | Script | WebFetch / RSS |
| Filter what's worth writing | LLM | Relevance judgment |
| Analyze key points | LLM | Understanding + creativity |
| Write with template | Mixed | Template + LLM fills content |
| Save to articles/ | Script | Fixed paths |
| Post to Threads API | Script | threads-post.js |

### Daily Schedule → Prepare Materials

| Step | Type | Tool |
|---|---|---|
| Query calendar API | Script | Google Calendar API |
| Understand each meeting topic | LLM | Semantic understanding |
| Search related files | Script | Glob / Grep |
| Judge which materials are relevant | LLM | Relevance judgment |
| Organize summary with priorities | LLM | Synthesis + ranking |

### Email Processing

| Step | Type | Tool |
|---|---|---|
| Fetch unread emails | Script | IMAP / Gmail API |
| Classify: important / normal / spam | LLM | Content understanding |
| Summarize important emails | LLM | Summarization |
| Draft replies | LLM | Writing |
| Send replies | Script | Resend / SMTP |

The pattern is always the same: **script collects → LLM understands → script acts.**

## Skill File Format

```yaml
# .claude/skills/my-skill/SKILL.md
---
name: ecosystem-update
description: >
  Track version updates and auto-write articles.
  Triggers: "check update", "new version"
version: 0.1.0
allowed-tools:
  - Read
  - Write
  - Bash
  - WebFetch
  - Task
user-invocable: true     # trigger via /ecosystem-update
context: fork            # independent context window
agent: content-writer    # delegate to specific agent
model: sonnet            # specify model
---

# Your workflow script below (Markdown)
# Fixed steps + dynamic steps interleaved
```

Key fields:
- **`context: fork`** — Runs in isolated context, doesn't consume the main conversation
- **`agent`** — Delegates execution to a specialized agent definition
- **`allowed-tools`** — Whitelist of tools this Skill can use

## The Mental Model

```
Requirement
    ↓
List all steps
    ↓
For each step: "Can it be a script?"
    ↓
   Yes → Write the script (LLM just executes, gets result)
   No  → Give LLM a judgment framework (criteria + constraints + examples)
    ↓
Assemble into Skill
    ↓
Test → LLM steps unstable? → Split smaller / add constraints
    ↓
Stable automated workflow ✓
```

## Key Takeaways

1. **Every workflow can be Skill-ified**
2. **If it can be scripted, don't let LLM think about it**
3. **LLM's value is in connecting results and making judgment calls**
4. **Unstable LLM steps? Split smaller, add examples, set quality gates**
5. **Start with one Skill. When it works, expand.**

---
*Copied from ClaudeWorld.dev - Claude Code Mastery Resource*