#!/bin/bash

# AVA Health Coach Application Deployment Script
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.2.0

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
APP_NAME="ava-health-coach"
COMPOSE_FILE="docker-compose.yml"
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

# Check if environment is valid
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Valid environments: development, staging, production"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "backend/.env.${ENVIRONMENT}" ]]; then
        log_error "Environment file backend/.env.${ENVIRONMENT} does not exist"
        log_info "Please create it from the template: backend/.env.${ENVIRONMENT}.template"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Backup current deployment
backup_deployment() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating backup of current deployment..."
        
        # Create backup directory
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Export current environment variables
        if [[ -f "backend/.env.${ENVIRONMENT}" ]]; then
            cp "backend/.env.${ENVIRONMENT}" "$BACKUP_DIR/"
        fi
        
        # Create database backup
        docker-compose exec mongodb mongodump --out "/backup/$(date +%Y%m%d_%H%M%S)" || log_warning "Database backup failed"
        
        log_success "Backup created in $BACKUP_DIR"
    fi
}

# Validate configuration
validate_configuration() {
    log_info "Validating configuration..."
    
    # Copy environment file
    cp "backend/.env.${ENVIRONMENT}" "backend/.env"
    
    # Run environment validation
    cd backend
    if node -e "require('./src/config/env-validator').validateAndExit()"; then
        log_success "Configuration validation passed"
    else
        log_error "Configuration validation failed"
        exit 1
    fi
    cd ..
}

# Build Docker images
build_images() {
    log_info "Building Docker images for $ENVIRONMENT environment..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t "${APP_NAME}-backend:${VERSION}" \
                 -t "${APP_NAME}-backend:latest" \
                 ./backend
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t "${APP_NAME}-frontend:${VERSION}" \
                 -t "${APP_NAME}-frontend:latest" \
                 ./frontend
    
    log_success "Docker images built successfully"
}

# Deploy application
deploy_application() {
    log_info "Deploying $APP_NAME to $ENVIRONMENT environment..."
    
    # Set environment variables for docker-compose
    export NODE_ENV="$ENVIRONMENT"
    export VERSION="$VERSION"
    
    # Choose the right profile based on environment
    PROFILES=""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        PROFILES="--profile production --profile monitoring"
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        PROFILES="--profile monitoring"
    fi
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -p "$PROJECT_NAME" down --remove-orphans
    
    # Start new deployment
    log_info "Starting new deployment..."
    docker-compose -p "$PROJECT_NAME" up -d $PROFILES
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check if backend is responding
    for i in {1..30}; do
        if curl -f -s http://localhost:5003/health > /dev/null; then
            log_success "Backend is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "Backend failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Check if frontend is responding
    for i in {1..30}; do
        if curl -f -s http://localhost:80/health > /dev/null; then
            log_success "Frontend is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "Frontend failed to start"
            exit 1
        fi
        sleep 2
    done
    
    log_success "Application deployed successfully"
}

# Run post-deployment tests
run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    # Health check tests
    if curl -f -s http://localhost:5003/health | grep -q "healthy"; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # API availability test
    if curl -f -s http://localhost:5003/api/user/check | grep -q "message"; then
        log_success "API availability test passed"
    else
        log_warning "API availability test failed - this might be normal for protected endpoints"
    fi
    
    # Database connectivity test
    if docker-compose -p "$PROJECT_NAME" exec -T backend node -e "
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => { console.log('Database connected'); process.exit(0); })
            .catch(() => { console.log('Database connection failed'); process.exit(1); });
    "; then
        log_success "Database connectivity test passed"
    else
        log_error "Database connectivity test failed"
        exit 1
    fi
    
    log_success "Post-deployment tests completed"
}

# Show deployment status
show_deployment_status() {
    log_info "Deployment Status:"
    echo
    docker-compose -p "$PROJECT_NAME" ps
    echo
    log_info "Application URLs:"
    echo "  Frontend: http://localhost:80"
    echo "  Backend API: http://localhost:5003"
    echo "  Health Check: http://localhost:5003/health"
    if [[ "$ENVIRONMENT" != "development" ]]; then
        echo "  Prometheus: http://localhost:9090"
        echo "  Grafana: http://localhost:3000"
    fi
    echo
    log_info "Logs can be viewed with: docker-compose -p $PROJECT_NAME logs -f [service]"
}

# Main deployment process
main() {
    echo "=================================================="
    echo "AVA Health Coach Deployment Script"
    echo "=================================================="
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "=================================================="
    echo
    
    validate_environment
    check_prerequisites
    backup_deployment
    validate_configuration
    build_images
    deploy_application
    run_post_deployment_tests
    show_deployment_status
    
    log_success "Deployment completed successfully! 🚀"
}

# Trap errors and cleanup
trap 'log_error "Deployment failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"