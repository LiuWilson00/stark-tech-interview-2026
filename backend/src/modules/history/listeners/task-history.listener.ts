import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HistoryService } from '../history.service';
import { HistoryActionType } from '../entities/task-history.entity';
import {
  TASK_EVENTS,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskCompletedEvent,
  TaskStatusChangedEvent,
  TaskAssigneeAddedEvent,
  TaskAssigneeRemovedEvent,
  TaskFollowerAddedEvent,
  TaskFollowerRemovedEvent,
} from '../../task/events/task.events';

/**
 * TaskHistoryListener - Handles task events and creates history records
 *
 * Decouples history tracking from business logic in TaskService.
 * Each event handler creates an appropriate history entry.
 */
@Injectable()
export class TaskHistoryListener {
  constructor(private readonly historyService: HistoryService) {}

  @OnEvent(TASK_EVENTS.CREATED)
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.CREATED,
      description: `Task "${event.title}" was created`,
    });
  }

  @OnEvent(TASK_EVENTS.UPDATED)
  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.UPDATED,
      description: event.changes,
    });
  }

  @OnEvent(TASK_EVENTS.COMPLETED)
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const description = event.isAutoComplete
      ? 'Task auto-completed (all subtasks completed)'
      : 'Task completed by user';

    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.COMPLETED,
      description,
    });
  }

  @OnEvent(TASK_EVENTS.STATUS_CHANGED)
  async handleStatusChanged(event: TaskStatusChangedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.STATUS_CHANGED,
      oldValue: { status: event.oldStatus },
      newValue: { status: event.newStatus },
      description: `Status changed from ${event.oldStatus} to ${event.newStatus}`,
    });
  }

  @OnEvent(TASK_EVENTS.ASSIGNEE_ADDED)
  async handleAssigneeAdded(event: TaskAssigneeAddedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.ASSIGNEE_ADDED,
      newValue: { assigneeId: event.assigneeId },
      description: 'Assignee added',
    });
  }

  @OnEvent(TASK_EVENTS.ASSIGNEE_REMOVED)
  async handleAssigneeRemoved(event: TaskAssigneeRemovedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.ASSIGNEE_REMOVED,
      oldValue: { assigneeId: event.assigneeId },
      description: 'Assignee removed',
    });
  }

  @OnEvent(TASK_EVENTS.FOLLOWER_ADDED)
  async handleFollowerAdded(event: TaskFollowerAddedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.FOLLOWER_ADDED,
      newValue: { followerId: event.followerId },
      description: 'Follower added',
    });
  }

  @OnEvent(TASK_EVENTS.FOLLOWER_REMOVED)
  async handleFollowerRemoved(event: TaskFollowerRemovedEvent): Promise<void> {
    await this.historyService.create({
      taskId: event.taskId,
      userId: event.userId,
      actionType: HistoryActionType.FOLLOWER_REMOVED,
      oldValue: { followerId: event.followerId },
      description: 'Follower removed',
    });
  }
}
