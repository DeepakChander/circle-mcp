export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
  
  export interface AuthRequest {
    email?: string;
    community_member_id?: number;
    sso_id?: string;
  }