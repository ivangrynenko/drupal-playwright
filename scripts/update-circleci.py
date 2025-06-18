#!/usr/bin/env python3
"""
Add Playwright test step to CircleCI configuration
"""

import yaml
import sys
import os
import re

def find_behat_test_step(steps):
    """Find the Behat test step index in the build job"""
    for i, step in enumerate(steps):
        if isinstance(step, dict) and 'run' in step:
            run_config = step['run']
            if isinstance(run_config, dict) and 'name' in run_config:
                if 'Test with Behat' in run_config['name']:
                    return i
    return None

def create_playwright_test_step():
    """Create the Playwright test step configuration"""
    return {
        'run': {
            'name': 'Test with Playwright',
            'command': '''set -e
echo "Preparing Playwright test environment..."

# Create test users
echo "Creating test users..."
docker compose exec -T cli ./tests/playwright/setup-test-users.sh

# Install Playwright dependencies and browsers
echo "Installing Playwright dependencies..."
docker compose exec -T playwright bash -c "mkdir -p /app/.logs/screenshots && cd /app/tests/playwright && npm ci"
docker compose exec -T playwright bash -c "cd /app/tests/playwright && npx playwright install --with-deps chromium firefox"

echo "Playwright test environment is ready!"

# Run Playwright tests with proper environment variable
echo "Running Playwright tests..."
docker compose exec -T -e PLAYWRIGHT_BASE_URL=http://nginx:8080 playwright bash -c "cd /app/tests/playwright && npm test"''',
            'no_output_timeout': '30m'
        }
    }

def update_artifact_collection(steps):
    """Update the artifact collection step to include Playwright artifacts"""
    for step in steps:
        if isinstance(step, dict) and 'run' in step:
            run_config = step['run']
            if isinstance(run_config, dict) and 'name' in run_config:
                if 'Process test logs and artifacts' in run_config['name']:
                    # Add Playwright artifact collection to the command
                    if 'Playwright artifacts' not in run_config['command']:
                        run_config['command'] += '''

# Collect Playwright artifacts
if docker compose ps --services --filter "status=running" | grep -q playwright; then
  echo "Collecting Playwright test artifacts..."
  mkdir -p "${DREVOPS_CI_ARTIFACTS}/screenshots"
  docker compose cp playwright:/app/.logs/screenshots/. "${DREVOPS_CI_ARTIFACTS}/screenshots/" 2>/dev/null || true
  docker compose cp playwright:/app/.logs/playwright/. "${DREVOPS_CI_ARTIFACTS}/playwright/" 2>/dev/null || true
fi'''
                    return True
    return False

def update_circleci_config(config_file):
    """Update CircleCI configuration to include Playwright tests"""
    
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    
    # Find the build job
    if 'jobs' not in config or 'build' not in config['jobs']:
        print("Error: Could not find 'build' job in CircleCI config")
        return False
    
    build_job = config['jobs']['build']
    
    if 'steps' not in build_job:
        print("Error: No steps found in build job")
        return False
    
    steps = build_job['steps']
    
    # Check if Playwright test already exists
    for step in steps:
        if isinstance(step, dict) and 'run' in step:
            run_config = step['run']
            if isinstance(run_config, dict) and 'name' in run_config:
                if 'Test with Playwright' in run_config['name']:
                    print("Playwright test step already exists")
                    return True
    
    # Find where to insert the Playwright test (after Behat)
    behat_index = find_behat_test_step(steps)
    
    if behat_index is None:
        print("Warning: Could not find Behat test step. Adding Playwright test at the end.")
        insert_index = len(steps) - 1
    else:
        insert_index = behat_index + 1
    
    # Insert Playwright test step
    playwright_step = create_playwright_test_step()
    steps.insert(insert_index, playwright_step)
    
    # Update artifact collection
    update_artifact_collection(steps)
    
    # Write the updated config
    with open(config_file, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False, width=1000)
    
    print(f"Successfully updated CircleCI configuration: {config_file}")
    return True

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 update-circleci.py <path/to/.circleci/config.yml>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    
    if not os.path.exists(config_file):
        print(f"Error: {config_file} does not exist")
        sys.exit(1)
    
    try:
        update_circleci_config(config_file)
    except Exception as e:
        print(f"Error updating CircleCI config: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()