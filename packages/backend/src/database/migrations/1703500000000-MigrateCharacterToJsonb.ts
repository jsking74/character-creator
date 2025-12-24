import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';
import { flatToNested, nestedToFlat } from './utils/character-data-transformer.js';

export class MigrateCharacterToJsonb1703500000000 implements MigrationInterface {
  name = 'MigrateCharacterToJsonb1703500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    console.log('Starting character model migration to JSONB...');

    // STEP 1: Add new columns (temporarily nullable)
    console.log('Step 1: Adding new columns...');

    await queryRunner.addColumn(
      'characters',
      new TableColumn({
        name: 'system_id',
        type: 'varchar',
        length: '50',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'characters',
      new TableColumn({
        name: 'character_data',
        type: isSQLite ? 'text' : 'jsonb',
        isNullable: true,
      })
    );

    // STEP 2: Populate system_id from existing system column
    console.log('Step 2: Populating system_id...');

    await queryRunner.query(`
      UPDATE characters
      SET system_id = system
    `);

    // STEP 3: Migrate existing data to character_data JSONB
    console.log('Step 3: Migrating character data to JSONB...');

    // Get all characters
    const characters = await queryRunner.query(`SELECT * FROM characters`);

    console.log(`Migrating ${characters.length} characters...`);

    for (const char of characters) {
      const characterData = flatToNested(char);
      const jsonData = JSON.stringify(characterData);

      if (isSQLite) {
        await queryRunner.query(
          `UPDATE characters SET character_data = ? WHERE id = ?`,
          [jsonData, char.id]
        );
      } else {
        await queryRunner.query(
          `UPDATE characters SET character_data = $1::jsonb WHERE id = $2`,
          [jsonData, char.id]
        );
      }
    }

    console.log('Data migration complete.');

    // STEP 4: Make new columns non-nullable
    console.log('Step 4: Making new columns non-nullable...');

    await queryRunner.changeColumn(
      'characters',
      'system_id',
      new TableColumn({
        name: 'system_id',
        type: 'varchar',
        length: '50',
        isNullable: false,
      })
    );

    await queryRunner.changeColumn(
      'characters',
      'character_data',
      new TableColumn({
        name: 'character_data',
        type: isSQLite ? 'text' : 'jsonb',
        isNullable: false,
      })
    );

    // STEP 5: Drop old flat columns
    console.log('Step 5: Dropping old flat columns...');

    const columnsToRemove = [
      'system',
      'class',
      'race',
      'level',
      'alignment',
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
      'max_hit_points',
      'current_hit_points',
      'temporary_hit_points',
      'skills_json',
      'proficiencies_json',
      'equipment_json',
      'traits_json',
      'gold',
      'background',
      'backstory',
    ];

    for (const column of columnsToRemove) {
      await queryRunner.dropColumn('characters', column);
    }

    // STEP 6: Add indexes for JSONB queries (PostgreSQL only)
    if (!isSQLite) {
      console.log('Step 6: Adding JSONB indexes...');

      // GIN index for general JSONB queries
      await queryRunner.query(`
        CREATE INDEX IDX_characters_character_data_gin
        ON characters USING GIN (character_data)
      `);

      // Index for frequently queried fields
      await queryRunner.query(`
        CREATE INDEX IDX_characters_data_level
        ON characters ((character_data->'basics'->>'level'))
      `);

      await queryRunner.query(`
        CREATE INDEX IDX_characters_data_class
        ON characters ((character_data->'basics'->>'class'))
      `);
    } else {
      console.log('Step 6: Skipping JSONB indexes (SQLite)...');
    }

    // STEP 7: Update existing composite index
    console.log('Step 7: Updating composite index...');

    // Try to drop old index if it exists (might not exist in current schema)
    try {
      await queryRunner.dropIndex('characters', 'IDX_ca0f49e5c8f64bda558dd2ba0e3');
    } catch (error) {
      console.log('Old index not found, skipping drop...');
    }

    // Create new composite index on user_id and system_id
    await queryRunner.createIndex(
      'characters',
      new TableIndex({
        name: 'IDX_characters_user_id_system_id',
        columnNames: ['user_id', 'system_id'],
      })
    );

    console.log('Migration to JSONB complete!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    console.log('Rolling back character model migration...');

    // Drop JSONB indexes (PostgreSQL only)
    if (!isSQLite) {
      console.log('Step 1: Dropping JSONB indexes...');

      await queryRunner.query(`DROP INDEX IF EXISTS IDX_characters_data_class`);
      await queryRunner.query(`DROP INDEX IF EXISTS IDX_characters_data_level`);
      await queryRunner.query(`DROP INDEX IF EXISTS IDX_characters_character_data_gin`);
    }

    // Re-add flat columns (temporarily nullable)
    console.log('Step 2: Re-adding flat columns...');

    const flatColumns = [
      { name: 'system', type: 'varchar', length: '50' },
      { name: 'class', type: 'varchar', length: '100' },
      { name: 'race', type: 'varchar', length: '100' },
      { name: 'level', type: 'integer', default: 1 },
      { name: 'alignment', type: 'varchar', length: '50', default: "'Neutral'" },
      { name: 'strength', type: 'integer', default: 10 },
      { name: 'dexterity', type: 'integer', default: 10 },
      { name: 'constitution', type: 'integer', default: 10 },
      { name: 'intelligence', type: 'integer', default: 10 },
      { name: 'wisdom', type: 'integer', default: 10 },
      { name: 'charisma', type: 'integer', default: 10 },
      { name: 'max_hit_points', type: 'integer', default: 0 },
      { name: 'current_hit_points', type: 'integer', default: 0 },
      { name: 'temporary_hit_points', type: 'integer', default: 0 },
      { name: 'skills_json', type: 'text' },
      { name: 'proficiencies_json', type: 'text' },
      { name: 'equipment_json', type: 'text' },
      { name: 'traits_json', type: 'text' },
      { name: 'gold', type: 'integer', default: 0 },
      { name: 'background', type: 'varchar', length: '255' },
      { name: 'backstory', type: 'text' },
    ];

    for (const col of flatColumns) {
      await queryRunner.addColumn(
        'characters',
        new TableColumn({
          name: col.name,
          type: col.type,
          length: col.length,
          default: col.default,
          isNullable: true,
        })
      );
    }

    // Migrate data back from JSONB to flat
    console.log('Step 3: Migrating data back to flat structure...');

    const characters = await queryRunner.query(`SELECT id, character_data FROM characters`);

    console.log(`Rolling back ${characters.length} characters...`);

    for (const char of characters) {
      const data = isSQLite ? JSON.parse(char.character_data) : char.character_data;
      const flatData = nestedToFlat(data);

      // Build UPDATE query
      const updateFields = Object.keys(flatData).map((key, index) => {
        return isSQLite ? `${key} = ?` : `${key} = $${index + 1}`;
      });

      const values = Object.values(flatData);

      if (isSQLite) {
        await queryRunner.query(
          `UPDATE characters SET ${updateFields.join(', ')} WHERE id = ?`,
          [...values, char.id]
        );
      } else {
        await queryRunner.query(
          `UPDATE characters SET ${updateFields.join(', ')} WHERE id = $${values.length + 1}`,
          [...values, char.id]
        );
      }
    }

    console.log('Data rollback complete.');

    // Make flat columns non-nullable (where applicable)
    console.log('Step 4: Making flat columns non-nullable...');

    const nonNullableColumns = [
      'system',
      'class',
      'race',
      'level',
      'alignment',
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
      'max_hit_points',
      'current_hit_points',
      'temporary_hit_points',
      'gold',
    ];

    for (const colName of nonNullableColumns) {
      const col = flatColumns.find((c) => c.name === colName);
      if (col) {
        await queryRunner.changeColumn(
          'characters',
          colName,
          new TableColumn({
            name: col.name,
            type: col.type,
            length: col.length,
            default: col.default,
            isNullable: false,
          })
        );
      }
    }

    // Drop JSONB columns
    console.log('Step 5: Dropping JSONB columns...');

    await queryRunner.dropColumn('characters', 'character_data');
    await queryRunner.dropColumn('characters', 'system_id');

    // Restore original index
    console.log('Step 6: Restoring original index...');

    await queryRunner.dropIndex('characters', 'IDX_characters_user_id_system_id');

    await queryRunner.createIndex(
      'characters',
      new TableIndex({
        name: 'IDX_ca0f49e5c8f64bda558dd2ba0e3',
        columnNames: ['user_id', 'name'],
      })
    );

    console.log('Rollback complete!');
  }
}
