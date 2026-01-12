# Comment Module Test Cases

## Comment Creation Tests

### TC-COMMENT-001: Add Comment to Task

**Priority:** High
**Preconditions:**
- User is logged in
- User has access to the task

**Test Steps:**
1. Open task detail view
2. Navigate to comments section
3. Enter comment: "This is a test comment"
4. Click "Post" or "Add Comment" button

**Expected Results:**
- Comment is added successfully
- Comment appears in comment list
- Comment shows current user as author
- Comment shows current timestamp
- History entry created for comment

---

### TC-COMMENT-002: Add Empty Comment

**Priority:** High
**Preconditions:** User is on task comment section

**Test Steps:**
1. Leave comment field empty
2. Click "Post" button

**Expected Results:**
- Validation error: "Comment cannot be empty"
- Comment is not posted
- Button may be disabled when empty

---

### TC-COMMENT-003: Add Comment with Long Text

**Priority:** Low
**Preconditions:** User is on task comment section

**Test Steps:**
1. Enter a very long comment (> 1000 characters)
2. Click "Post" button

**Expected Results:**
- Either comment is accepted and posted
- Or validation error if max length exceeded
- Comment truncated or scrollable if long

---

### TC-COMMENT-004: Add Comment with Special Characters

**Priority:** Low
**Preconditions:** User is on task comment section

**Test Steps:**
1. Enter comment with special chars: "Test <script>alert('xss')</script>"
2. Click "Post"

**Expected Results:**
- Comment is posted safely
- Special characters are escaped
- No XSS vulnerability

---

### TC-COMMENT-005: Add Comment with Markdown/Rich Text

**Priority:** Low
**Preconditions:** Markdown/rich text is supported

**Test Steps:**
1. Enter comment with markdown: "**Bold** and *italic* text"
2. Click "Post"

**Expected Results:**
- Comment is posted
- Markdown is rendered (if supported)
- Or displayed as plain text

---

## Comment List Tests

### TC-COMMENT-010: View Task Comments

**Priority:** High
**Preconditions:** Task has comments

**Test Steps:**
1. Open task detail
2. Navigate to comments section

**Expected Results:**
- All comments displayed
- Comments sorted by date (newest/oldest first)
- Each comment shows author, content, timestamp

---

### TC-COMMENT-011: View Comments with Pagination

**Priority:** Low
**Preconditions:** Task has many comments (> page limit)

**Test Steps:**
1. Open task with many comments
2. Scroll or click "Load More"

**Expected Results:**
- Additional comments load
- No duplicate comments
- Smooth loading

---

### TC-COMMENT-012: View Task with No Comments

**Priority:** Low
**Preconditions:** Task has no comments

**Test Steps:**
1. Open task without comments

**Expected Results:**
- Empty state message
- "Be the first to comment" or similar
- Comment input field still visible

---

### TC-COMMENT-013: Comments Real-time Update

**Priority:** Low
**Preconditions:** Real-time updates supported

**Test Steps:**
1. Open task in two browser tabs
2. Add comment in first tab
3. Observe second tab

**Expected Results:**
- New comment appears in second tab
- Without manual refresh (if real-time)
- Or update on next poll/refresh

---

## Comment Update Tests

### TC-COMMENT-020: Edit Own Comment

**Priority:** Medium
**Preconditions:** User has posted a comment

**Test Steps:**
1. Find own comment
2. Click "Edit" button
3. Change text to "Updated comment text"
4. Save changes

**Expected Results:**
- Comment is updated
- "Edited" indicator shown
- Updated timestamp or "edited" note
- Original author preserved

---

### TC-COMMENT-021: Edit Comment with Empty Text

**Priority:** Medium
**Preconditions:** User is editing own comment

**Test Steps:**
1. Click Edit on own comment
2. Clear all text
3. Save

**Expected Results:**
- Validation error: "Comment cannot be empty"
- Original comment preserved

---

### TC-COMMENT-022: Edit Another User's Comment

**Priority:** Medium
**Preconditions:** Viewing someone else's comment

**Test Steps:**
1. Find comment by another user
2. Look for "Edit" option

**Expected Results:**
- Edit option not visible, OR
- Edit action denied with error

---

### TC-COMMENT-023: Cancel Comment Edit

**Priority:** Low
**Preconditions:** User is editing a comment

**Test Steps:**
1. Click Edit on own comment
2. Make changes
3. Click "Cancel"

**Expected Results:**
- Edit mode closed
- Original comment text preserved
- Changes discarded

---

## Comment Deletion Tests

### TC-COMMENT-030: Delete Own Comment

**Priority:** Medium
**Preconditions:** User has posted a comment

**Test Steps:**
1. Find own comment
2. Click "Delete" button
3. Confirm deletion

**Expected Results:**
- Comment is deleted
- Comment removed from list
- History may show deletion

---

### TC-COMMENT-031: Delete Another User's Comment

**Priority:** Medium
**Preconditions:** Viewing someone else's comment

**Test Steps:**
1. Find comment by another user
2. Look for "Delete" option

**Expected Results:**
- Delete option not visible, OR
- Delete action denied

---

### TC-COMMENT-032: Delete Comment as Task Owner/Admin

**Priority:** Low
**Preconditions:**
- User is task owner or team admin
- Viewing someone else's comment

**Test Steps:**
1. Find comment by another user
2. Delete comment (if allowed)

**Expected Results:**
- Comment is deleted (if admin can delete others), OR
- Delete not allowed (if only own comments)

---

### TC-COMMENT-033: Cancel Comment Deletion

**Priority:** Low
**Preconditions:** Delete confirmation dialog shown

**Test Steps:**
1. Click Delete on a comment
2. Click "Cancel" in confirmation dialog

**Expected Results:**
- Comment is not deleted
- Dialog closes

---

## Comment Reply Tests (if implemented)

### TC-COMMENT-040: Reply to Comment

**Priority:** Low
**Preconditions:** Reply feature is implemented

**Test Steps:**
1. Find a comment
2. Click "Reply" button
3. Enter reply text
4. Submit

**Expected Results:**
- Reply is added
- Reply shows as nested under original
- Reply linked to parent comment

---

### TC-COMMENT-041: View Nested Replies

**Priority:** Low
**Preconditions:** Comments have replies

**Test Steps:**
1. View comment thread with replies

**Expected Results:**
- Replies shown nested or indented
- Parent-child relationship clear
- Collapsible threads (if many)

---

## Comment Formatting Tests

### TC-COMMENT-050: Comment Timestamp Display

**Priority:** Low
**Preconditions:** Comments exist

**Test Steps:**
1. View comment timestamps
2. Wait for time to pass

**Expected Results:**
- Recent: "Just now", "5 minutes ago"
- Older: "2 hours ago", "Yesterday"
- Old: Full date format

---

### TC-COMMENT-051: Comment Author Display

**Priority:** Low
**Preconditions:** Comments from different users

**Test Steps:**
1. View comments from various users

**Expected Results:**
- Author name displayed
- Avatar shown (if implemented)
- Own comments may be highlighted

---

## Comment Error Handling

### TC-COMMENT-060: Add Comment Server Error

**Priority:** Medium
**Preconditions:** Server returns error

**Test Steps:**
1. Enter comment
2. Submit (server fails)

**Expected Results:**
- Error message displayed
- Comment text preserved
- User can retry

---

### TC-COMMENT-061: Add Comment Network Error

**Priority:** Medium
**Preconditions:** Network is disconnected

**Test Steps:**
1. Enter comment
2. Disconnect network
3. Submit

**Expected Results:**
- Error message about connection
- Comment text preserved
- Queue for retry (if offline support)

---

### TC-COMMENT-062: Load Comments Error

**Priority:** Medium
**Preconditions:** Server error when loading comments

**Test Steps:**
1. Open task (comments fail to load)

**Expected Results:**
- Error message in comments section
- Retry option available
- Rest of task detail visible

---

## Comment Input UI Tests

### TC-COMMENT-070: Comment Input Focus

**Priority:** Low
**Preconditions:** On task detail page

**Test Steps:**
1. Click on comment input field

**Expected Results:**
- Field gains focus
- Cursor visible
- Field may expand

---

### TC-COMMENT-071: Comment Input Multiline

**Priority:** Low
**Preconditions:** Long comment entry

**Test Steps:**
1. Enter text with line breaks (Shift+Enter or just Enter)

**Expected Results:**
- Line breaks preserved
- Input field expands
- Comment displays with line breaks

---

### TC-COMMENT-072: Comment Submit with Enter Key

**Priority:** Low
**Preconditions:** On comment input

**Test Steps:**
1. Type comment
2. Press Enter

**Expected Results:**
- Comment submitted, OR
- New line created (Shift+Enter to submit), OR
- Button click required
