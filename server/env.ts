// Load environment variables for node scripts and server-side code in development.
import path from 'path';
import fs from 'fs';

// Only attempt to load .env.local in non-production environments if present.
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    // Load dotenv dynamically so we don't add it as a runtime dependency for production builds.
    try {
       
      const dotenv = require('dotenv');
      dotenv.config({ path: envPath });
       
      console.log('[env] Loaded .env.local for development');
    } catch (err) {
      // ignore if dotenv isn't installed in this environment
       
      console.warn('[env] dotenv not available, relying on process.env');
    }
  }
}

export {};
