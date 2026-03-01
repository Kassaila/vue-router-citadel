---
description: Vue DevTools integration in Vue Router Citadel — custom inspector for viewing outposts, route assignments, current route execution order, and runtime settings.
---

# 🛠️ Vue DevTools

Custom inspector for viewing deployed outposts. Enabled automatically in development.

## ⚡ Enabling DevTools

```typescript
const citadel = createNavigationCitadel(router);
app.use(citadel); // DevTools enabled automatically (default: __DEV__)
```

**Disable DevTools:**

```typescript
const citadel = createNavigationCitadel(router, { devtools: false });
```

::: info When `devtools: false`, devtools code is tree-shaken from the bundle via dynamic import.
:::

| Option     | Type      | Default   | Description                          |
| ---------- | --------- | --------- | ------------------------------------ |
| `devtools` | `boolean` | `__DEV__` | Enable Vue DevTools custom inspector |

## 🔍 Inspector Features

The custom inspector has three sections:

### Outposts

Tree view of all deployed outposts grouped by scope (Global / Route).

- **Tags** — Each outpost shows priority badge, hooks count, and `lazy` badge if applicable
- **State panel** — Detailed view with name, scope, priority, hooks array, timeout value, lazy status

### Route Assignments

Shows routes that have `meta.outposts` assigned. Each route node displays its assigned outpost names as a tag.

- **State panel** — Route name, path, and outposts array

### Current Route

Shows outposts that will execute on the current route, in `patrol()` execution order: all global outposts first (by priority), then route outposts (by priority).

- **Tags** — Each outpost shows scope badge (`global` / `route`) and priority
- **Auto-updates** — Refreshes automatically on navigation via `router.afterEach`

### Auto-refresh

Inspector updates automatically on:

- **Deploy/abandon** — outpost changes
- **Navigation** — current route changes

## ⚙️ Settings Panel

The DevTools settings panel provides runtime control of logging and debug modes.

### Log Level Selector

| Option          | `log`   | `debug` | Description                  |
| --------------- | ------- | ------- | ---------------------------- |
| **Off**         | `false` | `false` | No logging                   |
| **Log**         | `true`  | `false` | Non-critical logging enabled |
| **Log + Debug** | `true`  | `true`  | Logging + debug breakpoints  |

Settings persist in `localStorage` and take priority over citadel options on next page load. See [DevTools Internals](/advanced/devtools) for the full resolution flow and localStorage details.

See [Logging & Debug](/advanced/logging) for all log events, custom logger, and debug breakpoints reference.

<!--@include: ../_snippets/legend.md-->
