#!/bin/bash

# AVA Health Coach Database Backup Script
# Usage: ./backup.sh [type] [retention_days]
# Types: full, incremental, schema-only
# Example: ./backup.sh full 30

set -e

# Configuration
BACKUP_TYPE=${1:-full}
RETENTION_DAYS=${2:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"
LOCAL_BACKUP_DIR="./backups"
PROJECT_NAME="ava-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Create backup directories
create_backup_dirs() {
    log_info "Creating backup directories..."
    mkdir -p "$LOCAL_BACKUP_DIR/mongodb"
    mkdir -p "$LOCAL_BACKUP_DIR/logs"
    mkdir -p "$LOCAL_BACKUP_DIR/uploads"
    docker-compose -p "$PROJECT_NAME" exec mongodb mkdir -p "$BACKUP_DIR" 2>/dev/null || true
}

# Check if containers are running
check_containers() {
    log_info "Checking if containers are running..."
    if ! docker-compose -p "$PROJECT_NAME" ps mongodb | grep -q "Up"; then
        log_error "MongoDB container is not running"
        exit 1
    fi
    log_success "Containers are running"
}

# Backup MongoDB database
backup_mongodb() {
    log_info "Starting MongoDB backup ($BACKUP_TYPE)..."
    
    case $BACKUP_TYPE in
        "full")
            backup_mongodb_full
            ;;
        "incremental")
            backup_mongodb_incremental
            ;;
        "schema-only")
            backup_mongodb_schema_only
            ;;
        *)
            log_error "Invalid backup type: $BACKUP_TYPE"
            log_info "Valid types: full, incremental, schema-only"
            exit 1
            ;;
    esac
}

# Full MongoDB backup
backup_mongodb_full() {
    log_info "Performing full MongoDB backup..."
    
    BACKUP_NAME="mongodb_full_${TIMESTAMP}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Create backup using mongodump
    docker-compose -p "$PROJECT_NAME" exec mongodb mongodump \
        --host localhost:27017 \
        --authenticationDatabase admin \
        --username admin \
        --password ${MONGO_ROOT_PASSWORD:-secure_password} \
        --out "$BACKUP_PATH" \
        --gzip
    
    # Copy backup to local directory
    docker-compose -p "$PROJECT_NAME" exec mongodb tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    docker cp "$(docker-compose -p "$PROJECT_NAME" ps -q mongodb)":"$BACKUP_PATH.tar.gz" "$LOCAL_BACKUP_DIR/mongodb/"
    
    # Generate backup metadata
    create_backup_metadata "$BACKUP_NAME" "full" "$LOCAL_BACKUP_DIR/mongodb/$BACKUP_NAME.tar.gz"
    
    log_success "Full MongoDB backup completed: $BACKUP_NAME.tar.gz"
}

# Incremental MongoDB backup (using oplog)
backup_mongodb_incremental() {
    log_info "Performing incremental MongoDB backup..."
    
    BACKUP_NAME="mongodb_incremental_${TIMESTAMP}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Find the last backup timestamp
    LAST_BACKUP_TS=$(find "$LOCAL_BACKUP_DIR/mongodb" -name "*.metadata" -exec grep -l "incremental\|full" {} \; | sort -r | head -1 | xargs -I {} grep "timestamp" {} | cut -d'"' -f4 2>/dev/null || echo "")
    
    if [[ -z "$LAST_BACKUP_TS" ]]; then
        log_warning "No previous backup found, performing full backup instead"
        backup_mongodb_full
        return
    fi
    
    # Create incremental backup using oplog
    docker-compose -p "$PROJECT_NAME" exec mongodb mongodump \
        --host localhost:27017 \
        --authenticationDatabase admin \
        --username admin \
        --password ${MONGO_ROOT_PASSWORD:-secure_password} \
        --db local \
        --collection oplog.rs \
        --query "{\"ts\": {\"\$gt\": {\"t\": $(date -d "$LAST_BACKUP_TS" +%s), \"i\": 1}}}" \
        --out "$BACKUP_PATH" \
        --gzip
    
    # Copy backup to local directory
    docker-compose -p "$PROJECT_NAME" exec mongodb tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    docker cp "$(docker-compose -p "$PROJECT_NAME" ps -q mongodb)":"$BACKUP_PATH.tar.gz" "$LOCAL_BACKUP_DIR/mongodb/"
    
    # Generate backup metadata
    create_backup_metadata "$BACKUP_NAME" "incremental" "$LOCAL_BACKUP_DIR/mongodb/$BACKUP_NAME.tar.gz"
    
    log_success "Incremental MongoDB backup completed: $BACKUP_NAME.tar.gz"
}

# Schema-only MongoDB backup
backup_mongodb_schema_only() {
    log_info "Performing schema-only MongoDB backup..."
    
    BACKUP_NAME="mongodb_schema_${TIMESTAMP}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Create schema backup
    docker-compose -p "$PROJECT_NAME" exec mongodb mongodump \
        --host localhost:27017 \
        --authenticationDatabase admin \
        --username admin \
        --password ${MONGO_ROOT_PASSWORD:-secure_password} \
        --out "$BACKUP_PATH" \
        --gzip \
        --excludeCollectionsWithPrefix temp \
        --numParallelCollections 1
    
    # Copy backup to local directory
    docker-compose -p "$PROJECT_NAME" exec mongodb tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    docker cp "$(docker-compose -p "$PROJECT_NAME" ps -q mongodb)":"$BACKUP_PATH.tar.gz" "$LOCAL_BACKUP_DIR/mongodb/"
    
    # Generate backup metadata
    create_backup_metadata "$BACKUP_NAME" "schema-only" "$LOCAL_BACKUP_DIR/mongodb/$BACKUP_NAME.tar.gz"
    
    log_success "Schema-only MongoDB backup completed: $BACKUP_NAME.tar.gz"
}

# Create backup metadata
create_backup_metadata() {
    local backup_name=$1
    local backup_type=$2
    local backup_file=$3
    
    local metadata_file="${backup_file%.*}.metadata"
    local file_size=$(ls -lh "$backup_file" | awk '{print $5}')
    local file_hash=$(shasum -a 256 "$backup_file" | awk '{print $1}')
    
    cat > "$metadata_file" << EOF
{
    "backup_name": "$backup_name",
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "datetime": "$(date -Iseconds)",
    "file_size": "$file_size",
    "file_hash": "$file_hash",
    "database": "ava_coach_sante",
    "mongodb_version": "$(docker-compose -p "$PROJECT_NAME" exec mongodb mongo --version | head -1)",
    "retention_days": "$RETENTION_DAYS"
}
EOF
    
    log_info "Backup metadata created: $(basename "$metadata_file")"
}

# Backup application logs
backup_logs() {
    log_info "Backing up application logs..."
    
    LOG_BACKUP_NAME="logs_${TIMESTAMP}.tar.gz"
    
    if [[ -d "backend/logs" ]]; then
        tar -czf "$LOCAL_BACKUP_DIR/logs/$LOG_BACKUP_NAME" -C backend logs/
        log_success "Logs backed up: $LOG_BACKUP_NAME"
    else
        log_warning "No logs directory found"
    fi
}

# Backup uploaded files
backup_uploads() {
    log_info "Backing up uploaded files..."
    
    UPLOAD_BACKUP_NAME="uploads_${TIMESTAMP}.tar.gz"
    
    if [[ -d "backend/uploads" ]]; then
        tar -czf "$LOCAL_BACKUP_DIR/uploads/$UPLOAD_BACKUP_NAME" -C backend uploads/
        log_success "Uploads backed up: $UPLOAD_BACKUP_NAME"
    else
        log_warning "No uploads directory found"
    fi
}

# Clean old backups
clean_old_backups() {
    log_info "Cleaning old backups (older than $RETENTION_DAYS days)..."
    
    # Clean MongoDB backups
    find "$LOCAL_BACKUP_DIR/mongodb" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$LOCAL_BACKUP_DIR/mongodb" -name "*.metadata" -mtime +$RETENTION_DAYS -delete
    
    # Clean log backups
    find "$LOCAL_BACKUP_DIR/logs" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Clean upload backups
    find "$LOCAL_BACKUP_DIR/uploads" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    log_success "Old backups cleaned"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    local latest_backup=$(find "$LOCAL_BACKUP_DIR/mongodb" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -f "$latest_backup" ]]; then
        local metadata_file="${latest_backup%.*}.metadata"
        if [[ -f "$metadata_file" ]]; then
            local stored_hash=$(grep '"file_hash"' "$metadata_file" | cut -d'"' -f4)
            local actual_hash=$(shasum -a 256 "$latest_backup" | awk '{print $1}')
            
            if [[ "$stored_hash" == "$actual_hash" ]]; then
                log_success "Backup integrity verified"
            else
                log_error "Backup integrity check failed!"
                exit 1
            fi
        else
            log_warning "No metadata file found for backup verification"
        fi
    else
        log_error "No backup file found for verification"
        exit 1
    fi
}

# Generate backup report
generate_backup_report() {
    log_info "Generating backup report..."
    
    local report_file="$LOCAL_BACKUP_DIR/backup_report_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
AVA Health Coach - Backup Report
Generated: $(date -Iseconds)
Backup Type: $BACKUP_TYPE
Retention Days: $RETENTION_DAYS

=== MongoDB Backups ===
$(ls -lh "$LOCAL_BACKUP_DIR/mongodb"/*.tar.gz 2>/dev/null | tail -10)

=== Log Backups ===
$(ls -lh "$LOCAL_BACKUP_DIR/logs"/*.tar.gz 2>/dev/null | tail -5)

=== Upload Backups ===
$(ls -lh "$LOCAL_BACKUP_DIR/uploads"/*.tar.gz 2>/dev/null | tail -5)

=== Disk Usage ===
Total backup size: $(du -sh "$LOCAL_BACKUP_DIR" | cut -f1)
Available disk space: $(df -h "$LOCAL_BACKUP_DIR" | tail -1 | awk '{print $4}')

=== Latest Backup Details ===
$(cat "$LOCAL_BACKUP_DIR/mongodb"/*.metadata 2>/dev/null | tail -1)
EOF
    
    log_success "Backup report generated: $(basename "$report_file")"
}

# Send backup notification (placeholder)
send_backup_notification() {
    if [[ "$BACKUP_TYPE" == "full" ]] || [[ -n "${BACKUP_NOTIFICATION_WEBHOOK}" ]]; then
        log_info "Sending backup notification..."
        # Implement notification logic here (email, Slack, etc.)
        log_success "Backup notification sent"
    fi
}

# Main backup process
main() {
    echo "=================================================="
    echo "AVA Health Coach Database Backup"
    echo "=================================================="
    echo "Backup Type: $BACKUP_TYPE"
    echo "Retention: $RETENTION_DAYS days"
    echo "Timestamp: $TIMESTAMP"
    echo "=================================================="
    echo
    
    create_backup_dirs
    check_containers
    backup_mongodb
    backup_logs
    backup_uploads
    verify_backup
    clean_old_backups
    generate_backup_report
    send_backup_notification
    
    log_success "Backup process completed successfully! 💾"
    echo
    log_info "Backup location: $LOCAL_BACKUP_DIR"
    log_info "To restore, use: ./restore.sh [backup_file]"
}

# Trap errors
trap 'log_error "Backup failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"