# 任務到期提醒系統設計文件

本文件描述任務即將到期時的訊息提醒功能架構設計。

## 功能概述

當任務的截止日期 (dueDate) 即將到達時，系統會自動發送提醒通知給：
- 任務創建者 (Creator)
- 任務執行人 (Assignees)
- 任務關注者 (Followers)

## 系統架構

```mermaid
graph TB
    subgraph Scheduler["排程服務"]
        CRON[Cron Job<br/>每分鐘執行]
    end

    subgraph Core["核心服務"]
        NS[NotificationService]
        TS[TaskService]
        US[UserService]
    end

    subgraph Queue["訊息佇列"]
        BULL[Bull Queue<br/>Redis-backed]
    end

    subgraph Delivery["通知發送"]
        EMAIL[Email Service<br/>SMTP/SendGrid]
        PUSH[Push Service<br/>FCM/APNs]
        WS[WebSocket<br/>即時通知]
    end

    subgraph Storage["資料儲存"]
        DB[(MySQL<br/>notifications)]
        REDIS[(Redis<br/>Queue + Cache)]
    end

    CRON --> NS
    NS --> TS
    NS --> US
    NS --> BULL
    BULL --> EMAIL
    BULL --> PUSH
    BULL --> WS
    NS --> DB
    BULL --> REDIS
```

## 資料庫 Schema

### Notification 表

```mermaid
erDiagram
    NOTIFICATION {
        uuid id PK
        uuid userId FK
        uuid taskId FK
        enum type "TASK_DUE_SOON|TASK_OVERDUE|..."
        varchar title
        text content
        boolean isRead
        datetime readAt
        datetime createdAt
    }

    NOTIFICATION_SETTING {
        uuid id PK
        uuid userId FK
        boolean emailEnabled
        boolean pushEnabled
        boolean inAppEnabled
        int reminderHoursBefore
        datetime createdAt
        datetime updatedAt
    }

    USER ||--o{ NOTIFICATION : receives
    USER ||--|| NOTIFICATION_SETTING : has
    TASK ||--o{ NOTIFICATION : triggers
```

### SQL Schema

```sql
-- 通知表
CREATE TABLE notification (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    task_id CHAR(36),
    type ENUM('TASK_DUE_SOON', 'TASK_OVERDUE', 'TASK_ASSIGNED',
              'TASK_COMPLETED', 'COMMENT_ADDED') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE SET NULL,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created_at (created_at)
);

-- 通知設定表
CREATE TABLE notification_setting (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    reminder_hours_before INT DEFAULT 24,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

## 處理流程

### 提醒排程流程

```mermaid
sequenceDiagram
    participant Cron as Cron Scheduler
    participant NS as NotificationService
    participant DB as Database
    participant Queue as Bull Queue
    participant Email as Email Service
    participant WS as WebSocket

    Cron->>NS: 每分鐘觸發 checkDueTasks()
    NS->>DB: 查詢即將到期任務<br/>(dueDate within reminder window)
    DB-->>NS: 返回任務列表

    loop 每個即將到期任務
        NS->>DB: 查詢任務相關用戶<br/>(creator, assignees, followers)
        NS->>DB: 檢查是否已發送通知

        alt 尚未發送通知
            NS->>DB: 創建 Notification 記錄
            NS->>Queue: 加入通知佇列
        end
    end

    Queue->>Email: 處理 Email 通知
    Queue->>WS: 推送即時通知

    WS-->>NS: 通知送達確認
```

### 用戶接收通知流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant FE as Frontend
    participant WS as WebSocket
    participant API as API Server
    participant DB as Database

    User->>FE: 登入系統
    FE->>WS: 建立 WebSocket 連線
    WS-->>FE: 連線成功

    Note over WS: 有新通知時
    WS->>FE: 推送通知事件
    FE->>FE: 顯示通知徽章/彈窗

    User->>FE: 點擊通知
    FE->>API: GET /notifications/:id
    API->>DB: 標記為已讀
    FE->>FE: 導航到任務詳情
```

## NestJS 實作架構

### Module 結構

```mermaid
graph TB
    subgraph NotificationModule
        NC[NotificationController]
        NS[NotificationService]
        NR[NotificationRepository]
        NG[NotificationGateway<br/>WebSocket]
    end

    subgraph SchedulerModule
        SS[SchedulerService]
    end

    subgraph QueueModule
        NP[NotificationProcessor]
        NQ[NotificationQueue]
    end

    NC --> NS
    NS --> NR
    NS --> NG
    SS --> NS
    NQ --> NP
    NS --> NQ
```

### 核心程式碼結構

```typescript
// notification.entity.ts
@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Task, { nullable: true })
  task: Task;

  @Column({ nullable: true })
  taskId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

// notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    private notificationRepo: Repository<Notification>,
    private taskService: TaskService,
    private notificationGateway: NotificationGateway,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  async checkDueTasks(): Promise<void> {
    const now = new Date();
    const tasks = await this.taskService.findTasksDueSoon(24); // 24小時內到期

    for (const task of tasks) {
      const recipients = this.getTaskRecipients(task);

      for (const userId of recipients) {
        const exists = await this.hasNotificationSent(task.id, userId, 'TASK_DUE_SOON');
        if (!exists) {
          await this.createAndSendNotification(task, userId, 'TASK_DUE_SOON');
        }
      }
    }
  }

  private async createAndSendNotification(
    task: Task,
    userId: string,
    type: NotificationType,
  ): Promise<void> {
    const notification = await this.notificationRepo.save({
      userId,
      taskId: task.id,
      type,
      title: this.getNotificationTitle(type, task),
      content: this.getNotificationContent(type, task),
    });

    // 加入佇列處理
    await this.notificationQueue.add('send', { notificationId: notification.id });

    // WebSocket 即時推送
    this.notificationGateway.sendToUser(userId, notification);
  }
}

// scheduler.service.ts
@Injectable()
export class SchedulerService {
  constructor(private notificationService: NotificationService) {}

  @Cron('* * * * *') // 每分鐘執行
  async handleDueTaskReminders(): Promise<void> {
    await this.notificationService.checkDueTasks();
  }

  @Cron('0 * * * *') // 每小時執行
  async handleOverdueTasks(): Promise<void> {
    await this.notificationService.checkOverdueTasks();
  }
}
```

## API 端點設計

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | 取得用戶通知列表 |
| GET | `/api/notifications/unread-count` | 取得未讀數量 |
| PATCH | `/api/notifications/:id/read` | 標記單則為已讀 |
| PATCH | `/api/notifications/read-all` | 標記全部為已讀 |
| DELETE | `/api/notifications/:id` | 刪除通知 |
| GET | `/api/notification-settings` | 取得通知設定 |
| PATCH | `/api/notification-settings` | 更新通知設定 |

## 技術選型

| 元件 | 技術選擇 | 說明 |
|------|---------|------|
| 排程 | `@nestjs/schedule` | Cron-based scheduler |
| 佇列 | `@nestjs/bull` + Redis | 可靠的訊息佇列 |
| WebSocket | `@nestjs/websockets` | 即時推送 |
| Email | `@nestjs-modules/mailer` | SMTP/SendGrid |
| Push | `firebase-admin` | FCM for mobile push |

## 通知類型

```mermaid
graph LR
    subgraph 任務相關
        A[TASK_DUE_SOON<br/>即將到期]
        B[TASK_OVERDUE<br/>已逾期]
        C[TASK_ASSIGNED<br/>被指派]
        D[TASK_COMPLETED<br/>已完成]
    end

    subgraph 協作相關
        E[COMMENT_ADDED<br/>新評論]
        F[MENTION<br/>被提及]
        G[FOLLOWER_ADDED<br/>被加為關注者]
    end
```

## 提醒時間策略

```mermaid
timeline
    title 任務到期提醒時間線

    section 到期前 24 小時
        第一次提醒 : 發送 TASK_DUE_SOON 通知

    section 到期前 1 小時
        緊急提醒 : 發送緊急提醒（可選）

    section 到期時間
        到期通知 : 最後提醒

    section 逾期後
        逾期通知 : 發送 TASK_OVERDUE 通知
```

## 效能考量

1. **批次處理**: 使用 Bull Queue 批次處理通知，避免阻塞主程序
2. **去重機制**: 檢查是否已發送相同通知，避免重複打擾用戶
3. **索引優化**: 對 `dueDate`、`userId`、`isRead` 建立複合索引
4. **快取策略**: 使用 Redis 快取用戶通知設定
5. **限流保護**: 對 Email/Push 服務設定速率限制

