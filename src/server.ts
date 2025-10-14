import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/config.js';
import { IntegratedAuthManager } from './auth/integrated-auth-manager.js';
import { CircleAPIClient } from './api/client.js';
import { registerAllTools } from './tools/index.js';
import { registerPrompts } from './prompts/index.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('CircleMCPServer');

export class CircleMCPServer {
  private server: McpServer;
  private authManager: IntegratedAuthManager;
  private apiClient: CircleAPIClient;

  constructor() {
    validateConfig();

    this.server = new McpServer(
      {
        name: 'circle-community-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.authManager = new IntegratedAuthManager({
      gcp: {
        clientId: config.gcpClientId,
        clientSecret: config.gcpClientSecret,
        redirectUri: config.gcpRedirectUri,
        scopes: ['openid', 'email', 'profile'],
      },
      circle: {
        headlessToken: config.headlessToken,
        communityUrl: config.communityUrl,
      },
      oauthPort: config.oauthPort,
    });

    this.apiClient = new CircleAPIClient(
      config.communityUrl,
      this.authManager.getCircleAuth(),
      config.enableRateLimiting
    );

    this.setupServer();
  }

  private setupServer(): void {
    logger.info('Setting up Circle MCP server', {
      readOnlyMode: config.readOnlyMode,
      rateLimiting: config.enableRateLimiting,
    });

    // Register all tools with auth manager
    registerAllTools(
      this.server,
      this.apiClient,
      this.authManager,
      config.readOnlyMode
    );

    // Register prompts
    registerPrompts(this.server);

    // Register resources
    this.registerResources();

    // Add utility tools
    this.registerUtilityTools();

    logger.info('Circle MCP server setup complete');
  }

  private registerResources(): void {
    // Resource: Community Information
    this.server.registerResource(
      'community-info',
      'community://info',
      {
        description: 'Information about the Circle community',
        mimeType: 'application/json',
      },
      async () => ({
        contents: [{
          uri: 'community://info',
          mimeType: 'application/json',
          text: JSON.stringify({
            name: 'Circle Community',
            url: config.communityUrl,
            features: [
              'Profile Management',
              'Course Access',
              'Post Creation',
              'Event Management',
              'Notifications',
              'Direct Messaging',
            ],
            authentication: 'Google OAuth 2.0',
          }, null, 2),
        }],
      })
    );

    // Resource: Available Tools List
    this.server.registerResource(
      'circle-tools',
      'circle://tools',
      {
        description: 'List of all available Circle MCP tools',
        mimeType: 'text/markdown',
      },
      async () => ({
        contents: [{
          uri: 'circle://tools',
          mimeType: 'text/markdown',
          text: `# Circle MCP Tools

## Authentication
- \`authenticate_with_google\` - Authenticate via Google OAuth
- \`check_auth_status\` - Check current authentication status
- \`logout\` - Clear authentication session

## Profile
- \`get_my_profile\` - Get your Circle profile
- \`update_my_profile\` - Update your profile information

## Courses
- \`get_my_courses\` - Get your enrolled courses
- \`get_course_details\` - Get details for a specific course

## Posts
- \`get_posts\` - Get posts from spaces
- \`create_post\` - Create a new post
- \`update_post\` - Update an existing post
- \`delete_post\` - Delete a post
- \`like_post\` - Like a post
- \`unlike_post\` - Unlike a post

## Spaces
- \`get_spaces\` - Get all community spaces
- \`get_space_members\` - Get members of a space

## Events
- \`get_events\` - Get upcoming events
- \`get_event_details\` - Get event details
- \`rsvp_event\` - RSVP to an event

## Notifications
- \`get_notifications\` - Get your notifications
- \`mark_notification_read\` - Mark notification as read

## Messages
- \`get_direct_messages\` - Get your direct messages
- \`send_direct_message\` - Send a direct message

## Feed
- \`get_feed\` - Get your personalized feed

## Comments
- \`get_post_comments\` - Get comments on a post
- \`create_comment\` - Create a comment
- \`update_comment\` - Update a comment
- \`delete_comment\` - Delete a comment
`,
        }],
      })
    );

    // Resource: Authentication Guide
    this.server.registerResource(
      'auth-guide',
      'circle://auth-guide',
      {
        description: 'Guide for authenticating with Circle MCP',
        mimeType: 'text/markdown',
      },
      async () => ({
        contents: [{
          uri: 'circle://auth-guide',
          mimeType: 'text/markdown',
          text: `# Circle MCP Authentication Guide

## First Time Setup

1. **Authenticate with Google**
   \`\`\`
   Use the tool: authenticate_with_google
   \`\`\`

2. **Browser Opens**
   - A browser window will open automatically
   - Sign in with your Google account
   - Authorize the application

3. **Start Using**
   - Once authenticated, you can use all Circle features
   - Your session is saved for future use

## Checking Status

Use \`check_auth_status\` to see if you're currently authenticated.

## Switching Accounts

To use a different account:
1. Use \`logout\` to clear current session
2. Use \`authenticate_with_google\` again
3. Sign in with the different account

## Security

- You can only access YOUR OWN data
- Data is filtered by your authenticated email
- Tokens are securely stored and auto-refreshed
`,
        }],
      })
    );
  }

  private registerUtilityTools(): void {
    // Tool to start OAuth authentication
    this.server.registerTool(
      'authenticate_with_google',
      {
        title: 'Authenticate with Google',
        description: 'Start Google OAuth authentication flow to access Circle community features',
        inputSchema: {},
      },
      async () => {
        try {
          const isAuthenticated = await this.authManager.isAuthenticated();
          if (isAuthenticated) {
            const currentUser = this.authManager.getCurrentUser();
            return {
              content: [{
                type: 'text',
                text: `✅ Already authenticated as: ${currentUser?.gcp.user.email}

You can now use Circle features like:
- "Show me my profile"
- "Get my courses"
- "Show my posts"
- "Get my notifications"`,
              }],
            };
          }

          logger.info('Starting OAuth authentication flow');
          await this.authManager.startOAuthFlow();

          return {
            content: [{
              type: 'text',
              text: `🔐 Starting Google Authentication...

A browser window will open for you to sign in with Google.
After successful authentication, you can use Circle community features.

Please complete the authentication in your browser, then try:
- "Show me my profile"
- "Get my courses"
- "Check my authentication status"`,
            }],
          };
        } catch (error) {
          logger.error('Failed to start OAuth flow', error as Error);
          return {
            content: [{
              type: 'text',
              text: `❌ Failed to start authentication: ${error instanceof Error ? error.message : 'Unknown error'}

Please make sure:
1. GCP_CLIENT_ID and GCP_CLIENT_SECRET are set in environment variables
2. Your GCP OAuth credentials are configured correctly
3. The redirect URI is set to: ${config.gcpRedirectUri}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Tool to check authentication status
    this.server.registerTool(
      'check_auth_status',
      {
        title: 'Check Authentication Status',
        description: 'Check if you are currently authenticated with Google and Circle',
        inputSchema: {},
      },
      async () => {
        try {
          const isAuthenticated = await this.authManager.isAuthenticated();
          const currentUser = this.authManager.getCurrentUser();

          if (isAuthenticated && currentUser) {
            return {
              content: [{
                type: 'text',
                text: `✅ Authenticated with Google as: ${currentUser.gcp.user.email}
📧 Circle email: ${currentUser.circle.email}
👤 Name: ${currentUser.gcp.user.name}
🔗 Verified: ${currentUser.gcp.user.verified_email ? 'Yes' : 'No'}

You can now use Circle features like:
- "Show me my profile"
- "Get my courses"
- "Show my posts"
- "Get my notifications"`,
              }],
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `❌ Not authenticated. 

To use Circle community features, please authenticate with Google:
- "Authenticate with Google" (opens browser for OAuth)
- Or use the legacy method: "Show me my profile using your-email@example.com"`,
              }],
            };
          }
        } catch (error) {
          logger.error('Failed to check auth status', error as Error);
          return {
            content: [{
              type: 'text',
              text: `Error checking authentication status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Tool to logout/clear authentication
    this.server.registerTool(
      'logout',
      {
        title: 'Logout',
        description: 'Clear your current authentication session',
        inputSchema: {},
      },
      async () => {
        try {
          this.authManager.logout();
          return {
            content: [{
              type: 'text',
              text: '✅ Successfully logged out. You will need to provide your email again for future operations.',
            }],
          };
        } catch (error) {
          logger.error('Failed to logout', error as Error);
          return {
            content: [{
              type: 'text',
              text: `Error during logout: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Circle MCP server started and listening');
  }

  async stop(): Promise<void> {
    // Cleanup
    // Clear tokens through the integrated auth manager
    await this.authManager.logout();
    logger.info('Circle MCP server stopped');
  }
}