import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

/**
 * Package the Next.js public booking app for Vercel deployment
 * Returns a map of file paths to their content (base64 encoded for binary files)
 */
export async function packagePublicBookingApp(
  businessId: number,
  apiUrl: string,
  primaryColor?: string,
  secondaryColor?: string,
  theme?: string
): Promise<Record<string, string>> {
  const appDir = path.join(process.cwd(), 'public-booking-app');
  const files: Record<string, string> = {};

  // Read all files recursively
  async function readDir(dir: string, baseDir: string = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(baseDir, entry.name);

      // Skip node_modules, .next, and other build artifacts
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
        continue;
      }

      if (entry.isDirectory()) {
        await readDir(fullPath, relativePath);
      } else {
        let content = await fs.readFile(fullPath, 'utf-8');
        
        // Use template file for lib/api.ts with simple placeholder replacement
        const normalizedPath = relativePath.replace(/\\/g, '/');
        
        if (normalizedPath === 'lib/api.template.ts') {
          console.log('[DEPLOY] Found api.template.ts, injecting hardcoded values');
          // Replace placeholders with actual values
          content = content.replace(/__API_URL__/g, apiUrl);
          content = content.replace(/__BUSINESS_ID__/g, String(businessId));
          // Save as api.ts instead of api.template.ts
          files['lib/api.ts'] = content;
          console.log('[DEPLOY] Injected API_URL:', apiUrl, 'BUSINESS_ID:', businessId);
          continue; // Skip adding the template file itself
        }
        
        // Skip the original api.ts file since we're using the template
        if (normalizedPath === 'lib/api.ts') {
          console.log('[DEPLOY] Skipping original api.ts (using template instead)');
          continue;
        }
        
        files[relativePath] = content;
      }
    }
  }

  await readDir(appDir);

  // Add .env.production with business-specific config
  const envVars = [
    `NEXT_PUBLIC_API_URL=${apiUrl}`,
    `NEXT_PUBLIC_BUSINESS_ID=${businessId}`,
  ];
  
  if (primaryColor) envVars.push(`NEXT_PUBLIC_PRIMARY_COLOR=${primaryColor}`);
  if (secondaryColor) envVars.push(`NEXT_PUBLIC_SECONDARY_COLOR=${secondaryColor}`);
  if (theme) envVars.push(`NEXT_PUBLIC_THEME=${theme}`);
  
  files['.env.production'] = envVars.join('\n');

  // Add vercel.json for production deployment configuration
  files['vercel.json'] = JSON.stringify({
    version: 2,
    builds: [
      {
        src: 'package.json',
        use: '@vercel/next',
      },
    ],
    env: {
      NEXT_PUBLIC_API_URL: apiUrl,
      NEXT_PUBLIC_BUSINESS_ID: String(businessId),
      ...(primaryColor && { NEXT_PUBLIC_PRIMARY_COLOR: primaryColor }),
      ...(secondaryColor && { NEXT_PUBLIC_SECONDARY_COLOR: secondaryColor }),
      ...(theme && { NEXT_PUBLIC_THEME: theme }),
    },
  }, null, 2);

  return files;
}

/**
 * Create Vercel deployment using their API
 * https://vercel.com/docs/rest-api/endpoints#create-a-new-deployment
 */
export async function createVercelDeployment(
  projectId: string,
  files: Record<string, string>,
  token: string,
  target: 'production' | 'preview' = 'production'
): Promise<{ id: string; url: string; readyState: string }> {
  const filesArray = Object.entries(files).map(([file, data]) => ({
    file,
    data,
    encoding: 'utf-8',
  }));

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectId,
      files: filesArray,
      projectSettings: {
        framework: 'nextjs',
      },
      target, // 'production' ensures it goes to production, not preview
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel deployment failed: ${error}`);
  }

  const deployment = await response.json();
  return {
    id: deployment.id,
    url: deployment.url,
    readyState: deployment.readyState || 'BUILDING',
  };
}

/**
 * Wait for deployment to be ready
 */
export async function waitForDeployment(
  deploymentId: string,
  token: string,
  maxWaitMs: number = 300000 // 5 minutes
): Promise<{ ready: boolean; url: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check deployment status');
    }

    const deployment = await response.json();

    if (deployment.readyState === 'READY') {
      return { ready: true, url: deployment.url };
    }

    if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
      throw new Error(`Deployment failed with state: ${deployment.readyState}`);
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Deployment timed out');
}
