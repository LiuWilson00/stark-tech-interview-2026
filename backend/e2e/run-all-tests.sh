#!/bin/bash

# =============================================================================
# E2E Test Runner - Run All Tests
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load configuration and utilities
source "$SCRIPT_DIR/config/test.config.sh"
source "$SCRIPT_DIR/utils/utils.sh"

# =============================================================================
# Command Line Arguments
# =============================================================================

SKIP_AUTH=false
SKIP_USER=false
SKIP_TEAM=false
SKIP_TASK=false
SKIP_COMMENT=false
SKIP_HISTORY=false
DEBUG=false

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-auth      Skip auth module tests"
    echo "  --skip-user      Skip user module tests"
    echo "  --skip-team      Skip team module tests"
    echo "  --skip-task      Skip task module tests"
    echo "  --skip-comment   Skip comment module tests"
    echo "  --skip-history   Skip history module tests"
    echo "  --debug          Enable debug output"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_BASE_URL     Base URL for the API (default: http://localhost:3011/api)"
    echo "  DEBUG            Enable debug output (true/false)"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-auth)
            SKIP_AUTH=true
            shift
            ;;
        --skip-user)
            SKIP_USER=true
            shift
            ;;
        --skip-team)
            SKIP_TEAM=true
            shift
            ;;
        --skip-task)
            SKIP_TASK=true
            shift
            ;;
        --skip-comment)
            SKIP_COMMENT=true
            shift
            ;;
        --skip-history)
            SKIP_HISTORY=true
            shift
            ;;
        --debug)
            DEBUG=true
            export DEBUG
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# =============================================================================
# Main Test Execution
# =============================================================================

main() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                     E2E Test Suite                             ║${NC}"
    echo -e "${CYAN}║              TodoList Application Backend                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    log_info "API Base URL: $API_BASE_URL"
    log_info "Starting test execution..."
    echo ""

    # Wait for service to be ready
    if ! wait_for_service 30; then
        log_error "Service is not available. Please start the backend server first."
        exit 1
    fi

    # Load test modules
    source "$SCRIPT_DIR/auth/auth-test.sh"
    source "$SCRIPT_DIR/user/user-test.sh"
    source "$SCRIPT_DIR/team/team-test.sh"
    source "$SCRIPT_DIR/task/task-test.sh"
    source "$SCRIPT_DIR/comment/comment-test.sh"
    source "$SCRIPT_DIR/history/history-test.sh"

    # Run Auth Tests (always run first to setup users)
    if [ "$SKIP_AUTH" = false ]; then
        run_auth_tests
    else
        log_warning "Skipping Auth tests"
        # Still need to setup test users for other tests
        setup_test_users
    fi

    # Run User Tests
    if [ "$SKIP_USER" = false ]; then
        run_user_tests
    else
        log_warning "Skipping User tests"
    fi

    # Run Team Tests (creates TEAM_ID for task tests)
    if [ "$SKIP_TEAM" = false ]; then
        run_team_tests
    else
        log_warning "Skipping Team tests"
        # Create a team for task tests if skipping team tests
        if [ "$SKIP_TASK" = false ]; then
            test_create_team
        fi
    fi

    # Run Task Tests (creates TASK_ID for comment and history tests)
    if [ "$SKIP_TASK" = false ]; then
        run_task_tests
    else
        log_warning "Skipping Task tests"
        # Create a task for comment/history tests if skipping task tests
        if [ "$SKIP_COMMENT" = false ] || [ "$SKIP_HISTORY" = false ]; then
            test_create_personal_task
        fi
    fi

    # Run Comment Tests
    if [ "$SKIP_COMMENT" = false ]; then
        run_comment_tests
    else
        log_warning "Skipping Comment tests"
    fi

    # Run History Tests
    if [ "$SKIP_HISTORY" = false ]; then
        run_history_tests
    else
        log_warning "Skipping History tests"
    fi

    # Show final summary
    show_test_summary

    # Return exit code based on test results
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main
