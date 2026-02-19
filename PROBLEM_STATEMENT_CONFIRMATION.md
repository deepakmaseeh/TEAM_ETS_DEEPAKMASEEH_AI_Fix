# RIFT 2026 — Problem Statement Confirmation

**Document Type:** Problem Statement Selection Confirmation  
**Track:** AI/ML · DevOps Automation · Agentic Systems  
**Submission Window:** 19 February 2026, 6:00 PM – 8:00 PM  
**Version:** 1.0  
**Date:** 19 February 2026  

---

## 1. Selected Problem Statement

**Title:** Build an Autonomous CI/CD Healing Agent  

**Subtitle:** Autonomous DevOps Agent with React Dashboard  

**Track:** AI/ML · DevOps Automation · Agentic Systems Track  

**Challenge Type:** Multi-city Hackathon — AIML Track  

---

## 2. Problem Statement Summary

We confirm selection of the following problem:

- **Core deliverable:** An autonomous DevOps agent with a production-ready React dashboard that:
  - Accepts a GitHub repository URL (and team name / team leader name) via the web interface
  - Clones and analyzes the repository structure
  - Discovers and runs all test files automatically
  - Identifies failures and generates targeted fixes
  - Commits fixes with the `[AI-AGENT]` prefix and pushes to a new branch (never to main)
  - Monitors the CI/CD pipeline and iterates until all tests pass or retry limit is reached
  - Displays comprehensive results in the React dashboard

- **Primary evaluation interface:** The React dashboard (production-ready and publicly deployed).

- **Branch naming (mandatory):** Exact format  
  `TEAM_NAME_LEADER_NAME_AI_Fix`  
  (all uppercase, spaces replaced with underscores, ending with `_AI_Fix`).

- **Output format (mandatory):** Failure and fix descriptions must match the specified test-case format, e.g.  
  `LINTING error in src/utils.py line 15 → Fix: remove the import statement`  
  and  
  `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position`.

---

## 3. Mandatory Submission Requirements Acknowledged

We acknowledge that the following are **mandatory** and that missing any item may result in disqualification:

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Live deployed website URL (React dashboard publicly accessible, accepting GitHub repo URL) | To be completed |
| 2 | LinkedIn video demonstration (2–3 min max, tag @RIFT2026, public post) showing live demo, architecture, agent workflow, results dashboard | To be completed |
| 3 | GitHub repository (public) with complete source code and README including: project title, deployment URL, LinkedIn video URL, architecture diagram, installation, environment setup, usage, supported bug types, tech stack, limitations, team members | To be completed |

We also acknowledge the following **disqualification criteria** and commit to avoid them:

- No live deployment URL  
- No LinkedIn video posted or not public  
- Incomplete README  
- Output that does not match the specified test cases  
- Human intervention during agent execution  
- Hardcoded test file paths  
- Commits without the `[AI-AGENT]` prefix  
- Incorrect branch name format  
- Pushing directly to the main branch  
- Plagiarized code  

---

## 4. Evaluation Criteria Acknowledged

We acknowledge that evaluation will be based on:

- **Test Case Accuracy (40 pts):** Exact match with test cases — correct bug types, line numbers, fixes applied  
- **Dashboard Quality (25 pts):** All required sections, clear visualization, responsive design, live deployment  
- **Agent Architecture (20 pts):** Multi-agent structure, proper tool integration, sandboxed execution, iteration handling  
- **Documentation (10 pts):** Complete README, clarity of architecture diagram, accuracy of setup instructions  
- **Video Presentation (5 pts):** Clear explanation of architecture, quality of live demo, professional presentation  

---

## 5. Team and Contact

- **Team name:** _[To be filled by team]_  
- **Team leader:** _[To be filled by team]_  
- **Repository URL:** _[To be filled after repo creation]_  
- **Live application URL:** _[To be filled after deployment]_  
- **LinkedIn demo video URL:** _[To be filled after video is posted]_  

---

## 6. Confirmation Statement

We confirm that we have selected the problem statement **"Build an Autonomous CI/CD Healing Agent"** under the **AI/ML · DevOps Automation · Agentic Systems Track** for RIFT 2026, and that we understand and will comply with all mandatory submission requirements, branch naming, output format, and disqualification criteria stated in the official problem document.

---

**Signature / Team lead:** _________________________  
**Date:** _________________________  

— RIFT 2026 · Problem Statement Confirmation
