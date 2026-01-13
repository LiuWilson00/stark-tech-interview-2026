import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskFollower } from './entities/task-follower.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto, TaskView } from './dto/task-filter.dto';
import { TeamService } from '../team/team.service';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { TASK_ERRORS, TEAM_ERRORS } from '../../common/errors';
import { TaskAuthorizationHelper } from './helpers/task-authorization.helper';
import { TaskWithCounts } from './interfaces/task-with-counts.interface';
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
} from './events/task.events';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private assigneeRepository: Repository<TaskAssignee>,
    @InjectRepository(TaskFollower)
    private followerRepository: Repository<TaskFollower>,
    private teamService: TeamService,
    private eventEmitter: EventEmitter2,
    private authHelper: TaskAuthorizationHelper,
  ) {}

  async findAll(
    userId: string,
    filterDto: TaskFilterDto,
  ): Promise<PaginatedResponse<TaskWithCounts>> {
    const {
      teamId,
      view,
      status,
      creatorId,
      assigneeId,
      dateField = 'createdAt',
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20,
    } = filterDto;

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('task.followers', 'followers')
      .where('task.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('task.parentTaskId IS NULL');

    if (teamId) {
      qb.andWhere('task.teamId = :teamId', { teamId });
    }

    this.applyViewFilter(qb, view || TaskView.ALL, userId);

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (creatorId) {
      qb.andWhere('task.creatorId = :creatorId', { creatorId });
    }

    if (assigneeId) {
      qb.andWhere('assignees.userId = :assigneeId', { assigneeId });
    }

    if (startDate) {
      qb.andWhere(`task.${dateField} >= :startDate`, { startDate });
    }

    if (endDate) {
      qb.andWhere(`task.${dateField} <= :endDate`, { endDate });
    }

    // Handle sorting
    let sortColumn: string;
    if (sortBy === 'id') {
      sortColumn = 'task.id';
    } else if (sortBy === 'creator') {
      sortColumn = 'creator.name';
    } else {
      sortColumn = `task.${sortBy}`;
    }
    qb.orderBy(sortColumn, sortOrder);

    const total = await qb.getCount();
    const skip = (page - 1) * limit;

    const items = await qb.skip(skip).take(limit).getMany();

    // Initialize items with count properties as TaskWithCounts
    const itemsWithCounts: TaskWithCounts[] = items.map((task) => ({
      ...task,
      subtasksCount: 0,
      completedSubtasksCount: 0,
    }));

    // Load subtask counts with a single aggregation query (N+1 optimization)
    if (itemsWithCounts.length > 0) {
      const taskIds = itemsWithCounts.map((t) => t.id);

      const subtaskCounts = await this.taskRepository
        .createQueryBuilder('subtask')
        .select('subtask.parentTaskId', 'parentTaskId')
        .addSelect('COUNT(*)', 'total')
        .addSelect(
          `SUM(CASE WHEN subtask.status = '${TaskStatus.COMPLETED}' THEN 1 ELSE 0 END)`,
          'completed',
        )
        .where('subtask.parentTaskId IN (:...taskIds)', { taskIds })
        .andWhere('subtask.isDeleted = :isDeleted', { isDeleted: false })
        .groupBy('subtask.parentTaskId')
        .getRawMany<{ parentTaskId: string; total: string; completed: string }>();

      const countMap = new Map(
        subtaskCounts.map((c) => [
          c.parentTaskId,
          { total: parseInt(c.total, 10), completed: parseInt(c.completed, 10) },
        ]),
      );

      for (const task of itemsWithCounts) {
        const counts = countMap.get(task.id) || { total: 0, completed: 0 };
        task.subtasksCount = counts.total;
        task.completedSubtasksCount = counts.completed;
      }
    }

    return {
      items: itemsWithCounts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private applyViewFilter(
    qb: SelectQueryBuilder<Task>,
    view: TaskView,
    userId: string,
  ): void {
    switch (view) {
      case TaskView.MY_TASKS:
        qb.andWhere('task.creatorId = :userId', { userId });
        break;
      case TaskView.ASSIGNED:
        qb.andWhere('assignees.userId = :userId', { userId });
        break;
      case TaskView.FOLLOWING:
        qb.andWhere('followers.userId = :userId', { userId });
        break;
      case TaskView.COMPLETED:
        qb.andWhere('task.status = :completedStatus', {
          completedStatus: TaskStatus.COMPLETED,
        });
        break;
      case TaskView.ALL:
      default:
        // Show tasks where user is creator, assignee, or follower
        qb.andWhere(
          '(task.creatorId = :userId OR assignees.userId = :userId OR followers.userId = :userId)',
          { userId },
        );
        break;
    }
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, isDeleted: false },
      relations: [
        'creator',
        'team',
        'assignees',
        'assignees.user',
        'followers',
        'followers.user',
        'parentTask',
      ],
    });

    if (!task) {
      throw new NotFoundException(TASK_ERRORS.TASK_NOT_FOUND);
    }

    return task;
  }

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    // Verify user is team member only if teamId is provided
    if (createTaskDto.teamId) {
      const isMember = await this.teamService.isTeamMember(
        createTaskDto.teamId,
        userId,
      );

      if (!isMember) {
        throw new ForbiddenException(TEAM_ERRORS.NOT_TEAM_MEMBER);
      }
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      teamId: createTaskDto.teamId,
      creatorId: userId,
      parentTaskId: createTaskDto.parentTaskId,
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });

    const savedTask = await this.taskRepository.save(task) as Task;

    // Add assignees
    if (createTaskDto.assigneeIds?.length) {
      for (const assigneeId of createTaskDto.assigneeIds) {
        await this.assigneeRepository.save({
          taskId: savedTask.id,
          userId: assigneeId,
        });
      }
    }

    // Add followers
    if (createTaskDto.followerIds?.length) {
      for (const followerId of createTaskDto.followerIds) {
        await this.followerRepository.save({
          taskId: savedTask.id,
          userId: followerId,
        });
      }
    }

    // Emit task created event (history handled by listener)
    this.eventEmitter.emit(
      TASK_EVENTS.CREATED,
      new TaskCreatedEvent(savedTask.id, userId, savedTask.title),
    );

    return this.findById(savedTask.id);
  }

  async update(
    id: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findById(id);

    await this.authHelper.assertCanEdit(task, userId);

    const oldStatus = task.status;
    const changes: string[] = [];

    if (updateTaskDto.title && updateTaskDto.title !== task.title) {
      changes.push(`title changed from "${task.title}" to "${updateTaskDto.title}"`);
    }

    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      changes.push(`status changed from ${task.status} to ${updateTaskDto.status}`);

      // Emit status changed event
      this.eventEmitter.emit(
        TASK_EVENTS.STATUS_CHANGED,
        new TaskStatusChangedEvent(id, userId, oldStatus, updateTaskDto.status),
      );
    }

    await this.taskRepository.update(id, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : undefined,
    });

    if (changes.length && !updateTaskDto.status) {
      // Emit task updated event
      this.eventEmitter.emit(
        TASK_EVENTS.UPDATED,
        new TaskUpdatedEvent(id, userId, changes.join(', ')),
      );
    }

    return this.findById(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id);

    await this.authHelper.assertCanDelete(task, userId);

    await this.taskRepository.update(id, { isDeleted: true });
  }

  async getSubtasks(taskId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { parentTaskId: taskId, isDeleted: false },
      relations: ['creator', 'assignees', 'assignees.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async complete(
    id: string,
    userId: string,
    completeSubtasks = false,
  ): Promise<Task> {
    const task = await this.findById(id);

    await this.authHelper.assertCanEdit(task, userId);

    // Mark assignee as completed if applicable
    const assignee = task.assignees?.find((a) => a.userId === userId);
    if (assignee) {
      await this.assigneeRepository.update(assignee.id, { isCompleted: true });
    }

    // Check if all assignees completed (if multiple)
    if (task.assignees?.length > 1) {
      const allCompleted = task.assignees.every(
        (a) => a.isCompleted || a.userId === userId,
      );
      if (!allCompleted) {
        return this.findById(id);
      }
    }

    // Complete the task
    await this.taskRepository.update(id, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Complete subtasks if requested
    if (completeSubtasks) {
      const subtasks = await this.getSubtasks(id);
      for (const subtask of subtasks) {
        if (subtask.status !== TaskStatus.COMPLETED) {
          await this.taskRepository.update(subtask.id, {
            status: TaskStatus.COMPLETED,
            completedAt: new Date(),
          });
        }
      }
    }

    // Emit task completed event
    this.eventEmitter.emit(
      TASK_EVENTS.COMPLETED,
      new TaskCompletedEvent(id, userId),
    );

    // Check if parent task should be auto-completed
    if (task.parentTaskId) {
      await this.checkParentTaskCompletion(task.parentTaskId, userId);
    }

    return this.findById(id);
  }

  private async checkParentTaskCompletion(
    parentTaskId: string,
    userId: string,
  ): Promise<void> {
    const subtasks = await this.getSubtasks(parentTaskId);
    const allCompleted = subtasks.every(
      (s) => s.status === TaskStatus.COMPLETED,
    );

    if (allCompleted) {
      await this.taskRepository.update(parentTaskId, {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      // Emit auto-completed event
      this.eventEmitter.emit(
        TASK_EVENTS.COMPLETED,
        new TaskCompletedEvent(parentTaskId, userId, true),
      );
    }
  }

  async addAssignee(taskId: string, userId: string, assigneeId: string): Promise<void> {
    const task = await this.findById(taskId);

    await this.authHelper.assertCanEdit(task, userId);

    await this.assigneeRepository.save({
      taskId,
      userId: assigneeId,
    });

    // Emit assignee added event
    this.eventEmitter.emit(
      TASK_EVENTS.ASSIGNEE_ADDED,
      new TaskAssigneeAddedEvent(taskId, userId, assigneeId),
    );
  }

  async removeAssignee(taskId: string, userId: string, assigneeId: string): Promise<void> {
    const task = await this.findById(taskId);

    await this.authHelper.assertCanEdit(task, userId);

    await this.assigneeRepository.delete({ taskId, userId: assigneeId });

    // Emit assignee removed event
    this.eventEmitter.emit(
      TASK_EVENTS.ASSIGNEE_REMOVED,
      new TaskAssigneeRemovedEvent(taskId, userId, assigneeId),
    );
  }

  async addFollower(taskId: string, userId: string, followerId: string): Promise<void> {
    await this.findById(taskId); // Verify task exists

    await this.followerRepository.save({
      taskId,
      userId: followerId,
    });

    // Emit follower added event
    this.eventEmitter.emit(
      TASK_EVENTS.FOLLOWER_ADDED,
      new TaskFollowerAddedEvent(taskId, userId, followerId),
    );
  }

  async removeFollower(taskId: string, userId: string, followerId: string): Promise<void> {
    await this.findById(taskId); // Verify task exists

    await this.followerRepository.delete({ taskId, userId: followerId });

    // Emit follower removed event
    this.eventEmitter.emit(
      TASK_EVENTS.FOLLOWER_REMOVED,
      new TaskFollowerRemovedEvent(taskId, userId, followerId),
    );
  }
}
