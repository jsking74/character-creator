import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddPartyTable1703400000000 implements MigrationInterface {
  name = 'AddPartyTable1703400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    // Create parties table
    await queryRunner.createTable(
      new Table({
        name: 'parties',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'owner_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'campaign_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
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

    // Create index on owner_id
    await queryRunner.createIndex(
      'parties',
      new TableIndex({
        name: 'IDX_parties_owner_id',
        columnNames: ['owner_id'],
      })
    );

    // Create party_members junction table
    await queryRunner.createTable(
      new Table({
        name: 'party_members',
        columns: [
          {
            name: 'party_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'character_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    // Create indices for party_members
    await queryRunner.createIndex(
      'party_members',
      new TableIndex({
        name: 'IDX_party_members_party_id',
        columnNames: ['party_id'],
      })
    );

    await queryRunner.createIndex(
      'party_members',
      new TableIndex({
        name: 'IDX_party_members_character_id',
        columnNames: ['character_id'],
      })
    );

    // Create foreign keys (PostgreSQL only)
    if (!isSQLite) {
      await queryRunner.createForeignKey(
        'parties',
        new TableForeignKey({
          name: 'FK_parties_owner_id',
          columnNames: ['owner_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        })
      );

      await queryRunner.createForeignKey(
        'party_members',
        new TableForeignKey({
          name: 'FK_party_members_party_id',
          columnNames: ['party_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'parties',
          onDelete: 'CASCADE',
        })
      );

      await queryRunner.createForeignKey(
        'party_members',
        new TableForeignKey({
          name: 'FK_party_members_character_id',
          columnNames: ['character_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'characters',
          onDelete: 'CASCADE',
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    // Drop foreign keys (PostgreSQL only)
    if (!isSQLite) {
      await queryRunner.dropForeignKey('party_members', 'FK_party_members_character_id');
      await queryRunner.dropForeignKey('party_members', 'FK_party_members_party_id');
      await queryRunner.dropForeignKey('parties', 'FK_parties_owner_id');
    }

    // Drop indices
    await queryRunner.dropIndex('party_members', 'IDX_party_members_character_id');
    await queryRunner.dropIndex('party_members', 'IDX_party_members_party_id');
    await queryRunner.dropIndex('parties', 'IDX_parties_owner_id');

    // Drop tables
    await queryRunner.dropTable('party_members');
    await queryRunner.dropTable('parties');
  }
}
