import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../models/User.js';
import { Character } from '../models/Character.js';
import { Party } from '../models/Party.js';
import { SystemConfig } from '../models/SystemConfig.js';
import { InitialSchema1703300000000 } from './migrations/1703300000000-InitialSchema.js';
import { AddPartyTable1703400000000 } from './migrations/1703400000000-AddPartyTable.js';
import { MigrateCharacterToJsonb1703500000000 } from './migrations/1703500000000-MigrateCharacterToJsonb.js';
import { AddShareTokenFields1703600000000 } from './migrations/1703600000000-AddShareTokenFields.js';
import { CreateSystemConfigs1703700000000 } from './migrations/1703700000000-CreateSystemConfigs.js';
import { AddAdditionalSystems1734910000000 } from './migrations/1734910000000-AddAdditionalSystems.js';
import { AddPartyExtendedFields1735010000000 } from './migrations/1735010000000-AddPartyExtendedFields.js';

const isProduction = process.env.NODE_ENV === 'production';
const useSQLite = process.env.USE_SQLITE === 'true' || (!isProduction && process.env.USE_SQLITE !== 'false');

// Parse DATABASE_URL if provided (Railway, Render, Heroku format)
function parsePostgresUrl(url: string): { host: string; port: number; username: string; password: string; database: string } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432'),
    username: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1), // Remove leading /
  };
}

const sqliteOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: process.env.SQLITE_PATH || 'dev.db',
  synchronize: false,
  logging: !isProduction,
  entities: [User, Character, Party, SystemConfig],
  migrations: [InitialSchema1703300000000, AddPartyTable1703400000000, MigrateCharacterToJsonb1703500000000, AddShareTokenFields1703600000000, CreateSystemConfigs1703700000000, AddAdditionalSystems1734910000000, AddPartyExtendedFields1735010000000],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: true,
};

// Use DATABASE_URL if available, otherwise fall back to individual vars
const dbConfig = process.env.DATABASE_URL
  ? parsePostgresUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'character_creator',
    };

// Railway external proxy requires SSL, internal does not
// Also check for common cloud database patterns
const isExternalConnection = dbConfig.host.includes('.rlwy.net') ||
                              dbConfig.host.includes('.railway.app') ||
                              !dbConfig.host.includes('.railway.internal');
const useSSL = isProduction && isExternalConnection;

console.log(`Database SSL: ${useSSL ? 'enabled' : 'disabled'} (host: ${dbConfig.host})`);

const postgresOptions: DataSourceOptions = {
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: !isProduction,
  entities: [User, Character, Party, SystemConfig],
  migrations: [InitialSchema1703300000000, AddPartyTable1703400000000, MigrateCharacterToJsonb1703500000000, AddShareTokenFields1703600000000, CreateSystemConfigs1703700000000, AddAdditionalSystems1734910000000, AddPartyExtendedFields1735010000000],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: true,
  extra: {
    // Connection pool settings for Railway
    max: 5,
    connectionTimeoutMillis: 10000,
  },
};

export const AppDataSource = new DataSource(useSQLite ? sqliteOptions : postgresOptions);
