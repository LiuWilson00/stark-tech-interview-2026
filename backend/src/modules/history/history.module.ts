import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { TaskHistory } from './entities/task-history.entity';
import { TaskHistoryListener } from './listeners/task-history.listener';

@Module({
  imports: [TypeOrmModule.forFeature([TaskHistory])],
  controllers: [HistoryController],
  providers: [HistoryService, TaskHistoryListener],
  exports: [HistoryService],
})
export class HistoryModule {}
