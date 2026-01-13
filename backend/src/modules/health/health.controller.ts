import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

interface HealthResponse {
  status: string;
  name: string;
  version: string;
  description: string;
  timestamp: string;
  uptime: number;
  documentation: string;
  endpoints: {
    auth: ApiEndpoint[];
    users: ApiEndpoint[];
    teams: ApiEndpoint[];
    tasks: ApiEndpoint[];
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check and API information' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and running',
  })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      name: 'TodoList API',
      version: '1.0.0',
      description: 'A collaborative task management API with team support',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      documentation: '/api/docs',
      endpoints: {
        auth: [
          { method: 'POST', path: '/api/auth/register', description: 'Register a new user' },
          { method: 'POST', path: '/api/auth/login', description: 'Login and get access token' },
          { method: 'POST', path: '/api/auth/refresh', description: 'Refresh access token' },
          { method: 'POST', path: '/api/auth/logout', description: 'Logout and invalidate token' },
        ],
        users: [
          { method: 'GET', path: '/api/users/me', description: 'Get current user profile' },
          { method: 'PATCH', path: '/api/users/me', description: 'Update current user profile' },
          { method: 'GET', path: '/api/users/search', description: 'Search users by email' },
        ],
        teams: [
          { method: 'GET', path: '/api/teams', description: 'List user teams' },
          { method: 'POST', path: '/api/teams', description: 'Create a new team' },
          { method: 'GET', path: '/api/teams/:id', description: 'Get team details' },
          { method: 'PATCH', path: '/api/teams/:id', description: 'Update team' },
          { method: 'GET', path: '/api/teams/:id/members', description: 'List team members' },
          { method: 'POST', path: '/api/teams/:id/members', description: 'Add team member' },
          { method: 'DELETE', path: '/api/teams/:id/members/:userId', description: 'Remove team member' },
        ],
        tasks: [
          { method: 'GET', path: '/api/tasks', description: 'List tasks with filters' },
          { method: 'POST', path: '/api/tasks', description: 'Create a new task' },
          { method: 'GET', path: '/api/tasks/:id', description: 'Get task details' },
          { method: 'PATCH', path: '/api/tasks/:id', description: 'Update task' },
          { method: 'DELETE', path: '/api/tasks/:id', description: 'Delete task' },
          { method: 'POST', path: '/api/tasks/:id/complete', description: 'Mark task as completed' },
          { method: 'GET', path: '/api/tasks/:id/subtasks', description: 'List subtasks' },
          { method: 'POST', path: '/api/tasks/:id/subtasks', description: 'Create subtask' },
          { method: 'POST', path: '/api/tasks/:id/assignees', description: 'Add assignee' },
          { method: 'DELETE', path: '/api/tasks/:id/assignees/:userId', description: 'Remove assignee' },
          { method: 'POST', path: '/api/tasks/:id/followers', description: 'Add follower' },
          { method: 'DELETE', path: '/api/tasks/:id/followers/:userId', description: 'Remove follower' },
          { method: 'GET', path: '/api/tasks/:taskId/comments', description: 'List comments' },
          { method: 'POST', path: '/api/tasks/:taskId/comments', description: 'Add comment' },
          { method: 'GET', path: '/api/tasks/:taskId/history', description: 'Get task history' },
        ],
      },
    };
  }
}
