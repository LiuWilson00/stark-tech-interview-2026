# E2E Test Suite

This directory contains end-to-end tests for the TodoList Application Backend API.

## Prerequisites

- `bash` (version 4.0+)
- `curl`
- `jq`
- Running backend server at `http://localhost:3011`

## Quick Start

```bash
# Make scripts executable (first time only)
chmod +x run-all-tests.sh
chmod +x auth/auth-test.sh
chmod +x user/user-test.sh
chmod +x team/team-test.sh
chmod +x task/task-test.sh
chmod +x comment/comment-test.sh
chmod +x history/history-test.sh

# Run all tests
./run-all-tests.sh

# Run with debug output
./run-all-tests.sh --debug

# Run specific module tests only
./auth/auth-test.sh
./user/user-test.sh
./team/team-test.sh
./task/task-test.sh
./comment/comment-test.sh
./history/history-test.sh
```

## Directory Structure

```
e2e/
├── run-all-tests.sh      # Main test runner
├── config/
│   └── test.config.sh    # Test configuration and environment variables
├── utils/
│   └── utils.sh          # Shared utility functions
├── auth/
│   └── auth-test.sh      # Authentication module tests
├── user/
│   └── user-test.sh      # User module tests
├── team/
│   └── team-test.sh      # Team module tests
├── task/
│   └── task-test.sh      # Task module tests
├── comment/
│   └── comment-test.sh   # Comment module tests
├── history/
│   └── history-test.sh   # History module tests
└── README.md             # This file
```

## Configuration

Environment variables can be set before running tests:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3011/api` | Base URL for the API |
| `API_TIMEOUT` | `30` | Request timeout in seconds |
| `DEBUG` | `false` | Enable debug output |
| `TEST_USER_EMAIL` | `e2e-test@example.com` | Test user email |
| `TEST_USER_PASSWORD` | `testpassword123` | Test user password |

Example:
```bash
API_BASE_URL=http://localhost:3011/api DEBUG=true ./run-all-tests.sh
```

## Command Line Options

```bash
./run-all-tests.sh [OPTIONS]

Options:
  --skip-auth      Skip auth module tests
  --skip-user      Skip user module tests
  --skip-team      Skip team module tests
  --skip-task      Skip task module tests
  --skip-comment   Skip comment module tests
  --skip-history   Skip history module tests
  --debug          Enable debug output
  --help           Show help message
```

## Test Modules

### Auth Tests (`auth/auth-test.sh`)
- Register new user
- Register with duplicate email (should fail)
- Register with invalid data (should fail)
- Login with valid credentials
- Login with invalid password (should fail)
- Login with non-existent user (should fail)

### User Tests (`user/user-test.sh`)
- Get current user profile
- Get profile without token (should fail)
- Update user profile
- Update profile with invalid token (should fail)
- Get user by ID
- Get non-existent user (should fail)

### Team Tests (`team/team-test.sh`)
- Create team
- Create team without name (should fail)
- Get team by ID
- Get my teams
- Update team
- Add member to team
- Get team members
- Team access denied for non-members
- Remove member from team

### Task Tests (`task/task-test.sh`)
- Create personal task
- Create team task
- Create task without title (should fail)
- Get task by ID
- Get my tasks
- Update task
- Create subtask
- Get task with subtasks
- Add assignee to task
- Remove assignee from task
- Add follower to task
- Remove follower from task
- Complete task
- Filter tasks by status
- Delete subtask
- Delete task

### Comment Tests (`comment/comment-test.sh`)
- Create comment on task
- Create comment without content (should fail)
- Get comments for task
- Get comment by ID
- Update comment
- Update comment by non-owner (should fail)
- Create reply to comment
- Delete comment by non-owner (should fail)
- Delete comment

### History Tests (`history/history-test.sh`)
- Get task history
- History contains create action
- History records update
- History records status change
- Get history without auth (should fail)
- History includes user info

## Output Format

Tests produce colored output:
- 🔵 `[INFO]` - Information messages
- 🟢 `[PASS]` - Test passed
- 🔴 `[FAIL]` - Test failed
- 🟡 `[WARN]` - Warning/skipped tests
- 🔷 `[DEBUG]` - Debug messages (when `DEBUG=true`)

## Writing New Tests

1. Create a new test file in the appropriate module directory
2. Source the config and utils:
   ```bash
   source "$SCRIPT_DIR/../config/test.config.sh"
   source "$SCRIPT_DIR/../utils/utils.sh"
   ```
3. Write test functions that return 0 for pass, 1 for fail
4. Use the helper functions:
   - `http_request`, `get_request`, `post_request`, `patch_request`, `delete_request`
   - `assert_equals`, `assert_not_empty`, `assert_http_code`, `assert_success`
   - `log_info`, `log_success`, `log_error`, `log_warning`, `log_debug`
   - `run_test "Test Name" test_function`

Example:
```bash
test_my_feature() {
    local response=$(get_request "/my-endpoint" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if assert_http_code "$response" "200" "Should return 200"; then
        log_success "My feature works!"
        return 0
    fi

    log_error "My feature failed"
    return 1
}

run_test "My Feature Test" test_my_feature
```

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
