# 🎬 RIFT 2026 Live Demo Guide

**Objective**: Execute a flawless live demonstration of the Autonomous CI/CD Healing Agent.

## ⚡ Pre-Demo Checklist
- [ ] **Docker is running** (`docker ps` should work)
- [ ] **Internet is stable** (Agent needs GitHub API access)
- [ ] **GitHub Token is set** in `backend/.env`
- [ ] **Test Repository is ready** (Public, with a known failure)

---

## 🏗️ 1. Start the Application

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Wait for: "Server running on port 8000"
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Wait for: "Local: http://localhost:5173"
```

---

## 🧪 2. Prepare/Verify Test Repository

If you don't have a repo ready, create a fresh public GitHub repository with this simple failing Python test:

`test_demo.py`:
```python
def test_addition():
    # INTENTIONAL LOGIC ERROR
    assert 2 + 2 == 5
```

*OR* a syntax error:
`main.py`:
```python
def hello()
    # INTENTIONAL SYNTAX ERROR (missing colon)
    print("Hello world")
```

**Copy the HTTPS URL** of this repository.

---

## 🎭 3. Execute the Demo

1.  **Open Dashboard**: Go to [http://localhost:5173](http://localhost:5173) in your browser.
2.  **Fill Form**:
    -   **Repo URL**: `[Your Test Repo URL]`
    -   **Team Name**: `Team ETS`
    -   **Leader Name**: `Deepakmaseeh`
3.  **Action**:
    -   Say: *"I'm inputting the repository URL where our CI pipeline just failed."*
    -   Click **start**.
4.  **Narrate**:
    -   *"The agent is now cloning the application..."*
    -   *(Watch 'Active Agent' card switch to **Discovery Agent**)*
    -   *(Watch 'Status' update to **Running Tests**)*
    -   *"It has identified the test suite and is executing it in the Docker sandbox."*
5.  **The Fix**:
    -   *(Wait for failure detection)*
    -   *"It found the error! The **Fixing Agent** is analyzing the stack trace..."*
    -   *(Watch 'Fixes Applied' table populate)*
    -   *"It has generated a fix and is verifying it..."*
6.  **Success**:
    -   *(Watch timeline turn **GREEN**)*
    -   *"And there we go. The fix is verified, and code has been pushed to a new branch."*

---

## 🚑 Troubleshooting

-   **Agent keeps spinning**: Check Terminal 1 for backend errors.
-   **"Repo not found"**: Ensure the repo is **Public** and URL is correct.
-   **Docker error**: Ensure Docker Desktop is running.
-   **GitHub Rate Limit**: Wait 60 seconds or check your Token quota.

---

**Good luck! You got this.** 🚀
