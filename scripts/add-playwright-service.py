#!/usr/bin/env python3
"""
Add Playwright service to docker-compose.yml
This script safely adds the Playwright service configuration to an existing docker-compose.yml file
"""

import yaml
import sys
import os
from collections import OrderedDict

# Custom YAML representer to maintain formatting
class OrderedDumper(yaml.SafeDumper):
    pass

def dict_representer(dumper, data):
    return dumper.represent_dict(data.items())

OrderedDumper.add_representer(OrderedDict, dict_representer)

def add_playwright_service(compose_file_path):
    """Add Playwright service to docker-compose.yml"""
    
    # Read the existing docker-compose.yml
    with open(compose_file_path, 'r') as f:
        compose_data = yaml.safe_load(f)
    
    # Check if playwright service already exists
    if 'services' in compose_data and 'playwright' in compose_data['services']:
        print("Playwright service already exists in docker-compose.yml")
        return True
    
    # Define the playwright service
    playwright_service = {
        'build': {
            'context': '.',
            'dockerfile': '.docker/playwright.dockerfile'
        },
        'volumes': [
            '.:/app:${VOLUME_FLAGS:-delegated}',
            './web/sites/default/files:/app/web/sites/default/files:${VOLUME_FLAGS:-delegated}'
        ],
        'user': 'root',
        'environment': {
            'TZ': '${DREVOPS_TZ:-Australia/Melbourne}',
            'DREVOPS_LOCALDEV_URL': '${DREVOPS_LOCALDEV_URL:-${COMPOSE_PROJECT_NAME:-drupal}.docker.amazee.io}',
            'PLAYWRIGHT_HEADLESS': 'true',
            'PLAYWRIGHT_CHROMIUM_ARGS': '--no-sandbox --disable-setuid-sandbox',
            'CI': '${CI:-}',
            'PLAYWRIGHT_BASE_URL': 'http://nginx:8080'
        },
        'depends_on': [
            'nginx',
            'php'
        ],
        'working_dir': '/app',
        'command': 'tail -f /dev/null',
        'networks': [
            'default'
        ],
        'labels': {
            'lagoon.type': 'none'
        }
    }
    
    # Add the service to the compose data
    if 'services' not in compose_data:
        compose_data['services'] = {}
    
    # Find a good position to insert playwright (after chrome if it exists)
    services = compose_data['services']
    new_services = OrderedDict()
    
    for service_name, service_config in services.items():
        new_services[service_name] = service_config
        if service_name == 'chrome':
            # Insert playwright after chrome
            new_services['playwright'] = playwright_service
    
    # If chrome wasn't found, add playwright at the end
    if 'playwright' not in new_services:
        new_services['playwright'] = playwright_service
    
    compose_data['services'] = dict(new_services)
    
    # Write the updated docker-compose.yml
    with open(compose_file_path, 'w') as f:
        yaml.dump(compose_data, f, default_flow_style=False, sort_keys=False, Dumper=OrderedDumper)
    
    print(f"Successfully added Playwright service to {compose_file_path}")
    return True

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 add-playwright-service.py <path/to/docker-compose.yml>")
        sys.exit(1)
    
    compose_file = sys.argv[1]
    
    if not os.path.exists(compose_file):
        print(f"Error: {compose_file} does not exist")
        sys.exit(1)
    
    try:
        add_playwright_service(compose_file)
    except Exception as e:
        print(f"Error updating docker-compose.yml: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()