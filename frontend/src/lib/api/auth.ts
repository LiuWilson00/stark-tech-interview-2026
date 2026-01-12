import apiClient from './client';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/register', data),
};
