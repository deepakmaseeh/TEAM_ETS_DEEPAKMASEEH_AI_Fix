# Vercel 500 Error Fix

## Problem
The serverless function returns 500 errors because:
1. The Express app is exported before async initialization completes
2. Routes are registered inside async `main()` function
3. Vercel tries to use the app before routes are set up

## Solution

### 1. Updated `api/index.js`
- Made the handler async
- Added initialization promise to ensure app is ready
- Added error handling with proper error responses

### 2. Updated `backend/src/index.js`
- Fixed workspace directory to use `/tmp` in Vercel
- Disabled file logging in Vercel (use console.log instead)
- Disabled cleanup interval in Vercel (ephemeral filesystem)

## Key Changes

### api/index.js
- Handler now waits for app initialization
- Proper error responses for debugging
- Singleton pattern to ensure app is only initialized once

### backend/src/index.js
- Workspace uses `/tmp/workspace` in Vercel
- Logging uses console.log in Vercel
- Cleanup interval disabled in Vercel

## Testing

After deploying, check:
1. Vercel function logs for initialization errors
2. `/api/health` endpoint should return 200
3. `/api/run-agent` should work without 500 errors

## Next Steps

1. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Fix Vercel 500 error - async initialization"
   git push
   ```

2. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Check logs for `/api/index.js`
   - Look for initialization messages

3. **Test Endpoints**:
   - `GET /api/health` - Should return 200
   - `POST /api/run-agent` - Should return run_id

## Common Issues

### Still Getting 500?
- Check Vercel function logs for specific errors
- Verify `serverless-http` is installed: `cd backend && npm install`
- Check environment variables are set in Vercel dashboard

### Timeout Errors?
- Vercel functions have execution limits (10s Hobby, 60s Pro)
- Long-running agent tasks may timeout
- Consider using background jobs for agent runs
