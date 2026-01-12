# Frontend Test Cases

This directory contains test case specifications for the TodoList Application frontend.

## Test Case Categories

| Category | File | Description |
|----------|------|-------------|
| Auth | [auth.test-case.md](./auth.test-case.md) | Login, Register, Logout, Token management |
| User | [user.test-case.md](./user.test-case.md) | Profile view, Profile update |
| Team | [team.test-case.md](./team.test-case.md) | Team CRUD, Member management |
| Task | [task.test-case.md](./task.test-case.md) | Task CRUD, Subtasks, Assignees, Followers |
| Comment | [comment.test-case.md](./comment.test-case.md) | Comments CRUD |
| History | [history.test-case.md](./history.test-case.md) | Task history view |
| UI/UX | [ui-ux.test-case.md](./ui-ux.test-case.md) | Navigation, Responsive, Loading states |

## Test Case Format

Each test case follows this structure:

```
### TC-XXX-NNN: Test Case Title

**Priority:** High/Medium/Low
**Preconditions:** List of prerequisites
**Test Steps:**
1. Step 1
2. Step 2
3. ...

**Expected Results:**
- Expected outcome 1
- Expected outcome 2

**Notes:** Additional information
```

## Test Status Tracking

Use these markers when executing tests:

- [ ] Not tested
- [x] Passed
- [!] Failed
- [-] Blocked
- [~] Skipped

## Running Tests

For automated testing (if implemented):

```bash
# Run all tests
npm test

# Run specific category
npm test -- --grep "Auth"

# Run with coverage
npm test -- --coverage
```
