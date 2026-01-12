import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { HistoryService } from '../history/history.service';
import { HistoryActionType } from '../history/entities/task-history.entity';
import { COMMENT_ERRORS } from '../../common/errors';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private historyService: HistoryService,
  ) {}

  async findByTaskId(taskId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    taskId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment | null> {
    const comment = this.commentRepository.create({
      taskId,
      userId,
      content: createCommentDto.content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Record history
    await this.historyService.create({
      taskId,
      userId,
      actionType: HistoryActionType.COMMENT_ADDED,
      newValue: { commentId: savedComment.id, content: savedComment.content },
      description: 'Comment added',
    });

    return this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  async update(
    id: string,
    userId: string,
    content: string,
  ): Promise<Comment | null> {
    const comment = await this.commentRepository.findOne({
      where: { id, userId },
    });

    if (!comment) {
      throw new NotFoundException(COMMENT_ERRORS.COMMENT_NOT_FOUND);
    }

    await this.commentRepository.update(id, { content });

    return this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id, userId },
    });

    if (!comment) {
      throw new NotFoundException(COMMENT_ERRORS.COMMENT_NOT_FOUND);
    }

    await this.commentRepository.delete(id);
  }
}
