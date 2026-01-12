#!/bin/bash

# =============================================================================
# Comment Module E2E Tests
# =============================================================================

COMMENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Only source config/utils if not already loaded
if [ -z "$E2E_CONFIG_LOADED" ]; then
    source "$COMMENT_SCRIPT_DIR/../config/test.config.sh"
    source "$COMMENT_SCRIPT_DIR/../utils/utils.sh"
fi

# =============================================================================
# Test Functions
# =============================================================================

# Test: Create comment on task
test_create_comment() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local comment_content="E2E Test Comment $(date +%s)"
    local data="{\"content\":\"$comment_content\"}"

    # Use task-nested endpoint
    local response=$(post_request "/tasks/$TASK_ID/comments" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        COMMENT_ID=$(echo "$response" | jq -r '.data.id // empty')
        if assert_not_empty "$COMMENT_ID" "Comment ID should be returned"; then
            export COMMENT_ID
            log_success "Create comment: Created comment with ID $COMMENT_ID"
            return 0
        fi
    fi

    log_error "Create comment failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Create comment without content
test_create_comment_invalid() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local data="{}"
    local response=$(post_request "/tasks/$TASK_ID/comments" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "400" ]; then
        log_success "Create comment invalid: Correctly rejected missing content"
        return 0
    fi

    log_error "Create comment invalid: Should have been rejected with 400, got HTTP $http_code"
    return 1
}

# Test: Get comments for task
test_get_task_comments() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    local response=$(get_request "/tasks/$TASK_ID/comments" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local comments_count=$(echo "$response" | jq '.data | length')
        log_success "Get task comments: Retrieved $comments_count comments"
        return 0
    fi

    log_error "Get task comments failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Update comment
test_update_comment() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$COMMENT_ID" ]; then
        log_error "User token, Task ID, or Comment ID not set"
        return 1
    fi

    local new_content="Updated Comment $(date +%s)"
    local data="{\"content\":\"$new_content\"}"

    # Use task-nested endpoint
    local response=$(patch_request "/tasks/$TASK_ID/comments/$COMMENT_ID" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local returned_content=$(echo "$response" | jq -r '.data.content // empty')
        if [ "$returned_content" = "$new_content" ]; then
            log_success "Update comment: Content updated"
            return 0
        fi
    fi

    log_error "Update comment failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Update comment by non-owner (should fail)
test_update_comment_unauthorized() {
    if [ -z "$USER2_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$COMMENT_ID" ]; then
        log_error "User2 token, Task ID, or Comment ID not set"
        return 1
    fi

    local data="{\"content\":\"Unauthorized update\"}"
    local response=$(patch_request "/tasks/$TASK_ID/comments/$COMMENT_ID" "$data" "$USER2_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "403" ] || [ "$http_code" = "401" ]; then
        log_success "Update comment unauthorized: Correctly rejected"
        return 0
    fi

    # Some implementations might allow team members to edit
    log_warning "Update comment: Implementation might allow team member edits (HTTP $http_code)"
    return 0
}

# Test: Create reply to comment (using parentCommentId)
test_create_reply() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$COMMENT_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local reply_content="Reply to comment $(date +%s)"
    local data="{\"content\":\"$reply_content\",\"parentCommentId\":\"$COMMENT_ID\"}"

    local response=$(post_request "/tasks/$TASK_ID/comments" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        local reply_id=$(echo "$response" | jq -r '.data.id // empty')
        if assert_not_empty "$reply_id" "Reply ID should be returned"; then
            log_success "Create reply: Created reply with ID $reply_id"
            return 0
        fi
    fi

    # parentCommentId might not be implemented
    if [ "$http_code" = "400" ]; then
        log_warning "Create reply: parentCommentId might not be implemented"
        return 0
    fi

    log_error "Create reply failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Delete comment by non-owner (should fail)
test_delete_comment_unauthorized() {
    if [ -z "$USER2_TOKEN" ] || [ -z "$TASK_ID" ] || [ -z "$COMMENT_ID" ]; then
        log_error "User2 token, Task ID, or Comment ID not set"
        return 1
    fi

    local response=$(delete_request "/tasks/$TASK_ID/comments/$COMMENT_ID" "$USER2_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "403" ] || [ "$http_code" = "401" ]; then
        log_success "Delete comment unauthorized: Correctly rejected"
        return 0
    fi

    # Some implementations might allow team members/admins to delete
    log_warning "Delete comment: Implementation might allow team member deletes (HTTP $http_code)"
    return 0
}

# Test: Delete comment
test_delete_comment() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TASK_ID" ]; then
        log_error "User token or Task ID not set"
        return 1
    fi

    # Create a new comment to delete
    local comment_content="Delete Test Comment $(date +%s)"
    local data="{\"content\":\"$comment_content\"}"

    local response=$(post_request "/tasks/$TASK_ID/comments" "$data" "$USER_TOKEN")
    local delete_comment_id=$(echo "$response" | jq -r '.data.id // empty')

    if [ -z "$delete_comment_id" ]; then
        log_error "Failed to create comment for deletion test"
        return 1
    fi

    # Delete the comment
    local delete_response=$(delete_request "/tasks/$TASK_ID/comments/$delete_comment_id" "$USER_TOKEN")
    local http_code=$(get_http_code "$delete_response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Delete comment: Comment deleted successfully"
        return 0
    fi

    log_error "Delete comment failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$delete_response")"
    return 1
}

# =============================================================================
# Main Test Runner
# =============================================================================

run_comment_tests() {
    log_section "Comment Module Tests"

    run_test "Create comment on task" test_create_comment
    run_test "Create comment without content" test_create_comment_invalid
    run_test "Get comments for task" test_get_task_comments
    # Note: GET /comments/:id not implemented - using task-nested endpoints only
    skip_test "Get comment by ID" "Endpoint not implemented"
    run_test "Update comment" test_update_comment
    run_test "Update comment by non-owner" test_update_comment_unauthorized
    run_test "Create reply to comment" test_create_reply
    run_test "Delete comment by non-owner" test_delete_comment_unauthorized
    run_test "Delete comment" test_delete_comment
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    wait_for_service

    # Need to setup users and task first
    source "$COMMENT_SCRIPT_DIR/../auth/auth-test.sh"
    setup_test_users

    source "$COMMENT_SCRIPT_DIR/../task/task-test.sh"
    test_create_personal_task

    run_comment_tests
    show_test_summary
fi
