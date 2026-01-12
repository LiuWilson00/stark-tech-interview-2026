import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Task } from '../../task/entities/task.entity';

export enum HistoryActionType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNEE_ADDED = 'assignee_added',
  ASSIGNEE_REMOVED = 'assignee_removed',
  FOLLOWER_ADDED = 'follower_added',
  FOLLOWER_REMOVED = 'follower_removed',
  COMMENT_ADDED = 'comment_added',
  COMPLETED = 'completed',
}

@Entity('task_histories')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: HistoryActionType,
  })
  actionType: HistoryActionType;

  @Column({ type: 'json', nullable: true })
  oldValue: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  newValue: Record<string, unknown>;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
