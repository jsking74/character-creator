# Character Creator App - Design Document

## Executive Summary

The Character Creator is a cross-platform (web and desktop) application for creating, managing, and sharing characters for tabletop role-playing games (TTRPGs). The application supports multiple RPG systems through a flexible configuration-driven architecture, enabling users to create characters for D&D 5e, Pathfinder, and custom systems without requiring code modifications.

**Key Features:**
- Multi-system character creation with extensible configuration files
- Offline-first architecture with automatic cloud synchronization
- Character sheet visualization and PDF export
- Party management and view-only character sharing
- Cross-platform support (web browser and desktop applications)
- Cloud-based data persistence with user conflict resolution

**Technical Stack:**
- **Frontend:** React/Vue (web), Electron (desktop)
- **Backend:** Node.js/Python REST API
- **Database:** PostgreSQL + Firebase/AWS for cloud storage
- **Storage:** LocalStorage/SQLite (offline), Cloud Database (sync)

---

## 1. System Configuration File Format

### 1.1 Configuration File Structure (YAML/JSON)

RPG systems are defined via configuration files that describe character attributes, skills, abilities, equipment, and spells. This allows new systems to be added without code changes.

**File Format:** `systems/{system-name}/config.yaml` or `.json`

```yaml
system:
  id: "dnd5e"
  name: "Dungeons & Dragons 5th Edition"
  version: "1.0.0"
  description: "Character creation for D&D 5e"
  author: "Wizards of the Coast"
  compatibility: "1.0.0"

attributes:
  core:
    - id: "strength"
      name: "Strength"
      description: "Measures bodily power"
      abbreviation: "STR"
      type: "numeric"
      min: 3
      max: 20
      default: 10
    - id: "dexterity"
      name: "Dexterity"
      abbreviation: "DEX"
      type: "numeric"
      min: 3
      max: 20
      default: 10
    - id: "constitution"
      name: "Constitution"
      abbreviation: "CON"
      type: "numeric"
      min: 3
      max: 20
      default: 10
    - id: "intelligence"
      name: "Intelligence"
      abbreviation: "INT"
      type: "numeric"
      min: 3
      max: 20
      default: 10
    - id: "wisdom"
      name: "Wisdom"
      abbreviation: "WIS"
      type: "numeric"
      min: 3
      max: 20
      default: 10
    - id: "charisma"
      name: "Charisma"
      abbreviation: "CHA"
      type: "numeric"
      min: 3
      max: 20
      default: 10

classes:
  - id: "barbarian"
    name: "Barbarian"
    description: "A fierce warrior of primitive background"
    hitDice: "d12"
    primaryAbility: "strength"
    savingThrows: ["strength", "constitution"]
    
  - id: "bard"
    name: "Bard"
    description: "An inspiring magician whose power echoes the music of creation"
    hitDice: "d8"
    primaryAbility: "charisma"
    savingThrows: ["dexterity", "charisma"]

races:
  - id: "human"
    name: "Human"
    abilityBonuses:
      - attribute: "all"
        bonus: 1
    size: "medium"
    speed: 30
    languages: ["common"]
    
  - id: "elf"
    name: "Elf"
    abilityBonuses:
      - attribute: "dexterity"
        bonus: 2
    size: "medium"
    speed: 30
    languages: ["common", "elvish"]
    traits:
      - id: "darkvision"
        name: "Darkvision"
        description: "Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions"

skills:
  - id: "acrobatics"
    name: "Acrobatics"
    ability: "dexterity"
    
  - id: "animal_handling"
    name: "Animal Handling"
    ability: "wisdom"
    
  - id: "arcana"
    name: "Arcana"
    ability: "intelligence"

equipment:
  weapons:
    - id: "longsword"
      name: "Longsword"
      damage: "1d8"
      damageType: "slashing"
      weight: 3
      cost: "15 gp"
      properties: ["versatile"]
      
  armor:
    - id: "plate"
      name: "Plate"
      armorClass: 18
      weight: 65
      cost: "1,500 gp"
      armorType: "heavy"
      
  adventuringGear:
    - id: "backpack"
      name: "Backpack"
      weight: 5
      cost: "2 gp"

spells:
  - id: "magic_missile"
    name: "Magic Missile"
    level: 1
    school: "evocation"
    castingTime: "1 action"
    range: "120 feet"
    components: ["V", "S"]
    duration: "Instantaneous"
    description: "You hurl a mote of magical force at a creature or object you can see within range..."
```

### 1.2 Configuration Sources

- **Bundled Configs:** Included in application package for official systems
- **Cloud Configs:** Downloaded from cloud server for custom/community systems
- **Local Configs:** User-created custom system definitions stored locally

**Priority:** Local > Cloud Downloaded > Bundled

---

## 2. Character Data Schema

### 2.1 Character Model

```json
{
  "id": "char_uuid",
  "userId": "user_uuid",
  "systemId": "dnd5e",
  "name": "Aragorn",
  "description": "A ranger from the north",
  "image": "url_or_base64",
  "createdAt": "2025-12-23T10:00:00Z",
  "updatedAt": "2025-12-23T10:30:00Z",
  "lastSyncedAt": "2025-12-23T10:30:00Z",
  "syncStatus": "synced",
  "isShared": false,
  "sharedWith": ["user_uuid_2"],
  "shareToken": "token_abc123",
  "shareExpiresAt": null,
  
  "attributes": {
    "strength": 16,
    "dexterity": 14,
    "constitution": 15,
    "intelligence": 12,
    "wisdom": 13,
    "charisma": 11
  },
  
  "basics": {
    "race": "human",
    "class": "ranger",
    "level": 5,
    "experience": 6500,
    "alignment": "chaotic_good",
    "background": "outlander"
  },
  
  "hitPoints": {
    "current": 42,
    "maximum": 42,
    "temporary": 0
  },
  
  "skills": {
    "acrobatics": {
      "proficient": false,
      "modifier": 2
    },
    "animal_handling": {
      "proficient": true,
      "modifier": 5
    }
  },
  
  "proficiencies": {
    "skills": ["animal_handling", "nature"],
    "weapons": ["simple", "martial"],
    "armor": ["light", "medium"]
  },
  
  "equipment": {
    "weapons": [
      {
        "id": "longsword",
        "name": "Longsword",
        "quantity": 1,
        "equipped": true
      }
    ],
    "armor": [
      {
        "id": "studded_leather",
        "name": "Studded Leather Armor",
        "equipped": true
      }
    ],
    "backpack": [
      {
        "id": "backpack",
        "name": "Backpack",
        "quantity": 1
      }
    ]
  },
  
  "spells": {
    "prepared": [
      {
        "id": "magic_missile",
        "name": "Magic Missile",
        "castingTime": "1 action",
        "level": 1
      }
    ]
  },
  
  "traits": {
    "features": ["ranger_favored_enemy", "ranger_fighting_style"],
    "flaws": "Too trusting of strangers",
    "bonds": "Seeks to protect the innocent",
    "ideals": "Freedom"
  },
  
  "backstory": {
    "description": "Born in the wild, raised by rangers...",
    "notes": "Additional character notes"
  },
  
  "currency": {
    "platinum": 0,
    "gold": 150,
    "electrum": 0,
    "silver": 20,
    "copper": 5
  },
  
  "metadata": {
    "version": 1,
    "isOfflineCopy": false,
    "conflictVersion": null,
    "tags": ["ranger", "human", "level5"]
  }
}
```

### 2.2 Party Model

```json
{
  "id": "party_uuid",
  "userId": "user_uuid",
  "name": "The Fellowship",
  "description": "An adventuring party",
  "createdAt": "2025-12-23T10:00:00Z",
  "updatedAt": "2025-12-23T10:30:00Z",
  "members": [
    {
      "characterId": "char_uuid_1",
      "role": "ranger",
      "joinedAt": "2025-12-23T10:00:00Z"
    },
    {
      "characterId": "char_uuid_2",
      "role": "wizard",
      "joinedAt": "2025-12-23T10:05:00Z"
    }
  ],
  "settings": {
    "campaignName": "Lost Mines of Phandelver",
    "gm": "user_uuid_gm"
  }
}
```

---

## 3. Feature Specifications

### 3.1 Character Creation Workflow

**Flow:**
1. User selects RPG system from available configs (bundled or cloud)
2. User enters basic character information (name, race, class)
3. System applies ability score generation (point buy, standard array, rolling)
4. User selects skills and proficiencies based on class/race
5. User selects equipment and starting items
6. User configures character traits, bonds, ideals, flaws
7. User adds backstory and character image
8. Character is saved locally first, then synced to cloud

**Validation:**
- All required fields must be populated
- Ability scores within system limits (3-20 for D&D 5e)
- Skills/proficiencies valid for selected class/race
- Equipment weight limits respected
- Currency totals valid

### 3.2 Character Visualization (Character Sheet)

Display formatted character sheet with:
- **Header:** Character name, race, class, level, alignment
- **Attributes:** All core attributes with modifiers
- **Hit Points:** Current, maximum, temporary
- **Skills:** List with proficiency and modifiers
- **Equipment:** Weapons, armor, inventory with weight tracking
- **Spells:** Prepared spells, spell slots
- **Traits:** Features, flaws, bonds, ideals
- **Backstory:** Character description and notes

**Print/Export Options:**
- Standard sheet layout (web-optimized)
- Compact layout (mobile-optimized)
- Detailed layout (with all notes and backstory)

### 3.3 PDF Export

Generate a professional PDF character sheet with:
- All character information formatted for printing
- System-specific layout templates
- Support for official D&D, Pathfinder, and custom layouts
- Barcode/QR code with character share token (optional)

### 3.4 Party Management

**Features:**
- Create named parties/groups
- Add/remove party members
- View all party member sheets at once
- Compare party statistics (average level, composition)
- Party-level notes and campaign information
- Export entire party to PDF

### 3.5 View-Only Character Sharing

**Sharing Mechanism:**
1. User generates shareable link with unique token
2. Link can be set to expire or be permanent
3. Shared characters are read-only for recipients
4. Recipients can view character sheet and export PDF
5. Recipients cannot edit or delete shared characters
6. Share can be revoked at any time

**Share Link Format:** `https://charactercreator.app/share/SHARE_TOKEN`

### 3.6 Offline Functionality

**Offline Capabilities:**
- Create new characters
- Edit existing characters
- View saved characters
- Generate character sheets and PDFs
- Offline indicator shows sync status

**Offline Limitations:**
- Cannot download new RPG system configs
- Cannot share characters (requires cloud)
- Cannot access view-only shared characters

**Sync on Reconnect:**
- Automatic sync when internet connection restored
- User-triggered manual sync option
- Conflict resolution if character was edited on cloud and offline

### 3.7 Conflict Resolution

**Scenario:** Character edited both offline and online, conflicting changes on reconnect

**Resolution Process:**
1. Application detects conflict and displays notification
2. User sees side-by-side comparison of offline vs. cloud versions
3. User selects which version to keep or manually merge changes
4. Selected version is saved and synced to cloud
5. Conflict is logged in character history/audit trail

---

## 4. Architecture Overview

### 4.1 Frontend Architecture

**Web Application:**
- Framework: React 18+ or Vue 3+
- State Management: Redux/Zustand (web), Pinia/Vuex (Vue)
- Local Storage: IndexedDB for offline data
- UI Framework: Material-UI, Tailwind, or custom components
- Build Tool: Vite or Webpack
- Package Manager: npm or pnpm

**Desktop Application:**
- Framework: Electron
- Renderer: React (same as web)
- Preload: Electron preload scripts for system access
- IPC: Electron IPC for main/renderer communication
- Storage: SQLite for offline persistence

**Shared Components:**
- Character creation wizard
- Character sheet display
- PDF generation
- Party management UI
- Sharing interface

### 4.2 Backend Architecture

**API Server:**
- Framework: Express.js (Node.js) or FastAPI (Python)
- Authentication: JWT tokens
- Rate Limiting: Token-based rate limiting
- Logging: Winston or structlog

**Core Services:**
- **Auth Service:** User registration, login, token management
- **Character Service:** CRUD operations for characters
- **Sync Service:** Handle offline sync and conflict resolution
- **Party Service:** Party management operations
- **Share Service:** Generate and manage share tokens
- **Config Service:** Serve RPG system configurations
- **Export Service:** PDF generation service

### 4.3 Database Architecture

**Primary Database:** PostgreSQL

**Schema:**
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters
CREATE TABLE characters (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  system_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'synced'
);

-- Share Tokens
CREATE TABLE share_tokens (
  id UUID PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

-- Parties
CREATE TABLE parties (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Party Members
CREATE TABLE party_members (
  id UUID PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES parties(id),
  character_id UUID NOT NULL REFERENCES characters(id),
  role VARCHAR(100),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configs
CREATE TABLE system_configs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  source VARCHAR(50) DEFAULT 'bundled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync History (for conflict resolution)
CREATE TABLE sync_history (
  id UUID PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  conflict BOOLEAN DEFAULT FALSE
);
```

---

## 5. API Specifications

### 5.1 Authentication Endpoints

```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh-token
GET /auth/user (requires JWT)
```

### 5.2 Character Endpoints

```
POST /api/characters              - Create character
GET /api/characters               - List user's characters
GET /api/characters/:id           - Get character by ID
PUT /api/characters/:id           - Update character
DELETE /api/characters/:id        - Delete character
POST /api/characters/:id/export   - Export to PDF
```

### 5.3 Sync Endpoints

```
POST /api/sync                    - Sync character changes (with conflict detection)
POST /api/sync/resolve-conflict   - Resolve conflicting changes
GET /api/sync/history/:characterId - Get sync history
```

### 5.4 Party Endpoints

```
POST /api/parties                 - Create party
GET /api/parties                  - List user's parties
GET /api/parties/:id              - Get party details
PUT /api/parties/:id              - Update party
DELETE /api/parties/:id           - Delete party
POST /api/parties/:id/members     - Add member to party
DELETE /api/parties/:id/members/:memberId - Remove member
```

### 5.5 Share Endpoints

```
POST /api/share/:characterId      - Create share link
GET /api/share/:token             - Get shared character (no auth)
DELETE /api/share/:token          - Revoke share link
GET /api/share/:characterId       - List share links for character
```

### 5.6 System Configuration Endpoints

```
GET /api/systems                  - List available systems
GET /api/systems/:systemId        - Get system config
POST /api/systems                 - Upload custom system (admin)
```

---

## 6. UI/UX Workflows

### 6.1 Desktop Application Layout

**Main Window:**
- Left Sidebar: Character list, parties, settings
- Main Content Area: Character creation wizard or character sheet
- Top Menu: File, Edit, View, Help

**Character List View:**
- Table/Grid of characters
- Filters: system, level, status
- Actions: Create, Edit, Delete, Share, Export, Add to Party

**Character Creation Wizard:**
- Step 1: System Selection
- Step 2: Basic Info (Name, Race, Class)
- Step 3: Ability Scores
- Step 4: Skills & Proficiencies
- Step 5: Equipment
- Step 6: Traits & Backstory
- Step 7: Review & Save

### 6.2 Web Application Layout

**Responsive Design:**
- Desktop: Similar to desktop app layout
- Tablet: Sidebar collapses, main content expands
- Mobile: Full-width, hamburger menu, wizard steps

**Key Pages:**
- `/dashboard` - Character list and quick actions
- `/characters/new` - Character creation wizard
- `/characters/:id` - Character sheet view/edit
- `/parties` - Party list and management
- `/settings` - User preferences, sync status
- `/share/:token` - View shared character (public)

### 6.3 Offline Status Indicator

**Visual Indicator:**
- Green checkmark when synced
- Yellow warning when offline
- Red alert when sync conflict
- Spinner during active sync

**Status Details:**
- Hover/click to see last sync time
- Show number of unsaved changes when offline
- Manual sync button available

### 6.4 Conflict Resolution UI

**Conflict Dialog:**
- Side-by-side comparison of versions
- Highlights differences in red
- Radio buttons to select version
- "Manual Merge" option for advanced users
- Preview of result before confirming

---

## 7. Technical Implementation Details

### 7.1 Offline-First Strategy

**Data Flow:**
1. All changes written to local storage first (optimistic update)
2. UI updates immediately for better UX
3. Background sync attempts to push to cloud
4. If sync fails, change queued for retry
5. On reconnect, sync queue processed automatically

**Technologies:**
- IndexedDB for web (large storage capacity)
- SQLite for desktop (persistent, queryable)
- Service Workers for web (background sync)
- Electron main process for desktop (background tasks)

### 7.2 Sync Algorithm

```
OnlineStateChange → 'online':
  1. Get all queued changes from local store
  2. For each change:
     a. POST to /api/sync with change and lastSyncedAt timestamp
     b. If response: success → mark as synced, remove from queue
     c. If response: conflict → trigger conflict resolution UI
     d. If request fails → add to retry queue
  3. Periodic retry of failed syncs (exponential backoff)
  
Conflict Detection:
  Server compares request.lastSyncedAt with current cloud.updatedAt
  If not equal: conflict detected, return both versions to client
```

### 7.3 Conflict Resolution Strategy

**User-Driven Resolution:**
1. Present both versions (local offline, cloud current)
2. Allow user to pick whole version or manually merge
3. Preserve change history for audit trail
4. Retry sync with resolved version

### 7.4 Configuration File Validation

**On App Load:**
1. Load bundled configs and validate against schema
2. Check cloud for config updates
3. Validate downloaded configs
4. Merge configs with priority: local > cloud > bundled
5. Cache validated configs in local storage

**Validation Schema:**
- Verify required sections (system, attributes, classes, races)
- Type checking for all values
- Reference integrity (ability references, class requirements)
- Uniqueness of IDs

### 7.5 PDF Generation

**Technology Stack:**
- PDFKit (Node.js backend) or similar
- Server-side generation for consistency
- System-specific templates (D&D 5e, Pathfinder, generic)

**Process:**
1. Character data sent to backend `/characters/:id/export`
2. Backend renders template with character data
3. PDF generated and returned to client
4. Desktop app can save locally; web app downloads

### 7.6 Authentication & Security

**JWT Tokens:**
- Access token (15 minutes expiry)
- Refresh token (7 days expiry)
- Stored securely in browser (httpOnly cookies if possible)

**Data Encryption:**
- Sensitive data encrypted at rest (password hashes, payment info)
- HTTPS enforced for all traffic
- API keys for service accounts

**CORS & CSP:**
- Whitelist allowed origins
- Content Security Policy headers

---

## 8. Data Security & Privacy

### 8.1 User Data Protection

- Passwords hashed with bcrypt or similar
- User data isolated per user (database-level)
- Shared characters restricted to read-only view
- Share tokens with optional expiration
- Audit trail for character modifications

### 8.2 Backup & Recovery

- Automatic cloud backups
- User character export capability
- Character history tracking (undo/redo)
- Deleted character recovery (soft delete with 30-day retention)

---

## 9. Extensibility & Future Enhancements

### 9.1 System Extensibility

**Custom Systems:**
- Users can create YAML/JSON configs for custom RPG systems
- Community marketplace for sharing custom systems
- Version control for system updates

### 9.2 Plugin Architecture (Future)

- Plugins for additional features
- Custom export formats
- Integration with other TTRPG tools (VTT, campaign management)

### 9.3 Multiplayer Features (Future)

- Real-time collaborative character editing (currently view-only share)
- Party-level campaign tracking
- Notes and comments on characters
- GM-specific tools

---

## 10. Development Roadmap

### Phase 1: Core (Months 1-2)
- ✓ Design document
- User authentication system
- Character creation for D&D 5e
- Local data storage (IndexedDB/SQLite)
- Basic character sheet display

### Phase 2: Cloud & Sync (Months 3-4)
- Cloud database setup
- Sync engine with conflict resolution
- Cloud character persistence
- Offline indicator and manual sync

### Phase 3: Features (Months 5-6)
- PDF export functionality
- Party management
- Character sharing with tokens
- Multi-system support

### Phase 4: Desktop & Polish (Months 7-8)
- Electron desktop application
- Desktop-specific features
- Performance optimization
- Bug fixes and testing

### Phase 5: Community & Scale (Months 9+)
- Custom system configuration UI
- Community system sharing
- Advanced party features
- Analytics and monitoring

---

## 11. Testing Strategy

### 11.1 Unit Tests

- Character model validation
- Skill/proficiency calculations
- Ability modifier calculations
- Configuration file parsing

### 11.2 Integration Tests

- Character creation workflow
- Sync and conflict resolution
- Share token generation and access
- PDF export functionality

### 11.3 E2E Tests

- Complete character creation flow (web and desktop)
- Offline → Online sync scenarios
- Party management workflows
- Share and view workflows

### 11.4 Performance Tests

- Large character lists (1000+ characters)
- PDF generation with complex characters
- Sync performance under network lag
- Database query optimization

---

## 12. Deployment & Infrastructure

### 12.1 Hosting

- **Backend:** AWS EC2, Heroku, or similar
- **Database:** AWS RDS (PostgreSQL), Azure Database
- **Object Storage:** AWS S3 for character images, PDFs
- **CDN:** CloudFront or Cloudflare for static assets

### 12.2 DevOps

- CI/CD pipeline (GitHub Actions, GitLab CI)
- Automated testing on PR
- Staging and production environments
- Database migrations and version control

### 12.3 Monitoring

- Application performance monitoring (APM)
- Error tracking (Sentry, Rollbar)
- User analytics
- Uptime monitoring

---

## Conclusion

This design document provides a comprehensive blueprint for building a scalable, user-friendly character creator for tabletop RPGs. The offline-first architecture ensures usability in any network condition, while the configuration-driven system design enables easy extensibility to new RPG systems. The phased roadmap allows for iterative development while maintaining quality and user focus.
