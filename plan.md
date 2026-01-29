# Publishing vue-router-citadel to npm

## Current State

**Done:**

- Source code (TypeScript)
- README.md
- LICENSE (MIT)
- Git repository
- package.json
- tsconfig.json
- Build system (tsup)
- .gitignore
- Prettier + Husky + lint-staged

**Missing:**

- Tests
- CI/CD

---

## Tasks

### 1. Project Structure

- [x] Create `src/` folder and move source files
- [x] Create `.gitignore`

```
src/
├── index.ts
├── types.ts
├── consts.ts
├── navigationCitadel.ts
├── navigationPosts.ts
└── navigationRegistry.ts
```

### 2. package.json

- [x] Create `package.json` with fields:
  - `name`: `vue-router-citadel`
  - `version`: `0.1.0`
  - `type`: `module`
  - `main`: `dist/index.cjs`
  - `module`: `dist/index.js`
  - `types`: `dist/index.d.ts`
  - `exports`: ESM/CJS/types
  - `files`: `["dist"]`
  - `peerDependencies`: `vue-router ^4.0.0`
  - `devDependencies`: typescript, tsup, vue-router, prettier, husky, lint-staged
  - `scripts`: build, format, prepublishOnly

### 3. TypeScript Configuration

- [x] Create `tsconfig.json`
  - `target`: `ES2020`
  - `module`: `ESNext`
  - `declaration`: `true`
  - `strict`: `true`

### 4. Build System

- [x] Install `tsup` (simple bundler for libraries)
- [x] Create `tsup.config.ts`
  - Formats: ESM, CJS
  - Generate .d.ts
  - Treeshaking

### 5. Code Formatting

- [x] Install `prettier`, `husky`, `lint-staged`
- [x] Create `.prettierrc`
- [x] Create `.husky/pre-commit`

### 6. Tests (optional)

- [ ] Install `vitest`
- [ ] Create `src/__tests__/`
- [ ] Write basic tests

### 7. CI/CD (optional)

- [ ] `.github/workflows/ci.yml` - run tests on PR
- [ ] `.github/workflows/release.yml` - publish to npm

---

## Execution Order

1. ~~Create structure (`src/`, `.gitignore`)~~
2. ~~Create `package.json`~~
3. ~~Create `tsconfig.json`~~
4. ~~Configure `tsup`~~
5. ~~Configure prettier + husky~~
6. Verify build (`npm run build`)
7. Verify package (`npm pack --dry-run`)
8. Publish (`npm publish`)

---

## Commands

```bash
# Install dependencies
npm install

# Build
npm run build

# Format code
npm run format

# Check what will be included in package
npm pack --dry-run

# Publish
npm publish
```
