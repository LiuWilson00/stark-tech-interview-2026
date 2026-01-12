#!/bin/bash

# =============================================================================
# Auth Module E2E Tests
# =============================================================================

AUTH_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Only source config/utils if not already loaded
if [ -z "$E2E_CONFIG_LOADED" ]; then
    source "$AUTH_SCRIPT_DIR/../config/test.config.sh"
    source "$AUTH_SCRIPT_DIR/../utils/utils.sh"
fi

# =============================================================================
# Test Functions
# =============================================================================

# Test: Register new user
test_register_user() {
    local email=$(generate_unique_email)
    local data="{\"email\":\"$email\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"$TEST_USER_NAME\"}"

    local response=$(post_request "/auth/register" "$data")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "201" ]; then
        local user_id=$(echo "$response" | jq -r '.data.user.id // .data.id // empty')
        if assert_not_empty "$user_id" "User ID should be returned"; then
            log_success "Register user: Created user with ID $user_id"
            return 0
        fi
    fi

    log_error "Register user failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Register with duplicate email
test_register_duplicate_email() {
    # First registration
    local email=$(generate_unique_email)
    local data="{\"email\":\"$email\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"$TEST_USER_NAME\"}"

    post_request "/auth/register" "$data" > /dev/null

    # Second registration with same email
    local response=$(post_request "/auth/register" "$data")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "409" ] || [ "$http_code" = "400" ]; then
        log_success "Register duplicate email: Correctly rejected"
        return 0
    fi

    log_error "Register duplicate email: Should have been rejected, got HTTP $http_code"
    return 1
}

# Test: Register with invalid data
test_register_invalid_data() {
    # Missing email
    local data="{\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"Test\"}"
    local response=$(post_request "/auth/register" "$data")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "400" ]; then
        log_success "Register invalid data: Correctly rejected missing email"
        return 0
    fi

    log_error "Register invalid data: Should have been rejected, got HTTP $http_code"
    return 1
}

# Test: Login with valid credentials
test_login_valid() {
    # First register a user
    local email=$(generate_unique_email)
    local data="{\"email\":\"$email\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"$TEST_USER_NAME\"}"

    post_request "/auth/register" "$data" > /dev/null

    # Then login
    local login_data="{\"email\":\"$email\",\"password\":\"$TEST_USER_PASSWORD\"}"
    local response=$(post_request "/auth/login" "$login_data")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        local access_token=$(echo "$response" | jq -r '.data.accessToken // .data.access_token // empty')
        if assert_not_empty "$access_token" "Access token should be returned"; then
            log_success "Login valid: Received access token"
            return 0
        fi
    fi

    log_error "Login valid failed with HTTP $http_code"
    log_debug "Response: $(pretty_json "$response")"
    return 1
}

# Test: Login with invalid password
test_login_invalid_password() {
    local email=$(generate_unique_email)
    local data="{\"email\":\"$email\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"$TEST_USER_NAME\"}"

    post_request "/auth/register" "$data" > /dev/null

    # Login with wrong password
    local login_data="{\"email\":\"$email\",\"password\":\"wrongpassword\"}"
    local response=$(post_request "/auth/login" "$login_data")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "401" ]; then
        log_success "Login invalid password: Correctly rejected"
        return 0
    fi

    log_error "Login invalid password: Should have been rejected with 401, got HTTP $http_code"
    return 1
}

# Test: Login with non-existent user
test_login_non_existent_user() {
    local login_data="{\"email\":\"nonexistent-$(date +%s)@example.com\",\"password\":\"password\"}"
    local response=$(post_request "/auth/login" "$login_data")
    local http_code=$(get_http_code "$response")

    if [ "$http_code" = "401" ]; then
        log_success "Login non-existent user: Correctly rejected"
        return 0
    fi

    log_error "Login non-existent user: Should have been rejected with 401, got HTTP $http_code"
    return 1
}

# Setup: Create test users and store tokens
setup_test_users() {
    log_info "Setting up test users..."

    # Register user 1 (registration returns token)
    local email1=$(generate_unique_email)
    local data1="{\"email\":\"$email1\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"$TEST_USER_NAME\"}"

    local register_response1=$(post_request "/auth/register" "$data1")
    USER_TOKEN=$(echo "$register_response1" | jq -r '.data.accessToken // .data.access_token // empty')
    USER_ID=$(echo "$register_response1" | jq -r '.data.user.id // .data.id // empty')

    # Register user 2 (registration returns token)
    local email2=$(generate_unique_email)
    local data2="{\"email\":\"$email2\",\"password\":\"$TEST_USER2_PASSWORD\",\"name\":\"$TEST_USER2_NAME\"}"

    local register_response2=$(post_request "/auth/register" "$data2")
    USER2_TOKEN=$(echo "$register_response2" | jq -r '.data.accessToken // .data.access_token // empty')
    USER2_ID=$(echo "$register_response2" | jq -r '.data.user.id // .data.id // empty')

    if [ -n "$USER_TOKEN" ] && [ "$USER_TOKEN" != "null" ] && [ -n "$USER2_TOKEN" ] && [ "$USER2_TOKEN" != "null" ]; then
        log_success "Test users created successfully (User1: $USER_ID, User2: $USER2_ID)"
        export USER_TOKEN USER_ID USER2_TOKEN USER2_ID
        return 0
    else
        log_error "Failed to setup test users"
        log_debug "User1 Token: $USER_TOKEN, User2 Token: $USER2_TOKEN"
        return 1
    fi
}

# =============================================================================
# Main Test Runner
# =============================================================================

run_auth_tests() {
    log_section "Auth Module Tests"

    run_test "Register new user" test_register_user
    run_test "Register duplicate email" test_register_duplicate_email
    run_test "Register with invalid data" test_register_invalid_data
    run_test "Login with valid credentials" test_login_valid
    run_test "Login with invalid password" test_login_invalid_password
    run_test "Login with non-existent user" test_login_non_existent_user

    # Setup test users for other modules
    setup_test_users
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    wait_for_service
    run_auth_tests
    show_test_summary
fi
