import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskHistory, HistoryActionType } from './entities/task-history.entity';

interface CreateHistoryDto {
  taskId: string;
  userId: string;
  actionType: HistoryActionType;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  description: string;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
  ) {}

  async findByTaskId(taskId: string): Promise<TaskHistory[]> {
    return this.historyRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: CreateHistoryDto): Promise<TaskHistory> {
    const history = this.historyRepository.create(data);
    return this.historyRepository.save(history);
  }
}
