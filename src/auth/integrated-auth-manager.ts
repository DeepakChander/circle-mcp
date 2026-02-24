import { Logger } from '../utils/logger.js';
import { AuthenticationError } from '../utils/errors.js';
import { GCPAuthService, type GCPUser } from './gcp-auth.js';
import { CircleAuth } from './auth.js';

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

/**
 * IntegratedAuthManager for stdio transport (local dev).
 * Manages GCP + Circle authentication for single-user CLI sessions.
 * The OAuth flow for stdio requires the `open` package and a temporary
 * local Express server — those are only available in stdio mode.
 */
export class IntegratedAuthManager {
  private gcpAuth: GCPAuthService;
  private circleAuth: CircleAuth;
  private config: IntegratedAuthConfig;
  private currentUser: AuthenticatedUser | null = null;

  constructor(config: IntegratedAuthConfig) {
    this.config = config;
    this.gcpAuth = new GCPAuthService(config.gcp);
    this.circleAuth = new CircleAuth(config.circle.headlessToken, config.circle.communityUrl);
  }

  /**
   * Start the OAuth flow by opening browser.
   * Dynamically imports `open` so it doesn't break builds that don't have it.
   */
  async startOAuthFlow(): Promise<void> {
    try {
      logger.info('Starting OAuth flow');

      // Dynamic import of express and open for stdio mode only
      const [{ default: express }, { default: open }] = await Promise.all([
        import('express'),
        import('open'),
      ]);

      const app = express();
      const port = this.config.oauthPort;

      // Generate auth URL
      const authUrl = this.gcpAuth.generateAuthUrl();

      // Setup callback route
      return new Promise((resolve, reject) => {
        const server = app.listen(port, async () => {
          logger.info('Temporary OAuth server started', { port });

          app.get('/auth/google/callback', async (req, res) => {
            try {
              const code = req.query.code as string;
              if (!code) {
                res.status(400).send('Missing authorization code');
                return;
              }

              const { tokens: gcpTokens, user: gcpUser } = await this.gcpAuth.exchangeCodeForTokens(code);
              await this.handleAuthSuccess(gcpUser, gcpTokens);

              res.send('<html><body><h2>Authentication successful!</h2><p>You can close this window.</p></body></html>');

              // Close the temp server
              server.close();
              resolve();
            } catch (error) {
              logger.error('OAuth callback error', error as Error);
              res.status(500).send('Authentication failed');
              server.close();
              reject(error);
            }
          });

          // Open browser
          await open(authUrl);
        });

        server.on('error', (error) => {
          reject(new AuthenticationError(`Failed to start OAuth server: ${error.message}`));
        });
      });
    } catch (error) {
      logger.error('Failed to start OAuth flow', error as Error);
      throw new AuthenticationError(
        `Failed to start OAuth flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleAuthSuccess(gcpUser: GCPUser, gcpTokens: any): Promise<void> {
    logger.info('GCP authentication successful', { email: gcpUser.email });

    // Authenticate with Circle using the GCP user's email
    await this.circleAuth.authenticate({ email: gcpUser.email });

    const circleTokens = this.circleAuth.getTokenManager().getToken(gcpUser.email);
    if (!circleTokens) {
      throw new AuthenticationError('Failed to get Circle tokens');
    }

    this.currentUser = {
      gcp: { user: gcpUser, tokens: gcpTokens },
      circle: { email: gcpUser.email, tokens: circleTokens },
    };

    logger.info('Integrated authentication successful', { email: gcpUser.email });
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      const { tokens: refreshedGcpTokens, user: refreshedGcpUser } =
        await this.gcpAuth.verifyAndRefreshTokens(this.currentUser.gcp.tokens);

      this.currentUser.gcp.tokens = refreshedGcpTokens;
      this.currentUser.gcp.user = refreshedGcpUser;

      const isValid = this.circleAuth.isAuthenticated(this.currentUser.circle.email);
      if (!isValid) {
        await this.circleAuth.refreshToken(this.currentUser.circle.email);
      }

      return true;
    } catch (error) {
      logger.warn('Authentication verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser;
  }

  async getValidCircleToken(): Promise<string> {
    if (!this.currentUser) throw new AuthenticationError('No user authenticated');
    return this.circleAuth.getValidToken(this.currentUser.circle.email);
  }

  async logout(): Promise<void> {
    try {
      if (this.currentUser) {
        await this.gcpAuth.revokeTokens(this.currentUser.gcp.tokens);
        this.circleAuth.logout(this.currentUser.circle.email);
      }
      this.currentUser = null;
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Error during logout', error as Error);
      this.currentUser = null;
    }
  }

  getCircleAuth(): CircleAuth {
    return this.circleAuth;
  }
}
