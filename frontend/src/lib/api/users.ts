import apiClient from './client';
import { User, UserSummary } from '@/types/user';
import { ApiResponse } from '@/types/api';

export interface UpdateProfileData {
  name?: string;
  avatarUrl?: string;
}

export const usersApi = {
  getMe: (): Promise<ApiResponse<User>> =>
    apiClient.get('/users/me'),

  updateMe: (data: UpdateProfileData): Promise<ApiResponse<User>> =>
    apiClient.patch('/users/me', data),

  searchUsers: (query: string, limit: number = 10): Promise<ApiResponse<UserSummary[]>> =>
    apiClient.get('/users/search', { params: { q: query, limit } }),
};
