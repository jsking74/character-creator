11# Character Creator App - Implementation Plan

## Overview

This document provides a detailed implementation plan for building the Character Creator application, breaking down the design into actionable tasks, sprints, and technical decisions. The plan follows a phased approach with clear milestones and deliverables.

---

## 1. Project Setup & Configuration

### 1.1 Technology Stack Decisions

**Frontend:**
- Framework: React 18+ with TypeScript
- State Management: Redux Toolkit
- UI Library: Material-UI (MUI) v5
- Build Tool: Vite
- Testing: Jest + React Testing Library
- Linting: ESLint + Prettier
- Package Manager: npm

**Desktop Application:**
- Framework: Electron 27+
- Main Process: Node.js with TypeScript
- Preload: Electron preload scripts
- Package: electron-builder

**Backend:**
- Framework: Node.js + Express.js
- Language: TypeScript
- Database: PostgreSQL 15+
- ORM: TypeORM
- Authentication: passport.js + JWT
- Validation: Joi/Zod
- Testing: Jest
- API Documentation: Swagger/OpenAPI

**Cloud & DevOps:**
- Hosting: AWS or Heroku
- Database: AWS RDS (PostgreSQL)
- Storage: AWS S3
- CDN: CloudFront
- CI/CD: GitHub Actions

### 1.2 Repository Structure

```
character-creator/
├── frontend/                  # React web app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/            # Redux state
│   │   ├── services/         # API calls
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── desktop/                   # Electron app
│   ├── public/
│   │   ├── main.ts           # Main process
│   │   └── preload.ts
│   ├── src/                  # Same as frontend
│   ├── electron-builder.json
│   └── package.json
│
├── backend/                   # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/           # TypeORM entities
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── schemas/          # Validation
│   │   ├── utils/
│   │   ├── types/
│   │   └── server.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                    # Shared types
│   ├── src/
│   │   ├── types/
│   │   ├── schemas/
│   │   └── constants/
│   └── package.json
│
├── docs/
│   ├── DESIGN.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── API.md
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       └── deploy.yml
│
└── package.json               # Monorepo root
```

### 1.3 Development Environment Setup

**Required Tools:**
- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Git
- VS Code (recommended)
- Docker & Docker Compose (optional, for local PostgreSQL)

**Environment Variables:**

`.env.example` (Backend):
```
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=character_creator

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# AWS (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Email (Optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

---

## 2. Detailed Sprint Planning

### Sprint 0: Project Setup (Week 1)

**Goals:**
- Set up monorepo structure
- Configure development environment
- Establish CI/CD pipeline
- Document development workflow

**Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S0-1 | Initialize monorepo with npm workspaces | Setup | 2h | P0 |
| S0-2 | Create shared types package | Setup | 3h | P0 |
| S0-3 | Set up frontend Vite + React project | Setup | 3h | P0 |
| S0-4 | Set up backend Express + TypeORM project | Setup | 3h | P0 |
| S0-5 | Configure TypeScript for all packages | Setup | 2h | P0 |
| S0-6 | Set up ESLint + Prettier | Setup | 2h | P1 |
| S0-7 | Create GitHub Actions CI workflows | Setup | 4h | P0 |
| S0-8 | Set up Docker Compose for local dev | DevOps | 3h | P1 |
| S0-9 | Create development setup documentation | Docs | 2h | P0 |

**Deliverables:**
- Working monorepo with all projects initialized
- CI/CD pipeline running on PR
- Development environment documented
- Docker Compose for local PostgreSQL

---

### Phase 1: Core Foundation (Weeks 2-5)

#### Sprint 1: Authentication & User Management

**Goals:**
- User registration and login
- JWT token management
- Password hashing and validation
- User profile endpoints

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S1-1 | Create User entity and migrations | Backend | 2h | P0 |
| S1-2 | Implement password hashing (bcrypt) | Backend | 1h | P0 |
| S1-3 | Create auth service (register, login, token refresh) | Backend | 4h | P0 |
| S1-4 | Implement JWT middleware | Backend | 2h | P0 |
| S1-5 | Create auth routes (POST /auth/*) | Backend | 2h | P0 |
| S1-6 | Add input validation with Joi/Zod | Backend | 2h | P0 |
| S1-7 | Write auth service tests | Testing | 3h | P1 |
| S1-8 | Write auth route tests | Testing | 2h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S1-9 | Create Redux auth slice | Frontend | 2h | P0 |
| S1-10 | Build login form component | Frontend | 2h | P0 |
| S1-11 | Build registration form component | Frontend | 2h | P0 |
| S1-12 | Create API service for auth endpoints | Frontend | 2h | P0 |
| S1-13 | Implement token storage and refresh logic | Frontend | 2h | P0 |
| S1-14 | Add JWT interceptor for API calls | Frontend | 1h | P0 |
| S1-15 | Create protected route wrapper component | Frontend | 1h | P0 |

**Deliverables:**
- User registration and login endpoints
- JWT token generation and refresh
- Frontend auth forms and state management
- Protected routes on frontend
- Auth tests with 80%+ coverage

---

#### Sprint 2: Character Data Models & API

**Goals:**
- Character entity and database schema
- Character CRUD endpoints
- Validation and business logic
- Character listing with filters

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S2-1 | Create Character entity with nested JSON fields | Backend | 3h | P0 |
| S2-2 | Create character database migrations | Backend | 2h | P0 |
| S2-3 | Implement character repository | Backend | 3h | P0 |
| S2-4 | Create character service (CRUD) | Backend | 4h | P0 |
| S2-5 | Create character routes | Backend | 2h | P0 |
| S2-6 | Add character validation schema | Backend | 2h | P0 |
| S2-7 | Implement character listing with filters | Backend | 3h | P0 |
| S2-8 | Write character service tests | Testing | 4h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S2-9 | Create Redux character slice | Frontend | 2h | P0 |
| S2-10 | Build character list component | Frontend | 3h | P0 |
| S2-11 | Create character API service | Frontend | 2h | P0 |
| S2-12 | Build character detail view (read-only) | Frontend | 2h | P0 |
| S2-13 | Create delete character dialog | Frontend | 1h | P0 |

**Deliverables:**
- Character CRUD API endpoints
- Character database schema and migrations
- Character list view in frontend
- Character detail view
- Character tests with 80%+ coverage

---

#### Sprint 3: System Configuration Framework

**Goals:**
- Configuration file format and validation
- Load bundled and cloud configs
- Config caching system
- Support for D&D 5e as first system

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S3-1 | Define system config schema (JSON Schema) | Backend | 2h | P0 |
| S3-2 | Create SystemConfig entity | Backend | 1h | P0 |
| S3-3 | Implement config validation service | Backend | 3h | P0 |
| S3-4 | Create config routes (GET /api/systems) | Backend | 2h | P0 |
| S3-5 | Implement config caching layer | Backend | 2h | P0 |
| S3-6 | Write D&D 5e config file | Config | 6h | P0 |
| S3-7 | Write config validation tests | Testing | 3h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S3-8 | Create config service for loading configs | Frontend | 2h | P0 |
| S3-9 | Implement local config caching | Frontend | 2h | P0 |
| S3-10 | Create system selector component | Frontend | 2h | P0 |

**Deliverables:**
- System configuration schema and validation
- D&D 5e complete configuration
- Config API endpoints
- System selector UI
- Config validation and loading tests

---

#### Sprint 4: Character Creation Wizard (Part 1)

**Goals:**
- Multi-step character creation UI
- Basic character info (name, race, class)
- Ability score generation
- Step validation

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S4-1 | Create wizard component framework | Frontend | 3h | P0 |
| S4-2 | Build step 1: System selection | Frontend | 2h | P0 |
| S4-3 | Build step 2: Basic info form | Frontend | 2h | P0 |
| S4-4 | Build step 3: Ability scores form | Frontend | 3h | P0 |
| S4-5 | Implement ability score generation methods | Frontend | 2h | P0 |
| S4-6 | Create form validation for each step | Frontend | 2h | P0 |
| S4-7 | Implement step progression logic | Frontend | 2h | P0 |
| S4-8 | Add error handling and user feedback | Frontend | 1h | P0 |

**Deliverables:**
- Character creation wizard (steps 1-3)
- Ability score generation (point buy, standard array, rolling)
- Form validation per step
- Navigation between steps

---

#### Sprint 5: Character Creation Wizard (Part 2)

**Goals:**
- Complete remaining wizard steps (4-7)
- Skills and proficiencies selection
- Equipment selection
- Character traits and backstory
- Local character saving

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S5-1 | Build step 4: Skills & proficiencies form | Frontend | 3h | P0 |
| S5-2 | Build step 5: Equipment selection | Frontend | 3h | P0 |
| S5-3 | Build step 6: Traits & backstory form | Frontend | 2h | P0 |
| S5-4 | Build step 7: Review & confirm | Frontend | 2h | P0 |
| S5-5 | Implement form state management across steps | Frontend | 2h | P0 |
| S5-6 | Implement local character saving | Frontend | 2h | P0 |
| S5-7 | Add character image upload support | Frontend | 2h | P1 |

**Deliverables:**
- Complete character creation wizard (all 7 steps)
- Local data persistence
- Character review page
- Image upload capability

---

### Phase 2: Cloud & Offline Sync (Weeks 6-9)

#### Sprint 6: IndexedDB & Local Storage

**Goals:**
- IndexedDB setup for offline data
- Character data persistence
- Query and filtering from local DB
- Cache invalidation strategy

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S6-1 | Set up IndexedDB with idb library | Frontend | 2h | P0 |
| S6-2 | Create IndexedDB schema for characters | Frontend | 2h | P0 |
| S6-3 | Implement local character store service | Frontend | 3h | P0 |
| S6-4 | Create LocalStorage for user settings | Frontend | 1h | P0 |
| S6-5 | Implement cache invalidation logic | Frontend | 2h | P0 |
| S6-6 | Write IndexedDB service tests | Testing | 3h | P1 |

**Deliverables:**
- IndexedDB setup and schema
- Character data persistence to IndexedDB
- Query service for local data
- Cache management

---

#### Sprint 7: Cloud Character Sync

**Goals:**
- Character sync to cloud API
- Conflict detection mechanism
- Sync queue for offline changes
- Sync status tracking

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S7-1 | Create SyncHistory entity | Backend | 1h | P0 |
| S7-2 | Implement sync service (conflict detection) | Backend | 4h | P0 |
| S7-3 | Create POST /api/sync endpoint | Backend | 2h | P0 |
| S7-4 | Add lastSyncedAt to character model | Backend | 1h | P0 |
| S7-5 | Write sync service tests | Testing | 3h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S7-6 | Create sync service for API communication | Frontend | 2h | P0 |
| S7-7 | Implement sync queue management | Frontend | 2h | P0 |
| S7-8 | Add offline/online state detection | Frontend | 1h | P0 |
| S7-9 | Create Redux sync slice | Frontend | 2h | P0 |
| S7-10 | Implement automatic sync on reconnect | Frontend | 2h | P0 |
| S7-11 | Add sync status indicator UI | Frontend | 1h | P0 |

**Deliverables:**
- Cloud sync endpoint with conflict detection
- Sync queue for offline changes
- Online/offline state management
- Sync status indicator in UI
- Automatic sync on reconnect

---

#### Sprint 8: Conflict Resolution UI

**Goals:**
- Conflict detection and notification
- Side-by-side comparison UI
- Version selection and merge
- Conflict history

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S8-1 | Create POST /api/sync/resolve-conflict endpoint | Backend | 2h | P0 |
| S8-2 | Implement conflict version storage | Backend | 1h | P0 |
| S8-3 | Create GET /api/sync/history endpoint | Backend | 2h | P0 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S8-4 | Build conflict detection and notification | Frontend | 2h | P0 |
| S8-5 | Create conflict resolution dialog | Frontend | 3h | P0 |
| S8-6 | Implement side-by-side diff view | Frontend | 3h | P0 |
| S8-7 | Build version selection and merge UI | Frontend | 2h | P0 |
| S8-8 | Create conflict history view | Frontend | 2h | P1 |

**Deliverables:**
- Conflict resolution endpoints
- Conflict detection and UI
- Side-by-side comparison view
- User-driven conflict resolution
- Conflict history tracking

---

#### Sprint 9: Offline Mode & Service Workers

**Goals:**
- Service worker registration and caching
- Offline page indicator
- Network state monitoring
- Background sync (web)

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S9-1 | Create service worker for app shell caching | Frontend | 3h | P0 |
| S9-2 | Implement static asset caching strategy | Frontend | 2h | P0 |
| S9-3 | Create offline fallback page | Frontend | 1h | P0 |
| S9-4 | Implement network state monitoring | Frontend | 1h | P0 |
| S9-5 | Add background sync API for offline changes | Frontend | 2h | P1 |
| S9-6 | Write offline mode tests | Testing | 2h | P1 |

**Deliverables:**
- Service worker and caching strategy
- Offline indicator and fallback page
- Network state detection
- Offline changes queued and synced

---

### Phase 3: Features (Weeks 10-13)

#### Sprint 10: Character Sheet Visualization

**Goals:**
- Complete character sheet display
- System-specific formatting
- Print-friendly layout
- Character edit mode

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S10-1 | Create character sheet component structure | Frontend | 2h | P0 |
| S10-2 | Build attributes section | Frontend | 1h | P0 |
| S10-3 | Build skills section | Frontend | 2h | P0 |
| S10-4 | Build equipment section | Frontend | 2h | P0 |
| S10-5 | Build spells section | Frontend | 2h | P0 |
| S10-6 | Build traits section | Frontend | 1h | P0 |
| S10-7 | Add print styles | Frontend | 1h | P0 |
| S10-8 | Implement character edit mode | Frontend | 2h | P0 |

**Deliverables:**
- Complete character sheet view
- Print-friendly layout
- Character editing capability
- System-specific formatting

---

#### Sprint 11: PDF Export

**Goals:**
- PDF generation for character sheets
- System-specific templates
- Server-side PDF rendering
- Client-side PDF download

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S11-1 | Set up PDF generation library (PDFKit) | Backend | 1h | P0 |
| S11-2 | Create PDF template engine | Backend | 3h | P0 |
| S11-3 | Create POST /api/characters/:id/export endpoint | Backend | 2h | P0 |
| S11-4 | Implement D&D 5e PDF template | Backend | 4h | P0 |
| S11-5 | Write PDF generation tests | Testing | 2h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S11-6 | Create PDF export button and UI | Frontend | 1h | P0 |
| S11-7 | Implement PDF download from API | Frontend | 1h | P0 |

**Deliverables:**
- PDF export endpoint
- D&D 5e PDF template
- PDF download in frontend
- PDF generation tests

---

#### Sprint 12: Party Management

**Goals:**
- Party creation and editing
- Party member management
- Party views and statistics
- Party persistence

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S12-1 | Create Party and PartyMember entities | Backend | 2h | P0 |
| S12-2 | Create party database migrations | Backend | 1h | P0 |
| S12-3 | Implement party service (CRUD) | Backend | 3h | P0 |
| S12-4 | Create party routes | Backend | 2h | P0 |
| S12-5 | Write party service tests | Testing | 2h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S12-6 | Create party list component | Frontend | 2h | P0 |
| S12-7 | Build party creation form | Frontend | 2h | P0 |
| S12-8 | Build party detail view | Frontend | 2h | P0 |
| S12-9 | Create add/remove member UI | Frontend | 1h | P0 |
| S12-10 | Build party statistics component | Frontend | 2h | P0 |
| S12-11 | Create Redux party slice | Frontend | 2h | P0 |

**Deliverables:**
- Party CRUD API endpoints
- Party management UI
- Party member management
- Party statistics view

---

#### Sprint 13: Character Sharing with Tokens

**Goals:**
- Share token generation
- Public share link access
- Share token expiration
- View-only character access

**Backend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S13-1 | Create ShareToken entity | Backend | 1h | P0 |
| S13-2 | Create share token service | Backend | 2h | P0 |
| S13-3 | Create POST /api/share/:characterId endpoint | Backend | 2h | P0 |
| S13-4 | Create GET /api/share/:token endpoint (public) | Backend | 2h | P0 |
| S13-5 | Create DELETE /api/share/:token endpoint | Backend | 1h | P0 |
| S13-6 | Implement token expiration logic | Backend | 1h | P0 |
| S13-7 | Write share service tests | Testing | 2h | P1 |

**Frontend Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S13-8 | Create share dialog component | Frontend | 2h | P0 |
| S13-9 | Implement share link generation UI | Frontend | 1h | P0 |
| S13-10 | Create public share page layout | Frontend | 2h | P0 |
| S13-11 | Build share token list view | Frontend | 1h | P0 |
| S13-12 | Create revoke share button | Frontend | 1h | P0 |

**Deliverables:**
- Share token generation and management
- Public share link access
- View-only character sharing
- Share token expiration

---

### Phase 4: Desktop & Polish (Weeks 14-17)

#### Sprint 14: Electron Desktop App Setup

**Goals:**
- Electron main process setup
- Shared code between web and desktop
- Build and packaging configuration
- IPC communication

**Desktop Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S14-1 | Set up Electron main.ts and preload | Desktop | 3h | P0 |
| S14-2 | Create electron-builder configuration | Desktop | 2h | P0 |
| S14-3 | Set up IPC communication patterns | Desktop | 2h | P0 |
| S14-4 | Implement file system access (IPC) | Desktop | 2h | P0 |
| S14-5 | Create build scripts for desktop | Desktop | 2h | P0 |
| S14-6 | Test desktop build and packaging | Testing | 2h | P0 |

**Deliverables:**
- Electron app setup
- IPC communication
- Packaging configuration
- Desktop builds for Windows/Mac/Linux

---

#### Sprint 15: Desktop SQLite Integration

**Goals:**
- SQLite database for desktop offline storage
- Data sync between SQLite and cloud
- Migration from IndexedDB (web)
- Persistent local cache

**Desktop Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S15-1 | Set up SQLite with better-sqlite3 or Prisma | Desktop | 2h | P0 |
| S15-2 | Create SQLite schema (mirror cloud schema) | Desktop | 2h | P0 |
| S15-3 | Implement local storage service for desktop | Desktop | 3h | P0 |
| S15-4 | Create data migration from cloud to local | Desktop | 2h | P0 |
| S15-5 | Implement SQLite to cloud sync | Desktop | 2h | P0 |
| S15-6 | Write SQLite tests | Testing | 2h | P1 |

**Deliverables:**
- SQLite setup and schema
- Local storage service
- Desktop sync strategy
- Data migration capability

---

#### Sprint 16: Desktop UI & Features

**Goals:**
- Desktop-specific UI improvements
- File menu and shortcuts
- Character export to local files
- Settings/preferences panel

**Desktop Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S16-1 | Create desktop menu structure | Desktop | 2h | P0 |
| S16-2 | Implement File menu (New, Open, Save, Export) | Desktop | 3h | P0 |
| S16-3 | Implement Edit menu (Undo, Redo, Preferences) | Desktop | 2h | P0 |
| S16-4 | Create Settings/Preferences dialog | Desktop | 2h | P0 |
| S16-5 | Implement character export to local filesystem | Desktop | 2h | P0 |
| S16-6 | Add keyboard shortcuts | Desktop | 1h | P0 |

**Deliverables:**
- Desktop menus and UI
- File operations
- Settings panel
- Keyboard shortcuts

---

#### Sprint 17: Testing & Polish

**Goals:**
- Comprehensive test coverage
- Bug fixes and refinements
- Performance optimization
- Documentation

**Testing Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S17-1 | End-to-end tests (character creation) | Testing | 4h | P0 |
| S17-2 | End-to-end tests (offline sync flow) | Testing | 3h | P0 |
| S17-3 | End-to-end tests (party management) | Testing | 2h | P0 |
| S17-4 | End-to-end tests (sharing) | Testing | 2h | P0 |
| S17-5 | Performance tests and optimization | Testing | 3h | P0 |
| S17-6 | Bug fixes from testing | Bug Fixes | 5h | P0 |

**Documentation Tasks:**

| ID | Task | Type | Estimate | Priority |
|----|------|------|----------|----------|
| S17-7 | Create API documentation (Swagger) | Docs | 3h | P1 |
| S17-8 | Write development guide | Docs | 2h | P1 |
| S17-9 | Create user guide | Docs | 3h | P1 |

**Deliverables:**
- Comprehensive E2E tests
- Bug fixes and polish
- API documentation
- Development and user guides

---

### Phase 5: Community & Scale (Ongoing)

**Future Sprints (Post-Launch):**
- S18: Custom system configuration UI
- S19: Community system sharing
- S20: Real-time collaboration (edit sharing)
- S21: Advanced party features (campaign tracking, notes)
- S22: Analytics and monitoring
- S23: Performance scaling
- S24: Mobile app (React Native)

---

## 3. Technical Implementation Details

### 3.1 Redux State Structure

```typescript
// store/index.ts
export interface RootState {
  auth: AuthState;
  characters: CharacterState;
  parties: PartyState;
  systems: SystemState;
  sync: SyncState;
  ui: UIState;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

interface CharacterState {
  byId: Record<string, Character>;
  allIds: string[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  conflicts: CharacterConflict[];
  queue: SyncQueueItem[];
}
```

### 3.2 Database Schema (TypeORM Entities)

```typescript
// Backend models
@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  display_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Character, character => character.user)
  characters: Character[];

  @OneToMany(() => Party, party => party.user)
  parties: Party[];
}

@Entity()
export class Character {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.characters)
  user: User;

  @Column()
  system_id: string;

  @Column()
  name: string;

  @Column('jsonb')
  data: CharacterData;

  @Column({ default: false })
  is_shared: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  last_synced_at: Date;

  @Column({ default: 'synced' })
  sync_status: 'synced' | 'pending' | 'conflict';

  @OneToMany(() => ShareToken, token => token.character)
  share_tokens: ShareToken[];

  @OneToMany(() => SyncHistory, history => history.character)
  sync_history: SyncHistory[];
}

// ... more entities
```

### 3.3 API Error Handling Strategy

```typescript
// Standardized error response
{
  "success": false,
  "error": {
    "code": "CHARACTER_NOT_FOUND",
    "message": "Character with ID xyz not found",
    "statusCode": 404,
    "timestamp": "2025-12-23T10:30:00Z"
  }
}

// Error codes
enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SHARE_TOKEN_EXPIRED = 'SHARE_TOKEN_EXPIRED',
  // ... more
}
```

### 3.4 Testing Strategy

**Unit Tests:**
- Redux reducers and actions
- Service layer logic
- Utility functions
- Validation schemas

**Integration Tests:**
- Character CRUD flow
- Sync mechanism with conflict detection
- Party member operations
- Share token generation and validation

**E2E Tests:**
- Full character creation workflow
- Offline → Online sync scenario
- Party management flow
- Sharing and access flow

**Test Coverage Target:** 80%+ overall, 90%+ for critical paths

---

## 4. Critical Path & Dependencies

**Critical Path (Must Complete Before Next):**

1. Sprint 0: Setup
2. Sprint 1: Auth (all tasks)
3. Sprint 2: Character Models (all tasks)
4. Sprint 3: System Config (all tasks)
5. Sprint 4-5: Character Creation Wizard (all tasks)
6. Sprint 6-9: Offline & Sync (must complete for app functionality)
7. Sprint 10-13: Features (can work in parallel with desktop)
8. Sprint 14-17: Desktop & Testing

**Parallel Work Possible:**
- S10 (Character Sheet) can start after S5
- S11 (PDF) can start after S10
- S12 (Parties) independent after S7
- S13 (Sharing) independent after S7

---

## 5. Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Scope creep | Timeline slippage | High | Define MVP, strict feature gates, weekly reviews |
| Database migration issues | Data loss | Medium | Test migrations, backup strategy, staging environment |
| Offline sync edge cases | Data inconsistency | Medium | Comprehensive testing, conflict resolution tests |
| Performance degradation at scale | Poor UX | Medium | Profiling, lazy loading, pagination, caching |
| Third-party API failures | Broken features | Low | Circuit breaker pattern, graceful degradation |

---

## 6. Success Criteria

### Phase 1 (Core Foundation)
- ✓ Users can create and manage characters
- ✓ Multiple RPG systems supported via config
- ✓ Characters persist locally

### Phase 2 (Cloud & Sync)
- ✓ Characters sync to cloud
- ✓ Offline changes sync automatically on reconnect
- ✓ Conflicts resolved by user choice

### Phase 3 (Features)
- ✓ Character sheets visualize correctly
- ✓ PDF export works for all systems
- ✓ Parties can be created and managed
- ✓ Characters can be shared with view-only access

### Phase 4 (Desktop & Polish)
- ✓ Desktop app builds and runs
- ✓ All features work on desktop and web
- ✓ 80%+ test coverage
- ✓ Documentation complete

### Phase 5 (Community & Scale)
- ✓ Community can add custom systems
- ✓ Real-time collaboration available
- ✓ Scaling tests passed

---

## 7. Resource Allocation

**Recommended Team:**
- 1 Tech Lead / Architect
- 1-2 Backend Engineers
- 2-3 Frontend Engineers
- 1 Full-Stack Engineer (mobile/desktop)
- 1 QA Engineer
- 1 DevOps Engineer
- 1 Product Manager

**Estimated Effort:**
- Full Implementation: 17 sprints × 2 weeks = 34 weeks
- With team of 6: ~17-20 weeks to Phase 4 completion
- Ongoing: Community & Scale features (1+ sprints/month)

---

## 8. Tools & Services Checklist

- [ ] GitHub repository with monorepo setup
- [ ] npm workspaces configured
- [ ] VS Code recommended extensions documented
- [ ] PostgreSQL local setup (Docker Compose)
- [ ] AWS account (RDS, S3, CloudFront)
- [ ] SendGrid or similar for email notifications
- [ ] Sentry or Rollbar for error tracking
- [ ] GitHub Actions CI/CD configured
- [ ] Staging and production environments
- [ ] Monitoring dashboard (CloudWatch, Datadog)
- [ ] Backup and disaster recovery plan

---

## Next Steps

1. **Review & Approval:** Get stakeholder sign-off on this plan
2. **Sprint 0 Execution:** Start with project setup
3. **Continuous Refinement:** Adjust estimates after Sprint 0-1
4. **Weekly Check-ins:** Monitor progress and identify blockers
5. **Stakeholder Updates:** Bi-weekly status reports

