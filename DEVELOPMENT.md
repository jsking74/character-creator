# Character Creator - Development Guide

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+ (or Docker & Docker Compose)
- Git

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   git clone <repository>
   cd CharacterCreator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Backend:
   ```bash
   cd packages/backend
   cp .env.example .env
   ```

   Then update `.env` with your database credentials.

4. **Start PostgreSQL**

   Using Docker Compose:
   ```bash
   docker-compose up -d
   ```

   Or use your local PostgreSQL installation.

5. **Run database migrations** (when available)
   ```bash
   npm run db:migrate --workspace=@character-creator/backend
   ```

### Running Development Servers

**Terminal 1 - Backend Server:**
```bash
npm run dev --workspace=@character-creator/backend
```

Server will be available at `http://localhost:5000`

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev --workspace=@character-creator/frontend
```

App will be available at `http://localhost:3000`

### Database Management

**View database (via Adminer):**
- Navigate to `http://localhost:8080`
- Server: `postgres`
- Username: `postgres`
- Password: `postgres`
- Database: `character_creator`

**Generate migration** (after changing entities):
```bash
npm run db:generate --workspace=@character-creator/backend
```

**Run migrations:**
```bash
npm run db:migrate --workspace=@character-creator/backend
```

**Revert migrations:**
```bash
npm run db:revert --workspace=@character-creator/backend
```

## Project Structure

```
CharacterCreator/
├── packages/
│   ├── shared/          # Shared types and constants
│   ├── frontend/        # React web app
│   ├── backend/         # Express API server
│   └── desktop/         # Electron desktop app
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml   # Local development database
├── tsconfig.base.json   # Base TypeScript config
├── .eslintrc.json       # ESLint configuration
├── .prettierrc.json     # Code formatting rules
└── DESIGN.md           # System design document
```

## Development Workflow

### Code Style

Code is automatically formatted with Prettier and linted with ESLint.

**Format code:**
```bash
npm run format
```

**Check formatting without changes:**
```bash
npm run format:check
```

**Lint code:**
```bash
npm run lint --workspaces
```

### Type Checking

```bash
npm run type-check --workspaces
```

### Testing

```bash
npm run test --workspaces
```

## Building for Production

**Frontend:**
```bash
npm run build --workspace=@character-creator/frontend
```

**Backend:**
```bash
npm run build --workspace=@character-creator/backend
```

**All packages:**
```bash
npm run build
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies for all packages |
| `npm run dev --workspaces` | Run all dev servers |
| `npm run build --workspaces` | Build all packages |
| `npm run test --workspaces` | Run tests for all packages |
| `npm run lint --workspaces` | Lint all packages |
| `npm run format` | Format code |
| `npm run type-check --workspaces` | Type check all packages |

## Workspace Commands

Run commands for specific workspaces:

```bash
npm run dev --workspace=@character-creator/frontend
npm run dev --workspace=@character-creator/backend
npm run test --workspace=@character-creator/shared
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

1. Find the process using the port:
   - **Windows:** `netstat -ano | findstr :3000`
   - **Mac/Linux:** `lsof -i :3000`

2. Kill the process or change the port in config files.

### Database Connection Issues

1. Verify PostgreSQL is running: `docker-compose ps`
2. Check credentials in `.env` file
3. Ensure database exists: `character_creator`

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

1. Ensure TypeScript is up to date: `npm install`
2. Check for syntax errors: `npm run lint`
3. Type check: `npm run type-check --workspaces`

## Next Steps

1. Review the [Design Document](DESIGN.md)
2. Read the [Implementation Plan](IMPLEMENTATION_PLAN.md)
3. Start with Sprint 1: Authentication & User Management
4. Check the issue tracker for tasks assigned to you

## Resources

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Material-UI Documentation](https://mui.com)
- [Redux Documentation](https://redux.js.org)

## Getting Help

- Check existing issues and discussions
- Review the design and implementation documents
- Ask questions in team communication channels
