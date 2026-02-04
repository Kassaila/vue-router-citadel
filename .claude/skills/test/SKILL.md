---
name: test
description:
  Run vitest tests to verify code works correctly. Use automatically after code changes, bug fixes,
  or when user asks to verify something works.
allowed-tools: Bash(npm run test*), Bash(npx vitest *)
---

Run the test suite for vue-router-citadel:

1. Execute `npm run test:run`
2. Analyze the output
3. Report:
   - Total tests passed/failed
   - If failures: show which tests failed with error messages
   - Suggest fixes if obvious

If user provides arguments like a specific file, run: `npx vitest run $ARGUMENTS`
