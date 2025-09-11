#!/bin/bash

# AVA Health Coach Database Restore Script
# Usage: ./restore.sh [backup_file] [target_environment]
# Example: ./restore.sh backups/mongodb/mongodb_full_20241211_140000.tar.gz development

set -e

# Configuration
BACKUP_FILE=$1
TARGET_ENV=${2:-development}
PROJECT_NAME="ava-app"
RESTORE_DIR="/restore"

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

# Validate input parameters
validate_input() {
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file is required"
        log_info "Usage: ./restore.sh [backup_file] [target_environment]"
        log_info "Available backups:"
        ls -la backups/mongodb/*.tar.gz 2>/dev/null || echo "  No backups found"
        exit 1
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    if [[ ! "$TARGET_ENV" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid target environment: $TARGET_ENV"
        log_info "Valid environments: development, staging, production"
        exit 1
    fi
    
    log_success "Input validation passed"
}

# Verify backup integrity
verify_backup_integrity() {
    log_info "Verifying backup integrity..."
    
    local metadata_file="${BACKUP_FILE%.*}.metadata"
    
    if [[ -f "$metadata_file" ]]; then
        local stored_hash=$(grep '"file_hash"' "$metadata_file" | cut -d'"' -f4)
        local actual_hash=$(shasum -a 256 "$BACKUP_FILE" | awk '{print $1}')
        
        if [[ "$stored_hash" == "$actual_hash" ]]; then
            log_success "Backup integrity verified"
        else
            log_error "Backup integrity check failed!"
            exit 1
        fi
        
        # Show backup information
        log_info "Backup Information:"
        cat "$metadata_file" | grep -E '"backup_name"|"backup_type"|"datetime"|"file_size"' | sed 's/^/  /'
    else
        log_warning "No metadata file found, skipping integrity check"
        read -p "Continue without integrity verification? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Confirm restore operation
confirm_restore() {
    log_warning "⚠️  RESTORE OPERATION CONFIRMATION ⚠️"
    echo
    log_warning "This operation will:"
    log_warning "1. COMPLETELY REPLACE the current database"
    log_warning "2. Target environment: $TARGET_ENV"
    log_warning "3. Backup file: $(basename "$BACKUP_FILE")"
    log_warning "4. All current data will be LOST"
    echo
    
    if [[ "$TARGET_ENV" == "production" ]]; then
        log_error "Production restore requires additional confirmation!"
        read -p "Type 'RESTORE_PRODUCTION' to continue: " -r
        if [[ "$REPLY" != "RESTORE_PRODUCTION" ]]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi
    
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " -r
    if [[ "$REPLY" != "yes" ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_success "Restore operation confirmed"
}

# Check containers
check_containers() {
    log_info "Checking containers..."
    
    if ! docker-compose -p "$PROJECT_NAME" ps mongodb | grep -q "Up"; then
        log_error "MongoDB container is not running"
        log_info "Starting MongoDB container..."
        docker-compose -p "$PROJECT_NAME" up -d mongodb
        
        # Wait for MongoDB to be ready
        log_info "Waiting for MongoDB to be ready..."
        sleep 10
        
        for i in {1..30}; do
            if docker-compose -p "$PROJECT_NAME" exec mongodb mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
                log_success "MongoDB is ready"
                break
            fi
            if [[ $i -eq 30 ]]; then
                log_error "MongoDB failed to start"
                exit 1
            fi
            sleep 2
        done
    fi
}

# Create pre-restore backup
create_pre_restore_backup() {
    if [[ "$TARGET_ENV" == "production" ]]; then
        log_info "Creating pre-restore backup..."
        
        local pre_restore_name="pre_restore_$(date +%Y%m%d_%H%M%S)"
        local pre_restore_dir="./backups/pre-restore"
        
        mkdir -p "$pre_restore_dir"
        
        docker-compose -p "$PROJECT_NAME" exec mongodb mongodump \
            --host localhost:27017 \
            --authenticationDatabase admin \
            --username admin \
            --password ${MONGO_ROOT_PASSWORD:-secure_password} \
            --out "/backup/$pre_restore_name" \
            --gzip
        
        docker-compose -p "$PROJECT_NAME" exec mongodb tar -czf "/backup/$pre_restore_name.tar.gz" -C "/backup" "$pre_restore_name"
        docker cp "$(docker-compose -p "$PROJECT_NAME" ps -q mongodb):/backup/$pre_restore_name.tar.gz" "$pre_restore_dir/"
        
        log_success "Pre-restore backup created: $pre_restore_dir/$pre_restore_name.tar.gz"
    else
        log_info "Skipping pre-restore backup for $TARGET_ENV environment"
    fi
}

# Perform restore
perform_restore() {
    log_info "Starting database restore..."
    
    # Copy backup file to container
    local backup_filename=$(basename "$BACKUP_FILE")
    local container_backup_path="/tmp/$backup_filename"
    
    docker cp "$BACKUP_FILE" "$(docker-compose -p "$PROJECT_NAME" ps -q mongodb):$container_backup_path"
    
    # Extract backup
    docker-compose -p "$PROJECT_NAME" exec mongodb bash -c "cd /tmp && tar -xzf $backup_filename"
    
    local extracted_dir_name=$(basename "$BACKUP_FILE" .tar.gz)
    local extracted_path="/tmp/$extracted_dir_name"
    
    # Drop existing database (with confirmation)
    log_warning "Dropping existing database..."
    docker-compose -p "$PROJECT_NAME" exec mongodb mongo \
        --authenticationDatabase admin \
        --username admin \
        --password ${MONGO_ROOT_PASSWORD:-secure_password} \
        --eval "db.getSiblingDB('ava_coach_sante').dropDatabase()"
    
    # Restore database
    log_info "Restoring database from backup..."
    docker-compose -p "$PROJECT_NAME" exec mongodb mongorestore \
        --host localhost:27017 \
        --authenticationDatabase admin \
        --username admin \
        --password ${MONGO_ROOT_PASSWORD:-secure_password} \
        --gzip \
        --dir "$extracted_path"
    
    # Clean up temporary files
    docker-compose -p "$PROJECT_NAME" exec mongodb rm -rf "$container_backup_path" "$extracted_path"
    
    log_success "Database restore completed"
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."
    
    # Check if database exists and has collections
    local collection_count=$(docker-compose -p "$PROJECT_NAME" exec mongodb mongo \
        --authenticationDatabase admin \
        --username admin \
        --password ${MONGO_ROOT_PASSWORD:-secure_password} \
        ava_coach_sante \
        --quiet \
        --eval "db.stats().collections" 2>/dev/null || echo "0")
    
    if [[ "$collection_count" -gt 0 ]]; then
        log_success "Restore verification passed - $collection_count collections found"
        
        # Show collection statistics
        log_info "Collection statistics:"
        docker-compose -p "$PROJECT_NAME" exec mongodb mongo \
            --authenticationDatabase admin \
            --username admin \
            --password ${MONGO_ROOT_PASSWORD:-secure_password} \
            ava_coach_sante \
            --quiet \
            --eval "
                db.getCollectionNames().forEach(function(collection) {
                    var count = db[collection].count();
                    print(collection + ': ' + count + ' documents');
                });
            " 2>/dev/null | head -10
    else
        log_error "Restore verification failed - no collections found"
        exit 1
    fi
}

# Update application configuration
update_app_configuration() {
    log_info "Updating application configuration for $TARGET_ENV..."
    
    # Copy appropriate environment file
    if [[ -f "backend/.env.$TARGET_ENV" ]]; then
        cp "backend/.env.$TARGET_ENV" "backend/.env"
        log_success "Environment configuration updated"
    else
        log_warning "No environment file found for $TARGET_ENV"
    fi
    
    # Restart application containers if they're running
    if docker-compose -p "$PROJECT_NAME" ps backend | grep -q "Up"; then
        log_info "Restarting backend container..."
        docker-compose -p "$PROJECT_NAME" restart backend
    fi
}

# Generate restore report
generate_restore_report() {
    log_info "Generating restore report..."
    
    local report_file="./backups/restore_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
AVA Health Coach - Database Restore Report
Generated: $(date -Iseconds)
Backup File: $BACKUP_FILE
Target Environment: $TARGET_ENV

=== Restore Summary ===
Status: SUCCESS
Completion Time: $(date -Iseconds)

=== Backup Details ===
$(cat "${BACKUP_FILE%.*}.metadata" 2>/dev/null || echo "No metadata available")

=== Post-Restore Database Status ===
$(docker-compose -p "$PROJECT_NAME" exec mongodb mongo \
    --authenticationDatabase admin \
    --username admin \
    --password ${MONGO_ROOT_PASSWORD:-secure_password} \
    ava_coach_sante \
    --quiet \
    --eval "
        print('Database: ' + db.getName());
        print('Collections: ' + db.stats().collections);
        print('Total Size: ' + (db.stats().dataSize / 1024 / 1024).toFixed(2) + ' MB');
        print('Index Size: ' + (db.stats().indexSize / 1024 / 1024).toFixed(2) + ' MB');
    " 2>/dev/null)

=== Next Steps ===
1. Verify application functionality
2. Run application tests
3. Monitor logs for any issues
4. Update any necessary configurations
EOF
    
    log_success "Restore report generated: $(basename "$report_file")"
}

# Main restore process
main() {
    echo "=================================================="
    echo "AVA Health Coach Database Restore"
    echo "=================================================="
    echo "Backup File: $BACKUP_FILE"
    echo "Target Environment: $TARGET_ENV"
    echo "Timestamp: $(date -Iseconds)"
    echo "=================================================="
    echo
    
    validate_input
    verify_backup_integrity
    confirm_restore
    check_containers
    create_pre_restore_backup
    perform_restore
    verify_restore
    update_app_configuration
    generate_restore_report
    
    log_success "Restore process completed successfully! 🔄"
    echo
    log_info "Please verify your application functionality"
    log_info "Monitor logs: docker-compose -p $PROJECT_NAME logs -f"
}

# Trap errors
trap 'log_error "Restore failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"