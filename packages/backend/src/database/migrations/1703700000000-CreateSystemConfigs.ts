import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSystemConfigs1703700000000 implements MigrationInterface {
  name = 'CreateSystemConfigs1703700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.driver.options.type === 'better-sqlite3';
    // Create system_configs table
    await queryRunner.createTable(
      new Table({
        name: 'system_configs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'config_data',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_default',
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

    // Create index on is_active
    await queryRunner.createIndex(
      'system_configs',
      new TableIndex({
        name: 'IDX_system_configs_is_active',
        columnNames: ['is_active'],
      })
    );

    // Insert default D&D 5e system configuration
    const dnd5eConfig = {
      metadata: {
        name: "D&D 5th Edition",
        version: "5.1",
        description: "Dungeons & Dragons 5th Edition character creation system",
        author: "Wizards of the Coast",
        compatibility: "SRD 5.1",
      },
      attributes: [
        { id: "strength", name: "Strength", abbreviation: "STR", type: "numeric", min: 1, max: 30, default: 10 },
        { id: "dexterity", name: "Dexterity", abbreviation: "DEX", type: "numeric", min: 1, max: 30, default: 10 },
        { id: "constitution", name: "Constitution", abbreviation: "CON", type: "numeric", min: 1, max: 30, default: 10 },
        { id: "intelligence", name: "Intelligence", abbreviation: "INT", type: "numeric", min: 1, max: 30, default: 10 },
        { id: "wisdom", name: "Wisdom", abbreviation: "WIS", type: "numeric", min: 1, max: 30, default: 10 },
        { id: "charisma", name: "Charisma", abbreviation: "CHA", type: "numeric", min: 1, max: 30, default: 10 },
      ],
      classes: [
        { id: "barbarian", name: "Barbarian", hitDice: "d12", primaryAbility: "strength", savingThrows: ["strength", "constitution"] },
        { id: "bard", name: "Bard", hitDice: "d8", primaryAbility: "charisma", savingThrows: ["dexterity", "charisma"] },
        { id: "cleric", name: "Cleric", hitDice: "d8", primaryAbility: "wisdom", savingThrows: ["wisdom", "charisma"] },
        { id: "druid", name: "Druid", hitDice: "d8", primaryAbility: "wisdom", savingThrows: ["intelligence", "wisdom"] },
        { id: "fighter", name: "Fighter", hitDice: "d10", primaryAbility: "strength", savingThrows: ["strength", "constitution"] },
        { id: "monk", name: "Monk", hitDice: "d8", primaryAbility: "dexterity", savingThrows: ["strength", "dexterity"] },
        { id: "paladin", name: "Paladin", hitDice: "d10", primaryAbility: "strength", savingThrows: ["wisdom", "charisma"] },
        { id: "ranger", name: "Ranger", hitDice: "d10", primaryAbility: "dexterity", savingThrows: ["strength", "dexterity"] },
        { id: "rogue", name: "Rogue", hitDice: "d8", primaryAbility: "dexterity", savingThrows: ["dexterity", "intelligence"] },
        { id: "sorcerer", name: "Sorcerer", hitDice: "d6", primaryAbility: "charisma", savingThrows: ["constitution", "charisma"] },
        { id: "warlock", name: "Warlock", hitDice: "d8", primaryAbility: "charisma", savingThrows: ["wisdom", "charisma"] },
        { id: "wizard", name: "Wizard", hitDice: "d6", primaryAbility: "intelligence", savingThrows: ["intelligence", "wisdom"] },
      ],
      races: [
        { id: "dragonborn", name: "Dragonborn", size: "Medium", speed: 30, abilityBonuses: [{ attribute: "strength", bonus: 2 }, { attribute: "charisma", bonus: 1 }] },
        { id: "dwarf", name: "Dwarf", size: "Medium", speed: 25, abilityBonuses: [{ attribute: "constitution", bonus: 2 }] },
        { id: "elf", name: "Elf", size: "Medium", speed: 30, abilityBonuses: [{ attribute: "dexterity", bonus: 2 }] },
        { id: "gnome", name: "Gnome", size: "Small", speed: 25, abilityBonuses: [{ attribute: "intelligence", bonus: 2 }] },
        { id: "half-elf", name: "Half-Elf", size: "Medium", speed: 30, abilityBonuses: [{ attribute: "charisma", bonus: 2 }] },
        { id: "half-orc", name: "Half-Orc", size: "Medium", speed: 30, abilityBonuses: [{ attribute: "strength", bonus: 2 }, { attribute: "constitution", bonus: 1 }] },
        { id: "halfling", name: "Halfling", size: "Small", speed: 25, abilityBonuses: [{ attribute: "dexterity", bonus: 2 }] },
        { id: "human", name: "Human", size: "Medium", speed: 30, abilityBonuses: [{ attribute: "strength", bonus: 1 }, { attribute: "dexterity", bonus: 1 }, { attribute: "constitution", bonus: 1 }, { attribute: "intelligence", bonus: 1 }, { attribute: "wisdom", bonus: 1 }, { attribute: "charisma", bonus: 1 }] },
        { id: "tiefling", name: "Tiefling", size: "Medium", speed: 30, abilityBonuses: [{ attribute: "charisma", bonus: 2 }, { attribute: "intelligence", bonus: 1 }] },
      ],
      skills: [
        { id: "acrobatics", name: "Acrobatics", ability: "dexterity" },
        { id: "animal-handling", name: "Animal Handling", ability: "wisdom" },
        { id: "arcana", name: "Arcana", ability: "intelligence" },
        { id: "athletics", name: "Athletics", ability: "strength" },
        { id: "deception", name: "Deception", ability: "charisma" },
        { id: "history", name: "History", ability: "intelligence" },
        { id: "insight", name: "Insight", ability: "wisdom" },
        { id: "intimidation", name: "Intimidation", ability: "charisma" },
        { id: "investigation", name: "Investigation", ability: "intelligence" },
        { id: "medicine", name: "Medicine", ability: "wisdom" },
        { id: "nature", name: "Nature", ability: "intelligence" },
        { id: "perception", name: "Perception", ability: "wisdom" },
        { id: "performance", name: "Performance", ability: "charisma" },
        { id: "persuasion", name: "Persuasion", ability: "charisma" },
        { id: "religion", name: "Religion", ability: "intelligence" },
        { id: "sleight-of-hand", name: "Sleight of Hand", ability: "dexterity" },
        { id: "stealth", name: "Stealth", ability: "dexterity" },
        { id: "survival", name: "Survival", ability: "wisdom" },
      ],
      alignments: [
        { id: "lg", name: "Lawful Good" },
        { id: "ng", name: "Neutral Good" },
        { id: "cg", name: "Chaotic Good" },
        { id: "ln", name: "Lawful Neutral" },
        { id: "tn", name: "True Neutral" },
        { id: "cn", name: "Chaotic Neutral" },
        { id: "le", name: "Lawful Evil" },
        { id: "ne", name: "Neutral Evil" },
        { id: "ce", name: "Chaotic Evil" },
      ],
      currencies: [
        { id: "copper", name: "Copper Pieces", abbreviation: "cp", conversionToBase: 1 },
        { id: "silver", name: "Silver Pieces", abbreviation: "sp", conversionToBase: 10 },
        { id: "electrum", name: "Electrum Pieces", abbreviation: "ep", conversionToBase: 50 },
        { id: "gold", name: "Gold Pieces", abbreviation: "gp", conversionToBase: 100 },
        { id: "platinum", name: "Platinum Pieces", abbreviation: "pp", conversionToBase: 1000 },
      ],
      formulas: {
        abilityModifier: "floor((score - 10) / 2)",
        proficiencyBonus: "ceil(level / 4) + 1",
        armorClass: "10 + dexMod",
        initiative: "dexMod",
        hitPoints: "hitDiceMax + conMod + ((level - 1) * (hitDiceAvg + conMod))",
      },
      characterDefaults: {
        level: 1,
        experience: 0,
        hitPoints: { current: 0, maximum: 0, temporary: 0 },
      },
    };

    const now = new Date().toISOString();
    await queryRunner.query(
      `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'd&d5e',
        "D&D 5th Edition",
        "5.1",
        "Dungeons & Dragons 5th Edition character creation system based on the SRD 5.1",
        JSON.stringify(dnd5eConfig),
        1,
        1,
        now,
        now,
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('system_configs', 'IDX_system_configs_is_active');
    await queryRunner.dropTable('system_configs');
  }
}
