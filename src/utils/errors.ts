export class CircleMCPError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode?: number,
      public originalError?: unknown
    ) {
      super(message);
      this.name = 'CircleMCPError';
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class AuthenticationError extends CircleMCPError {
    constructor(message: string, originalError?: unknown) {
      super(message, 'AUTH_ERROR', 401, originalError);
      this.name = 'AuthenticationError';
    }
  }
  
  export class RateLimitError extends CircleMCPError {
    constructor(message: string) {
      super(message, 'RATE_LIMIT', 429);
      this.name = 'RateLimitError';
    }
  }
  
  export class ValidationError extends CircleMCPError {
    constructor(message: string) {
      super(message, 'VALIDATION_ERROR', 400);
      this.name = 'ValidationError';
    }
  }
  
  export class APIError extends CircleMCPError {
    constructor(message: string, statusCode: number, originalError?: unknown) {
      super(message, 'API_ERROR', statusCode, originalError);
      this.name = 'APIError';
    }
  }
  
  export function handleError(error: unknown): CircleMCPError {
    if (error instanceof CircleMCPError) {
      return error;
    }
  
    if (error instanceof Error) {
      return new CircleMCPError(error.message, 'UNKNOWN_ERROR', 500, error);
    }
  
    return new CircleMCPError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      error
    );
  }