#!/bin/bash

# Setup automated backup cron job for AVA Health Coach
# Usage: ./setup-backup-cron.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Valid environments: development, staging, production"
    exit 1
fi

log_info "Setting up backup cron jobs for $ENVIRONMENT environment..."

# Create backup cron job content based on environment
create_cron_jobs() {
    local cron_file="/tmp/ava-backup-cron"
    
    case $ENVIRONMENT in
        "production")
            cat > "$cron_file" << EOF
# AVA Health Coach Production Backup Jobs
# Full backup daily at 2:00 AM
0 2 * * * cd $APP_DIR && $SCRIPT_DIR/backup.sh full 30 >> /var/log/ava-backup.log 2>&1

# Incremental backup every 6 hours
0 */6 * * * cd $APP_DIR && $SCRIPT_DIR/backup.sh incremental 7 >> /var/log/ava-backup.log 2>&1

# Weekly schema backup on Sundays at 1:00 AM
0 1 * * 0 cd $APP_DIR && $SCRIPT_DIR/backup.sh schema-only 90 >> /var/log/ava-backup.log 2>&1
EOF
            ;;
        "staging")
            cat > "$cron_file" << EOF
# AVA Health Coach Staging Backup Jobs
# Full backup daily at 3:00 AM
0 3 * * * cd $APP_DIR && $SCRIPT_DIR/backup.sh full 7 >> /var/log/ava-backup.log 2>&1

# Weekly incremental backup
0 3 * * 0 cd $APP_DIR && $SCRIPT_DIR/backup.sh incremental 3 >> /var/log/ava-backup.log 2>&1
EOF
            ;;
        "development")
            cat > "$cron_file" << EOF
# AVA Health Coach Development Backup Jobs
# Full backup weekly on Saturdays at 4:00 AM
0 4 * * 6 cd $APP_DIR && $SCRIPT_DIR/backup.sh full 3 >> /var/log/ava-backup.log 2>&1
EOF
            ;;
    esac
    
    echo "$cron_file"
}

# Setup log rotation
setup_log_rotation() {
    log_info "Setting up log rotation for backup logs..."
    
    local logrotate_file="/tmp/ava-backup-logrotate"
    
    cat > "$logrotate_file" << EOF
/var/log/ava-backup.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 644 root root
    postrotate
        # Clean up old backup files if needed
        find $APP_DIR/backups -name "*.tar.gz" -mtime +90 -delete
    endscript
}
EOF
    
    # Install logrotate configuration
    if [[ -w "/etc/logrotate.d" ]]; then
        sudo cp "$logrotate_file" "/etc/logrotate.d/ava-backup"
        log_success "Log rotation configured"
    else
        log_warning "Cannot write to /etc/logrotate.d - manual setup required"
        log_info "Logrotate config created at: $logrotate_file"
    fi
    
    rm -f "$logrotate_file"
}

# Create monitoring script
create_monitoring_script() {
    log_info "Creating backup monitoring script..."
    
    local monitor_script="$SCRIPT_DIR/monitor-backups.sh"
    
    cat > "$monitor_script" << '#!/bin/bash
#!/bin/bash

# AVA Health Coach Backup Monitoring Script
# Checks backup status and sends alerts if needed

BACKUP_DIR="./backups"
MAX_AGE_HOURS=48  # Alert if no backup in last 48 hours
ALERT_EMAIL=""    # Set email for alerts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_recent_backups() {
    local latest_backup=$(find "$BACKUP_DIR/mongodb" -name "*.tar.gz" -type f -newermt "-${MAX_AGE_HOURS} hours" 2>/dev/null | head -1)
    
    if [[ -z "$latest_backup" ]]; then
        echo -e "${RED}[ALERT]${NC} No recent backups found (within $MAX_AGE_HOURS hours)"
        return 1
    else
        echo -e "${GREEN}[OK]${NC} Recent backup found: $(basename "$latest_backup")"
        return 0
    fi
}

check_backup_integrity() {
    local latest_backup=$(find "$BACKUP_DIR/mongodb" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    local metadata_file="${latest_backup%.*}.metadata"
    
    if [[ -f "$metadata_file" ]]; then
        local stored_hash=$(grep '"file_hash"' "$metadata_file" | cut -d'"' -f4)
        local actual_hash=$(shasum -a 256 "$latest_backup" | awk '{print $1}')
        
        if [[ "$stored_hash" == "$actual_hash" ]]; then
            echo -e "${GREEN}[OK]${NC} Latest backup integrity verified"
            return 0
        else
            echo -e "${RED}[ALERT]${NC} Latest backup integrity check failed"
            return 1
        fi
    else
        echo -e "${YELLOW}[WARNING]${NC} No metadata file for integrity check"
        return 1
    fi
}

check_disk_space() {
    local backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local available_space=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    
    echo -e "${GREEN}[INFO]${NC} Backup directory size: $backup_size"
    echo -e "${GREEN}[INFO]${NC} Available space: $available_space"
    
    # Check if less than 1GB free space
    local available_bytes=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    if [[ $available_bytes -lt 1048576 ]]; then  # 1GB in KB
        echo -e "${RED}[ALERT]${NC} Low disk space: $available_space available"
        return 1
    fi
    
    return 0
}

send_alert() {
    local message="$1"
    
    if [[ -n "$ALERT_EMAIL" ]]; then
        echo "$message" | mail -s "AVA Health Coach Backup Alert" "$ALERT_EMAIL"
    fi
    
    # Log to system log
    logger -t "ava-backup-monitor" "$message"
}

main() {
    echo "AVA Health Coach Backup Monitor - $(date)"
    echo "================================="
    
    local alerts=0
    
    if ! check_recent_backups; then
        send_alert "No recent backups found within $MAX_AGE_HOURS hours"
        ((alerts++))
    fi
    
    if ! check_backup_integrity; then
        send_alert "Backup integrity check failed"
        ((alerts++))
    fi
    
    if ! check_disk_space; then
        send_alert "Low disk space for backups"
        ((alerts++))
    fi
    
    if [[ $alerts -eq 0 ]]; then
        echo -e "${GREEN}[OK]${NC} All backup checks passed"
    else
        echo -e "${RED}[ALERT]${NC} $alerts issue(s) detected"
    fi
    
    return $alerts
}

main "$@"
EOF

    chmod +x "$monitor_script"
    log_success "Backup monitoring script created: $monitor_script"
}

# Install cron jobs
install_cron_jobs() {
    local cron_file=$(create_cron_jobs)
    
    log_info "Installing cron jobs..."
    
    # Backup existing crontab
    crontab -l > /tmp/crontab.backup 2>/dev/null || true
    
    # Remove existing AVA backup jobs
    (crontab -l 2>/dev/null | grep -v "AVA Health Coach.*Backup" || true) | crontab -
    
    # Add new backup jobs
    (crontab -l 2>/dev/null; cat "$cron_file") | crontab -
    
    # Add monitoring job (daily at 9 AM)
    (crontab -l 2>/dev/null; echo "0 9 * * * cd $APP_DIR && $SCRIPT_DIR/monitor-backups.sh >> /var/log/ava-backup-monitor.log 2>&1") | crontab -
    
    rm -f "$cron_file"
    
    log_success "Cron jobs installed successfully"
    
    # Show installed jobs
    log_info "Current cron jobs:"
    crontab -l | grep -A 5 -B 5 "AVA Health Coach\|ava-backup\|monitor-backups" || echo "  No AVA backup jobs found"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$APP_DIR/backups/mongodb"
    mkdir -p "$APP_DIR/backups/logs"
    mkdir -p "$APP_DIR/backups/uploads"
    mkdir -p "$APP_DIR/backups/pre-restore"
    
    # Create log directory
    sudo mkdir -p /var/log
    sudo touch /var/log/ava-backup.log
    sudo touch /var/log/ava-backup-monitor.log
    
    log_success "Directories created"
}

# Test backup script
test_backup() {
    log_info "Testing backup script..."
    
    if [[ -x "$SCRIPT_DIR/backup.sh" ]]; then
        log_info "Running test backup (schema-only)..."
        if cd "$APP_DIR" && "$SCRIPT_DIR/backup.sh" schema-only 1; then
            log_success "Test backup completed successfully"
        else
            log_error "Test backup failed"
            return 1
        fi
    else
        log_error "Backup script not found or not executable: $SCRIPT_DIR/backup.sh"
        return 1
    fi
}

# Main setup process
main() {
    echo "=================================================="
    echo "AVA Health Coach Backup Automation Setup"
    echo "=================================================="
    echo "Environment: $ENVIRONMENT"
    echo "App Directory: $APP_DIR"
    echo "Script Directory: $SCRIPT_DIR"
    echo "=================================================="
    echo
    
    create_directories
    setup_log_rotation
    create_monitoring_script
    install_cron_jobs
    test_backup
    
    log_success "Backup automation setup completed! 📅"
    echo
    log_info "Backup schedules configured for $ENVIRONMENT environment"
    log_info "Logs will be written to /var/log/ava-backup.log"
    log_info "Monitor backup status with: $SCRIPT_DIR/monitor-backups.sh"
    echo
    log_info "To view scheduled backups: crontab -l"
    log_info "To remove backup automation: crontab -e (then delete AVA backup lines)"
}

# Trap errors
trap 'log_error "Setup failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"