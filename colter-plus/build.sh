#!/bin/bash

# Install dependencies without frozen lockfile
echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

# Build the site
echo "Building the site..."
pnpm docs:build

echo "Build completed successfully!"