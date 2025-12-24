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

const postgresOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'character_creator',
  synchronize: false,
  logging: !isProduction,
  entities: [User, Character, Party, SystemConfig],
  migrations: [InitialSchema1703300000000, AddPartyTable1703400000000, MigrateCharacterToJsonb1703500000000, AddShareTokenFields1703600000000, CreateSystemConfigs1703700000000, AddAdditionalSystems1734910000000, AddPartyExtendedFields1735010000000],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: true,
};

export const AppDataSource = new DataSource(useSQLite ? sqliteOptions : postgresOptions);
