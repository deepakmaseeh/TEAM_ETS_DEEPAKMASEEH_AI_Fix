# How the Agent Fixes Pipeline Bugs
## Complete Workflow Explanation

**Date:** 2026-02-19

---

## 🔄 Complete Fix Cycle Workflow

The agent uses an **iterative fix cycle** that continues until all tests pass and the CI/CD pipeline succeeds. Here's the complete process:

```
┌─────────────────────────────────────────────────────────────┐
│                    START: User Submits Repo                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Clone & Analyze Repository                          │
│  - RepoAnalyzerAgent clones the repository                  │
│  - Detects project type (Python/Node.js)                    │
│  - Discovers all test files                                 │
│  - Determines test command (pytest, npm test, etc.)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Setup Git Repository                               │
│  - CommitAgent initializes git repository                   │
│  - Creates branch: TEAM_NAME_LEADER_NAME_AI_Fix            │
│  - Configures remote origin                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ITERATION LOOP (up to retryLimit times, default: 5)        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ITERATION 1, 2, 3...                                   │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 3: Run Tests                                │   │ │
│  │  │ - TestRunnerAgent runs tests in Docker sandbox  │   │ │
│  │  │ - Captures stdout/stderr output                 │   │ │
│  │  │ - Parses test failures from output               │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │                     ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 4: Parse Failures                           │   │ │
│  │  │ - Extracts file path, line number, error message│   │ │
│  │  │ - Categorizes bug type:                          │   │ │
│  │  │   • LINTING (unused imports)                    │   │ │
│  │  │   • SYNTAX (missing colons, parse errors)       │   │ │
│  │  │   • IMPORT (broken imports)                     │   │ │
│  │  │   • INDENTATION (indentation errors)            │   │ │
│  │  │   • TYPE_ERROR (type mismatches)                │   │ │
│  │  │   • LOGIC (logic errors)                        │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │                     ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 5: Generate Fixes (Rule-Based)              │   │ │
│  │  │ - FixGeneratorAgent analyzes each failure        │   │ │
│  │  │ - Applies deterministic rules (NO LLMs):         │   │ │
│  │  │   • LINTING: Remove unused import line           │   │ │
│  │  │   • SYNTAX: Add missing colon                    │   │ │
│  │  │   • IMPORT: Fix import path                      │   │ │
│  │  │   • INDENTATION: Normalize to 4 spaces          │   │ │
│  │  │ - Generates fixed file content                   │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │                     ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 6: Apply Fixes                               │   │ │
│  │  │ - Writes fixed content to files                  │   │ │
│  │  │ - Each fix is applied individually               │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │                     ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 7: Commit Fixes                             │   │ │
│  │  │ - CommitAgent commits each fix                   │   │ │
│  │  │ - Commit message: [AI-AGENT] Fix {TYPE} in ...  │   │ │
│  │  │ - Tracks commit count                            │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │                     ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 8: Push Changes                            │   │ │
│  │  │ - Pushes branch to remote                        │   │ │
│  │  │ - Never pushes to main/master                   │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │                     ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ STEP 9: Check Results                            │   │ │
│  │  │ - If no failures: Check CI/CD status            │   │ │
│  │  │ - If failures exist: Continue to next iteration │   │ │
│  │  └──────────────────┬──────────────────────────────┘   │ │
│  │                     │                                   │ │
│  │         ┌───────────┴───────────┐                      │ │
│  │         │                       │                        │ │
│  │    All Tests Pass?      Still Failures?                │ │
│  │         │                       │                        │ │
│  │         ▼                       ▼                        │ │
│  │  ┌──────────────┐      ┌──────────────────┐            │ │
│  │  │ Check CI/CD  │      │ Next Iteration   │            │ │
│  │  │ Status       │      │ (if < retryLimit)│            │ │
│  │  └──────┬───────┘      └────────┬─────────┘            │ │
│  │         │                       │                        │ │
│  │         │                       └────────┐               │ │
│  │         │                                │               │ │
│  │         └────────────────────────────────┘               │ │
│  │                     │                                   │ │
│  └─────────────────────┼───────────────────────────────────┘ │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ STEP 10: Monitor CI/CD Pipeline                          ││
│  │ - CICDMonitorAgent checks GitHub Actions status          ││
│  │ - Polls every 10 seconds until completion               ││
│  │ - Returns PASSED or FAILED status                       ││
│  └────────────────────┬────────────────────────────────────┘│
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐
│  │ FINAL: Generate Results                                  │
│  │ - Calculate score (base + speed bonus - efficiency)      │
│  │ - Save results.json                                       │
│  │ - Update dashboard with all metrics                      │
│  └──────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Step-by-Step Process

### Step 1: Test Execution & Failure Detection

**File:** `backend/src/agents/testRunnerAgent.js`

```javascript
// 1. Run tests in Docker sandbox (or locally)
const testResult = await testRunner.runTests(repoPath, testCommand, projectType);

// 2. Parse test output to extract failures
const failures = testRunner.parseFailures(testResult.stdout + testResult.stderr, projectType);
```

**What happens:**
- Tests run in isolated Docker container (no network access, resource limits)
- Captures all stdout/stderr output
- Parses output using regex patterns:
  - **Python (pytest):** `FAILED (.+?\.py)::(.+?)::(.+?)\s+-+\s+(.+?)`
  - **Node.js (jest):** `FAIL\s+(.+?)\s+\((.+?)\)`
- Extracts: file path, line number, error message

**Example Output Parsed:**
```
FAILED src/utils.py::test_function::test_case
-------------------------------------------
src/utils.py:15: in test_function
    import os
E: Unused import 'os'
```

**Extracted Failure:**
```javascript
{
  file: "src/utils.py",
  line: 15,
  bugType: "LINTING",
  errorMessage: "Unused import 'os'"
}
```

---

### Step 2: Bug Categorization

**File:** `backend/src/agents/testRunnerAgent.js` (line 155-180)

The agent categorizes bugs by analyzing error messages:

```javascript
categorizeBug(errorMessage) {
  const errorLower = errorMessage.toLowerCase();
  
  if (errorLower.includes('unused') || errorLower.includes('lint')) {
    return 'LINTING';
  } else if (errorLower.includes('syntax') || errorLower.includes('colon')) {
    return 'SYNTAX';
  } else if (errorLower.includes('import') || errorLower.includes('module not found')) {
    return 'IMPORT';
  } else if (errorLower.includes('indent')) {
    return 'INDENTATION';
  } else if (errorLower.includes('type')) {
    return 'TYPE_ERROR';
  } else {
    return 'LOGIC';
  }
}
```

**Bug Types Detected:**
1. **LINTING** - Unused imports, linting errors
2. **SYNTAX** - Missing colons, parse errors
3. **IMPORT** - Broken imports, module not found
4. **INDENTATION** - Indentation errors
5. **TYPE_ERROR** - Type mismatches
6. **LOGIC** - Logic errors (may require manual review)

---

### Step 3: Rule-Based Fix Generation

**File:** `backend/src/agents/fixGeneratorAgent.js`

The agent applies **deterministic, rule-based fixes** (NO LLMs):

#### Fix Type 1: LINTING (Unused Imports)

```javascript
case BUG_TYPES.LINTING:
  if (errorMessage.toLowerCase().includes('unused import')) {
    // Extract import name (e.g., "os" from "Unused import 'os'")
    const importMatch = errorMessage.match(/['"]([^'"]+)['"]/);
    if (importMatch) {
      const importName = importMatch[1];
      // Remove the import line
      fixedContent = lines
        .filter((lineContent, idx) => {
          if (idx === line - 1) {
            return !lineContent.includes(`import ${importName}`) && 
                   !lineContent.includes(`from ${importName}`);
          }
          return true;
        })
        .join('\n');
      fixDescription = 'remove the import statement';
    }
  }
```

**Example:**
- **Before:** `import os`
- **After:** (line removed)
- **Output:** `LINTING error in src/utils.py line 15 → Fix: remove the import statement`

#### Fix Type 2: SYNTAX (Missing Colons)

```javascript
case BUG_TYPES.SYNTAX:
  if (errorMessage.toLowerCase().includes('missing colon')) {
    if (line > 0 && line <= lines.length) {
      const targetLine = lines[line - 1].trim();
      if (!targetLine.endsWith(':')) {
        lines[line - 1] = lines[line - 1].trim() + ':';
        fixedContent = lines.join('\n');
        fixDescription = 'add the colon at the correct position';
      }
    }
  }
```

**Example:**
- **Before:** `def test_function()`
- **After:** `def test_function():`
- **Output:** `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position`

#### Fix Type 3: INDENTATION

```javascript
case BUG_TYPES.INDENTATION:
  if (line > 0 && line <= lines.length) {
    const targetLine = lines[line - 1];
    // Normalize to 4 spaces per level
    const normalizedIndent = '    '.repeat(Math.floor(currentIndent / 4));
    lines[line - 1] = normalizedIndent + targetLine.trim();
    fixedContent = lines.join('\n');
    fixDescription = 'normalize indentation to 4 spaces';
  }
```

#### Fix Type 4: IMPORT (Broken Imports)

```javascript
case BUG_TYPES.IMPORT:
  if (errorMessage.toLowerCase().includes('cannot import') ||
      errorMessage.toLowerCase().includes('module not found')) {
    // Extract module name and attempt to fix
    const moduleMatch = errorMessage.match(/['"]([^'"]+)['"]/);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      fixDescription = `fix import for ${moduleName}`;
    }
  }
```

---

### Step 4: Apply Fixes to Files

**File:** `backend/src/agents/fixGeneratorAgent.js` (line 117-130)

```javascript
async applyFix(repoPath, fix) {
  if (!fix.applied) {
    return false; // Skip if fix couldn't be applied
  }

  const filePath = path.join(repoPath, fix.file);
  
  // Write fixed content to file
  await fs.writeFile(filePath, fix.fixedContent, 'utf-8');
  return true;
}
```

**What happens:**
- Reads original file content
- Applies fix (removes line, adds colon, fixes indentation, etc.)
- Writes fixed content back to file
- Each fix is applied individually

---

### Step 5: Commit Each Fix

**File:** `backend/src/agents/commitAgent.js` (line 17-36)

```javascript
async commitFix(repoPath, fix, branchName) {
  // Create commit message with [AI-AGENT] prefix
  const commitMessage = `[AI-AGENT] Fix ${fix.bugType} in ${fix.file}: ${fix.fixDescription}`;
  
  // Commit the change
  await commitChanges(repoPath, fix.file, commitMessage);
  
  return {
    file: fix.file,
    commitMessage,
    success: true
  };
}
```

**Commit Message Format:**
- `[AI-AGENT] Fix LINTING in src/utils.py: remove the import statement`
- `[AI-AGENT] Fix SYNTAX in src/validator.py: add the colon at the correct position`

---

### Step 6: Push Changes & Iterate

**File:** `backend/src/agents/coordinatorAgent.js` (line 98-280)

```javascript
// Main iteration loop
while (iteration < retryLimit) {
  iteration++;
  
  // 1. Run tests
  const testResult = await testRunner.runTests(repoPath, testCommand, projectType);
  const failures = testRunner.parseFailures(testResult.stdout + testResult.stderr, projectType);
  
  // 2. If no failures, check CI/CD and exit
  if (failures.length === 0 && testResult.success) {
    const cicdStatus = await cicdMonitor.checkCICDStatus(repoUrl, branchName);
    // Exit loop - all tests passing
    break;
  }
  
  // 3. Generate and apply fixes for each failure
  for (const failure of failures) {
    const fix = await fixGenerator.generateFix(failure, repoPath);
    if (fix.applied) {
      await fixGenerator.applyFix(repoPath, fix);
      await commitAgent.commitFix(repoPath, fix, branchName);
      commitCount++;
    }
  }
  
  // 4. Push all changes
  await commitAgent.pushChanges(repoPath, branchName);
  
  // 5. Continue to next iteration
  // (Loop continues until no failures or retry limit reached)
}
```

**Iteration Logic:**
- **Iteration 1:** Run tests → Find 3 failures → Fix all 3 → Commit → Push → Run tests again
- **Iteration 2:** Run tests → Find 1 failure → Fix it → Commit → Push → Run tests again
- **Iteration 3:** Run tests → No failures → Check CI/CD → **SUCCESS!**

---

### Step 7: CI/CD Pipeline Monitoring

**File:** `backend/src/agents/cicdMonitorAgent.js`

```javascript
async checkCICDStatus(repoUrl, branchName) {
  // Extract owner and repo from URL
  const [, owner, repo] = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  
  // Check GitHub Actions status via API
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=${branchName}&per_page=1`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `token ${this.githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  const data = await response.json();
  
  if (data.workflow_runs && data.workflow_runs.length > 0) {
    const run = data.workflow_runs[0];
    const conclusion = run.conclusion; // success, failure, cancelled
    
    return {
      status: conclusion === 'success' ? 'PASSED' : 'FAILED',
      message: conclusion,
      runId: run.id,
      url: run.html_url
    };
  }
}
```

**What happens:**
- After all tests pass locally, agent checks GitHub Actions
- Polls GitHub API for latest workflow run on the branch
- Returns `PASSED` if CI/CD succeeds, `FAILED` if it fails
- If CI/CD fails, agent can continue iterating (if retry limit not reached)

---

## 📊 Example Complete Fix Cycle

### Scenario: Repository with 3 bugs

**Initial State:**
```
src/utils.py - Line 15: Unused import 'os'
src/validator.py - Line 8: Missing colon
src/helper.py - Line 23: Indentation error
```

**Iteration 1:**
1. ✅ Run tests → 3 failures detected
2. ✅ Generate fixes:
   - Remove `import os` from src/utils.py
   - Add `:` to line 8 in src/validator.py
   - Fix indentation in src/helper.py
3. ✅ Apply fixes → Write files
4. ✅ Commit fixes (3 commits):
   - `[AI-AGENT] Fix LINTING in src/utils.py: remove the import statement`
   - `[AI-AGENT] Fix SYNTAX in src/validator.py: add the colon at the correct position`
   - `[AI-AGENT] Fix INDENTATION in src/helper.py: normalize indentation to 4 spaces`
5. ✅ Push branch
6. ✅ Run tests again → 0 failures! ✅

**Iteration 2:**
1. ✅ Run tests → All passing
2. ✅ Check CI/CD status → PASSED ✅
3. ✅ **COMPLETE!**

**Final Results:**
- Total failures: 3
- Fixes applied: 3
- Iterations used: 2/5
- CI/CD status: PASSED
- Score: 100 (base) + 10 (speed < 5 min) - 0 (commits ≤ 20) = **110 points**

---

## 🎯 Key Features

### 1. **Rule-Based Fixes (No LLMs)**
- All fixes are deterministic and rule-based
- No AI/LLM calls - fast and reliable
- Specific patterns for each bug type

### 2. **Iterative Approach**
- Continues until all tests pass
- Maximum retry limit (default: 5 iterations)
- Each iteration fixes remaining issues

### 3. **Sandboxed Execution**
- Tests run in Docker containers
- No network access for security
- Resource limits (512MB RAM, 50% CPU)

### 4. **Exact Output Format**
- Matches test case format exactly:
  - `{BUG_TYPE} error in {file} line {line} → Fix: {description}`

### 5. **CI/CD Integration**
- Monitors GitHub Actions pipeline
- Waits for completion
- Reports final status

---

## 🔧 Supported Bug Types & Fixes

| Bug Type | Detection | Fix Applied |
|----------|-----------|-------------|
| **LINTING** | "unused import", "lint" | Remove unused import line |
| **SYNTAX** | "syntax", "parse", "colon" | Add missing colon, fix syntax |
| **IMPORT** | "cannot import", "module not found" | Fix import path |
| **INDENTATION** | "indent", "indentation" | Normalize to 4 spaces |
| **TYPE_ERROR** | "type", "typing" | Detected (may need manual review) |
| **LOGIC** | Other errors | Detected (may need manual review) |

---

## 📈 Success Criteria

The agent completes successfully when:
1. ✅ All local tests pass (exit code 0)
2. ✅ No failures detected in test output
3. ✅ CI/CD pipeline status is PASSED
4. ✅ Results.json generated with all metrics

---

**Last Updated:** 2026-02-19
