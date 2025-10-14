import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('UserStorage');

interface StoredUser {
  email: string;
  lastUsed: number;
  communityUrl: string;
}

export class UserStorage {
  private storagePath: string;
  private currentUser: StoredUser | null = null;

  constructor(communityUrl: string) {
    // Store user data in a hidden file in the user's home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    this.storagePath = join(homeDir, '.circle-mcp-user.json');
    this.loadUser(communityUrl);
  }

  private loadUser(communityUrl: string): void {
    try {
      if (existsSync(this.storagePath)) {
        const data = readFileSync(this.storagePath, 'utf8');
        const storedUser: StoredUser = JSON.parse(data);
        
        // Check if the stored user is for the same community
        if (storedUser.communityUrl === communityUrl) {
          this.currentUser = storedUser;
          logger.info('Loaded stored user', { email: storedUser.email });
        } else {
          logger.info('Community URL changed, clearing stored user');
          this.clearUser();
        }
      }
    } catch (error) {
      logger.warn('Failed to load stored user', { error: error instanceof Error ? error.message : String(error) });
      this.currentUser = null;
    }
  }

  private saveUser(): void {
    try {
      if (this.currentUser) {
        writeFileSync(this.storagePath, JSON.stringify(this.currentUser, null, 2));
        logger.debug('User data saved');
      }
    } catch (error) {
      logger.error('Failed to save user data', error as Error);
    }
  }

  setUser(email: string, communityUrl: string): void {
    this.currentUser = {
      email,
      lastUsed: Date.now(),
      communityUrl,
    };
    this.saveUser();
    logger.info('User set', { email });
  }

  getCurrentUser(): string | null {
    if (this.currentUser) {
      // Update last used timestamp
      this.currentUser.lastUsed = Date.now();
      this.saveUser();
      return this.currentUser.email;
    }
    return null;
  }

  clearUser(): void {
    this.currentUser = null;
    try {
      if (existsSync(this.storagePath)) {
        writeFileSync(this.storagePath, '{}');
      }
    } catch (error) {
      logger.warn('Failed to clear user data', { error: error instanceof Error ? error.message : String(error) });
    }
    logger.info('User data cleared');
  }

  hasUser(): boolean {
    return this.currentUser !== null;
  }

  getUserInfo(): StoredUser | null {
    return this.currentUser;
  }
}
