# Technical Documentation
## Autonomous CI/CD Healing Agent - RIFT 2026

**Version:** 1.0.0  
**Last Updated:** 2026-02-19  
**Team:** Team ETS  
**Team Leader:** Deepakmaseeh

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Agent System](#agent-system)
5. [API Documentation](#api-documentation)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Deployment Guide](#deployment-guide)
10. [Testing Strategy](#testing-strategy)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard (Frontend)                │
│  - Vite + React 18                                          │
│  - Context API for State Management                          │
│  - Responsive UI Components                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST (Port 5173 → 8000)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Express API Server (Backend)                    │
│  - Node.js + Express                                         │
│  - RESTful API Endpoints                                     │
│  - In-Memory Storage (runs)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Multi-Agent Orchestration System                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CoordinatorAgent (Orchestrator)                      │   │
│  │  - Manages agent workflow                            │   │
│  │  - Handles retry logic                               │   │
│  │  - Generates results.json                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ RepoAnalyzer │  │ TestRunner   │  │ FixGenerator │     │
│  │    Agent     │  │    Agent     │  │    Agent     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │   Commit     │  │ CICDMonitor  │                       │
│  │    Agent     │  │    Agent     │                       │
│  └──────────────┘  └──────────────┘                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Docker Sandbox Execution                        │
│  - Isolated container environment                            │
│  - No network access                                         │
│  - Python 3.11 + Node.js 20                                 │
│  - Test execution tools (pytest, jest)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18+
- **Language:** JavaScript (ES Modules)
- **Git Operations:** simple-git 3.20+
- **Docker Integration:** dockerode 4.0+
- **Environment:** dotenv 16.3+

### Project Structure

```
backend/
├── src/
│   ├── index.js                    # Express server entry point
│   ├── agents/
│   │   ├── coordinatorAgent.js     # Main orchestrator
│   │   ├── repoAnalyzerAgent.js    # Repository analysis
│   │   ├── testRunnerAgent.js      # Test execution
│   │   ├── fixGeneratorAgent.js    # Rule-based fixes
│   │   ├── commitAgent.js          # Git operations
│   │   └── cicdMonitorAgent.js     # CI/CD monitoring
│   └── utils/
│       ├── constants.js            # Team constants & bug types
│       ├── storage.js              # In-memory run storage
│       ├── gitUtils.js             # Git operations
│       ├── outputFormatter.js      # Output format utilities
│       ├── scoring.js              # Score calculation
│       └── logger.js               # Logging utility
├── Dockerfile.sandbox              # Sandbox container image
├── package.json
└── .env.example
```

### Core Components

#### 1. Express Server (`src/index.js`)

**Responsibilities:**
- HTTP server setup and configuration
- CORS middleware configuration
- API route handlers
- Error handling middleware
- Health check endpoint

**Key Features:**
- Non-blocking agent execution
- Real-time status updates via polling
- Comprehensive error handling

#### 2. Coordinator Agent (`src/agents/coordinatorAgent.js`)

**Responsibilities:**
- Orchestrates all agent operations
- Manages iteration loop (max 5 retries)
- Tracks progress and updates run status
- Generates final results.json
- Handles error recovery

**Workflow:**
1. Initialize all agents
2. Clone repository (RepoAnalyzerAgent)
3. Setup git repository (CommitAgent)
4. Iteration loop:
   - Run tests (TestRunnerAgent)
   - Parse failures
   - Generate fixes (FixGeneratorAgent)
   - Apply fixes
   - Commit changes (CommitAgent)
   - Push to branch
   - Check CI/CD status (CICDMonitorAgent)
5. Generate results.json
6. Save to workspace directory

#### 3. Repo Analyzer Agent (`src/agents/repoAnalyzerAgent.js`)

**Responsibilities:**
- Clone GitHub repositories
- Detect project type (Python/Node.js)
- Discover test files
- Determine test command

**Methods:**
- `cloneRepository(repoUrl)` - Clones repo to workspace
- `detectProjectType(repoPath)` - Detects Python/Node.js
- `discoverTestFiles(repoPath, projectType)` - Finds test files
- `getTestCommand(repoPath, projectType)` - Returns test command array

#### 4. Test Runner Agent (`src/agents/testRunnerAgent.js`)

**Responsibilities:**
- Execute tests in Docker sandbox
- Parse test output (pytest/jest)
- Categorize failures by bug type
- Fallback to local execution if Docker fails

**Methods:**
- `runTests(repoPath, testCommand, projectType)` - Runs tests
- `runTestsLocally(repoPath, testCommand)` - Local fallback
- `parseFailures(testOutput, projectType)` - Parses output
- `categorizeBug(errorMessage)` - Categorizes bug type

**Bug Type Detection:**
- LINTING: "unused", "lint"
- SYNTAX: "syntax", "parse", "colon"
- TYPE_ERROR: "type", "typing"
- IMPORT: "import", "module not found"
- INDENTATION: "indent", "indentation"
- LOGIC: Default fallback

#### 5. Fix Generator Agent (`src/agents/fixGeneratorAgent.js`)

**Responsibilities:**
- Generate rule-based fixes (NO LLMs)
- Apply fixes to source files
- Generate formatted output strings

**Supported Fixes:**
- **LINTING:** Removes unused imports
- **SYNTAX:** Adds missing colons
- **IMPORT:** Attempts to fix broken imports
- **INDENTATION:** Normalizes to 4 spaces
- **TYPE_ERROR/LOGIC:** Marked for manual review

**Methods:**
- `generateFix(failure, repoPath)` - Generates fix
- `applyFix(repoPath, fix)` - Applies fix to file

#### 6. Commit Agent (`src/agents/commitAgent.js`)

**Responsibilities:**
- Setup git repository
- Create branch: `TEAM_ETS_DEEPAKMASEEH_AI_Fix`
- Commit changes with `[AI-AGENT]` prefix
- Push to remote (never to main/master)

**Methods:**
- `setupRepository(repoPath, repoUrl, teamName, leaderName)` - Git setup
- `commitFix(repoPath, fix, branchName)` - Commits fix
- `pushChanges(repoPath, branchName)` - Pushes to remote

#### 7. CI/CD Monitor Agent (`src/agents/cicdMonitorAgent.js`)

**Responsibilities:**
- Monitor GitHub Actions status
- Poll CI/CD pipeline
- Return PASSED/FAILED status

**Methods:**
- `checkCICDStatus(repoUrl, branchName)` - Checks current status
- `waitForCICDCompletion(repoUrl, branchName, timeoutMs)` - Waits for completion

---

## Frontend Architecture

### Technology Stack

- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **State Management:** Context API
- **HTTP Client:** Axios 1.6+
- **Styling:** CSS3 with CSS Variables

### Project Structure

```
frontend/
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Main app component
│   ├── index.css                # Global styles
│   ├── context/
│   │   └── RunContext.jsx       # State management
│   └── components/
│       ├── InputSection.jsx     # Input form
│       ├── RunSummaryCard.jsx   # Summary display
│       ├── ScoreBreakdownPanel.jsx # Score breakdown
│       ├── FixesAppliedTable.jsx   # Fixes table
│       └── CICDStatusTimeline.jsx  # CI/CD timeline
├── index.html
├── vite.config.js
└── package.json
```

### Core Components

#### 1. Run Context (`src/context/RunContext.jsx`)

**State:**
- `currentRun` - Current run data
- `loading` - Loading state
- `error` - Error message

**Methods:**
- `startRun(repoUrl, teamName, leaderName, retryLimit)` - Starts agent run
- Polls status every 3 seconds until completed

#### 2. Input Section (`src/components/InputSection.jsx`)

**Features:**
- GitHub repository URL input
- Team name input (default: "Team ETS")
- Team leader input (default: "Deepakmaseeh")
- Retry limit input (default: 5)
- Loading state with spinner
- Form validation

#### 3. Run Summary Card (`src/components/RunSummaryCard.jsx`)

**Displays:**
- Repository URL (clickable link)
- Team name and leader
- Branch name
- Total failures detected
- Total fixes applied
- Final CI/CD status badge
- Total time taken
- Iterations used

#### 4. Score Breakdown Panel (`src/components/ScoreBreakdownPanel.jsx`)

**Displays:**
- Total score (large, prominent)
- Base score (100 points)
- Speed bonus (+10 if < 5 min)
- Efficiency penalty (-2 per commit over 20)
- Visual progress bar

#### 5. Fixes Applied Table (`src/components/FixesAppliedTable.jsx`)

**Columns:**
- File path
- Bug type (badge)
- Line number
- Commit message
- Status (✓ Fixed / ✗ Failed)

**Features:**
- Color-coded status badges
- Responsive table design
- Empty state handling

#### 6. CI/CD Status Timeline (`src/components/CICDStatusTimeline.jsx`)

**Displays:**
- Iteration badges (pass/fail)
- Iteration counter (e.g., "3/5")
- Timestamps for each run
- Visual timeline with connecting lines

---

## API Documentation

### Base URL

```
http://localhost:8000
```

### Endpoints

#### 1. Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T18:00:00.000Z"
}
```

#### 2. Start Agent Run

```
POST /run-agent
```

**Request Body:**
```json
{
  "repo_url": "https://github.com/owner/repo",
  "team_name": "Team ETS",
  "leader_name": "Deepakmaseeh",
  "retry_limit": 5
}
```

**Response:**
```json
{
  "run_id": "uuid-here",
  "status": "started",
  "message": "Agent run initiated"
}
```

#### 3. Get Run Status

```
GET /runs/:id/status
```

**Response:**
```json
{
  "id": "uuid-here",
  "status": "running",
  "repo_url": "https://github.com/owner/repo",
  "team_name": "Team ETS",
  "leader_name": "Deepakmaseeh",
  "retry_limit": 5,
  "start_time": "2026-02-19T18:00:00.000Z",
  "progress": 45,
  "current_step": "Iteration 2/5: Generating fixes...",
  "results": null
}
```

**Status Values:**
- `started` - Run initiated
- `running` - In progress
- `completed` - Finished successfully
- `failed` - Error occurred

#### 4. Get Run Results

```
GET /runs/:id/results
```

**Response:** (Same as results.json schema)

---

## Data Models

### Run Status Object

```typescript
interface RunStatus {
  id: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  repo_url: string;
  team_name: string;
  leader_name: string;
  retry_limit: number;
  start_time: string; // ISO 8601
  end_time?: string; // ISO 8601
  progress: number; // 0-100
  current_step: string;
  error?: string;
  results?: Results;
}
```

### Results Object (results.json)

```typescript
interface Results {
  repo_url: string;
  team_name: string;
  leader_name: string;
  branch: string;
  total_failures: number;
  fixes_applied: number;
  ci_status: 'PASSED' | 'FAILED' | 'UNKNOWN';
  iterations_used: number;
  retry_limit: number;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  fixes: Fix[];
  timeline: TimelineEntry[];
  score: Score;
}

interface Fix {
  file: string;
  bug_type: 'LINTING' | 'SYNTAX' | 'LOGIC' | 'TYPE_ERROR' | 'IMPORT' | 'INDENTATION';
  line_number: number;
  commit_message: string;
  status: 'Fixed' | 'Failed';
}

interface TimelineEntry {
  iteration: number;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  timestamp: string; // ISO 8601
}

interface Score {
  baseScore: number;
  speedBonus: number;
  efficiencyPenalty: number;
  total: number;
}
```

---

## Error Handling

### Backend Error Handling

1. **API Level:**
   - Try-catch blocks around all async operations
   - Error middleware for unhandled errors
   - Structured error responses

2. **Agent Level:**
   - Individual agent error handling
   - Graceful degradation (e.g., Docker → local execution)
   - Error logging via Logger utility

3. **Storage:**
   - Run status updated on errors
   - Error messages stored in run object
   - Failed runs marked with error details

### Frontend Error Handling

1. **API Calls:**
   - Try-catch in Context API
   - Error state management
   - User-friendly error messages

2. **Component Level:**
   - Null checks before rendering
   - Empty state handling
   - Loading states

---

## Security Considerations

### Sandbox Security

1. **Docker Isolation:**
   - No network access (`NetworkMode: 'none'`)
   - Read-only volume mounts
   - Auto-removal after execution
   - Resource limits (can be added)

2. **Git Operations:**
   - Never pushes to main/master
   - Branch name validation
   - Commit message validation

3. **Input Validation:**
   - Repository URL validation
   - Team name/leader name sanitization
   - Retry limit bounds checking

### Environment Variables

- `GITHUB_TOKEN` - Stored securely, never logged
- `FRONTEND_URL` - CORS configuration
- `MAX_RETRIES` - Configurable limit

---

## Deployment Guide

### Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Environment Variables:**
   - `VITE_API_URL` - Backend API URL

### Backend Deployment (Railway/Render)

1. **Railway:**
   - Connect GitHub repository
   - Set root directory to `backend`
   - Add environment variables
   - Deploy

2. **Render:**
   - Create new Web Service
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables

### Environment Variables

**Backend:**
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
PORT=8000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
MAX_RETRIES=5
```

**Frontend:**
```bash
VITE_API_URL=https://your-backend.railway.app
```

---

## Testing Strategy

### Unit Tests

- Agent logic testing
- Utility function testing
- Output format validation
- Score calculation testing

### Integration Tests

- End-to-end agent workflow
- API endpoint testing
- Docker sandbox testing
- Git operations testing

### Manual Testing Checklist

- [ ] Repository cloning
- [ ] Test discovery
- [ ] Test execution
- [ ] Failure parsing
- [ ] Fix generation
- [ ] Fix application
- [ ] Git operations
- [ ] CI/CD monitoring
- [ ] Results.json generation
- [ ] Dashboard display

---

## Performance Considerations

1. **Non-blocking Execution:**
   - Agent runs in background
   - API returns immediately

2. **Polling Strategy:**
   - 3-second intervals
   - Stops when completed

3. **Resource Management:**
   - Workspace cleanup
   - Container auto-removal
   - Memory-efficient storage

---

## Known Limitations

1. **Rule-Based Fixes Only:**
   - No LLM integration
   - Limited fix types
   - Some bugs require manual review

2. **Project Type Support:**
   - Primarily Python (pytest)
   - Node.js (npm test)
   - Limited support for other frameworks

3. **CI/CD Detection:**
   - Requires GitHub Actions
   - May not detect all CI/CD systems

4. **Public Repositories:**
   - Optimized for public repos
   - Private repo support limited

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-19
