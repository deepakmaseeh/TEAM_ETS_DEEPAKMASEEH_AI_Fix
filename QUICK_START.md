# Quick Start Guide
## RIFT 2026 - Autonomous CI/CD Healing Agent

---

## ✅ Application Status

**Backend Server:** ✅ Running on http://localhost:8000  
**Frontend Dashboard:** ✅ Running on http://localhost:5173

---

## 🚀 Access the Application

1. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

2. **You should see:**
   - Input form with GitHub repository URL field
   - Team Name field (pre-filled: "Team ETS")
   - Team Leader field (pre-filled: "Deepakmaseeh")
   - Run Agent button

---

## 📝 Before Running Your First Agent

### 1. Configure GitHub Token

The backend needs a GitHub Personal Access Token to:
- Clone repositories
- Push branches
- Monitor CI/CD status

**Steps:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes: `repo`, `workflow`
3. Copy the token
4. Open `backend/.env` file
5. Replace `your_github_token_here` with your actual token:
   ```
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```
6. Restart the backend server (if needed)

### 2. Test the Application

**Test with a sample repository:**
1. Enter a GitHub repository URL (e.g., a public repo with tests)
2. Keep Team Name: "Team ETS"
3. Keep Team Leader: "Deepakmaseeh"
4. Click "Run Agent"
5. Watch the dashboard update in real-time

---

## 🔧 Server Management

### Stop Servers

**To stop the servers:**
- Press `Ctrl+C` in the terminal windows where they're running
- Or close the terminal windows

### Restart Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Check Server Status

**Backend Health Check:**
```
http://localhost:8000/health
```

**Frontend:**
```
http://localhost:5173
```

---

## 🐛 Troubleshooting

### Backend Not Starting

1. **Check if port 8000 is available:**
   ```powershell
   netstat -ano | findstr :8000
   ```

2. **Check .env file exists:**
   ```powershell
   Test-Path backend\.env
   ```

3. **Check Node.js version:**
   ```powershell
   node --version
   ```
   Should be v18 or higher

### Frontend Not Starting

1. **Check if port 5173 is available:**
   ```powershell
   netstat -ano | findstr :5173
   ```

2. **Clear cache and reinstall:**
   ```powershell
   cd frontend
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

### Docker Issues

If Docker is not running:
- The agent will fallback to local test execution
- This is fine for testing, but Docker is recommended for production

---

## 📊 What to Expect

### When You Run the Agent:

1. **Input Section:**
   - Shows loading spinner
   - Button becomes disabled

2. **Run Summary Card:**
   - Appears when run starts
   - Shows progress updates

3. **Score Breakdown Panel:**
   - Appears when run completes
   - Shows calculated score

4. **Fixes Applied Table:**
   - Lists all fixes attempted
   - Shows status (Fixed/Failed)

5. **CI/CD Status Timeline:**
   - Shows each iteration
   - Pass/fail badges
   - Timestamps

---

## 🎯 Next Steps

1. **Test with a sample repository**
2. **Verify branch creation** on GitHub
3. **Check commit messages** have `[AI-AGENT]` prefix
4. **Review results.json** in workspace directory
5. **Prepare for deployment**

---

## 📞 Support

If you encounter issues:
1. Check the browser console (F12)
2. Check backend terminal for errors
3. Review `DEBUGGING_GUIDE.md`
4. Check `TECHNICAL_DOCUMENTATION.md`

---

**Application is ready to use!** 🚀

Open http://localhost:5173 in your browser to get started.
