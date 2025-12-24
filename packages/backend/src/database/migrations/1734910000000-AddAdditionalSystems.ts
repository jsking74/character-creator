import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdditionalSystems1734910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSQLite = queryRunner.connection.options.type === 'better-sqlite3';

    console.log('Adding Pathfinder 2e, Starfinder, and Call of Cthulhu systems...');

    // Pathfinder 2e Configuration
    const pathfinder2eConfig = {
      metadata: {
        name: 'Pathfinder 2nd Edition',
        version: '2.0',
        description: 'Pathfinder Second Edition character creation system',
        author: 'Paizo Inc.',
        compatibility: 'Pathfinder 2e Core Rulebook',
      },
      attributes: [
        { id: 'strength', name: 'Strength', abbreviation: 'STR', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'dexterity', name: 'Dexterity', abbreviation: 'DEX', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'constitution', name: 'Constitution', abbreviation: 'CON', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'intelligence', name: 'Intelligence', abbreviation: 'INT', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'wisdom', name: 'Wisdom', abbreviation: 'WIS', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'charisma', name: 'Charisma', abbreviation: 'CHA', type: 'numeric', min: 1, max: 30, default: 10 },
      ],
      classes: [
        { id: 'alchemist', name: 'Alchemist', hitDice: 'd8', primaryAbility: 'intelligence', savingThrows: ['fortitude', 'reflex'] },
        { id: 'barbarian', name: 'Barbarian', hitDice: 'd12', primaryAbility: 'strength', savingThrows: ['fortitude', 'will'] },
        { id: 'bard', name: 'Bard', hitDice: 'd8', primaryAbility: 'charisma', savingThrows: ['fortitude', 'reflex', 'will'] },
        { id: 'champion', name: 'Champion', hitDice: 'd10', primaryAbility: 'strength', savingThrows: ['fortitude', 'reflex', 'will'] },
        { id: 'cleric', name: 'Cleric', hitDice: 'd8', primaryAbility: 'wisdom', savingThrows: ['fortitude', 'will'] },
        { id: 'druid', name: 'Druid', hitDice: 'd8', primaryAbility: 'wisdom', savingThrows: ['fortitude', 'reflex', 'will'] },
        { id: 'fighter', name: 'Fighter', hitDice: 'd10', primaryAbility: 'strength', savingThrows: ['fortitude', 'reflex'] },
        { id: 'monk', name: 'Monk', hitDice: 'd10', primaryAbility: 'dexterity', savingThrows: ['fortitude', 'reflex', 'will'] },
        { id: 'ranger', name: 'Ranger', hitDice: 'd10', primaryAbility: 'dexterity', savingThrows: ['fortitude', 'reflex'] },
        { id: 'rogue', name: 'Rogue', hitDice: 'd8', primaryAbility: 'dexterity', savingThrows: ['reflex', 'will'] },
        { id: 'sorcerer', name: 'Sorcerer', hitDice: 'd6', primaryAbility: 'charisma', savingThrows: ['fortitude', 'will'] },
        { id: 'wizard', name: 'Wizard', hitDice: 'd6', primaryAbility: 'intelligence', savingThrows: ['fortitude', 'will'] },
      ],
      races: [
        { id: 'dwarf', name: 'Dwarf', size: 'Medium', speed: 20, abilityBonuses: [{ attribute: 'constitution', bonus: 2 }, { attribute: 'wisdom', bonus: 2 }] },
        { id: 'elf', name: 'Elf', size: 'Medium', speed: 30, abilityBonuses: [{ attribute: 'dexterity', bonus: 2 }, { attribute: 'intelligence', bonus: 2 }] },
        { id: 'gnome', name: 'Gnome', size: 'Small', speed: 25, abilityBonuses: [{ attribute: 'constitution', bonus: 2 }, { attribute: 'charisma', bonus: 2 }] },
        { id: 'goblin', name: 'Goblin', size: 'Small', speed: 25, abilityBonuses: [{ attribute: 'dexterity', bonus: 2 }, { attribute: 'charisma', bonus: 2 }] },
        { id: 'halfling', name: 'Halfling', size: 'Small', speed: 25, abilityBonuses: [{ attribute: 'dexterity', bonus: 2 }, { attribute: 'wisdom', bonus: 2 }] },
        { id: 'human', name: 'Human', size: 'Medium', speed: 25, abilityBonuses: [] },
      ],
      skills: [
        { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity' },
        { id: 'arcana', name: 'Arcana', ability: 'intelligence' },
        { id: 'athletics', name: 'Athletics', ability: 'strength' },
        { id: 'crafting', name: 'Crafting', ability: 'intelligence' },
        { id: 'deception', name: 'Deception', ability: 'charisma' },
        { id: 'diplomacy', name: 'Diplomacy', ability: 'charisma' },
        { id: 'intimidation', name: 'Intimidation', ability: 'charisma' },
        { id: 'medicine', name: 'Medicine', ability: 'wisdom' },
        { id: 'nature', name: 'Nature', ability: 'wisdom' },
        { id: 'occultism', name: 'Occultism', ability: 'intelligence' },
        { id: 'performance', name: 'Performance', ability: 'charisma' },
        { id: 'religion', name: 'Religion', ability: 'wisdom' },
        { id: 'society', name: 'Society', ability: 'intelligence' },
        { id: 'stealth', name: 'Stealth', ability: 'dexterity' },
        { id: 'survival', name: 'Survival', ability: 'wisdom' },
        { id: 'thievery', name: 'Thievery', ability: 'dexterity' },
      ],
      alignments: [
        { id: 'lg', name: 'Lawful Good' },
        { id: 'ng', name: 'Neutral Good' },
        { id: 'cg', name: 'Chaotic Good' },
        { id: 'ln', name: 'Lawful Neutral' },
        { id: 'tn', name: 'True Neutral' },
        { id: 'cn', name: 'Chaotic Neutral' },
        { id: 'le', name: 'Lawful Evil' },
        { id: 'ne', name: 'Neutral Evil' },
        { id: 'ce', name: 'Chaotic Evil' },
      ],
      currencies: [
        { id: 'copper', name: 'Copper Pieces', abbreviation: 'cp', conversionToBase: 1 },
        { id: 'silver', name: 'Silver Pieces', abbreviation: 'sp', conversionToBase: 10 },
        { id: 'gold', name: 'Gold Pieces', abbreviation: 'gp', conversionToBase: 100 },
        { id: 'platinum', name: 'Platinum Pieces', abbreviation: 'pp', conversionToBase: 1000 },
      ],
      formulas: {
        abilityModifier: 'floor((score - 10) / 2)',
        proficiencyBonus: 'level + 2',
        armorClass: '10 + dexMod + armorBonus',
        initiative: 'dexMod',
        hitPoints: 'ancestryHP + classHP + ((level - 1) * (classHP + conMod))',
      },
      characterDefaults: {
        level: 1,
        experience: 0,
        hitPoints: { current: 0, maximum: 0, temporary: 0 },
      },
    };

    // Starfinder Configuration
    const starfinderConfig = {
      metadata: {
        name: 'Starfinder',
        version: '1.0',
        description: 'Starfinder science fantasy RPG system',
        author: 'Paizo Inc.',
        compatibility: 'Starfinder Core Rulebook',
      },
      attributes: [
        { id: 'strength', name: 'Strength', abbreviation: 'STR', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'dexterity', name: 'Dexterity', abbreviation: 'DEX', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'constitution', name: 'Constitution', abbreviation: 'CON', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'intelligence', name: 'Intelligence', abbreviation: 'INT', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'wisdom', name: 'Wisdom', abbreviation: 'WIS', type: 'numeric', min: 1, max: 30, default: 10 },
        { id: 'charisma', name: 'Charisma', abbreviation: 'CHA', type: 'numeric', min: 1, max: 30, default: 10 },
      ],
      classes: [
        { id: 'envoy', name: 'Envoy', hitDice: 'd6', primaryAbility: 'charisma', savingThrows: ['reflex', 'will'] },
        { id: 'mechanic', name: 'Mechanic', hitDice: 'd6', primaryAbility: 'intelligence', savingThrows: ['fortitude', 'reflex'] },
        { id: 'mystic', name: 'Mystic', hitDice: 'd6', primaryAbility: 'wisdom', savingThrows: ['fortitude', 'will'] },
        { id: 'operative', name: 'Operative', hitDice: 'd6', primaryAbility: 'dexterity', savingThrows: ['reflex', 'will'] },
        { id: 'solarian', name: 'Solarian', hitDice: 'd6', primaryAbility: 'charisma', savingThrows: ['fortitude', 'will'] },
        { id: 'soldier', name: 'Soldier', hitDice: 'd6', primaryAbility: 'strength', savingThrows: ['fortitude', 'reflex'] },
        { id: 'technomancer', name: 'Technomancer', hitDice: 'd6', primaryAbility: 'intelligence', savingThrows: ['fortitude', 'will'] },
      ],
      races: [
        { id: 'android', name: 'Android', size: 'Medium', speed: 30, abilityBonuses: [{ attribute: 'dexterity', bonus: 2 }, { attribute: 'intelligence', bonus: 2 }] },
        { id: 'human', name: 'Human', size: 'Medium', speed: 30, abilityBonuses: [] },
        { id: 'kasatha', name: 'Kasatha', size: 'Medium', speed: 30, abilityBonuses: [{ attribute: 'strength', bonus: 2 }, { attribute: 'wisdom', bonus: 2 }] },
        { id: 'lashunta', name: 'Lashunta', size: 'Medium', speed: 30, abilityBonuses: [{ attribute: 'charisma', bonus: 2 }] },
        { id: 'shirren', name: 'Shirren', size: 'Medium', speed: 30, abilityBonuses: [{ attribute: 'constitution', bonus: 2 }, { attribute: 'wisdom', bonus: 2 }] },
        { id: 'vesk', name: 'Vesk', size: 'Medium', speed: 30, abilityBonuses: [{ attribute: 'strength', bonus: 2 }, { attribute: 'constitution', bonus: 2 }] },
        { id: 'ysoki', name: 'Ysoki', size: 'Small', speed: 30, abilityBonuses: [{ attribute: 'dexterity', bonus: 2 }, { attribute: 'intelligence', bonus: 2 }] },
      ],
      skills: [
        { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity' },
        { id: 'athletics', name: 'Athletics', ability: 'strength' },
        { id: 'bluff', name: 'Bluff', ability: 'charisma' },
        { id: 'computers', name: 'Computers', ability: 'intelligence' },
        { id: 'culture', name: 'Culture', ability: 'intelligence' },
        { id: 'diplomacy', name: 'Diplomacy', ability: 'charisma' },
        { id: 'disguise', name: 'Disguise', ability: 'charisma' },
        { id: 'engineering', name: 'Engineering', ability: 'intelligence' },
        { id: 'intimidate', name: 'Intimidate', ability: 'charisma' },
        { id: 'life-science', name: 'Life Science', ability: 'intelligence' },
        { id: 'medicine', name: 'Medicine', ability: 'intelligence' },
        { id: 'mysticism', name: 'Mysticism', ability: 'wisdom' },
        { id: 'perception', name: 'Perception', ability: 'wisdom' },
        { id: 'physical-science', name: 'Physical Science', ability: 'intelligence' },
        { id: 'piloting', name: 'Piloting', ability: 'dexterity' },
        { id: 'sense-motive', name: 'Sense Motive', ability: 'wisdom' },
        { id: 'sleight-of-hand', name: 'Sleight of Hand', ability: 'dexterity' },
        { id: 'stealth', name: 'Stealth', ability: 'dexterity' },
        { id: 'survival', name: 'Survival', ability: 'wisdom' },
      ],
      alignments: [
        { id: 'lg', name: 'Lawful Good' },
        { id: 'ng', name: 'Neutral Good' },
        { id: 'cg', name: 'Chaotic Good' },
        { id: 'ln', name: 'Lawful Neutral' },
        { id: 'tn', name: 'True Neutral' },
        { id: 'cn', name: 'Chaotic Neutral' },
        { id: 'le', name: 'Lawful Evil' },
        { id: 'ne', name: 'Neutral Evil' },
        { id: 'ce', name: 'Chaotic Evil' },
      ],
      currencies: [
        { id: 'credits', name: 'Credits', abbreviation: 'cr', conversionToBase: 1 },
      ],
      formulas: {
        abilityModifier: 'floor((score - 10) / 2)',
        proficiencyBonus: 'floor(level / 2)',
        armorClass: '10 + armorBonus + dexMod',
        initiative: 'dexMod',
        hitPoints: 'raceHP + classHP + ((level - 1) * classHP)',
        staminaPoints: 'classStamina + ((level - 1) * classStamina)',
        resolvePoints: 'floor(level / 2) + keyAbilityMod',
      },
      characterDefaults: {
        level: 1,
        experience: 0,
        hitPoints: { current: 0, maximum: 0, temporary: 0 },
      },
    };

    // Call of Cthulhu Configuration
    const cthulhuConfig = {
      metadata: {
        name: 'Call of Cthulhu',
        version: '7th Edition',
        description: 'Lovecraftian horror investigation RPG',
        author: 'Chaosium Inc.',
        compatibility: 'Call of Cthulhu 7th Edition',
      },
      attributes: [
        { id: 'strength', name: 'Strength', abbreviation: 'STR', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'constitution', name: 'Constitution', abbreviation: 'CON', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'size', name: 'Size', abbreviation: 'SIZ', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'dexterity', name: 'Dexterity', abbreviation: 'DEX', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'appearance', name: 'Appearance', abbreviation: 'APP', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'intelligence', name: 'Intelligence', abbreviation: 'INT', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'power', name: 'Power', abbreviation: 'POW', type: 'numeric', min: 1, max: 100, default: 50 },
        { id: 'education', name: 'Education', abbreviation: 'EDU', type: 'numeric', min: 1, max: 100, default: 50 },
      ],
      classes: [
        { id: 'antiquarian', name: 'Antiquarian', hitDice: 'd6', primaryAbility: 'education' },
        { id: 'author', name: 'Author', hitDice: 'd6', primaryAbility: 'education' },
        { id: 'detective', name: 'Private Detective', hitDice: 'd6', primaryAbility: 'intelligence' },
        { id: 'dilettante', name: 'Dilettante', hitDice: 'd6', primaryAbility: 'appearance' },
        { id: 'doctor', name: 'Doctor of Medicine', hitDice: 'd6', primaryAbility: 'education' },
        { id: 'journalist', name: 'Journalist', hitDice: 'd6', primaryAbility: 'education' },
        { id: 'police', name: 'Police Detective', hitDice: 'd6', primaryAbility: 'dexterity' },
        { id: 'professor', name: 'Professor', hitDice: 'd6', primaryAbility: 'education' },
        { id: 'soldier', name: 'Soldier', hitDice: 'd6', primaryAbility: 'strength' },
      ],
      races: [
        { id: 'human', name: 'Human', size: 'Medium', speed: 30, abilityBonuses: [] },
      ],
      skills: [
        { id: 'accounting', name: 'Accounting', ability: 'education' },
        { id: 'anthropology', name: 'Anthropology', ability: 'education' },
        { id: 'archaeology', name: 'Archaeology', ability: 'education' },
        { id: 'art-craft', name: 'Art/Craft', ability: 'dexterity' },
        { id: 'charm', name: 'Charm', ability: 'appearance' },
        { id: 'climb', name: 'Climb', ability: 'strength' },
        { id: 'credit-rating', name: 'Credit Rating', ability: 'education' },
        { id: 'cthulhu-mythos', name: 'Cthulhu Mythos', ability: 'intelligence' },
        { id: 'disguise', name: 'Disguise', ability: 'appearance' },
        { id: 'dodge', name: 'Dodge', ability: 'dexterity' },
        { id: 'drive-auto', name: 'Drive Auto', ability: 'dexterity' },
        { id: 'fast-talk', name: 'Fast Talk', ability: 'appearance' },
        { id: 'fighting-brawl', name: 'Fighting (Brawl)', ability: 'strength' },
        { id: 'firearms-handgun', name: 'Firearms (Handgun)', ability: 'dexterity' },
        { id: 'first-aid', name: 'First Aid', ability: 'education' },
        { id: 'history', name: 'History', ability: 'education' },
        { id: 'intimidate', name: 'Intimidate', ability: 'strength' },
        { id: 'jump', name: 'Jump', ability: 'strength' },
        { id: 'law', name: 'Law', ability: 'education' },
        { id: 'library-use', name: 'Library Use', ability: 'education' },
        { id: 'listen', name: 'Listen', ability: 'power' },
        { id: 'locksmith', name: 'Locksmith', ability: 'dexterity' },
        { id: 'medicine', name: 'Medicine', ability: 'education' },
        { id: 'occult', name: 'Occult', ability: 'education' },
        { id: 'persuade', name: 'Persuade', ability: 'appearance' },
        { id: 'psychology', name: 'Psychology', ability: 'education' },
        { id: 'ride', name: 'Ride', ability: 'dexterity' },
        { id: 'sleight-of-hand', name: 'Sleight of Hand', ability: 'dexterity' },
        { id: 'spot-hidden', name: 'Spot Hidden', ability: 'power' },
        { id: 'stealth', name: 'Stealth', ability: 'dexterity' },
        { id: 'survival', name: 'Survival', ability: 'power' },
        { id: 'swim', name: 'Swim', ability: 'strength' },
        { id: 'throw', name: 'Throw', ability: 'dexterity' },
        { id: 'track', name: 'Track', ability: 'power' },
      ],
      alignments: [],
      currencies: [
        { id: 'dollars', name: 'US Dollars', abbreviation: '$', conversionToBase: 1 },
      ],
      formulas: {
        hitPoints: 'floor((con + siz) / 10)',
        magicPoints: 'floor(pow / 5)',
        sanity: 'pow',
        luck: '3d6 * 5',
        moveRate: 'based on age and stats',
      },
      characterDefaults: {
        level: 1,
        experience: 0,
        hitPoints: { current: 0, maximum: 0, temporary: 0 },
      },
    };

    // Insert Pathfinder 2e
    if (isSQLite) {
      await queryRunner.query(
        `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          'pathfinder2e',
          'Pathfinder 2nd Edition',
          '2.0',
          'Pathfinder Second Edition tactical fantasy RPG',
          JSON.stringify(pathfinder2eConfig),
          1,
          0,
        ]
      );
    } else {
      await queryRunner.query(
        `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          'pathfinder2e',
          'Pathfinder 2nd Edition',
          '2.0',
          'Pathfinder Second Edition tactical fantasy RPG',
          JSON.stringify(pathfinder2eConfig),
          true,
          false,
        ]
      );
    }

    // Insert Starfinder
    if (isSQLite) {
      await queryRunner.query(
        `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          'starfinder',
          'Starfinder',
          '1.0',
          'Science fantasy RPG set in distant future',
          JSON.stringify(starfinderConfig),
          1,
          0,
        ]
      );
    } else {
      await queryRunner.query(
        `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          'starfinder',
          'Starfinder',
          '1.0',
          'Science fantasy RPG set in distant future',
          JSON.stringify(starfinderConfig),
          true,
          false,
        ]
      );
    }

    // Insert Call of Cthulhu
    if (isSQLite) {
      await queryRunner.query(
        `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          'callofcthulhu',
          'Call of Cthulhu',
          '7th Edition',
          'Lovecraftian horror investigation RPG',
          JSON.stringify(cthulhuConfig),
          1,
          0,
        ]
      );
    } else {
      await queryRunner.query(
        `INSERT INTO system_configs (id, name, version, description, config_data, is_active, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          'callofcthulhu',
          'Call of Cthulhu',
          '7th Edition',
          'Lovecraftian horror investigation RPG',
          JSON.stringify(cthulhuConfig),
          true,
          false,
        ]
      );
    }

    console.log('Successfully added 3 new RPG systems!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing additional RPG systems...');

    await queryRunner.query(`DELETE FROM system_configs WHERE id IN ('pathfinder2e', 'starfinder', 'callofcthulhu')`);

    console.log('Additional systems removed.');
  }
}
