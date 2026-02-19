# Debugging Guide
## Common Issues & Solutions for CI/CD Healing Agent

---

## 🐛 Common Issues by Category

### 1. Repository Cloning Issues

#### Issue: "Repository not found" or "Authentication failed"
**Symptoms:**
- Error when cloning private repositories
- 401/403 errors from GitHub API

**Solutions:**
```python
# Check 1: Verify token is set
import os
token = os.getenv("GITHUB_TOKEN")
if not token:
    raise Exception("GITHUB_TOKEN not set")

# Check 2: Format URL correctly
if token:
    repo_url = repo_url.replace(
        "https://github.com/",
        f"https://{token}@github.com/"
    )

# Check 3: Use SSH if HTTPS fails
if repo_url.startswith("https://"):
    repo_url = repo_url.replace("https://github.com/", "git@github.com:")
    repo_url = repo_url.replace(".git", "") + ".git"
```

**Debug Steps:**
1. Test token: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user`
2. Check repository visibility (public/private)
3. Verify token has `repo` scope

---

#### Issue: "Clone timeout" or "Connection refused"
**Symptoms:**
- Clone operation hangs
- Network timeout errors

**Solutions:**
```python
# Add timeout
import git
from git import RemoteProgress

class CloneProgress(RemoteProgress):
    def update(self, op_code, cur_count, max_count=None, message=''):
        print(f"Cloning: {cur_count}/{max_count} - {message}")

try:
    repo = git.Repo.clone_from(
        repo_url,
        repo_path,
        progress=CloneProgress(),
        timeout=300  # 5 minutes
    )
except git.exc.GitCommandError as e:
    print(f"Clone failed: {e}")
    # Retry with different method
```

**Debug Steps:**
1. Check internet connection
2. Verify GitHub is accessible
3. Try cloning manually: `git clone <url>`
4. Check firewall/proxy settings

---

### 2. Test Discovery Issues

#### Issue: "No test files found"
**Symptoms:**
- Discovery agent returns empty list
- Tests exist but not detected

**Solutions:**
```python
# Enhanced discovery with multiple patterns
def discover_test_files(repo_path: str) -> List[str]:
    test_files = []
    
    # Python patterns
    python_patterns = [
        "**/test_*.py",
        "**/*_test.py",
        "**/tests/**/*.py",
        "**/test/**/*.py",
    ]
    
    # JavaScript patterns
    js_patterns = [
        "**/__tests__/**/*.{js,jsx,ts,tsx}",
        "**/*.test.{js,jsx,ts,tsx}",
        "**/*.spec.{js,jsx,ts,tsx}",
        "**/tests/**/*.{js,jsx,ts,tsx}",
    ]
    
    # Check package.json for test script
    package_json = Path(repo_path) / "package.json"
    if package_json.exists():
        import json
        with open(package_json) as f:
            data = json.load(f)
            if "scripts" in data and "test" in data["scripts"]:
                # Add test directory from package.json
                pass
    
    # Check pytest.ini or setup.cfg
    pytest_ini = Path(repo_path) / "pytest.ini"
    if pytest_ini.exists():
        # Parse pytest.ini for test paths
        pass
    
    return test_files
```

**Debug Steps:**
1. Manually check repository structure
2. List all files: `find . -name "*.py" -o -name "*.js"`
3. Check test configuration files
4. Add logging to see what patterns match

---

#### Issue: "Wrong test files detected"
**Symptoms:**
- Non-test files included
- Test files missed

**Solutions:**
```python
# Filter out non-test files
def is_test_file(file_path: str) -> bool:
    """
    Check if file is actually a test file.
    """
    # Exclude certain directories
    exclude_dirs = ["node_modules", ".git", "venv", "__pycache__"]
    if any(exclude in file_path for exclude in exclude_dirs):
        return False
    
    # Check file name patterns
    filename = Path(file_path).name
    test_patterns = [
        "test_", "_test", ".test.", ".spec.",
        "__tests__"
    ]
    
    if any(pattern in filename for pattern in test_patterns):
        return True
    
    # Check directory name
    if "__tests__" in file_path or "tests" in Path(file_path).parent.name:
        return True
    
    return False
```

---

### 3. Test Execution Issues

#### Issue: "Tests fail to run in Docker"
**Symptoms:**
- Docker container fails to start
- Tests don't execute
- Permission errors

**Solutions:**
```python
# Enhanced Docker setup
def create_dockerfile(project_type: str) -> str:
    if project_type == "python":
        return """
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir pytest pylint flake8 mypy

# Copy code
COPY . /app

# Run tests
CMD ["pytest", "-v", "--tb=short"]
"""
    elif project_type == "javascript":
        return """
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy code
COPY . /app

# Run tests
CMD ["npm", "test"]
"""

# Run with proper permissions
def run_tests_safely(repo_path: str):
    client = docker.from_env()
    
    container = client.containers.run(
        "test-runner",
        detach=True,
        volumes={repo_path: {"bind": "/app", "mode": "ro"}},
        mem_limit="512m",  # Limit memory
        cpu_period=100000,
        cpu_quota=50000,  # Limit CPU
        network_disabled=True,  # Disable network for security
        remove=True  # Auto-remove after run
    )
    
    # Wait for completion
    result = container.wait(timeout=300)
    
    # Get logs
    logs = container.logs().decode("utf-8")
    
    return logs
```

**Debug Steps:**
1. Test Docker installation: `docker run hello-world`
2. Check Dockerfile syntax
3. Test container manually: `docker build -t test-runner .`
4. Check logs: `docker logs <container_id>`
5. Verify file permissions

---

#### Issue: "Test output parsing fails"
**Symptoms:**
- Can't extract failure information
- Wrong line numbers
- Missing error messages

**Solutions:**
```python
# Robust parsing with multiple formats
def parse_pytest_output(output: str) -> List[Bug]:
    bugs = []
    
    # Pattern 1: Standard pytest format
    pattern1 = r"FAILED\s+(.+?\.py)::(.+?)::(.+?)\s+-+\s+(.+?)(?=FAILED|PASSED|===)"
    
    # Pattern 2: With line numbers
    pattern2 = r"(.+?\.py):(\d+):\s+(.+?)\s+FAILED"
    
    # Pattern 3: Error details
    pattern3 = r"E\s+(.+?\.py):(\d+):\s+(.+?)(?=\n\s+E|\nFAILED|\n===)"
    
    for pattern in [pattern1, pattern2, pattern3]:
        matches = re.finditer(pattern, output, re.DOTALL | re.MULTILINE)
        for match in matches:
            file_path = match.group(1)
            line_number = int(match.group(2)) if len(match.groups()) > 1 else 0
            error_message = match.group(-1)  # Last group is usually error
            
            bugs.append(Bug(
                file=file_path,
                line_number=line_number,
                bug_type=categorize_bug(error_message),
                error_message=error_message
            ))
    
    return bugs

# Add logging for debugging
import logging
logger = logging.getLogger(__name__)

def parse_with_logging(output: str):
    logger.debug(f"Parsing output:\n{output}")
    bugs = parse_pytest_output(output)
    logger.info(f"Found {len(bugs)} bugs")
    for bug in bugs:
        logger.debug(f"Bug: {bug.file}:{bug.line_number} - {bug.bug_type}")
    return bugs
```

**Debug Steps:**
1. Save raw test output to file
2. Manually verify parsing patterns
3. Test with different test frameworks
4. Add detailed logging

---

### 4. LLM/Fix Generation Issues

#### Issue: "LLM API rate limit exceeded"
**Symptoms:**
- 429 errors from OpenAI/Claude
- Requests fail intermittently

**Solutions:**
```python
import time
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=4, max=60)
)
def generate_fix_with_retry(bug: Bug, file_content: str) -> str:
    """
    Generate fix with exponential backoff retry.
    """
    try:
        return generate_fix(bug, file_content)
    except Exception as e:
        if "rate limit" in str(e).lower() or "429" in str(e):
            logger.warning(f"Rate limit hit, retrying...")
            raise  # Retry will handle this
        else:
            raise

# Alternative: Use local LLM as fallback
def generate_fix_with_fallback(bug: Bug, file_content: str) -> str:
    try:
        return generate_fix_openai(bug, file_content)
    except Exception as e:
        if "rate limit" in str(e).lower():
            logger.info("Falling back to local LLM")
            return generate_fix_local(bug, file_content)
        raise
```

**Debug Steps:**
1. Check API key validity
2. Monitor API usage dashboard
3. Implement request queuing
4. Use local LLM (Ollama) as backup

---

#### Issue: "LLM generates invalid fixes"
**Symptoms:**
- Fixes don't compile
- Fixes don't address the bug
- Syntax errors in generated code

**Solutions:**
```python
def generate_and_validate_fix(bug: Bug, file_content: str) -> str:
    """
    Generate fix and validate it.
    """
    max_attempts = 3
    for attempt in range(max_attempts):
        fix = generate_fix(bug, file_content)
        
        # Validate syntax
        if validate_syntax(fix, bug.file):
            # Test if fix addresses the bug
            if test_fix(fix, bug):
                return fix
            else:
                logger.warning(f"Fix doesn't address bug, attempt {attempt + 1}")
        else:
            logger.warning(f"Invalid syntax, attempt {attempt + 1}")
    
    # Fallback: Use rule-based fix
    return generate_rule_based_fix(bug, file_content)

def validate_syntax(code: str, file_path: str) -> bool:
    """
    Validate code syntax.
    """
    if file_path.endswith(".py"):
        import ast
        try:
            ast.parse(code)
            return True
        except SyntaxError:
            return False
    elif file_path.endswith((".js", ".ts")):
        # Use ESLint or TypeScript compiler
        pass
    return True

def generate_rule_based_fix(bug: Bug, file_content: str) -> str:
    """
    Fallback rule-based fixes for common issues.
    """
    lines = file_content.split("\n")
    
    if bug.bug_type == "LINTING" and "unused import" in bug.error_message.lower():
        # Remove unused import
        import_name = extract_import_name(bug.error_message)
        lines = [l for l in lines if import_name not in l]
        return "\n".join(lines)
    
    elif bug.bug_type == "SYNTAX" and "missing colon" in bug.error_message.lower():
        # Add colon
        line_idx = bug.line_number - 1
        if line_idx < len(lines):
            lines[line_idx] = lines[line_idx].rstrip() + ":"
        return "\n".join(lines)
    
    # Add more rule-based fixes
    return file_content
```

**Debug Steps:**
1. Log all LLM responses
2. Test fixes before applying
3. Implement validation layer
4. Use rule-based fallbacks

---

### 5. Git Operations Issues

#### Issue: "Branch name format incorrect"
**Symptoms:**
- Branch name doesn't match required format
- Special characters in branch name
- Case sensitivity issues

**Solutions:**
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
        # Truncate if needed
        max_team_len = (255 - len(leader) - len("_AI_Fix") - 1) // 2
        team = team[:max_team_len]
        branch_name = f"{team}_{leader}_AI_Fix"
    
    # Final validation
    assert re.match(r"^[A-Z0-9_]+_AI_Fix$", branch_name), f"Invalid branch name: {branch_name}"
    
    return branch_name

# Test function
def test_branch_naming():
    assert format_branch_name("RIFT ORGANISERS", "Saiyam Kumar") == "RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix"
    assert format_branch_name("Code Warriors", "John Doe") == "CODE_WARRIORS_JOHN_DOE_AI_Fix"
    assert format_branch_name("Team-1", "Jane O'Brien") == "TEAM_1_JANE_OBRIEN_AI_Fix"
```

**Debug Steps:**
1. Test with various team/leader names
2. Check for special characters
3. Verify uppercase conversion
4. Test edge cases (very long names, special chars)

---

#### Issue: "Commit prefix missing or incorrect"
**Symptoms:**
- Commits don't have `[AI-AGENT]` prefix
- Format is inconsistent

**Solutions:**
```python
def create_commit_message(bug: Bug, fix: Fix) -> str:
    """
    Create commit message with [AI-AGENT] prefix.
    """
    # Extract fix description
    if fix.description:
        message = fix.description
    else:
        # Generate from bug
        message = f"Fix {bug.bug_type.lower()} error in {Path(bug.file).name}"
    
    # Ensure prefix
    if not message.startswith("[AI-AGENT]"):
        message = f"[AI-AGENT] {message}"
    
    # Validate format
    assert message.startswith("[AI-AGENT]"), f"Commit message missing prefix: {message}"
    
    return message

# Validate before committing
def validate_commit_message(message: str):
    if not message.startswith("[AI-AGENT]"):
        raise ValueError(f"Commit message must start with [AI-AGENT]: {message}")
    if len(message) > 72:  # Git best practice
        logger.warning(f"Commit message is long: {len(message)} characters")
```

**Debug Steps:**
1. Check all commits after push
2. Verify prefix in commit history
3. Add validation before commit
4. Log all commit messages

---

#### Issue: "Push to wrong branch or main"
**Symptoms:**
- Changes pushed to main branch
- Branch not created properly

**Solutions:**
```python
def safe_git_operations(repo_path: str, team_name: str, leader_name: str, fixes: List[Fix]):
    """
    Safe git operations with validation.
    """
    repo = git.Repo(repo_path)
    
    # Get current branch
    current_branch = repo.active_branch.name
    if current_branch == "main" or current_branch == "master":
        raise Exception("Cannot work on main/master branch!")
    
    # Create new branch
    branch_name = format_branch_name(team_name, leader_name)
    
    # Check if branch already exists
    if branch_name in [b.name for b in repo.branches]:
        logger.warning(f"Branch {branch_name} already exists, checking it out")
        branch = repo.branches[branch_name]
    else:
        branch = repo.create_head(branch_name)
    
    # Checkout branch
    branch.checkout()
    
    # Verify we're on correct branch
    assert repo.active_branch.name == branch_name, f"Wrong branch: {repo.active_branch.name}"
    
    # Apply fixes and commit
    for fix in fixes:
        apply_fix(fix)
        repo.index.add([fix.file])
        commit_message = create_commit_message(fix.bug, fix)
        repo.index.commit(commit_message)
    
    # Verify commits
    commits = list(repo.iter_commits(branch_name))
    for commit in commits:
        assert "[AI-AGENT]" in commit.message, f"Commit missing prefix: {commit.message}"
    
    # Push to remote
    origin = repo.remote(name="origin")
    origin.push(branch_name, force=False)  # Never force push
    
    logger.info(f"Successfully pushed {len(fixes)} commits to {branch_name}")
```

**Debug Steps:**
1. Check current branch before operations
2. Verify branch name before push
3. Add safety checks
4. Never allow main branch operations

---

### 6. CI/CD Monitoring Issues

#### Issue: "Can't detect CI/CD status"
**Symptoms:**
- Status always unknown
- API calls fail
- Wrong status reported

**Solutions:**
```python
import requests
import time

def check_cicd_status(repo_url: str, branch_name: str, token: str) -> str:
    """
    Check CI/CD status from GitHub API.
    """
    # Extract owner and repo from URL
    owner, repo = extract_owner_repo(repo_url)
    
    # Get latest workflow run
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    params = {
        "branch": branch_name,
        "per_page": 1
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data["workflow_runs"]:
            run = data["workflow_runs"][0]
            status = run["status"]  # queued, in_progress, completed
            conclusion = run.get("conclusion")  # success, failure, cancelled
            
            if status == "completed":
                return "PASSED" if conclusion == "success" else "FAILED"
            else:
                return "RUNNING"
        else:
            return "UNKNOWN"
    except Exception as e:
        logger.error(f"Failed to check CI/CD status: {e}")
        return "UNKNOWN"

def wait_for_cicd_completion(repo_url: str, branch_name: str, token: str, timeout: int = 600) -> str:
    """
    Wait for CI/CD to complete.
    """
    start_time = time.time()
    poll_interval = 10  # Check every 10 seconds
    
    while time.time() - start_time < timeout:
        status = check_cicd_status(repo_url, branch_name, token)
        
        if status in ["PASSED", "FAILED"]:
            return status
        
        if status == "UNKNOWN":
            # Check if workflow exists
            if not workflow_exists(repo_url, token):
                logger.warning("No CI/CD workflow found, assuming PASSED")
                return "PASSED"
        
        time.sleep(poll_interval)
    
    logger.warning(f"CI/CD timeout after {timeout} seconds")
    return "TIMEOUT"
```

**Debug Steps:**
1. Test GitHub API access
2. Verify workflow exists in repo
3. Check branch name matches
4. Add detailed logging
5. Handle rate limits

---

### 7. Dashboard/API Issues

#### Issue: "CORS errors in frontend"
**Symptoms:**
- API calls fail in browser
- CORS policy errors

**Solutions:**
```python
# backend/src/api/main.py
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Get frontend URL from environment
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "https://your-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Debug Steps:**
1. Check CORS headers in response
2. Verify frontend URL in allowed origins
3. Test with curl: `curl -H "Origin: http://localhost:3000" ...`
4. Check browser console for errors

---

#### Issue: "API timeout or hanging"
**Symptoms:**
- Requests take too long
- Frontend shows loading forever

**Solutions:**
```python
# Add timeout to API calls
import asyncio

@app.post("/api/analyze")
async def analyze_repo(request: AnalyzeRequest):
    run_id = str(uuid.uuid4())
    
    # Start agent in background task
    task = asyncio.create_task(run_agent_workflow(run_id, request))
    
    # Don't wait, return immediately
    return {"runId": run_id, "status": "started"}

# Frontend: Poll for status
const pollStatus = async (runId: string) => {
  const maxAttempts = 120; // 10 minutes (5s intervals)
  for (let i = 0; i < maxAttempts; i++) {
    const status = await api.getStatus(runId);
    if (status.status === "completed" || status.status === "failed") {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s
  }
  throw new Error("Timeout waiting for agent");
};
```

**Debug Steps:**
1. Add request timeouts
2. Implement polling instead of long requests
3. Add progress updates
4. Set reasonable timeouts

---

## 🔍 General Debugging Strategies

### 1. Logging Strategy
```python
import logging

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Use throughout code
logger.debug("Detailed debug info")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred", exc_info=True)
```

### 2. Error Handling
```python
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Specific error: {e}", exc_info=True)
    # Handle gracefully
    result = fallback_operation()
except Exception as e:
    logger.critical(f"Unexpected error: {e}", exc_info=True)
    raise  # Re-raise if can't handle
```

### 3. Testing Individual Components
```python
# Test each agent separately
def test_discovery_agent():
    agent = DiscoveryAgent()
    repo_path = agent.clone_repository("https://github.com/user/repo")
    test_files = agent.discover_test_files(repo_path)
    assert len(test_files) > 0
    print(f"Found {len(test_files)} test files")

# Run tests
if __name__ == "__main__":
    test_discovery_agent()
```

### 4. Debug Mode
```python
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

if DEBUG:
    # Save intermediate results
    with open("debug_output.json", "w") as f:
        json.dump(intermediate_data, f, indent=2)
    
    # Print detailed info
    print(f"Debug: {variable}")
    
    # Don't actually push to Git
    if DEBUG:
        logger.info("DEBUG mode: Skipping Git push")
```

---

## 📋 Debugging Checklist

When something goes wrong:

1. **Check Logs**
   - [ ] Review log files
   - [ ] Check for error messages
   - [ ] Look for stack traces

2. **Verify Environment**
   - [ ] Check environment variables
   - [ ] Verify API keys are set
   - [ ] Test network connectivity

3. **Test Components Individually**
   - [ ] Test each agent separately
   - [ ] Verify inputs/outputs
   - [ ] Check intermediate results

4. **Validate Data**
   - [ ] Check data formats
   - [ ] Verify required fields
   - [ ] Test edge cases

5. **Check External Services**
   - [ ] GitHub API status
   - [ ] LLM API status
   - [ ] Docker daemon running

6. **Review Recent Changes**
   - [ ] Check git diff
   - [ ] Review recent commits
   - [ ] Test previous working version

---

**Last Updated**: 2026-02-19  
**Status**: Comprehensive Debugging Guide
