# Troubleshooting Guide
## Common Issues and Solutions

---

## ❌ Error: Network Error / ERR_CONNECTION_REFUSED

### Problem
Frontend cannot connect to backend server.

### Solution
**Backend server is not running!**

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify backend is running:**
   - Check terminal for: `🚀 Backend server running on http://localhost:8000`
   - Visit: http://localhost:8000/health
   - Should return: `{"status":"ok",...}`

3. **Check frontend configuration:**
   - Frontend should be on: http://localhost:5173
   - API URL should be: http://localhost:8000
   - Check browser console for errors

### Quick Fix
```bash
# Terminal 1 - Backend
cd F:\Rift\backend
npm run dev

# Terminal 2 - Frontend (if not already running)
cd F:\Rift\frontend
npm run dev
```

---

## ❌ Error: CORS Error

### Problem
Browser blocks requests due to CORS policy.

### Solution
1. Check backend CORS configuration in `backend/src/index.js`
2. Ensure `FRONTEND_URL` environment variable is set
3. Default should allow `http://localhost:5173`

---

## ❌ Error: Module Not Found

### Problem
Missing dependencies or import errors.

### Solution
```bash
# Reinstall dependencies
cd backend
npm install

cd ../frontend
npm install
```

---

## ❌ Error: Port Already in Use

### Problem
Port 8000 or 5173 is already in use.

### Solution
1. **Find and kill process:**
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

2. **Or change port:**
   - Backend: Set `PORT=8001` in `.env`
   - Frontend: Update `vite.config.js` or use `npm run dev -- --port 5174`

---

## ❌ Error: Docker Not Running

### Problem
Docker is required for sandbox execution.

### Solution
1. **Install Docker Desktop**
2. **Start Docker Desktop**
3. **Build sandbox image:**
   ```bash
   cd backend
   docker build -f Dockerfile.sandbox -t rift-sandbox-python .
   docker build -f Dockerfile.sandbox -t rift-sandbox-node .
   ```

**Note:** Agent will fallback to local execution if Docker is not available.

---

## ❌ Error: GitHub Token Missing

### Problem
Cannot clone private repositories or access GitHub API.

### Solution
1. **Create GitHub Personal Access Token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate token with `repo` and `workflow` scopes

2. **Add to backend/.env:**
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

---

## ❌ Error: Workspace Directory Issues

### Problem
Cannot create or access workspace directory.

### Solution
1. **Check permissions:**
   - Ensure write permissions in project directory

2. **Manual cleanup:**
   ```bash
   # Remove old workspace
   rm -rf workspace
   # Or on Windows
   rmdir /s workspace
   ```

---

## ✅ Verification Checklist

- [ ] Backend server is running (http://localhost:8000/health)
- [ ] Frontend server is running (http://localhost:5173)
- [ ] No CORS errors in browser console
- [ ] All dependencies installed (`npm install` in both directories)
- [ ] Docker is running (optional, for sandbox)
- [ ] GitHub token is set (for private repos)
- [ ] Ports 8000 and 5173 are available

---

## 🔍 Debug Steps

1. **Check Backend Logs:**
   - Look at terminal where backend is running
   - Check for error messages

2. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Test API Directly:**
   ```bash
   # Test health endpoint
   curl http://localhost:8000/health
   
   # Test with browser
   # Visit: http://localhost:8000/health
   ```

4. **Check Environment Variables:**
   - Backend: `backend/.env`
   - Frontend: `frontend/.env` (if needed)

---

## 📞 Still Having Issues?

1. **Check all logs:**
   - Backend terminal
   - Frontend terminal
   - Browser console

2. **Verify installation:**
   ```bash
   # Backend
   cd backend
   npm list --depth=0
   
   # Frontend
   cd frontend
   npm list --depth=0
   ```

3. **Restart everything:**
   - Stop both servers (Ctrl+C)
   - Restart backend
   - Restart frontend
   - Clear browser cache

---

**Last Updated:** 2026-02-19
