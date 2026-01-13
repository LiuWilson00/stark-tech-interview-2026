# 定時重複任務系統設計文件

本文件描述定時重複任務功能的架構設計，讓用戶可以設定任務自動重複產生。

## 功能概述

用戶可以為任務設定重複規則，系統會在指定時間自動創建新的任務實例。

支援的重複模式：
- **每日** - 每天固定時間
- **每週** - 指定星期幾
- **每月** - 指定日期或第幾週的星期幾
- **自定義** - 每 N 天/週/月

## 系統架構

```mermaid
graph TB
    subgraph User["用戶操作"]
        UI[前端 UI]
    end

    subgraph API["API 層"]
        TC[TaskController]
        RC[RecurrenceController]
    end

    subgraph Services["服務層"]
        TS[TaskService]
        RS[RecurrenceService]
        SS[SchedulerService]
    end

    subgraph Queue["佇列處理"]
        BQ[Bull Queue]
        RP[RecurrenceProcessor]
    end

    subgraph Storage["資料儲存"]
        DB[(MySQL)]
        REDIS[(Redis)]
    end

    UI --> TC
    UI --> RC
    TC --> TS
    RC --> RS
    SS --> RS
    RS --> BQ
    BQ --> RP
    RP --> TS
    TS --> DB
    RS --> DB
    BQ --> REDIS
```

## 資料庫 Schema

### Entity Relationship

```mermaid
erDiagram
    TASK ||--o| RECURRENCE_RULE : has
    RECURRENCE_RULE ||--o{ TASK : generates

    TASK {
        uuid id PK
        varchar title
        text description
        uuid parentId FK
        uuid recurrenceRuleId FK
        uuid sourceTaskId FK
        boolean isRecurring
        datetime dueDate
        datetime createdAt
    }

    RECURRENCE_RULE {
        uuid id PK
        uuid taskId FK
        enum frequency "DAILY|WEEKLY|MONTHLY|CUSTOM"
        int interval
        json daysOfWeek
        int dayOfMonth
        enum weekOfMonth "FIRST|SECOND|THIRD|FOURTH|LAST"
        datetime startDate
        datetime endDate
        int maxOccurrences
        int occurrenceCount
        datetime nextRunAt
        datetime lastRunAt
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
```

### SQL Schema

```sql
-- 重複規則表
CREATE TABLE recurrence_rule (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,

    -- 重複頻率
    frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM') NOT NULL,
    `interval` INT DEFAULT 1,  -- 每隔幾個單位

    -- 週重複設定 (WEEKLY)
    days_of_week JSON,  -- [0,1,2,3,4,5,6] 代表週日到週六

    -- 月重複設定 (MONTHLY)
    day_of_month INT,  -- 每月幾號 (1-31)
    week_of_month ENUM('FIRST', 'SECOND', 'THIRD', 'FOURTH', 'LAST'),

    -- 時間範圍
    start_date DATETIME NOT NULL,
    end_date DATETIME,  -- NULL 表示永不結束

    -- 次數限制
    max_occurrences INT,  -- NULL 表示無限次
    occurrence_count INT DEFAULT 0,

    -- 執行追蹤
    next_run_at DATETIME NOT NULL,
    last_run_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
    INDEX idx_next_run (next_run_at, is_active),
    INDEX idx_task (task_id)
);

-- 在 task 表新增欄位
ALTER TABLE task ADD COLUMN recurrence_rule_id CHAR(36);
ALTER TABLE task ADD COLUMN source_task_id CHAR(36);
ALTER TABLE task ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE task ADD FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rule(id) ON DELETE SET NULL;
ALTER TABLE task ADD FOREIGN KEY (source_task_id) REFERENCES task(id) ON DELETE SET NULL;
```

## 重複模式詳解

### 支援的重複模式

```mermaid
graph LR
    subgraph Daily["每日重複"]
        D1[每天]
        D2[每 N 天]
    end

    subgraph Weekly["每週重複"]
        W1[每週一/三/五]
        W2[每 N 週的指定日]
    end

    subgraph Monthly["每月重複"]
        M1[每月 15 號]
        M2[每月第一個週一]
        M3[每月最後一個週五]
    end

    subgraph Custom["自定義"]
        C1[每 N 天/週/月]
    end
```

### 重複規則範例

```json
// 每天重複
{
  "frequency": "DAILY",
  "interval": 1,
  "startDate": "2026-01-01T09:00:00Z"
}

// 每週一三五
{
  "frequency": "WEEKLY",
  "interval": 1,
  "daysOfWeek": [1, 3, 5],
  "startDate": "2026-01-01T09:00:00Z"
}

// 每月 15 號
{
  "frequency": "MONTHLY",
  "interval": 1,
  "dayOfMonth": 15,
  "startDate": "2026-01-01T09:00:00Z"
}

// 每月最後一個週五
{
  "frequency": "MONTHLY",
  "interval": 1,
  "daysOfWeek": [5],
  "weekOfMonth": "LAST",
  "startDate": "2026-01-01T09:00:00Z"
}

// 每兩週
{
  "frequency": "WEEKLY",
  "interval": 2,
  "daysOfWeek": [1],
  "startDate": "2026-01-01T09:00:00Z"
}
```

## 處理流程

### 創建重複任務流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant API as API Server
    participant RS as RecurrenceService
    participant TS as TaskService
    participant DB as Database

    User->>API: POST /tasks<br/>(含 recurrence 設定)
    API->>TS: createTask(dto)
    TS->>DB: 創建任務
    TS->>RS: createRecurrenceRule(task, recurrence)
    RS->>RS: 計算 nextRunAt
    RS->>DB: 保存重複規則
    RS-->>TS: 返回規則 ID
    TS->>DB: 更新任務關聯
    TS-->>API: 返回任務
    API-->>User: 任務創建成功
```

### 自動產生任務流程

```mermaid
sequenceDiagram
    participant Cron as Scheduler
    participant RS as RecurrenceService
    participant Queue as Bull Queue
    participant RP as RecurrenceProcessor
    participant TS as TaskService
    participant DB as Database

    Cron->>RS: 每分鐘觸發 processDueRecurrences()
    RS->>DB: 查詢 nextRunAt <= now<br/>且 isActive = true
    DB-->>RS: 返回待處理規則

    loop 每個規則
        RS->>Queue: 加入處理佇列
    end

    Queue->>RP: 處理任務
    RP->>DB: 取得原始任務
    RP->>TS: 複製任務<br/>(新 dueDate)
    TS->>DB: 創建新任務實例
    RP->>RS: 更新規則狀態
    RS->>RS: 計算下次執行時間
    RS->>DB: 更新 nextRunAt, occurrenceCount

    alt 達到結束條件
        RS->>DB: 設定 isActive = false
    end
```

### 下次執行時間計算

```mermaid
flowchart TD
    A[開始計算] --> B{重複類型}

    B -->|DAILY| C[currentDate + interval days]
    B -->|WEEKLY| D[找下一個符合的週幾]
    B -->|MONTHLY| E{月份類型}

    E -->|dayOfMonth| F[下個月的指定日期]
    E -->|weekOfMonth| G[下個月的第N個週幾]

    C --> H{超過 endDate?}
    D --> H
    F --> H
    G --> H

    H -->|是| I[設定 isActive = false]
    H -->|否| J{達到 maxOccurrences?}

    J -->|是| I
    J -->|否| K[更新 nextRunAt]

    I --> L[結束]
    K --> L
```

## NestJS 實作架構

### Module 結構

```mermaid
graph TB
    subgraph RecurrenceModule
        RC[RecurrenceController]
        RS[RecurrenceService]
        RR[RecurrenceRuleRepository]
    end

    subgraph TaskModule
        TC[TaskController]
        TS[TaskService]
    end

    subgraph SchedulerModule
        SS[SchedulerService]
    end

    subgraph QueueModule
        RP[RecurrenceProcessor]
        RQ[RecurrenceQueue]
    end

    RC --> RS
    TC --> TS
    TS --> RS
    SS --> RS
    RS --> RR
    RS --> RQ
    RQ --> RP
    RP --> TS
```

### 核心程式碼結構

```typescript
// recurrence-rule.entity.ts
@Entity()
export class RecurrenceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Task)
  @JoinColumn()
  task: Task;

  @Column()
  taskId: string;

  @Column({ type: 'enum', enum: RecurrenceFrequency })
  frequency: RecurrenceFrequency;

  @Column({ default: 1 })
  interval: number;

  @Column({ type: 'json', nullable: true })
  daysOfWeek: number[];

  @Column({ nullable: true })
  dayOfMonth: number;

  @Column({ type: 'enum', enum: WeekOfMonth, nullable: true })
  weekOfMonth: WeekOfMonth;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  maxOccurrences: number;

  @Column({ default: 0 })
  occurrenceCount: number;

  @Column()
  nextRunAt: Date;

  @Column({ nullable: true })
  lastRunAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// recurrence.service.ts
@Injectable()
export class RecurrenceService {
  constructor(
    private recurrenceRepo: Repository<RecurrenceRule>,
    private taskService: TaskService,
    @InjectQueue('recurrence') private recurrenceQueue: Queue,
  ) {}

  async createRecurrenceRule(
    task: Task,
    dto: CreateRecurrenceDto,
  ): Promise<RecurrenceRule> {
    const nextRunAt = this.calculateNextRun(dto);

    return this.recurrenceRepo.save({
      taskId: task.id,
      ...dto,
      nextRunAt,
    });
  }

  async processDueRecurrences(): Promise<void> {
    const now = new Date();
    const rules = await this.recurrenceRepo.find({
      where: {
        isActive: true,
        nextRunAt: LessThanOrEqual(now),
      },
      relations: ['task'],
    });

    for (const rule of rules) {
      await this.recurrenceQueue.add('generate', { ruleId: rule.id });
    }
  }

  calculateNextRun(rule: RecurrenceRule | CreateRecurrenceDto): Date {
    const baseDate = rule.lastRunAt || rule.startDate;
    let nextDate: Date;

    switch (rule.frequency) {
      case RecurrenceFrequency.DAILY:
        nextDate = addDays(baseDate, rule.interval);
        break;

      case RecurrenceFrequency.WEEKLY:
        nextDate = this.calculateNextWeekly(baseDate, rule);
        break;

      case RecurrenceFrequency.MONTHLY:
        nextDate = this.calculateNextMonthly(baseDate, rule);
        break;

      default:
        nextDate = addDays(baseDate, rule.interval);
    }

    return nextDate;
  }

  private calculateNextWeekly(base: Date, rule: RecurrenceRule): Date {
    const daysOfWeek = rule.daysOfWeek || [getDay(base)];
    let current = addDays(base, 1);

    while (true) {
      if (daysOfWeek.includes(getDay(current))) {
        return current;
      }
      current = addDays(current, 1);

      // 跳過 interval 週
      if (getDay(current) === daysOfWeek[0]) {
        current = addWeeks(current, rule.interval - 1);
      }
    }
  }

  private calculateNextMonthly(base: Date, rule: RecurrenceRule): Date {
    if (rule.dayOfMonth) {
      return setDate(addMonths(base, rule.interval), rule.dayOfMonth);
    }

    if (rule.weekOfMonth && rule.daysOfWeek?.length) {
      return this.getNthWeekdayOfMonth(
        addMonths(base, rule.interval),
        rule.weekOfMonth,
        rule.daysOfWeek[0],
      );
    }

    return addMonths(base, rule.interval);
  }
}

// recurrence.processor.ts
@Processor('recurrence')
export class RecurrenceProcessor {
  constructor(
    private recurrenceService: RecurrenceService,
    private taskService: TaskService,
  ) {}

  @Process('generate')
  async handleGenerate(job: Job<{ ruleId: string }>): Promise<void> {
    const rule = await this.recurrenceService.findById(job.data.ruleId);
    if (!rule || !rule.isActive) return;

    // 複製原始任務
    const sourceTask = rule.task;
    const newDueDate = this.calculateNewDueDate(sourceTask, rule);

    await this.taskService.create({
      ...sourceTask,
      id: undefined,
      sourceTaskId: sourceTask.id,
      dueDate: newDueDate,
      status: TaskStatus.PENDING,
      isCompleted: false,
    });

    // 更新規則
    await this.recurrenceService.updateAfterGeneration(rule);
  }
}

// scheduler.service.ts
@Injectable()
export class SchedulerService {
  constructor(private recurrenceService: RecurrenceService) {}

  @Cron('* * * * *') // 每分鐘
  async handleRecurrences(): Promise<void> {
    await this.recurrenceService.processDueRecurrences();
  }
}
```

## API 端點設計

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | 創建任務（含 recurrence） |
| GET | `/api/tasks/:id/recurrence` | 取得任務重複規則 |
| PATCH | `/api/tasks/:id/recurrence` | 更新重複規則 |
| DELETE | `/api/tasks/:id/recurrence` | 刪除重複規則 |
| POST | `/api/tasks/:id/recurrence/skip` | 跳過下一次 |
| POST | `/api/tasks/:id/recurrence/pause` | 暫停重複 |
| POST | `/api/tasks/:id/recurrence/resume` | 恢復重複 |

### 創建重複任務 Request

```json
POST /api/tasks
{
  "title": "Weekly Team Meeting",
  "description": "Sprint planning meeting",
  "dueDate": "2026-01-06T10:00:00Z",
  "recurrence": {
    "frequency": "WEEKLY",
    "interval": 1,
    "daysOfWeek": [1],
    "startDate": "2026-01-06T10:00:00Z",
    "endDate": "2026-12-31T10:00:00Z"
  }
}
```

## 狀態機

```mermaid
stateDiagram-v2
    [*] --> Active: 創建規則

    Active --> Paused: pause()
    Paused --> Active: resume()

    Active --> Completed: 達到結束條件
    Active --> Deleted: delete()
    Paused --> Deleted: delete()

    Completed --> [*]
    Deleted --> [*]

    state Active {
        [*] --> Waiting
        Waiting --> Processing: nextRunAt 到達
        Processing --> Waiting: 更新 nextRunAt
    }
```

## 邊界情況處理

### 月份日期不存在

```mermaid
flowchart TD
    A[設定每月 31 號] --> B{目標月份有 31 號?}
    B -->|是| C[使用 31 號]
    B -->|否| D[使用該月最後一天]

    E[例: 2 月] --> F[使用 2/28 或 2/29]
    G[例: 4 月] --> H[使用 4/30]
```

### 任務編輯影響

| 操作 | 對重複規則的影響 |
|------|------------------|
| 編輯原始任務 | 更新模板，影響未來生成 |
| 編輯生成的任務 | 只影響該任務，不影響規則 |
| 刪除原始任務 | 刪除規則，不影響已生成任務 |
| 刪除生成的任務 | 不影響規則 |

## 技術選型

| 元件 | 技術選擇 | 說明 |
|------|---------|------|
| 排程 | `@nestjs/schedule` | Cron 定時任務 |
| 佇列 | `@nestjs/bull` + Redis | 可靠任務處理 |
| 日期處理 | `date-fns` | 日期計算庫 |
| 規則解析 | `rrule` (可選) | iCal RRULE 標準 |

## 效能考量

1. **索引優化**: `(next_run_at, is_active)` 複合索引
2. **批次處理**: 使用 Bull Queue 避免阻塞
3. **限制查詢**: 每次只處理當前時間點的規則
4. **快取策略**: 快取規則的下次執行時間計算結果
5. **歷史清理**: 定期清理已結束的規則
