import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Logger } from '../utils/logger.js';
import { AuthenticationError } from '../utils/errors.js';

const logger = new Logger('GCPAuth');

export interface GCPUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface GCPAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class GCPAuthService {
  private oauth2Client: OAuth2Client;
  private config: GCPAuthConfig;

  constructor(config: GCPAuthConfig) {
    this.config = config;
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.config.scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });

    logger.info('Generated OAuth2 authorization URL');
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    tokens: any;
    user: GCPUser;
  }> {
    try {
      logger.info('Exchanging authorization code for tokens');
      
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      if (!userInfo.data.email) {
        throw new AuthenticationError('Failed to get user email from Google');
      }

      const user: GCPUser = {
        id: userInfo.data.id || '',
        email: userInfo.data.email,
        name: userInfo.data.name || '',
        picture: userInfo.data.picture || undefined,
        verified_email: userInfo.data.verified_email || false,
      };

      logger.info('Successfully authenticated user', { email: user.email });
      
      return { tokens, user };
    } catch (error) {
      logger.error('Failed to exchange code for tokens', error as Error);
      throw new AuthenticationError(
        `GCP authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify and refresh tokens
   */
  async verifyAndRefreshTokens(tokens: any): Promise<{
    tokens: any;
    user: GCPUser;
  }> {
    try {
      this.oauth2Client.setCredentials(tokens);
      
      // Try to refresh token if needed
      if (tokens.refresh_token) {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);
        tokens = credentials;
      }

      // Get user info to verify token is still valid
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      if (!userInfo.data.email) {
        throw new AuthenticationError('Invalid or expired GCP token');
      }

      const user: GCPUser = {
        id: userInfo.data.id || '',
        email: userInfo.data.email,
        name: userInfo.data.name || '',
        picture: userInfo.data.picture || undefined,
        verified_email: userInfo.data.verified_email || false,
      };

      logger.info('Successfully verified GCP tokens', { email: user.email });
      
      return { tokens, user };
    } catch (error) {
      logger.error('Failed to verify GCP tokens', error as Error);
      throw new AuthenticationError(
        `GCP token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Revoke tokens
   */
  async revokeTokens(tokens: any): Promise<void> {
    try {
      this.oauth2Client.setCredentials(tokens);
      await this.oauth2Client.revokeToken(tokens.access_token);
      logger.info('Successfully revoked GCP tokens');
    } catch (error) {
      logger.error('Failed to revoke GCP tokens', error as Error);
      // Don't throw error for revocation failure
    }
  }
}
