# Drupal Playwright Integration

A standardized Playwright testing integration for DrevOps-based Drupal projects.

## Overview

This project provides a complete Playwright testing setup that can be integrated into any DrevOps-based Drupal project. It includes Docker configuration, test helpers, CI/CD integration, and standardized practices for end-to-end testing.

## Features

- 🚀 Easy integration into existing Drupal projects
- 🐳 Docker-based Playwright container
- 📸 Standardized screenshot management
- 🔧 Ahoy command integration
- 🔄 CircleCI configuration
- 📝 TypeScript test templates
- 🎯 Cross-browser testing support

## Quick Start

```bash
# Run the installation script
./install.sh /path/to/your/drupal/project

# Or use the interactive installer
./install.sh
```

## Project Structure

```
drupal-playwright/
├── install.sh              # Main installation script
├── scripts/                # Integration scripts
│   ├── add-playwright-service.py
│   ├── update-ahoy-commands.sh
│   └── update-circleci.py
├── templates/              # Template files
│   ├── .docker/
│   │   └── playwright.dockerfile
│   ├── tests/playwright/
│   │   ├── playwright.config.ts
│   │   ├── package.json
│   │   └── tests/
│   └── scripts/custom/
└── docs/                   # Documentation
```

## What Gets Installed

1. **Docker Configuration**
   - Playwright container service in docker-compose.yml
   - Optimized Dockerfile with browser pre-installation

2. **Playwright Test Suite**
   - TypeScript configuration
   - Test helpers and utilities
   - Example test files

3. **CI/CD Integration**
   - CircleCI test steps
   - Artifact collection

4. **Developer Commands**
   - `ahoy test-playwright` - Run tests
   - `ahoy test-playwright-debug` - Debug tests
   - `ahoy test-playwright-report` - View test reports

## Requirements

- Docker and Docker Compose
- Python 3.6+ (for installation scripts)
- PyYAML library (`pip install pyyaml`)
- Existing DrevOps-based Drupal project

## Installation

### Automated Installation

```bash
# Clone this repository
git clone https://github.com/your-org/drupal-playwright.git
cd drupal-playwright

# Install Python dependencies
pip install -r requirements.txt

# Run installer
./install.sh /path/to/drupal/project
```

### Manual Installation

See [docs/manual-installation.md](docs/manual-installation.md) for step-by-step instructions.

## Configuration

### Environment Variables

- `PLAYWRIGHT_BASE_URL` - Base URL for tests (default: `http://nginx:8080`)
- `PLAYWRIGHT_HEADLESS` - Run in headless mode (default: `true`)
- `CI` - Set to `true` in CI environments

### Customization

Edit `playwright.config.ts` to customize:
- Test timeout settings
- Browser configurations
- Reporter options
- Screenshot paths

## Usage

### Running Tests

```bash
# Run all tests
ahoy test-playwright

# Run specific test file
ahoy test-playwright tests/login.spec.ts

# Debug mode
ahoy test-playwright-debug

# View test report
ahoy test-playwright-report
```

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { takeScreenshot } from './helpers/screenshot';

test('user can login', async ({ page }) => {
  const auth = new AuthHelper(page);
  await auth.loginAs('administrator');
  
  await expect(page).toHaveURL(/user/);
  await takeScreenshot(page, 'admin-dashboard');
});
```

## Screenshot Management

All screenshots are saved to `.logs/screenshots/` with clear naming:
- `playwright-{test-name}.png` - Playwright screenshots
- `behat-{test-name}.png` - Behat screenshots (if present)

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md) for common issues and solutions.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Test your changes on a sample project
4. Submit a pull request

## License

MIT License - see LICENSE file for details.