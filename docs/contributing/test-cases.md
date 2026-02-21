---
description: Complete list of all 140 test cases across 9 test files in Vue Router Citadel — registry, patrol, API, timeout, lazy, integration, and DevTools tests.
---

# 📝 Test Cases

Complete list of all test cases across 9 test files (140 tests).

For testing setup, helpers, and how to write new tests, see the [Testing Guide](/contributing/testing).

---

## navigationRegistry.test.ts (12 tests)

Registry management functions.

### createRegistry

| Test                             | Description                    |
| -------------------------------- | ------------------------------ |
| returns empty registry structure | Creates Maps and sorted arrays |

### register

| Test                                               | Description                    |
| -------------------------------------------------- | ------------------------------ |
| adds outpost to global registry                    | Registers global scope outpost |
| adds outpost to route registry                     | Registers route scope outpost  |
| warns on duplicate and replaces existing           | Logs warning, overwrites       |
| updates sorted array by priority                   | Maintains priority order       |
| uses defaultPriority for outposts without priority | Falls back to default          |

### unregister

| Test                               | Description           |
| ---------------------------------- | --------------------- |
| removes outpost and returns true   | Successful removal    |
| returns false if outpost not found | Non-existent outpost  |
| updates sorted array after removal | Re-sorts after delete |

### getRegisteredNames

| Test                                 | Description         |
| ------------------------------------ | ------------------- |
| returns global outpost names         | Lists global names  |
| returns route outpost names          | Lists route names   |
| returns empty array when no outposts | Empty registry case |

---

## navigationOutposts.test.ts (19 tests)

Outcome normalization and patrol logic.

### normalizeOutcome

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

### toNavigationGuardReturn

| Test                           | Description          |
| ------------------------------ | -------------------- |
| converts ALLOW to true         | Vue Router format    |
| converts BLOCK to false        | Vue Router format    |
| returns RouteLocationRaw as-is | Redirect passthrough |

### patrol

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

## navigationCitadel.test.ts (29 tests)

Public API testing.

### createNavigationCitadel

| Test                                  | Description                          |
| ------------------------------------- | ------------------------------------ |
| returns API object with all methods   | API shape validation                 |
| registers router hooks                | beforeEach, beforeResolve, afterEach |
| deploys initial outposts from options | Constructor outposts                 |
| uses custom logger                    | Logger injection                     |

### deployOutpost

| Test                                        | Description              |
| ------------------------------------------- | ------------------------ |
| deploys single outpost                      | Single object            |
| deploys outpost with default scope (global) | Scope defaults to global |
| deploys multiple outposts (array)           | Array of outposts        |

### abandonOutpost

| Test                                                      | Description          |
| --------------------------------------------------------- | -------------------- |
| removes single outpost and returns true                   | Successful removal   |
| returns false if outpost not found                        | Non-existent outpost |
| removes multiple outposts and returns true if all deleted | Array removal        |
| returns false if any outpost not found                    | Partial failure      |

### getOutpostNames

| Test                                 | Description  |
| ------------------------------------ | ------------ |
| returns global outpost names         | Global scope |
| returns route outpost names          | Route scope  |
| returns empty array when no outposts | Empty case   |

### assignOutpostToRoute

| Test                               | Description         |
| ---------------------------------- | ------------------- |
| assigns outpost to existing route  | Modifies route meta |
| assigns multiple outposts to route | Array assignment    |
| does not duplicate outposts        | Idempotent          |
| returns false if route not found   | Non-existent route  |

### revokeOutpostFromRoute

| Test                                     | Description                |
| ---------------------------------------- | -------------------------- |
| removes single outpost from route        | Single outpost removal     |
| removes multiple outposts from route     | Array removal              |
| returns false if route not found         | Non-existent route         |
| warns if outpost not in route outposts   | Missing outpost warning    |
| handles missing meta.outposts gracefully | No meta.outposts edge case |

### destroy

| Test                              | Description |
| --------------------------------- | ----------- |
| removes hooks and clears registry | Cleanup     |

### install

| Test                                | Description              |
| ----------------------------------- | ------------------------ |
| is callable as Vue plugin           | Plugin API compatibility |
| does nothing when devtools disabled | No-op when disabled      |

### logging

| Test                                         | Description         |
| -------------------------------------------- | ------------------- |
| logs assignOutpostToRoute when log enabled   | Assignment logging  |
| logs revokeOutpostFromRoute when log enabled | Revocation logging  |
| logs destroy when log enabled                | Destruction logging |

---

## timeout.test.ts (5 tests)

Timeout functionality.

| Test                                           | Description               |
| ---------------------------------------------- | ------------------------- |
| outpost times out and returns BLOCK by default | Default timeout behavior  |
| onTimeout handler is called on timeout         | Custom handler invocation |
| per-outpost timeout overrides defaultTimeout   | Priority of timeouts      |
| no timeout if not configured                   | Disabled timeout          |
| fast outpost completes before timeout          | No false positives        |

---

## lazy.test.ts (12 tests)

Lazy outpost loading functionality.

### loading behavior

| Test                                         | Description                   |
| -------------------------------------------- | ----------------------------- |
| should load lazy outpost on first navigation | Module loaded on demand       |
| should cache handler after first load        | Subsequent calls use cache    |
| should not load eager outpost lazily         | Eager handlers work as before |

### error handling

| Test                                               | Description                 |
| -------------------------------------------------- | --------------------------- |
| should handle module load error                    | onError called on load fail |
| should throw error if module has no default export | Invalid module format       |
| should allow retry after load error                | Retry on next navigation    |

### timeout behavior

| Test                                                        | Description              |
| ----------------------------------------------------------- | ------------------------ |
| should apply timeout only to handler execution, not loading | Loading time not counted |
| should timeout if handler execution exceeds timeout         | Execution timeout works  |

### logging

| Test                                        | Description             |
| ------------------------------------------- | ----------------------- |
| should log lazy flag when deploying         | "(lazy)" in log message |
| should not log lazy flag for eager outposts | No "(lazy)" for eager   |

### mixed eager and lazy outposts

| Test                                                     | Description             |
| -------------------------------------------------------- | ----------------------- |
| should process eager and lazy outposts in priority order | Priority ordering works |

### getOutpostNames

| Test                                                | Description       |
| --------------------------------------------------- | ----------------- |
| should return names of both eager and lazy outposts | Both types listed |

---

## integration.test.ts (13 tests)

Full navigation flows with real router.

### navigation flow

| Test                                             | Description         |
| ------------------------------------------------ | ------------------- |
| allows navigation when all outposts return ALLOW | Happy path          |
| blocks navigation when outpost returns BLOCK     | Block scenario      |
| redirects when outpost returns RouteLocationRaw  | Redirect scenario   |
| processes outposts in priority order             | End-to-end priority |

### error handling

| Test                                  | Description            |
| ------------------------------------- | ---------------------- |
| calls onError handler on error        | Custom error handler   |
| blocks navigation by default on error | Default error behavior |
| onError can redirect on error         | Error -> redirect      |

### hooks

| Test                                 | Description        |
| ------------------------------------ | ------------------ |
| runs outpost on specified hooks only | Hook filtering     |
| runs outpost on multiple hooks       | Multi-hook outpost |
| afterEach runs for side effects only | Post-navigation    |

### route outposts

| Test                                         | Description            |
| -------------------------------------------- | ---------------------- |
| processes route outposts from meta           | Route meta integration |
| skips route outposts for routes without meta | No meta case           |

### context

| Test                                | Description   |
| ----------------------------------- | ------------- |
| provides correct context to handler | Context shape |

---

## devtools-settings.test.ts (19 tests)

DevTools settings and localStorage persistence.

### logLevelToState

| Test                                         | Description   |
| -------------------------------------------- | ------------- |
| should convert OFF to log:false, debug:false | State mapping |
| should convert LOG to log:true, debug:false  | State mapping |
| should convert DEBUG to log:true, debug:true | State mapping |

### stateToLogLevel

| Test                                                       | Description           |
| ---------------------------------------------------------- | --------------------- |
| should convert log:false, debug:false to OFF               | Reverse mapping       |
| should convert log:true, debug:false to LOG                | Reverse mapping       |
| should convert log:true, debug:true to DEBUG               | Reverse mapping       |
| should convert log:false, debug:true to DEBUG (precedence) | Edge case, debug wins |

### initializeRuntimeState

| Test                                               | Description            |
| -------------------------------------------------- | ---------------------- |
| should use localStorage value when available       | localStorage priority  |
| should use citadel options when localStorage empty | Options priority       |
| should use defaults when no localStorage/options   | Default priority       |
| should prioritize debug option over log option     | debug forces log       |
| should respect log=false when debug=false          | Explicit off           |
| should ignore invalid localStorage value           | Invalid values ignored |

### updateRuntimeState

| Test                         | Description              |
| ---------------------------- | ------------------------ |
| should update state to OFF   | State mutation + persist |
| should update state to LOG   | State mutation + persist |
| should update state to DEBUG | State mutation + persist |

### createSettingsDefinition

| Test                                                   | Description             |
| ------------------------------------------------------ | ----------------------- |
| should create settings with current state as default   | DevTools settings shape |
| should set default to OFF when log and debug are false | OFF state mapping       |
| should set default to DEBUG when debug is true         | DEBUG state mapping     |

---

## devtools-inspector.test.ts (19 tests)

DevTools custom inspector functionality.

### createInspectorTree

| Test                                      | Description          |
| ----------------------------------------- | -------------------- |
| should create empty tree when no outposts | Empty registry case  |
| should include global outposts in tree    | Global scope in tree |
| should include route outposts in tree     | Route scope in tree  |
| should add priority tag to outpost nodes  | Priority display     |
| should add hooks tag to outpost nodes     | Hooks count display  |
| should add lazy tag for lazy outposts     | Lazy indicator       |

### getNodeState

| Test                                                    | Description          |
| ------------------------------------------------------- | -------------------- |
| should return null for non-outpost nodes                | Root node handling   |
| should return null for invalid node id                  | Invalid ID handling  |
| should return state for global outpost node             | Global outpost state |
| should return state for route outpost node              | Route outpost state  |
| should return null for non-existent outpost             | Missing outpost      |
| should show "none (uses default)" for undefined timeout | Timeout display      |

### setupInspector

| Test                                                   | Description            |
| ------------------------------------------------------ | ---------------------- |
| should add inspector to DevTools API                   | Inspector registration |
| should register getInspectorTree callback              | Tree callback          |
| should register getInspectorState callback             | State callback         |
| should populate rootNodes on getInspectorTree callback | Tree population        |
| should ignore getInspectorTree for other inspectors    | Inspector ID check     |
| should populate state on getInspectorState callback    | State population       |

### refreshInspector

| Test                                                 | Description   |
| ---------------------------------------------------- | ------------- |
| should call sendInspectorTree and sendInspectorState | Refresh calls |

---

## debugHandler.test.ts (12 tests)

Debug handler invocation, custom handlers, and default logger.

### debugPoint function

| Test                                        | Description              |
| ------------------------------------------- | ------------------------ |
| calls logger.debug when debug is true       | Debug logging            |
| calls debugHandler when debug is true       | Handler invocation       |
| does not call logger.debug when debug false | No logging when disabled |
| does not call debugHandler when debug false | No handler when disabled |
| works without debugHandler (optional)       | Optional handler         |
| passes debug point name to handler          | Correct name passed      |

### createDefaultDebugHandler

| Test                                | Description             |
| ----------------------------------- | ----------------------- |
| returns a function                  | Factory returns handler |
| handler can be called without error | Handler is callable     |

### custom debugHandler integration

| Test                                     | Description         |
| ---------------------------------------- | ------------------- |
| should use custom debugHandler           | Custom handler used |
| should allow debugHandler custom actions | Custom tracing      |

### createDefaultLogger

| Test                                    | Description         |
| --------------------------------------- | ------------------- |
| should return logger with all methods   | Logger shape        |
| should call console methods with prefix | Prefix verification |
