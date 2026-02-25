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

  // Admin V2 API endpoints (relative to /api/admin/v2)
  // Verified against live API — all use top-level list endpoints with filter params
  export const ADMIN_V2_ENDPOINTS = {
    // Members
    MEMBERS: '/community_members',
    MEMBER: (id: number) => `/community_members/${id}`,
    MEMBER_BAN: (id: number) => `/community_members/${id}/ban`,
    MEMBER_MESSAGE: (id: number) => `/community_members/${id}/messages`,

    // Spaces
    SPACES: '/spaces',
    SPACE: (id: number) => `/spaces/${id}`,
    SPACE_MEMBERS: '/space_members', // uses ?space_id= param
    SPACE_SUMMARIZE: (id: number) => `/spaces/${id}/summarize`,

    // Space Groups
    SPACE_GROUPS: '/space_groups',
    SPACE_GROUP: (id: number) => `/space_groups/${id}`,

    // Posts
    POSTS: '/posts',
    POST: (id: number) => `/posts/${id}`,

    // Comments (top-level, filter with ?post_id=)
    COMMENTS: '/comments',
    COMMENT: (id: number) => `/comments/${id}`,

    // Topics (top-level, filter with ?space_id=)
    TOPICS: '/topics',
    TOPIC: (id: number) => `/topics/${id}`,

    // Events
    EVENTS: '/events',
    EVENT: (id: number) => `/events/${id}`,
    EVENT_ATTENDEES: '/event_attendees', // uses ?event_id= param

    // Courses (courses are spaces with space_type=course)
    COURSE_SECTIONS: '/course_sections', // uses ?space_id= param
    COURSE_SECTION: (id: number) => `/course_sections/${id}`,
    COURSE_LESSONS: '/course_lessons', // uses ?course_section_id= param
    COURSE_LESSON: (id: number) => `/course_lessons/${id}`,
    LESSON_PROGRESS: (id: number) => `/course_lessons/${id}/mark_as_complete`,

    // Access Groups
    ACCESS_GROUPS: '/access_groups',
    ACCESS_GROUP_MEMBERS: (id: number) => `/access_groups/${id}/community_members`,

    // Engagement
    LEADERBOARD: '/gamification/leaderboard',
    MEMBER_TAG_LIST: '/member_tags',
    MEMBER_TAG: (id: number) => `/member_tags/${id}`,

    // Community
    COMMUNITY: '/community',
    PROFILE_FIELDS: '/profile_fields',
  } as const;