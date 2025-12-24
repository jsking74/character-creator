# Character Creator

A cross-platform character creation application for tabletop role-playing games (TTRPGs). Create, manage, and share characters for D&D 5e, Pathfinder, and other RPG systems with offline support and cloud synchronization.

## Features

- **Multi-System Support**: Character creation for D&D 5e, Pathfinder, and custom RPG systems via configuration files
- **Cross-Platform**: Web browser and desktop (Electron) applications
- **Offline-First**: Create and edit characters offline, automatic sync when reconnected
- **Character Visualization**: Interactive character sheets with system-specific formatting
- **PDF Export**: Export character sheets to professional PDFs
- **Party Management**: Create parties and manage multiple characters
- **Character Sharing**: Share characters with view-only access via secure links
- **Cloud Persistence**: All data backed up to cloud database with conflict resolution
- **System Extensibility**: Add new RPG systems via YAML/JSON configuration files

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+ (or Docker)
- Git

### Installation & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cd packages/backend
   cp .env.example .env
   ```

3. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

4. **Run development servers:**

   Terminal 1 (Backend):
   ```bash
   npm run dev --workspace=@character-creator/backend
   ```

   Terminal 2 (Frontend):
   ```bash
   npm run dev --workspace=@character-creator/frontend
   ```

5. **Open in browser:**
   Navigate to `http://localhost:3000`

For detailed setup instructions, see [DEVELOPMENT.md](DEVELOPMENT.md)

## Project Structure

```
CharacterCreator/
├── packages/
│   ├── shared/          # Shared types and constants
│   ├── frontend/        # React web application
│   ├── backend/         # Express.js API server
│   └── desktop/         # Electron desktop app
├── docs/
│   ├── DESIGN.md               # System design document
│   └── IMPLEMENTATION_PLAN.md   # Development roadmap
└── DEVELOPMENT.md              # Development guide
```

## Documentation

- **[Design Document](DESIGN.md)** - Complete system architecture and specifications
- **[Implementation Plan](IMPLEMENTATION_PLAN.md)** - Development roadmap with sprints and tasks
- **[Development Guide](DEVELOPMENT.md)** - Setup and development workflow

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Redux Toolkit for state management
- Material-UI (MUI) for components
- Vite for bundling
- IndexedDB for offline storage

### Backend
- Node.js + Express.js
- TypeORM for database management
- PostgreSQL 15+
- JWT for authentication
- TypeScript

### Desktop
- Electron for cross-platform desktop app
- SQLite for local data persistence
- Shared React codebase with web app

## Development

### Scripts

```bash
# Install dependencies
npm install

# Development servers
npm run dev --workspaces

# Build production
npm run build --workspaces

# Run tests
npm run test --workspaces

# Lint code
npm run lint --workspaces

# Format code
npm run format

# Type checking
npm run type-check --workspaces
```

### Database

```bash
# Start PostgreSQL (Docker)
docker-compose up -d

# View database (Adminer)
# Navigate to http://localhost:8080

# Migrations (when schema changes)
npm run db:migrate --workspace=@character-creator/backend
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests: `npm run lint && npm run test`
4. Create a pull request

Code style is enforced with ESLint and Prettier. Run `npm run format` before committing.

## Roadmap

### Phase 1: Core Foundation (Weeks 1-5)
- ✓ Project setup and configuration
- Authentication & user management
- Character creation for D&D 5e
- Local data persistence

### Phase 2: Cloud & Sync (Weeks 6-9)
- Cloud database integration
- Offline-first sync with conflict resolution
- Character data synchronization

### Phase 3: Features (Weeks 10-13)
- Character sheet visualization
- PDF export
- Party management
- Character sharing

### Phase 4: Desktop & Polish (Weeks 14-17)
- Electron desktop application
- Performance optimization
- Comprehensive testing

### Phase 5: Community (Ongoing)
- Custom system configuration UI
- Community system sharing
- Advanced features (real-time collaboration, etc.)

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed sprint breakdown.

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh-token` - Refresh access token

### Characters
- `GET /api/characters` - List user's characters
- `POST /api/characters` - Create new character
- `GET /api/characters/:id` - Get character details
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character
- `POST /api/characters/:id/export` - Export to PDF

### Parties
- `GET /api/parties` - List user's parties
- `POST /api/parties` - Create new party
- `GET /api/parties/:id` - Get party details
- `PUT /api/parties/:id` - Update party
- `DELETE /api/parties/:id` - Delete party
- `POST /api/parties/:id/members` - Add party member
- `DELETE /api/parties/:id/members/:memberId` - Remove party member

### Sharing
- `POST /api/share/:characterId` - Create share link
- `GET /api/share/:token` - Get shared character (public)
- `DELETE /api/share/:token` - Revoke share link

### Systems
- `GET /api/systems` - List available RPG systems
- `GET /api/systems/:systemId` - Get system configuration

## License

MIT

## Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

**Status**: Early Development (Sprint 0 - Project Setup)
**Latest Update**: December 23, 2025
