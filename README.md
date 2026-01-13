# TodoList - Fullstack Task Management Application

A collaborative task management application inspired by Lark Tasks, built with NestJS and Next.js.

## Features

### Core Features
- **User Authentication** - Register/Login with JWT-based authentication
- **Team Collaboration** - Create teams, invite members, share tasks
- **Task Management** - Full CRUD operations with rich task details
  - Assignees and Followers
  - Subtasks (auto-complete parent when all subtasks done)
  - Priority levels (Urgent/High/Medium/Low)
  - Due dates
- **Task History** - Track all changes with timestamps
- **Comments** - Add, edit, delete comments on tasks

### Filtering & Sorting
- **Filters**: Status, Priority, Date Range, Creator, Assignee
- **Sort by**: Created Date, Due Date, Creator, Task ID
- **Views**: My Tasks, Assigned to Me, Following, Completed

### Documentation
- Swagger API documentation at `/api/docs`
- Schema designs for planned features:
  - [Notification Reminders](backend/docs/notification-reminder.md) - Task due date reminders
  - [Recurring Tasks](backend/docs/recurring-tasks.md) - Scheduled repeating tasks

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | NestJS, TypeORM, MySQL 8 |
| Auth | JWT (Access + Refresh tokens) |
| API Docs | Swagger/OpenAPI |
| Deployment | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Run with Docker

```bash
# Clone the repository
git clone <repository-url>
cd stark-tech-interview-2026

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Services will be available at:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3012 |
| Backend API | http://localhost:3011/api |
| Swagger Docs | http://localhost:3011/api/docs |
| MySQL | localhost:3307 |

### Demo Accounts

The database is automatically seeded with demo data. You can login with any of these accounts:

| Email | Name | Password | Teams |
|-------|------|----------|-------|
| tony@stark.com | Tony Stark | `Password123!` | Avengers (Owner), Stark R&D (Owner) |
| steve@avengers.com | Steve Rogers | `Password123!` | Avengers (Admin), SHIELD (Member) |
| natasha@shield.com | Natasha Romanoff | `Password123!` | SHIELD (Owner), Avengers (Member) |
| bruce@stark.com | Bruce Banner | `Password123!` | Stark R&D (Admin), Avengers (Member) |
| peter@dailybugle.com | Peter Parker | `Password123!` | Stark R&D (Member) |

The seed also includes 8 sample tasks with comments, assignees, and history.

### Stop Services

```bash
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

## Local Development

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run start:dev
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
.
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── common/         # Shared decorators, guards, filters
│   │   ├── config/         # Configuration modules
│   │   └── modules/        # Feature modules
│   │       ├── auth/       # Authentication
│   │       ├── user/       # User management
│   │       ├── team/       # Team management
│   │       ├── task/       # Task management
│   │       ├── comment/    # Comments
│   │       └── history/    # Task history
│   ├── docs/               # Technical documentation
│   │   ├── notification-reminder.md
│   │   └── recurring-tasks.md
│   ├── e2e/                # E2E test scripts
│   └── Dockerfile
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # API clients, utilities
│   │   ├── stores/        # Zustand stores
│   │   └── types/         # TypeScript types
│   └── Dockerfile
│
├── docs/                   # Documentation
│   ├── README_v2_zh.md    # Original requirements (Chinese)
│   ├── backend-specification.md
│   ├── frontend-specification.md
│   └── gap-analysis.md    # Implementation checklist
│
├── docker-compose.yml      # Production Docker setup
└── docker-compose.dev.yml  # Development Docker setup
```

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List user's teams |
| POST | `/api/teams` | Create team |
| GET | `/api/teams/:id` | Get team details |
| POST | `/api/teams/:id/members` | Add member |
| DELETE | `/api/teams/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/assignees` | Add assignee |
| POST | `/api/tasks/:id/followers` | Add follower |

### Comments & History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:id/comments` | List comments |
| POST | `/api/tasks/:id/comments` | Add comment |
| GET | `/api/tasks/:id/history` | Get task history |

For complete API documentation, visit the Swagger UI at `/api/docs` when the backend is running.

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3011

# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=00000000
DATABASE_NAME=todolist

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3011/api
```

## Testing

### Backend E2E Tests

```bash
cd backend/e2e

# Run all tests
./run-all-tests.sh

# Run specific module tests
./auth/auth-test.sh
./task/task-test.sh
./team/team-test.sh
```

## License

MIT
