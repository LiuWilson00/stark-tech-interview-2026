import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('tasks/:taskId/comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get task comments' })
  async getComments(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.commentService.findByTaskId(taskId);
  }

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  async createComment(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(taskId, user.id, createCommentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment' })
  async updateComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { content: string },
  ) {
    return this.commentService.update(id, user.id, body.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.commentService.delete(id, user.id);
    return { success: true };
  }
}
