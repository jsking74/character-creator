import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddShareTokenFields1703600000000 implements MigrationInterface {
  name = 'AddShareTokenFields1703600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding share token fields to characters table...');

    // Add share_token column
    await queryRunner.addColumn(
      'characters',
      new TableColumn({
        name: 'share_token',
        type: 'varchar',
        length: '16',
        isNullable: true,
        isUnique: true,
      })
    );

    // Add share_token_expires_at column
    await queryRunner.addColumn(
      'characters',
      new TableColumn({
        name: 'share_token_expires_at',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add view_count column
    await queryRunner.addColumn(
      'characters',
      new TableColumn({
        name: 'view_count',
        type: 'integer',
        default: 0,
        isNullable: false,
      })
    );

    // Add index for share_token lookups
    await queryRunner.createIndex(
      'characters',
      new TableIndex({
        name: 'IDX_characters_share_token',
        columnNames: ['share_token'],
      })
    );

    console.log('Share token fields added successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing share token fields from characters table...');

    // Drop index
    await queryRunner.dropIndex('characters', 'IDX_characters_share_token');

    // Drop columns
    await queryRunner.dropColumn('characters', 'view_count');
    await queryRunner.dropColumn('characters', 'share_token_expires_at');
    await queryRunner.dropColumn('characters', 'share_token');

    console.log('Share token fields removed successfully!');
  }
}
