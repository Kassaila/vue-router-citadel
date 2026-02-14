# 📋 Logging & Debug

## ⚙️ Logging Options

| Option         | Type            | Default                       | Description                                       |
| -------------- | --------------- | ----------------------------- | ------------------------------------------------- |
| `log`          | `boolean`       | `__DEV__`                     | Enable non-critical logs. Critical always logged. |
| `logger`       | `CitadelLogger` | `createDefaultLogger()`       | Custom logger implementation                      |
| `debug`        | `boolean`       | `false`                       | Enables logging + `debugger` breakpoints          |
| `debugHandler` | `DebugHandler`  | `createDefaultDebugHandler()` | Custom debug handler for breakpoints              |

> `__DEV__` is `true` when `import.meta.env.DEV` or `NODE_ENV !== 'production'`.

## ⚠️ Critical vs Non-Critical

- **Critical events** — always logged via `logger`, regardless of `log` setting
- **Non-critical events** — only logged when `log: true` (or `debug: true`)

This ensures developers always see errors even with `log: false`.

## 🔇 Disable Non-Critical Logging

```typescript
createNavigationCitadel(router, { log: false });
```

## 🔧 Custom Logger

### Logger Interface

```typescript
interface CitadelLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}
```

### SSR with Pino

```typescript
import pino from 'pino';

const pinoLogger = pino();

createNavigationCitadel(router, {
  logger: {
    info: (...args) => pinoLogger.info({ ctx: 'citadel' }, ...args),
    warn: (...args) => pinoLogger.warn({ ctx: 'citadel' }, ...args),
    error: (...args) => pinoLogger.error({ ctx: 'citadel' }, ...args),
    debug: (...args) => pinoLogger.debug({ ctx: 'citadel' }, ...args),
  },
});
```

### Testing with vi.fn()

```typescript
const mockLogger: CitadelLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const citadel = createNavigationCitadel(router, { logger: mockLogger });

// Assert logging calls
expect(mockLogger.info).toHaveBeenCalledWith('Deploying global outpost: auth');
```

### Custom Format (No Emoji)

```typescript
const plainLogger: CitadelLogger = {
  info: (...args) => console.log('[Citadel]', ...args),
  warn: (...args) => console.warn('[Citadel]', ...args),
  error: (...args) => console.error('[Citadel]', ...args),
  debug: (...args) => console.debug('[Citadel DEBUG]', ...args),
};
```

## 📊 Log Events Reference

| Event                                 | Method         | Critical |
| ------------------------------------- | -------------- | -------- |
| Hook start (only if outposts present) | `logger.info`  | No       |
| Processing outpost                    | `logger.info`  | No       |
| Deploying outpost                     | `logger.info`  | No       |
| Abandoning outpost                    | `logger.info`  | No       |
| Assigned outposts to route            | `logger.info`  | No       |
| DevTools initialized                  | `logger.info`  | No       |
| Destroying citadel                    | `logger.info`  | No       |
| Patrol stopped                        | `logger.warn`  | No       |
| Duplicate outposts                    | `logger.warn`  | **Yes**  |
| Outpost not found                     | `logger.warn`  | **Yes**  |
| Route not found                       | `logger.warn`  | **Yes**  |
| Outpost timeout                       | `logger.warn`  | **Yes**  |
| Outpost error                         | `logger.error` | **Yes**  |
| afterEach patrol error                | `logger.error` | **Yes**  |

> **Critical** events are always logged via `logger`. **Non-critical** only when `log: true`.
>
> Hook start is only logged when there are outposts to process. Hooks with no outposts return
> `ALLOW` silently without any logging.

## 🐛 Debug Reference

Named debug points with console output `[DEBUG] <name>` (all require `debug: true`):

| Name                 | Location                                                  |
| -------------------- | --------------------------------------------------------- |
| `navigation-start`   | Start of patrol (only when outposts present for the hook) |
| `before-outpost`     | Before each outpost handler processing                    |
| `patrol-stopped`     | When outpost returns BLOCK or redirect                    |
| `timeout`            | When outpost handler times out                            |
| `error-caught`       | When outpost throws an error                              |
| `devtools-init`      | DevTools initialized (via install hook or existing app)   |
| `devtools-inspector` | DevTools inspector registered                             |

> `navigation-start` breakpoint only triggers when there are outposts to process for the current
> hook.

## 🔨 Custom Debug Handler

By default, debug points trigger `debugger` statements. However, bundlers like Vite/esbuild may
strip `debugger` from dependencies during optimization. To ensure reliable breakpoints, provide a
custom `debugHandler`:

```typescript
const citadel = createNavigationCitadel(router, {
  debug: true,
  debugHandler: (name) => {
    console.trace(`Debug point: ${name}`);
    debugger; // You control this — add any debug logic here
  },
});
```

**Alternative — use `alert()` for debug:**

```typescript
const citadel = createNavigationCitadel(router, {
  debug: true,
  debugHandler: (name) => {
    alert(name); // Blocks execution, works when debugger is stripped
  },
});
```

**Use cases for custom debugHandler:**

- **Reliable breakpoints** — `debugger` in your code isn't stripped by bundlers
- **Conditional breakpoints** — only break on specific debug points
- **Logging** — `console.trace()` for stack traces without stopping
- **Testing** — mock handler to verify debug points are triggered
