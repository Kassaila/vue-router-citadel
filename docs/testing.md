# 🧪 Testing Guide

This document describes the testing setup for vue-router-citadel and lists all test cases.

---

<!-- TOC -->

- [🧪 Testing Guide](#-testing-guide)
  - [📊 Overview](#-overview)
  - [🚀 Quick Start](#-quick-start)
  - [📁 Test Structure](#-test-structure)
  - [🔧 Test Helpers](#-test-helpers)
    - [Example Usage](#example-usage)
  - [📝 Test Cases](#-test-cases)
    - [navigationRegistry.test.ts 12 tests](#navigationregistrytestts-12-tests)
      - [createRegistry](#createregistry)
      - [register](#register)
      - [unregister](#unregister)
      - [getRegisteredNames](#getregisterednames)
    - [navigationOutposts.test.ts 19 tests](#navigationoutpoststestts-19-tests)
      - [normalizeOutcome](#normalizeoutcome)
      - [toNavigationGuardReturn](#tonavigationguardreturn)
      - [patrol](#patrol)
    - [navigationCitadel.test.ts 19 tests](#navigationcitadeltestts-18-tests)
      - [createNavigationCitadel](#createnavigationcitadel)
      - [deployOutpost](#deployoutpost)
      - [abandonOutpost](#abandonoutpost)
      - [getOutpostNames](#getoutpostnames)
      - [assignOutpostToRoute](#assignoutposttoroute)
      - [destroy](#destroy)
    - [timeout.test.ts 5 tests](#timeouttestts-5-tests)
    - [integration.test.ts 13 tests](#integrationtestts-13-tests)
      - [navigation flow](#navigation-flow)
      - [error handling](#error-handling)
      - [hooks](#hooks)
      - [route outposts](#route-outposts)
      - [context](#context)
  - [✍️ Writing New Tests](#-writing-new-tests)
    - [Choose the Right File](#choose-the-right-file)
    - [Use Existing Helpers](#use-existing-helpers)
    - [Test Patterns](#test-patterns)
  - [📈 Coverage](#-coverage)

<!-- /TOC -->

---

## 📊 Overview

| Metric         | Value     |
| -------------- | --------- |
| Test Framework | Vitest    |
| Environment    | happy-dom |
| Total Tests    | 68        |
| Test Files     | 5         |

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
├── navigationCitadel.test.ts       # Public API (19 tests)
├── timeout.test.ts                 # Timeout handling (5 tests)
└── integration.test.ts             # Full navigation flows (13 tests)
```

## 🔧 Test Helpers

Located in `__tests__/helpers/setup.ts`:

| Helper                              | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `createMockRouter(routes?)`         | Creates vue-router with memory history       |
| `createMockLogger()`                | Logger that captures calls for assertions    |
| `createAllowHandler()`              | Returns `'allow'` verdict                    |
| `createBlockHandler()`              | Returns `'block'` verdict                    |
| `createRedirectHandler(to)`         | Returns redirect location                    |
| `createDelayedHandler(ms, outcome)` | Async handler with delay (for timeout tests) |
| `createErrorHandler(message)`       | Throws error with message                    |

### Example Usage

```typescript
import { createMockRouter, createMockLogger, createAllowHandler } from './helpers/setup';

const router = createMockRouter();
const logger = createMockLogger();

// After test, check logger calls
expect(logger.calls.some((c) => c.level === 'warn')).toBe(true);
```

---

## 📝 Test Cases

### navigationRegistry.test.ts (12 tests)

Registry management functions.

#### createRegistry

| Test                             | Description                    |
| -------------------------------- | ------------------------------ |
| returns empty registry structure | Creates Maps and sorted arrays |

#### register

| Test                                               | Description                    |
| -------------------------------------------------- | ------------------------------ |
| adds outpost to global registry                    | Registers global scope outpost |
| adds outpost to route registry                     | Registers route scope outpost  |
| warns on duplicate and replaces existing           | Logs warning, overwrites       |
| updates sorted array by priority                   | Maintains priority order       |
| uses defaultPriority for outposts without priority | Falls back to default          |

#### unregister

| Test                               | Description           |
| ---------------------------------- | --------------------- |
| removes outpost and returns true   | Successful removal    |
| returns false if outpost not found | Non-existent outpost  |
| updates sorted array after removal | Re-sorts after delete |

#### getRegisteredNames

| Test                                 | Description         |
| ------------------------------------ | ------------------- |
| returns global outpost names         | Lists global names  |
| returns route outpost names          | Lists route names   |
| returns empty array when no outposts | Empty registry case |

---

### navigationOutposts.test.ts (19 tests)

Outcome normalization and patrol logic.

#### normalizeOutcome

| Test                                        | Description                 |
| ------------------------------------------- | --------------------------- |
| returns ALLOW as-is                         | Valid verdict passthrough   |
| returns BLOCK as-is                         | Valid verdict passthrough   |
| validates RouteLocationRaw string path      | `/login` format             |
| validates RouteLocationRaw object with name | `{ name: 'login' }` format  |
| validates RouteLocationRaw object with path | `{ path: '/login' }` format |
| throws on invalid route                     | Route not found in router   |
| throws Error outcome                        | Re-throws Error instances   |
| throws on invalid outcome type              | Rejects invalid types       |

#### toNavigationGuardReturn

| Test                           | Description          |
| ------------------------------ | -------------------- |
| converts ALLOW to true         | Vue Router format    |
| converts BLOCK to false        | Vue Router format    |
| returns RouteLocationRaw as-is | Redirect passthrough |

#### patrol

| Test                                                | Description                 |
| --------------------------------------------------- | --------------------------- |
| returns ALLOW when no outposts                      | Empty registry case         |
| processes global outposts in priority order         | Lower priority first        |
| stops on BLOCK                                      | Short-circuit on block      |
| stops on redirect                                   | Short-circuit on redirect   |
| filters outposts by hook                            | beforeEach vs beforeResolve |
| processes route outposts after global               | Execution order             |
| warns on duplicate route outposts                   | Nested route deduplication  |
| silently skips route outposts not found in registry | Missing outpost handling    |

---

### navigationCitadel.test.ts (18 tests)

Public API testing.

#### createNavigationCitadel

| Test                                  | Description                          |
| ------------------------------------- | ------------------------------------ |
| returns API object with all methods   | API shape validation                 |
| registers router hooks                | beforeEach, beforeResolve, afterEach |
| deploys initial outposts from options | Constructor outposts                 |
| uses custom logger                    | Logger injection                     |

#### deployOutpost

| Test                                        | Description              |
| ------------------------------------------- | ------------------------ |
| deploys single outpost                      | Single object            |
| deploys outpost with default scope (global) | Scope defaults to global |
| deploys multiple outposts (array)           | Array of outposts        |

#### abandonOutpost

| Test                                                      | Description          |
| --------------------------------------------------------- | -------------------- |
| removes single outpost and returns true                   | Successful removal   |
| returns false if outpost not found                        | Non-existent outpost |
| removes multiple outposts and returns true if all deleted | Array removal        |
| returns false if any outpost not found                    | Partial failure      |

#### getOutpostNames

| Test                                 | Description  |
| ------------------------------------ | ------------ |
| returns global outpost names         | Global scope |
| returns route outpost names          | Route scope  |
| returns empty array when no outposts | Empty case   |

#### assignOutpostToRoute

| Test                               | Description         |
| ---------------------------------- | ------------------- |
| assigns outpost to existing route  | Modifies route meta |
| assigns multiple outposts to route | Array assignment    |
| does not duplicate outposts        | Idempotent          |
| returns false if route not found   | Non-existent route  |

#### destroy

| Test                              | Description |
| --------------------------------- | ----------- |
| removes hooks and clears registry | Cleanup     |

---

### timeout.test.ts (5 tests)

Timeout functionality.

| Test                                           | Description               |
| ---------------------------------------------- | ------------------------- |
| outpost times out and returns BLOCK by default | Default timeout behavior  |
| onTimeout handler is called on timeout         | Custom handler invocation |
| per-outpost timeout overrides defaultTimeout   | Priority of timeouts      |
| no timeout if not configured                   | Disabled timeout          |
| fast outpost completes before timeout          | No false positives        |

---

### integration.test.ts (13 tests)

Full navigation flows with real router.

#### navigation flow

| Test                                             | Description         |
| ------------------------------------------------ | ------------------- |
| allows navigation when all outposts return ALLOW | Happy path          |
| blocks navigation when outpost returns BLOCK     | Block scenario      |
| redirects when outpost returns RouteLocationRaw  | Redirect scenario   |
| processes outposts in priority order             | End-to-end priority |

#### error handling

| Test                                  | Description            |
| ------------------------------------- | ---------------------- |
| calls onError handler on error        | Custom error handler   |
| blocks navigation by default on error | Default error behavior |
| onError can redirect on error         | Error -> redirect      |

#### hooks

| Test                                 | Description        |
| ------------------------------------ | ------------------ |
| runs outpost on specified hooks only | Hook filtering     |
| runs outpost on multiple hooks       | Multi-hook outpost |
| afterEach runs for side effects only | Post-navigation    |

#### route outposts

| Test                                         | Description            |
| -------------------------------------------- | ---------------------- |
| processes route outposts from meta           | Route meta integration |
| skips route outposts for routes without meta | No meta case           |

#### context

| Test                                | Description   |
| ----------------------------------- | ------------- |
| provides correct context to handler | Context shape |

---

## ✍️ Writing New Tests

### 1. Choose the Right File

| If testing...         | Add to...                    |
| --------------------- | ---------------------------- |
| Registry functions    | `navigationRegistry.test.ts` |
| Outcome/patrol logic  | `navigationOutposts.test.ts` |
| Public API            | `navigationCitadel.test.ts`  |
| Timeout behavior      | `timeout.test.ts`            |
| Full navigation flows | `integration.test.ts`        |

### 2. Use Existing Helpers

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

### 3. Test Patterns

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

---

## 📈 Coverage

Run coverage report:

```bash
npm run test:coverage
```

Coverage includes all files in `src/` except `index.ts` (re-exports only).
