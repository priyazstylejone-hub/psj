#!/bin/bash

# Configuration
SCRIPT_DIR="/workspaces/psj"
PYTHON_SCRIPT="fetch_google_sheet.py"
LOG_FILE="sync_service.log"
UPDATE_INTERVAL=3600  # 1 hour in seconds

# Function to check if python script is running
is_running() {
    pgrep -f "python3 $PYTHON_SCRIPT" > /dev/null
    return $?
}

# Function to log messages with colors
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local msg="$1"
    local level="${2:-INFO}"  # Default to INFO
    
    # ANSI color codes
    local GREEN='\033[0;32m'
    local RED='\033[0;31m'
    local YELLOW='\033[1;33m'
    local NC='\033[0m'  # No Color
    
    # Choose color based on level
    case $level in
        "ERROR")
            color=$RED
            ;;
        "WARNING")
            color=$YELLOW
            ;;
        "SUCCESS")
            color=$GREEN
            ;;
        *)
            color=$NC
            ;;
    esac
    
    # Log to file (without color)
    echo "$timestamp - [$level] $msg" >> "$LOG_FILE"
    
    # Log to console (with color)
    echo -e "$timestamp - ${color}[$level]${NC} $msg"
}

# Function to cleanup on exit
cleanup() {
    log_message "Stopping sync service..." "INFO"
    pkill -f "python3 $PYTHON_SCRIPT"
    exit 0
}

# Register cleanup function for signals
trap cleanup SIGINT SIGTERM

# Change to script directory and setup
cd "$SCRIPT_DIR" || {
    log_message "Failed to change to script directory: $SCRIPT_DIR" "ERROR"
    exit 1
}

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null
touch "$LOG_FILE" || {
    log_message "Failed to create log file: $LOG_FILE" "ERROR"
    exit 1
}

log_message "Starting PSJ Google Sheets sync service..."

# First, test the credentials
log_message "Testing Google Sheets credentials..."
python3 test_credentials.py
if [ $? -ne 0 ]; then
    log_message "❌ Credential test failed! Please check test_credentials.py output."
    exit 1
fi
log_message "✅ Credential test passed!"

# Function to run sync with timeout
run_sync_with_timeout() {
    local timeout=300  # 5 minutes timeout
    
    # Run the sync in background
    python3 "$PYTHON_SCRIPT" &
    local pid=$!
    
    # Wait for completion or timeout
    local count=0
    while kill -0 $pid 2>/dev/null; do
        if [ $count -ge $timeout ]; then
            kill $pid 2>/dev/null
            log_message "Sync timed out after ${timeout} seconds" "ERROR"
            return 1
        fi
        sleep 1
        ((count++))
    done
    
    # Check exit status
    wait $pid
    return $?
}

# Main loop
while true; do
    current_time=$(date +%H:%M)
    
    # Check if script is already running
    if is_running; then
        log_message "Previous sync still running, skipping this iteration" "WARNING"
    else
        log_message "Starting sheet sync..." "INFO"
        if run_sync_with_timeout; then
            log_message "Sync completed successfully" "SUCCESS"
        else
            log_message "Sync failed! Check google_sheet_sync.log for details" "ERROR"
            # Increase wait time after failure to prevent rapid retries
            sleep 300  # Wait 5 minutes before next attempt
        fi
    fi
    
    # Wait for next update
    log_message "Next sync scheduled in $((UPDATE_INTERVAL/60)) minutes" "INFO"
    sleep "$UPDATE_INTERVAL" &
    wait $!