# Vercel Deployment Guide

This guide will help you deploy the RIFT CI/CD Healing Agent to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. GitHub account (for connecting your repository)
3. Environment variables ready (see below)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is pushed to a GitHub repository.

### 2. Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`

### 3. Configure Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables and add:

**Required:**
- `GITHUB_TOKEN` - Your GitHub personal access token (for cloning private repos and pushing branches)
- `GEMINI_API_KEY` - (Optional) Google Gemini API key for AI features

**Optional:**
- `PORT` - Server port (defaults to 8000, not needed for Vercel)
- `NODE_ENV` - Set to `production`

### 4. Build Settings

Vercel will automatically detect:
- **Root Directory**: `/` (root of monorepo)
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

### 5. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Project Structure

```
Rift/
├── frontend/          # React + Vite frontend
│   ├── src/
│   └── dist/          # Build output
├── backend/           # Express backend
│   └── src/
├── api/               # Vercel serverless wrapper
│   └── index.js
└── vercel.json        # Vercel configuration
```

## API Routes

All backend API routes are accessible via `/api/*`:
- `/api/run-agent` - Start agent run
- `/api/runs/:id/status` - Get run status
- `/api/runs/:id/results` - Get run results
- `/api/runs/:id/logs` - Get run logs
- `/api/chat` - Chat endpoint
- `/api/health` - Health check

## Frontend Configuration

The frontend automatically uses:
- Production: `/api` (relative path to Vercel serverless functions)
- Development: `http://localhost:8000` (local backend)

## Important Notes

### Serverless Limitations

1. **Execution Time**: Vercel serverless functions have a 10-second timeout on the Hobby plan, 60 seconds on Pro
   - Long-running agent tasks may need to be moved to a background job service
   - Consider using Vercel Cron Jobs or external services for long tasks

2. **File System**: 
   - `/tmp` directory is writable (use for workspace)
   - Files are ephemeral and may be cleaned up
   - Consider using external storage (S3, etc.) for persistent data

3. **Docker**: 
   - Docker is not available in Vercel serverless functions
   - The sandbox execution feature will not work on Vercel
   - Consider using external Docker services or adapt the code

### Recommended Architecture for Production

For production use, consider:

1. **Frontend**: Deploy to Vercel (static hosting)
2. **Backend API**: Deploy to Railway, Render, or AWS Lambda
3. **Long Tasks**: Use a queue service (BullMQ, AWS SQS) with workers
4. **Storage**: Use S3 or similar for workspace files
5. **Docker**: Use external Docker service (Fly.io, Railway) for sandbox execution

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18.x by default)
- Check build logs in Vercel dashboard

### API Routes Not Working

- Verify `api/index.js` exists and exports the Express app
- Check that routes are prefixed with `/api` in frontend
- Review Vercel function logs

### Environment Variables Not Loading

- Ensure variables are set in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Alternative: Separate Deployments

If serverless limitations are an issue, you can:

1. **Deploy Frontend to Vercel**: Static site hosting
2. **Deploy Backend to Railway/Render**: Full Node.js server with Docker support
3. **Update Frontend API URL**: Point to your backend URL

Update `frontend/.env.production`:
```
VITE_API_URL=https://your-backend.railway.app
```

## Support

For issues, check:
- Vercel documentation: https://vercel.com/docs
- Project README.md
- Troubleshooting guide in project docs
