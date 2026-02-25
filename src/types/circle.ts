export interface CircleAuthResponse {
    access_token: string;
    refresh_token: string;
    access_token_expires_at: string;
    refresh_token_expires_at: string;
    community_member_id: number;
    community_id: number;
  }
  
  export interface CircleProfile {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    headline?: string;
    roles: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface CircleCourse {
    id: number;
    name: string;
    description?: string;
    slug: string;
    thumbnail_url?: string;
    progress?: number;
    enrolled: boolean;
    lessons_count: number;
    completed_lessons_count: number;
  }
  
  export interface CirclePost {
    id: number;
    name: string;
    slug: string;
    body: {
      html: string;
      plain_text: string;
    };
    space_id: number;
    space_name: string;
    author: {
      id: number;
      name: string;
      avatar_url?: string;
    };
    comments_count: number;
    likes_count: number;
    created_at: string;
    updated_at: string;
    published_at?: string;
    url: string;
  }
  
  export interface CircleSpace {
    id: number;
    name: string;
    slug: string;
    description?: string;
    emoji?: string;
    posts_count: number;
    members_count: number;
  }
  
  export interface CircleEvent {
    id: number;
    name: string;
    description?: string;
    starts_at: string;
    ends_at?: string;
    location_type: 'in_person' | 'virtual' | 'hybrid';
    virtual_location_url?: string;
    in_person_location?: string;
    rsvp_limit?: number;
    attendees_count: number;
    is_attending: boolean;
  }
  
  export interface CircleNotification {
    id: string;
    type: string;
    read: boolean;
    created_at: string;
    data: Record<string, unknown>;
  }
  
  export interface PaginatedResponse<T> {
    page: number;
    per_page: number;
    has_next_page: boolean;
    count: number;
    page_count: number;
    records: T[];
  }

  // Circle API actually returns this format
  export interface CircleAPIResponse<T> {
    status: 'success' | 'error' | 'unauthorized';
    message?: string;
    data?: T;
    meta?: {
      page?: number;
      per_page?: number;
      total?: number;
    };
  }

  export interface CircleAPIError {
    error: string;
    message: string;
    status: number;
  }

  // Admin V2 API Types
  export interface AdminV2Member {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
    headline?: string;
    bio?: string;
    profile_url?: string;
    active: boolean;
    admin: boolean;
    moderator: boolean;
    created_at: string;
    last_seen_at?: string;
    posts_count: number;
    comments_count: number;
    activity_score?: number;
    flattened_profile_fields?: Record<string, any>;
    gamification_stats?: Record<string, any>;
    member_tags?: Array<{ id: number; name: string }>;
  }

  export interface AdminV2Space {
    id: number;
    name: string;
    slug: string;
    description?: string;
    emoji?: string;
    space_type: string;
    is_private: boolean;
    is_hidden: boolean;
    post_count: number;
    member_count: number;
    space_group_id?: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2SpaceGroup {
    id: number;
    name: string;
    slug: string;
    position: number;
    space_ids: number[];
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2Post {
    id: number;
    name: string;
    slug: string;
    body: any;
    space_id: number;
    user_id: number;
    status: string;
    is_pinned: boolean;
    is_comments_enabled: boolean;
    comments_count: number;
    likes_count: number;
    created_at: string;
    updated_at: string;
    published_at?: string;
  }

  export interface AdminV2Comment {
    id: number;
    body: any;
    post_id: number;
    user_id: number;
    parent_comment_id?: number;
    likes_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2Event {
    id: number;
    name: string;
    description?: string;
    body?: any;
    space_id: number;
    starts_at: string;
    ends_at?: string;
    duration_in_seconds?: number;
    location_type: string;
    virtual_location_url?: string;
    in_person_location?: string;
    rsvp_limit?: number;
    attendees_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2CourseSection {
    id: number;
    name: string;
    position: number;
    course_id: number;
    lessons_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2CourseLesson {
    id: number;
    name: string;
    position: number;
    course_section_id: number;
    lesson_type: string;
    published: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2AccessGroup {
    id: number;
    name: string;
    description?: string;
    is_archived: boolean;
    members_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2MemberTag {
    id: number;
    name: string;
    members_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2Topic {
    id: number;
    name: string;
    slug: string;
    space_id: number;
    posts_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2Community {
    id: number;
    name: string;
    slug: string;
    url: string;
    description?: string;
    logo_url?: string;
    member_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2Segment {
    id: number;
    name: string;
    filters: Record<string, any>;
    members_count: number;
    created_at: string;
    updated_at: string;
  }

  export interface AdminV2Invitation {
    id: number;
    email: string;
    status: string;
    created_at: string;
    updated_at: string;
  }