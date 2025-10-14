import { API_ENDPOINTS } from '../config/constants.js';

export const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

export const endpoints = {
  // Profile
  getProfile: () => API_ENDPOINTS.PROFILE,
  updateProfile: () => API_ENDPOINTS.PROFILE,

  // Courses
  getCourses: (params?: { page?: number; per_page?: number }) =>
    buildUrl(API_ENDPOINTS.COURSES, params),
  getCourse: (id: number) => `${API_ENDPOINTS.COURSES}/${id}`,
  getCourseLessons: (courseId: number) =>
    `${API_ENDPOINTS.COURSES}/${courseId}/lessons`,

  // Posts
  getPosts: (params?: { space_id?: number; page?: number; per_page?: number }) =>
    buildUrl(API_ENDPOINTS.POSTS, params),
  getPost: (id: number) => `${API_ENDPOINTS.POSTS}/${id}`,
  createPost: () => API_ENDPOINTS.POSTS,
  updatePost: (id: number) => `${API_ENDPOINTS.POSTS}/${id}`,
  deletePost: (id: number) => `${API_ENDPOINTS.POSTS}/${id}`,
  likePost: (id: number) => `${API_ENDPOINTS.POSTS}/${id}/likes`,

  // Spaces
  getSpaces: () => API_ENDPOINTS.SPACES,
  getSpace: (id: number) => `${API_ENDPOINTS.SPACES}/${id}`,

  // Events
  getEvents: (params?: { page?: number; per_page?: number }) =>
    buildUrl(API_ENDPOINTS.EVENTS, params),
  getEvent: (id: number) => `${API_ENDPOINTS.EVENTS}/${id}`,
  rsvpEvent: (id: number) => `${API_ENDPOINTS.EVENTS}/${id}/rsvp`,

  // Notifications
  getNotifications: (params?: { page?: number; per_page?: number }) =>
    buildUrl(API_ENDPOINTS.NOTIFICATIONS, params),
  markNotificationRead: (id: string) =>
    `${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`,

  // Feed
  getFeed: (params?: { page?: number; per_page?: number; sort?: string }) =>
    buildUrl(API_ENDPOINTS.FEED, params),

  // Comments
  getComments: (postId: number) => `${API_ENDPOINTS.POSTS}/${postId}/comments`,
  createComment: (postId: number) => `${API_ENDPOINTS.POSTS}/${postId}/comments`,
  deleteComment: (commentId: number) => `/api/v1/comments/${commentId}`,
  likeComment: (commentId: number) => `/api/v1/comments/${commentId}/likes`,
} as const;