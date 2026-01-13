'use client';

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useUIStore } from '@/stores/ui-store';
import { CreateTaskRequest, UpdateTaskRequest, TaskFilterParams } from '@/types/task';
import { createMutation } from '@/lib/hooks/create-mutation';

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

// ---------------------------------------------------------------------------
// Mutation Hooks (using createMutation factory)
// ---------------------------------------------------------------------------

export const useCreateTask = createMutation({
  mutationFn: (data: CreateTaskRequest) => tasksApi.createTask(data),
  invalidateKeys: [['tasks']],
});

export const useUpdateTask = createMutation({
  mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
    tasksApi.updateTask(id, data),
  invalidateKeys: [['tasks']],
  getInvalidateKeys: (variables) => [['task', variables.id]],
});

export const useDeleteTask = createMutation({
  mutationFn: (id: string) => tasksApi.deleteTask(id),
  invalidateKeys: [['tasks']],
});

export const useCompleteTask = createMutation({
  mutationFn: ({ id, completeSubtasks }: { id: string; completeSubtasks?: boolean }) =>
    tasksApi.completeTask(id, completeSubtasks),
  invalidateKeys: [['tasks'], ['subtasks']],
  getInvalidateKeys: (variables) => [['task', variables.id]],
});

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

export const useCreateComment = createMutation({
  mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
    tasksApi.createComment(taskId, { content }),
  getInvalidateKeys: (variables) => [
    ['taskComments', variables.taskId],
    ['taskHistory', variables.taskId],
  ],
});
