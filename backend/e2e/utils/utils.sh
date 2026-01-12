#!/bin/bash

# =============================================================================
# E2E Test Utilities
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

log_section() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# =============================================================================
# HTTP Request Functions
# =============================================================================

# Make HTTP request
# Usage: http_request METHOD ENDPOINT [DATA] [TOKEN]
http_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local url="${API_BASE_URL}${endpoint}"

    local curl_opts="-s -w '\n%{http_code}'"
    local headers="-H 'Content-Type: application/json'"

    if [ -n "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi

    local response
    case $method in
        GET)
            response=$(eval "curl $curl_opts $headers '$url'")
            ;;
        POST)
            if [ -n "$data" ]; then
                response=$(eval "curl $curl_opts $headers -X POST -d '$data' '$url'")
            else
                response=$(eval "curl $curl_opts $headers -X POST '$url'")
            fi
            ;;
        PATCH)
            response=$(eval "curl $curl_opts $headers -X PATCH -d '$data' '$url'")
            ;;
        PUT)
            response=$(eval "curl $curl_opts $headers -X PUT -d '$data' '$url'")
            ;;
        DELETE)
            response=$(eval "curl $curl_opts $headers -X DELETE '$url'")
            ;;
        *)
            log_error "Unknown HTTP method: $method"
            return 1
            ;;
    esac

    # Extract HTTP status code (last line) and body (everything else)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    # Return JSON with status code included
    if echo "$body" | jq -e . >/dev/null 2>&1; then
        echo "$body" | jq --arg code "$http_code" '. + {httpCode: $code}'
    else
        echo "{\"httpCode\": \"$http_code\", \"rawBody\": \"$body\"}"
    fi
}

# Simplified request helpers
get_request() {
    http_request GET "$1" "" "$2"
}

post_request() {
    http_request POST "$1" "$2" "$3"
}

patch_request() {
    http_request PATCH "$1" "$2" "$3"
}

delete_request() {
    http_request DELETE "$1" "" "$2"
}

# =============================================================================
# Response Parsing Functions
# =============================================================================

# Get HTTP status code from response
get_http_code() {
    echo "$1" | jq -r '.httpCode // empty'
}

# Get success status from response
get_success() {
    echo "$1" | jq -r '.success // empty'
}

# Get data from response
get_data() {
    echo "$1" | jq -r '.data // empty'
}

# Get specific field from response data
get_field() {
    local response=$1
    local field=$2
    echo "$response" | jq -r ".data.$field // empty"
}

# Get error message from response
get_error() {
    echo "$1" | jq -r '.error.message // .message // empty'
}

# Pretty print JSON
pretty_json() {
    echo "$1" | jq '.'
}

# =============================================================================
# Test Execution Functions
# =============================================================================

# Run a test function and track results
# Usage: run_test "Test Name" test_function
run_test() {
    local test_name=$1
    local test_func=$2

    ((TESTS_TOTAL++))

    log_info "Running: $test_name"

    if $test_func; then
        ((TESTS_PASSED++))
        return 0
    else
        ((TESTS_FAILED++))
        return 1
    fi
}

# Skip a test
skip_test() {
    local test_name=$1
    local reason=$2

    ((TESTS_TOTAL++))
    ((TESTS_SKIPPED++))

    log_warning "Skipped: $test_name - $reason"
}

# Assert equal
assert_equals() {
    local expected=$1
    local actual=$2
    local message=${3:-"Values should be equal"}

    if [ "$expected" = "$actual" ]; then
        return 0
    else
        log_error "$message: expected '$expected', got '$actual'"
        return 1
    fi
}

# Assert not empty
assert_not_empty() {
    local value=$1
    local message=${2:-"Value should not be empty"}

    if [ -n "$value" ] && [ "$value" != "null" ]; then
        return 0
    else
        log_error "$message: value is empty or null"
        return 1
    fi
}

# Assert HTTP status code
assert_http_code() {
    local response=$1
    local expected_code=$2
    local message=${3:-"HTTP status code check"}

    local actual_code=$(get_http_code "$response")
    assert_equals "$expected_code" "$actual_code" "$message"
}

# Assert success response
assert_success() {
    local response=$1
    local message=${2:-"Response should be successful"}

    local success=$(get_success "$response")
    if [ "$success" = "true" ]; then
        return 0
    else
        log_error "$message: success is not true"
        log_debug "Response: $(pretty_json "$response")"
        return 1
    fi
}

# =============================================================================
# Service Health Functions
# =============================================================================

# Wait for service to be ready
wait_for_service() {
    local max_attempts=${1:-30}
    local attempt=1

    log_info "Waiting for service at $API_BASE_URL..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s "${API_BASE_URL}/auth/login" -X POST -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1; then
            log_success "Service is ready!"
            return 0
        fi

        log_debug "Attempt $attempt/$max_attempts - Service not ready yet..."
        sleep 1
        ((attempt++))
    done

    log_error "Service did not become ready within $max_attempts seconds"
    return 1
}

# =============================================================================
# Error Handling
# =============================================================================

set_error_handler() {
    set -E
    trap 'log_error "Error occurred in ${FUNCNAME[0]:-main} at line ${LINENO}"' ERR
}

# =============================================================================
# Test Summary
# =============================================================================

show_test_summary() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} Test Summary${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "Total:   ${TESTS_TOTAL}"
    echo -e "${GREEN}Passed:  ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed:  ${TESTS_FAILED}${NC}"
    echo -e "${YELLOW}Skipped: ${TESTS_SKIPPED}${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        return 1
    fi
}

# =============================================================================
# Cleanup Functions
# =============================================================================

# Cleanup test data (to be implemented per module)
cleanup_test_data() {
    log_info "Cleaning up test data..."
    # Override in specific test files if needed
}
