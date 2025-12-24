import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'fs';

export class DatabaseManager {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private SQL: any = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    // Initialize sql.js
    this.SQL = await initSqlJs();

    // Load existing database file or create new one
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(buffer);
    } else {
      this.db = new this.SQL.Database();
    }

    // Enable foreign keys
    if (!this.db) throw new Error('Failed to initialize database');
    this.db.run('PRAGMA foreign_keys = ON');

    // Create tables if they don't exist
    await this.createTables();

    // Save to disk
    await this.saveToDisk();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System Configs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        config_data TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_system_configs_active
      ON system_configs(is_active)
    `);

    // Characters table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        system_id TEXT NOT NULL,
        name TEXT NOT NULL,
        character_data TEXT NOT NULL,
        image_url TEXT,
        is_public INTEGER DEFAULT 0,
        share_token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (system_id) REFERENCES system_configs(id)
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_characters_user_system
      ON characters(user_id, system_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_characters_share_token
      ON characters(share_token)
    `);

    // Parties table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS parties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_parties_owner
      ON parties(owner_id)
    `);

    // Party Members table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS party_members (
        id TEXT PRIMARY KEY,
        party_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        UNIQUE(party_id, character_id)
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_party_members_party
      ON party_members(party_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_party_members_character
      ON party_members(character_id)
    `);

    // Sync metadata table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        table_name TEXT PRIMARY KEY,
        last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending'
      )
    `);

    console.log('Database tables created successfully');
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);

      const results: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
      }
      stmt.free();

      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);

      let result = undefined;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();

      return result;
    } catch (error) {
      console.error('Get error:', error);
      throw error;
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.run(sql, params);

      // Save changes to disk
      await this.saveToDisk();

      // Get changes and lastInsertRowId
      const changes = this.db.getRowsModified();
      const lastIDResult = this.db.exec('SELECT last_insert_rowid() as id');
      const lastID = lastIDResult[0]?.values[0]?.[0] as number || 0;

      return {
        changes,
        lastID,
      };
    } catch (error) {
      console.error('Run error:', error);
      throw error;
    }
  }

  async transaction(callback: () => void): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.run('BEGIN TRANSACTION');
      callback();
      this.db.run('COMMIT');
      await this.saveToDisk();
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  private async saveToDisk(): Promise<void> {
    if (!this.db) return;

    const data = this.db.export();
    fs.writeFileSync(this.dbPath, data);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.saveToDisk();
      this.db.close();
      this.db = null;
    }
  }
}
