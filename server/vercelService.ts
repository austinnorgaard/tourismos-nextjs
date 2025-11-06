/**
 * Vercel Deployment Service
 * 
 * This service handles deployment of public booking sites to Vercel.
 * It creates a new Vercel project for each business and deploys the standalone app.
 * 
 * Required Environment Variables:
 * - VERCEL_TOKEN: Vercel API token (get from vercel.com/account/tokens)
 * - VERCEL_TEAM_ID: (Optional) Vercel team ID if deploying to a team
 */

const VERCEL_API_URL = "https://api.vercel.com";

interface VercelDeploymentConfig {
  businessId: number;
  businessName: string;
  apiUrl: string;
  vercelToken?: string; // Optional business-specific token
  primaryColor?: string;
  secondaryColor?: string;
  theme?: string;
}

interface VercelProjectResponse {
  id: string;
  name: string;
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: string;
}

/**
 * Create a new Vercel project for a business
 */
export async function createVercelProject(
  businessName: string,
  businessId: number,
  apiUrl: string,
  vercelToken?: string
): Promise<VercelProjectResponse> {
  const token = vercelToken || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN not provided and environment variable not set");
  }

  // Sanitize business name for project name (lowercase, alphanumeric, hyphens only)
  const projectName = `tourismos-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${businessId}`;

  const response = await fetch(`${VERCEL_API_URL}/v9/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      framework: "nextjs",
      publicSource: true, // Make deployments public
      ssoProtection: null, // Disable Vercel Authentication
      environmentVariables: [
        {
          key: "NEXT_PUBLIC_API_URL",
          value: apiUrl,
          type: "encrypted",
          target: ["production", "preview", "development"],
        },
        {
          key: "NEXT_PUBLIC_BUSINESS_ID",
          value: businessId.toString(),
          type: "encrypted",
          target: ["production", "preview", "development"],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Vercel project: ${error}`);
  }

  return await response.json();
}

/**
 * Deploy the public booking app to Vercel
 * Packages the Next.js app and deploys it to production
 */
export async function deployToVercel(
  config: VercelDeploymentConfig
): Promise<VercelDeploymentResponse> {
  const token = config.vercelToken || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN not provided and environment variable not set");
  }

  // Import deployment helpers
  const { packagePublicBookingApp, createVercelDeployment, waitForDeployment } = await import('./deploymentHelper');

  // Package the Next.js app with business-specific configuration
  const files = await packagePublicBookingApp(
    config.businessId,
    config.apiUrl,
    config.primaryColor,
    config.secondaryColor,
    config.theme
  );

  // Get the project name (should match what was created)
  const projectName = `tourismos-${config.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${config.businessId}`;

  // Create deployment to production
  const deployment = await createVercelDeployment(
    projectName,
    files,
    token,
    'production' // Deploy to production, not preview
  );

  // Wait for deployment to be ready (optional, can be done async)
  // Comment out if you want immediate return
  try {
    const result = await waitForDeployment(deployment.id, token, 180000); // 3 min timeout
    return {
      id: deployment.id,
      url: result.url,
      readyState: 'READY',
    };
  } catch (error) {
    // Return deployment info even if we timeout waiting
    return {
      id: deployment.id,
      url: deployment.url,
      readyState: deployment.readyState,
    };
  }
}

/**
 * Add a custom domain to a Vercel project
 */
export async function addCustomDomain(
  projectId: string,
  domain: string,
  vercelToken?: string
): Promise<void> {
  const token = vercelToken || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN not provided and environment variable not set");
  }

  const response = await fetch(
    `${VERCEL_API_URL}/v9/projects/${projectId}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add custom domain: ${error}`);
  }
}

/**
 * Remove a custom domain from a Vercel project
 */
export async function removeCustomDomain(
  projectId: string,
  domain: string,
  vercelToken?: string
): Promise<void> {
  const token = vercelToken || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN not provided and environment variable not set");
  }

  const response = await fetch(
    `${VERCEL_API_URL}/v9/projects/${projectId}/domains/${domain}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to remove custom domain: ${error}`);
  }
}

/**
 * Delete a Vercel project
 */
export async function deleteVercelProject(
  projectId: string,
  vercelToken?: string
): Promise<void> {
  const token = vercelToken || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN not provided and environment variable not set");
  }

  const response = await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete Vercel project: ${error}`);
  }
}

/**
 * Update environment variables for an existing Vercel project
 */
export async function updateProjectEnvironmentVariables(
  projectId: string,
  envVars: Array<{ key: string; value: string; target: string[] }>,
  vercelToken?: string
): Promise<void> {
  const token = vercelToken || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN not provided and environment variable not set");
  }

  // First, get existing env vars to avoid duplicates
  const getResponse = await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}/env`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!getResponse.ok) {
    const error = await getResponse.text();
    throw new Error(`Failed to get project env vars: ${error}`);
  }

  const existingEnvVars = await getResponse.json();

  // Delete existing env vars with the same keys
  for (const envVar of envVars) {
    const existing = existingEnvVars.envs?.find((e: any) => e.key === envVar.key);
    if (existing) {
      await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}/env/${existing.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  // Add new env vars
  for (const envVar of envVars) {
    const response = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: envVar.key,
        value: envVar.value,
        type: "encrypted",
        target: envVar.target,
      }),
    });

    if (!response.ok) {
      const error = await getResponse.text();
      throw new Error(`Failed to add env var ${envVar.key}: ${error}`);
    }
  }
}
