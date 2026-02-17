---
name: feature
description:
  Start feature development workflow. Creates temp/<feature-name>/feature.md with proposal. Use
  kebab-case for feature names.
metadata:
  claude-disable-model-invocation: 'true'
---

Start feature development workflow for vue-router-citadel.

## Current State

- Branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`
- Uncommitted changes: !`git status --short`
- Existing features: !`ls -1 temp/ 2>/dev/null || echo "(none)"`

## Workflow

1. **Parse feature name**: Convert `$ARGUMENTS` to kebab-case (e.g., "Lazy Outposts" →
   "lazy-outposts")
2. **Check existing**: Read `temp/<feature-name>/feature.md` if directory exists
3. **Create directory**: `temp/<feature-name>/` if it doesn't exist
4. **Create/Update proposal** at `temp/<feature-name>/feature.md`:

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

5. **Ask clarifying questions** about requirements if needed

## Important

- `temp/` directory is in `.gitignore` — working documents, not committed
- Each feature has its own directory for all related files (notes, research, etc.)
- Follow the checklist during implementation
- Update all docs after implementation is complete
- Directories are kept after feature completion (manual cleanup when needed)

Feature request: $ARGUMENTS
