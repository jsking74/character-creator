# Character Creator Desktop Application

Electron-based desktop application for Character Creator with offline SQLite storage.

## Features

- **Offline-First**: All data stored locally in SQLite database
- **Background Sync**: Automatically syncs with server when online
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Native Experience**: Full desktop app with system tray support

## Architecture

### Main Process ([src/main.ts](src/main.ts))
- Initializes Electron window
- Manages SQLite database connection
- Handles IPC communication with renderer process
- Manages app lifecycle

### Preload Script ([src/preload.ts](src/preload.ts))
- Exposes secure IPC API to renderer process
- Uses Context Isolation for security
- Type-safe database operations

### Database Manager ([src/database/DatabaseManager.ts](src/database/DatabaseManager.ts))
- Manages SQLite database using sql.js
- Creates and migrates database schema
- Provides query, get, and run methods
- Handles transactions

## Database Schema

The desktop app mirrors the backend PostgreSQL schema:

- **users**: User authentication and profiles
- **system_configs**: RPG system configurations (D&D 5e, etc.)
- **characters**: Character data with JSONB-like TEXT storage
- **parties**: Party management
- **party_members**: Party membership
- **sync_metadata**: Tracks synchronization state

## Frontend Integration

### Electron Detection ([packages/frontend/src/utils/electron.ts](../frontend/src/utils/electron.ts))

```typescript
import { isElectron, getElectronAPI } from '../utils/electron';

if (isElectron()) {
  const api = getElectronAPI();
  const characters = await api.db.query('SELECT * FROM characters WHERE user_id = ?', [userId]);
}
```

### Offline Storage Service ([packages/frontend/src/services/offlineStorage.ts](../frontend/src/services/offlineStorage.ts))

Provides high-level API for managing characters, systems, and sync:

```typescript
import { offlineStorage } from '../services/offlineStorage';

// Check availability
if (offlineStorage.isAvailable()) {
  // Get characters
  const characters = await offlineStorage.getCharacters(userId);

  // Create character
  await offlineStorage.createCharacter(userId, systemId, name, characterData);

  // Sync with server
  await offlineStorage.syncCharactersFromServer(serverCharacters);
}
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This runs the frontend Vite dev server and Electron concurrently.

### Build

```bash
npm run build
```

Builds both the frontend and Electron main process.

### Create Distribution

```bash
npm run dist
```

Uses electron-builder to create platform-specific installers.

## Database Storage

The SQLite database is stored in the user's application data directory:

- **Windows**: `%APPDATA%/character-creator/character-creator.db`
- **macOS**: `~/Library/Application Support/character-creator/character-creator.db`
- **Linux**: `~/.config/character-creator/character-creator.db`

## IPC API

### Database Operations

```typescript
// Query (returns array)
window.electronAPI.db.query(sql: string, params?: any[]): Promise<any[]>

// Get (returns single row)
window.electronAPI.db.get(sql: string, params?: any[]): Promise<any>

// Run (for INSERT/UPDATE/DELETE)
window.electronAPI.db.run(sql: string, params?: any[]): Promise<{ changes: number; lastID: number }>
```

### App Information

```typescript
// Get app version
window.electronAPI.app.getVersion(): Promise<string>

// Check if running in Electron
window.electronAPI.app.isElectron(): Promise<boolean>
```

## Security

- **Context Isolation**: Renderer process cannot access Node.js APIs directly
- **Preload Script**: Only exposes specific, safe APIs
- **No Remote Module**: All IPC handled through secure channels
- **SQL Injection Protection**: All queries use parameterized statements

## Sync Strategy

The desktop app uses a bidirectional sync strategy:

1. **On Startup**: Pull latest data from server if online
2. **On Create/Update**: Save locally, queue for sync
3. **When Online**: Push local changes to server
4. **Periodic Sync**: Background sync every 60 seconds
5. **Conflict Resolution**: Server version wins by default

See [packages/frontend/src/services/offlineStorage.ts](../frontend/src/services/offlineStorage.ts) for implementation details.

## Troubleshooting

### Database Locked

If you get "database is locked" errors:
1. Close all instances of the app
2. Delete the database file (will be recreated)
3. Restart the app

### Sync Issues

If data isn't syncing:
1. Check network connection
2. Verify server is running
3. Check console for sync errors
4. Force sync by restarting the app

### Build Issues

If electron-builder fails:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Ensure all dependencies are installed
3. Check electron-builder logs for specific errors

## Future Enhancements

- [ ] Conflict resolution UI
- [ ] Selective sync (choose what to sync)
- [ ] Offline-only mode
- [ ] Database encryption
- [ ] Auto-update support
- [ ] System tray integration
- [ ] Native notifications
