import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskFollower } from './entities/task-follower.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto, TaskView } from './dto/task-filter.dto';
import { TeamService } from '../team/team.service';
import { HistoryService } from '../history/history.service';
import { HistoryActionType } from '../history/entities/task-history.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { TASK_ERRORS, TEAM_ERRORS } from '../../common/errors';

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
    private historyService: HistoryService,
  ) {}

  async findAll(
    userId: string,
    filterDto: TaskFilterDto,
  ): Promise<PaginatedResponse<Task>> {
    const {
      teamId,
      view,
      status,
      creatorId,
      assigneeId,
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
      qb.andWhere('task.dueDate >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('task.dueDate <= :endDate', { endDate });
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

    // Load subtask counts
    for (const task of items) {
      const subtasks = await this.taskRepository.find({
        where: { parentTaskId: task.id, isDeleted: false },
      });
      (task as any).subtasksCount = subtasks.length;
      (task as any).completedSubtasksCount = subtasks.filter(
        (s) => s.status === TaskStatus.COMPLETED,
      ).length;
    }

    return {
      items,
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

    // Record history
    await this.historyService.create({
      taskId: savedTask.id,
      userId,
      actionType: HistoryActionType.CREATED,
      description: `Task "${savedTask.title}" was created`,
    });

    return this.findById(savedTask.id);
  }

  async update(
    id: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findById(id);

    const canEdit = await this.canEditTask(task, userId);
    if (!canEdit) {
      throw new ForbiddenException(TASK_ERRORS.TASK_EDIT_DENIED);
    }

    const oldStatus = task.status;
    const changes: string[] = [];

    if (updateTaskDto.title && updateTaskDto.title !== task.title) {
      changes.push(`title changed from "${task.title}" to "${updateTaskDto.title}"`);
    }

    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      changes.push(`status changed from ${task.status} to ${updateTaskDto.status}`);

      // Record status change history
      await this.historyService.create({
        taskId: id,
        userId,
        actionType: HistoryActionType.STATUS_CHANGED,
        oldValue: { status: oldStatus },
        newValue: { status: updateTaskDto.status },
        description: `Status changed from ${oldStatus} to ${updateTaskDto.status}`,
      });
    }

    await this.taskRepository.update(id, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : undefined,
    });

    if (changes.length && !updateTaskDto.status) {
      await this.historyService.create({
        taskId: id,
        userId,
        actionType: HistoryActionType.UPDATED,
        description: changes.join(', '),
      });
    }

    return this.findById(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id);

    if (task.creatorId !== userId) {
      // For team tasks, check membership
      if (task.teamId) {
        const membership = await this.teamService.findMembership(
          task.teamId,
          userId,
        );
        if (!membership || membership.role === 'member') {
          throw new ForbiddenException(TASK_ERRORS.TASK_DELETE_DENIED);
        }
      } else {
        // For personal tasks, only the creator can delete
        throw new ForbiddenException(TASK_ERRORS.TASK_DELETE_DENIED);
      }
    }

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

    const canEdit = await this.canEditTask(task, userId);
    if (!canEdit) {
      throw new ForbiddenException(TASK_ERRORS.TASK_EDIT_DENIED);
    }

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

    // Record history
    await this.historyService.create({
      taskId: id,
      userId,
      actionType: HistoryActionType.COMPLETED,
      description: `Task completed by user`,
    });

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

      await this.historyService.create({
        taskId: parentTaskId,
        userId,
        actionType: HistoryActionType.COMPLETED,
        description: 'Task auto-completed (all subtasks completed)',
      });
    }
  }

  async addAssignee(taskId: string, userId: string, assigneeId: string): Promise<void> {
    const task = await this.findById(taskId);

    const canEdit = await this.canEditTask(task, userId);
    if (!canEdit) {
      throw new ForbiddenException(TASK_ERRORS.TASK_EDIT_DENIED);
    }

    await this.assigneeRepository.save({
      taskId,
      userId: assigneeId,
    });

    await this.historyService.create({
      taskId,
      userId,
      actionType: HistoryActionType.ASSIGNEE_ADDED,
      newValue: { assigneeId },
      description: 'Assignee added',
    });
  }

  async removeAssignee(taskId: string, userId: string, assigneeId: string): Promise<void> {
    const task = await this.findById(taskId);

    const canEdit = await this.canEditTask(task, userId);
    if (!canEdit) {
      throw new ForbiddenException(TASK_ERRORS.TASK_EDIT_DENIED);
    }

    await this.assigneeRepository.delete({ taskId, userId: assigneeId });

    await this.historyService.create({
      taskId,
      userId,
      actionType: HistoryActionType.ASSIGNEE_REMOVED,
      oldValue: { assigneeId },
      description: 'Assignee removed',
    });
  }

  async addFollower(taskId: string, userId: string, followerId: string): Promise<void> {
    await this.findById(taskId); // Verify task exists

    await this.followerRepository.save({
      taskId,
      userId: followerId,
    });

    await this.historyService.create({
      taskId,
      userId,
      actionType: HistoryActionType.FOLLOWER_ADDED,
      newValue: { followerId },
      description: 'Follower added',
    });
  }

  async removeFollower(taskId: string, userId: string, followerId: string): Promise<void> {
    await this.findById(taskId); // Verify task exists

    await this.followerRepository.delete({ taskId, userId: followerId });

    await this.historyService.create({
      taskId,
      userId,
      actionType: HistoryActionType.FOLLOWER_REMOVED,
      oldValue: { followerId },
      description: 'Follower removed',
    });
  }

  private async canEditTask(task: Task, userId: string): Promise<boolean> {
    // Creator can edit
    if (task.creatorId === userId) return true;

    // Assignee can edit
    const isAssignee = task.assignees?.some((a) => a.userId === userId);
    if (isAssignee) return true;

    // Team admin/owner can edit (only if task belongs to a team)
    if (task.teamId) {
      const membership = await this.teamService.findMembership(task.teamId, userId);
      if (membership && membership.role !== 'member') return true;
    }

    return false;
  }
}
