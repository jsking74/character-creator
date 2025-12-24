import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
export interface CharacterCreatorDB extends DBSchema {
  characters: {
    key: string;
    value: LocalCharacter;
    indexes: {
      'by-userId': string;
      'by-syncStatus': string;
    };
  };
  parties: {
    key: string;
    value: LocalParty;
    indexes: {
      'by-userId': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': number;
      'by-entityId': string;
    };
  };
  conflicts: {
    key: string;
    value: ConflictRecord;
    indexes: {
      'by-entityId': string;
    };
  };
  metadata: {
    key: string;
    value: MetadataRecord;
  };
}

// Local character with sync metadata
export interface LocalCharacter {
  id: string;
  userId: string;
  name: string;
  system: string;
  class: string;
  race: string;
  level: number;
  alignment?: string;
  background?: string;
  backstory?: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  abilityModifiers: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  health: {
    maxHitPoints: number;
    currentHitPoints: number;
    temporaryHitPoints: number;
  };
  gold: number;
  isPublic: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: string;
  localUpdatedAt: string;
}

// Local party with sync metadata
export interface LocalParty {
  id: string;
  userId: string;
  name: string;
  description?: string;
  maxSize: number;
  isPublic: boolean;
  members: Array<{
    id: string;
    name: string;
    class: string;
    level: number;
    role?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: string;
  localUpdatedAt: string;
}

// Sync queue item for offline operations
export interface SyncQueueItem {
  id: string;
  entityType: 'character' | 'party';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: LocalCharacter | LocalParty | Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// Conflict record for resolution
export interface ConflictRecord {
  id: string;
  entityType: 'character' | 'party';
  entityId: string;
  localVersion: LocalCharacter | LocalParty;
  serverVersion: LocalCharacter | LocalParty;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: 'local' | 'server' | 'merged';
}

// Metadata record
export interface MetadataRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

const DB_NAME = 'character-creator-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CharacterCreatorDB> | null = null;

// Initialize the database
export async function initDB(): Promise<IDBPDatabase<CharacterCreatorDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<CharacterCreatorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Characters store
      if (!db.objectStoreNames.contains('characters')) {
        const characterStore = db.createObjectStore('characters', { keyPath: 'id' });
        characterStore.createIndex('by-userId', 'userId');
        characterStore.createIndex('by-syncStatus', 'syncStatus');
      }

      // Parties store
      if (!db.objectStoreNames.contains('parties')) {
        const partyStore = db.createObjectStore('parties', { keyPath: 'id' });
        partyStore.createIndex('by-userId', 'userId');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-timestamp', 'timestamp');
        syncStore.createIndex('by-entityId', 'entityId');
      }

      // Conflicts store
      if (!db.objectStoreNames.contains('conflicts')) {
        const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
        conflictStore.createIndex('by-entityId', 'entityId');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Get the database instance
export async function getDB(): Promise<IDBPDatabase<CharacterCreatorDB>> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

// Close the database
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Character operations
export const characterStore = {
  async getAll(userId: string): Promise<LocalCharacter[]> {
    const db = await getDB();
    return db.getAllFromIndex('characters', 'by-userId', userId);
  },

  async getById(id: string): Promise<LocalCharacter | undefined> {
    const db = await getDB();
    return db.get('characters', id);
  },

  async save(character: LocalCharacter): Promise<void> {
    const db = await getDB();
    await db.put('characters', character);
  },

  async saveMany(characters: LocalCharacter[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('characters', 'readwrite');
    await Promise.all([
      ...characters.map((c) => tx.store.put(c)),
      tx.done,
    ]);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('characters', id);
  },

  async getPending(): Promise<LocalCharacter[]> {
    const db = await getDB();
    return db.getAllFromIndex('characters', 'by-syncStatus', 'pending');
  },

  async getConflicted(): Promise<LocalCharacter[]> {
    const db = await getDB();
    return db.getAllFromIndex('characters', 'by-syncStatus', 'conflict');
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('characters');
  },
};

// Party operations
export const partyStore = {
  async getAll(userId: string): Promise<LocalParty[]> {
    const db = await getDB();
    return db.getAllFromIndex('parties', 'by-userId', userId);
  },

  async getById(id: string): Promise<LocalParty | undefined> {
    const db = await getDB();
    return db.get('parties', id);
  },

  async save(party: LocalParty): Promise<void> {
    const db = await getDB();
    await db.put('parties', party);
  },

  async saveMany(parties: LocalParty[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('parties', 'readwrite');
    await Promise.all([
      ...parties.map((p) => tx.store.put(p)),
      tx.done,
    ]);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('parties', id);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('parties');
  },
};

// Sync queue operations
export const syncQueueStore = {
  async getAll(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAllFromIndex('syncQueue', 'by-timestamp');
  },

  async add(item: Omit<SyncQueueItem, 'id'>): Promise<string> {
    const db = await getDB();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queueItem: SyncQueueItem = { ...item, id };
    await db.put('syncQueue', queueItem);
    return id;
  },

  async update(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put('syncQueue', item);
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('syncQueue', id);
  },

  async removeByEntityId(entityId: string): Promise<void> {
    const db = await getDB();
    const items = await db.getAllFromIndex('syncQueue', 'by-entityId', entityId);
    const tx = db.transaction('syncQueue', 'readwrite');
    await Promise.all([
      ...items.map((item) => tx.store.delete(item.id)),
      tx.done,
    ]);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('syncQueue');
  },

  async count(): Promise<number> {
    const db = await getDB();
    return db.count('syncQueue');
  },
};

// Conflict operations
export const conflictStore = {
  async getAll(): Promise<ConflictRecord[]> {
    const db = await getDB();
    return db.getAll('conflicts');
  },

  async getById(id: string): Promise<ConflictRecord | undefined> {
    const db = await getDB();
    return db.get('conflicts', id);
  },

  async getByEntityId(entityId: string): Promise<ConflictRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('conflicts', 'by-entityId', entityId);
  },

  async add(conflict: Omit<ConflictRecord, 'id'>): Promise<string> {
    const db = await getDB();
    const id = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: ConflictRecord = { ...conflict, id };
    await db.put('conflicts', record);
    return id;
  },

  async resolve(id: string, resolution: 'local' | 'server' | 'merged'): Promise<void> {
    const db = await getDB();
    const conflict = await db.get('conflicts', id);
    if (conflict) {
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolution = resolution;
      await db.put('conflicts', conflict);
    }
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('conflicts', id);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('conflicts');
  },
};

// Metadata operations
export const metadataStore = {
  async get<T>(key: string): Promise<T | undefined> {
    const db = await getDB();
    const record = await db.get('metadata', key);
    return record?.value as T | undefined;
  },

  async set<T>(key: string, value: T): Promise<void> {
    const db = await getDB();
    await db.put('metadata', {
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('metadata', key);
  },
};

// Utility to clear all data (for logout)
export async function clearAllData(): Promise<void> {
  await characterStore.clear();
  await partyStore.clear();
  await syncQueueStore.clear();
  await conflictStore.clear();
}
