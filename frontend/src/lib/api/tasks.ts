import apiClient from './client';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilterParams,
  TaskHistory,
  Comment,
  CreateCommentRequest,
} from '@/types/task';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export const tasksApi = {
  getTasks: (params: TaskFilterParams): Promise<ApiResponse<PaginatedResponse<Task>>> =>
    apiClient.get('/tasks', { params }),

  getTask: (id: string): Promise<ApiResponse<Task>> =>
    apiClient.get(`/tasks/${id}`),

  createTask: (data: CreateTaskRequest): Promise<ApiResponse<Task>> =>
    apiClient.post('/tasks', data),

  updateTask: (id: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> =>
    apiClient.patch(`/tasks/${id}`, data),

  deleteTask: (id: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.delete(`/tasks/${id}`),

  getSubtasks: (taskId: string): Promise<ApiResponse<Task[]>> =>
    apiClient.get(`/tasks/${taskId}/subtasks`),

  createSubtask: (taskId: string, data: CreateTaskRequest): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/${taskId}/subtasks`, data),

  completeTask: (id: string, completeSubtasks = false): Promise<ApiResponse<Task>> =>
    apiClient.post(`/tasks/${id}/complete`, { completeSubtasks }),

  addAssignee: (taskId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.post(`/tasks/${taskId}/assignees`, { userId }),

  removeAssignee: (taskId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.delete(`/tasks/${taskId}/assignees/${userId}`),

  addFollower: (taskId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.post(`/tasks/${taskId}/followers`, { userId }),

  removeFollower: (taskId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.delete(`/tasks/${taskId}/followers/${userId}`),

  getHistory: (taskId: string): Promise<ApiResponse<TaskHistory[]>> =>
    apiClient.get(`/tasks/${taskId}/history`),

  getComments: (taskId: string): Promise<ApiResponse<Comment[]>> =>
    apiClient.get(`/tasks/${taskId}/comments`),

  createComment: (taskId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> =>
    apiClient.post(`/tasks/${taskId}/comments`, data),

  updateComment: (taskId: string, commentId: string, content: string): Promise<ApiResponse<Comment>> =>
    apiClient.patch(`/tasks/${taskId}/comments/${commentId}`, { content }),

  deleteComment: (taskId: string, commentId: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.delete(`/tasks/${taskId}/comments/${commentId}`),
};
