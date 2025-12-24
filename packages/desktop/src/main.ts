import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import { DatabaseManager } from './database/DatabaseManager';
import { CharacterService } from './services/CharacterService';
import { SyncService } from './services/SyncService';

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;
let dbManager: DatabaseManager | null = null;
let characterService: CharacterService | null = null;
let syncService: SyncService | null = null;

const isProduction = process.env.NODE_ENV === 'production';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isProduction) {
    // In packaged app, frontend is in resources/frontend/dist
    // In dev with NODE_ENV=production, it's in sibling package
    let frontendPath: string;
    if (app.isPackaged) {
      frontendPath = path.join(process.resourcesPath, 'frontend/dist/index.html');
    } else {
      frontendPath = path.join(__dirname, '../../frontend/dist/index.html');
    }
    mainWindow.loadFile(frontendPath);
  } else {
    // Load from Vite dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'character-creator.db');

    dbManager = new DatabaseManager(dbPath);
    await dbManager.initialize();

    // Initialize services
    characterService = new CharacterService(dbManager);
    syncService = new SyncService(dbManager, {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
    });

    console.log('Database initialized at:', dbPath);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// App lifecycle
app.on('ready', async () => {
  await initializeDatabase();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    await createWindow();
  }
});

app.on('will-quit', async () => {
  if (dbManager) {
    await dbManager.close();
  }
});

// IPC Handlers
ipcMain.handle('db:query', async (_event: IpcMainInvokeEvent, sql: string, params?: any[]) => {
  if (!dbManager) {
    throw new Error('Database not initialized');
  }
  return dbManager.query(sql, params);
});

ipcMain.handle('db:run', async (_event: IpcMainInvokeEvent, sql: string, params?: any[]) => {
  if (!dbManager) {
    throw new Error('Database not initialized');
  }
  return dbManager.run(sql, params);
});

ipcMain.handle('db:get', async (_event: IpcMainInvokeEvent, sql: string, params?: any[]) => {
  if (!dbManager) {
    throw new Error('Database not initialized');
  }
  return dbManager.get(sql, params);
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:isElectron', () => {
  return true;
});

// Character IPC Handlers
ipcMain.handle('characters:create', async (_event: IpcMainInvokeEvent, userId: string, input: any) => {
  if (!characterService) {
    throw new Error('Character service not initialized');
  }
  const character = await characterService.createCharacter(userId, input);
  return characterService.exportAsJSON(character);
});

ipcMain.handle('characters:getById', async (_event: IpcMainInvokeEvent, id: string, userId: string) => {
  if (!characterService) {
    throw new Error('Character service not initialized');
  }
  const character = await characterService.getCharacterById(id, userId);
  return character ? characterService.exportAsJSON(character) : null;
});

ipcMain.handle('characters:getByUserId', async (_event: IpcMainInvokeEvent, userId: string, filters?: any) => {
  if (!characterService) {
    throw new Error('Character service not initialized');
  }
  const result = await characterService.getCharactersByUserId(userId, filters);
  return {
    characters: result.characters.map((c) => characterService!.exportAsJSON(c)),
    total: result.total,
  };
});

ipcMain.handle('characters:update', async (_event: IpcMainInvokeEvent, id: string, userId: string, updates: any) => {
  if (!characterService) {
    throw new Error('Character service not initialized');
  }
  const character = await characterService.updateCharacter(id, userId, updates);
  return characterService.exportAsJSON(character);
});

ipcMain.handle('characters:delete', async (_event: IpcMainInvokeEvent, id: string, userId: string) => {
  if (!characterService) {
    throw new Error('Character service not initialized');
  }
  return characterService.deleteCharacter(id, userId);
});

// Sync IPC Handlers
ipcMain.handle('sync:status', () => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  return syncService.getSyncStatus();
});

ipcMain.handle('sync:isOnline', () => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  return syncService.isDeviceOnline();
});

ipcMain.handle('sync:now', async () => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  return syncService.forceSyncNow();
});

ipcMain.handle('sync:setAuthToken', (_event: IpcMainInvokeEvent, token: string) => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  syncService['options'].authToken = token;
});

ipcMain.handle('sync:startAuto', (_event: IpcMainInvokeEvent, intervalMs?: number) => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  syncService.startAutoSync(intervalMs);
});

ipcMain.handle('sync:stopAuto', () => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  syncService.stopAutoSync();
});

ipcMain.handle('sync:setOnlineStatus', (_event: IpcMainInvokeEvent, isOnline: boolean) => {
  if (!syncService) {
    throw new Error('Sync service not initialized');
  }
  syncService.setOnlineStatus(isOnline);
});
