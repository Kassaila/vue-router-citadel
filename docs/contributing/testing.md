# 🧪 Testing Guide

## 📋 Overview

| Metric         | Value     |
| -------------- | --------- |
| Test Framework | Vitest    |
| Environment    | happy-dom |
| Total Tests    | 134       |
| Test Files     | 9         |
| Coverage       | 91%       |

## 🚀 Quick Start

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

## 📁 Test Structure

```
__tests__/
├── helpers/
│   └── setup.ts                    # Mock factories and utilities
├── navigationRegistry.test.ts      # Registry CRUD (12 tests)
├── navigationOutposts.test.ts      # Patrol logic (19 tests)
├── navigationCitadel.test.ts       # Public API (23 tests)
├── timeout.test.ts                 # Timeout handling (5 tests)
├── lazy.test.ts                    # Lazy loading (12 tests)
├── integration.test.ts             # Full navigation flows (13 tests)
├── devtools-settings.test.ts       # DevTools settings (19 tests)
├── devtools-inspector.test.ts      # DevTools inspector (19 tests)
└── debugHandler.test.ts            # Debug handler (12 tests)
```

## 🔧 Test Helpers

Located in `__tests__/helpers/setup.ts`:

| Helper                              | Description                                   |
| ----------------------------------- | --------------------------------------------- |
| `createMockRouter(routes?)`         | Creates vue-router with memory history        |
| `createMockLogger()`                | Logger that captures calls for assertions     |
| `createAllowHandler()`              | Returns `'allow'` verdict                     |
| `createBlockHandler()`              | Returns `'block'` verdict                     |
| `createRedirectHandler(to)`         | Returns redirect location                     |
| `createDelayedHandler(ms, outcome)` | Async handler with delay (for timeout tests)  |
| `createErrorHandler(message)`       | Throws error with message                     |
| `createRegisteredOutpost(options)`  | Creates RegisteredNavigationOutpost for tests |

### Example Usage

```typescript
import { createMockRouter, createMockLogger, createAllowHandler } from './helpers/setup';

const router = createMockRouter();
const logger = createMockLogger();

// After test, check logger calls
expect(logger.calls.some((c) => c.level === 'warn')).toBe(true);
```

## ✍️ Writing New Tests

### Choose the Right File

| If testing...         | Add to...                    |
| --------------------- | ---------------------------- |
| Registry functions    | `navigationRegistry.test.ts` |
| Outcome/patrol logic  | `navigationOutposts.test.ts` |
| Public API            | `navigationCitadel.test.ts`  |
| Timeout behavior      | `timeout.test.ts`            |
| Lazy loading          | `lazy.test.ts`               |
| Full navigation flows | `integration.test.ts`        |
| DevTools settings     | `devtools-settings.test.ts`  |
| DevTools inspector    | `devtools-inspector.test.ts` |
| Debug handler/logger  | `debugHandler.test.ts`       |

### Use Existing Helpers

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRouter, createMockLogger } from './helpers/setup';

describe('myFeature', () => {
  let router: ReturnType<typeof createMockRouter>;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    router = createMockRouter();
    logger = createMockLogger();
    await router.push('/');
    await router.isReady();
  });

  it('does something', () => {
    // test code
  });
});
```

### Test Patterns

**Testing navigation blocks:**

```typescript
await router.push('/dashboard').catch(() => {});
expect(router.currentRoute.value.name).toBe('home'); // stayed on home
```

**Testing redirects (avoid infinite loops):**

```typescript
handler: ({ to }) => {
  if (to.name !== 'login') return { name: 'login' };
  return 'allow';
};
```

**Testing logger calls:**

```typescript
expect(logger.calls.some((c) => c.level === 'warn' && c.args[0].includes('timed out'))).toBe(true);
```

## 📊 Coverage

Run coverage report:

```bash
npm run test:coverage
```

Coverage includes all files in `src/` except `index.ts` (re-exports only).
