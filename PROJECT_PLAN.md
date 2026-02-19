# RIFT 2026 Hackathon - Autonomous CI/CD Healing Agent
## Detailed Project Planning Document

**Document Version:** 1.0  
**Last Updated:** 19 February 2026  
**Status:** Planning Phase

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement and Business Context](#problem-statement-and-business-context)
3. [Project Overview](#project-overview)
4. [Requirements Specification](#requirements-specification)
5. [Architecture Design](#architecture-design)
6. [Interfaces and Contracts](#interfaces-and-contracts)
7. [Technology Stack](#technology-stack)
8. [Component Breakdown](#component-breakdown)
9. [Scoring Model](#scoring-model)
10. [Implementation Phases](#implementation-phases)
11. [File Structure](#file-structure)
12. [API Design](#api-design)
13. [Agent Workflow](#agent-workflow)
14. [Dashboard Components](#dashboard-components)
15. [Testing Strategy](#testing-strategy)
16. [Deployment Plan](#deployment-plan)
17. [Risk Mitigation](#risk-mitigation)
18. [Document History](#document-history)

---

## 📄 Executive Summary

### Purpose
This document provides comprehensive planning and architecture for the **Autonomous CI/CD Healing Agent** project for RIFT 2026 Hackathon. It serves as:
- Technical blueprint for development
- Reference for judges and evaluators
- Guide for team members
- Compliance documentation

### Scope
The project delivers:
1. **Autonomous DevOps Agent** - Clones repos, discovers tests, identifies failures, generates fixes, commits with `[AI-AGENT]` prefix, pushes to `TEAM_NAME_LEADER_NAME_AI_Fix` branch
2. **React Dashboard** - Production-ready, publicly deployed interface with all required sections
3. **Backend API** - REST API to trigger agent and serve results (including `results.json`)
4. **Sandbox** - Isolated Docker execution environment
5. **Documentation** - Complete README, architecture diagram, build guide

### Out of Scope
- Support for private repositories (unless explicitly added with secure credential handling)
- Modification of CI/CD configuration files (e.g., GitHub Actions workflows) unless required to run tests
- Guarantee of fixes for all possible failure types; supported types are documented
- Multi-repository analysis in single run
- Real-time collaboration features

---

## 🎯 Problem Statement and Business Context

### Problem Statement (Official)
Modern software development relies heavily on CI/CD pipelines. These pipelines frequently fail due to code quality issues, logic bugs, syntax errors, type errors, and integration issues. Developers spend 40-60% of their time debugging these failures instead of building new features.

The challenge is to build an agent that can **autonomously** detect, fix, and verify code issues, with a **React dashboard** as the primary interface for submission and evaluation.

### Business Objectives
- **Reduce debugging time**: Automate repetitive CI/CD failure debugging
- **Single interface**: Provide auditable dashboard for running agent and viewing results
- **Traceability**: Ensure changes are traceable (branch name, commit prefix) and never applied to default branch
- **Standardization**: Align agent output with standardized format for evaluation and integration

### Success Criteria
- Agent runs without human intervention from dashboard trigger to final result
- All mandatory submission requirements met (live URL, video, README, branch name, commit prefix, output format)
- Dashboard displays all required sections with correct data from `results.json`
- Evaluation criteria addressed (test case accuracy, dashboard quality, agent architecture, documentation, video)

---

## 🎯 Project Overview

### Core Objective
Build an autonomous agent that can:
- Clone and analyze GitHub repositories
- Automatically discover and run test files
- Detect, fix, and verify code issues
- Commit fixes with proper naming conventions
- Monitor CI/CD pipelines iteratively
- Display results in a production-ready React dashboard

### Key Constraints
- Branch naming: `TEAM_NAME_LEADER_NAME_AI_Fix` (UPPERCASE, underscores)
- Commit prefix: `[AI-AGENT]`
- Must match test cases exactly
- No human intervention during execution
- Must be publicly deployed

---

## 🏗️ Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard (Frontend)                │
│  - Input Form (Repo URL, Team Name, Leader Name)            │
│  - Run Summary Card                                         │
│  - Score Breakdown Panel                                    │
│  - Fixes Applied Table                                      │
│  - CI/CD Status Timeline                                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Server (FastAPI/Express)           │
│  - /api/analyze (POST) - Trigger agent                     │
│  - /api/status/:runId (GET) - Get run status               │
│  - /api/results/:runId (GET) - Get results                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Multi-Agent Orchestration Layer (LangGraph)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Discovery   │  │   Analysis   │  │    Fixing    │     │
│  │    Agent     │  │    Agent     │  │    Agent     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Testing     │  │   Git Ops    │  │   CI/CD      │     │
│  │    Agent     │  │    Agent     │  │  Monitor     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Docker Sandbox Execution Environment            │
│  - Isolated code execution                                  │
│  - Test runner (pytest, jest, etc.)                        │
│  - Linter integration                                       │
│  - Type checker integration                                 │
└─────────────────────────────────────────────────────────────┘
```

### Agent Communication Flow

```
1. User Input → API → Agent Orchestrator
2. Orchestrator → Discovery Agent (clone repo, find tests)
3. Discovery → Analysis Agent (run tests, identify failures)
4. Analysis → Fixing Agent (generate fixes per bug type)
5. Fixing → Testing Agent (verify fixes)
6. Testing → Git Ops Agent (commit & push)
7. Git Ops → CI/CD Monitor (check pipeline)
8. CI/CD Monitor → Orchestrator (iterate if needed)
9. Orchestrator → API → Dashboard (update results)
```

---

## 📋 Requirements Specification

### Functional Requirements

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-1 | System shall accept GitHub repository URL, team name, and team leader name via web interface | Mandatory | UI + API test |
| FR-2 | System shall clone the repository in an isolated environment (sandbox) | Mandatory | Integration test |
| FR-3 | System shall discover test files/commands from repository structure (no hardcoded paths) | Mandatory | Unit + integration test |
| FR-4 | System shall run discovered tests and capture output (exit code, stdout, stderr) | Mandatory | Integration test |
| FR-5 | System shall classify failures into: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION | Mandatory | Unit test + output check |
| FR-6 | System shall generate fixes and produce output in exact format: `{TYPE} error in {file} line {line} → Fix: {description}` | Mandatory | Test case match |
| FR-7 | System shall apply fixes, re-run tests, and track status (Fixed / Failed) per fix | Mandatory | Integration test |
| FR-8 | System shall commit all changes with message prefix `[AI-AGENT]` | Mandatory | Git log check |
| FR-9 | System shall create and push only to a branch named `TEAM_NAME_LEADER_NAME_AI_Fix` (rules: uppercase, spaces→underscores, suffix _AI_Fix) | Mandatory | Branch name test |
| FR-10 | System shall never push to the default (main) branch | Mandatory | Process + code review |
| FR-11 | System shall iterate until tests pass or configurable retry limit (default 5) is reached | Mandatory | Config + integration test |
| FR-12 | System shall produce a `results.json` at end of each run with defined schema | Mandatory | Schema validation |
| FR-13 | Backend shall expose REST endpoint(s) to trigger agent and retrieve run status/results | Mandatory | API test |
| FR-14 | Dashboard shall display: Input section, Run Summary Card, Score Breakdown, Fixes Applied Table, CI/CD Status Timeline | Mandatory | UI checklist |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Frontend shall be built with React (functional components and hooks) | Mandatory |
| NFR-2 | Frontend shall be responsive (desktop and mobile) | Mandatory |
| NFR-3 | Frontend shall use explicit state management (Context API, Redux, Zustand, or equivalent) | Mandatory |
| NFR-4 | Code execution (clone, test run, fix application) shall be sandboxed (Docker recommended) | Mandatory |
| NFR-5 | Agent shall use a multi-agent architecture (e.g. LangGraph, CrewAI, AutoGen) | Mandatory |
| NFR-6 | Retry limit shall be configurable (default 5) | Mandatory |
| NFR-7 | React dashboard shall be deployed and publicly accessible | Mandatory |
| NFR-8 | System shall handle errors gracefully with comprehensive logging | High |
| NFR-9 | API response time shall be reasonable (< 30s for status check) | Medium |

### Compliance Requirements (Submission)

| ID | Requirement | Source |
|----|-------------|--------|
| CR-1 | Live deployed website URL provided | RIFT submission |
| CR-2 | LinkedIn video (2–3 min, tag @RIFT2026, public) with live demo, architecture, workflow, results | RIFT submission |
| CR-3 | Public GitHub repository with complete source; README with title, deployment URL, video URL, architecture, install, setup, usage, bug types, tech stack, limitations, team | RIFT submission |
| CR-4 | Output matches test case format; branch name format correct; commits use [AI-AGENT]; no push to main; no hardcoded test paths; no human intervention during run | RIFT evaluation |

---

## 🔗 Interfaces and Contracts

### results.json Schema

The system shall produce a `results.json` file with the following schema:

```json
{
  "repoUrl": "string",
  "teamName": "string",
  "teamLeader": "string",
  "branchName": "string",
  "totalFailuresDetected": "number",
  "totalFixesApplied": "number",
  "finalCiCdStatus": "PASSED" | "FAILED",
  "totalTimeMs": "number",
  "score": {
    "baseScore": "number",
    "speedBonus": "number",
    "efficiencyPenalty": "number",
    "total": "number"
  },
  "fixes": [
    {
      "file": "string",
      "bugType": "LINTING" | "SYNTAX" | "LOGIC" | "TYPE_ERROR" | "IMPORT" | "INDENTATION",
      "lineNumber": "number",
      "commitMessage": "string",
      "status": "Fixed" | "Failed"
    }
  ],
  "ciCdTimeline": [
    {
      "iteration": "number",
      "status": "PASSED" | "FAILED",
      "timestamp": "string (ISO 8601)"
    }
  ]
}
```

### Branch Naming Contract

**Format:** `TEAM_NAME_LEADER_NAME_AI_Fix`

**Rules:**
- All characters must be UPPERCASE
- Spaces must be replaced with underscores (`_`)
- Must end with `_AI_Fix` (no brackets)
- No special characters except underscores
- Maximum length: 255 characters (GitHub limit)

**Examples:**
- Team: "RIFT ORGANISERS", Leader: "Saiyam Kumar" → `RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix`
- Team: "Code Warriors", Leader: "John Doe" → `CODE_WARRIORS_JOHN_DOE_AI_Fix`
- Team: "Team-1", Leader: "Jane O'Brien" → `TEAM_1_JANE_OBRIEN_AI_Fix`

**Implementation:** See `format_branch_name()` function in [STEP_BY_STEP_BUILD_GUIDE.md](./STEP_BY_STEP_BUILD_GUIDE.md)

### Failure/Fix Output Contract

**Pattern:** `{BUG_TYPE} error in {file} line {line} → Fix: {description}`

**Bug Types (exactly these labels):**
- `LINTING`
- `SYNTAX`
- `LOGIC`
- `TYPE_ERROR`
- `IMPORT`
- `INDENTATION`

**Examples:**
- `LINTING error in src/utils.py line 15 → Fix: remove the import statement`
- `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position`

**Implementation:** See `format_failure()` function in [TEST_CASE_OUTPUT_FORMAT.md](./TEST_CASE_OUTPUT_FORMAT.md)

### Commit Message Contract

**Format:** `[AI-AGENT] {description}`

**Rules:**
- Every commit MUST start with `[AI-AGENT]` (including brackets)
- Description should be concise and descriptive
- Examples:
  - `[AI-AGENT] Fix LINTING in src/utils.py: remove unused import`
  - `[AI-AGENT] Fix SYNTAX error in src/validator.py line 8`

**Validation:** System shall validate commit message format before committing.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18+ (functional components + hooks)
- **State Management**: Zustand or Context API
- **UI Library**: Material-UI or Tailwind CSS + shadcn/ui
- **Charts**: Recharts or Chart.js
- **HTTP Client**: Axios
- **Deployment**: Vercel (recommended) or Netlify

### Backend
- **Framework**: FastAPI (Python) or Express.js (Node.js)
- **Agent Framework**: LangGraph (recommended) or CrewAI
- **LLM Integration**: OpenAI GPT-4 / Claude / Local LLM (Ollama)
- **Code Analysis**: 
  - Python: pylint, flake8, mypy, black
  - JavaScript/TypeScript: ESLint, Prettier, TypeScript compiler
  - General: Tree-sitter for AST parsing
- **Git Operations**: GitPython (Python) or simple-git (Node.js)
- **CI/CD Monitoring**: GitHub API integration

### Infrastructure
- **Containerization**: Docker
- **Sandbox**: Docker containers for code execution
- **Database**: SQLite (for run history) or PostgreSQL
- **File Storage**: Local filesystem or S3 (for cloned repos)
- **Queue System**: Redis + Celery (Python) or Bull (Node.js)

### DevOps
- **CI/CD**: GitHub Actions (for the agent itself)
- **Monitoring**: Logging to files + API endpoints
- **Error Handling**: Comprehensive try-catch with logging

---

## 📦 Component Breakdown

### 1. Frontend Components

#### 1.1 InputSection
- **Props**: `onSubmit(repoUrl, teamName, leaderName)`
- **Features**:
  - Text input for GitHub repo URL (validation)
  - Text input for Team Name
  - Text input for Team Leader Name
  - "Run Agent" button (disabled during execution)
  - Loading spinner/indicator

#### 1.2 RunSummaryCard
- **Props**: `runData: RunSummary`
- **Features**:
  - Repository URL (clickable link)
  - Team name and leader name
  - Branch name created
  - Total failures detected
  - Total fixes applied
  - CI/CD status badge (green/red)
  - Total time taken (formatted)

#### 1.3 ScoreBreakdownPanel
- **Props**: `scoreData: ScoreData`
- **Features**:
  - Base score: 100 points
  - Speed bonus: +10 if < 5 minutes
  - Efficiency penalty: -2 per commit over 20
  - Final total score (large display)
  - Progress bar/chart visualization

#### 1.4 FixesAppliedTable
- **Props**: `fixes: Fix[]`
- **Features**:
  - Columns: File | Bug Type | Line Number | Commit Message | Status
  - Bug types: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION
  - Status icons: ✓ (green) or ✗ (red)
  - Sortable columns
  - Filter by bug type

#### 1.5 CICDStatusTimeline
- **Props**: `ciRuns: CICDRun[]`
- **Features**:
  - Timeline visualization (vertical or horizontal)
  - Pass/fail badge for each iteration
  - Iteration counter (e.g., "3/5")
  - Timestamp for each run
  - Click to expand details

### 2. Backend Components

#### 2.1 API Server
- **Endpoints**:
  - `POST /api/analyze` - Start agent run
  - `GET /api/status/:runId` - Get run status
  - `GET /api/results/:runId` - Get full results
  - `GET /api/history` - Get all runs
  - `WS /api/ws/:runId` - WebSocket for real-time updates (optional)

#### 2.2 Agent Orchestrator
- **Responsibilities**:
  - Coordinate agent workflow
  - Manage state transitions
  - Handle retries and error recovery
  - Generate results.json

#### 2.3 Discovery Agent
- **Responsibilities**:
  - Clone GitHub repository
  - Analyze repository structure
  - Discover test files (pytest, jest, unittest, etc.)
  - Identify project type (Python, Node.js, etc.)

#### 2.4 Analysis Agent
- **Responsibilities**:
  - Run test files in sandbox
  - Parse test output
  - Identify failures with:
    - File path
    - Line number
    - Error type (LINTING, SYNTAX, etc.)
    - Error message

#### 2.5 Fixing Agent
- **Responsibilities**:
  - Generate fixes for each identified bug
  - Use LLM to understand context
  - Apply fixes to code
  - Validate fix syntax

#### 2.6 Testing Agent
- **Responsibilities**:
  - Run tests after fixes
  - Verify fixes resolved issues
  - Track which fixes succeeded/failed

#### 2.7 Git Ops Agent
- **Responsibilities**:
  - Create branch with format: `TEAM_NAME_LEADER_NAME_AI_Fix`
  - Commit with prefix: `[AI-AGENT]`
  - Push to remote
  - Handle authentication

#### 2.8 CI/CD Monitor Agent
- **Responsibilities**:
  - Poll GitHub API for CI/CD status
  - Detect pass/fail
  - Trigger re-iteration if failed
  - Track iteration count (max 5)

### 3. Utility Components

#### 3.1 Code Analyzer
- Linter integration
- Type checker integration
- AST parser for code understanding

#### 3.2 Test Runner
- Multi-language test runner
- Sandbox execution
- Output parsing

#### 3.3 Git Manager
- Branch creation
- Commit management
- Push operations
- Authentication handling

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Days 1-2)
- [ ] Set up project structure
- [ ] Initialize React frontend
- [ ] Initialize backend API
- [ ] Set up Docker environment
- [ ] Configure Git operations
- [ ] Basic API endpoints

### Phase 2: Core Agent Logic (Days 2-3)
- [ ] Implement Discovery Agent
- [ ] Implement Analysis Agent
- [ ] Implement Fixing Agent
- [ ] Implement Testing Agent
- [ ] Implement Git Ops Agent
- [ ] Implement CI/CD Monitor Agent
- [ ] Set up LangGraph orchestration

### Phase 3: Dashboard Development (Days 3-4)
- [ ] Build InputSection component
- [ ] Build RunSummaryCard component
- [ ] Build ScoreBreakdownPanel component
- [ ] Build FixesAppliedTable component
- [ ] Build CICDStatusTimeline component
- [ ] Integrate API calls
- [ ] Add real-time updates (WebSocket or polling)

### Phase 4: Integration & Testing (Days 4-5)
- [ ] Connect frontend to backend
- [ ] Test with sample repositories
- [ ] Verify branch naming format
- [ ] Verify commit prefix format
- [ ] Test bug detection accuracy
- [ ] Test fix generation
- [ ] Validate test case matching

### Phase 5: Polish & Deployment (Days 5-6)
- [ ] Error handling improvements
- [ ] UI/UX polish
- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Deploy frontend (Vercel)
- [ ] Deploy backend (Railway/Render)
- [ ] Test end-to-end flow
- [ ] Prepare README
- [ ] Record demo video

---

## 📁 File Structure

```
Rift/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputSection/
│   │   │   │   ├── InputSection.tsx
│   │   │   │   └── InputSection.module.css
│   │   │   ├── RunSummaryCard/
│   │   │   ├── ScoreBreakdownPanel/
│   │   │   ├── FixesAppliedTable/
│   │   │   └── CICDStatusTimeline/
│   │   ├── store/
│   │   │   └── useRunStore.ts (Zustand)
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── orchestrator.py
│   │   │   ├── discovery_agent.py
│   │   │   ├── analysis_agent.py
│   │   │   ├── fixing_agent.py
│   │   │   ├── testing_agent.py
│   │   │   ├── git_ops_agent.py
│   │   │   └── cicd_monitor_agent.py
│   │   ├── utils/
│   │   │   ├── code_analyzer.py
│   │   │   ├── test_runner.py
│   │   │   ├── git_manager.py
│   │   │   └── sandbox.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── routes.py
│   │   │   └── models.py
│   │   ├── config/
│   │   │   └── settings.py
│   │   └── langgraph/
│   │       └── workflow.py
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── requirements.txt
│   └── README.md
│
├── tests/
│   ├── test_repositories/
│   │   └── sample_repo/
│   ├── test_agents.py
│   └── test_integration.py
│
├── docs/
│   ├── architecture.md
│   └── api.md
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .env.example
├── .gitignore
├── README.md
└── PROJECT_PLAN.md (this file)
```

---

## 🔌 API Design

### POST /api/analyze
**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo",
  "teamName": "RIFT ORGANISERS",
  "leaderName": "Saiyam Kumar"
}
```

**Response:**
```json
{
  "runId": "uuid-here",
  "status": "started",
  "message": "Agent analysis started"
}
```

### GET /api/status/:runId
**Response:**
```json
{
  "runId": "uuid-here",
  "status": "running|completed|failed",
  "progress": 45,
  "currentStep": "Fixing bugs",
  "startTime": "2026-02-19T18:00:00Z",
  "elapsedTime": 120
}
```

### GET /api/results/:runId
**Response:**
```json
{
  "runId": "uuid-here",
  "repoUrl": "https://github.com/user/repo",
  "teamName": "RIFT ORGANISERS",
  "leaderName": "Saiyam Kumar",
  "branchName": "RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix",
  "summary": {
    "totalFailures": 5,
    "totalFixes": 5,
    "cicdStatus": "PASSED",
    "totalTime": 240
  },
  "score": {
    "baseScore": 100,
    "speedBonus": 10,
    "efficiencyPenalty": 0,
    "totalScore": 110
  },
  "fixes": [
    {
      "file": "src/utils.py",
      "bugType": "LINTING",
      "lineNumber": 15,
      "commitMessage": "[AI-AGENT] Fix: remove unused import 'os'",
      "status": "Fixed"
    }
  ],
  "cicdRuns": [
    {
      "iteration": 1,
      "status": "FAILED",
      "timestamp": "2026-02-19T18:02:00Z"
    },
    {
      "iteration": 2,
      "status": "PASSED",
      "timestamp": "2026-02-19T18:04:00Z"
    }
  ]
}
```

---

## 🤖 Agent Workflow

### Detailed State Machine (LangGraph)

```
START
  ↓
DISCOVERY
  ├─ Clone repository
  ├─ Analyze structure
  ├─ Find test files
  └─ Identify project type
  ↓
ANALYSIS
  ├─ Run tests in sandbox
  ├─ Parse output
  ├─ Identify failures
  └─ Categorize bug types
  ↓
FIXING
  ├─ For each bug:
  │   ├─ Analyze context
  │   ├─ Generate fix (LLM)
  │   ├─ Apply fix
  │   └─ Validate syntax
  └─ Collect all fixes
  ↓
TESTING
  ├─ Run tests again
  ├─ Verify fixes
  └─ Track success/failure
  ↓
GIT_OPS
  ├─ Create branch (format: TEAM_NAME_LEADER_NAME_AI_Fix)
  ├─ Commit fixes ([AI-AGENT] prefix)
  └─ Push to remote
  ↓
CI/CD_MONITOR
  ├─ Poll GitHub API
  ├─ Check CI/CD status
  └─ If FAILED and iterations < 5:
      └─ Loop back to ANALYSIS
  ↓
COMPLETE
  ├─ Generate results.json
  └─ Return to API
```

### Bug Type Detection Logic

```python
def categorize_bug(error_message, file_path, line_number):
    """
    Categorize bug into: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION
    """
    error_lower = error_message.lower()
    
    if any(keyword in error_lower for keyword in ['unused', 'lint', 'flake8', 'pylint']):
        return "LINTING"
    elif any(keyword in error_lower for keyword in ['syntax', 'parse', 'invalid syntax']):
        return "SYNTAX"
    elif any(keyword in error_lower for keyword in ['type', 'typing', 'type error']):
        return "TYPE_ERROR"
    elif any(keyword in error_lower for keyword in ['import', 'module not found', 'cannot import']):
        return "IMPORT"
    elif any(keyword in error_lower for keyword in ['indent', 'indentation']):
        return "INDENTATION"
    else:
        return "LOGIC"
```

---

## 🎨 Dashboard Components

### State Management Structure

```typescript
interface RunState {
  currentRun: RunData | null;
  history: RunData[];
  isLoading: boolean;
  error: string | null;
}

interface RunData {
  runId: string;
  repoUrl: string;
  teamName: string;
  leaderName: string;
  branchName: string;
  summary: RunSummary;
  score: ScoreData;
  fixes: Fix[];
  cicdRuns: CICDRun[];
  startTime: string;
  endTime: string;
}
```

### Component Props & Types

```typescript
interface Fix {
  file: string;
  bugType: 'LINTING' | 'SYNTAX' | 'LOGIC' | 'TYPE_ERROR' | 'IMPORT' | 'INDENTATION';
  lineNumber: number;
  commitMessage: string;
  status: 'Fixed' | 'Failed';
}

interface CICDRun {
  iteration: number;
  status: 'PASSED' | 'FAILED';
  timestamp: string;
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Agent logic (each agent separately)
- Code analyzer functions
- Git operations
- Bug categorization

### Integration Tests
- End-to-end agent workflow
- API endpoints
- Frontend-backend integration

### Test Repositories
- Create sample repos with known bugs:
  - Linting errors
  - Syntax errors
  - Type errors
  - Import errors
  - Logic errors
  - Indentation errors

### Validation Tests
- Branch naming format
- Commit prefix format
- Test case output matching
- Score calculation accuracy

---

## 🚢 Deployment Plan

### Frontend Deployment (Vercel)
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`
4. Configure environment variables (API URL)

### Backend Deployment (Railway/Render)
1. Set up Docker container
2. Configure environment variables:
   - GitHub token
   - OpenAI API key
   - Database URL (if using)
3. Expose port 8000
4. Set up health check endpoint

### Environment Variables
```bash
# Backend
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-...
MAX_RETRIES=5
API_PORT=8000
FRONTEND_URL=https://your-app.vercel.app

# Frontend
REACT_APP_API_URL=https://your-api.railway.app
```

---

## ⚠️ Risk Mitigation

### Risk 1: LLM API Rate Limits
- **Mitigation**: Implement retry logic with exponential backoff
- **Fallback**: Use local LLM (Ollama) as backup

### Risk 2: Git Authentication Issues
- **Mitigation**: Use GitHub Personal Access Token
- **Fallback**: Support SSH keys

### Risk 3: Test Case Matching Failures
- **Mitigation**: Strict output formatting function
- **Testing**: Validate against provided test cases early

### Risk 4: Sandbox Security
- **Mitigation**: Docker containers with resource limits
- **Isolation**: Network isolation, read-only filesystem where possible

### Risk 5: CI/CD Monitoring Delays
- **Mitigation**: Polling with exponential backoff
- **Timeout**: Maximum wait time per iteration

### Risk 6: Branch Naming Format Errors
- **Mitigation**: Dedicated function with unit tests
- **Validation**: Test with various team/leader name formats

---

## 📊 Success Metrics

### Functional Requirements
- ✅ All test cases match exactly
- ✅ Branch naming format correct
- ✅ Commit prefix correct
- ✅ Dashboard displays all required sections
- ✅ Agent completes without human intervention

### Quality Metrics
- Dashboard load time < 2 seconds
- Agent execution time < 10 minutes (target: < 5 for bonus)
- Fix accuracy > 80%
- CI/CD pass rate > 70%

---

## 📝 Next Steps

1. **Immediate Actions**:
   - Set up GitHub repository
   - Initialize frontend and backend projects
   - Set up development environment
   - Create initial file structure

2. **Day 1 Goals**:
   - Complete Phase 1 (Foundation)
   - Start Phase 2 (Core Agent Logic)
   - Set up basic API endpoints

3. **Day 2 Goals**:
   - Complete agent implementations
   - Start dashboard development
   - Begin integration testing

4. **Day 3-4 Goals**:
   - Complete dashboard
   - Full integration
   - Test with sample repos

5. **Day 5-6 Goals**:
   - Deployment
   - Documentation
   - Demo video
   - Final testing

---

## 🔗 Resources & References

- LangGraph Documentation: https://langchain-ai.github.io/langgraph/
- GitHub API: https://docs.github.com/en/rest
- React Best Practices: https://react.dev/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Docker Best Practices: https://docs.docker.com/

---

## 📊 Scoring Model

The scoring system is implemented as follows:

- **Base Score:** 100 points
- **Speed Bonus:** +10 points if total run time < 5 minutes (300,000 ms)
- **Efficiency Penalty:** -2 points per commit over 20 commits
- **Total Score:** `baseScore + speedBonus - efficiencyPenalty` (minimum 0)

**Formula:**
```python
base_score = 100
speed_bonus = 10 if total_time_ms < 300000 else 0
efficiency_penalty = max(0, (commit_count - 20) * 2)
total_score = max(0, base_score + speed_bonus - efficiency_penalty)
```

**Example Calculations:**
- Time: 4 minutes, Commits: 15 → Score: 100 + 10 - 0 = **110**
- Time: 6 minutes, Commits: 25 → Score: 100 + 0 - 10 = **90**
- Time: 3 minutes, Commits: 30 → Score: 100 + 10 - 20 = **90**

The score is stored in `results.json` and displayed in the dashboard.

---

## 📝 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 19 February 2026 | Team | Initial comprehensive project planning document with requirements IDs, contracts, and scoring model |

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-19  
**Status**: Planning Phase - Enhanced with Requirements IDs and Contracts
