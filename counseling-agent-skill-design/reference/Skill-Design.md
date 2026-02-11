# Skill Design: The Script vs. LLM Split

> 核心參考文件：協助判斷每個步驟應由 Script 還是 LLM 處理。

---

## The Core Split: Script vs. LLM

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

---

## Key Takeaways

1. **Every workflow can be Skill-ified**
2. **If it can be scripted, don't let LLM think about it**
3. **LLM's value is in connecting results and making judgment calls**
4. **Unstable LLM steps? Split smaller, add examples, set quality gates**
5. **Start with one Skill. When it works, expand.**
