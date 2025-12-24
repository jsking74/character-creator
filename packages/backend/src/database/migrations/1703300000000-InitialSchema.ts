import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchema1703300000000 implements MigrationInterface {
  name = 'InitialSchema1703300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Detect database type
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'created_at',
            type: isSQLite ? 'datetime' : 'timestamp',
            default: isSQLite ? "(datetime('now'))" : 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: isSQLite ? 'datetime' : 'timestamp',
            default: isSQLite ? "(datetime('now'))" : 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create index on users.email
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
        isUnique: true,
      })
    );

    // Create characters table
    await queryRunner.createTable(
      new Table({
        name: 'characters',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'system',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'class',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'race',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'level',
            type: 'integer',
            default: 1,
          },
          {
            name: 'alignment',
            type: 'varchar',
            length: '50',
            default: "'Neutral'",
          },
          // Ability Scores
          {
            name: 'strength',
            type: 'integer',
            default: 10,
          },
          {
            name: 'dexterity',
            type: 'integer',
            default: 10,
          },
          {
            name: 'constitution',
            type: 'integer',
            default: 10,
          },
          {
            name: 'intelligence',
            type: 'integer',
            default: 10,
          },
          {
            name: 'wisdom',
            type: 'integer',
            default: 10,
          },
          {
            name: 'charisma',
            type: 'integer',
            default: 10,
          },
          // Health
          {
            name: 'max_hit_points',
            type: 'integer',
            default: 0,
          },
          {
            name: 'current_hit_points',
            type: 'integer',
            default: 0,
          },
          {
            name: 'temporary_hit_points',
            type: 'integer',
            default: 0,
          },
          // JSON fields
          {
            name: 'skills_json',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'proficiencies_json',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'equipment_json',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'gold',
            type: 'integer',
            default: 0,
          },
          // Character Description
          {
            name: 'background',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'backstory',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'traits_json',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Metadata
          {
            name: 'is_public',
            type: isSQLite ? 'boolean' : 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: isSQLite ? 'datetime' : 'timestamp',
            default: isSQLite ? "(datetime('now'))" : 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: isSQLite ? 'datetime' : 'timestamp',
            default: isSQLite ? "(datetime('now'))" : 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create composite index on characters (user_id, name)
    await queryRunner.createIndex(
      'characters',
      new TableIndex({
        name: 'IDX_characters_user_id_name',
        columnNames: ['user_id', 'name'],
      })
    );

    // Create foreign key for characters -> users
    // Note: SQLite has limited FK support, but TypeORM handles this
    if (!isSQLite) {
      await queryRunner.createForeignKey(
        'characters',
        new TableForeignKey({
          name: 'FK_characters_user_id',
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    // Drop foreign key first (PostgreSQL only)
    if (!isSQLite) {
      await queryRunner.dropForeignKey('characters', 'FK_characters_user_id');
    }

    // Drop indices
    await queryRunner.dropIndex('characters', 'IDX_characters_user_id_name');
    await queryRunner.dropIndex('users', 'IDX_users_email');

    // Drop tables
    await queryRunner.dropTable('characters');
    await queryRunner.dropTable('users');
  }
}
