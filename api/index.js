// Vercel serverless function wrapper for Express backend
import serverless from 'serverless-http';

// Set Vercel environment flags before importing
process.env.VERCEL = 'true';
process.env.VERCEL_ENV = process.env.VERCEL_ENV || 'production';

// Import the app (routes are now registered synchronously)
import app from '../backend/src/index.js';

// Wrap with serverless-http for Vercel
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

export default handler;
