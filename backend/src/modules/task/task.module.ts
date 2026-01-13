import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { Task } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskFollower } from './entities/task-follower.entity';
import { TeamModule } from '../team/team.module';
import { TaskAuthorizationHelper } from './helpers/task-authorization.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskAssignee, TaskFollower]),
    TeamModule,
    // Note: HistoryModule no longer needed here - events handled via EventEmitter
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskAuthorizationHelper],
  exports: [TaskService],
})
export class TaskModule {}
