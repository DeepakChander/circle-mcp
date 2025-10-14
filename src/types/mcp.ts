import type { z } from 'zod';

export interface ToolConfig {
  name: string;
  description: string;
  inputSchema: z.ZodRawShape;
}

// Use MCP SDK's built-in return type instead of custom ToolResult

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

export interface CircleConfig {
  headlessToken: string;
  adminV2Token?: string; // Optional Admin V2 token for advanced operations
  communityUrl: string;
  headlessBaseUrl?: string; // defaults to https://app.circle.so per docs
  readOnlyMode: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  cacheTTL: number;
  logLevel: string;
  // GCP OAuth settings
  gcpClientId: string;
  gcpClientSecret: string;
  gcpRedirectUri: string;
  oauthPort: number;
}