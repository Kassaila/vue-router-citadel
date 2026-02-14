# 🤝 Contributing

Thanks for your interest in contributing to vue-router-citadel!

## 📋 Requirements

- Node.js >= 22.0.0
- npm >= 9.0.0

## ⚙️ Setup

```bash
# Clone the repository
git clone https://github.com/Kassaila/vue-router-citadel.git
cd vue-router-citadel

# Install dependencies
npm install
```

## 🛠️ Development Commands

```bash
npm run build        # Production build (ESM + CJS + types)
npm run build:dev    # Development build with sourcemaps
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 📁 Project Structure

```
src/                     # Source code
├── index.ts             # Public API exports
├── types.ts             # TypeScript types and interfaces
├── consts.ts            # Constants (__DEV__, LOG_PREFIX)
├── helpers.ts           # Utilities (debugPoint, logger)
├── navigationCitadel.ts # Main factory function
├── navigationOutposts.ts # Patrol logic, timeout handling
└── navigationRegistry.ts # Registry CRUD operations

__tests__/               # Tests (vitest + happy-dom)
├── helpers/setup.ts     # Mock router, logger, handlers
└── *.test.ts            # Test files

docs/                    # Documentation
examples/                # Usage examples
```

## 🔄 Workflow

### Branch Naming

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `refactor/` — code refactoring

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
refactor: improve code structure
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Ensure all tests pass (`npm run test:run`)
5. Ensure code is formatted (`npm run format`)
6. Submit PR to `develop` branch

## ✨ Code Style

- TypeScript strict mode
- Prettier for formatting (runs automatically on commit via husky)
- No external runtime dependencies (peer dependency: vue-router only)

## 🏗️ Architecture Guidelines

- **Registry**: Use Maps for O(1) lookup, sorted arrays for iteration
- **Sorting**: Done at deploy/abandon time, not during navigation
- **Logging**: Critical events always logged, non-critical controlled by `log` option
- **Errors**: Always provide meaningful error messages with context

## 🔗 Local Testing with npm link

To test the package in a real Vue project:

**In this repository:**

```bash
npm run build
npm link
```

**In your test project:**

```bash
npm link vue-router-citadel
```

After changes, rebuild — the symlink picks up changes automatically.

## ❓ Questions?

Open an issue for questions or suggestions.
