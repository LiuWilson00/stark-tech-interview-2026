import { UserSummary } from './user';
import { Team } from './team';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskView {
  MY_TASKS = 'my_tasks',
  ASSIGNED = 'assigned',
  FOLLOWING = 'following',
  ALL = 'all',
  COMPLETED = 'completed',
}

export interface TaskAssignee {
  id: string;
  userId: string;
  user: UserSummary;
  isCompleted: boolean;
  assignedAt: string;
}

export interface TaskFollower {
  id: string;
  userId: string;
  user: UserSummary;
  followedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  teamId: string;
  team: Team;
  creatorId: string;
  creator: UserSummary;
  parentTaskId: string | null;
  parentTask: Task | null;
  assignees: TaskAssignee[];
  followers: TaskFollower[];
  subtasksCount?: number;
  completedSubtasksCount?: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  teamId: string;
  parentTaskId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeIds?: string[];
  followerIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export type DateFieldType = 'dueDate' | 'createdAt' | 'completedAt' | 'updatedAt';

export interface TaskFilterParams {
  teamId?: string;
  view?: TaskView;
  status?: TaskStatus;
  creatorId?: string;
  assigneeId?: string;
  dateField?: DateFieldType;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'id';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export enum HistoryActionType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNEE_ADDED = 'assignee_added',
  ASSIGNEE_REMOVED = 'assignee_removed',
  FOLLOWER_ADDED = 'follower_added',
  FOLLOWER_REMOVED = 'follower_removed',
  COMMENT_ADDED = 'comment_added',
  COMPLETED = 'completed',
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  user: UserSummary;
  actionType: HistoryActionType;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  description: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  user: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}
