#!/bin/bash

# =============================================================================
# E2E Test Configuration
# =============================================================================

# Flag to indicate config has been loaded
export E2E_CONFIG_LOADED=true

# API Configuration
export API_BASE_URL="${API_BASE_URL:-http://localhost:3011/api}"
export API_TIMEOUT="${API_TIMEOUT:-30}"

# Test User Credentials
export TEST_USER_EMAIL="${TEST_USER_EMAIL:-e2e-test@example.com}"
export TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-testpassword123}"
export TEST_USER_NAME="${TEST_USER_NAME:-E2E Test User}"

# Secondary Test User (for multi-user tests)
export TEST_USER2_EMAIL="${TEST_USER2_EMAIL:-e2e-test2@example.com}"
export TEST_USER2_PASSWORD="${TEST_USER2_PASSWORD:-testpassword123}"
export TEST_USER2_NAME="${TEST_USER2_NAME:-E2E Test User 2}"

# Test Team Configuration
export TEST_TEAM_NAME="${TEST_TEAM_NAME:-E2E Test Team}"
export TEST_TEAM_DESCRIPTION="${TEST_TEAM_DESCRIPTION:-Team created for E2E testing}"

# Test Task Configuration
export TEST_TASK_TITLE="${TEST_TASK_TITLE:-E2E Test Task}"
export TEST_TASK_DESCRIPTION="${TEST_TASK_DESCRIPTION:-Task created for E2E testing}"

# Global test state (will be populated during tests)
export USER_TOKEN=""
export USER_ID=""
export USER2_TOKEN=""
export USER2_ID=""
export TEAM_ID=""
export TASK_ID=""
export SUBTASK_ID=""
export COMMENT_ID=""

# Test counters
export TESTS_TOTAL=0
export TESTS_PASSED=0
export TESTS_FAILED=0
export TESTS_SKIPPED=0

# =============================================================================
# Helper Functions
# =============================================================================

# Get test account credentials by role
get_test_account() {
    local role=$1
    case $role in
        "user1")
            echo "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"$TEST_USER_NAME\"}"
            ;;
        "user2")
            echo "{\"email\":\"$TEST_USER2_EMAIL\",\"password\":\"$TEST_USER2_PASSWORD\",\"name\":\"$TEST_USER2_NAME\"}"
            ;;
        *)
            echo "{}"
            ;;
    esac
}

# Generate unique email for test
generate_unique_email() {
    local timestamp=$(date +%s)
    local random=$(( RANDOM % 10000 ))
    echo "e2e-test-${timestamp}-${random}@example.com"
}

# Generate unique name for test
generate_unique_name() {
    local prefix="${1:-Test}"
    local timestamp=$(date +%s)
    echo "${prefix}-${timestamp}"
}
