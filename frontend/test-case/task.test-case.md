# Task Module Test Cases

## Task Creation Tests

### TC-TASK-001: Create Task Successfully

**Priority:** High
**Preconditions:** User is logged in and member of a team

**Test Steps:**
1. Navigate to tasks page
2. Click "Create Task" button
3. Enter title: "Complete documentation"
4. Select team: "Project Alpha"
5. Set priority: "High"
6. Set due date: Tomorrow
7. Click "Create"

**Expected Results:**
- Task is created successfully
- Success message displayed
- Task appears in task list
- Task has correct status (pending)

---

### TC-TASK-002: Create Personal Task (No Team)

**Priority:** Medium
**Preconditions:** Personal tasks are supported

**Test Steps:**
1. Click "Create Task"
2. Enter title: "Personal todo"
3. Leave team unselected
4. Click "Create"

**Expected Results:**
- Personal task is created
- Task appears in "My Tasks" view
- No team association

---

### TC-TASK-003: Create Task Without Title

**Priority:** High
**Preconditions:** User is on task creation form

**Test Steps:**
1. Leave title empty
2. Fill other fields
3. Click "Create"

**Expected Results:**
- Validation error: "Title is required"
- Form not submitted

---

### TC-TASK-004: Create Task with All Fields

**Priority:** Medium
**Preconditions:** User is on task creation form

**Test Steps:**
1. Enter title: "Full featured task"
2. Enter description: "Detailed description here"
3. Select team
4. Set priority: Urgent
5. Set due date: specific date
6. Add assignees
7. Add followers
8. Click "Create"

**Expected Results:**
- Task created with all fields populated
- All assignees notified
- All followers added

---

### TC-TASK-005: Create Subtask

**Priority:** High
**Preconditions:** Parent task exists

**Test Steps:**
1. Navigate to parent task
2. Click "Add Subtask"
3. Enter subtask title
4. Click "Create"

**Expected Results:**
- Subtask is created
- Subtask linked to parent
- Subtask appears under parent
- Parent shows subtask count

---

## Task List/View Tests

### TC-TASK-010: View All Tasks

**Priority:** High
**Preconditions:** User has tasks

**Test Steps:**
1. Navigate to tasks page
2. Select "All Tasks" view

**Expected Results:**
- All accessible tasks displayed
- Tasks show title, status, priority
- Tasks are sortable

---

### TC-TASK-011: View My Tasks

**Priority:** High
**Preconditions:** User has created or assigned tasks

**Test Steps:**
1. Navigate to tasks page
2. Select "My Tasks" view

**Expected Results:**
- Only tasks created by user shown
- Or tasks where user is assignee (depends on implementation)

---

### TC-TASK-012: View Assigned Tasks

**Priority:** High
**Preconditions:** User is assigned to tasks

**Test Steps:**
1. Select "Assigned to Me" view

**Expected Results:**
- Only tasks where user is assignee shown
- Completed assignee status visible

---

### TC-TASK-013: View Following Tasks

**Priority:** Medium
**Preconditions:** User is following some tasks

**Test Steps:**
1. Select "Following" view

**Expected Results:**
- Only tasks user is following shown

---

### TC-TASK-014: View Completed Tasks

**Priority:** Medium
**Preconditions:** Some tasks are completed

**Test Steps:**
1. Select "Completed" view

**Expected Results:**
- Only completed tasks shown
- Completion date visible

---

### TC-TASK-015: Empty Task List

**Priority:** Low
**Preconditions:** No tasks exist

**Test Steps:**
1. Navigate to tasks page

**Expected Results:**
- Empty state message
- "Create Task" call to action

---

## Task Detail View Tests

### TC-TASK-020: View Task Details

**Priority:** High
**Preconditions:** Task exists

**Test Steps:**
1. Click on a task in the list

**Expected Results:**
- Task detail view opens
- All fields displayed (title, description, status, priority, due date)
- Creator info shown
- Assignees and followers listed
- Subtasks visible
- Comments section visible
- History available

---

### TC-TASK-021: View Subtasks in Detail

**Priority:** Medium
**Preconditions:** Task has subtasks

**Test Steps:**
1. Open task with subtasks

**Expected Results:**
- Subtasks listed with status
- Subtask count shown
- Can navigate to subtask detail

---

## Task Update Tests

### TC-TASK-030: Update Task Title

**Priority:** High
**Preconditions:** User can edit the task

**Test Steps:**
1. Open task detail
2. Click edit or inline edit title
3. Change title to "Updated Title"
4. Save

**Expected Results:**
- Title is updated
- History entry created
- Success message shown

---

### TC-TASK-031: Update Task Description

**Priority:** Medium
**Preconditions:** User can edit the task

**Test Steps:**
1. Open task detail
2. Edit description
3. Save

**Expected Results:**
- Description updated
- History entry created

---

### TC-TASK-032: Update Task Priority

**Priority:** Medium
**Preconditions:** User can edit the task

**Test Steps:**
1. Open task detail
2. Change priority from Medium to High
3. Save

**Expected Results:**
- Priority updated
- Visual indicator changes
- History entry created

---

### TC-TASK-033: Update Task Due Date

**Priority:** Medium
**Preconditions:** User can edit the task

**Test Steps:**
1. Open task detail
2. Set or change due date
3. Save

**Expected Results:**
- Due date updated
- History entry created

---

### TC-TASK-034: Remove Task Due Date

**Priority:** Low
**Preconditions:** Task has a due date

**Test Steps:**
1. Open task detail
2. Clear due date
3. Save

**Expected Results:**
- Due date is removed
- No due date displayed

---

## Task Status Tests

### TC-TASK-040: Complete Task

**Priority:** High
**Preconditions:** Task is in pending/in-progress status

**Test Steps:**
1. Open task detail or task list
2. Click "Complete" or checkmark
3. Confirm if needed

**Expected Results:**
- Task status changes to "Completed"
- CompletedAt timestamp set
- Visual indicator (strikethrough, color change)
- History entry created

---

### TC-TASK-041: Reopen Completed Task

**Priority:** Medium
**Preconditions:** Task is completed

**Test Steps:**
1. Open completed task
2. Click "Reopen" or uncheck

**Expected Results:**
- Task status returns to pending
- CompletedAt cleared
- History entry created

---

### TC-TASK-042: Complete Task with Subtasks

**Priority:** Medium
**Preconditions:** Task has incomplete subtasks

**Test Steps:**
1. Open parent task
2. Complete the parent task

**Expected Results:**
- Option to complete subtasks too, OR
- Warning about incomplete subtasks, OR
- Auto-complete subtasks

---

### TC-TASK-043: Change Status to In Progress

**Priority:** Low
**Preconditions:** Task is pending

**Test Steps:**
1. Change task status to "In Progress"

**Expected Results:**
- Status updated
- History entry created

---

## Assignee Tests

### TC-TASK-050: Add Assignee to Task

**Priority:** High
**Preconditions:** User can edit task

**Test Steps:**
1. Open task detail
2. Click "Add Assignee"
3. Search and select a team member
4. Confirm

**Expected Results:**
- User added as assignee
- Assignee appears in list
- History entry created
- Notification sent to assignee (if implemented)

---

### TC-TASK-051: Remove Assignee from Task

**Priority:** Medium
**Preconditions:** Task has assignees

**Test Steps:**
1. Open task detail
2. Click remove on an assignee
3. Confirm

**Expected Results:**
- Assignee removed
- History entry created

---

### TC-TASK-052: Self-Assign to Task

**Priority:** Medium
**Preconditions:** User is team member

**Test Steps:**
1. Open task
2. Click "Assign to Me" or add self

**Expected Results:**
- Current user added as assignee

---

### TC-TASK-053: Mark Assignee as Complete

**Priority:** Medium
**Preconditions:** User is task assignee

**Test Steps:**
1. Open task where user is assignee
2. Mark own assignment as complete

**Expected Results:**
- Assignee marked as completed
- If all assignees complete, task may auto-complete

---

## Follower Tests

### TC-TASK-060: Add Follower to Task

**Priority:** Medium
**Preconditions:** User can edit task

**Test Steps:**
1. Open task detail
2. Click "Add Follower"
3. Select a user
4. Confirm

**Expected Results:**
- User added as follower
- Follower appears in list
- History entry created

---

### TC-TASK-061: Remove Follower from Task

**Priority:** Medium
**Preconditions:** Task has followers

**Test Steps:**
1. Open task detail
2. Remove a follower
3. Confirm

**Expected Results:**
- Follower removed
- History entry created

---

### TC-TASK-062: Follow Task (Self)

**Priority:** Medium
**Preconditions:** User is not following the task

**Test Steps:**
1. Open task
2. Click "Follow" button

**Expected Results:**
- User added as follower
- Button changes to "Unfollow"

---

### TC-TASK-063: Unfollow Task

**Priority:** Medium
**Preconditions:** User is following the task

**Test Steps:**
1. Open task
2. Click "Unfollow"

**Expected Results:**
- User removed from followers
- Button changes to "Follow"

---

## Task Deletion Tests

### TC-TASK-070: Delete Task

**Priority:** High
**Preconditions:** User has permission to delete

**Test Steps:**
1. Open task
2. Click "Delete"
3. Confirm deletion

**Expected Results:**
- Task is deleted (or soft-deleted)
- Task removed from list
- Subtasks handled appropriately

---

### TC-TASK-071: Delete Task with Subtasks

**Priority:** Medium
**Preconditions:** Task has subtasks

**Test Steps:**
1. Attempt to delete parent task

**Expected Results:**
- Warning about subtasks, OR
- Subtasks also deleted

---

### TC-TASK-072: Delete Subtask

**Priority:** Medium
**Preconditions:** Subtask exists

**Test Steps:**
1. Delete a subtask

**Expected Results:**
- Subtask removed
- Parent task subtask count updated

---

## Task Filter/Sort Tests

### TC-TASK-080: Filter Tasks by Status

**Priority:** Medium
**Preconditions:** Tasks with different statuses exist

**Test Steps:**
1. Navigate to tasks
2. Apply filter: Status = "Pending"

**Expected Results:**
- Only pending tasks shown
- Filter indicator visible

---

### TC-TASK-081: Filter Tasks by Team

**Priority:** Medium
**Preconditions:** Tasks from multiple teams exist

**Test Steps:**
1. Apply filter: Team = "Project Alpha"

**Expected Results:**
- Only tasks from selected team shown

---

### TC-TASK-082: Filter Tasks by Date Range

**Priority:** Low
**Preconditions:** Tasks with various due dates exist

**Test Steps:**
1. Set start date and end date filters

**Expected Results:**
- Tasks with due dates in range shown

---

### TC-TASK-083: Sort Tasks by Due Date

**Priority:** Medium
**Preconditions:** Tasks with due dates exist

**Test Steps:**
1. Click "Due Date" column header or sort option

**Expected Results:**
- Tasks sorted by due date
- ASC/DESC toggle works

---

### TC-TASK-084: Sort Tasks by Priority

**Priority:** Low
**Preconditions:** Tasks with different priorities

**Test Steps:**
1. Sort by priority

**Expected Results:**
- Tasks sorted by priority level

---

### TC-TASK-085: Combined Filters

**Priority:** Low
**Preconditions:** Multiple tasks exist

**Test Steps:**
1. Apply status filter: "Pending"
2. Apply team filter: "Project Alpha"

**Expected Results:**
- Only pending tasks from Project Alpha shown
- Both filters active

---

### TC-TASK-086: Clear All Filters

**Priority:** Low
**Preconditions:** Filters are applied

**Test Steps:**
1. Click "Clear Filters" or reset

**Expected Results:**
- All filters removed
- All tasks visible

---

## Task Search Tests

### TC-TASK-090: Search Tasks by Title

**Priority:** Medium
**Preconditions:** Tasks exist

**Test Steps:**
1. Enter search term in search box
2. Submit or wait for auto-search

**Expected Results:**
- Tasks matching title shown
- Non-matching tasks hidden

---

### TC-TASK-091: Search with No Results

**Priority:** Low
**Preconditions:** Search term doesn't match any task

**Test Steps:**
1. Search for "xyznonexistent"

**Expected Results:**
- Empty state shown
- Message like "No tasks found"

---

## Task Error Handling

### TC-TASK-100: Create Task Server Error

**Priority:** Medium
**Preconditions:** Server returns error

**Test Steps:**
1. Fill task creation form
2. Submit

**Expected Results:**
- Error message displayed
- Form data preserved
- User can retry

---

### TC-TASK-101: Update Task Conflict

**Priority:** Low
**Preconditions:** Task was modified by another user

**Test Steps:**
1. Edit task
2. Another user edits same task
3. Submit changes

**Expected Results:**
- Conflict error or merge handling
- User informed of conflict

---

### TC-TASK-102: Load Tasks Network Error

**Priority:** Medium
**Preconditions:** Network disconnected

**Test Steps:**
1. Navigate to tasks with network off

**Expected Results:**
- Error message shown
- Retry option available
- Cached data shown if available
