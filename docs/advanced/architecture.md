# ⚙️ Architecture

Deep dive into how vue-router-citadel works internally.

## 🗄️ Registry Structure

The citadel maintains a registry with separate maps for global and route outposts. Sorted arrays are
pre-computed on every `deployOutpost` / `abandonOutpost` for efficient navigation processing.

```mermaid
flowchart LR
    subgraph Registry
        A["global: Map&lt;string, Outpost&gt;"]
        B["route: Map&lt;string, Outpost&gt;"]
        C["globalSorted: string array"]
        D["routeSorted: string array"]
    end

    subgraph Operations
        E[deployOutpost] --> F[register]
        F --> LOG1["🔵 log.info: Deploying outpost"]
        LOG1 --> G[updateSortedKeys]
        H[abandonOutpost] --> I[unregister]
        I --> LOG2["🔵 log.info: Abandoning outpost"]
        LOG2 --> G
    end

    G --> C
    G --> D
```

**Optimization:** Sorting happens at deploy/abandon time, not during navigation. This ensures
navigation remains fast regardless of the number of outposts.

## 🔄 Outpost Processing

How a single outpost is processed during patrol:

```mermaid
flowchart TD
    A[processOutpost called] --> DBG1[🟣 debugger: before-outpost]
    DBG1 --> T{Timeout configured?}

    T -->|Yes| RACE["Promise.race([handler, timeout])"]
    T -->|No| B[handler]

    RACE --> TO{Timeout?}
    TO -->|Yes| TOH{Custom onTimeout?}
    TO -->|No| C

    B --> C[normalizeOutcome]

    TOH -->|Yes| TOC["onTimeout(name, ctx)"]
    TOH -->|No| TOLOG[🟡 log.warn: timed out]
    TOLOG --> TODBG[🟣 debugger: timeout]
    TODBG --> TOK[🔴 Return BLOCK]

    TOC --> TON[normalizeOutcome]
    TON --> F

    C --> D{Valid outcome?}

    D -->|ALLOW| E[🟢 Return ALLOW]
    D -->|BLOCK/Redirect| LOG1[🟡 log.warn: patrol stopped]
    LOG1 --> DBG2[🟣 debugger: patrol-stopped]
    DBG2 --> F[Return outcome]

    D -->|Error thrown| G{Custom onError?}

    G -->|Yes| H["onError(error, ctx)"]
    G -->|No| LOG2[🔴 log.error]

    H --> I[normalizeOutcome]
    I --> J{Valid?}
    J -->|Yes| F
    J -->|Error| LOG2

    LOG2 --> DBG3[🟣 debugger: error-caught]
    DBG3 --> K[🔴 Return BLOCK]
```

## 🔄 Complete Navigation Example

Full sequence diagram showing a navigation with global and route outposts:

```mermaid
sequenceDiagram
    participant U as User
    participant R as Router
    participant C as Citadel
    participant Reg as Registry

    U->>R: Navigate to /admin/users

    Note over R,C: beforeEach hook
    R->>C: patrol(registry, ctx, options)

    C->>C: Collect route names from matched stack
    C->>C: Deduplicate
    C->>C: Count outposts for hook

    Note over C: 🔵 log.info: beforeEach /home -> /admin/users (N outposts)
    Note over C: 🟣 debugger: navigation-start

    loop Global Outposts
        Note over C: 🔵 log.info: Processing outpost "name"
        Note over C: 🟣 debugger: before-outpost
        C->>Reg: Get deployed outpost
        Reg-->>C: outpost
        C->>C: processOutpost → ALLOW
    end

    loop Route Outposts
        Note over C: 🔵 log.info: Processing outpost "name"
        Note over C: 🟣 debugger: before-outpost
        C->>Reg: Get assigned outpost
        Reg-->>C: outpost
        C->>C: processOutpost → ALLOW
    end

    C-->>R: 🟢 ALLOW → true

    Note over R,C: beforeResolve hook (no outposts)
    R->>C: patrol(registry, ctx, options)
    Note over C: No outposts for hook → skip silently
    C-->>R: 🟢 ALLOW → true

    R->>R: Load component

    Note over R,C: afterEach hook
    R->>C: patrol(registry, ctx, options)
    Note over C: No return value used

    R-->>U: Page rendered
```

<!--@include: ../_snippets/legend.md-->
