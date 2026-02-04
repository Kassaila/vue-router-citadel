# Release Guide

Step-by-step guide for publishing vue-router-citadel to npm.

---

## One-Time Setup

### 1. Create npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com/) → Sign in
2. Click your avatar → **Access Tokens**
3. **Generate New Token** → **Classic Token**
4. Select **Automation** (for CI/CD)
5. Copy the token (starts with `npm_...`)

### 2. Add Token to GitHub Secrets

1. Go to your repository on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: paste the token from step 1
4. Click **Add secret**

---

## Release Process

### 1. Ensure You're on `release` Branch

```bash
git checkout release
git pull origin release
```

### 2. Run Pre-Release Checks

```bash
npm run release:check
```

This runs: format check → type check → tests → build → pack dry-run

### 3. Update Version

```bash
# Patch release (0.1.0 → 0.1.1)
npm version patch

# Minor release (0.1.0 → 0.2.0)
npm version minor

# Major release (0.1.0 → 1.0.0)
npm version major
```

This automatically:

- Updates `package.json` version
- Creates a git commit
- Creates a git tag (`v0.1.1`)

### 4. Update CHANGELOG.md

Add release notes under the new version:

```markdown
## [0.1.1] - 2024-XX-XX

### Added

- New feature description

### Fixed

- Bug fix description

### Changed

- Change description
```

Commit the changelog:

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v0.1.1"
```

### 5. Merge to Main

```bash
git checkout main
git pull origin main
git merge release
git push origin main
```

### 6. Push the Tag

```bash
git push origin v0.1.1
```

This triggers the **Release** workflow which:

1. Runs all checks (format, types, tests)
2. Builds the package
3. Publishes to npm with provenance

### 7. Verify Release

- Check [GitHub Actions](../../actions) for workflow status
- Check [npm package page](https://www.npmjs.com/package/vue-router-citadel)

### 8. Create GitHub Release (Optional)

1. Go to **Releases** → **Draft a new release**
2. Choose the tag (`v0.1.1`)
3. Title: `v0.1.1`
4. Description: copy from CHANGELOG.md
5. **Publish release**

---

## Beta Releases

For pre-release versions:

```bash
# Create beta version
npm version prerelease --preid=beta
# 0.1.0 → 0.1.1-beta.0

# Or specify exact version
npm version 0.2.0-beta.0
```

Push the tag — the workflow publishes with `--tag beta`:

```bash
git push origin v0.2.0-beta.0
```

Users install beta with:

```bash
npm install vue-router-citadel@beta
```

---

## Manual Release (Without CI)

If you need to publish manually:

```bash
# Run all checks
npm run release:check

# Login to npm (one-time)
npm login

# Publish
npm publish --access public

# For beta
npm publish --access public --tag beta
```

---

## Troubleshooting

### Workflow Failed

1. Check the failed step in GitHub Actions
2. Common issues:
   - **Tests failed**: Fix tests, create new patch release
   - **NPM_TOKEN invalid**: Regenerate token, update secret
   - **Package already exists**: Version already published, bump version

### Rollback a Release

npm doesn't allow deleting versions, but you can deprecate:

```bash
npm deprecate vue-router-citadel@0.1.1 "Critical bug, use 0.1.2"
```

### Unpublish (Within 72 Hours)

Only possible within 72 hours of publishing:

```bash
npm unpublish vue-router-citadel@0.1.1
```

---

## Version Guidelines

| Change Type                        | Version Bump | Example              |
| ---------------------------------- | ------------ | -------------------- |
| Bug fixes, patches                 | `patch`      | 0.1.0 → 0.1.1        |
| New features (backward compatible) | `minor`      | 0.1.0 → 0.2.0        |
| Breaking changes                   | `major`      | 0.1.0 → 1.0.0        |
| Pre-release                        | `prerelease` | 0.1.0 → 0.1.1-beta.0 |

---

## Quick Reference

```bash
# Full release flow
git checkout release
npm run release:check
npm version patch          # or minor/major
# Update CHANGELOG.md
git add CHANGELOG.md && git commit -m "docs: changelog for vX.X.X"
git checkout main && git merge release && git push origin main
git push origin vX.X.X     # Triggers CI release
```
