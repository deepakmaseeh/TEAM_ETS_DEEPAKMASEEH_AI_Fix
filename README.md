# Autonomous CI/CD Healing Agent with React Dashboard

**RIFT 2026 Hackathon - AI/ML · DevOps Automation · Agentic Systems Track**

---

## 🚀 Live Deployment

- **Live Application URL:** [To be deployed - Vercel/Netlify]
- **LinkedIn Demo Video:** [To be posted - 2-3 min, tag @RIFT2026]
- **GitHub Repository:** [Your repository URL]

---

## 📋 Project Overview

An autonomous DevOps agent that clones GitHub repositories, discovers and runs tests, identifies failures, generates rule-based fixes, commits changes with proper naming conventions, and monitors CI/CD pipelines. All results are displayed in a production-ready React dashboard.

**Team:** Team ETS  
**Team Leader:** Deepakmaseeh  
**Branch Format:** `TEAM_ETS_DEEPAKMASEEH_AI_Fix`  
**Commit Prefix:** `[AI-AGENT]`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard (Frontend)                │
│  - Input Section (Repo URL, Team Name, Leader Name)        │
│  - Run Summary Card                                         │
│  - Score Breakdown Panel                                    │
│  - Fixes Applied Table                                      │
│  - CI/CD Status Timeline                                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Server (Express/Node.js)             │
│  - POST /run-agent (Start agent run)                        │
│  - GET /runs/:id/status (Get run status)                    │
│  - GET /runs/:id/results (Get results.json)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Multi-Agent Orchestration (CoordinatorAgent)         │
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
│              Docker Sandbox Execution Environment            │
│  - Isolated code execution                                  │
│  - Test runner (pytest, jest, etc.)                        │
│  - No network access                                        │
└─────────────────────────────────────────────────────────────┘
```

### Agent Workflow

1. **RepoAnalyzerAgent**: Clones repository, detects project type (Python/Node), discovers test files
2. **TestRunnerAgent**: Runs tests in Docker sandbox, parses output, categorizes failures
3. **FixGeneratorAgent**: Applies rule-based fixes (NO LLMs) for detected bug types
4. **CommitAgent**: Sets up git repository, creates branch `TEAM_ETS_DEEPAKMASEEH_AI_Fix`, commits with `[AI-AGENT]` prefix
5. **CICDMonitorAgent**: Monitors CI/CD pipeline status via GitHub API
6. **CoordinatorAgent**: Orchestrates all agents, handles retry logic (max 5 iterations)

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js v18+ 
- Python 3.11+ (for sandbox)
- Docker Desktop
- Git
- GitHub Personal Access Token (with `repo` scope)

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN

# Start backend server
npm run dev
# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file (optional)
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Docker Setup

```bash
# Build sandbox image
docker build -t rift-sandbox-python ./backend

# Or use docker-compose
docker-compose up -d
```

---

## 🚀 Usage

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Dashboard:**
   - Navigate to `http://localhost:5173`
   - Enter GitHub repository URL
   - Enter Team Name: `Team ETS`
   - Enter Team Leader: `Deepakmaseeh`
   - Click "Run Agent"

4. **Monitor Progress:**
   - Dashboard updates in real-time
   - View run summary, score breakdown, fixes applied, and CI/CD timeline
   - Results are saved as `results.json` in workspace directory

---

## 🐛 Supported Bug Types

The agent can detect and fix the following bug types using rule-based fixes:

1. **LINTING** - Removes unused imports
2. **SYNTAX** - Adds missing colons, fixes syntax errors
3. **TYPE_ERROR** - Type-related errors (detected, manual review may be needed)
4. **IMPORT** - Broken import statements
5. **INDENTATION** - Normalizes indentation to 4 spaces
6. **LOGIC** - Logic errors (detected, manual review may be needed)

### Output Format

The agent produces output in the exact format required:

```
LINTING error in src/utils.py line 15 → Fix: remove the import statement
SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position
```

---

## 📊 Scoring Model

- **Base Score:** 100 points
- **Speed Bonus:** +10 points if total time < 5 minutes
- **Efficiency Penalty:** -2 points per commit over 20 commits
- **Total Score:** `baseScore + speedBonus - efficiencyPenalty` (minimum 0)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (functional components, hooks)
- **Vite** (build tool)
- **Context API** (state management)
- **Axios** (HTTP client)

### Backend
- **Node.js** (runtime)
- **Express** (web framework)
- **Dockerode** (Docker API)
- **simple-git** (Git operations)
- **dockerode** (Docker integration)

### Infrastructure
- **Docker** (sandboxed execution)
- **GitHub API** (CI/CD monitoring)

---

## 📁 Project Structure

```
Rift/
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── components/       # Dashboard components
│   │   ├── context/         # Context API
│   │   └── App.jsx
│   └── package.json
├── backend/                  # Express API + Agents
│   ├── src/
│   │   ├── agents/          # Multi-agent architecture
│   │   │   ├── coordinatorAgent.js
│   │   │   ├── repoAnalyzerAgent.js
│   │   │   ├── testRunnerAgent.js
│   │   │   ├── fixGeneratorAgent.js
│   │   │   ├── commitAgent.js
│   │   │   └── cicdMonitorAgent.js
│   │   ├── utils/           # Utilities
│   │   │   ├── constants.js
│   │   │   ├── gitUtils.js
│   │   │   ├── outputFormatter.js
│   │   │   └── scoring.js
│   │   └── index.js         # Express server
│   ├── Dockerfile           # Sandbox image
│   └── package.json
├── docker-compose.yml       # Docker orchestration
├── workspace/              # Cloned repositories (gitignored)
└── README.md
```

---

## 🔒 Git Operations

### Branch Naming
- **Format:** `TEAM_ETS_DEEPAKMASEEH_AI_Fix`
- **Rules:** All uppercase, underscores, suffix `_AI_Fix`
- **Never pushes to main/master**

### Commit Messages
- **Format:** `[AI-AGENT] Fix {BUG_TYPE} in {file}: {description}`
- **Example:** `[AI-AGENT] Fix LINTING in src/utils.py: remove unused import`

---

## 📄 Results.json Schema

Each run produces a `results.json` file with:

```json
{
  "repo_url": "string",
  "team_name": "Team ETS",
  "leader_name": "Deepakmaseeh",
  "branch": "TEAM_ETS_DEEPAKMASEEH_AI_Fix",
  "total_failures": "number",
  "fixes_applied": "number",
  "ci_status": "PASSED" | "FAILED",
  "iterations_used": "number",
  "retry_limit": 5,
  "start_time": "ISO 8601",
  "end_time": "ISO 8601",
  "fixes": [
    {
      "file": "string",
      "bug_type": "LINTING" | "SYNTAX" | ...,
      "line_number": "number",
      "commit_message": "string",
      "status": "Fixed" | "Failed"
    }
  ],
  "timeline": [
    {
      "iteration": "number",
      "status": "PASSED" | "FAILED",
      "timestamp": "ISO 8601"
    }
  ],
  "score": {
    "baseScore": 100,
    "speedBonus": 0 | 10,
    "efficiencyPenalty": "number",
    "total": "number"
  }
}
```

---

## ⚠️ Known Limitations

1. **Rule-Based Fixes Only:** No LLM integration - fixes are deterministic and rule-based
2. **Limited Bug Types:** Some complex bugs may require manual review
3. **Python/Node.js Focus:** Primarily supports Python (pytest) and Node.js (npm test) projects
4. **CI/CD Detection:** Requires GitHub Actions to be configured in the repository
5. **Public Repositories:** Currently optimized for public repositories
6. **Network Isolation:** Sandbox has no network access for security

---

## 👥 Team Members

- **Team Name:** Team ETS
- **Team Leader:** Deepakmaseeh
- **Members:** [Add other team members if applicable]

---

## 📝 License

MIT License

---

## 🙏 Acknowledgments

Built for RIFT 2026 Hackathon - AI/ML · DevOps Automation · Agentic Systems Track

---

**Last Updated:** 2026-02-19
