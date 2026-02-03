---
name: coverage
description:
  Run tests with coverage report to identify untested code paths. Use when user asks about test
  coverage or after adding new code that needs test verification.
allowed-tools: Bash(npm run test*), Read
---

Run test coverage for vue-router-citadel:

1. Execute `npm run test:coverage`
2. Analyze coverage report
3. Report:
   - Overall coverage percentage
   - Files with low coverage (< 80%)
   - Uncovered lines/branches that should be tested
4. Suggest which tests to add for better coverage

Focus on:

- `src/navigationCitadel.ts`
- `src/navigationOutposts.ts`
- `src/navigationRegistry.ts`
