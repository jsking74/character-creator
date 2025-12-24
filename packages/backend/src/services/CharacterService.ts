import { Repository } from 'typeorm';
import { Character } from '../models/Character.js';
import { CharacterData } from '@character-creator/shared';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCharacterInput {
  name: string;
  system_id: string;
  character_data?: Partial<CharacterData>;
  image_url?: string;
  is_public?: boolean;
}

export interface UpdateCharacterInput {
  name?: string;
  character_data?: Partial<CharacterData>;
  image_url?: string;
  is_public?: boolean;
}

export class CharacterService {
  constructor(private characterRepository: Repository<Character>) {}

  /**
   * Deep merge two objects, with source overriding target
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  async createCharacter(
    userId: string,
    input: CreateCharacterInput
  ): Promise<Character> {
    const character = new Character();
    character.id = uuidv4();
    character.user_id = userId;
    character.name = input.name;
    character.system_id = input.system_id;

    // Deep merge provided character_data with defaults
    if (input.character_data) {
      character.character_data = this.deepMerge(
        character.character_data,
        input.character_data
      );
    }

    if (input.image_url !== undefined) {
      character.image_url = input.image_url;
    }

    if (input.is_public !== undefined) {
      character.is_public = input.is_public;
    }

    return this.characterRepository.save(character);
  }

  async getCharactersByUserId(
    userId: string,
    filters?: {
      system_id?: string;
      class?: string;
      race?: string;
      minLevel?: number;
      maxLevel?: number;
      search?: string;
      sortBy?: 'name' | 'level' | 'created_at' | 'updated_at';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<{ characters: Character[]; total: number }> {
    const query = this.characterRepository.createQueryBuilder('character');
    const isPostgres = query.connection.options.type === 'postgres';

    query.where('character.user_id = :userId', { userId });

    if (filters?.system_id) {
      query.andWhere('character.system_id = :system_id', {
        system_id: filters.system_id,
      });
    }

    if (filters?.class) {
      if (isPostgres) {
        query.andWhere(`character.character_data->'basics'->>'class' = :class`, {
          class: filters.class,
        });
      } else {
        query.andWhere(
          `json_extract(character.character_data, '$.basics.class') = :class`,
          { class: filters.class }
        );
      }
    }

    if (filters?.race) {
      if (isPostgres) {
        query.andWhere(`character.character_data->'basics'->>'race' = :race`, {
          race: filters.race,
        });
      } else {
        query.andWhere(
          `json_extract(character.character_data, '$.basics.race') = :race`,
          { race: filters.race }
        );
      }
    }

    if (filters?.minLevel !== undefined) {
      if (isPostgres) {
        query.andWhere(
          `(character.character_data->'basics'->>'level')::int >= :minLevel`,
          { minLevel: filters.minLevel }
        );
      } else {
        query.andWhere(
          `CAST(json_extract(character.character_data, '$.basics.level') AS INTEGER) >= :minLevel`,
          { minLevel: filters.minLevel }
        );
      }
    }

    if (filters?.maxLevel !== undefined) {
      if (isPostgres) {
        query.andWhere(
          `(character.character_data->'basics'->>'level')::int <= :maxLevel`,
          { maxLevel: filters.maxLevel }
        );
      } else {
        query.andWhere(
          `CAST(json_extract(character.character_data, '$.basics.level') AS INTEGER) <= :maxLevel`,
          { maxLevel: filters.maxLevel }
        );
      }
    }

    if (filters?.search) {
      query.andWhere('LOWER(character.name) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
    }

    // Get total count before pagination
    const total = await query.getCount();

    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = (filters?.sortOrder?.toUpperCase() || 'DESC') as 'ASC' | 'DESC';

    if (sortBy === 'level') {
      if (isPostgres) {
        query.orderBy(
          `(character.character_data->'basics'->>'level')::int`,
          sortOrder
        );
      } else {
        query.orderBy(
          `CAST(json_extract(character.character_data, '$.basics.level') AS INTEGER)`,
          sortOrder
        );
      }
    } else {
      query.orderBy(`character.${sortBy}`, sortOrder);
    }

    // Apply pagination
    if (filters?.limit) {
      query.take(filters.limit);
    }
    if (filters?.offset) {
      query.skip(filters.offset);
    }

    const characters = await query.getMany();

    return { characters, total };
  }

  async getCharacterById(characterId: string, userId?: string): Promise<Character | null> {
    const query = this.characterRepository.createQueryBuilder('character');

    query.where('character.id = :id', { id: characterId });

    if (userId) {
      query.andWhere('character.user_id = :userId', { userId });
    }

    return query.getOne() || null;
  }

  async updateCharacter(
    characterId: string,
    userId: string,
    input: UpdateCharacterInput
  ): Promise<Character> {
    const character = await this.getCharacterById(characterId, userId);

    if (!character) {
      throw new Error('Character not found');
    }

    // Update allowed fields
    if (input.name !== undefined) {
      character.name = input.name;
    }

    if (input.is_public !== undefined) {
      character.is_public = input.is_public;
    }

    if (input.image_url !== undefined) {
      character.image_url = input.image_url;
    }

    // Deep merge character_data
    if (input.character_data) {
      character.character_data = this.deepMerge(
        character.character_data,
        input.character_data
      );
    }

    return this.characterRepository.save(character);
  }

  async deleteCharacter(characterId: string, userId: string): Promise<boolean> {
    const character = await this.getCharacterById(characterId, userId);

    if (!character) {
      throw new Error('Character not found');
    }

    await this.characterRepository.remove(character);
    return true;
  }

  async getPublicCharacters(limit = 20, offset = 0): Promise<Character[]> {
    return this.characterRepository.find({
      where: { is_public: true },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  calculateAbilityModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }

  calculateProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }

  /**
   * Import a character from JSON export format
   */
  async importFromJSON(
    userId: string,
    jsonData: {
      name: string;
      system?: string;
      class?: string;
      race?: string;
      level?: number;
      alignment?: string;
      background?: string;
      abilityScores?: {
        strength?: number;
        dexterity?: number;
        constitution?: number;
        intelligence?: number;
        wisdom?: number;
        charisma?: number;
      };
      health?: {
        maxHitPoints?: number;
        currentHitPoints?: number;
        temporaryHitPoints?: number;
      };
      backstory?: string;
      gold?: number;
      isPublic?: boolean;
      imageUrl?: string;
    }
  ): Promise<Character> {
    const character = new Character();
    character.id = uuidv4();
    character.user_id = userId;
    character.name = jsonData.name;
    character.system_id = jsonData.system || 'd&d5e';

    if (jsonData.imageUrl) {
      character.image_url = jsonData.imageUrl;
    }

    if (jsonData.isPublic !== undefined) {
      character.is_public = jsonData.isPublic;
    }

    // Map JSON data to character_data structure
    if (jsonData.class) {
      character.character_data.basics.class = jsonData.class;
    }
    if (jsonData.race) {
      character.character_data.basics.race = jsonData.race;
    }
    if (jsonData.level !== undefined) {
      character.character_data.basics.level = jsonData.level;
    }
    if (jsonData.alignment) {
      character.character_data.basics.alignment = jsonData.alignment;
    }
    if (jsonData.background) {
      character.character_data.basics.background = jsonData.background;
    }

    // Map ability scores
    if (jsonData.abilityScores) {
      const scores = jsonData.abilityScores;
      if (scores.strength !== undefined) {
        character.character_data.attributes.strength = scores.strength;
      }
      if (scores.dexterity !== undefined) {
        character.character_data.attributes.dexterity = scores.dexterity;
      }
      if (scores.constitution !== undefined) {
        character.character_data.attributes.constitution = scores.constitution;
      }
      if (scores.intelligence !== undefined) {
        character.character_data.attributes.intelligence = scores.intelligence;
      }
      if (scores.wisdom !== undefined) {
        character.character_data.attributes.wisdom = scores.wisdom;
      }
      if (scores.charisma !== undefined) {
        character.character_data.attributes.charisma = scores.charisma;
      }
    }

    // Map health
    if (jsonData.health) {
      if (jsonData.health.maxHitPoints !== undefined) {
        character.character_data.hitPoints.maximum = jsonData.health.maxHitPoints;
      }
      if (jsonData.health.currentHitPoints !== undefined) {
        character.character_data.hitPoints.current = jsonData.health.currentHitPoints;
      }
      if (jsonData.health.temporaryHitPoints !== undefined) {
        character.character_data.hitPoints.temporary = jsonData.health.temporaryHitPoints;
      }
    }

    // Map backstory
    if (jsonData.backstory) {
      character.character_data.backstory.description = jsonData.backstory;
    }

    // Map gold
    if (jsonData.gold !== undefined) {
      character.character_data.currency.gold = jsonData.gold;
    }

    return this.characterRepository.save(character);
  }

  exportAsJSON(character: Character): object {
    const data = character.character_data;

    return {
      id: character.id,
      name: character.name,
      system: character.system_id,
      class: data.basics.class,
      race: data.basics.race,
      level: data.basics.level,
      alignment: data.basics.alignment,
      abilityScores: {
        strength: data.attributes.strength,
        dexterity: data.attributes.dexterity,
        constitution: data.attributes.constitution,
        intelligence: data.attributes.intelligence,
        wisdom: data.attributes.wisdom,
        charisma: data.attributes.charisma,
      },
      abilityModifiers: {
        strength: this.calculateAbilityModifier(data.attributes.strength),
        dexterity: this.calculateAbilityModifier(data.attributes.dexterity),
        constitution: this.calculateAbilityModifier(data.attributes.constitution),
        intelligence: this.calculateAbilityModifier(data.attributes.intelligence),
        wisdom: this.calculateAbilityModifier(data.attributes.wisdom),
        charisma: this.calculateAbilityModifier(data.attributes.charisma),
      },
      health: {
        maxHitPoints: data.hitPoints.maximum,
        currentHitPoints: data.hitPoints.current,
        temporaryHitPoints: data.hitPoints.temporary,
      },
      background: data.basics.background,
      backstory: data.backstory.description,
      gold: data.currency.gold,
      isPublic: character.is_public,
      imageUrl: character.image_url,
      createdAt: character.created_at,
      updatedAt: character.updated_at,
    };
  }
}
