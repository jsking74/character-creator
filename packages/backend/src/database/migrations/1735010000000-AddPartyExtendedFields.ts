import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPartyExtendedFields1735010000000 implements MigrationInterface {
  name = 'AddPartyExtendedFields1735010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    // Add notes column
    await queryRunner.addColumn(
      'parties',
      new TableColumn({
        name: 'notes',
        type: 'text',
        isNullable: true,
      })
    );

    // Add shared_gold column
    await queryRunner.addColumn(
      'parties',
      new TableColumn({
        name: 'shared_gold',
        type: 'int',
        default: 0,
      })
    );

    // Add shared_inventory column (JSON)
    await queryRunner.addColumn(
      'parties',
      new TableColumn({
        name: 'shared_inventory',
        type: isSQLite ? 'text' : 'json',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('parties', 'shared_inventory');
    await queryRunner.dropColumn('parties', 'shared_gold');
    await queryRunner.dropColumn('parties', 'notes');
  }
}
