---
title: DevTools Internals
description: Vue Router Citadel DevTools internals — settings priority resolution, localStorage persistence, and runtime state management.
---

# 🛠️ DevTools Internals

Deep dive into how the DevTools settings panel resolves and persists logging configuration.

For basic setup and inspector features, see [Vue DevTools](/guide/devtools).

## ⚙️ Settings Priority

Settings are resolved in this order (first available wins):

```
localStorage → citadel options → defaults (__DEV__)
```

1. **localStorage** — if user changed settings via DevTools, persisted value is used
2. **citadel options** — `log` and `debug` options passed to `createNavigationCitadel`
3. **defaults** — `log: __DEV__`, `debug: false`

## 💾 localStorage Persistence

Settings are stored in localStorage with the key:

```
vue-router-citadel:settings:logLevel
```

Values: `off`, `log`, `debug`

## 📊 Settings Resolution Flow

```mermaid
flowchart TD
    A[Citadel created] --> B{localStorage has logLevel?}
    B -->|Yes| C[Use stored value]
    B -->|No| D{options.debug?}
    D -->|true| E["Log + Debug"]
    D -->|false| F{options.log?}
    F -->|true| G[Log]
    F -->|false| H{__DEV__?}
    H -->|true| G
    H -->|false| I[Off]

    C --> J[Set runtimeState]
    E --> J
    G --> J
    I --> J

    J --> K[Register DevTools]
    K --> L[User changes setting]
    L --> M[Update runtimeState]
    M --> N[Save to localStorage]
```

<!--@include: ../_snippets/legend.md-->
