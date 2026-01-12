# Gap Analysis: 題目規範 vs 現有實作

> 建立日期: 2026-01-12
> 目的: 追蹤並補齊題目要求與現有實作的差異

---

## 1. 題目原始需求

來源: `docs/README_v2_zh.md`

```
實作一個TodoList, 可參考Lark的任務功能。
- 需要實現以下功能
   - 註冊／登入
   - 可以多人分享任務的團隊
   - 任務增刪改查
     - 任務建立後可指派執行人及關注人
     - 登入的使用者需要可以看見自己的任務、被指派給自己執行的任務、自己有在關注的任務
     - 任務的子任務，子任務與任務結構相同，子任務完成後自動完成主任務
   - 顯示任務歷史紀錄
     - 可以新增評論在歷史紀錄中
   - 內容篩選（時段、創作人、任務人）
   - 支援排序（建立時間、計劃完成時間、創建者、ID）
- 以下功能使用文字敘述規劃schema架構、流程即可
   - 實現訊息提醒任務即將到期
   - 定時重複任務
- 部署採用dockerfile
- 需要實現API文件
```

---

## 2. 差異分析總覽

| # | 需求項目 | 後端狀態 | 前端狀態 | 需補齊 |
|---|---------|---------|---------|--------|
| 1 | 註冊／登入 | ✅ 完成 | ✅ 完成 | - |
| 2 | 團隊分享任務 | ✅ 完成 | ✅ 完成 | - |
| 3 | 任務 CRUD | ✅ 完成 | ✅ 完成 | - |
| 4 | 指派執行人/關注人 | ✅ 完成 | ✅ 完成 | - |
| 5 | 任務視圖切換 | ✅ 完成 | ✅ 完成 | - |
| 6 | 子任務自動完成主任務 | ✅ 完成 | ✅ 完成 | - |
| 7 | 任務歷史紀錄 | ✅ 完成 | ✅ 完成 | - |
| 8 | 評論功能 | ✅ 完成 | ✅ 完成 | - |
| 9 | 篩選：時段 | ✅ 完成 | ✅ 完成 | - |
| 10 | 篩選：創作人 | ✅ 完成 | ✅ 完成 | - |
| 11 | 篩選：任務人(執行人) | ✅ 完成 | ✅ 完成 | - |
| 12 | 排序：建立時間 | ✅ 完成 | ✅ 完成 | - |
| 13 | 排序：計劃完成時間 | ✅ 完成 | ✅ 完成 | - |
| 14 | 排序：創建者 | ✅ 完成 | ✅ 完成 | - |
| 15 | 排序：ID | ✅ 完成 | ✅ 完成 | - |
| 16 | 訊息提醒 Schema 設計 | ✅ 文件中 | N/A | - |
| 17 | 定時重複任務 Schema 設計 | ✅ 文件中 | N/A | - |
| 18 | Dockerfile 部署 | ✅ 完成 | ✅ 完成 | - |
| 19 | API 文件 (Swagger) | ✅ 完成 | N/A | - |

---

## 3. 待補齊項目清單

### 3.1 前端：任務視圖切換 (Task Views)

**現狀**: 後端已支援 `view` 參數，但前端 Sidebar 未實作視圖切換

**需求**: 使用者需要可以看見：
- 自己的任務 (`my_tasks`)
- 被指派給自己執行的任務 (`assigned`)
- 自己有在關注的任務 (`following`)

**實作計畫**:
- [ ] 在 Sidebar 加入任務視圖選項
- [ ] 連接 API 的 `view` 參數
- [ ] 顯示各視圖的任務數量 badge

**檔案變更**:
- `frontend/src/app/tasks/page.tsx`
- `frontend/src/stores/ui-store.ts` (已有 currentView)

---

### 3.2 前端：時段篩選 (Date Range Filter)

**現狀**: 後端已支援 `startDate` / `endDate`，前端未實作 UI

**需求**: 可以依時段篩選任務（截止日期範圍）

**實作計畫**:
- [ ] 新增 Date Range Picker 組件或使用原生 date input
- [ ] 整合到 TaskFilters 組件
- [ ] 傳遞 `startDate` / `endDate` 給 API

**檔案變更**:
- `frontend/src/components/tasks/task-filters.tsx`
- `frontend/src/app/tasks/page.tsx`

---

### 3.3 前端：創建者篩選 (Creator Filter)

**現狀**: 後端已支援 `creatorId`，前端未實作 UI

**需求**: 可以依創建者篩選任務

**實作計畫**:
- [ ] 新增 Creator Select 下拉選單
- [ ] 取得團隊成員列表作為選項
- [ ] 傳遞 `creatorId` 給 API

**檔案變更**:
- `frontend/src/components/tasks/task-filters.tsx`
- `frontend/src/app/tasks/page.tsx`

---

### 3.4 前端：執行人篩選 (Assignee Filter)

**現狀**: 後端已支援 `assigneeId`，前端未實作 UI

**需求**: 可以依執行人（任務人）篩選任務

**實作計畫**:
- [ ] 新增 Assignee Select 下拉選單
- [ ] 取得團隊成員列表作為選項
- [ ] 傳遞 `assigneeId` 給 API

**檔案變更**:
- `frontend/src/components/tasks/task-filters.tsx`
- `frontend/src/app/tasks/page.tsx`

---

### 3.5 後端 + 前端：創建者排序 (Sort by Creator)

**現狀**: 後端 `sortBy` 只支援 `createdAt`, `dueDate`, `id`

**需求**: 支援依創建者排序

**實作計畫**:
- [ ] 後端：在 `task-filter.dto.ts` 加入 `creator` 排序選項
- [ ] 後端：在 `task.service.ts` 實作 creator 排序邏輯 (JOIN creator table)
- [ ] 前端：在排序選項加入「創建者」

**檔案變更**:
- `backend/src/modules/task/dto/task-filter.dto.ts`
- `backend/src/modules/task/task.service.ts`
- `frontend/src/components/tasks/task-filters.tsx`

---

### 3.6 前端：ID 排序選項

**現狀**: 後端已支援 `sortBy=id`，前端 UI 未提供此選項

**需求**: 支援依任務 ID 排序

**實作計畫**:
- [ ] 在前端排序下拉選單加入「任務 ID」選項

**檔案變更**:
- `frontend/src/components/tasks/task-filters.tsx`

---

## 4. 實作優先順序

根據題目明確要求，建議實作順序：

| 優先級 | 項目 | 預估複雜度 | 依賴 |
|--------|------|-----------|------|
| P0 | 3.1 任務視圖切換 | 中 | 無 |
| P0 | 3.2 時段篩選 | 低 | 無 |
| P0 | 3.3 創建者篩選 | 低 | 需取得成員列表 |
| P0 | 3.4 執行人篩選 | 低 | 需取得成員列表 |
| P0 | 3.5 創建者排序 | 中 | 後端先行 |
| P1 | 3.6 ID 排序選項 | 低 | 無 |

**建議實作流程**:

```
Phase 1: 後端補齊
├── 3.5 後端：加入 creator 排序支援

Phase 2: 前端篩選功能
├── 3.2 時段篩選 UI
├── 3.3 創建者篩選 UI
├── 3.4 執行人篩選 UI
└── (共用團隊成員列表)

Phase 3: 前端視圖與排序
├── 3.1 任務視圖切換
├── 3.5 前端：創建者排序選項
└── 3.6 ID 排序選項
```

---

## 5. 驗收標準

### 5.1 任務視圖切換
- [ ] Sidebar 顯示「我的任務」「我負責的」「我關注的」選項
- [ ] 點擊後正確切換視圖並重新載入任務
- [ ] 當前選中視圖有高亮顯示

### 5.2 篩選功能
- [ ] 可選擇截止日期範圍（起始日期、結束日期）
- [ ] 可選擇創建者（從團隊成員列表）
- [ ] 可選擇執行人（從團隊成員列表）
- [ ] 篩選條件可以組合使用
- [ ] 有清除篩選的按鈕

### 5.3 排序功能
- [ ] 排序選項包含：建立時間、計劃完成時間、創建者、ID
- [ ] 可切換升序/降序
- [ ] 排序結果正確

---

## 6. Checklist 追蹤

### Phase 1: 後端補齊 ✅ 完成
- [x] `task-filter.dto.ts`: 加入 `creator` 到 sortBy enum
- [x] `task.service.ts`: 實作 creator 排序邏輯

### Phase 2: 前端篩選功能 ✅ 完成
- [x] `task-filters.tsx`: 新增 Date Range 輸入 (startDate, endDate)
- [x] `task-filters.tsx`: 新增 Creator Select
- [x] `task-filters.tsx`: 新增 Assignee Select
- [x] `tasks/page.tsx`: 整合新篩選參數到 API 呼叫
- [x] `use-teams.ts`: 使用 useTeamMembers hook 取得團隊成員列表

### Phase 3: 前端視圖與排序 ✅ 完成
- [x] `tasks/page.tsx`: Sidebar 加入視圖切換 UI (All, My Tasks, Assigned, Following, Completed)
- [x] `tasks/page.tsx`: 連接 view 參數到 API
- [x] `task-filters.tsx`: 排序選項加入「Creator」
- [x] `task-filters.tsx`: 排序選項加入「Task ID」

### 驗證 ✅ 完成
- [x] 手動測試所有篩選組合
- [x] 手動測試所有排序選項
- [x] 手動測試視圖切換
- [x] 確認 API 參數正確傳遞
- [x] Docker 部署測試通過

---

## 7. 備註

- 後端 API 已支援大部分篩選/排序功能，主要缺口在前端 UI
- 團隊成員列表可透過 `GET /teams/:id/members` 取得
- 建議在 TaskFilters 組件中統一管理所有篩選狀態
- 考慮使用 URL query params 保存篩選狀態，方便分享連結
