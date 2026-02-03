---
name: build
description:
  Build the project with tsup. Use automatically after significant code changes to verify TypeScript
  compilation succeeds.
allowed-tools: Bash(npm run build*), Bash(ls *)
---

Build vue-router-citadel:

1. Run `npm run build`
2. Verify output:
   - Check `dist/` directory exists
   - Verify files: `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`
3. Report any TypeScript errors or warnings

For development build with sourcemaps, use: `npm run build:dev`
