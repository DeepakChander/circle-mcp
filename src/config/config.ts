import { config as dotenvConfig } from 'dotenv';
import type { CircleConfig } from '../types/mcp.js';

dotenvConfig();

export const config: CircleConfig = {
  headlessToken: process.env.CIRCLE_HEADLESS_TOKEN || '',
  adminV2Token: process.env.CIRCLE_ADMIN_V2_TOKEN || '',
  communityUrl: process.env.CIRCLE_COMMUNITY_URL || '',
  headlessBaseUrl: process.env.CIRCLE_HEADLESS_BASE_URL || 'https://app.circle.so',
  readOnlyMode: process.env.READ_ONLY_MODE === 'true',
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60'),
  cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300'),
  logLevel: process.env.LOG_LEVEL || 'info',
  // GCP OAuth settings
  gcpClientId: process.env.GCP_CLIENT_ID || '',
  gcpClientSecret: process.env.GCP_CLIENT_SECRET || '',
  gcpRedirectUri: process.env.GCP_REDIRECT_URI || 'http://localhost:3000/callback',
  oauthPort: parseInt(process.env.OAUTH_PORT || '3000'),
  // Server URL for OAuth redirects
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  // MCP token expiry settings
  mcpTokenExpiry: parseInt(process.env.MCP_TOKEN_EXPIRY || '3600'),
  mcpRefreshTokenExpiry: parseInt(process.env.MCP_REFRESH_TOKEN_EXPIRY || '2592000'),
};

export function validateConfig(): void {
  if (!config.headlessToken) {
    throw new Error('CIRCLE_HEADLESS_TOKEN is required');
  }
  if (!config.communityUrl) {
    throw new Error('CIRCLE_COMMUNITY_URL is required');
  }
  if (!config.communityUrl.startsWith('http')) {
    throw new Error('CIRCLE_COMMUNITY_URL must be a valid URL');
  }
}