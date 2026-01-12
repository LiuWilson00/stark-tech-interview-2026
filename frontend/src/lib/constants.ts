import { TaskStatus, TaskPriority, TaskView } from '@/types/task';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待處理',
  [TaskStatus.IN_PROGRESS]: '進行中',
  [TaskStatus.COMPLETED]: '已完成',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-gray-100 text-gray-600',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-600',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-600',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '低',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.HIGH]: '高',
  [TaskPriority.URGENT]: '緊急',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'text-gray-500',
  [TaskPriority.MEDIUM]: 'text-blue-500',
  [TaskPriority.HIGH]: 'text-orange-500',
  [TaskPriority.URGENT]: 'text-red-500',
};

export const TASK_VIEW_LABELS: Record<TaskView, string> = {
  [TaskView.MY_TASKS]: '我建立的',
  [TaskView.ASSIGNED]: '我分配的',
  [TaskView.FOLLOWING]: '關注',
  [TaskView.ALL]: '全部任務',
  [TaskView.COMPLETED]: '已完成',
};
