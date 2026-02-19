# Test Case Output Format — Exact Match for Judges

Your agent's output **must** match the expected format line-by-line. Use one formatter everywhere (agent, results.json, dashboard).

---

## Branch name

- **Format:** `TEAM_NAME_LEADER_NAME_AI_Fix`
- **Rules:** All UPPERCASE, spaces → `_`, end with `_AI_Fix`, no special characters except `_`.

| Team Name         | Leader Name   | Branch Name                    |
|-------------------|---------------|--------------------------------|
| RIFT ORGANISERS   | Saiyam Kumar  | RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix |
| Code Warriors     | John Doe      | CODE_WARRIORS_JOHN_DOE_AI_Fix  |

### Implementation

```python
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
        import re
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

---

## Failure and fix line format

**Pattern:**  
`{BUG_TYPE} error in {file} line {line} → Fix: {short description}`

### Examples (from problem statement)

| Test case input                          | Expected dashboard/output string |
|------------------------------------------|----------------------------------|
| `src/utils.py` — Line 15: Unused import `os` | `LINTING error in src/utils.py line 15 → Fix: remove the import statement` |
| `src/validator.py` — Line 8: Missing colon | `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position` |

### Bug types (exactly these labels)

- `LINTING`
- `SYNTAX`
- `LOGIC`
- `TYPE_ERROR`
- `IMPORT`
- `INDENTATION`

### Implementation tip

- Create a single function, e.g. `format_failure(file: str, line: int, bug_type: str, fix_description: str) -> str`.
- Use it when:
  - Writing agent output
  - Building `results.json` (e.g. for "commit message" or "fix description" column)
  - Displaying in the dashboard (if you show the same string)
- Never hand-type these strings in multiple places; always go through the formatter.

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

# Usage
output = format_failure(
    file="src/utils.py",
    line=15,
    bug_type="LINTING",
    fix_description="remove the import statement"
)
# Output: "LINTING error in src/utils.py line 15 → Fix: remove the import statement"
```

---

## Commit message

- **Every** commit made by the agent must start with: `[AI-AGENT]`
- Example: `[AI-AGENT] Fix LINTING in src/utils.py: remove unused import`

### Implementation

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
```

---

## results.json and dashboard

- **Fixes table:** Columns File, Bug Type, Line Number, Commit Message, Status (✓ Fixed / ✗ Failed).
- The "Bug Type" column must show one of the six labels above.
- The "Fix" or "Commit Message" (or description) should follow the same "Fix: …" wording so it matches the expected test case strings when applicable.

### results.json Schema

```json
{
  "repoUrl": "https://github.com/user/repo",
  "teamName": "RIFT ORGANISERS",
  "teamLeader": "Saiyam Kumar",
  "branchName": "RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix",
  "totalFailuresDetected": 5,
  "totalFixesApplied": 5,
  "finalCiCdStatus": "PASSED",
  "totalTimeMs": 240000,
  "score": {
    "baseScore": 100,
    "speedBonus": 10,
    "efficiencyPenalty": 0,
    "total": 110
  },
  "fixes": [
    {
      "file": "src/utils.py",
      "bugType": "LINTING",
      "lineNumber": 15,
      "commitMessage": "[AI-AGENT] Fix LINTING in src/utils.py: remove unused import",
      "status": "Fixed"
    }
  ],
  "ciCdTimeline": [
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

## Validation Checklist

Before submission, verify:

- [ ] Branch name format matches exactly: `TEAM_NAME_LEADER_NAME_AI_Fix`
- [ ] All commits start with `[AI-AGENT]`
- [ ] Output format matches: `{BUG_TYPE} error in {file} line {line} → Fix: {description}`
- [ ] Bug types are exactly: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION
- [ ] Test case examples produce exact matches:
  - `LINTING error in src/utils.py line 15 → Fix: remove the import statement`
  - `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position`
- [ ] Single formatter function used everywhere
- [ ] results.json matches schema
- [ ] Dashboard displays format correctly

---

**Last Updated:** 2026-02-19  
**Status:** Single Source of Truth for Output Format
