'use client';

import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { CreateTeamRequest, AddMemberRequest } from '@/types/team';
import { createMutation } from '@/lib/hooks/create-mutation';

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getTeams(),
    select: (response) => response.data,
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId),
    enabled: !!teamId,
    select: (response) => response.data,
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => teamsApi.getMembers(teamId),
    enabled: !!teamId,
    select: (response) => response.data,
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks (using createMutation factory)
// ---------------------------------------------------------------------------

export const useCreateTeam = createMutation({
  mutationFn: (data: CreateTeamRequest) => teamsApi.createTeam(data),
  invalidateKeys: [['teams']],
});

export const useAddTeamMember = createMutation({
  mutationFn: ({ teamId, data }: { teamId: string; data: AddMemberRequest }) =>
    teamsApi.addMember(teamId, data),
  getInvalidateKeys: (variables) => [['teamMembers', variables.teamId]],
});

export const useRemoveTeamMember = createMutation({
  mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
    teamsApi.removeMember(teamId, userId),
  getInvalidateKeys: (variables) => [['teamMembers', variables.teamId]],
});
