import { Task } from '../entities/task.entity';

/**
 * Task with computed subtask count properties
 * Used when returning tasks from list queries with aggregated subtask data
 */
export interface TaskWithCounts extends Task {
  subtasksCount: number;
  completedSubtasksCount: number;
}
