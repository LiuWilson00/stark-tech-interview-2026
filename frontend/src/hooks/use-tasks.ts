'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useUIStore } from '@/stores/ui-store';
import { CreateTaskRequest, UpdateTaskRequest, TaskFilterParams } from '@/types/task';

export function useTasks(additionalParams?: Partial<TaskFilterParams>) {
  const { currentTeamId, currentView, filters, sortBy, sortOrder } = useUIStore();

  const params: TaskFilterParams = {
    teamId: currentTeamId || undefined,
    view: currentView,
    status: filters.status || undefined,
    creatorId: filters.creatorId || undefined,
    assigneeId: filters.assigneeId || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sortBy,
    sortOrder,
    ...additionalParams,
  };

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.getTasks(params),
    enabled: !!currentTeamId,
    select: (response) => response.data,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getTask(taskId),
    enabled: !!taskId,
    select: (response) => response.data,
  });
}

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => tasksApi.getSubtasks(taskId),
    enabled: !!taskId,
    select: (response) => response.data,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      tasksApi.updateTask(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completeSubtasks }: { id: string; completeSubtasks?: boolean }) =>
      tasksApi.completeTask(id, completeSubtasks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: ['taskHistory', taskId],
    queryFn: () => tasksApi.getHistory(taskId),
    enabled: !!taskId,
    select: (response) => response.data,
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => tasksApi.getComments(taskId),
    enabled: !!taskId,
    select: (response) => response.data,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      tasksApi.createComment(taskId, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskComments', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['taskHistory', variables.taskId] });
    },
  });
}
