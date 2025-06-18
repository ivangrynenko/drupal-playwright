#!/bin/bash
#
# Drupal Playwright Integration Installer
#
# This script installs Playwright testing infrastructure into a DrevOps-based Drupal project
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to display usage
usage() {
    echo "Usage: $0 [target_directory]"
    echo ""
    echo "Install Playwright testing infrastructure into a DrevOps-based Drupal project."
    echo ""
    echo "Arguments:"
    echo "  target_directory    Path to the Drupal project (optional, will prompt if not provided)"
    echo ""
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo "  -f, --force        Force installation, overwriting existing files"
    echo "  --skip-docker      Skip Docker configuration updates"
    echo "  --skip-ci          Skip CI configuration updates"
    exit 1
}

# Parse arguments
FORCE=false
SKIP_DOCKER=false
SKIP_CI=false
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-ci)
            SKIP_CI=true
            shift
            ;;
        *)
            TARGET_DIR="$1"
            shift
            ;;
    esac
done

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if directory is a DrevOps project
is_drevops_project() {
    local dir=$1
    if [[ -f "$dir/docker-compose.yml" ]] && [[ -f "$dir/.ahoy.yml" ]] && [[ -d "$dir/scripts/drevops" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check Python and required packages
check_python_deps() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed."
        print_info "Please install Python 3 and try again."
        exit 1
    fi
    
    if ! python3 -c "import yaml" 2>/dev/null; then
        print_warning "PyYAML is not installed. Installing..."
        pip3 install pyyaml || {
            print_error "Failed to install PyYAML. Please run: pip3 install pyyaml"
            exit 1
        }
    fi
}

# Function to backup a file
backup_file() {
    local file=$1
    if [[ -f "$file" ]]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$file" "$backup"
        print_info "Backed up $file to $backup"
    fi
}

# Main installation process
main() {
    echo -e "${GREEN}Drupal Playwright Integration Installer${NC}"
    echo "========================================"
    echo ""
    
    # Check Python dependencies
    check_python_deps
    
    # Get target directory
    if [[ -z "$TARGET_DIR" ]]; then
        read -p "Enter the path to your Drupal project: " TARGET_DIR
    fi
    
    # Expand path
    TARGET_DIR=$(cd "$TARGET_DIR" 2>/dev/null && pwd) || {
        print_error "Directory '$TARGET_DIR' does not exist."
        exit 1
    }
    
    # Verify it's a DrevOps project
    if ! is_drevops_project "$TARGET_DIR"; then
        print_error "The directory does not appear to be a DrevOps-based Drupal project."
        print_info "Expected files: docker-compose.yml, .ahoy.yml, scripts/drevops/"
        exit 1
    fi
    
    print_success "Found DrevOps project at: $TARGET_DIR"
    echo ""
    
    # Check for existing Playwright installation
    if [[ -d "$TARGET_DIR/tests/playwright" ]] && [[ "$FORCE" != "true" ]]; then
        print_warning "Playwright tests already exist in the project."
        read -p "Do you want to overwrite existing files? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Installation cancelled."
            exit 0
        fi
    fi
    
    # Step 1: Create directory structure
    print_info "Creating directory structure..."
    mkdir -p "$TARGET_DIR/.docker"
    mkdir -p "$TARGET_DIR/tests/playwright/tests/helpers"
    mkdir -p "$TARGET_DIR/tests/playwright/fixtures"
    mkdir -p "$TARGET_DIR/scripts/custom"
    mkdir -p "$TARGET_DIR/.logs/screenshots"
    
    # Step 2: Copy template files
    print_info "Copying Playwright files..."
    
    # Docker files
    cp "$SCRIPT_DIR/templates/.docker/playwright.dockerfile" "$TARGET_DIR/.docker/"
    cp "$SCRIPT_DIR/templates/scripts/custom/playwright-docker-entrypoint.sh" "$TARGET_DIR/scripts/custom/"
    chmod +x "$TARGET_DIR/scripts/custom/playwright-docker-entrypoint.sh"
    
    # Playwright test files
    cp -r "$SCRIPT_DIR/templates/tests/playwright/"* "$TARGET_DIR/tests/playwright/"
    
    # Copy fixtures
    if [[ -d "$SCRIPT_DIR/templates/tests/playwright/fixtures" ]]; then
        cp -r "$SCRIPT_DIR/templates/tests/playwright/fixtures/"* "$TARGET_DIR/tests/playwright/fixtures/" 2>/dev/null || true
    fi
    
    # Step 3: Update docker-compose.yml
    if [[ "$SKIP_DOCKER" != "true" ]]; then
        print_info "Updating docker-compose.yml..."
        backup_file "$TARGET_DIR/docker-compose.yml"
        python3 "$SCRIPT_DIR/scripts/add-playwright-service.py" "$TARGET_DIR/docker-compose.yml" || {
            print_error "Failed to update docker-compose.yml"
            exit 1
        }
    fi
    
    # Step 4: Update .ahoy.yml
    print_info "Updating Ahoy commands..."
    backup_file "$TARGET_DIR/.ahoy.yml"
    "$SCRIPT_DIR/scripts/update-ahoy-commands.sh" "$TARGET_DIR/.ahoy.yml" || {
        print_error "Failed to update .ahoy.yml"
        exit 1
    }
    
    # Step 5: Update CircleCI config
    if [[ "$SKIP_CI" != "true" ]] && [[ -f "$TARGET_DIR/.circleci/config.yml" ]]; then
        print_info "Updating CircleCI configuration..."
        backup_file "$TARGET_DIR/.circleci/config.yml"
        python3 "$SCRIPT_DIR/scripts/update-circleci.py" "$TARGET_DIR/.circleci/config.yml" || {
            print_warning "Failed to update CircleCI config automatically. Please update manually."
        }
    fi
    
    # Step 6: Update .gitignore
    print_info "Updating .gitignore..."
    if ! grep -q "# Playwright logs" "$TARGET_DIR/.gitignore" 2>/dev/null; then
        echo "" >> "$TARGET_DIR/.gitignore"
        echo "# Playwright logs" >> "$TARGET_DIR/.gitignore"
        echo ".logs/playwright/" >> "$TARGET_DIR/.gitignore"
        echo ".logs/screenshots/" >> "$TARGET_DIR/.gitignore"
    fi
    
    # Step 7: Create .lagoon.env.ci if needed
    if [[ ! -f "$TARGET_DIR/.lagoon.env.ci" ]]; then
        print_info "Creating .lagoon.env.ci..."
        cat > "$TARGET_DIR/.lagoon.env.ci" << 'EOF'
##
# Configuration overrides for CircleCI environment.
#

BASIC_AUTH=off
BASIC_AUTH_USERNAME=
BASIC_AUTH_PASSWORD=
EOF
    fi
    
    echo ""
    print_success "Playwright integration installed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Rebuild your Docker containers: ahoy down && ahoy up"
    echo "2. Prepare test environment: ahoy test-playwright-prepare"
    echo "3. Run tests: ahoy test-playwright"
    echo ""
    echo "For more information, see: $SCRIPT_DIR/README.md"
}

# Run main function
main