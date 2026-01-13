# 程式碼優化規劃

> **原則**：維持穩定、避免過度設計、提升專業度與可維護性

---

## 審查摘要

| 類別 | 發現數量 | 優先級 |
|------|---------|--------|
| 程式碼重複 | 6 項 | 高 |
| 關注點分離不足 | 4 項 | 高 |
| 型別安全問題 | 8+ 項 | 中 |
| 效能問題 | 5 項 | 中 |
| 錯誤處理缺口 | 6 項 | 中 |

---

## Phase 1: 高優先級優化（建議先執行）

| 項目 | 狀態 |
|------|------|
| 1.1 抽取權限檢查邏輯 | ✅ 已完成 |
| 1.2 解決 N+1 查詢問題 | ✅ 已完成 |
| 1.3 抽取任務頁面邏輯到 Hook | ✅ 已完成 |
| 1.4 統一 Token 管理 | ✅ 已完成 |

---

### 1.1 Backend - 抽取權限檢查邏輯

**問題**：權限檢查邏輯散落在 `task.service.ts` 多處，難以維護

**現況** (`backend/src/modules/task/task.service.ts`):
```typescript
// 重複出現於 lines 240-243, 323-325, 405-407, 427-429
const canEdit = await this.canEditTask(task, userId);
if (!canEdit) {
  throw new ForbiddenException(TASK_ERRORS.ACCESS_DENIED);
}
```

**優化方案**：建立 `TaskAuthorizationHelper` 統一處理

```typescript
// backend/src/modules/task/helpers/task-authorization.helper.ts
@Injectable()
export class TaskAuthorizationHelper {
  constructor(private readonly teamService: TeamService) {}

  async canView(task: Task, userId: string): Promise<boolean> { ... }
  async canEdit(task: Task, userId: string): Promise<boolean> { ... }
  async canDelete(task: Task, userId: string): Promise<boolean> { ... }

  // 拋出異常版本，用於 guard
  async assertCanEdit(task: Task, userId: string): Promise<void> {
    if (!(await this.canEdit(task, userId))) {
      throw new ForbiddenException(TASK_ERRORS.ACCESS_DENIED);
    }
  }
}
```

**影響範圍**：`task.service.ts`
**風險**：低 - 純邏輯抽取，不改變行為

---

### 1.2 Backend - 解決 N+1 查詢問題

**問題**：查詢任務清單時，每筆任務都執行一次子任務查詢

**現況** (`backend/src/modules/task/task.service.ts:104-112`):
```typescript
for (const task of items) {
  const subtasks = await this.taskRepository.find({
    where: { parentTaskId: task.id, isDeleted: false },
  });
  (task as any).subtasksCount = subtasks.length;
}
```

**優化方案**：使用 SQL 子查詢或 GROUP BY

```typescript
// 方案 A: 單一聚合查詢
const subtaskCounts = await this.taskRepository
  .createQueryBuilder('subtask')
  .select('subtask.parentTaskId', 'parentTaskId')
  .addSelect('COUNT(*)', 'count')
  .where('subtask.parentTaskId IN (:...ids)', { ids: items.map(t => t.id) })
  .andWhere('subtask.isDeleted = false')
  .groupBy('subtask.parentTaskId')
  .getRawMany();

// 合併到結果
const countMap = new Map(subtaskCounts.map(c => [c.parentTaskId, +c.count]));
items.forEach(task => {
  task.subtasksCount = countMap.get(task.id) || 0;
});
```

**影響範圍**：`task.service.ts` findAll 方法
**風險**：低 - 只改善查詢效率

---

### 1.3 Frontend - 抽取任務頁面邏輯到 Custom Hook

**問題**：`tasks/page.tsx` 有 21 個 useState，544 行程式碼，關注點混雜

**現況** (`frontend/src/app/tasks/page.tsx:21-45`):
```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [showCreateModal, setShowCreateModal] = useState(false);
// ... 還有 17 個 useState
```

**優化方案**：建立 `useTasksPage` hook

```typescript
// frontend/src/hooks/use-tasks-page.ts
interface TasksPageState {
  tasks: Task[];
  loading: boolean;
  error: string;
  filters: TaskFilters;
  modals: {
    create: boolean;
    filter: boolean;
  };
}

export function useTasksPage() {
  // 使用 useReducer 管理複雜狀態
  const [state, dispatch] = useReducer(tasksPageReducer, initialState);

  // API 邏輯
  const { data, isLoading } = useTasks(state.filters);

  // 事件處理
  const handleCreateTask = useCallback(...);
  const handleFilterChange = useCallback(...);

  return {
    ...state,
    tasks: data,
    isLoading,
    actions: { handleCreateTask, handleFilterChange, ... }
  };
}
```

**影響範圍**：`tasks/page.tsx`
**風險**：中 - 需要測試所有任務頁面功能

---

### 1.4 Frontend - 統一 Token 管理

**問題**：Token 儲存邏輯分散在三處，可能造成同步問題

**現況**：
- `auth-store.ts:40-46` - setToken 方法
- `auth-store.ts:64-66` - login 後儲存
- `lib/api/client.ts:96-98` - refresh 後儲存

**優化方案**：建立 `TokenService`

```typescript
// frontend/src/lib/services/token-service.ts
class TokenService {
  private static ACCESS_KEY = 'accessToken';
  private static REFRESH_KEY = 'refreshToken';

  static getAccessToken(): string | null {
    return typeof window !== 'undefined'
      ? localStorage.getItem(this.ACCESS_KEY)
      : null;
  }

  static setTokens(access: string, refresh: string): void {
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.REFRESH_KEY, refresh);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  static hasValidToken(): boolean {
    return !!this.getAccessToken();
  }
}

export { TokenService };
```

**影響範圍**：`auth-store.ts`, `lib/api/client.ts`
**風險**：中 - 需要測試登入、登出、token refresh 流程

---

## Phase 2: 中優先級優化

| 項目 | 狀態 |
|------|------|
| 2.1 Event Emitter 處理歷史記錄 | ✅ 已完成 |
| 2.2 Mutation Hook Factory | ✅ 已完成 |
| 2.3 加強 DTO 驗證 | ✅ 已完成 |
| 2.4 移除 any 型別 | ✅ 已完成 |

---

### 2.1 Backend - 使用 Decorator 處理歷史記錄

**問題**：歷史記錄邏輯與業務邏輯混雜

**現況** (`task.service.ts` 多處):
```typescript
await this.historyService.create({
  taskId: task.id,
  userId,
  actionType: 'assignee_added',
  description: `Added ${user.name || user.email} as assignee`,
});
```

**優化方案**：使用 NestJS Event Emitter

```typescript
// backend/src/modules/task/events/task.events.ts
export class TaskAssigneeAddedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly assigneeId: string,
  ) {}
}

// backend/src/modules/history/history.listener.ts
@Injectable()
export class HistoryListener {
  @OnEvent('task.assignee.added')
  async handleAssigneeAdded(event: TaskAssigneeAddedEvent) {
    await this.historyService.create({...});
  }
}

// task.service.ts 中只需
this.eventEmitter.emit('task.assignee.added', new TaskAssigneeAddedEvent(...));
```

**影響範圍**：`task.service.ts`, 新增 `history.listener.ts`
**風險**：中 - 需要整合測試確保事件正確觸發

---

### 2.2 Frontend - 建立 Mutation Hook Factory

**問題**：CRUD mutation hooks 結構重複

**現況** (`frontend/src/hooks/use-tasks.ts:50-94`):
```typescript
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => tasksApi.createTask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.updateTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
// ... 重複模式
```

**優化方案**：建立工廠函數

```typescript
// frontend/src/lib/hooks/create-mutation.ts
export function createMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys: string[],
  options?: { onSuccessMessage?: string }
) {
  return function useMutation() {
    const queryClient = useQueryClient();

    return useTanstackMutation({
      mutationFn,
      onSuccess: () => {
        invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        if (options?.onSuccessMessage) {
          toast.success(options.onSuccessMessage);
        }
      },
    });
  };
}

// 使用
export const useCreateTask = createMutation(
  tasksApi.createTask,
  ['tasks'],
  { onSuccessMessage: 'Task created' }
);
```

**影響範圍**：`use-tasks.ts`, `use-teams.ts`
**風險**：低 - 純重構，不改變行為

---

### 2.3 Backend - 加強 DTO 驗證

**問題**：部分欄位缺少驗證規則

**需加強項目**：

```typescript
// backend/src/modules/task/dto/create-task.dto.ts
@IsString()
@MinLength(1, { message: 'Title cannot be empty' })  // 新增
@MaxLength(255)
title: string;

@IsString()
@IsOptional()
@MaxLength(2000)  // 新增：限制描述長度
description?: string;

// backend/src/modules/task/dto/task-filter.dto.ts
@IsEnum(['dueDate', 'createdAt', 'completedAt', 'updatedAt'])  // 確保型別安全
dateField?: 'dueDate' | 'createdAt' | 'completedAt' | 'updatedAt';
```

**影響範圍**：DTO 檔案
**風險**：低

---

### 2.4 移除 `any` 型別轉換

**問題**：使用 `any` 破壞型別安全

**位置與修復**：

```typescript
// backend/src/modules/task/task.service.ts:108
// 修改前
(task as any).subtasksCount = subtasks.length;

// 修改後 - 定義擴展型別
interface TaskWithCount extends Task {
  subtasksCount: number;
}

// backend/src/modules/task/task.service.ts:200
// 修改前
const savedTask = await this.taskRepository.save(task) as Task;

// 修改後 - 使用泛型
const savedTask = await this.taskRepository.save<Task>(task);
```

**影響範圍**：`task.service.ts`
**風險**：低

---

## Phase 3: 低優先級優化（可選）

| 項目 | 狀態 |
|------|------|
| 3.1 拆分大型頁面組件 | ✅ 已完成 |
| 3.2 新增資料庫索引 | ✅ 已完成 |
| 3.3 統一錯誤處理 Helper | ✅ 已完成 |

---

### 3.1 拆分大型頁面組件

將 `tasks/[id]/page.tsx` (688 行) 拆分為：
- `TaskHeader` - 標題、狀態、操作按鈕
- `TaskDetails` - 描述、時間、分配人員
- `TaskTabs` - 子任務、評論、歷史分頁
- `TaskEditForm` - 編輯表單

### 3.2 新增資料庫索引

```sql
-- 建議加入的索引
CREATE INDEX idx_task_is_deleted ON task(is_deleted);
CREATE INDEX idx_task_parent_id ON task(parent_task_id);
CREATE INDEX idx_task_team_id ON task(team_id);
CREATE INDEX idx_task_created_at ON task(created_at);
```

### 3.3 統一錯誤處理 Helper

```typescript
// frontend/src/lib/utils/error.ts
export function handleApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
```

---

## 實作順序建議

```
Week 1: Phase 1（高優先級）
├── 1.1 抽取權限檢查邏輯
├── 1.2 解決 N+1 查詢問題
├── 1.3 抽取任務頁面邏輯
└── 1.4 統一 Token 管理

Week 2: Phase 2（中優先級）
├── 2.1 Event Emitter 處理歷史記錄
├── 2.2 Mutation Hook Factory
├── 2.3 加強 DTO 驗證
└── 2.4 移除 any 型別

Week 3: Phase 3（低優先級，視時間）
├── 3.1 拆分大型頁面組件
├── 3.2 新增資料庫索引
└── 3.3 統一錯誤處理
```

---

## 不建議執行的優化

以下優化雖然有其價值，但會增加複雜度，不符合「避免過度設計」原則：

1. **引入 GraphQL** - 現有 REST API 已滿足需求
2. **微服務架構** - 目前規模不需要
3. **CQRS 模式** - 查詢/命令分離對此專案過於複雜
4. **完整的 Domain-Driven Design** - 增加學習成本
5. **Redux 替代 Zustand** - Zustand 已滿足狀態管理需求

---

## 驗證清單

每項優化完成後應確認：

- [ ] 所有現有功能正常運作
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 手動測試關鍵流程（登入、建立任務、編輯任務、刪除任務）
- [ ] API 回應格式不變（避免破壞前端）

---

*文件建立日期：2026-01-13*
*審查版本：v1.0*
