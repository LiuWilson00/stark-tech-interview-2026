#!/bin/sh
set -e

echo "🚀 Starting application..."

# Wait for database to be ready (extra safety check)
echo "⏳ Waiting for database connection..."
sleep 3

# Run database seeds (idempotent - will skip if already executed)
echo "🌱 Running database seeds..."
node dist/database/seeds/seed.js || echo "⚠️  Seed script failed or skipped"

# Start the application
echo "✅ Starting NestJS server..."
exec node dist/main.js
