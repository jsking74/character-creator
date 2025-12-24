import { DatabaseManager } from '../database/DatabaseManager.js';
import { v4 as uuidv4 } from 'uuid';

export interface Character {
  id: string;
  user_id: string;
  system_id: string;
  name: string;
  character_data: string;
  image_url?: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterInput {
  name: string;
  system_id: string;
  character_data: any;
  image_url?: string;
  is_public?: boolean;
}

export interface UpdateCharacterInput {
  name?: string;
  character_data?: any;
  image_url?: string;
  is_public?: boolean;
}

export interface CharacterFilters {
  system_id?: string;
  class?: string;
  race?: string;
  minLevel?: number;
  maxLevel?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * CharacterService provides local database operations for characters
 * All operations work offline and sync to server when online
 */
export class CharacterService {
  constructor(private db: DatabaseManager) {}

  /**
   * Create a new character
   */
  async createCharacter(
    userId: string,
    input: CreateCharacterInput
  ): Promise<Character> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO characters (
        id, user_id, system_id, name, character_data,
        image_url, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        input.system_id,
        input.name,
        JSON.stringify(input.character_data),
        input.image_url || null,
        input.is_public ? 1 : 0,
        now,
        now,
      ]
    );

    const character = await this.db.get(
      'SELECT * FROM characters WHERE id = ?',
      [id]
    );

    return character as Character;
  }

  /**
   * Get character by ID
   */
  async getCharacterById(id: string, userId: string): Promise<Character | null> {
    const character = await this.db.get(
      'SELECT * FROM characters WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return character as Character | null;
  }

  /**
   * Get all characters for a user with optional filters
   */
  async getCharactersByUserId(
    userId: string,
    filters: CharacterFilters = {}
  ): Promise<{ characters: Character[]; total: number }> {
    let sql = 'SELECT * FROM characters WHERE user_id = ?';
    const params: any[] = [userId];

    // Add filters
    if (filters.system_id) {
      sql += ' AND system_id = ?';
      params.push(filters.system_id);
    }

    if (filters.search) {
      sql += ' AND name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    // Filter by class/race/level requires parsing JSON
    if (filters.class) {
      sql += ` AND json_extract(character_data, '$.basics.class') = ?`;
      params.push(filters.class);
    }

    if (filters.race) {
      sql += ` AND json_extract(character_data, '$.basics.race') = ?`;
      params.push(filters.race);
    }

    if (filters.minLevel !== undefined) {
      sql += ` AND CAST(json_extract(character_data, '$.basics.level') AS INTEGER) >= ?`;
      params.push(filters.minLevel);
    }

    if (filters.maxLevel !== undefined) {
      sql += ` AND CAST(json_extract(character_data, '$.basics.level') AS INTEGER) <= ?`;
      params.push(filters.maxLevel);
    }

    // Count total before pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await this.db.get(countSql, params);
    const total = countResult?.total || 0;

    // Add sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder || 'asc';
      if (filters.sortBy === 'level') {
        sql += ` ORDER BY CAST(json_extract(character_data, '$.basics.level') AS INTEGER) ${sortOrder}`;
      } else if (filters.sortBy === 'name') {
        sql += ` ORDER BY name ${sortOrder}`;
      } else {
        sql += ` ORDER BY updated_at ${sortOrder}`;
      }
    } else {
      sql += ' ORDER BY updated_at DESC';
    }

    // Add pagination
    if (filters.limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    const characters = await this.db.query(sql, params);

    return {
      characters: characters as Character[],
      total,
    };
  }

  /**
   * Update character
   */
  async updateCharacter(
    id: string,
    userId: string,
    updates: UpdateCharacterInput
  ): Promise<Character> {
    const character = await this.getCharacterById(id, userId);
    if (!character) {
      throw new Error('Character not found');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.character_data !== undefined) {
      // Merge with existing data
      const existingData = JSON.parse(character.character_data);
      const mergedData = { ...existingData, ...updates.character_data };
      updateFields.push('character_data = ?');
      params.push(JSON.stringify(mergedData));
    }

    if (updates.image_url !== undefined) {
      updateFields.push('image_url = ?');
      params.push(updates.image_url);
    }

    if (updates.is_public !== undefined) {
      updateFields.push('is_public = ?');
      params.push(updates.is_public ? 1 : 0);
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(id);
    params.push(userId);

    await this.db.run(
      `UPDATE characters SET ${updateFields.join(', ')}
       WHERE id = ? AND user_id = ?`,
      params
    );

    const updatedCharacter = await this.getCharacterById(id, userId);
    if (!updatedCharacter) {
      throw new Error('Character not found after update');
    }

    return updatedCharacter;
  }

  /**
   * Delete character
   */
  async deleteCharacter(id: string, userId: string): Promise<boolean> {
    const result = await this.db.run(
      'DELETE FROM characters WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return result.changes > 0;
  }

  /**
   * Export character as JSON for API compatibility
   */
  exportAsJSON(character: Character): any {
    const data = JSON.parse(character.character_data);

    return {
      id: character.id,
      name: character.name,
      system: character.system_id,
      class: data.basics?.class,
      race: data.basics?.race,
      level: data.basics?.level,
      alignment: data.basics?.alignment,
      abilityScores: data.attributes || {},
      abilityModifiers: this.calculateAbilityModifiers(data.attributes || {}),
      health: {
        maxHitPoints: data.hitPoints?.maximum || 0,
        currentHitPoints: data.hitPoints?.current || 0,
        temporaryHitPoints: data.hitPoints?.temporary || 0,
      },
      background: data.basics?.background,
      backstory: data.backstory?.description,
      gold: data.currency?.gold || 0,
      isPublic: Boolean(character.is_public),
      imageUrl: character.image_url || '',
      createdAt: character.created_at,
      updatedAt: character.updated_at,
    };
  }

  /**
   * Calculate ability modifiers from ability scores
   */
  private calculateAbilityModifiers(attributes: Record<string, number>): Record<string, number> {
    const modifiers: Record<string, number> = {};

    for (const [key, value] of Object.entries(attributes)) {
      modifiers[key] = Math.floor((value - 10) / 2);
    }

    return modifiers;
  }
}
