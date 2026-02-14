# 📦 Exports

All public exports from `vue-router-citadel`.

## 📋 Common Imports

```typescript
import {
  createNavigationCitadel,
  NavigationOutpostScopes,
  NavigationHooks,
  NavigationOutpostVerdicts,
  type NavigationOutpost,
  type NavigationOutpostHandler,
} from 'vue-router-citadel';
```

## 🔢 Constants

```typescript
import {
  NavigationOutpostScopes,
  NavigationHooks,
  NavigationOutpostVerdicts,
  DebugPoints,
} from 'vue-router-citadel';
```

| Constant                    | Values                                        | Description                                   |
| --------------------------- | --------------------------------------------- | --------------------------------------------- |
| `NavigationOutpostScopes`   | `GLOBAL`, `ROUTE`                             | Outpost scope determining when it's processed |
| `NavigationHooks`           | `BEFORE_EACH`, `BEFORE_RESOLVE`, `AFTER_EACH` | Vue Router navigation hooks                   |
| `NavigationOutpostVerdicts` | `ALLOW`, `BLOCK`                              | Handler return verdicts                       |
| `DebugPoints`               | `NAVIGATION_START`, `BEFORE_OUTPOST`, etc.    | Named debug breakpoint identifiers            |

## 🏷️ Types

```typescript
import type {
  NavigationOutpostContext,
  NavigationOutpostHandler,
  NavigationOutpost,
  NavigationCitadelOptions,
  NavigationCitadelAPI,
  NavigationHook,
  NavigationOutpostScope,
  CitadelLogger,
  // Debug types
  DebugHandler,
  DebugPoint,
  // Type-safe outpost names
  GlobalOutpostRegistry,
  RouteOutpostRegistry,
  GlobalOutpostName,
  RouteOutpostName,
  OutpostName,
} from 'vue-router-citadel';
```

See [Types](/api/types) for detailed type definitions.

## 🔧 Utility Functions

```typescript
import {
  createDefaultLogger, // Factory for default console logger
  createDefaultDebugHandler, // Factory for default debug handler
} from 'vue-router-citadel';
```

| Function                      | Returns         | Description                              |
| ----------------------------- | --------------- | ---------------------------------------- |
| `createDefaultLogger()`       | `CitadelLogger` | Console logger with emoji prefixes       |
| `createDefaultDebugHandler()` | `DebugHandler`  | Default handler that triggers `debugger` |
