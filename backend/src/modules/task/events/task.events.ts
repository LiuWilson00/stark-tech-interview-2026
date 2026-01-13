/**
 * Task Domain Events
 *
 * Events emitted by TaskService for decoupled handling of side effects
 * like history tracking, notifications, etc.
 */

export const TASK_EVENTS = {
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  COMPLETED: 'task.completed',
  STATUS_CHANGED: 'task.status.changed',
  ASSIGNEE_ADDED: 'task.assignee.added',
  ASSIGNEE_REMOVED: 'task.assignee.removed',
  FOLLOWER_ADDED: 'task.follower.added',
  FOLLOWER_REMOVED: 'task.follower.removed',
} as const;

export class TaskCreatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly title: string,
  ) {}
}

export class TaskUpdatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly changes: string,
  ) {}
}

export class TaskCompletedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly isAutoComplete?: boolean,
  ) {}
}

export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class TaskAssigneeAddedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly assigneeId: string,
  ) {}
}

export class TaskAssigneeRemovedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly assigneeId: string,
  ) {}
}

export class TaskFollowerAddedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly followerId: string,
  ) {}
}

export class TaskFollowerRemovedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly followerId: string,
  ) {}
}
