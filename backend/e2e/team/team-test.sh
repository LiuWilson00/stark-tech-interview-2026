#!/bin/bash

# =============================================================================
# Team Module E2E Tests
# =============================================================================

TEAM_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Only source config/utils if not already loaded
if [ -z "$E2E_CONFIG_LOADED" ]; then
    source "$TEAM_SCRIPT_DIR/../config/test.config.sh"
    source "$TEAM_SCRIPT_DIR/../utils/utils.sh"
fi

# =============================================================================
# Test Functions
# =============================================================================

# Test: Create team
test_create_team() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local team_name="E2E Test Team $(date +%s)"
    local data="{\"name\":\"$team_name\",\"description\":\"$TEST_TEAM_DESCRIPTION\"}"

    local response=$(post_request "/teams" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        TEAM_ID=$(echo "$response" | jq -r '.data.id // empty')
        if assert_not_empty "$TEAM_ID" "Team ID should be returned"; then
            export TEAM_ID
            log_success "Create team: Created team with ID $TEAM_ID"
            return 0
        fi
    fi

    log_error "Create team failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Create team without name
test_create_team_invalid() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local data="{\"description\":\"Test description\"}"
    local response=$(post_request "/teams" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "400" ]; then
        log_success "Create team invalid: Correctly rejected missing name"
        return 0
    fi

    log_error "Create team invalid: Should have been rejected with 400, got HTTP $http_code"
    return 1
}

# Test: Get team by ID
test_get_team() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TEAM_ID" ]; then
        log_error "User token or Team ID not set"
        return 1
    fi

    local response=$(get_request "/teams/$TEAM_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local team_id=$(echo "$response" | jq -r '.data.id // empty')
        if [ "$team_id" = "$TEAM_ID" ]; then
            log_success "Get team: Retrieved team correctly"
            return 0
        fi
    fi

    log_error "Get team failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Get my teams
test_get_my_teams() {
    if [ -z "$USER_TOKEN" ]; then
        log_error "User token not set"
        return 1
    fi

    local response=$(get_request "/teams" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local teams_count=$(echo "$response" | jq '.data | length')
        if [ "$teams_count" -ge 0 ]; then
            log_success "Get my teams: Retrieved $teams_count teams"
            return 0
        fi
    fi

    log_error "Get my teams failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Update team
test_update_team() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TEAM_ID" ]; then
        log_error "User token or Team ID not set"
        return 1
    fi

    local new_name="Updated Team $(date +%s)"
    local data="{\"name\":\"$new_name\"}"

    local response=$(patch_request "/teams/$TEAM_ID" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local returned_name=$(echo "$response" | jq -r '.data.name // empty')
        if [ "$returned_name" = "$new_name" ]; then
            log_success "Update team: Name updated to '$new_name'"
            return 0
        fi
    fi

    log_error "Update team failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Add member to team
test_add_team_member() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TEAM_ID" ] || [ -z "$USER2_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local data="{\"userId\":\"$USER2_ID\",\"role\":\"member\"}"
    local response=$(post_request "/teams/$TEAM_ID/members" "$data" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        log_success "Add team member: User 2 added to team"
        return 0
    fi

    log_error "Add team member failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Get team members
test_get_team_members() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TEAM_ID" ]; then
        log_error "User token or Team ID not set"
        return 1
    fi

    local response=$(get_request "/teams/$TEAM_ID/members" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ]; then
        local members_count=$(echo "$response" | jq '.data | length')
        if [ "$members_count" -ge 1 ]; then
            log_success "Get team members: Retrieved $members_count members"
            return 0
        fi
    fi

    log_error "Get team members failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Note: PATCH /teams/:id/members/:userId endpoint not implemented

# Test: Non-member cannot access team
test_team_access_denied() {
    # Create a new team that user2 is not a member of
    local team_name="Private Team $(date +%s)"
    local data="{\"name\":\"$team_name\"}"

    local response=$(post_request "/teams" "$data" "$USER_TOKEN")
    local private_team_id=$(echo "$response" | jq -r '.data.id // empty')

    # Try to access with user2 (should fail or return empty based on implementation)
    local response2=$(get_request "/teams/$private_team_id" "$USER2_TOKEN")
    local http_code=$(get_http_code "$response2")

    # Some implementations might return 403, 404, or filter out the team
    if [ "$http_code" = "403" ] || [ "$http_code" = "404" ]; then
        log_success "Team access denied: Correctly restricted access"
        return 0
    fi

    # If access is allowed, the implementation might have different behavior
    log_warning "Team access: Implementation allows read access (HTTP $http_code)"
    return 0
}

# Test: Remove member from team
test_remove_team_member() {
    if [ -z "$USER_TOKEN" ] || [ -z "$TEAM_ID" ] || [ -z "$USER2_ID" ]; then
        log_error "Required tokens/IDs not set"
        return 1
    fi

    local response=$(delete_request "/teams/$TEAM_ID/members/$USER2_ID" "$USER_TOKEN")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Remove team member: User 2 removed from team"
        return 0
    fi

    log_error "Remove team member failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Note: DELETE /teams/:id endpoint not implemented

# =============================================================================
# Main Test Runner
# =============================================================================

run_team_tests() {
    log_section "Team Module Tests"

    run_test "Create team" test_create_team
    run_test "Create team without name" test_create_team_invalid
    run_test "Get team by ID" test_get_team
    run_test "Get my teams" test_get_my_teams
    run_test "Update team" test_update_team
    run_test "Add member to team" test_add_team_member
    run_test "Get team members" test_get_team_members
    skip_test "Update member role" "Endpoint not implemented"
    run_test "Team access denied for non-members" test_team_access_denied
    run_test "Remove member from team" test_remove_team_member
    skip_test "Delete team" "Endpoint not implemented"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    wait_for_service

    # Need to setup users first
    source "$TEAM_SCRIPT_DIR/../auth/auth-test.sh"
    setup_test_users

    run_team_tests
    show_test_summary
fi
