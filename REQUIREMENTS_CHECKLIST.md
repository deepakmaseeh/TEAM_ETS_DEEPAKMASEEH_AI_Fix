# RIFT 2026 Hackathon - Requirements Checklist

## ✅ Mandatory Submission Requirements

### 1. Live Deployed Website URL
- [ ] React dashboard is publicly accessible
- [ ] Accepts GitHub repo URL as input
- [ ] Deployed on Vercel/Netlify/Railway/AWS
- [ ] URL is accessible and functional
- [ ] No authentication required for basic access

### 2. LinkedIn Video Demonstration
- [ ] Video is 2-3 minutes maximum
- [ ] Tagged @RIFT2026 on LinkedIn
- [ ] Shows live demo of dashboard
- [ ] Shows architecture diagram
- [ ] Shows agent workflow walkthrough
- [ ] Shows results dashboard
- [ ] Post is public
- [ ] Video link is accessible

### 3. GitHub Repository + README
- [ ] Repository is public
- [ ] README includes:
  - [ ] Project title
  - [ ] Deployment URL
  - [ ] LinkedIn video URL
  - [ ] Architecture diagram
  - [ ] Installation instructions
  - [ ] Environment setup
  - [ ] Usage examples
  - [ ] Supported bug types
  - [ ] Tech stack
  - [ ] Known limitations
  - [ ] Team members

---

## 🎯 Core Challenge Requirements

### Repository Analysis
- [ ] Takes GitHub repository URL as input
- [ ] Clones repository successfully
- [ ] Analyzes repository structure
- [ ] Discovers test files automatically
- [ ] Supports multiple test frameworks (pytest, jest, unittest, etc.)

### Bug Detection & Fixing
- [ ] Identifies all test failures
- [ ] Generates targeted fixes for each bug
- [ ] Supports bug types:
  - [ ] LINTING
  - [ ] SYNTAX
  - [ ] LOGIC
  - [ ] TYPE_ERROR
  - [ ] IMPORT
  - [ ] INDENTATION

### Git Operations
- [ ] Creates branch with format: `TEAM_NAME_LEADER_NAME_AI_Fix`
  - [ ] All uppercase
  - [ ] Spaces replaced with underscores
  - [ ] Ends with `_AI_Fix`
  - [ ] No special characters except underscores
- [ ] Commits with `[AI-AGENT]` prefix
- [ ] Pushes to new branch (NOT main)
- [ ] Handles authentication properly

### CI/CD Monitoring
- [ ] Monitors CI/CD pipeline status
- [ ] Iterates until all tests pass
- [ ] Respects retry limit (default: 5)
- [ ] Tracks iteration count

---

## 🖥️ React Dashboard Requirements

### 1. Input Section
- [ ] Text input for GitHub repository URL
- [ ] Text input for Team Name
- [ ] Text input for Team Leader Name
- [ ] "Run Agent" or "Analyze Repository" button
- [ ] Loading indicator while agent is running
- [ ] Input validation
- [ ] Error handling for invalid inputs

### 2. Run Summary Card
- [ ] Repository URL displayed (clickable link)
- [ ] Team name displayed
- [ ] Team leader name displayed
- [ ] Branch name created displayed
- [ ] Total failures detected displayed
- [ ] Total fixes applied displayed
- [ ] Final CI/CD status badge:
  - [ ] PASSED (green)
  - [ ] FAILED (red)
- [ ] Total time taken displayed (formatted)

### 3. Score Breakdown Panel
- [ ] Base score: 100 points displayed
- [ ] Speed bonus: +10 if < 5 minutes
- [ ] Efficiency penalty: -2 per commit over 20
- [ ] Final total score displayed prominently
- [ ] Visual chart/progress bar showing score breakdown
- [ ] Clear calculation explanation

### 4. Fixes Applied Table
- [ ] Table with columns:
  - [ ] File
  - [ ] Bug Type
  - [ ] Line Number
  - [ ] Commit Message
  - [ ] Status
- [ ] Bug types displayed correctly
- [ ] Status icons: ✓ Fixed (green) or ✗ Failed (red)
- [ ] Color coding implemented
- [ ] Sortable columns (optional but recommended)
- [ ] Filterable by bug type (optional but recommended)

### 5. CI/CD Status Timeline
- [ ] Timeline visualization
- [ ] Pass/fail badge for each iteration
- [ ] Number of iterations used out of retry limit (e.g., "3/5")
- [ ] Timestamp for each run
- [ ] Clear visual distinction between passed/failed

### Dashboard Quality
- [ ] Responsive design (desktop + mobile)
- [ ] Modern, clean UI
- [ ] Proper state management (Context API, Redux, Zustand, etc.)
- [ ] Error handling and user feedback
- [ ] Loading states
- [ ] Real-time updates (polling or WebSocket)

---

## 🔧 Technical Requirements

### Frontend
- [ ] Built with React (functional components + hooks)
- [ ] Responsive design
- [ ] Deployed and publicly accessible
- [ ] Frontend code in `/frontend` folder
- [ ] Proper state management

### Backend / Agent
- [ ] Generates `results.json` file at end of each run
- [ ] API endpoint that triggers agent (REST or GraphQL)
- [ ] Multi-agent architecture (LangGraph, CrewAI, AutoGen, etc.)
- [ ] Code execution sandboxed (Docker recommended)
- [ ] Configurable retry limit (default: 5)
- [ ] Proper error handling
- [ ] Logging for debugging

---

## 📋 Test Case Matching

### Exact Format Requirements
- [ ] Output matches test cases line-by-line
- [ ] Bug type format: `LINTING error in src/utils.py line 15`
- [ ] Fix format: `Fix: remove the import statement`
- [ ] File paths match exactly
- [ ] Line numbers match exactly
- [ ] Error messages match expected format

### Test Cases to Validate
- [ ] `src/utils.py — Line 15: Unused import 'os'`
  - Expected: `LINTING error in src/utils.py line 15 → Fix: remove the import statement`
- [ ] `src/validator.py — Line 8: Missing colon`
  - Expected: `SYNTAX error in src/validator.py line 8 → Fix: add the colon at the correct position`

---

## 🚫 Disqualification Prevention

### Critical Checks
- [ ] ✅ Live deployment URL exists and works
- [ ] ✅ LinkedIn video posted and accessible
- [ ] ✅ README is complete
- [ ] ✅ Output matches test cases exactly
- [ ] ✅ No human intervention during agent execution
- [ ] ✅ No hardcoded test file paths
- [ ] ✅ All commits have `[AI-AGENT]` prefix
- [ ] ✅ Branch name format is correct
- [ ] ✅ Never pushes directly to main branch
- [ ] ✅ No plagiarized code

### Branch Naming Validation
Test with these examples:
- [ ] Team: "RIFT ORGANISERS", Leader: "Saiyam Kumar"
  - Expected: `RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix`
- [ ] Team: "Code Warriors", Leader: "John Doe"
  - Expected: `CODE_WARRIORS_JOHN_DOE_AI_Fix`
- [ ] Team: "Team 1", Leader: "Jane Smith"
  - Expected: `TEAM_1_JANE_SMITH_AI_Fix`

### Commit Message Validation
- [ ] All commits start with `[AI-AGENT]`
- [ ] Commit messages are descriptive
- [ ] No commits without prefix

---

## 📊 Evaluation Criteria Checklist

### Test Case Accuracy (40 points)
- [ ] Correct bug types identified
- [ ] Correct line numbers
- [ ] Correct fixes applied
- [ ] Output format matches exactly

### Dashboard Quality (25 points)
- [ ] All required sections present
- [ ] Clear visualization
- [ ] Responsive design
- [ ] Live deployment working

### Agent Architecture (20 points)
- [ ] Multi-agent structure implemented
- [ ] Proper tool integration
- [ ] Sandboxed execution
- [ ] Iteration handling works

### Documentation (10 points)
- [ ] Complete README
- [ ] Architecture diagram clear
- [ ] Setup instructions accurate
- [ ] Usage examples provided

### Video Presentation (5 points)
- [ ] Clear architecture explanation
- [ ] Live demo quality good
- [ ] Professional presentation
- [ ] Within time limit (2-3 min)

---

## 🔍 Pre-Submission Final Checks

### Functionality
- [ ] End-to-end test with sample repository
- [ ] All dashboard components render correctly
- [ ] API endpoints respond correctly
- [ ] Agent completes full workflow
- [ ] Results.json is generated correctly
- [ ] Branch is created with correct name
- [ ] Commits have correct prefix
- [ ] CI/CD monitoring works

### Code Quality
- [ ] No console errors in browser
- [ ] No linter errors
- [ ] Code is properly commented
- [ ] Error handling is comprehensive
- [ ] Environment variables are configured

### Documentation
- [ ] README is complete and accurate
- [ ] Architecture diagram is clear
- [ ] Installation instructions work
- [ ] All links are valid

### Deployment
- [ ] Frontend is accessible
- [ ] Backend API is accessible
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] No sensitive data in code

### Video
- [ ] Video is uploaded to LinkedIn
- [ ] Video is public
- [ ] Video tags @RIFT2026
- [ ] Video shows all required elements
- [ ] Video is within time limit

---

## 📝 Submission Fields Checklist

- [ ] Problem Statement selected (on RIFT website — 19th Feb, 6–8 PM window)
- [ ] GitHub Repository URL ready
- [ ] Hosted / Live Application URL ready
- [ ] Demo video link posted on LinkedIn tagging RIFT's official page

---

**Last Updated**: 2026-02-19  
**Status**: Pre-Implementation Checklist
