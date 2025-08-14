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

# Create test users for common roles
create_user_if_not_exists "authenticated" "authenticated" ""

# Ensure admin user exists with known password for tests
if drush user:information "admin" >/dev/null 2>&1; then
  echo -e "${YELLOW}[UPDATE]${NC} Setting admin password for tests"
  drush user:password admin --password="admin" >/dev/null 2>&1
else
  echo -e "${GREEN}[CREATE]${NC} Creating admin user"
  drush user:create "admin" --password="admin" --mail="admin@example.com"
  drush user:role:add "administrator" "admin"
fi

# Add project-specific users here
# Example for CivicTheme projects:
# create_user_if_not_exists "site_admin" "site_admin" "civictheme_site_administrator"
# create_user_if_not_exists "content_author" "content_author" "civictheme_content_author"
# create_user_if_not_exists "content_approver" "content_approver" "civictheme_content_approver"

echo -e "${GREEN}Test users setup complete!${NC}"