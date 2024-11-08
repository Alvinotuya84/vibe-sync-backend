// src/types/api-response.types.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Auth specific responses
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface LoginResponse extends ApiResponse<AuthResponse> {}
export interface RegisterResponse extends ApiResponse<AuthResponse> {}
