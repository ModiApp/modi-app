/**
 * API Configuration
 * 
 * Automatically resolves the API base URL:
 * - Production: uses EXPO_PUBLIC_API_BASE_URL or falls back to production URL
 * - Vercel Preview (PR): constructs Heroku review app URL from PR number
 * - Local dev: uses EXPO_PUBLIC_API_BASE_URL (typically localhost)
 */

const PRODUCTION_API_URL = 'https://api.modi.app';

function getApiBaseUrl(): string {
  // Check for explicit env var first (local dev, production override)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Vercel preview builds: construct Heroku review app URL
  const prNumber = process.env.VERCEL_GIT_PULL_REQUEST_ID;
  if (prNumber) {
    return `https://modi-api-pr-${prNumber}.herokuapp.com`;
  }

  // Fallback to production
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();
