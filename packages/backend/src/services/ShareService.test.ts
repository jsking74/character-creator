import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShareService } from './ShareService.js';
import { Repository } from 'typeorm';
import { CharacterData } from '@character-creator/shared';

// Mock the Character entity
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
      share_token?: string;
      share_token_expires_at?: Date;
      view_count: number = 0;
      created_at: Date = new Date();
      updated_at: Date = new Date();

      constructor() {
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

// Mock AppDataSource
vi.mock('../database/data-source.js', () => ({
  AppDataSource: {
    getRepository: vi.fn(),
  },
}));

// Import after mocking
import { Character } from '../models/Character.js';
import { AppDataSource } from '../database/data-source.js';

describe('ShareService', () => {
  let shareService: ShareService;
  let mockRepository: Partial<Repository<Character>>;

  beforeEach(() => {
    mockRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
    };

    (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
    shareService = new ShareService();
  });

  describe('generateShareToken', () => {
    it('should generate a share token for a character', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.name = 'Test Character';

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.generateShareToken(characterId, userId);

      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(12);
      expect(result.characterId).toBe(characterId);
      expect(result.characterName).toBe('Test Character');
      expect(result.expiresAt).toBeNull();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should generate a token with expiration when expiresInDays is provided', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.name = 'Test Character';

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.generateShareToken(characterId, userId, 7);

      expect(result.token).toBeDefined();
      expect(result.expiresAt).not.toBeNull();
      expect(result.expiresAt!.getTime()).toBeGreaterThan(Date.now());

      // Check that expiration is approximately 7 days from now
      const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
      expect(result.expiresAt!.getTime()).toBeCloseTo(sevenDaysFromNow, -4);
    });

    it('should throw error if character not found', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';

      (mockRepository.findOne as any).mockResolvedValue(null);

      await expect(
        shareService.generateShareToken(characterId, userId)
      ).rejects.toThrow('Character not found or access denied');
    });

    it('should throw error if character belongs to different user', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';

      (mockRepository.findOne as any).mockResolvedValue(null); // Query includes user_id match

      await expect(
        shareService.generateShareToken(characterId, userId)
      ).rejects.toThrow('Character not found or access denied');
    });
  });

  describe('revokeShareToken', () => {
    it('should revoke an existing share token', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.share_token = 'existing-token';

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      await shareService.revokeShareToken(characterId, userId);

      expect(mockRepository.save).toHaveBeenCalled();
      const savedChar = (mockRepository.save as any).mock.calls[0][0];
      expect(savedChar.share_token).toBeUndefined();
      expect(savedChar.share_token_expires_at).toBeUndefined();
    });

    it('should throw error if character not found', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';

      (mockRepository.findOne as any).mockResolvedValue(null);

      await expect(
        shareService.revokeShareToken(characterId, userId)
      ).rejects.toThrow('Character not found or access denied');
    });
  });

  describe('getCharacterByShareToken', () => {
    it('should return character when token is valid', async () => {
      const token = 'valid-token';
      const character = new Character();
      character.id = 'char-123';
      character.name = 'Test Character';
      character.share_token = token;
      character.view_count = 0;

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.getCharacterByShareToken(token);

      expect(result).not.toBeNull();
      expect(result!.character.id).toBe('char-123');
      expect(result!.isExpired).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should increment view count when token is accessed', async () => {
      const token = 'valid-token';
      const character = new Character();
      character.id = 'char-123';
      character.share_token = token;
      character.view_count = 5;

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      await shareService.getCharacterByShareToken(token);

      const savedChar = (mockRepository.save as any).mock.calls[0][0];
      expect(savedChar.view_count).toBe(6);
    });

    it('should return null when token not found', async () => {
      const token = 'invalid-token';

      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await shareService.getCharacterByShareToken(token);

      expect(result).toBeNull();
    });

    it('should mark as expired when token has expired', async () => {
      const token = 'expired-token';
      const character = new Character();
      character.id = 'char-123';
      character.share_token = token;
      character.share_token_expires_at = new Date(Date.now() - 1000); // Expired 1 second ago
      character.view_count = 0;

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.getCharacterByShareToken(token);

      expect(result).not.toBeNull();
      expect(result!.isExpired).toBe(true);
    });

    it('should not mark as expired when token has not expired', async () => {
      const token = 'valid-token';
      const character = new Character();
      character.id = 'char-123';
      character.share_token = token;
      character.share_token_expires_at = new Date(Date.now() + 1000000); // Future date
      character.view_count = 0;

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.getCharacterByShareToken(token);

      expect(result).not.toBeNull();
      expect(result!.isExpired).toBe(false);
    });
  });

  describe('getShareTokenInfo', () => {
    it('should return share token info when token exists', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const expiresAt = new Date(Date.now() + 86400000);
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.name = 'Test Character';
      character.share_token = 'my-token';
      character.share_token_expires_at = expiresAt;

      (mockRepository.findOne as any).mockResolvedValue(character);

      const result = await shareService.getShareTokenInfo(characterId, userId);

      expect(result).not.toBeNull();
      expect(result!.token).toBe('my-token');
      expect(result!.expiresAt).toEqual(expiresAt);
      expect(result!.characterId).toBe(characterId);
      expect(result!.characterName).toBe('Test Character');
    });

    it('should return null when character has no share token', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.share_token = undefined;

      (mockRepository.findOne as any).mockResolvedValue(character);

      const result = await shareService.getShareTokenInfo(characterId, userId);

      expect(result).toBeNull();
    });

    it('should return null when character not found', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';

      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await shareService.getShareTokenInfo(characterId, userId);

      expect(result).toBeNull();
    });
  });

  describe('updateShareTokenExpiration', () => {
    it('should update expiration date for existing token', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.name = 'Test Character';
      character.share_token = 'existing-token';
      character.share_token_expires_at = new Date();

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.updateShareTokenExpiration(characterId, userId, 14);

      expect(result.token).toBe('existing-token');
      expect(result.expiresAt).not.toBeNull();

      // Check that expiration is approximately 14 days from now
      const fourteenDaysFromNow = Date.now() + 14 * 24 * 60 * 60 * 1000;
      expect(result.expiresAt!.getTime()).toBeCloseTo(fourteenDaysFromNow, -4);
    });

    it('should set expiration to null when expiresInDays is null', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.name = 'Test Character';
      character.share_token = 'existing-token';
      character.share_token_expires_at = new Date();

      (mockRepository.findOne as any).mockResolvedValue(character);
      (mockRepository.save as any).mockImplementation((char: Character) => Promise.resolve(char));

      const result = await shareService.updateShareTokenExpiration(characterId, userId, null);

      expect(result.expiresAt).toBeNull();
    });

    it('should throw error if character not found', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';

      (mockRepository.findOne as any).mockResolvedValue(null);

      await expect(
        shareService.updateShareTokenExpiration(characterId, userId, 7)
      ).rejects.toThrow('Character not found or access denied');
    });

    it('should throw error if no share token exists', async () => {
      const userId = 'user-123';
      const characterId = 'char-123';
      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.share_token = undefined;

      (mockRepository.findOne as any).mockResolvedValue(character);

      await expect(
        shareService.updateShareTokenExpiration(characterId, userId, 7)
      ).rejects.toThrow('No share token exists for this character');
    });
  });
});
