# History Module Test Cases

## History View Tests

### TC-HIST-001: View Task History

**Priority:** High
**Preconditions:**
- User is logged in
- User has access to a task with history

**Test Steps:**
1. Open task detail view
2. Navigate to "History" or "Activity" tab/section

**Expected Results:**
- History entries are displayed
- Entries sorted by date (newest first)
- Each entry shows action type, user, and timestamp

---

### TC-HIST-002: View History of New Task

**Priority:** Medium
**Preconditions:** Task was just created

**Test Steps:**
1. Create a new task
2. View its history

**Expected Results:**
- "Created" entry exists
- Creator and creation time shown

---

### TC-HIST-003: View Empty History

**Priority:** Low
**Preconditions:** Task has no recorded history (edge case)

**Test Steps:**
1. View task with no history

**Expected Results:**
- Empty state message
- Or just creation entry

---

## History Entry Types Tests

### TC-HIST-010: History Shows Task Creation

**Priority:** High
**Preconditions:** Task was created

**Test Steps:**
1. Create a task
2. Check history

**Expected Results:**
- Entry: "Task created by [User]"
- Action type: "created"
- Correct timestamp

---

### TC-HIST-011: History Shows Title Update

**Priority:** Medium
**Preconditions:** Task title was changed

**Test Steps:**
1. Update task title
2. Check history

**Expected Results:**
- Entry: "Title changed from 'Old' to 'New'"
- Shows who made the change
- Timestamp of change

---

### TC-HIST-012: History Shows Status Change

**Priority:** High
**Preconditions:** Task status was changed

**Test Steps:**
1. Change task status (e.g., pending to completed)
2. Check history

**Expected Results:**
- Entry: "Status changed from 'Pending' to 'Completed'"
- Action type: "status_changed"

---

### TC-HIST-013: History Shows Assignee Added

**Priority:** Medium
**Preconditions:** Assignee was added to task

**Test Steps:**
1. Add an assignee to task
2. Check history

**Expected Results:**
- Entry: "[User] was assigned"
- Action type: "assignee_added"
- Shows who performed the action

---

### TC-HIST-014: History Shows Assignee Removed

**Priority:** Medium
**Preconditions:** Assignee was removed from task

**Test Steps:**
1. Remove an assignee
2. Check history

**Expected Results:**
- Entry: "[User] was unassigned"
- Action type: "assignee_removed"

---

### TC-HIST-015: History Shows Follower Added

**Priority:** Low
**Preconditions:** Follower was added

**Test Steps:**
1. Add a follower to task
2. Check history

**Expected Results:**
- Entry: "[User] started following"
- Action type: "follower_added"

---

### TC-HIST-016: History Shows Follower Removed

**Priority:** Low
**Preconditions:** Follower was removed

**Test Steps:**
1. Remove a follower
2. Check history

**Expected Results:**
- Entry: "[User] stopped following"
- Action type: "follower_removed"

---

### TC-HIST-017: History Shows Comment Added

**Priority:** Medium
**Preconditions:** Comment was added to task

**Test Steps:**
1. Add a comment
2. Check history

**Expected Results:**
- Entry: "[User] added a comment"
- Action type: "comment_added"
- May link to comment

---

### TC-HIST-018: History Shows Task Completion

**Priority:** High
**Preconditions:** Task was completed

**Test Steps:**
1. Complete a task
2. Check history

**Expected Results:**
- Entry: "Task completed by [User]"
- Action type: "completed"
- Completion timestamp

---

### TC-HIST-019: History Shows Priority Change

**Priority:** Low
**Preconditions:** Priority was changed

**Test Steps:**
1. Change task priority
2. Check history

**Expected Results:**
- Entry: "Priority changed from 'Medium' to 'High'"
- Action type: "updated"

---

### TC-HIST-020: History Shows Due Date Change

**Priority:** Low
**Preconditions:** Due date was changed

**Test Steps:**
1. Set or change due date
2. Check history

**Expected Results:**
- Entry: "Due date changed to [date]"
- Or "Due date removed"

---

## History Display Tests

### TC-HIST-030: History Entry Format

**Priority:** Low
**Preconditions:** History entries exist

**Test Steps:**
1. View history entries

**Expected Results:**
- User name/avatar displayed
- Action description clear
- Timestamp in readable format
- Visual differentiation by action type

---

### TC-HIST-031: History Timestamp Display

**Priority:** Low
**Preconditions:** History entries with various timestamps

**Test Steps:**
1. View history with recent and old entries

**Expected Results:**
- Recent: "Just now", "5 minutes ago"
- Older: "2 hours ago", "Yesterday"
- Old: Full date/time format

---

### TC-HIST-032: History Pagination

**Priority:** Low
**Preconditions:** Task has many history entries

**Test Steps:**
1. Open task with extensive history
2. Scroll or click "Load More"

**Expected Results:**
- Additional entries load
- Chronological order maintained
- No duplicates

---

### TC-HIST-033: History User Links

**Priority:** Low
**Preconditions:** History shows user names

**Test Steps:**
1. Click on a user name in history

**Expected Results:**
- Navigate to user profile, OR
- Show user card/tooltip, OR
- No action (plain text)

---

## History Filter/Search Tests

### TC-HIST-040: Filter History by Action Type

**Priority:** Low
**Preconditions:** History has various action types

**Test Steps:**
1. Apply filter for "Status Changes" only

**Expected Results:**
- Only status change entries shown
- Other entries hidden

---

### TC-HIST-041: Filter History by User

**Priority:** Low
**Preconditions:** Multiple users have history entries

**Test Steps:**
1. Filter to show entries by specific user

**Expected Results:**
- Only entries by selected user shown

---

### TC-HIST-042: Filter History by Date Range

**Priority:** Low
**Preconditions:** History spans multiple days

**Test Steps:**
1. Set date range filter

**Expected Results:**
- Only entries within date range shown

---

## History Error Handling

### TC-HIST-050: History Load Error

**Priority:** Medium
**Preconditions:** Server returns error for history

**Test Steps:**
1. Open task detail
2. Navigate to history (fails to load)

**Expected Results:**
- Error message in history section
- Retry option available
- Rest of task detail visible

---

### TC-HIST-051: History Network Error

**Priority:** Medium
**Preconditions:** Network is disconnected

**Test Steps:**
1. Navigate to history with network off

**Expected Results:**
- Error message shown
- Retry when connected
- Cached data if available

---

## History Real-time Tests

### TC-HIST-060: History Updates on Action

**Priority:** Medium
**Preconditions:** User performs an action on task

**Test Steps:**
1. Open task history in one tab
2. Perform action (update, complete) in another
3. Check history tab

**Expected Results:**
- New entry appears (real-time or on refresh)
- Entry accurate

---

### TC-HIST-061: History Updates from Other Users

**Priority:** Low
**Preconditions:** Real-time updates supported

**Test Steps:**
1. User A views task history
2. User B makes a change to the task
3. User A observes

**Expected Results:**
- New entry appears in User A's view
- Without manual refresh (if real-time)

---

## History Data Integrity Tests

### TC-HIST-070: History Shows Correct Old/New Values

**Priority:** Medium
**Preconditions:** History entry with value changes

**Test Steps:**
1. Change task title from "Old Title" to "New Title"
2. View history entry

**Expected Results:**
- Entry shows both old and new values
- Values are accurate

---

### TC-HIST-071: History Preserves All Actions

**Priority:** Medium
**Preconditions:** Multiple actions performed

**Test Steps:**
1. Perform multiple actions on task:
   - Update title
   - Add assignee
   - Change status
2. View history

**Expected Results:**
- All actions recorded
- Correct order
- No missing entries
