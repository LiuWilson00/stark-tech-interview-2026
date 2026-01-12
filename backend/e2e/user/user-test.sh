#!/bin/bash

# =============================================================================
# User Module E2E Tests
# =============================================================================

USER_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Only source config/utils if not already loaded
if [ -z "$E2E_CONFIG_LOADED" ]; then
    source "$USER_SCRIPT_DIR/../config/test.config.sh"
    source "$USER_SCRIPT_DIR/../utils/utils.sh"
fi

# =============================================================================
# Test Functions
# =============================================================================

# Test: Get current user profile
test_get_profile() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local response=$(get_request "/users/me" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local user_id=$(echo "$response" | jq -r '.data.id // empty')
        local email=$(echo "$response" | jq -r '.data.email // empty')

        if assert_not_empty "$user_id" "User ID should be returned" && \
           assert_not_empty "$email" "Email should be returned"; then
            log_success "Get profile: Retrieved user profile"
            return 0
        fi
    fi

    log_error "Get profile failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Get profile without token
test_get_profile_unauthorized() {
    local response=$(get_request "/users/me" "")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "401" ]; then
        log_success "Get profile unauthorized: Correctly rejected"
        return 0
    fi

    log_error "Get profile unauthorized: Should have been rejected with 401, got HTTP $http_code"
    return 1
}

# Test: Update user profile
test_update_profile() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local new_name="Updated Name $(date +%s)"
    local data="{\"name\":\"$new_name\"}"

    local response=$(patch_request "/users/me" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local returned_name=$(echo "$response" | jq -r '.data.name // empty')
        if [ "$returned_name" = "$new_name" ]; then
            log_success "Update profile: Name updated to '$new_name'"
            return 0
        fi
    fi

    log_error "Update profile failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Update profile with invalid token
test_update_profile_invalid_token() {
    local data="{\"name\":\"Test Name\"}"
    local response=$(patch_request "/users/me" "$data" "invalid-token")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "401" ]; then
        log_success "Update profile invalid token: Correctly rejected"
        return 0
    fi

    log_error "Update profile invalid token: Should have been rejected with 401, got HTTP $http_code"
    return 1
}

# Note: /users/:id endpoint not implemented in current API
# These tests are skipped as only /users/me is available

# =============================================================================
# Main Test Runner
# =============================================================================

run_user_tests() {
    log_section "User Module Tests"

    run_test "Get current user profile" test_get_profile
    run_test "Get profile without token" test_get_profile_unauthorized
    run_test "Update user profile" test_update_profile
    run_test "Update profile with invalid token" test_update_profile_invalid_token
    # Note: /users/:id endpoint not implemented - skipping related tests
    skip_test "Get user by ID" "Endpoint not implemented"
    skip_test "Get non-existent user" "Endpoint not implemented"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    wait_for_service

    # Need to setup users first
    source "$USER_SCRIPT_DIR/../auth/auth-test.sh"
    setup_test_users

    run_user_tests
    show_test_summary
fi
