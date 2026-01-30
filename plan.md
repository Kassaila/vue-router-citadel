# vue-router-citadel — Development Plan

---

## Done

### Infrastructure

- [x] Project structure (`src/`, `examples/`)
- [x] `.gitignore`
- [x] `package.json` (name, version, exports, peerDependencies)
- [x] `tsconfig.json` (ES2020, ESNext, strict)
- [x] Build system — `tsup` (ESM, CJS, .d.ts)
- [x] Code formatting — Prettier + Husky + lint-staged
- [x] LICENSE (MIT)

### Source Code

- [x] `src/index.ts` — entry point, exports
- [x] `src/types.ts` — TypeScript types and interfaces
- [x] `src/consts.ts` — constants
- [x] `src/navigationCitadel.ts` — main factory
- [x] `src/navigationRegistry.ts` — outposts registry
- [x] `src/navigationOutposts.ts` — collection and patrol logic

### Documentation

- [x] `README.md` — basic documentation
- [x] Usage examples (`examples/`)

---

## TODO

### Documentation

- [ ] **Improve API section in README.md**
  - Add tables with parameters and types
  - Describe Handler Context (ctx) as separate block
  - Add return values for methods
  - Make it more structured and readable

### Features

- [x] **Extend debug functionality**
  - Replace single `debug` option with two separate options:
  - `log: boolean` — enables console logging only (console.warn/error)
  - `debug: boolean` — enables logging + `debugger` breakpoints at key points
  - Key breakpoint locations: before patrol, after outpost execution, on error

### Testing

- [ ] Install `vitest`
- [ ] Create `src/__tests__/`
- [ ] Write tests for:
  - `createNavigationCitadel`
  - `deploy` / `abandon` / `getOutposts`
  - `collectNavigationOutposts`
  - `patrolNavigationCitadel`
  - Error handling (`onError`)

### CI/CD

- [ ] `.github/workflows/ci.yml` — run tests on PR
- [ ] `.github/workflows/release.yml` — publish to npm

### Publishing

- [ ] Verify build (`npm run build`)
- [ ] Verify package (`npm pack --dry-run`)
- [ ] Publish (`npm publish`)

---

## Project Structure

```
src/
├── index.ts
├── types.ts
├── consts.ts
├── navigationCitadel.ts
├── navigationOutposts.ts
└── navigationRegistry.ts

examples/
├── auth.ts
├── global-different-hooks.ts
├── nested-routes.ts
└── route-multiple-hooks.ts
```

---

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build package
npm run format       # Format code
npm pack --dry-run   # Check package contents
npm publish          # Publish to npm
```
