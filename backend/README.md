# Task Management API Backend

A NestJS-based REST API for task management with team collaboration features.

## Tech Stack

- **Framework**: NestJS 11
- **Database**: MySQL 8 with TypeORM
- **Authentication**: JWT (Passport)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## Project Setup

```bash
npm install
```

## Database Setup

### Using Docker

Start the MySQL database:

```bash
docker-compose up -d mysql
```

### Migrations

```bash
# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Generate new migration from entity changes
npm run migration:generate src/database/migrations/MigrationName
```

### Seeding Demo Data

Seeds work like migrations - they are tracked in a `seed_history` table and only run once:

```bash
# Seed demo data (users, teams, tasks)
# Safe to run multiple times - skips already executed seeds
npm run db:seed

# Full reset: revert + run migrations + seed
npm run db:reset
```

**Note:** When using Docker, seeds run automatically on container startup.

### Demo Accounts

All demo accounts use the password: `Password123!`

| Email | Name | Role |
|-------|------|------|
| tony@stark.com | Tony Stark | Avengers Owner, Stark R&D Owner |
| steve@avengers.com | Steve Rogers | Avengers Admin |
| natasha@shield.com | Natasha Romanoff | SHIELD Owner |
| bruce@stark.com | Bruce Banner | Stark R&D Admin |
| peter@dailybugle.com | Peter Parker | Stark R&D Member |

## Running the Application

```bash
# Development (watch mode)
npm run start:dev

# Debug mode
npm run start:debug

# Production
npm run start:prod
```

The API will be available at `http://localhost:3011/api`

## API Documentation

Swagger documentation is available at `http://localhost:3011/api/docs` when the server is running.

### Health Check

```bash
curl http://localhost:3011/api/health
```

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards
│   └── interceptors/    # Response interceptors
├── config/              # Configuration files
├── database/            # Database setup
│   ├── migrations/      # TypeORM migrations
│   └── seeds/           # Seed scripts
└── modules/             # Feature modules
    ├── auth/            # Authentication
    ├── user/            # User management
    ├── team/            # Team management
    ├── task/            # Task management
    ├── comment/         # Task comments
    ├── history/         # Task history
    └── health/          # Health check endpoint
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_HOST` - MySQL host
- `DATABASE_PORT` - MySQL port
- `DATABASE_USERNAME` - MySQL username
- `DATABASE_PASSWORD` - MySQL password
- `DATABASE_NAME` - Database name
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - JWT expiration time
