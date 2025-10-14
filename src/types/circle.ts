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