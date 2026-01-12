import apiClient from './client';
import { Team, TeamMember, CreateTeamRequest, AddMemberRequest } from '@/types/team';
import { ApiResponse } from '@/types/api';

export const teamsApi = {
  getTeams: (): Promise<ApiResponse<Team[]>> =>
    apiClient.get('/teams'),

  getTeam: (id: string): Promise<ApiResponse<Team>> =>
    apiClient.get(`/teams/${id}`),

  createTeam: (data: CreateTeamRequest): Promise<ApiResponse<Team>> =>
    apiClient.post('/teams', data),

  updateTeam: (id: string, data: Partial<CreateTeamRequest>): Promise<ApiResponse<Team>> =>
    apiClient.patch(`/teams/${id}`, data),

  getMembers: (teamId: string): Promise<ApiResponse<TeamMember[]>> =>
    apiClient.get(`/teams/${teamId}/members`),

  addMember: (teamId: string, data: AddMemberRequest): Promise<ApiResponse<TeamMember>> =>
    apiClient.post(`/teams/${teamId}/members`, data),

  removeMember: (teamId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.delete(`/teams/${teamId}/members/${userId}`),
};
