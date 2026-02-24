import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/config.js';
import { IntegratedAuthManager } from './auth/integrated-auth-manager.js';
import { CircleAPIClient } from './api/client.js';
import { registerAllTools, registerAllToolsForSession } from './tools/index.js';
import { registerPrompts } from './prompts/index.js';
import type { SessionManager } from './auth/session-manager.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('CircleMCPServer');

/**
 * Factory function for HTTP transport sessions.
 * Creates a per-session McpServer with tools pre-authenticated for the given email.
 */
export function createMcpServer(email: string, sessionManager: SessionManager): McpServer {
  const server = new McpServer(
    { name: 'circle-community-mcp', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {}, resources: {} } }
  );

  const apiClient = new CircleAPIClient(
    config.communityUrl,
    sessionManager.getCircleAuth(),
    config.enableRateLimiting
  );

  // Register all tools with email pre-injected (no auth prompts)
  registerAllToolsForSession(server, apiClient, email, config.readOnlyMode);

  // Register prompts
  registerPrompts(server);

  // Register resources
  registerSessionResources(server);

  logger.info('Created MCP server for session', { email });
  return server;
}

function registerSessionResources(server: McpServer): void {
  server.registerResource(
    'community-info',
    'community://info',
    { description: 'Information about the Circle community', mimeType: 'application/json' },
    async () => ({
      contents: [{
        uri: 'community://info',
        mimeType: 'application/json',
        text: JSON.stringify({
          name: 'Circle Community',
          url: config.communityUrl,
          features: ['Profile Management', 'Course Access', 'Post Creation', 'Event Management', 'Notifications', 'Direct Messaging'],
          authentication: 'OAuth 2.1 (via Google)',
        }, null, 2),
      }],
    })
  );

  server.registerResource(
    'circle-tools',
    'circle://tools',
    { description: 'List of all available Circle MCP tools', mimeType: 'text/markdown' },
    async () => ({
      contents: [{
        uri: 'circle://tools',
        mimeType: 'text/markdown',
        text: `# Circle MCP Tools

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

## Spaces
- \`get_spaces\` - Get all community spaces

## Events
- \`get_events\` - Get upcoming events
- \`rsvp_event\` - RSVP to an event

## Notifications
- \`get_notifications\` - Get your notifications

## Messages
- \`get_messages\` - Get your direct messages

## Feed
- \`get_feed\` - Get your personalized feed

## Comments
- \`get_comments\` - Get comments on a post
- \`add_comment\` - Add a comment
- \`delete_comment\` - Delete a comment
- \`like_comment\` - Like a comment
`,
      }],
    })
  );
}

/**
 * Stdio-based MCP server (for local dev / Claude Desktop direct connection).
 * Still uses IntegratedAuthManager for browser-based local OAuth.
 */
export class CircleMCPServer {
  public server: McpServer;
  private authManager: IntegratedAuthManager;
  private apiClient: CircleAPIClient;

  constructor() {
    validateConfig();

    this.server = new McpServer(
      { name: 'circle-community-mcp', version: '1.0.0' },
      { capabilities: { tools: {}, prompts: {}, resources: {} } }
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

    registerAllTools(this.server, this.apiClient, this.authManager, config.readOnlyMode);
    registerPrompts(this.server);
    this.registerResources();
    this.registerUtilityTools();

    logger.info('Circle MCP server setup complete');
  }

  private registerResources(): void {
    this.server.registerResource(
      'community-info', 'community://info',
      { description: 'Information about the Circle community', mimeType: 'application/json' },
      async () => ({
        contents: [{
          uri: 'community://info', mimeType: 'application/json',
          text: JSON.stringify({
            name: 'Circle Community', url: config.communityUrl,
            features: ['Profile Management', 'Course Access', 'Post Creation', 'Event Management', 'Notifications', 'Direct Messaging'],
            authentication: 'Google OAuth 2.0',
          }, null, 2),
        }],
      })
    );

    this.server.registerResource(
      'circle-tools', 'circle://tools',
      { description: 'List of all available Circle MCP tools', mimeType: 'text/markdown' },
      async () => ({
        contents: [{
          uri: 'circle://tools', mimeType: 'text/markdown',
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

## Spaces
- \`get_spaces\` - Get all community spaces

## Events
- \`get_events\` - Get upcoming events
- \`rsvp_event\` - RSVP to an event

## Notifications
- \`get_notifications\` - Get your notifications

## Messages
- \`get_messages\` - Get your direct messages

## Feed
- \`get_feed\` - Get your personalized feed

## Comments
- \`get_comments\` - Get comments on a post
- \`add_comment\` - Add a comment
- \`delete_comment\` - Delete a comment
- \`like_comment\` - Like a comment
`,
        }],
      })
    );

    this.server.registerResource(
      'auth-guide', 'circle://auth-guide',
      { description: 'Guide for authenticating with Circle MCP', mimeType: 'text/markdown' },
      async () => ({
        contents: [{
          uri: 'circle://auth-guide', mimeType: 'text/markdown',
          text: `# Circle MCP Authentication Guide

## First Time Setup
1. Use the tool: \`authenticate_with_google\`
2. A browser window will open - sign in with Google
3. Once authenticated, you can use all Circle features

## Checking Status
Use \`check_auth_status\` to see if you're currently authenticated.

## Switching Accounts
1. Use \`logout\` to clear current session
2. Use \`authenticate_with_google\` again
`,
        }],
      })
    );
  }

  private registerUtilityTools(): void {
    this.server.registerTool(
      'authenticate_with_google',
      { title: 'Authenticate with Google', description: 'Start Google OAuth authentication flow to access Circle community features', inputSchema: {} },
      async () => {
        try {
          const isAuthenticated = await this.authManager.isAuthenticated();
          if (isAuthenticated) {
            const currentUser = this.authManager.getCurrentUser();
            return {
              content: [{
                type: 'text',
                text: `Already authenticated as: ${currentUser?.gcp.user.email}\n\nYou can now use Circle features like:\n- "Show me my profile"\n- "Get my courses"`,
              }],
            };
          }

          logger.info('Starting OAuth authentication flow');
          await this.authManager.startOAuthFlow();

          return {
            content: [{
              type: 'text',
              text: 'Starting Google Authentication...\n\nA browser window will open for you to sign in with Google.\nAfter successful authentication, you can use Circle community features.',
            }],
          };
        } catch (error) {
          logger.error('Failed to start OAuth flow', error as Error);
          return {
            content: [{
              type: 'text',
              text: `Failed to start authentication: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure GCP_CLIENT_ID and GCP_CLIENT_SECRET are set.`,
            }],
            isError: true,
          };
        }
      }
    );

    this.server.registerTool(
      'check_auth_status',
      { title: 'Check Authentication Status', description: 'Check if you are currently authenticated with Google and Circle', inputSchema: {} },
      async () => {
        try {
          const isAuthenticated = await this.authManager.isAuthenticated();
          const currentUser = this.authManager.getCurrentUser();

          if (isAuthenticated && currentUser) {
            return {
              content: [{
                type: 'text',
                text: `Authenticated as: ${currentUser.gcp.user.email}\nCircle email: ${currentUser.circle.email}\nName: ${currentUser.gcp.user.name}`,
              }],
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: 'Not authenticated.\n\nPlease use "Authenticate with Google" to start.',
              }],
            };
          }
        } catch (error) {
          logger.error('Failed to check auth status', error as Error);
          return {
            content: [{ type: 'text', text: `Error checking authentication status: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true,
          };
        }
      }
    );

    this.server.registerTool(
      'logout',
      { title: 'Logout', description: 'Clear your current authentication session', inputSchema: {} },
      async () => {
        try {
          this.authManager.logout();
          return { content: [{ type: 'text', text: 'Successfully logged out.' }] };
        } catch (error) {
          logger.error('Failed to logout', error as Error);
          return {
            content: [{ type: 'text', text: `Error during logout: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
    await this.authManager.logout();
    logger.info('Circle MCP server stopped');
  }
}
