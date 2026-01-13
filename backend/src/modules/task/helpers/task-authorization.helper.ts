import { Injectable, ForbiddenException } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { TeamService } from '../../team/team.service';
import { TASK_ERRORS } from '../../../common/errors';

/**
 * TaskAuthorizationHelper - Centralized permission checking for tasks
 *
 * Consolidates all task permission logic in one place for:
 * - Consistent permission rules across the application
 * - Easy maintenance and updates to permission logic
 * - Clear separation of concerns from business logic
 */
@Injectable()
export class TaskAuthorizationHelper {
  constructor(private readonly teamService: TeamService) {}

  // ---------------------------------------------------------------------------
  // Permission Checks (return boolean)
  // ---------------------------------------------------------------------------

  /**
   * Check if user can view a task
   * Rules: Creator, assignee, follower, or team member can view
   */
  async canView(task: Task, userId: string): Promise<boolean> {
    // Creator can view
    if (task.creatorId === userId) return true;

    // Assignee can view
    if (this.isAssignee(task, userId)) return true;

    // Follower can view
    if (this.isFollower(task, userId)) return true;

    // Team member can view (if task belongs to a team)
    if (task.teamId) {
      const membership = await this.teamService.findMembership(task.teamId, userId);
      if (membership) return true;
    }

    return false;
  }

  /**
   * Check if user can edit a task
   * Rules: Creator, assignee, or team admin/owner can edit
   */
  async canEdit(task: Task, userId: string): Promise<boolean> {
    // Creator can edit
    if (task.creatorId === userId) return true;

    // Assignee can edit
    if (this.isAssignee(task, userId)) return true;

    // Team admin/owner can edit (only if task belongs to a team)
    if (task.teamId) {
      const membership = await this.teamService.findMembership(task.teamId, userId);
      if (membership && membership.role !== 'member') return true;
    }

    return false;
  }

  /**
   * Check if user can delete a task
   * Rules: Creator can delete, or team admin/owner for team tasks
   */
  async canDelete(task: Task, userId: string): Promise<boolean> {
    // Creator can delete
    if (task.creatorId === userId) return true;

    // Team admin/owner can delete (only if task belongs to a team)
    if (task.teamId) {
      const membership = await this.teamService.findMembership(task.teamId, userId);
      if (membership && membership.role !== 'member') return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // Assertion Methods (throw ForbiddenException if not authorized)
  // ---------------------------------------------------------------------------

  /**
   * Assert user can view task, throw ForbiddenException if not
   */
  async assertCanView(task: Task, userId: string): Promise<void> {
    if (!(await this.canView(task, userId))) {
      throw new ForbiddenException(TASK_ERRORS.TASK_ACCESS_DENIED);
    }
  }

  /**
   * Assert user can edit task, throw ForbiddenException if not
   */
  async assertCanEdit(task: Task, userId: string): Promise<void> {
    if (!(await this.canEdit(task, userId))) {
      throw new ForbiddenException(TASK_ERRORS.TASK_EDIT_DENIED);
    }
  }

  /**
   * Assert user can delete task, throw ForbiddenException if not
   */
  async assertCanDelete(task: Task, userId: string): Promise<void> {
    if (!(await this.canDelete(task, userId))) {
      throw new ForbiddenException(TASK_ERRORS.TASK_DELETE_DENIED);
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  /**
   * Check if user is an assignee of the task
   */
  private isAssignee(task: Task, userId: string): boolean {
    return task.assignees?.some((a) => a.userId === userId) ?? false;
  }

  /**
   * Check if user is a follower of the task
   */
  private isFollower(task: Task, userId: string): boolean {
    return task.followers?.some((f) => f.userId === userId) ?? false;
  }
}
