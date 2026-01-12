import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum TaskView {
  MY_TASKS = 'my_tasks',
  ASSIGNED = 'assigned',
  FOLLOWING = 'following',
  ALL = 'all',
  COMPLETED = 'completed',
}

export class TaskFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ enum: TaskView })
  @IsOptional()
  @IsEnum(TaskView)
  view?: TaskView;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'dueDate', 'id', 'creator'] })
  @IsOptional()
  @IsIn(['createdAt', 'dueDate', 'id', 'creator'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
