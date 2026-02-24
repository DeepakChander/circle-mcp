import { Logger } from '../utils/logger.js';
import { IntegratedAuthManager } from '../auth/integrated-auth-manager.js';
import { AuthenticationError } from '../utils/errors.js';

const logger = new Logger('AuthWrapper');

export interface AuthenticatedToolParams {
  email?: string;
  [key: string]: any;
}

/**
 * Wrapper function that ensures user is authenticated before executing a tool
 * If no user is authenticated, it will prompt for email and authenticate automatically
 */
export function withAuthentication<T extends AuthenticatedToolParams>(
  authManager: IntegratedAuthManager,
  toolFunction: (params: T) => Promise<any>
) {
  return async (params: T): Promise<any> => {
    try {
      // Check if user is already authenticated
      const isAuthenticated = await authManager.isAuthenticated();
      
      if (!isAuthenticated) {
        // If email is provided in params, use it for authentication
        if (params.email) {
          logger.info('Authenticating with provided email', { email: params.email });
          // For legacy email authentication, we'll need to implement this in IntegratedAuthManager
          // For now, redirect to OAuth flow
          return {
            content: [{
              type: 'text',
              text: `🔐 Legacy email authentication not supported with GCP integration.

Please use Google OAuth authentication instead:
- "Authenticate with Google" (opens browser for secure OAuth)

This provides better security and user experience.`
            }],
            isError: true,
          };
        } else {
          // No email provided and not authenticated - return error with instructions
          return {
            content: [{
              type: 'text',
              text: `🔐 Authentication Required

To use Circle community features, please authenticate with Google:

**Recommended (OAuth):**
- "Authenticate with Google" (opens browser for secure OAuth)

**Legacy method:**
- "Show me my profile using email@example.com"

The OAuth method is more secure and provides better user experience.`
            }],
            isError: true,
          };
        }
      }

      // Execute the actual tool function with authenticated user context
      const currentUser = authManager.getCurrentUser();
      if (currentUser) {
        // Add the authenticated email to params for tools that need it
        const paramsWithEmail = { ...params, authenticatedEmail: currentUser.circle.email };
        return await toolFunction(paramsWithEmail);
      }
      
      return await toolFunction(params);
      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        logger.error('Authentication error in tool wrapper', error);
        return {
          content: [{
            type: 'text',
            text: `❌ ${error.message}

Please check:
1. Your email is registered in the Circle community
2. You have access to the community
3. The email address is correct

Try again with: "Show me my profile using your-email@example.com"`
          }],
          isError: true,
        };
      }
      
      // Re-throw other errors to be handled by the tool
      throw error;
    }
  };
}

/**
 * Helper function to extract email from params and remove it from the params object
 */
export function extractEmailFromParams<T extends AuthenticatedToolParams>(params: T): { email: string | undefined; cleanParams: Omit<T, 'email'> } {
  const { email, ...cleanParams } = params;
  return { email, cleanParams };
}

/**
 * Wrapper for session-based (HTTP transport) tools.
 * Pre-injects the authenticated email into params so tools
 * work exactly like the auth-manager path.
 */
export function withSessionAuth(
  email: string,
  toolFunction: (params: any) => Promise<any>
) {
  return async (params: any): Promise<any> => {
    const paramsWithEmail = { ...params, authenticatedEmail: email };
    return toolFunction(paramsWithEmail);
  };
}
