# 📊 Visual Assets for Presentation

You can render these diagrams using a Markdown previewer or [Mermaid Live Editor](https://mermaid.live/), then take screenshots for your slides.

## Slide 4: System Architecture

```mermaid
graph TD
    subgraph Frontend [React Dashboard]
        UI[User Interface]
    end

    subgraph Backend [FastAPI Backend]
        API[API Server]
        LG[LangGraph Orchestrator]
    end

    subgraph Agents [Multi-Agent System]
        DA[Discovery Agent]
        AA[Analysis Agent]
        FA[Fixing Agent]
        TA[Testing Agent]
        GA[GitOps Agent]
        MA[Monitor Agent]
    end

    subgraph Infrastructure [Docker Sandbox]
        Exec[Safe Execution Environment]
    end

    UI -->|REST API| API
    API -->|Trigger| LG
    LG -->|Coordinate| DA
    LG -->|Coordinate| AA
    LG -->|Coordinate| FA
    LG -->|Coordinate| TA
    LG -->|Coordinate| GA
    LG -->|Coordinate| MA
    
    TA -->|Run Tests| Exec
    FA -->|Apply Fixes| Exec
```

## Slide 5: Agent Workflow

```mermaid
stateDiagram-v2
    [*] --> Clone: User Input
    Clone --> Analyze: Repo Ready
    Analyze --> Fix: Failure Detected
    Fix --> Verify: Fix Applied
    Verify --> PUSH: Tests Passed
    Verify --> Analyze: Tests Failed (Iterate)
    PUSH --> Monitor: PR Created
    Monitor --> [*]: Pipeline Success
```

## Slide 5: Detailed Iteration Flow

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant Agents
    participant Sandbox

    User->>Orchestrator: Start Agent
    Orchestrator->>Agents: Discovery (Identify Stack)
    loop Healing Cycle
        Orchestrator->>Sandbox: Run Tests
        Sandbox-->>Orchestrator: Failure Log
        Orchestrator->>Agents: Generate Fix
        Agents-->>Orchestrator: Apply Code Change
        Orchestrator->>Sandbox: Verify Fix
    end
    Orchestrator->>User: Success (Tests Passed)
```
