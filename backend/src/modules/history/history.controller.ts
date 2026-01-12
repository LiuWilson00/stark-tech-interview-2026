import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HistoryService } from './history.service';

@ApiTags('History')
@ApiBearerAuth()
@Controller('tasks/:taskId/history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get task history' })
  async getHistory(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.historyService.findByTaskId(taskId);
  }
}
