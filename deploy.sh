#!/bin/bash

# Exit on any failure
set -e

# Install all dependencies (including dev for build)
echo "Installing dependencies..."
npm ci

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database
echo "Seeding database..."
npx prisma db seed || echo "Seed failed, continuing..."

# Build the application
echo "Building application..."
npm run build

# Start the application
echo "Starting application..."
exec node server.js