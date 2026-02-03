---
name: feature
description:
  Start feature development following the project workflow from CLAUDE.md. Creates or updates
  docs/current-feature.md with proposal.
disable-model-invocation: true
---

Start feature development workflow for vue-router-citadel.

## Current State

- Branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`
- Uncommitted changes: !`git status --short`

## Workflow

1. **Check existing feature file**: Read `/docs/current-feature.md` if it exists
2. **Create/Update proposal** with these sections:

```markdown
# Feature: [Name]

## Problem

[What problem does this solve?]

## Solution

[How will we solve it?]

## Files to Modify

- [ ] `src/file.ts` - description
- [ ] `__tests__/file.test.ts` - description

## Checklist

- [ ] Implementation
- [ ] Tests
- [ ] Update README.md
- [ ] Update CHANGELOG.md
- [ ] Update docs/ if needed
```

3. **Ask clarifying questions** about requirements if needed

## Important

- This file is in `.gitignore` - it's a working document
- Follow the checklist during implementation
- Update all docs after implementation is complete

Feature request: $ARGUMENTS
