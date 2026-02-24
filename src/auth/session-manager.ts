import { McpOAuthServer } from './mcp-oauth-server.js';
import type { CircleAuth } from './auth.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('SessionManager');

export class SessionManager {
  private oauthServer: McpOAuthServer;
  private activeSessions: Map<string, string> = new Map(); // sessionId → email

  constructor(oauthServer: McpOAuthServer) {
    this.oauthServer = oauthServer;
  }

  resolveEmailFromToken(bearerToken: string): string | null {
    return this.oauthServer.validateAccessToken(bearerToken);
  }

  getCircleAuth(): CircleAuth {
    return this.oauthServer.getCircleAuth();
  }

  createSession(sessionId: string, email: string): void {
    this.activeSessions.set(sessionId, email);
    logger.info('Session created', { sessionId, email });
  }

  removeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    logger.info('Session removed', { sessionId });
  }

  getSessionEmail(sessionId: string): string | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}
