import axios, { type AxiosInstance } from 'axios';
import { Logger } from '../utils/logger.js';
import { AuthenticationError } from '../utils/errors.js';
import { TokenManager } from './token-manager.js';
import { API_ENDPOINTS } from '../config/constants.js';
import type { CircleAuthResponse, TokenData } from '../types/index.js';
import type { AuthRequest } from './types.js';
import { config } from '../config/config.js';

const logger = new Logger('CircleAuth');

export class CircleAuth {
  private httpClient: AxiosInstance;
  private tokenManager: TokenManager;

  constructor(
    headlessToken: string,
    _communityUrl: string
  ) {
    this.tokenManager = new TokenManager();
    this.httpClient = axios.create({
      // Per docs, Auth API is hosted at https://app.circle.so
      baseURL: config.headlessBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headlessToken}`,
      },
    });
  }

  async authenticate(authReq: AuthRequest): Promise<TokenData> {
    const identifier = authReq.email || String(authReq.community_member_id || authReq.sso_id);
    
    logger.info('Authenticating user', { identifier });

    try {
      const response = await this.httpClient.post<CircleAuthResponse>(
        API_ENDPOINTS.AUTH,
        authReq
      );

      const { access_token, refresh_token, access_token_expires_at } = response.data;
      
      // Parse the expiration timestamp
      const expiresAt = new Date(access_token_expires_at).getTime();
      
      const tokenData: TokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
        email: authReq.email || identifier,
      };

      this.tokenManager.setToken(identifier, tokenData);
      logger.info('Authentication successful', { identifier });

      return tokenData;
    } catch (error) {
      logger.error('Authentication failed', error as Error, { identifier });
      throw new AuthenticationError(
        `Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async refreshToken(email: string): Promise<TokenData> {
    logger.info('Refreshing token', { email });

    const currentToken = this.tokenManager.getToken(email);
    if (!currentToken) {
      throw new AuthenticationError('No token found to refresh');
    }

    try {
      const response = await this.httpClient.post<CircleAuthResponse>(
        API_ENDPOINTS.AUTH_REFRESH,
        { refresh_token: currentToken.refreshToken }
      );

      const { access_token, refresh_token, access_token_expires_at } = response.data;

      // Parse the expiration timestamp
      const expiresAt = new Date(access_token_expires_at).getTime();

      const tokenData: TokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
        email,
      };

      this.tokenManager.setToken(email, tokenData);
      logger.info('Token refreshed successfully', { email });

      return tokenData;
    } catch (error) {
      logger.error('Token refresh failed', error as Error, { email });
      this.tokenManager.removeToken(email);
      throw new AuthenticationError(
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getValidToken(email: string): Promise<string> {
    if (this.tokenManager.shouldRefreshToken(email)) {
      const tokenData = await this.refreshToken(email);
      return tokenData.accessToken;
    }

    const tokenData = this.tokenManager.getToken(email);
    if (!tokenData) {
      throw new AuthenticationError('No valid token found. Please authenticate first.');
    }

    return tokenData.accessToken;
  }

  isAuthenticated(email: string): boolean {
    return !this.tokenManager.isTokenExpired(email);
  }

  logout(email: string): void {
    this.tokenManager.removeToken(email);
    logger.info('User logged out', { email });
  }

  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
}