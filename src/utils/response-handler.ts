/**
 * Utility functions to handle different Circle API response formats
 */

export function extractArrayFromResponse<T>(response: any): T[] {
  // Handle direct array response
  if (Array.isArray(response)) {
    return response;
  }

  // Handle paginated response with records
  if (response && Array.isArray(response.records)) {
    return response.records;
  }

  // Handle Circle API wrapper with data array
  if (response && response.data && Array.isArray(response.data)) {
    return response.data;
  }

  // Handle Circle API wrapper with data.records
  if (response && response.data && Array.isArray(response.data.records)) {
    return response.data.records;
  }

  // Handle empty or null
  if (!response || response === null || (typeof response === 'object' && Object.keys(response).length === 0)) {
    return [];
  }

  // Unable to extract array
  throw new Error('Unable to extract array from API response. Response format not recognized.');
}

export function extractObjectFromResponse<T>(response: any): T | null {
  // Handle direct object response
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    // If it has a data property, unwrap it
    if (response.data) {
      return response.data;
    }
    return response;
  }

  return null;
}

export function isEmptyResponse(response: any): boolean {
  if (!response) return true;
  if (typeof response === 'object' && Object.keys(response).length === 0) return true;
  if (Array.isArray(response) && response.length === 0) return true;
  return false;
}

export function formatErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && error.message) {
    return error.message;
  }
  return 'Unknown error occurred';
}
