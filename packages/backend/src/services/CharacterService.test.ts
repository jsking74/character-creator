import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterService } from './CharacterService.js';
import { Repository } from 'typeorm';
import { CharacterData } from '@character-creator/shared';

// Mock the Character entity to avoid TypeORM decorator issues
vi.mock('../models/Character.js', () => {
  return {
    Character: class MockCharacter {
      id: string = '';
      user_id: string = '';
      system_id: string = '';
      name: string = '';
      character_data: CharacterData;
      image_url?: string;
      is_public: boolean = false;
      created_at: Date = new Date();
      updated_at: Date = new Date();

      constructor() {
        // Initialize with defaults matching Character entity
        this.character_data = {
          attributes: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
          },
          basics: {
            race: '',
            class: '',
            level: 1,
            experience: 0,
          },
          hitPoints: {
            current: 0,
            maximum: 0,
            temporary: 0,
          },
          skills: {},
          proficiencies: {
            skills: [],
            weapons: [],
            armor: [],
          },
          equipment: {
            weapons: [],
            armor: [],
            backpack: [],
          },
          spells: {
            prepared: [],
          },
          traits: {
            features: [],
          },
          backstory: {},
          currency: {
            platinum: 0,
            gold: 0,
            electrum: 0,
            silver: 0,
            copper: 0,
          },
        } as CharacterData;
      }
    }
  };
});

// Import after mocking
import { Character } from '../models/Character.js';

describe('CharacterService', () => {
  let characterService: CharacterService;
  let mockRepository: Partial<Repository<Character>>;

  beforeEach(() => {
    // Create a mock repository
    mockRepository = {
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    characterService = new CharacterService(mockRepository as Repository<Character>);
  });

  describe('createCharacter', () => {
    it('should create a character with default values', async () => {
      const userId = 'user-123';
      const input = {
        name: 'Test Character',
        system_id: 'd&d5e',
      };

      const savedCharacter = new Character();
      savedCharacter.id = 'char-123';
      savedCharacter.user_id = userId;
      savedCharacter.name = input.name;
      savedCharacter.system_id = input.system_id;

      (mockRepository.save as any).mockResolvedValue(savedCharacter);

      const result = await characterService.createCharacter(userId, input);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          name: input.name,
          system_id: input.system_id,
        })
      );
      expect(result).toBe(savedCharacter);
    });

    it('should create a character with custom character_data', async () => {
      const userId = 'user-123';
      const input = {
        name: 'Custom Character',
        system_id: 'd&d5e',
        character_data: {
          basics: {
            race: 'Elf',
            class: 'Wizard',
            level: 5,
          },
          attributes: {
            intelligence: 18,
          },
        },
      };

      const savedCharacter = new Character();
      (mockRepository.save as any).mockResolvedValue(savedCharacter);

      await characterService.createCharacter(userId, input);

      const saveCall = (mockRepository.save as any).mock.calls[0][0];
      expect(saveCall.character_data.basics.race).toBe('Elf');
      expect(saveCall.character_data.basics.class).toBe('Wizard');
      expect(saveCall.character_data.basics.level).toBe(5);
      expect(saveCall.character_data.attributes.intelligence).toBe(18);
      // Should merge with defaults
      expect(saveCall.character_data.attributes.strength).toBe(10);
    });

    it('should set is_public and image_url when provided', async () => {
      const userId = 'user-123';
      const input = {
        name: 'Public Character',
        system_id: 'd&d5e',
        is_public: true,
        image_url: 'https://example.com/image.png',
      };

      const savedCharacter = new Character();
      (mockRepository.save as any).mockResolvedValue(savedCharacter);

      await characterService.createCharacter(userId, input);

      const saveCall = (mockRepository.save as any).mock.calls[0][0];
      expect(saveCall.is_public).toBe(true);
      expect(saveCall.image_url).toBe('https://example.com/image.png');
    });
  });

  describe('updateCharacter', () => {
    it('should update character name', async () => {
      const characterId = 'char-123';
      const userId = 'user-123';
      const existingCharacter = new Character();
      existingCharacter.id = characterId;
      existingCharacter.user_id = userId;
      existingCharacter.name = 'Old Name';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(existingCharacter),
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);
      (mockRepository.save as any).mockResolvedValue(existingCharacter);

      const result = await characterService.updateCharacter(characterId, userId, {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should deep merge character_data', async () => {
      const characterId = 'char-123';
      const userId = 'user-123';
      const existingCharacter = new Character();
      existingCharacter.id = characterId;
      existingCharacter.user_id = userId;
      existingCharacter.character_data = {
        basics: {
          race: 'Human',
          class: 'Fighter',
          level: 5,
          experience: 6500,
        },
        attributes: {
          strength: 16,
          dexterity: 14,
          constitution: 15,
          intelligence: 10,
          wisdom: 12,
          charisma: 8,
        },
      } as CharacterData;

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(existingCharacter),
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);
      (mockRepository.save as any).mockImplementation((char) => Promise.resolve(char));

      const result = await characterService.updateCharacter(characterId, userId, {
        character_data: {
          basics: {
            level: 6,
          },
          attributes: {
            strength: 18,
          },
        },
      });

      // Should update specified fields
      expect(result.character_data.basics.level).toBe(6);
      expect(result.character_data.attributes.strength).toBe(18);

      // Should preserve other fields
      expect(result.character_data.basics.race).toBe('Human');
      expect(result.character_data.basics.class).toBe('Fighter');
      expect(result.character_data.attributes.dexterity).toBe(14);
    });

    it('should throw error if character not found', async () => {
      const characterId = 'char-123';
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await expect(
        characterService.updateCharacter(characterId, userId, { name: 'New Name' })
      ).rejects.toThrow('Character not found');
    });
  });

  describe('deleteCharacter', () => {
    it('should delete character', async () => {
      const characterId = 'char-123';
      const userId = 'user-123';
      const existingCharacter = new Character();
      existingCharacter.id = characterId;
      existingCharacter.user_id = userId;

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(existingCharacter),
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);
      (mockRepository.remove as any).mockResolvedValue(existingCharacter);

      const result = await characterService.deleteCharacter(characterId, userId);

      expect(result).toBe(true);
      expect(mockRepository.remove).toHaveBeenCalledWith(existingCharacter);
    });

    it('should throw error if character not found', async () => {
      const characterId = 'char-123';
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await expect(
        characterService.deleteCharacter(characterId, userId)
      ).rejects.toThrow('Character not found');
    });
  });

  describe('getCharactersByUserId', () => {
    it('should retrieve all characters for a user', async () => {
      const userId = 'user-123';
      const characters = [new Character(), new Character()];

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(2),
        getMany: vi.fn().mockResolvedValue(characters),
        connection: { options: { type: 'better-sqlite3' } },
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      const result = await characterService.getCharactersByUserId(userId);

      expect(result.characters).toEqual(characters);
      expect(result.total).toBe(2);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'character.user_id = :userId',
        { userId }
      );
    });

    it('should filter by class', async () => {
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        getMany: vi.fn().mockResolvedValue([]),
        connection: { options: { type: 'better-sqlite3' } },
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await characterService.getCharactersByUserId(userId, { class: 'Fighter' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        `json_extract(character.character_data, '$.basics.class') = :class`,
        { class: 'Fighter' }
      );
    });

    it('should filter by race', async () => {
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        getMany: vi.fn().mockResolvedValue([]),
        connection: { options: { type: 'better-sqlite3' } },
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await characterService.getCharactersByUserId(userId, { race: 'Elf' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        `json_extract(character.character_data, '$.basics.race') = :race`,
        { race: 'Elf' }
      );
    });

    it('should filter by minLevel and maxLevel', async () => {
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        getMany: vi.fn().mockResolvedValue([]),
        connection: { options: { type: 'better-sqlite3' } },
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await characterService.getCharactersByUserId(userId, {
        minLevel: 5,
        maxLevel: 10,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        `CAST(json_extract(character.character_data, '$.basics.level') AS INTEGER) >= :minLevel`,
        { minLevel: 5 }
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        `CAST(json_extract(character.character_data, '$.basics.level') AS INTEGER) <= :maxLevel`,
        { maxLevel: 10 }
      );
    });

    it('should apply pagination', async () => {
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        getMany: vi.fn().mockResolvedValue([]),
        connection: { options: { type: 'better-sqlite3' } },
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await characterService.getCharactersByUserId(userId, {
        limit: 10,
        offset: 20,
      });

      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('should sort by level in descending order', async () => {
      const userId = 'user-123';

      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        getMany: vi.fn().mockResolvedValue([]),
        connection: { options: { type: 'better-sqlite3' } },
      };

      (mockRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      await characterService.getCharactersByUserId(userId, {
        sortBy: 'level',
        sortOrder: 'desc',
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        `CAST(json_extract(character.character_data, '$.basics.level') AS INTEGER)`,
        'DESC'
      );
    });
  });

  describe('exportAsJSON', () => {
    it('should export character in API format', () => {
      const character = new Character();
      character.id = 'char-123';
      character.name = 'Test Character';
      character.system_id = 'd&d5e';
      character.is_public = true;
      character.image_url = 'https://example.com/image.png';
      character.created_at = new Date('2023-01-01');
      character.updated_at = new Date('2023-01-02');
      character.character_data = {
        basics: {
          race: 'Human',
          class: 'Fighter',
          level: 5,
          experience: 6500,
          alignment: 'Lawful Good',
          background: 'Soldier',
        },
        attributes: {
          strength: 16,
          dexterity: 14,
          constitution: 15,
          intelligence: 10,
          wisdom: 12,
          charisma: 8,
        },
        hitPoints: {
          current: 40,
          maximum: 45,
          temporary: 5,
        },
        backstory: {
          description: 'A brave warrior',
        },
        currency: {
          platinum: 0,
          gold: 100,
          electrum: 0,
          silver: 50,
          copper: 0,
        },
      } as CharacterData;

      const result = characterService.exportAsJSON(character);

      expect(result).toEqual({
        id: 'char-123',
        name: 'Test Character',
        system: 'd&d5e',
        class: 'Fighter',
        race: 'Human',
        level: 5,
        alignment: 'Lawful Good',
        abilityScores: {
          strength: 16,
          dexterity: 14,
          constitution: 15,
          intelligence: 10,
          wisdom: 12,
          charisma: 8,
        },
        abilityModifiers: {
          strength: 3,
          dexterity: 2,
          constitution: 2,
          intelligence: 0,
          wisdom: 1,
          charisma: -1,
        },
        health: {
          maxHitPoints: 45,
          currentHitPoints: 40,
          temporaryHitPoints: 5,
        },
        background: 'Soldier',
        backstory: 'A brave warrior',
        gold: 100,
        isPublic: true,
        imageUrl: 'https://example.com/image.png',
        createdAt: character.created_at,
        updatedAt: character.updated_at,
      });
    });
  });

  describe('calculateAbilityModifier', () => {
    it('should calculate correct modifiers', () => {
      expect(characterService.calculateAbilityModifier(1)).toBe(-5);
      expect(characterService.calculateAbilityModifier(8)).toBe(-1);
      expect(characterService.calculateAbilityModifier(10)).toBe(0);
      expect(characterService.calculateAbilityModifier(11)).toBe(0);
      expect(characterService.calculateAbilityModifier(12)).toBe(1);
      expect(characterService.calculateAbilityModifier(18)).toBe(4);
      expect(characterService.calculateAbilityModifier(20)).toBe(5);
      expect(characterService.calculateAbilityModifier(30)).toBe(10);
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('should calculate correct proficiency bonus', () => {
      expect(characterService.calculateProficiencyBonus(1)).toBe(2);
      expect(characterService.calculateProficiencyBonus(4)).toBe(2);
      expect(characterService.calculateProficiencyBonus(5)).toBe(3);
      expect(characterService.calculateProficiencyBonus(8)).toBe(3);
      expect(characterService.calculateProficiencyBonus(9)).toBe(4);
      expect(characterService.calculateProficiencyBonus(12)).toBe(4);
      expect(characterService.calculateProficiencyBonus(13)).toBe(5);
      expect(characterService.calculateProficiencyBonus(16)).toBe(5);
      expect(characterService.calculateProficiencyBonus(17)).toBe(6);
      expect(characterService.calculateProficiencyBonus(20)).toBe(6);
    });
  });
});
