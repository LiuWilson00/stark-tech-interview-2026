# Team Module Test Cases

## Team Creation Tests

### TC-TEAM-001: Create Team Successfully

**Priority:** High
**Preconditions:** User is logged in

**Test Steps:**
1. Navigate to teams page or click "Create Team"
2. Enter team name: "Project Alpha"
3. Enter description: "Alpha team for project X"
4. Click "Create" button

**Expected Results:**
- Team is created successfully
- Success message displayed
- New team appears in team list
- User is set as team owner

---

### TC-TEAM-002: Create Team Without Name

**Priority:** High
**Preconditions:** User is on create team form

**Test Steps:**
1. Leave team name empty
2. Enter description: "Some description"
3. Click "Create" button

**Expected Results:**
- Validation error: "Team name is required"
- Form is not submitted
- Focus moves to name field

---

### TC-TEAM-003: Create Team Without Description

**Priority:** Low
**Preconditions:** User is on create team form

**Test Steps:**
1. Enter team name: "Project Alpha"
2. Leave description empty
3. Click "Create" button

**Expected Results:**
- Team is created successfully (description is optional)
- Team appears in list without description

---

### TC-TEAM-004: Create Team with Duplicate Name

**Priority:** Medium
**Preconditions:** Team "Project Alpha" already exists

**Test Steps:**
1. Enter team name: "Project Alpha"
2. Enter description
3. Click "Create" button

**Expected Results:**
- Either creates (if duplicates allowed)
- Or error: "Team name already exists"

---

## Team List Tests

### TC-TEAM-010: View My Teams List

**Priority:** High
**Preconditions:** User is logged in and member of at least one team

**Test Steps:**
1. Navigate to teams page

**Expected Results:**
- All teams user is member of are listed
- Each team shows name and description
- Team role is displayed (Owner/Admin/Member)
- Teams are sorted appropriately

---

### TC-TEAM-011: Empty Teams List

**Priority:** Medium
**Preconditions:** User is not a member of any team

**Test Steps:**
1. Navigate to teams page

**Expected Results:**
- Empty state message displayed
- "Create Team" button/link visible
- Helpful message like "You're not part of any team yet"

---

### TC-TEAM-012: Teams List Pagination

**Priority:** Low
**Preconditions:** User is member of many teams (> page limit)

**Test Steps:**
1. Navigate to teams page
2. Scroll to bottom or click "Load More"

**Expected Results:**
- Additional teams load
- No duplicate teams
- Pagination works correctly

---

## Team Detail View Tests

### TC-TEAM-020: View Team Details

**Priority:** High
**Preconditions:** User is a member of the team

**Test Steps:**
1. Navigate to teams page
2. Click on a team

**Expected Results:**
- Team detail page loads
- Team name and description shown
- Member list visible
- Team tasks visible (if applicable)

---

### TC-TEAM-021: View Team as Non-Member

**Priority:** Medium
**Preconditions:** User is not a member of the target team

**Test Steps:**
1. Navigate directly to /teams/{team-id} of a team user isn't member of

**Expected Results:**
- Access denied message, OR
- Redirect to teams list, OR
- Limited view (if public teams exist)

---

## Team Update Tests

### TC-TEAM-030: Update Team Name as Owner

**Priority:** High
**Preconditions:** User is team owner

**Test Steps:**
1. Navigate to team settings/edit
2. Change name from "Old Name" to "New Name"
3. Save changes

**Expected Results:**
- Team name is updated
- Success message shown
- New name reflected everywhere

---

### TC-TEAM-031: Update Team Description as Admin

**Priority:** Medium
**Preconditions:** User is team admin

**Test Steps:**
1. Navigate to team settings/edit
2. Update description
3. Save changes

**Expected Results:**
- Description is updated
- Success message shown

---

### TC-TEAM-032: Update Team as Regular Member

**Priority:** Medium
**Preconditions:** User is regular team member (not admin/owner)

**Test Steps:**
1. Navigate to team page
2. Look for edit/settings option

**Expected Results:**
- Edit option is not visible, OR
- Edit is disabled, OR
- Error when attempting to edit

---

## Member Management Tests

### TC-TEAM-040: Add Member to Team

**Priority:** High
**Preconditions:** User is team owner or admin

**Test Steps:**
1. Navigate to team members section
2. Click "Add Member"
3. Search/select user by email or name
4. Select role (Member)
5. Confirm addition

**Expected Results:**
- Member is added to team
- New member appears in member list
- Success message shown
- New member can see the team

---

### TC-TEAM-041: Add Member with Admin Role

**Priority:** Medium
**Preconditions:** User is team owner

**Test Steps:**
1. Navigate to team members section
2. Click "Add Member"
3. Select user
4. Set role to "Admin"
5. Confirm

**Expected Results:**
- Member is added with admin role
- Member can perform admin actions

---

### TC-TEAM-042: Add Already Existing Member

**Priority:** Medium
**Preconditions:** User is already a team member

**Test Steps:**
1. Attempt to add a user who is already in the team

**Expected Results:**
- Error: "User is already a member"
- Or user is not shown in search results

---

### TC-TEAM-043: Add Member as Regular Member

**Priority:** Medium
**Preconditions:** User is a regular member (not admin/owner)

**Test Steps:**
1. Navigate to team page
2. Look for "Add Member" option

**Expected Results:**
- Option is not visible or disabled
- Cannot add members without permission

---

### TC-TEAM-050: Remove Member from Team

**Priority:** High
**Preconditions:** User is team owner or admin

**Test Steps:**
1. Navigate to team members
2. Find a member to remove
3. Click "Remove" button
4. Confirm removal

**Expected Results:**
- Member is removed from team
- Member no longer in list
- Removed member loses access to team

---

### TC-TEAM-051: Remove Self from Team

**Priority:** Medium
**Preconditions:** User is a regular member

**Test Steps:**
1. Navigate to team
2. Find "Leave Team" option
3. Confirm leaving

**Expected Results:**
- User is removed from team
- Redirected to teams list
- Team no longer visible in user's teams

---

### TC-TEAM-052: Owner Cannot Be Removed

**Priority:** High
**Preconditions:** User is team owner

**Test Steps:**
1. Attempt to remove the team owner

**Expected Results:**
- Action is not allowed
- Error: "Owner cannot be removed"
- Must transfer ownership first

---

### TC-TEAM-060: Change Member Role

**Priority:** Medium
**Preconditions:** User is team owner

**Test Steps:**
1. Navigate to team members
2. Find a member
3. Change role from "Member" to "Admin"
4. Save

**Expected Results:**
- Role is updated
- Member now has admin permissions

---

### TC-TEAM-061: Demote Admin to Member

**Priority:** Medium
**Preconditions:** User is team owner

**Test Steps:**
1. Find an admin member
2. Change role to "Member"
3. Save

**Expected Results:**
- Role is updated
- Former admin loses admin permissions

---

## Team Deletion Tests

### TC-TEAM-070: Delete Team as Owner

**Priority:** High
**Preconditions:** User is team owner

**Test Steps:**
1. Navigate to team settings
2. Click "Delete Team"
3. Confirm deletion (type team name if required)
4. Confirm

**Expected Results:**
- Team is deleted
- All members lose access
- Team tasks handled appropriately
- Redirect to teams list

---

### TC-TEAM-071: Delete Team as Non-Owner

**Priority:** Medium
**Preconditions:** User is admin but not owner

**Test Steps:**
1. Navigate to team settings
2. Look for "Delete Team" option

**Expected Results:**
- Option is not available
- Only owner can delete team

---

### TC-TEAM-072: Cancel Team Deletion

**Priority:** Low
**Preconditions:** User is on delete confirmation

**Test Steps:**
1. Click "Delete Team"
2. On confirmation dialog, click "Cancel"

**Expected Results:**
- Team is not deleted
- Return to team settings

---

## Team Search/Filter Tests

### TC-TEAM-080: Search Teams by Name

**Priority:** Low
**Preconditions:** User has multiple teams

**Test Steps:**
1. Navigate to teams page
2. Enter search term in search box
3. Observe results

**Expected Results:**
- Teams matching search term are shown
- Non-matching teams are hidden
- Real-time or on-submit filtering

---

## Team Error Handling

### TC-TEAM-090: Create Team Server Error

**Priority:** Medium
**Preconditions:** Server returns error on team creation

**Test Steps:**
1. Fill in team creation form
2. Submit

**Expected Results:**
- Error message displayed
- Form data preserved
- User can retry

---

### TC-TEAM-091: Load Teams Network Error

**Priority:** Medium
**Preconditions:** Network is disconnected

**Test Steps:**
1. Navigate to teams page with network off

**Expected Results:**
- Error message displayed
- Retry option available
- Cached data shown if available
