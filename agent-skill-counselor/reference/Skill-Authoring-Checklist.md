# Skill Authoring Checklist

> Standalone checklist for reviewing SKILL.md quality before publishing.

---

## Core Quality

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

## Scripts & Code

- [ ] Scripts handle their own errors — never leave the agent guessing
- [ ] No magic numbers (all constants are annotated)
- [ ] Dependencies are listed and confirmed available
- [ ] All file paths use forward slashes
- [ ] Critical operations include validation / feedback loops
- [ ] Clear distinction between "run this script" vs "read this for reference"

## Testing

- [ ] At least 3 evaluation scenarios defined
- [ ] Tested on all model tiers intended for use
- [ ] Tested with realistic use cases (not hypothetical scenarios)
- [ ] Team feedback collected (if applicable)
