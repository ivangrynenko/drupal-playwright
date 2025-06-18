# Playwright Docker image with pre-installed dependencies
FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY tests/playwright/package*.json /app/tests/playwright/

# Install npm dependencies
WORKDIR /app/tests/playwright
RUN npm ci || npm install

# Install Playwright browsers
RUN npx playwright install chromium firefox webkit
RUN npx playwright install-deps

# Copy the entrypoint script
COPY scripts/custom/playwright-docker-entrypoint.sh /usr/local/bin/playwright-entrypoint.sh
RUN chmod +x /usr/local/bin/playwright-entrypoint.sh

# Set back to app root
WORKDIR /app

# Use the entrypoint script
ENTRYPOINT ["/usr/local/bin/playwright-entrypoint.sh"]

# Default command keeps container running
CMD ["tail", "-f", "/dev/null"]