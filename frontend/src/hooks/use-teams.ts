'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { CreateTeamRequest, AddMemberRequest } from '@/types/team';

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

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamRequest) => teamsApi.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: AddMemberRequest }) =>
      teamsApi.addMember(teamId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', variables.teamId] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamsApi.removeMember(teamId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', variables.teamId] });
    },
  });
}
