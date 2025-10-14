import { Logger } from '../utils/logger.js';
import type { TokenData } from '../types/mcp.js';

const logger = new Logger('TokenManager');

export class TokenManager {
  private tokens: Map<string, TokenData> = new Map();
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  setToken(email: string, tokenData: TokenData): void {
    this.tokens.set(email, tokenData);
    logger.debug('Token stored', { email, expiresAt: new Date(tokenData.expiresAt).toISOString() });
  }

  getToken(email: string): TokenData | undefined {
    return this.tokens.get(email);
  }

  isTokenExpired(email: string): boolean {
    const tokenData = this.tokens.get(email);
    if (!tokenData) return true;
    return Date.now() >= tokenData.expiresAt;
  }

  shouldRefreshToken(email: string): boolean {
    const tokenData = this.tokens.get(email);
    if (!tokenData) return false;
    return Date.now() >= tokenData.expiresAt - this.TOKEN_REFRESH_THRESHOLD;
  }

  removeToken(email: string): void {
    this.tokens.delete(email);
    logger.debug('Token removed', { email });
  }

  clearAll(): void {
    this.tokens.clear();
    logger.info('All tokens cleared');
  }

  getActiveSessionCount(): number {
    return this.tokens.size;
  }
}