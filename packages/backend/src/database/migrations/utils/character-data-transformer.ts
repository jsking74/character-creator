import { CharacterData } from '@character-creator/shared';

/**
 * Utility functions for transforming character data between flat and nested structures.
 * Used during database migration from flat columns to JSONB structure.
 */

/**
 * Parse JSON string safely, returning default value on error
 */
function parseJsonOrDefault<T>(json: string | undefined | null, defaultValue: T): T {
  if (!json || json === '') return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn(`Failed to parse JSON: ${json}`, error);
    return defaultValue;
  }
}

/**
 * Transform flat character structure to nested CharacterData structure
 * @param character - Flat character object from database
 * @returns Nested CharacterData object
 */
export function flatToNested(character: any): CharacterData {
  // Parse JSON fields with safe defaults
  const skills = parseJsonOrDefault(character.skills_json, {});
  const proficiencies = parseJsonOrDefault(character.proficiencies_json, {
    skills: [],
    weapons: [],
    armor: [],
  });
  const equipment = parseJsonOrDefault(character.equipment_json, {
    weapons: [],
    armor: [],
    backpack: [],
  });
  const traits = parseJsonOrDefault(character.traits_json, {
    features: [],
    flaws: undefined,
    bonds: undefined,
    ideals: undefined,
  });

  return {
    attributes: {
      strength: character.strength ?? 10,
      dexterity: character.dexterity ?? 10,
      constitution: character.constitution ?? 10,
      intelligence: character.intelligence ?? 10,
      wisdom: character.wisdom ?? 10,
      charisma: character.charisma ?? 10,
    },
    basics: {
      race: character.race || '',
      class: character.class || '',
      level: character.level ?? 1,
      experience: 0, // New field, default to 0
      alignment: character.alignment || undefined,
      background: character.background || undefined,
    },
    hitPoints: {
      current: character.current_hit_points ?? 0,
      maximum: character.max_hit_points ?? 0,
      temporary: character.temporary_hit_points ?? 0,
    },
    skills,
    proficiencies: {
      skills: proficiencies.skills || [],
      weapons: proficiencies.weapons || [],
      armor: proficiencies.armor || [],
    },
    equipment: {
      weapons: equipment.weapons || [],
      armor: equipment.armor || [],
      backpack: equipment.backpack || [],
    },
    spells: {
      prepared: [],
    },
    traits: {
      features: traits.features || [],
      flaws: traits.flaws,
      bonds: traits.bonds,
      ideals: traits.ideals,
    },
    backstory: {
      description: character.backstory || undefined,
      notes: undefined,
    },
    currency: {
      platinum: 0,
      gold: character.gold ?? 0,
      electrum: 0,
      silver: 0,
      copper: 0,
    },
  };
}

/**
 * Transform nested CharacterData structure back to flat character structure
 * Used for migration rollback
 * @param data - Nested CharacterData object
 * @returns Flat character object
 */
export function nestedToFlat(data: CharacterData): any {
  return {
    // Ability scores
    strength: data.attributes?.strength ?? 10,
    dexterity: data.attributes?.dexterity ?? 10,
    constitution: data.attributes?.constitution ?? 10,
    intelligence: data.attributes?.intelligence ?? 10,
    wisdom: data.attributes?.wisdom ?? 10,
    charisma: data.attributes?.charisma ?? 10,

    // Basics
    class: data.basics?.class || '',
    race: data.basics?.race || '',
    level: data.basics?.level ?? 1,
    alignment: data.basics?.alignment || 'Neutral',
    background: data.basics?.background || null,

    // Hit points
    max_hit_points: data.hitPoints?.maximum ?? 0,
    current_hit_points: data.hitPoints?.current ?? 0,
    temporary_hit_points: data.hitPoints?.temporary ?? 0,

    // JSON fields (stringify them)
    skills_json: data.skills ? JSON.stringify(data.skills) : null,
    proficiencies_json: data.proficiencies ? JSON.stringify(data.proficiencies) : null,
    equipment_json: data.equipment ? JSON.stringify(data.equipment) : null,
    traits_json: data.traits ? JSON.stringify(data.traits) : null,

    // Other fields
    gold: data.currency?.gold ?? 0,
    backstory: data.backstory?.description || null,
  };
}

/**
 * Validate that a CharacterData object has all required fields
 * @param data - CharacterData to validate
 * @returns true if valid, throws error if invalid
 */
export function validateCharacterData(data: any): boolean {
  if (!data) {
    throw new Error('Character data is null or undefined');
  }

  if (!data.attributes) {
    throw new Error('Character data missing attributes');
  }

  if (!data.basics) {
    throw new Error('Character data missing basics');
  }

  if (!data.hitPoints) {
    throw new Error('Character data missing hitPoints');
  }

  // Validate ability scores are in reasonable range
  const abilities = [
    { name: 'strength', value: data.attributes.strength },
    { name: 'dexterity', value: data.attributes.dexterity },
    { name: 'constitution', value: data.attributes.constitution },
    { name: 'intelligence', value: data.attributes.intelligence },
    { name: 'wisdom', value: data.attributes.wisdom },
    { name: 'charisma', value: data.attributes.charisma },
  ];

  for (const ability of abilities) {
    if (typeof ability.value !== 'number' || ability.value < 1 || ability.value > 30) {
      throw new Error(`Ability score ${ability.name} out of range: ${ability.value} (must be 1-30)`);
    }
  }

  return true;
}
