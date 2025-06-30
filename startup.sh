#!/bin/bash
echo "Starting Azure App Service deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting Node.js server..."
npm start