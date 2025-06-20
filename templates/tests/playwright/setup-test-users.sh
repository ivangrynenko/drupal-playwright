#!/bin/bash
#
# Create test users for Playwright tests
# This script should be customized for each project's specific roles
#

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to create a user if they don't exist
create_user_if_not_exists() {
  local username=$1
  local password=$2
  local role=$3
  
  # Check if user exists
  if drush user:information "$username" >/dev/null 2>&1; then
    echo -e "${YELLOW}[SKIP]${NC} User $username already exists"
    # Ensure the role is set even if user exists
    if [ ! -z "$role" ]; then
      drush user:role:add "$role" "$username" >/dev/null 2>&1
    fi
  else
    echo -e "${GREEN}[CREATE]${NC} Creating user $username with role $role"
    drush user:create "$username" --password="$password" --mail="${username}@example.com"
    if [ ! -z "$role" ]; then
      drush user:role:add "$role" "$username"
    fi
  fi
}

echo "Setting up Playwright test users..."

# Get credentials from environment variables with defaults
ADMIN_USERNAME="${PLAYWRIGHT_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${PLAYWRIGHT_ADMIN_PASSWORD:-admin}"
AUTH_USERNAME="${PLAYWRIGHT_AUTH_USERNAME:-authenticated}"
AUTH_PASSWORD="${PLAYWRIGHT_AUTH_PASSWORD:-authenticated}"

# Create test users for common roles
create_user_if_not_exists "$AUTH_USERNAME" "$AUTH_PASSWORD" ""

# Ensure admin user exists with known password for tests
if drush user:information "$ADMIN_USERNAME" >/dev/null 2>&1; then
  echo -e "${YELLOW}[UPDATE]${NC} Setting $ADMIN_USERNAME password for tests"
  drush user:password "$ADMIN_USERNAME" --password="$ADMIN_PASSWORD" >/dev/null 2>&1
else
  echo -e "${GREEN}[CREATE]${NC} Creating $ADMIN_USERNAME user"
  drush user:create "$ADMIN_USERNAME" --password="$ADMIN_PASSWORD" --mail="$ADMIN_USERNAME@example.com"
  drush user:role:add "administrator" "$ADMIN_USERNAME"
fi

# Add project-specific users here
# Example for custom roles:
# SITE_ADMIN_USERNAME="${PLAYWRIGHT_SITE_ADMIN_USERNAME:-site_admin}"
# SITE_ADMIN_PASSWORD="${PLAYWRIGHT_SITE_ADMIN_PASSWORD:-site_admin}"
# create_user_if_not_exists "$SITE_ADMIN_USERNAME" "$SITE_ADMIN_PASSWORD" "site_administrator"
# 
# CONTENT_AUTHOR_USERNAME="${PLAYWRIGHT_CONTENT_AUTHOR_USERNAME:-content_author}"
# CONTENT_AUTHOR_PASSWORD="${PLAYWRIGHT_CONTENT_AUTHOR_PASSWORD:-content_author}"
# create_user_if_not_exists "$CONTENT_AUTHOR_USERNAME" "$CONTENT_AUTHOR_PASSWORD" "content_author"
# 
# CONTENT_APPROVER_USERNAME="${PLAYWRIGHT_CONTENT_APPROVER_USERNAME:-content_approver}"
# CONTENT_APPROVER_PASSWORD="${PLAYWRIGHT_CONTENT_APPROVER_PASSWORD:-content_approver}"
# create_user_if_not_exists "$CONTENT_APPROVER_USERNAME" "$CONTENT_APPROVER_PASSWORD" "content_approver"

echo -e "${GREEN}Test users setup complete!${NC}"