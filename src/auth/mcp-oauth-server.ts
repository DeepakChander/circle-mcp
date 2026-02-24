import crypto from 'crypto';
import type { Request, Response } from 'express';
import { GCPAuthService } from './gcp-auth.js';
import { CircleAuth } from './auth.js';
import { config } from '../config/config.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('McpOAuthServer');

// --- Types ---

interface OAuthClientRegistration {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  clientName: string;
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  createdAt: number;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  email?: string;
  createdAt: number;
}

interface McpAccessToken {
  token: string;
  email: string;
  clientId: string;
  expiresAt: number;
  createdAt: number;
}

interface McpRefreshToken {
  token: string;
  email: string;
  clientId: string;
  accessToken: string;
  expiresAt: number;
  createdAt: number;
}

// --- PKCE ---

function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return hash === codeChallenge;
}

// --- McpOAuthServer ---

export class McpOAuthServer {
  private clients: Map<string, OAuthClientRegistration> = new Map();
  private authCodes: Map<string, AuthorizationCode> = new Map();
  private accessTokens: Map<string, McpAccessToken> = new Map();
  private refreshTokens: Map<string, McpRefreshToken> = new Map();
  private pendingGoogleFlows: Map<string, AuthorizationCode> = new Map();

  private gcpAuth: GCPAuthService;
  private circleAuth: CircleAuth;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(gcpAuth: GCPAuthService, circleAuth: CircleAuth) {
    this.gcpAuth = gcpAuth;
    this.circleAuth = circleAuth;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  getCircleAuth(): CircleAuth {
    return this.circleAuth;
  }

  // Validate a bearer token and return the email if valid
  validateAccessToken(token: string): string | null {
    const accessToken = this.accessTokens.get(token);
    if (!accessToken) return null;
    if (Date.now() >= accessToken.expiresAt) {
      this.accessTokens.delete(token);
      return null;
    }
    return accessToken.email;
  }

  // --- Endpoint Handlers ---

  handleProtectedResourceMetadata(_req: Request, res: Response): void {
    res.json({
      resource: config.serverUrl,
      authorization_servers: [config.serverUrl],
      bearer_methods_supported: ['header'],
    });
  }

  handleAuthorizationServerMetadata(_req: Request, res: Response): void {
    const base = config.serverUrl;
    res.json({
      issuer: base,
      authorization_endpoint: `${base}/authorize`,
      token_endpoint: `${base}/token`,
      registration_endpoint: `${base}/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
    });
  }

  handleRegister(req: Request, res: Response): void {
    const {
      redirect_uris,
      client_name,
      grant_types,
      response_types,
      token_endpoint_auth_method,
    } = req.body;

    if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      res.status(400).json({ error: 'invalid_client_metadata', error_description: 'redirect_uris is required' });
      return;
    }

    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomUUID();

    const client: OAuthClientRegistration = {
      clientId,
      clientSecret,
      redirectUris: redirect_uris,
      clientName: client_name || 'MCP Client',
      grantTypes: grant_types || ['authorization_code'],
      responseTypes: response_types || ['code'],
      tokenEndpointAuthMethod: token_endpoint_auth_method || 'none',
      createdAt: Date.now(),
    };

    this.clients.set(clientId, client);
    logger.info('Registered new OAuth client', { clientId, clientName: client.clientName });

    res.status(201).json({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: client.redirectUris,
      client_name: client.clientName,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
    });
  }

  handleAuthorize(req: Request, res: Response): void {
    const {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
      state,
    } = req.query as Record<string, string>;

    // Validate client
    const client = this.clients.get(client_id);
    if (!client) {
      res.status(400).json({ error: 'invalid_client', error_description: 'Unknown client_id' });
      return;
    }

    // Validate redirect_uri
    if (!client.redirectUris.includes(redirect_uri)) {
      res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
      return;
    }

    // Validate response_type
    if (response_type !== 'code') {
      res.status(400).json({ error: 'unsupported_response_type' });
      return;
    }

    // Validate PKCE
    if (!code_challenge || code_challenge_method !== 'S256') {
      res.status(400).json({ error: 'invalid_request', error_description: 'PKCE with S256 is required' });
      return;
    }

    // Create pending authorization
    const authCode: AuthorizationCode = {
      code: '', // Will be set after Google auth
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      state: state || '',
      createdAt: Date.now(),
    };

    // Generate a state to link Google flow back
    const googleState = crypto.randomUUID();
    this.pendingGoogleFlows.set(googleState, authCode);

    // Redirect to Google OAuth
    const googleAuthUrl = this.gcpAuth.generateAuthUrl(googleState);
    logger.info('Redirecting to Google OAuth', { clientId: client_id });
    res.redirect(googleAuthUrl);
  }

  async handleCallback(req: Request, res: Response): Promise<void> {
    const { code: googleCode, state: googleState, error: googleError } = req.query as Record<string, string>;

    if (googleError) {
      logger.error('Google OAuth error', new Error(googleError));
      // Try to find the pending flow to redirect back with error
      const pendingFlow = googleState ? this.pendingGoogleFlows.get(googleState) : null;
      if (pendingFlow) {
        this.pendingGoogleFlows.delete(googleState);
        const redirectUrl = new URL(pendingFlow.redirectUri);
        redirectUrl.searchParams.set('error', 'access_denied');
        redirectUrl.searchParams.set('error_description', 'Google authentication failed');
        if (pendingFlow.state) redirectUrl.searchParams.set('state', pendingFlow.state);
        res.redirect(redirectUrl.toString());
      } else {
        res.status(400).json({ error: 'access_denied', error_description: 'Google authentication failed' });
      }
      return;
    }

    if (!googleCode || !googleState) {
      res.status(400).json({ error: 'invalid_request', error_description: 'Missing code or state' });
      return;
    }

    // Find the pending MCP auth flow
    const pendingFlow = this.pendingGoogleFlows.get(googleState);
    if (!pendingFlow) {
      res.status(400).json({ error: 'invalid_request', error_description: 'Invalid or expired state' });
      return;
    }
    this.pendingGoogleFlows.delete(googleState);

    try {
      // Exchange Google code for tokens + user info
      const { user: gcpUser } = await this.gcpAuth.exchangeCodeForTokens(googleCode);
      const email = gcpUser.email;

      logger.info('Google OAuth successful', { email });

      // Authenticate with Circle to verify user is a member
      try {
        await this.circleAuth.authenticate({ email });
      } catch (circleError) {
        logger.warn('Circle authentication failed - user not a member', { email });
        const redirectUrl = new URL(pendingFlow.redirectUri);
        redirectUrl.searchParams.set('error', 'access_denied');
        redirectUrl.searchParams.set('error_description', 'Email not registered in this Circle community');
        if (pendingFlow.state) redirectUrl.searchParams.set('state', pendingFlow.state);
        res.redirect(redirectUrl.toString());
        return;
      }

      // Generate MCP authorization code
      const mcpCode = crypto.randomUUID();
      pendingFlow.code = mcpCode;
      pendingFlow.email = email;
      this.authCodes.set(mcpCode, pendingFlow);

      // Redirect back to IDE with the MCP auth code
      const redirectUrl = new URL(pendingFlow.redirectUri);
      redirectUrl.searchParams.set('code', mcpCode);
      if (pendingFlow.state) redirectUrl.searchParams.set('state', pendingFlow.state);

      logger.info('Redirecting to IDE with auth code', { email });
      res.redirect(redirectUrl.toString());
    } catch (error) {
      logger.error('Callback processing failed', error as Error);
      const redirectUrl = new URL(pendingFlow.redirectUri);
      redirectUrl.searchParams.set('error', 'server_error');
      redirectUrl.searchParams.set('error_description', 'Authentication processing failed');
      if (pendingFlow.state) redirectUrl.searchParams.set('state', pendingFlow.state);
      res.redirect(redirectUrl.toString());
    }
  }

  handleToken(req: Request, res: Response): void {
    const { grant_type } = req.body;

    if (grant_type === 'authorization_code') {
      this.handleAuthorizationCodeGrant(req, res);
    } else if (grant_type === 'refresh_token') {
      this.handleRefreshTokenGrant(req, res);
    } else {
      res.status(400).json({ error: 'unsupported_grant_type' });
    }
  }

  private handleAuthorizationCodeGrant(req: Request, res: Response): void {
    const { code, code_verifier, client_id } = req.body;

    if (!code || !code_verifier) {
      res.status(400).json({ error: 'invalid_request', error_description: 'code and code_verifier are required' });
      return;
    }

    const authCode = this.authCodes.get(code);
    if (!authCode) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' });
      return;
    }

    // Check expiry (10 minutes)
    if (Date.now() - authCode.createdAt > 10 * 60 * 1000) {
      this.authCodes.delete(code);
      res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired' });
      return;
    }

    // Verify client
    if (client_id && authCode.clientId !== client_id) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Client mismatch' });
      return;
    }

    // Verify PKCE
    if (!verifyPKCE(code_verifier, authCode.codeChallenge)) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      return;
    }

    // Delete the auth code (single use)
    this.authCodes.delete(code);

    // Issue tokens
    const accessTokenStr = crypto.randomUUID();
    const refreshTokenStr = crypto.randomUUID();
    const now = Date.now();

    const accessToken: McpAccessToken = {
      token: accessTokenStr,
      email: authCode.email!,
      clientId: authCode.clientId,
      expiresAt: now + config.mcpTokenExpiry * 1000,
      createdAt: now,
    };

    const refreshToken: McpRefreshToken = {
      token: refreshTokenStr,
      email: authCode.email!,
      clientId: authCode.clientId,
      accessToken: accessTokenStr,
      expiresAt: now + config.mcpRefreshTokenExpiry * 1000,
      createdAt: now,
    };

    this.accessTokens.set(accessTokenStr, accessToken);
    this.refreshTokens.set(refreshTokenStr, refreshToken);

    logger.info('Issued MCP tokens', { email: authCode.email });

    res.json({
      access_token: accessTokenStr,
      token_type: 'Bearer',
      expires_in: config.mcpTokenExpiry,
      refresh_token: refreshTokenStr,
    });
  }

  private handleRefreshTokenGrant(req: Request, res: Response): void {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token is required' });
      return;
    }

    const storedRefreshToken = this.refreshTokens.get(refresh_token);
    if (!storedRefreshToken) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid refresh token' });
      return;
    }

    if (Date.now() >= storedRefreshToken.expiresAt) {
      this.refreshTokens.delete(refresh_token);
      res.status(400).json({ error: 'invalid_grant', error_description: 'Refresh token expired' });
      return;
    }

    // Rotate tokens - delete old ones
    this.accessTokens.delete(storedRefreshToken.accessToken);
    this.refreshTokens.delete(refresh_token);

    // Issue new tokens
    const newAccessTokenStr = crypto.randomUUID();
    const newRefreshTokenStr = crypto.randomUUID();
    const now = Date.now();

    const newAccessToken: McpAccessToken = {
      token: newAccessTokenStr,
      email: storedRefreshToken.email,
      clientId: storedRefreshToken.clientId,
      expiresAt: now + config.mcpTokenExpiry * 1000,
      createdAt: now,
    };

    const newRefreshToken: McpRefreshToken = {
      token: newRefreshTokenStr,
      email: storedRefreshToken.email,
      clientId: storedRefreshToken.clientId,
      accessToken: newAccessTokenStr,
      expiresAt: now + config.mcpRefreshTokenExpiry * 1000,
      createdAt: now,
    };

    this.accessTokens.set(newAccessTokenStr, newAccessToken);
    this.refreshTokens.set(newRefreshTokenStr, newRefreshToken);

    logger.info('Rotated MCP tokens', { email: storedRefreshToken.email });

    res.json({
      access_token: newAccessTokenStr,
      token_type: 'Bearer',
      expires_in: config.mcpTokenExpiry,
      refresh_token: newRefreshTokenStr,
    });
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    // Clean expired auth codes (10 min TTL)
    for (const [key, authCode] of this.authCodes) {
      if (now - authCode.createdAt > 10 * 60 * 1000) {
        this.authCodes.delete(key);
        cleaned++;
      }
    }

    // Clean expired access tokens
    for (const [key, token] of this.accessTokens) {
      if (now >= token.expiresAt) {
        this.accessTokens.delete(key);
        cleaned++;
      }
    }

    // Clean expired refresh tokens
    for (const [key, token] of this.refreshTokens) {
      if (now >= token.expiresAt) {
        this.refreshTokens.delete(key);
        cleaned++;
      }
    }

    // Clean stale pending Google flows (10 min TTL)
    for (const [key, flow] of this.pendingGoogleFlows) {
      if (now - flow.createdAt > 10 * 60 * 1000) {
        this.pendingGoogleFlows.delete(key);
        cleaned++;
      }
    }

    // Clean stale client registrations (30 days with no activity)
    for (const [key, client] of this.clients) {
      if (now - client.createdAt > 30 * 24 * 60 * 60 * 1000) {
        this.clients.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned up expired OAuth entries', { cleaned });
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
