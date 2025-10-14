import express from 'express';
import cors from 'cors';
import { Logger } from '../utils/logger.js';
import { GCPAuthService, type GCPUser } from './gcp-auth.js';

const logger = new Logger('OAuthServer');

export interface OAuthServerConfig {
  port: number;
  gcpAuth: GCPAuthService;
  onAuthSuccess: (user: GCPUser, tokens: any) => void;
  onAuthError: (error: Error) => void;
}

export class OAuthServer {
  private app: express.Application;
  private server: any;
  private config: OAuthServerConfig;

  constructor(config: OAuthServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes(): void {
    // Serve the OAuth callback page
    this.app.get('/', (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Circle MCP - Google Authentication</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .success { color: #4CAF50; }
            .error { color: #f44336; }
            .loading { color: #2196F3; }
            .button { 
              background: #4285f4; 
              color: white; 
              padding: 12px 24px; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
              font-size: 16px;
              text-decoration: none;
              display: inline-block;
              margin: 10px;
            }
            .button:hover { background: #3367d6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Circle MCP Authentication</h1>
            <p>Please authenticate with Google to use Circle community features.</p>
            <a href="/auth/google" class="button">Sign in with Google</a>
            <div id="status"></div>
          </div>
          <script>
            // Check for auth result in URL
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('success') === 'true') {
              document.getElementById('status').innerHTML = 
                '<p class="success">✅ Authentication successful! You can now close this window and return to your chat.</p>';
            } else if (urlParams.get('error')) {
              document.getElementById('status').innerHTML = 
                '<p class="error">❌ Authentication failed: ' + urlParams.get('error') + '</p>';
            }
          </script>
        </body>
        </html>
      `);
    });

    // Start OAuth flow
    this.app.get('/auth/google', (_req, res) => {
      try {
        const authUrl = this.config.gcpAuth.generateAuthUrl();
        logger.info('Redirecting to Google OAuth');
        res.redirect(authUrl);
      } catch (error) {
        logger.error('Failed to generate auth URL', error as Error);
        res.redirect('/?error=' + encodeURIComponent('Failed to start authentication'));
      }
    });

    // OAuth callback
    this.app.get('/auth/google/callback', async (req, res) => {
      try {
        const { code, error } = req.query;

        if (error) {
          logger.error('OAuth error from Google', new Error(String(error)));
          this.config.onAuthError(new Error(`OAuth error: ${error}`));
          res.redirect('/?error=' + encodeURIComponent(`OAuth error: ${error}`));
          return;
        }

        if (!code || typeof code !== 'string') {
          logger.error('No authorization code received');
          this.config.onAuthError(new Error('No authorization code received'));
          res.redirect('/?error=' + encodeURIComponent('No authorization code received'));
          return;
        }

        logger.info('Received authorization code, exchanging for tokens');
        const { tokens, user } = await this.config.gcpAuth.exchangeCodeForTokens(code);
        
        // Notify the MCP server of successful authentication
        this.config.onAuthSuccess(user, tokens);
        
        logger.info('Authentication successful', { email: user.email });
        res.redirect('/?success=true');
        
      } catch (error) {
        logger.error('OAuth callback error', error as Error);
        this.config.onAuthError(error as Error);
        res.redirect('/?error=' + encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        ));
      }
    });

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, (error?: Error) => {
        if (error) {
          logger.error('Failed to start OAuth server', error);
          reject(error);
        } else {
          logger.info(`OAuth server started on port ${this.config.port}`);
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('OAuth server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getAuthUrl(): string {
    return `http://localhost:${this.config.port}/auth/google`;
  }

  getCallbackUrl(): string {
    return `http://localhost:${this.config.port}/auth/google/callback`;
  }
}
