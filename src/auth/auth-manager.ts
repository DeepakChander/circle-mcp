import { Logger } from '../utils/logger.js';
import { CircleAuth } from './auth.js';
import { UserStorage } from './user-storage.js';
import { AuthenticationError } from '../utils/errors.js';

const logger = new Logger('AuthManager');

export class AuthManager {
  private userStorage: UserStorage;
  private auth: CircleAuth;
  private communityUrl: string;

  constructor(headlessToken: string, communityUrl: string) {
    this.communityUrl = communityUrl;
    this.auth = new CircleAuth(headlessToken, communityUrl);
    this.userStorage = new UserStorage(communityUrl);
  }

  /**
   * Get the current authenticated user email
   * If no user is stored, returns null
   */
  getCurrentUser(): string | null {
    return this.userStorage.getCurrentUser();
  }

  /**
   * Check if user is authenticated and has valid token
   */
  async isAuthenticated(): Promise<boolean> {
    const email = this.getCurrentUser();
    if (!email) {
      return false;
    }

    try {
      return this.auth.isAuthenticated(email);
    } catch (error) {
      logger.warn('Authentication check failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Authenticate user with email
   * This will be called when user provides their email for the first time
   */
  async authenticateUser(email: string): Promise<void> {
    logger.info('Authenticating user', { email });
    
    try {
      await this.auth.authenticate({ email });
      this.userStorage.setUser(email, this.communityUrl);
      logger.info('User authenticated successfully', { email });
    } catch (error) {
      logger.error('Authentication failed', error as Error, { email });
      throw new AuthenticationError(
        `Authentication failed for ${email}. Please check if your email is registered in the Circle community.`
      );
    }
  }

  /**
   * Get valid access token for current user
   * Automatically handles token refresh if needed
   */
  async getValidToken(): Promise<string> {
    const email = this.getCurrentUser();
    if (!email) {
      throw new AuthenticationError('No user authenticated. Please provide your email address.');
    }

    try {
      return await this.auth.getValidToken(email);
    } catch (error) {
      logger.error('Failed to get valid token', error as Error, { email });
      throw new AuthenticationError(
        `Authentication expired for ${email}. Please re-authenticate.`
      );
    }
  }

  /**
   * Clear current user session
   */
  logout(): void {
    const email = this.getCurrentUser();
    if (email) {
      this.auth.logout(email);
    }
    this.userStorage.clearUser();
    logger.info('User logged out');
  }

  /**
   * Get user storage instance
   */
  getUserStorage(): UserStorage {
    return this.userStorage;
  }

  /**
   * Get auth instance
   */
  getAuth(): CircleAuth {
    return this.auth;
  }
}
