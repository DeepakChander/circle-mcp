export const API_ENDPOINTS = {
    AUTH: '/api/v1/headless/auth_token',
    AUTH_REFRESH: '/api/v1/headless/refresh_token',
    PROFILE: '/api/v1/me',
    COURSES: '/api/v1/courses', // May not be available if courses not enabled
    POSTS: '/api/v1/posts',
    COMMENTS: '/api/v1/comments',
    SPACES: '/api/v1/spaces',
    EVENTS: '/api/v1/events',
    NOTIFICATIONS: '/api/v1/notifications',
    MESSAGES: '/api/v1/messages',
    FEED: '/api/v1/home',
  } as const;
  
  export const CACHE_KEYS = {
    PROFILE: 'profile',
    COURSES: 'courses',
    SPACES: 'spaces',
  } as const;
  
  export const ERROR_CODES = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMIT: 429,
    SERVER_ERROR: 500,
  } as const;
  
  export const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 10000,
    BACKOFF_FACTOR: 2,
  } as const;