#!/bin/bash

# Exit on any failure
set -e

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building application..."
npm run build

echo "Deployment preparation complete!"