# Step-by-Step Build Guide — RIFT 2026 CI/CD Healing Agent

This guide walks you through building the project from zero. Do each step in order; each section ends with a **Checkpoint** so you can verify before moving on.

---

## Prerequisites (Do This First)

Before coding, install and verify:

| Tool | Purpose | How to check |
|------|---------|--------------|
| **Node.js** (v18+) | Frontend + optional backend | `node -v` |
| **Python** (3.10+) | Agent + backend API | `python --version` |
| **Git** | Clone repos, create branches | `git --version` |
| **Docker** | Sandbox for running tests | `docker --version` |
| **GitHub account** | Repo URL input, push branches | — |
| **VS Code / Cursor IDE** | Code editor | — |

**Additional Setup:**
- [ ] GitHub Personal Access Token (scopes: `repo`, `workflow`)
- [ ] OpenAI API Key or Claude API Key
- [ ] Vercel account (for frontend deployment)
- [ ] Railway/Render account (for backend deployment)

Create a new folder for the project (e.g. `Rift`) and open it in your editor.

---

## Phase 1: Project Structure and Repo (Steps 1–3)

### Step 1: Create the folder structure

In your project root, create these folders and files:

```
Rift/
├── frontend/          # React app (empty for now)
├── backend/           # API + agent trigger
├── agent/             # Multi-agent logic (or merge into backend/)
├── sandbox/           # Docker sandbox
├── docs/              # This guide + other docs
├── tests/             # Test files
├── README.md          # Main project readme (you'll fill later)
└── .gitignore         # Ignore node_modules, __pycache__, .env, etc.
```

**Detailed structure:**
```bash
mkdir -p frontend/src/{components,store,services,types}
mkdir -p backend/src/{agents,utils,api,config,langgraph}
mkdir -p tests/test_repositories
mkdir -p docs
mkdir -p docker
```

**Checkpoint:** You have 4 main folders (`frontend`, `backend`, `agent` or merged, `sandbox`) and a `docs` folder. Run `ls` or `dir` to verify.

---

### Step 2: Initialize version control

- Run `git init` in the project root.
- Add a `.gitignore` that includes:
  ```
  node_modules/
  __pycache__/
  .env
  *.pyc
  frontend/dist/
  frontend/build/
  backend/.venv/
  backend/venv/
  *.log
  results.json
  .DS_Store
  ```

**Checkpoint:** `git status` shows only your project files, not dependencies or secrets. Run `git status` to verify.

---

### Step 3: Document the architecture (for README and judges)

- In `docs/`, add a file `ARCHITECTURE.md` or keep the architecture diagram in the main README.
- Use a simple diagram:
  - **User** → React Dashboard (input: repo URL, team name, leader name).
  - **Dashboard** → Backend API (start run, get results).
  - **Backend** → Agent (orchestrator) → Sandbox (clone, run tests, apply fixes, commit, push).
  - **Agent** produces `results.json` → Backend serves it → Dashboard displays it.

**Checkpoint:** You can explain "user enters URL → agent runs in sandbox → results show on dashboard" in one sentence and one diagram.

---

## Phase 2: Sandbox (Steps 4–5)

The sandbox runs untrusted repo code in isolation.

### Step 4: Create a minimal Docker sandbox

- In `sandbox/` or `docker/`, create `Dockerfile`.
- Base image: e.g. `python:3.11-slim` or `node:20-slim` (or multi-stage if you need both).
- Install: `git`, and optionally `pytest` / `npm` for running tests.
- Set a working directory (e.g. `/workspace`).

**Example Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /workspace

# Install git and test tools
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir pytest pylint flake8 mypy

# Default command
CMD ["sleep", "infinity"]
```

**Checkpoint:** From project root, `docker build -t rift-sandbox ./sandbox` and `docker run --rm rift-sandbox git --version` both succeed.

---

### Step 5: Test "clone + list files" in the sandbox

- Write a small script (Python or shell) that:
  - Clones a public repo (e.g. a tiny GitHub repo) into `/workspace` inside the container.
  - Lists files (e.g. `ls` or `os.listdir`).
- Run this script via `docker run` or `docker exec`. Confirm you see the repo's files.

**Example Python script:**
```python
import git
import os

repo_url = "https://github.com/user/simple-repo"
repo_path = "/workspace/repo"
git.Repo.clone_from(repo_url, repo_path)
print(os.listdir(repo_path))
```

**Checkpoint:** You can clone any public GitHub URL inside Docker and see its contents. No code runs on your host.

---

## Phase 3: Agent Core (Steps 6–10)

### Step 6: Branch name utility (CRITICAL for hackathon)

- In `backend/src/utils/` or `agent/utils.py`, implement:

  **Rule:** UPPERCASE, spaces → `_`, suffix `_AI_Fix`, no other special characters.

**Implementation:**
```python
import re

def format_branch_name(team_name: str, leader_name: str) -> str:
    """
    Format branch name: TEAM_NAME_LEADER_NAME_AI_Fix
    """
    def sanitize(name: str) -> str:
        # Convert to uppercase
        name = name.upper()
        # Replace spaces with underscores
        name = name.replace(" ", "_")
        # Remove special characters except underscores
        name = re.sub(r"[^A-Z0-9_]", "", name)
        # Remove multiple consecutive underscores
        name = re.sub(r"_+", "_", name)
        # Remove leading/trailing underscores
        name = name.strip("_")
        return name
    
    team = sanitize(team_name)
    leader = sanitize(leader_name)
    branch_name = f"{team}_{leader}_AI_Fix"
    
    # Validate length (GitHub limit is 255)
    if len(branch_name) > 255:
        max_team_len = (255 - len(leader) - len("_AI_Fix") - 1) // 2
        team = team[:max_team_len]
        branch_name = f"{team}_{leader}_AI_Fix"
    
    return branch_name
```

- Add 2–3 unit tests: e.g. `("RIFT ORGANISERS", "Saiyam Kumar")` → `RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix`.

**Checkpoint:** Your branch name matches the hackathon examples exactly. Test with:
```python
assert format_branch_name("RIFT ORGANISERS", "Saiyam Kumar") == "RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix"
assert format_branch_name("Code Warriors", "John Doe") == "CODE_WARRIORS_JOHN_DOE_AI_Fix"
```

---

### Step 7: Test discovery (no hardcoded paths)

- In `backend/src/agents/discovery_agent.py`, add a module that, given a repo path:
  - Detects language (e.g. `package.json` → Node, `requirements.txt` or `pyproject.toml` → Python).
  - Looks for test commands: `package.json` scripts (`"test": "jest"`), `pytest.ini`, `tox.ini`, or files matching `test_*.py`, `*_test.py`, `*.test.js`.
  - Outputs a list of "test commands" to run (e.g. `["pytest"]` or `["npm", "test"]`).
- Do **not** hardcode full paths to specific test files; derive them from config and conventions.

**Implementation:**
```python
from pathlib import Path
import json
import os

def discover_test_files(repo_path: str) -> list[str]:
    """
    Discover test files and commands.
    """
    test_files = []
    repo = Path(repo_path)
    
    # Python detection
    if (repo / "requirements.txt").exists() or (repo / "pyproject.toml").exists():
        # Look for test files
        patterns = ["**/test_*.py", "**/*_test.py", "**/tests/**/*.py"]
        for pattern in patterns:
            test_files.extend(repo.glob(pattern))
        return [str(f) for f in test_files if f.is_file()]
    
    # JavaScript/Node detection
    if (repo / "package.json").exists():
        with open(repo / "package.json") as f:
            data = json.load(f)
            if "scripts" in data and "test" in data["scripts"]:
                # Return test command
                return ["npm", "test"]
    
    return []
```

**Checkpoint:** For a sample Python repo with pytest, your code suggests `pytest`; for a Node repo with `npm test`, it suggests `npm test`.

---

### Step 8: Run tests and capture output

- In the sandbox, run the test command(s) from Step 7 (e.g. `pytest --tb=short -v` or `npm test`).
- Capture: exit code, stdout, stderr.
- Parse the output to extract: **file path**, **line number**, **error message**. (Use regex or known formats: pytest, jest, etc.)
- Map each error to one of: **LINTING**, **SYNTAX**, **LOGIC**, **TYPE_ERROR**, **IMPORT**, **INDENTATION**.

**Implementation:**
```python
import subprocess
import re

def run_tests_in_sandbox(repo_path: str, test_command: list[str]) -> dict:
    """
    Run tests and capture output.
    """
    result = subprocess.run(
        test_command,
        cwd=repo_path,
        capture_output=True,
        text=True
    )
    
    return {
        "exit_code": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr
    }

def parse_test_failures(test_output: str) -> list[dict]:
    """
    Parse test output and extract failures.
    """
    bugs = []
    
    # Parse pytest output
    pattern = r"FAILED\s+(.+?\.py)::(.+?)::(.+?)\s+-+\s+(.+?)(?=FAILED|PASSED|===)"
    matches = re.finditer(pattern, test_output, re.DOTALL)
    
    for match in matches:
        file_path = match.group(1)
        line_match = re.search(r"line (\d+)", match.group(4))
        line_number = int(line_match.group(1)) if line_match else 0
        error_message = match.group(4)
        
        bug_type = categorize_bug(error_message)
        
        bugs.append({
            "file": file_path,
            "line_number": line_number,
            "bug_type": bug_type,
            "error_message": error_message
        })
    
    return bugs

def categorize_bug(error_message: str) -> str:
    """
    Categorize bug type.
    """
    error_lower = error_message.lower()
    
    if any(kw in error_lower for kw in ["unused", "lint", "flake8", "pylint"]):
        return "LINTING"
    elif any(kw in error_lower for kw in ["syntax", "parse", "invalid syntax", "missing colon"]):
        return "SYNTAX"
    elif any(kw in error_lower for kw in ["type", "typing", "type error"]):
        return "TYPE_ERROR"
    elif any(kw in error_lower for kw in ["import", "module not found", "cannot import"]):
        return "IMPORT"
    elif any(kw in error_lower for kw in ["indent", "indentation"]):
        return "INDENTATION"
    else:
        return "LOGIC"
```

**Checkpoint:** For a repo that has one known failure, your script prints something like: `file=src/utils.py, line=15, type=LINTING, message=...`.

---

### Step 9: Output format (exact match for judges)

- Create a single formatter function that, given `(file, line, bug_type, fix_description)`, returns:
  - `"{BUG_TYPE} error in {file} line {line} → Fix: {fix_description}"`
- Examples:
  - `LINTING error in src/utils.py line 15 → Fix: remove the import statement`
  - `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position`
- Use this function everywhere: agent output, `results.json`, and (if you echo to UI) dashboard. Never hand-type these strings elsewhere.

**Implementation:**
```python
def format_failure(file: str, line: int, bug_type: str, fix_description: str) -> str:
    """
    Format failure output: {BUG_TYPE} error in {file} line {line} → Fix: {fix_description}
    """
    # Validate bug type
    valid_types = ["LINTING", "SYNTAX", "LOGIC", "TYPE_ERROR", "IMPORT", "INDENTATION"]
    if bug_type not in valid_types:
        raise ValueError(f"Invalid bug type: {bug_type}. Must be one of {valid_types}")
    
    # Format output
    output = f"{bug_type} error in {file} line {line} → Fix: {fix_description}"
    
    return output
```

**Checkpoint:** Two example inputs produce exactly the two lines from the problem statement:
```python
assert format_failure("src/utils.py", 15, "LINTING", "remove the import statement") == \
    "LINTING error in src/utils.py line 15 → Fix: remove the import statement"
```

---

### Step 10: Fix generation and application

- **Fix generation:** Use an LLM (OpenAI / Anthropic / local) with a prompt that:
  - Takes file path, line number, error type, and raw error message.
  - Asks for a short fix description and, if needed, a code edit (patch or full snippet).
  - Instructs the model to use your exact "Fix: …" format in the description.
- **Apply fix:** In the sandbox, edit the file (e.g. with Python's file write or a patch library), then re-run tests.
- Track per-fix: **Fixed** or **Failed** (test still fails or new error).
- **Commit:** After applying fixes, run `git add`, `git commit -m "[AI-AGENT] <message>"`, and `git push origin <branch_name>`. Never push to `main`; only to the branch from Step 6.

**Implementation:**
```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import git

def generate_fix(bug: dict, file_content: str) -> str:
    """
    Generate fix using LLM.
    """
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert code fixer. Fix bugs in code. Return ONLY the fixed code, no explanations."),
        ("human", """Fix this bug:
        
        File: {file}
        Line: {line}
        Bug Type: {bug_type}
        Error: {error}
        
        Current code:
        {code}
        
        Return the fixed code:""")
    ])
    
    chain = prompt | llm
    response = chain.invoke({
        "file": bug["file"],
        "line": bug["line_number"],
        "bug_type": bug["bug_type"],
        "error": bug["error_message"],
        "code": file_content
    })
    
    return response.content

def apply_fix(file_path: str, fix_code: str):
    """
    Apply fix to file.
    """
    with open(file_path, "w") as f:
        f.write(fix_code)

def commit_and_push(repo_path: str, branch_name: str, fixes: list[dict]):
    """
    Commit fixes and push to branch.
    """
    repo = git.Repo(repo_path)
    
    # Create branch if not exists
    if branch_name not in [b.name for b in repo.branches]:
        branch = repo.create_head(branch_name)
    else:
        branch = repo.branches[branch_name]
    
    branch.checkout()
    
    # Commit each fix
    for fix in fixes:
        repo.index.add([fix["file"]])
        commit_message = f"[AI-AGENT] Fix {fix['bug_type']} in {fix['file']}: {fix['fix_description']}"
        repo.index.commit(commit_message)
    
    # Push to remote
    origin = repo.remote(name="origin")
    origin.push(branch_name)
```

**Checkpoint:** For one failing test, the agent produces one fix, applies it, commits with `[AI-AGENT]`, pushes to the correct branch name, and you see the commit on GitHub.

---

## Phase 4: Orchestrator and results.json (Steps 11–12)

### Step 11: Orchestrator loop and retry limit

- Implement the flow: Clone → Discover tests → Run tests → If failures and iterations < retry_limit (default 5): Analyze → Generate fixes → Apply → Commit & push → Run tests again; else exit.
- Store: run id, repo URL, team name, leader name, branch name, list of fixes (file, bugType, line, commitMessage, status), CI/CD timeline (each run: pass/fail, timestamp), total time, commit count.
- **Config:** Retry limit (e.g. 5) from env or config file.

**Implementation:**
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    repo_url: str
    team_name: str
    leader_name: str
    repo_path: str
    test_files: list[str]
    bugs: list[dict]
    fixes: list[dict]
    branch_name: str
    cicd_status: str
    iteration: int
    max_iterations: int

def create_workflow():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("discovery", discovery_agent)
    workflow.add_node("analysis", analysis_agent)
    workflow.add_node("fixing", fixing_agent)
    workflow.add_node("testing", testing_agent)
    workflow.add_node("git_ops", git_ops_agent)
    workflow.add_node("cicd_monitor", cicd_monitor_agent)
    
    workflow.set_entry_point("discovery")
    workflow.add_edge("discovery", "analysis")
    workflow.add_edge("analysis", "fixing")
    workflow.add_edge("fixing", "testing")
    workflow.add_edge("testing", "git_ops")
    workflow.add_edge("git_ops", "cicd_monitor")
    
    # Conditional edge for retry
    workflow.add_conditional_edges(
        "cicd_monitor",
        should_retry,
        {
            "retry": "analysis",
            "complete": END
        }
    )
    
    return workflow.compile()

def should_retry(state: AgentState) -> str:
    if state["cicd_status"] == "FAILED" and state["iteration"] < state["max_iterations"]:
        return "retry"
    return "complete"
```

**Checkpoint:** Running the orchestrator on a repo with 2 failures ends after 1 or 2 iterations (or hit limit) and you have a structured object with all runs and fixes.

---

### Step 12: Generate results.json

- At the end of each run, write a `results.json` (in memory or to a file the API can serve) with:
  - `repoUrl`, `teamName`, `teamLeader`, `branchName`
  - `totalFailuresDetected`, `totalFixesApplied`, `finalCiCdStatus` ("PASSED" | "FAILED")
  - `totalTimeMs` (or seconds)
  - `score`: `baseScore` (100), `speedBonus` (+10 if time < 5 min), `efficiencyPenalty` (−2 per commit over 20), `total`
  - `fixes`: array of `{ file, bugType, lineNumber, commitMessage, status }`
  - `ciCdTimeline`: array of `{ iteration, status, timestamp }`
- Add a simple test that builds this JSON from mock data and assert keys and types.

**Implementation:**
```python
import json
from datetime import datetime

def calculate_score(total_time_ms: int, commit_count: int) -> dict:
    """
    Calculate score: base 100, speed bonus +10 if < 5 min, efficiency penalty -2 per commit over 20.
    """
    base_score = 100
    speed_bonus = 10 if total_time_ms < 300000 else 0  # 5 minutes = 300000 ms
    efficiency_penalty = max(0, (commit_count - 20) * 2)
    total = base_score + speed_bonus - efficiency_penalty
    
    return {
        "baseScore": base_score,
        "speedBonus": speed_bonus,
        "efficiencyPenalty": efficiency_penalty,
        "total": max(0, total)  # Minimum 0
    }

def generate_results_json(run_data: dict) -> dict:
    """
    Generate results.json with all required fields.
    """
    score = calculate_score(run_data["total_time_ms"], run_data["commit_count"])
    
    return {
        "repoUrl": run_data["repo_url"],
        "teamName": run_data["team_name"],
        "teamLeader": run_data["leader_name"],
        "branchName": run_data["branch_name"],
        "totalFailuresDetected": len(run_data["bugs"]),
        "totalFixesApplied": len(run_data["fixes"]),
        "finalCiCdStatus": run_data["cicd_status"],
        "totalTimeMs": run_data["total_time_ms"],
        "score": score,
        "fixes": [
            {
                "file": fix["file"],
                "bugType": fix["bug_type"],
                "lineNumber": fix["line_number"],
                "commitMessage": fix["commit_message"],
                "status": fix["status"]
            }
            for fix in run_data["fixes"]
        ],
        "ciCdTimeline": [
            {
                "iteration": run["iteration"],
                "status": run["status"],
                "timestamp": run["timestamp"].isoformat()
            }
            for run in run_data["cicd_runs"]
        ]
    }

# Save to file
def save_results_json(results: dict, file_path: str = "results.json"):
    with open(file_path, "w") as f:
        json.dump(results, f, indent=2)
```

**Checkpoint:** One run produces one `results.json` that matches the schema the dashboard expects. Validate with:
```python
import json
with open("results.json") as f:
    data = json.load(f)
    assert "repoUrl" in data
    assert "score" in data
    assert "fixes" in data
```

---

## Phase 5: Backend API (Steps 13–14)

### Step 13: REST API to trigger agent and get results

- In `backend/src/api/main.py`, create an API (e.g. FastAPI):
  - `POST /api/run`: body `{ repoUrl, teamName, teamLeader }`. Start the agent in a background thread/process or task queue; return `{ runId }`.
  - `GET /api/runs/<runId>`: return run status (running / completed / failed) and, when completed, the full results (same as results.json).
  - Optionally `GET /api/runs/<runId>/results.json` that returns the raw JSON.
- Store runs in a dict keyed by `runId` (or use SQLite/Redis if you prefer). When the agent finishes, update that run with the results.

**Implementation:**
```python
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uuid
import asyncio

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (use DB in production)
runs = {}

@app.post("/api/run")
async def start_run(request: dict, background_tasks: BackgroundTasks):
    """
    Start agent run.
    """
    run_id = str(uuid.uuid4())
    
    # Start agent in background
    background_tasks.add_task(run_agent_workflow, run_id, request)
    
    runs[run_id] = {
        "runId": run_id,
        "status": "started",
        "request": request
    }
    
    return {"runId": run_id, "status": "started"}

@app.get("/api/runs/{run_id}")
async def get_run_status(run_id: str):
    """
    Get run status and results.
    """
    if run_id not in runs:
        return {"error": "Run not found"}, 404
    
    return runs[run_id]

@app.get("/api/runs/{run_id}/results.json")
async def get_results_json(run_id: str):
    """
    Get raw results.json.
    """
    if run_id not in runs or "results" not in runs[run_id]:
        return {"error": "Results not available"}, 404
    
    return runs[run_id]["results"]

async def run_agent_workflow(run_id: str, request: dict):
    """
    Run agent workflow in background.
    """
    try:
        # Run orchestrator
        results = await orchestrator.run(request)
        
        # Update run status
        runs[run_id]["status"] = "completed"
        runs[run_id]["results"] = results
    except Exception as e:
        runs[run_id]["status"] = "failed"
        runs[run_id]["error"] = str(e)
```

**Checkpoint:** You can `curl -X POST .../api/run` with a repo URL and then `curl .../api/runs/<runId>` to get status and finally the full results.

---

### Step 14: CORS and environment

- Enable CORS for your frontend origin (e.g. `http://localhost:5173` in dev, and your Vercel URL in prod).
- Use environment variables for: API port, retry limit, LLM API keys, and (for frontend) the backend API base URL.

**Environment Variables:**
```bash
# Backend .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx
MAX_RETRIES=5
API_PORT=8000
FRONTEND_URL=http://localhost:3000

# Frontend .env
REACT_APP_API_URL=http://localhost:8000
```

**Checkpoint:** From a browser on another port, the frontend can call the API without CORS errors. Test with browser DevTools Network tab.

---

## Phase 6: React Dashboard (Steps 15–19)

### Step 15: Create React app and state

- In `frontend/`, create the app (`npm create vite@latest . -- --template react` or `npx create-react-app . --template typescript`). Use **functional components and hooks**.
- Set up state (Context API or Zustand): e.g. `runId`, `status`, `results`, `loading`, `error`. One place to store the latest run's data.

**Setup:**
```bash
cd frontend
npx create-react-app . --template typescript
npm install zustand axios recharts @mui/material @emotion/react @emotion/styled
```

**State Management (Zustand):**
```typescript
// frontend/src/store/useRunStore.ts
import create from 'zustand';

interface RunState {
  currentRun: RunData | null;
  isLoading: boolean;
  error: string | null;
  startRun: (repoUrl: string, teamName: string, leaderName: string) => Promise<void>;
  fetchStatus: (runId: string) => Promise<void>;
}

export const useRunStore = create<RunState>((set, get) => ({
  currentRun: null,
  isLoading: false,
  error: null,
  startRun: async (repoUrl, teamName, leaderName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, teamName, teamLeader: leaderName })
      });
      const data = await response.json();
      // Start polling
      get().fetchStatus(data.runId);
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
  fetchStatus: async (runId) => {
    // Poll until completed
    const poll = async () => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/runs/${runId}`);
      const data = await response.json();
      if (data.status === 'completed' || data.status === 'failed') {
        set({ currentRun: data.results, isLoading: false });
      } else {
        setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };
    poll();
  }
}));
```

**Checkpoint:** App runs with `npm run dev` and you have a global state that can hold `results` and `loading`.

---

### Step 16: Input section

- Add:
  - Text input: GitHub repository URL
  - Text input: Team Name
  - Text input: Team Leader Name
  - Button: "Run Agent" or "Analyze Repository"
  - Loading indicator (spinner or disabled button) while the run is in progress
- On submit: `POST /api/run` with the three values, get `runId`, then poll `GET /api/runs/<runId>` until status is completed or failed; then put the response into state.

**Component:**
```typescript
// frontend/src/components/InputSection/InputSection.tsx
import { useState } from 'react';
import { useRunStore } from '../../store/useRunStore';

const InputSection = () => {
  const { startRun, isLoading } = useRunStore();
  const [repoUrl, setRepoUrl] = useState('');
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  
  const handleSubmit = async () => {
    await startRun(repoUrl, teamName, leaderName);
  };
  
  return (
    <Card>
      <TextField 
        label="GitHub Repo URL" 
        value={repoUrl} 
        onChange={(e) => setRepoUrl(e.target.value)} 
      />
      <TextField 
        label="Team Name" 
        value={teamName} 
        onChange={(e) => setTeamName(e.target.value)} 
      />
      <TextField 
        label="Team Leader Name" 
        value={leaderName} 
        onChange={(e) => setLeaderName(e.target.value)} 
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? <CircularProgress /> : 'Run Agent'}
      </Button>
    </Card>
  );
};
```

**Checkpoint:** Entering URL and team/leader and clicking the button starts a run and shows loading until the run finishes (or fails).

---

### Step 17: Run Summary and Score Breakdown

- **Run Summary card:** Show repo URL, team name, team leader name, branch name, total failures, total fixes, final CI/CD status badge (green PASSED / red FAILED), total time. All from `results`.
- **Score breakdown:** Base 100, speed bonus +10 if time < 5 min, efficiency penalty −2 per commit over 20. Show formula and final total; use a simple progress bar or bar chart for the breakdown.

**Checkpoint:** After a run, the summary card and score panel show correct numbers and the right badge color.

---

### Step 18: Fixes table and CI/CD timeline

- **Fixes table:** Columns: File, Bug Type, Line Number, Commit Message, Status. Status: ✓ Fixed (green) / ✗ Failed (red). Bug types: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION.
- **CI/CD timeline:** List each run: pass/fail badge, "iteration K/5", timestamp.

**Checkpoint:** Table and timeline render from `results.fixes` and `results.ciCdTimeline` with correct styling.

---

### Step 19: Responsive layout and deployment prep

- Make the layout responsive (grid/flex, breakpoints for mobile).
- Set the API base URL via env (e.g. `VITE_API_URL` or `REACT_APP_API_URL`). Build with `npm run build` and ensure the build uses the production API URL.

**Checkpoint:** Dashboard works on a narrow viewport and builds without errors.

---

## Phase 7: Deployment and Submission (Steps 20–22)

### Step 20: Deploy backend and frontend

- Deploy backend to Railway, Render, or similar; note the public API URL.
- Deploy frontend to Vercel or Netlify; set the env var for API URL to your backend URL. Frontend code must live in `/frontend` in the repo.

**Checkpoint:** The live site accepts a GitHub URL and team/leader, runs the agent, and shows results (using your deployed backend).

---

### Step 21: README and docs

- **README.md** must include:
  - Project title
  - Deployment URL (live dashboard)
  - LinkedIn video URL (placeholder until you record)
  - Architecture diagram (from Step 3)
  - Installation instructions (clone, install deps for backend + frontend + agent)
  - Environment setup (env vars for API keys, retry limit, etc.)
  - Usage (open dashboard → enter URL, team name, leader → Run Agent)
  - Supported bug types (list the six)
  - Tech stack (React, FastAPI/Node, LangGraph/CrewAI/AutoGen, Docker, etc.)
  - Known limitations
  - Team members

**Checkpoint:** A new teammate can follow the README to install and run the project locally.

---

### Step 22: LinkedIn video and final checklist

- Record a 2–3 minute video: live demo (enter URL, run agent, show dashboard), architecture diagram, agent workflow, results. Post on LinkedIn, tag @RIFT2026, set to public.
- Final checklist:
  - [ ] Live deployment URL works
  - [ ] No hardcoded test file paths
  - [ ] All commits use `[AI-AGENT]` prefix
  - [ ] Branch name format exactly `TEAM_NAME_LEADER_AI_Fix`
  - [ ] No push to main
  - [ ] Output format matches test cases (LINTING/SYNTAX … → Fix: …)
  - [ ] README complete, video linked, team listed

**Checkpoint:** You're ready to submit the repo URL, live app URL, and LinkedIn video link on the RIFT website.

---

## Quick Reference: Branch Name and Output Format

**Branch name:**  
`TEAM_NAME_LEADER_NAME_AI_Fix` — all uppercase, spaces → `_`, no special chars except `_`.

**Failure line format:**  
`{LINTING|SYNTAX|LOGIC|TYPE_ERROR|IMPORT|INDENTATION} error in {file} line {line} → Fix: {description}`

**Commit message:**  
Every commit must start with `[AI-AGENT]`.

**See [TEST_CASE_OUTPUT_FORMAT.md](./TEST_CASE_OUTPUT_FORMAT.md) for detailed format specifications.**

---

Good luck building. If you get stuck, focus on the **Checkpoint** for that step and the next section of this guide.
