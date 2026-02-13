---
name: release-check
description: Pre-release verification checklist. Runs all checks needed before publishing to npm.
allowed-tools: Bash(npm *)
metadata:
  claude-disable-model-invocation: 'true'
  claude-context: fork
  claude-agent: general-purpose
---

Run pre-release checks for vue-router-citadel:

## Checklist

1. **Format check**: `npm run format:check`
   - All files must be properly formatted

2. **Build**: `npm run build`
   - Must complete without errors
   - Verify dist/ contains all expected files

3. **Tests**: `npm run test:run`
   - All tests must pass

4. **Package contents**: `npm pack --dry-run`
   - Verify only intended files are included
   - Check package size is reasonable

## Report

For each check, report:

- PASS or FAIL
- Any warnings or issues found

If all checks pass, the package is ready for release. If any check fails, list what needs to be
fixed.
