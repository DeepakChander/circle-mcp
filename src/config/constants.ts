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
  export const ADMIN_V2_ENDPOINTS = {
    // Members
    MEMBERS: '/community_members',
    MEMBER: (id: number) => `/community_members/${id}`,
    MEMBER_SEARCH: '/community_members/search',
    MEMBER_BAN: (id: number) => `/community_members/${id}/ban`,
    MEMBER_TAGS_FOR_MEMBER: (id: number) => `/community_members/${id}/member_tags`,
    MEMBER_UNTAG: (id: number, tagId: number) => `/community_members/${id}/member_tags/${tagId}`,
    MEMBER_MESSAGE: (id: number) => `/community_members/${id}/messages`,

    // Spaces
    SPACES: '/spaces',
    SPACE: (id: number) => `/spaces/${id}`,
    SPACE_MEMBERS: (id: number) => `/spaces/${id}/community_members`,
    SPACE_MEMBER: (id: number, memberId: number) => `/spaces/${id}/community_members/${memberId}`,
    SPACE_TOPICS: (id: number) => `/spaces/${id}/topics`,
    SPACE_SUMMARIZE: (id: number) => `/spaces/${id}/summarize`,

    // Space Groups
    SPACE_GROUPS: '/space_groups',
    SPACE_GROUP: (id: number) => `/space_groups/${id}`,

    // Posts
    POSTS: '/posts',
    POST: (id: number) => `/posts/${id}`,
    POST_COMMENTS: (postId: number) => `/posts/${postId}/comments`,

    // Comments
    COMMENT: (id: number) => `/comments/${id}`,

    // Topics
    TOPIC: (id: number) => `/topics/${id}`,

    // Flagged Content
    FLAGGED_CONTENT: '/flagged_content',
    FLAGGED_CONTENT_ITEM: (id: number) => `/flagged_content/${id}`,

    // Events
    EVENTS: '/events',
    EVENT: (id: number) => `/events/${id}`,
    EVENT_ATTENDEES: (id: number) => `/events/${id}/event_attendees`,
    EVENT_ATTENDEE: (id: number, attendeeId: number) => `/events/${id}/event_attendees/${attendeeId}`,

    // Courses
    COURSES: '/courses',
    COURSE: (id: number) => `/courses/${id}`,
    COURSE_SECTIONS: (courseId: number) => `/courses/${courseId}/sections`,
    COURSE_SECTION: (id: number) => `/course_sections/${id}`,
    SECTION_LESSONS: (sectionId: number) => `/course_sections/${sectionId}/lessons`,
    COURSE_LESSON: (id: number) => `/course_lessons/${id}`,
    LESSON_PROGRESS: (id: number) => `/course_lessons/${id}/mark_as_complete`,

    // Access Groups
    ACCESS_GROUPS: '/access_groups',
    ACCESS_GROUP: (id: number) => `/access_groups/${id}`,
    ACCESS_GROUP_ARCHIVE: (id: number) => `/access_groups/${id}/archive`,
    ACCESS_GROUP_UNARCHIVE: (id: number) => `/access_groups/${id}/unarchive`,
    ACCESS_GROUP_MEMBERS: (id: number) => `/access_groups/${id}/community_members`,
    ACCESS_GROUP_MEMBER: (id: number, memberId: number) => `/access_groups/${id}/community_members/${memberId}`,

    // Engagement
    LEADERBOARD: '/gamification/leaderboard',
    MEMBER_TAG_LIST: '/member_tags',
    MEMBER_TAG: (id: number) => `/member_tags/${id}`,
    SEGMENTS: '/segments',
    SEGMENT: (id: number) => `/segments/${id}`,
    INVITATIONS: '/invitations',
    INVITATION: (id: number) => `/invitations/${id}`,
    SEARCH: '/search',

    // Community
    COMMUNITY: '/community',
    PROFILE_FIELDS: '/community/profile_fields',
    FORMS: '/forms',
    FORM_SUBMISSIONS: (formId: number) => `/forms/${formId}/submissions`,
    WEBHOOKS: '/webhooks',
  } as const;