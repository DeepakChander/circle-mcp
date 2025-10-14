import { Logger } from '../utils/logger.js';
import { AuthenticationError } from '../utils/errors.js';
import { GCPAuthService, type GCPUser } from './gcp-auth.js';
import { OAuthServer } from './oauth-server.js';
import { CircleAuth } from './auth.js';
import { UserStorage } from './user-storage.js';
import open from 'open';

const logger = new Logger('IntegratedAuthManager');

export interface IntegratedAuthConfig {
  gcp: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
  circle: {
    headlessToken: string;
    communityUrl: string;
  };
  oauthPort: number;
}

export interface AuthenticatedUser {
  gcp: {
    user: GCPUser;
    tokens: any;
  };
  circle: {
    email: string;
    tokens: any;
  };
}

export class IntegratedAuthManager {
  private gcpAuth: GCPAuthService;
  private circleAuth: CircleAuth;
  private userStorage: UserStorage;
  private oauthServer: OAuthServer | null = null;
  private config: IntegratedAuthConfig;
  private currentUser: AuthenticatedUser | null = null;

  constructor(config: IntegratedAuthConfig) {
    this.config = config;
    this.gcpAuth = new GCPAuthService(config.gcp);
    this.circleAuth = new CircleAuth(config.circle.headlessToken, config.circle.communityUrl);
    this.userStorage = new UserStorage(config.circle.communityUrl);
    
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    try {
      const storedUser = this.userStorage.getUserInfo();
      if (storedUser) {
        logger.info('Found stored user', { email: storedUser.email });
        // We'll need to verify the stored tokens are still valid
      }
    } catch (error) {
      logger.warn('Failed to load stored user', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Start the OAuth flow by opening browser
   */
  async startOAuthFlow(): Promise<void> {
    try {
      logger.info('Starting OAuth flow');
      
      // Start OAuth server
      this.oauthServer = new OAuthServer({
        port: this.config.oauthPort,
        gcpAuth: this.gcpAuth,
        onAuthSuccess: this.handleAuthSuccess.bind(this),
        onAuthError: this.handleAuthError.bind(this),
      });

      await this.oauthServer.start();
      
      // Open browser to OAuth URL
      const authUrl = this.oauthServer.getAuthUrl();
      logger.info('Opening browser for OAuth', { url: authUrl });
      
      await open(authUrl);
      
    } catch (error) {
      logger.error('Failed to start OAuth flow', error as Error);
      throw new AuthenticationError(
        `Failed to start OAuth flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleAuthSuccess(gcpUser: GCPUser, gcpTokens: any): Promise<void> {
    try {
      logger.info('GCP authentication successful', { email: gcpUser.email });

      // Now authenticate with Circle using the GCP user's email
      logger.info('Authenticating with Circle using GCP email', { email: gcpUser.email });
      await this.circleAuth.authenticate({ email: gcpUser.email });

      // Get Circle tokens
      const circleTokens = this.circleAuth.getTokenManager().getToken(gcpUser.email);
      if (!circleTokens) {
        throw new AuthenticationError('Failed to get Circle tokens');
      }

      // Store the integrated user data
      this.currentUser = {
        gcp: {
          user: gcpUser,
          tokens: gcpTokens,
        },
        circle: {
          email: gcpUser.email,
          tokens: circleTokens,
        },
      };

      // Save to storage
      this.userStorage.setUser(gcpUser.email, this.config.circle.communityUrl);
      
      logger.info('Integrated authentication successful', { 
        gcpEmail: gcpUser.email,
        circleEmail: gcpUser.email 
      });

      // Stop OAuth server
      if (this.oauthServer) {
        await this.oauthServer.stop();
        this.oauthServer = null;
      }

    } catch (error) {
      logger.error('Failed to complete integrated authentication', error as Error);
      this.handleAuthError(error as Error);
    }
  }

  private handleAuthError(error: Error): void {
    logger.error('Authentication error', error);
    // Stop OAuth server
    if (this.oauthServer) {
      this.oauthServer.stop().catch(() => {});
      this.oauthServer = null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    try {
      // Verify GCP tokens
      const { tokens: refreshedGcpTokens, user: refreshedGcpUser } = await this.gcpAuth.verifyAndRefreshTokens(this.currentUser.gcp.tokens);

      // Update current user with refreshed GCP tokens if they changed
      this.currentUser.gcp.tokens = refreshedGcpTokens;
      this.currentUser.gcp.user = refreshedGcpUser;

      // Verify Circle tokens
      const isValid = this.circleAuth.isAuthenticated(this.currentUser.circle.email);
      if (!isValid) {
        // Try to refresh Circle tokens
        await this.circleAuth.refreshToken(this.currentUser.circle.email);
      }

      return true;
    } catch (error) {
      logger.warn('Authentication verification failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser;
  }

  /**
   * Get valid Circle access token
   */
  async getValidCircleToken(): Promise<string> {
    if (!this.currentUser) {
      throw new AuthenticationError('No user authenticated');
    }

    try {
      return await this.circleAuth.getValidToken(this.currentUser.circle.email);
    } catch (error) {
      logger.error('Failed to get valid Circle token', error as Error);
      throw new AuthenticationError(
        `Failed to get Circle token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.currentUser) {
        // Revoke GCP tokens
        await this.gcpAuth.revokeTokens(this.currentUser.gcp.tokens);

        // Logout from Circle
        this.circleAuth.logout(this.currentUser.circle.email);
      }

      // Clear stored data
      this.userStorage.clearUser();
      this.currentUser = null;

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Error during logout', error as Error);
      // Still clear local data even if remote logout fails
      this.userStorage.clearUser();
      this.currentUser = null;
    }
  }

  /**
   * Get Circle auth instance for API calls
   */
  getCircleAuth(): CircleAuth {
    return this.circleAuth;
  }
}
