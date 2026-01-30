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

- [x] `README.md` — full documentation
- [x] Usage examples (`examples/`)
- [x] Exported constants section
- [x] Logging & Debug section with tables
- [x] Route validation note

### Features

- [x] **Extend debug functionality**
  - `log: boolean` — enables console logging (`console.info`)
  - `debug: boolean` — enables logging + `debugger` breakpoints
  - Key breakpoint locations: navigation start, before outpost, patrol stopped, error
- [x] **Default error handler** — `console.error` + `BLOCK`
- [x] **Route validation** — redirect routes are validated against router
- [x] **assignOutpostToRoute** — dynamically assign outposts to existing routes
- [x] **Route outposts optimization**
  - Sorting by priority at `deploy` (not every navigation)
  - Deduplication with warning log
  - Direct execution from registry (no intermediate array)

### Build Optimization

- [x] `tsup` config with treeshake, external, target
- [x] `npm run build` — minified, no sourcemap (production)
- [x] `npm run build:dev` — not minified, with sourcemap (development)

---

## TODO

### Documentation

- [ ] **Improve API section in README.md**
  - Add tables with parameters and types
  - Describe Handler Context (ctx) as separate block
  - Add return values for methods
  - Make it more structured and readable

### Testing

- [ ] Install `vitest`
- [ ] Create `src/__tests__/`
- [ ] Write tests for:
  - `createNavigationCitadel`
  - `deploy` / `abandon` / `getOutposts`
  - `patrolNavigationCitadel`
  - Route outposts deduplication
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
npm run build        # Build for production (minified, no sourcemap)
npm run build:dev    # Build for development (sourcemap, no minify)
npm run format       # Format code
npm pack --dry-run   # Check package contents
npm publish          # Publish to npm
```
