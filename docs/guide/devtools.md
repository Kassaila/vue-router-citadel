---
description: Vue DevTools integration in Vue Router Citadel — custom inspector for viewing deployed outposts with tags, state panels, and settings.
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

The custom inspector provides:

- **Tree view** — Global and Route outpost groups with expandable nodes
- **Tags** — Each outpost shows priority badge and hooks count
- **State panel** — Detailed view with name, scope, priority, hooks array, timeout value
- **Auto-refresh** — Inspector updates automatically on deploy/abandon operations

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
