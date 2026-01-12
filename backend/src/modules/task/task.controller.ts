import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get tasks with filters' })
  async getTasks(@CurrentUser() user: User, @Query() filterDto: TaskFilterDto) {
    return this.taskService.findAll(user.id, filterDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @CurrentUser() user: User,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.taskService.create(user.id, createTaskDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async getTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, user.id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async deleteTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.taskService.delete(id, user.id);
    return { success: true };
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Get subtasks' })
  async getSubtasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.getSubtasks(id);
  }

  @Post(':id/subtasks')
  @ApiOperation({ summary: 'Create subtask' })
  async createSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.taskService.create(user.id, {
      ...createTaskDto,
      parentTaskId: id,
    });
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete task' })
  async completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body?: { completeSubtasks?: boolean },
  ) {
    return this.taskService.complete(id, user.id, body?.completeSubtasks);
  }

  @Post(':id/assignees')
  @ApiOperation({ summary: 'Add assignee' })
  async addAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { userId: string },
  ) {
    await this.taskService.addAssignee(id, user.id, body.userId);
    return { success: true };
  }

  @Delete(':id/assignees/:userId')
  @ApiOperation({ summary: 'Remove assignee' })
  async removeAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    await this.taskService.removeAssignee(id, user.id, userId);
    return { success: true };
  }

  @Post(':id/followers')
  @ApiOperation({ summary: 'Add follower' })
  async addFollower(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { userId: string },
  ) {
    await this.taskService.addFollower(id, user.id, body.userId);
    return { success: true };
  }

  @Delete(':id/followers/:userId')
  @ApiOperation({ summary: 'Remove follower' })
  async removeFollower(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    await this.taskService.removeFollower(id, user.id, userId);
    return { success: true };
  }
}
