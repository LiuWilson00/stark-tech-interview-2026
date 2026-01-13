#!/bin/bash

# =============================================================================
# Task Module E2E Tests
# =============================================================================

TASK_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Only source config/utils if not already loaded
if [ -z "$E2E_CONFIG_LOADED" ]; then
    source "$TASK_SCRIPT_DIR/../config/test.config.sh"
    source "$TASK_SCRIPT_DIR/../utils/utils.sh"
fi

# =============================================================================
# Test Functions
# =============================================================================

# Test: Create personal task
test_create_personal_task() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local task_title="E2E Test Task $(date +%s)"
    local data="{\"title\":\"$task_title\",\"description\":\"$TEST_TASK_DESCRIPTION\",\"priority\":\"medium\"}"

    local response=$(post_request "/tasks" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        TASK_ID=$(echo "$response" | jq -r '.data.id // empty')
        if assert_not_empty "$TASK_ID" "Task ID should be returned"; then
            export TASK_ID
            log_success "Create personal task: Created task with ID $TASK_ID"
            return 0
        fi
    fi

    log_error "Create personal task failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Create team task
test_create_team_task() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TEAM_ID" ]; then
        log_error "User token or Team ID not set"
        return 1
    fi

    local task_title="E2E Team Task $(date +%s)"
    local data="{\"title\":\"$task_title\",\"description\":\"Team task description\",\"teamId\":\"$TEAM_ID\",\"priority\":\"high\"}"

    local response=$(post_request "/tasks" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        local team_task_id=$(echo "$response" | jq -r '.data.id // empty')
        if assert_not_empty "$team_task_id" "Team task ID should be returned"; then
            log_success "Create team task: Created team task with ID $team_task_id"
            return 0
        fi
    fi

    log_error "Create team task failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Create task without title
test_create_task_invalid() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local data="{\"description\":\"Task without title\"}"
    local response=$(post_request "/tasks" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "400" ]; then
        log_success "Create task invalid: Correctly rejected missing title"
        return 0
    fi

    log_error "Create task invalid: Should have been rejected with 400, got HTTP $http_code"
    return 1
}

# Test: Get task by ID
test_get_task() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local task_id=$(echo "$response" | jq -r '.data.id // empty')
        if [ "$task_id" = "$TASK_ID" ]; then
            log_success "Get task: Retrieved task correctly"
            return 0
        fi
    fi

    log_error "Get task failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Get my tasks
test_get_my_tasks() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local response=$(get_request "/tasks" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local tasks_count=$(echo "$response" | jq '.data | length')
        log_success "Get my tasks: Retrieved $tasks_count tasks"
        return 0
    fi

    log_error "Get my tasks failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Update task
test_update_task() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local new_title="Updated Task $(date +%s)"
    local data="{\"title\":\"$new_title\",\"priority\":\"high\"}"

    local response=$(patch_request "/tasks/$TASK_ID" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local returned_title=$(echo "$response" | jq -r '.data.title // empty')
        if [ "$returned_title" = "$new_title" ]; then
            log_success "Update task: Title updated to '$new_title'"
            return 0
        fi
    fi

    log_error "Update task failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Create subtask
test_create_subtask() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local subtask_title="E2E Subtask $(date +%s)"
    local data="{\"title\":\"$subtask_title\"}"

    # Use the dedicated subtask endpoint
    local response=$(post_request "/tasks/$TASK_ID/subtasks" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        SUBTASK_ID=$(echo "$response" | jq -r '.data.id // empty')
        if assert_not_empty "$SUBTASK_ID" "Subtask ID should be returned"; then
            export SUBTASK_ID
            log_success "Create subtask: Created subtask with ID $SUBTASK_ID"
            return 0
        fi
    fi

    log_error "Create subtask failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Get task with subtasks
test_get_task_with_subtasks() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local subtasks=$(echo "$response" | jq '.data.subtasks // []')
        local subtasks_count=$(echo "$subtasks" | jq 'length')
        log_success "Get task with subtasks: Task has $subtasks_count subtasks"
        return 0
    fi

    log_error "Get task with subtasks failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Add assignee to task
test_add_assignee() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$USER2_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local data="{\"userId\":\"$USER2_ID\"}"
    local response=$(post_request "/tasks/$TASK_ID/assignees" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        log_success "Add assignee: User 2 assigned to task"
        return 0
    fi

    log_error "Add assignee failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Remove assignee from task
test_remove_assignee() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$USER2_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local response=$(delete_request "/tasks/$TASK_ID/assignees/$USER2_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Remove assignee: User 2 removed from task"
        return 0
    fi

    log_error "Remove assignee failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Add follower to task
test_add_follower() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$USER2_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local data="{\"userId\":\"$USER2_ID\"}"
    local response=$(post_request "/tasks/$TASK_ID/followers" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        log_success "Add follower: User 2 now following task"
        return 0
    fi

    log_error "Add follower failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Remove follower from task
test_remove_follower() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$USER2_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local response=$(delete_request "/tasks/$TASK_ID/followers/$USER2_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Remove follower: User 2 unfollowed task"
        return 0
    fi

    log_error "Remove follower failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Complete task
test_complete_task() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(post_request "/tasks/$TASK_ID/complete" "" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        local status=$(echo "$response" | jq -r '.data.status // empty')
        if [ "$status" = "completed" ]; then
            log_success "Complete task: Task marked as completed"
            return 0
        fi
    fi

    log_error "Complete task failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Note: POST /tasks/:id/reopen endpoint not implemented
# Reopen can be done by updating isCompleted to false via PATCH

# Test: Filter tasks by status
test_filter_tasks_by_status() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local response=$(get_request "/tasks?status=pending" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        log_success "Filter tasks by status: Request successful"
        return 0
    fi

    log_error "Filter tasks by status failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Note: Priority filter not implemented in current API

# Test: Delete subtask
test_delete_subtask() {
    if [ -z "$USER_TOKEN" ] || [ -z "$SUBTASK_ID" ]; then
        log_error "User token or Subtask ID not set"
        return 1
    fi

    local response=$(delete_request "/tasks/$SUBTASK_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Delete subtask: Subtask deleted successfully"
        return 0
    fi

    log_error "Delete subtask failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Delete task
test_delete_task() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    # Create a new task to delete
    local task_title="Delete Test Task $(date +%s)"
    local data="{\"title\":\"$task_title\"}"

    local response=$(post_request "/tasks" "$data" "$USER_TOKEN")
    local delete_task_id=$(echo "$response" | jq -r '.data.id // empty')

    if [ -z "$delete_task_id" ]; then
        log_error "Failed to create task for deletion test"
        return 1
    fi

    # Delete the task
    local delete_response=$(delete_request "/tasks/$delete_task_id" "$USER_TOKEN")
    local http_code=$(get_http_code "$delete_response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Delete task: Task deleted successfully"
        return 0
    fi

    log_error "Delete task failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$delete_response")"
    return 1
}

# =============================================================================
# Main Test Runner
# =============================================================================

run_task_tests() {
    log_section "Task Module Tests"

    run_test "Create personal task" test_create_personal_task
    run_test "Create team task" test_create_team_task
    run_test "Create task without title" test_create_task_invalid
    run_test "Get task by ID" test_get_task
    run_test "Get my tasks" test_get_my_tasks
    run_test "Update task" test_update_task
    run_test "Create subtask" test_create_subtask
    run_test "Get task with subtasks" test_get_task_with_subtasks
    run_test "Add assignee to task" test_add_assignee
    run_test "Remove assignee from task" test_remove_assignee
    run_test "Add follower to task" test_add_follower
    run_test "Remove follower from task" test_remove_follower
    run_test "Complete task" test_complete_task
    run_test "Filter tasks by status" test_filter_tasks_by_status
    run_test "Delete subtask" test_delete_subtask
    run_test "Delete task" test_delete_task
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    wait_for_service

    # Need to setup users and team first
    source "$TASK_SCRIPT_DIR/../auth/auth-test.sh"
    setup_test_users

    source "$TASK_SCRIPT_DIR/../team/team-test.sh"
    test_create_team

    run_task_tests
    show_test_summary
fi
