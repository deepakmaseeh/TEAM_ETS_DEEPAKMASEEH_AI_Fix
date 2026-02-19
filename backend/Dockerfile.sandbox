# Dockerfile for sandboxed test execution
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (for Node.js projects)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Python testing tools
RUN pip install --no-cache-dir pytest pytest-cov pylint flake8 mypy

# Set working directory
WORKDIR /workspace

# Default command (can be overridden)
CMD ["sleep", "infinity"]
