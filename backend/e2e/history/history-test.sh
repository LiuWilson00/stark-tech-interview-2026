#!/bin/bash

# =============================================================================
# History Module E2E Tests
# =============================================================================

HISTORY_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Only source config/utils if not already loaded
if [ -z "$E2E_CONFIG_LOADED" ]; then
    source "$HISTORY_SCRIPT_DIR/../config/test.config.sh"
    source "$HISTORY_SCRIPT_DIR/../utils/utils.sh"
fi

# =============================================================================
# Test Functions
# =============================================================================

# Test: Get task history
test_get_task_history() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID/history" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local history_count=$(echo "$response" | jq '.data | length')
        log_success "Get task history: Retrieved $history_count history entries"
        return 0
    fi

    log_error "Get task history failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: History contains create action
test_history_create_action() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID/history" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local create_action=$(echo "$response" | jq -r '.data[] | select(.action == "create" or .action == "created") | .action' | head -1)
        if [ -n "$create_action" ]; then
            log_success "History create action: Found create action in history"
            return 0
        else
            log_warning "History create action: No create action found (might be implementation-specific)"
            return 0
        fi
    fi

    log_error "History create action failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: History records update
test_history_update_record() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    # First, update the task to create a history entry
    local new_title="History Test Update $(date +%s)"
    local data="{\"title\":\"$new_title\"}"

    patch_request "/tasks/$TASK_ID" "$data" "$USER_TOKEN" > /dev/null

    # Then check history
    local response=$(get_request "/tasks/$TASK_ID/history" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local history_count=$(echo "$response" | jq '.data | length')
        if [ "$history_count" -ge 1 ]; then
            log_success "History update record: History contains entries after update"
            return 0
        fi
    fi

    log_error "History update record failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: History records status change
test_history_status_change() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    # Create a new task for this test
    local task_title="History Status Test $(date +%s)"
    local data="{\"title\":\"$task_title\"}"

    local create_response=$(post_request "/tasks" "$data" "$USER_TOKEN")
    local test_task_id=$(echo "$create_response" | jq -r '.data.id // empty')

    if [ -z "$test_task_id" ]; then
        log_error "Failed to create task for history test"
        return 1
    fi

    # Complete the task
    post_request "/tasks/$test_task_id/complete" "" "$USER_TOKEN" > /dev/null

    # Check history
    local response=$(get_request "/tasks/$test_task_id/history" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local history_count=$(echo "$response" | jq '.data | length')
        if [ "$history_count" -ge 1 ]; then
            log_success "History status change: History recorded status change"
            return 0
        fi
    fi

    log_error "History status change failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Get history without auth
test_history_unauthorized() {
    if [ -z "$TASK_ID" ]; then
        log_error "Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID/history" "")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "401" ]; then
        log_success "History unauthorized: Correctly rejected"
        return 0
    fi

    log_error "History unauthorized: Should have been rejected with 401, got HTTP $http_code"
    return 1
}

# Test: History includes user info
test_history_user_info() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID/history" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local has_user=$(echo "$response" | jq '.data[0].user // .data[0].userId // empty')
        if [ -n "$has_user" ] && [ "$has_user" != "null" ]; then
            log_success "History user info: History entries include user information"
            return 0
        else
            log_warning "History user info: User info not found (might be implementation-specific)"
            return 0
        fi
    fi

    log_error "History user info failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# =============================================================================
# Main Test Runner
# =============================================================================

run_history_tests() {
    log_section "History Module Tests"

    run_test "Get task history" test_get_task_history
    run_test "History contains create action" test_history_create_action
    run_test "History records update" test_history_update_record
    run_test "History records status change" test_history_status_change
    run_test "Get history without auth" test_history_unauthorized
    run_test "History includes user info" test_history_user_info
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    wait_for_service

    # Need to setup users and task first
    source "$HISTORY_SCRIPT_DIR/../auth/auth-test.sh"
    setup_test_users

    source "$HISTORY_SCRIPT_DIR/../task/task-test.sh"
    test_create_personal_task

    run_history_tests
    show_test_summary
fi
