import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';
import { Logger } from '../utils/logger.js';
import { RateLimitError, handleError } from '../utils/errors.js'; // REMOVED APIError
import { RETRY_CONFIG, ERROR_CODES } from '../config/constants.js';
import type { CircleAuth } from '../auth/auth.js';
import { config } from '../config/config.js';

const logger = new Logger('CircleAPIClient');

interface RetryConfig {
  maxRetries: number;
  delay: number;
  attempt: number;
}

export class CircleAPIClient {
  private httpClient: AxiosInstance;
  private rateLimitRemaining = 100;
  private rateLimitReset = 0;

  constructor(
    _communityUrl: string, // not used for baseURL anymore
    private auth: CircleAuth,
    private enableRateLimiting: boolean
  ) {
    this.httpClient = axios.create({
      // Per docs, Member API is served from the same app base
      baseURL: config.headlessBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      async (config) => {
        if (this.enableRateLimiting && this.rateLimitRemaining <= 5) {
          const now = Date.now();
          if (now < this.rateLimitReset) {
            const waitTime = this.rateLimitReset - now;
            logger.warn('Rate limit approaching, waiting', { waitTime });
            await this.sleep(waitTime);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];
        
        if (remaining) this.rateLimitRemaining = parseInt(remaining);
        if (reset) this.rateLimitReset = parseInt(reset) * 1000;

        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === ERROR_CODES.RATE_LIMIT) {
          logger.error('Rate limit exceeded');
          throw new RateLimitError('Rate limit exceeded. Please try again later.');
        }
        return Promise.reject(error);
      }
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt),
      RETRY_CONFIG.MAX_DELAY
    );
    return delay + Math.random() * 1000;
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retryConfig: RetryConfig = {
      maxRetries: RETRY_CONFIG.MAX_RETRIES,
      delay: RETRY_CONFIG.INITIAL_DELAY,
      attempt: 0,
    }
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      const axiosError = error as AxiosError;
      const shouldRetry =
        retryConfig.attempt < retryConfig.maxRetries &&
        axiosError.response &&
        [408, 429, 500, 502, 503, 504].includes(axiosError.response.status);

      if (shouldRetry) {
        const delay = this.calculateRetryDelay(retryConfig.attempt);
        logger.warn('Retrying request', {
          attempt: retryConfig.attempt + 1,
          delay,
          error: axiosError.message,
        });

        await this.sleep(delay);

        return this.executeWithRetry(requestFn, {
          ...retryConfig,
          attempt: retryConfig.attempt + 1,
        });
      }

      throw error;
    }
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    email: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    logger.debug('API request', { method, endpoint, email });

    try {
      const accessToken = await this.auth.getValidToken(email);

      const response = await this.executeWithRetry(async () =>
        this.httpClient.request<T>({
          method,
          url: endpoint,
          data,
          headers: {
            ...config?.headers,
            Authorization: `Bearer ${accessToken}`,
          },
          ...config,
        })
      );

      logger.debug('API request successful', { method, endpoint });
      return response.data;
    } catch (error) {
      const handledError = handleError(error);
      logger.error('API request failed', handledError, { method, endpoint });
      throw handledError;
    }
  }

  async get<T>(endpoint: string, email: string): Promise<T> {
    return this.request<T>('GET', endpoint, email);
  }

  async post<T>(endpoint: string, email: string, data: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, email, data);
  }

  async put<T>(endpoint: string, email: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, email, data);
  }

  async delete<T>(endpoint: string, email: string): Promise<T> {
    return this.request<T>('DELETE', endpoint, email);
  }
}