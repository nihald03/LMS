#!/bin/bash

##################################################
# LMS Deployment Script
# Usage: ./deploy.sh [staging|production]
##################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-staging}
BACKEND_APP_NAME="lms-api-${DEPLOYMENT_ENV}"
FRONTEND_PROJECT="lms-frontend-${DEPLOYMENT_ENV}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if on correct branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$DEPLOYMENT_ENV" = "production" ] && [ "$current_branch" != "main" ]; then
        log_error "Production deployment must be from 'main' branch. Currently on: $current_branch"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_error "Uncommitted changes found. Please commit or stash changes."
        exit 1
    fi
    
    # Check Node.js version
    node_version=$(node -v)
    log_success "Node.js version: $node_version"
    
    # Check npm packages
    log_info "Checking npm audit..."
    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        log_success "No critical vulnerabilities found"
    else
        log_warning "Vulnerabilities found - review before deployment"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build backend
    log_info "Building backend..."
    cd Backend
    npm install --production
    cd ..
    log_success "Backend build complete"
    
    # Build frontend
    log_info "Building frontend..."
    cd Frontend
    npm install
    npm run build
    cd ..
    log_success "Frontend build complete"
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend to $BACKEND_APP_NAME..."
    
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI not found. Please install: npm install -g heroku"
        exit 1
    fi
    
    heroku login
    git push https://git.heroku.com/$BACKEND_APP_NAME.git main
    
    log_success "Backend deployed to $BACKEND_APP_NAME"
    log_info "Backend URL: https://$BACKEND_APP_NAME.herokuapp.com"
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not found. Please install: npm install -g vercel"
        exit 1
    fi
    
    cd Frontend
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        vercel deploy --prod
    else
        vercel deploy
    fi
    
    cd ..
    log_success "Frontend deployment complete"
}

# Run smoke tests
smoke_tests() {
    log_info "Running smoke tests..."
    
    sleep 5  # Wait for deployment to be live
    
    # Test backend health
    backend_url="https://$BACKEND_APP_NAME.herokuapp.com/api/health"
    log_info "Testing backend: $backend_url"
    
    if curl -f --connect-timeout 5 "$backend_url" > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    # Test courses endpoint
    if curl -f --connect-timeout 5 "$BACKEND_APP_NAME.herokuapp.com/api/courses" > /dev/null 2>&1; then
        log_success "API /api/courses endpoint accessible"
    else
        log_warning "API /api/courses endpoint check failed"
    fi
    
    log_success "Smoke tests passed"
}

# Post-deployment tasks
post_deployment() {
    log_info "Running post-deployment tasks..."
    
    # Create git tag
    version=$(date +"%Y.%m.%d")
    git tag -a "v$version-$DEPLOYMENT_ENV" -m "Deploy $DEPLOYMENT_ENV on $TIMESTAMP"
    git push origin "v$version-$DEPLOYMENT_ENV"
    log_success "Created deployment tag: v$version-$DEPLOYMENT_ENV"
    
    # Create deployment record
    cat > deployment-record.txt << EOF
Deployment Record
=================
Date: $TIMESTAMP
Environment: $DEPLOYMENT_ENV
Commit: $(git rev-parse HEAD)
Author: $(git config user.name)

Backend: https://$BACKEND_APP_NAME.herokuapp.com
Frontend: Check Vercel dashboard

Status: Successful
EOF
    
    log_success "Deployment record created"
}

# Main deployment flow
main() {
    log_info "======================================"
    log_info "LMS Deployment Script"
    log_info "Environment: $DEPLOYMENT_ENV"
    log_info "Time: $TIMESTAMP"
    log_info "======================================"
    echo ""
    
    # Validate environment
    if [ "$DEPLOYMENT_ENV" != "staging" ] && [ "$DEPLOYMENT_ENV" != "production" ]; then
        log_error "Invalid environment. Use 'staging' or 'production'"
        exit 1
    fi
    
    # Ask for confirmation on production
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        echo -e "${RED}WARNING: You are about to deploy to PRODUCTION${NC}"
        read -p "Type 'yes' to confirm: " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute deployment steps
    pre_deployment_checks
    build_applications
    deploy_backend
    deploy_frontend
    smoke_tests
    post_deployment
    
    echo ""
    log_success "======================================"
    log_success "Deployment completed successfully!"
    log_success "======================================"
}

# Run main function
main
