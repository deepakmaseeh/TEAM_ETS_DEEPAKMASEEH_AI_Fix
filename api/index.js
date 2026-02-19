// Vercel serverless function wrapper for Express backend
import serverless from 'serverless-http';

// Set Vercel environment flags before importing
process.env.VERCEL = 'true';
process.env.VERCEL_ENV = process.env.VERCEL_ENV || process.env.VERCEL ? 'production' : 'development';

// Import and initialize the app
// The app will be initialized when the module is loaded
import appModule from '../backend/src/index.js';

// Get the app instance (it's exported as default from index.js)
const app = appModule.default || appModule;

// Wrap with serverless-http for Vercel
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

export default handler;
