import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PartyService } from './PartyService.js';
import { Repository } from 'typeorm';
import { CharacterData } from '@character-creator/shared';

// Mock Party entity
vi.mock('../models/Party.js', () => ({
  Party: class MockParty {
    id: string = '';
    owner_id: string = '';
    name: string = '';
    description?: string;
    campaign_name?: string;
    members: any[] = [];
    is_public: boolean = false;
    notes?: string;
    shared_gold: number = 0;
    shared_inventory?: any[];
    created_at: Date = new Date();
    updated_at: Date = new Date();
  },
}));

// Mock Character entity
vi.mock('../models/Character.js', () => ({
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
      this.character_data = {
        attributes: {
          strength: 10, dexterity: 10, constitution: 10,
          intelligence: 10, wisdom: 10, charisma: 10,
        },
        basics: { race: '', class: '', level: 1, experience: 0 },
        hitPoints: { current: 0, maximum: 0, temporary: 0 },
        skills: {},
        proficiencies: { skills: [], weapons: [], armor: [] },
        equipment: { weapons: [], armor: [], backpack: [] },
        spells: { prepared: [] },
        traits: { features: [] },
        backstory: {},
        currency: { platinum: 0, gold: 0, electrum: 0, silver: 0, copper: 0 },
      } as CharacterData;
    }
  },
}));

// Import after mocking
import { Party } from '../models/Party.js';
import { Character } from '../models/Character.js';

describe('PartyService', () => {
  let partyService: PartyService;
  let mockPartyRepository: Partial<Repository<Party>>;
  let mockCharacterRepository: Partial<Repository<Character>>;

  beforeEach(() => {
    mockPartyRepository = {
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    mockCharacterRepository = {
      findOne: vi.fn(),
    };

    partyService = new PartyService(
      mockPartyRepository as Repository<Party>,
      mockCharacterRepository as Repository<Character>
    );

    vi.clearAllMocks();
  });

  describe('createParty', () => {
    it('should create a new party', async () => {
      const userId = 'user-123';
      const input = {
        name: 'Adventurers Guild',
        description: 'A group of brave adventurers',
        campaign_name: 'The Lost Mines',
        is_public: true,
        notes: 'Weekly sessions on Fridays',
      };

      const savedParty = {
        id: 'party-123',
        owner_id: userId,
        ...input,
        members: [],
        shared_gold: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPartyRepository.save as any).mockResolvedValue(savedParty);

      const result = await partyService.createParty(userId, input);

      expect(result).toMatchObject({
        owner_id: userId,
        name: input.name,
        description: input.description,
        campaign_name: input.campaign_name,
        is_public: input.is_public,
        notes: input.notes,
      });

      expect(mockPartyRepository.save).toHaveBeenCalled();
    });

    it('should create party with default values', async () => {
      const userId = 'user-123';
      const input = {
        name: 'Simple Party',
      };

      const savedParty = {
        id: 'party-456',
        owner_id: userId,
        name: input.name,
        is_public: false,
        members: [],
        shared_gold: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPartyRepository.save as any).mockResolvedValue(savedParty);

      const result = await partyService.createParty(userId, input);

      expect(result.is_public).toBe(false);
    });
  });

  describe('getPartiesByUserId', () => {
    it('should return all parties for a user', async () => {
      const userId = 'user-123';
      const parties = [
        { id: 'party-1', name: 'Party 1', owner_id: userId, members: [] },
        { id: 'party-2', name: 'Party 2', owner_id: userId, members: [] },
      ];

      (mockPartyRepository.find as any).mockResolvedValue(parties);

      const result = await partyService.getPartiesByUserId(userId);

      expect(result).toEqual(parties);
      expect(mockPartyRepository.find).toHaveBeenCalledWith({
        where: { owner_id: userId },
        relations: ['members'],
        order: { updated_at: 'DESC' },
      });
    });
  });

  describe('getPartyById', () => {
    it('should return party by id for owner', async () => {
      const partyId = 'party-123';
      const userId = 'user-123';
      const party = {
        id: partyId,
        owner_id: userId,
        name: 'Test Party',
        members: [],
      };

      const queryBuilder: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(party),
      };

      (mockPartyRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      const result = await partyService.getPartyById(partyId, userId);

      expect(result).toEqual(party);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(party.owner_id = :userId OR party.is_public = true)',
        { userId }
      );
    });

    it('should return public party for non-owner', async () => {
      const partyId = 'party-123';
      const publicParty = {
        id: partyId,
        owner_id: 'user-456',
        name: 'Public Party',
        is_public: true,
        members: [],
      };

      const queryBuilder: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(publicParty),
      };

      (mockPartyRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      const result = await partyService.getPartyById(partyId, 'user-789');

      expect(result).toEqual(publicParty);
    });

    it('should return party without user filtering', async () => {
      const partyId = 'party-123';
      const party = {
        id: partyId,
        owner_id: 'user-123',
        name: 'Test Party',
        members: [],
      };

      const queryBuilder: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(party),
      };

      (mockPartyRepository.createQueryBuilder as any).mockReturnValue(queryBuilder);

      const result = await partyService.getPartyById(partyId);

      expect(result).toEqual(party);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('updateParty', () => {
    it('should update party successfully', async () => {
      const partyId = 'party-123';
      const userId = 'user-123';
      const existingParty = {
        id: partyId,
        owner_id: userId,
        name: 'Old Name',
        shared_gold: 100,
        members: [],
      };

      const updateInput = {
        name: 'New Name',
        description: 'Updated description',
        shared_gold: 200,
      };

      (mockPartyRepository.findOne as any).mockResolvedValue(existingParty);
      (mockPartyRepository.save as any).mockImplementation((party) => Promise.resolve(party));

      const result = await partyService.updateParty(partyId, userId, updateInput);

      expect(result.name).toBe(updateInput.name);
      expect(result.description).toBe(updateInput.description);
      expect(result.shared_gold).toBe(updateInput.shared_gold);
    });

    it('should throw error if party not found', async () => {
      const partyId = 'nonexistent';
      const userId = 'user-123';

      (mockPartyRepository.findOne as any).mockResolvedValue(null);

      await expect(
        partyService.updateParty(partyId, userId, { name: 'New Name' })
      ).rejects.toThrow('Party not found');
    });

    it('should update shared inventory', async () => {
      const partyId = 'party-123';
      const userId = 'user-123';
      const existingParty = {
        id: partyId,
        owner_id: userId,
        name: 'Test Party',
        members: [],
        shared_inventory: [],
      };

      const newInventory = [
        { name: 'Healing Potion', quantity: 5, description: 'Restores 2d4+2 HP' },
        { name: 'Rope (50ft)', quantity: 2 },
      ];

      (mockPartyRepository.findOne as any).mockResolvedValue(existingParty);
      (mockPartyRepository.save as any).mockImplementation((party) => Promise.resolve(party));

      const result = await partyService.updateParty(partyId, userId, {
        shared_inventory: newInventory,
      });

      expect(result.shared_inventory).toEqual(newInventory);
    });
  });

  describe('deleteParty', () => {
    it('should delete party successfully', async () => {
      const partyId = 'party-123';
      const userId = 'user-123';
      const party = {
        id: partyId,
        owner_id: userId,
        name: 'Test Party',
      };

      (mockPartyRepository.findOne as any).mockResolvedValue(party);
      (mockPartyRepository.remove as any).mockResolvedValue(party);

      const result = await partyService.deleteParty(partyId, userId);

      expect(result).toBe(true);
      expect(mockPartyRepository.remove).toHaveBeenCalledWith(party);
    });

    it('should throw error if party not found', async () => {
      const partyId = 'nonexistent';
      const userId = 'user-123';

      (mockPartyRepository.findOne as any).mockResolvedValue(null);

      await expect(partyService.deleteParty(partyId, userId)).rejects.toThrow('Party not found');
    });
  });

  describe('addMember', () => {
    it('should add character to party successfully', async () => {
      const partyId = 'party-123';
      const userId = 'user-123';
      const characterId = 'char-456';

      const party = {
        id: partyId,
        owner_id: userId,
        name: 'Test Party',
        members: [],
      };

      const character = new Character();
      character.id = characterId;
      character.user_id = userId;
      character.name = 'Test Character';

      (mockPartyRepository.findOne as any).mockResolvedValue(party);
      (mockCharacterRepository.findOne as any).mockResolvedValue(character);
      (mockPartyRepository.save as any).mockImplementation((p) => Promise.resolve(p));

      const result = await partyService.addMember(partyId, userId, characterId);

      expect(result.members).toContainEqual(character);
      expect(mockCharacterRepository.findOne).toHaveBeenCalledWith({
        where: { id: characterId, user_id: userId },
      });
    });

    it('should throw error if party not found', async () => {
      (mockPartyRepository.findOne as any).mockResolvedValue(null);

      await expect(
        partyService.addMember('party-123', 'user-123', 'char-456')
      ).rejects.toThrow('Party not found');
    });

    it('should throw error if character not found', async () => {
      const party = {
        id: 'party-123',
        owner_id: 'user-123',
        members: [],
      };

      (mockPartyRepository.findOne as any).mockResolvedValue(party);
      (mockCharacterRepository.findOne as any).mockResolvedValue(null);

      await expect(
        partyService.addMember('party-123', 'user-123', 'char-456')
      ).rejects.toThrow('Character not found');
    });

    it('should throw error if character already a member', async () => {
      const characterId = 'char-456';
      const character = new Character();
      character.id = characterId;

      const party = {
        id: 'party-123',
        owner_id: 'user-123',
        members: [character],
      };

      (mockPartyRepository.findOne as any).mockResolvedValue(party);
      (mockCharacterRepository.findOne as any).mockResolvedValue(character);

      await expect(
        partyService.addMember('party-123', 'user-123', characterId)
      ).rejects.toThrow('Character is already a member of this party');
    });
  });

  describe('removeMember', () => {
    it('should remove character from party successfully', async () => {
      const characterId = 'char-456';
      const character = new Character();
      character.id = characterId;

      const party = {
        id: 'party-123',
        owner_id: 'user-123',
        members: [character],
      };

      (mockPartyRepository.findOne as any).mockResolvedValue(party);
      (mockPartyRepository.save as any).mockImplementation((p) => Promise.resolve(p));

      const result = await partyService.removeMember('party-123', 'user-123', characterId);

      expect(result.members).not.toContainEqual(character);
      expect(result.members.length).toBe(0);
    });

    it('should throw error if party not found', async () => {
      (mockPartyRepository.findOne as any).mockResolvedValue(null);

      await expect(
        partyService.removeMember('party-123', 'user-123', 'char-456')
      ).rejects.toThrow('Party not found');
    });

    it('should throw error if character not a member', async () => {
      const party = {
        id: 'party-123',
        owner_id: 'user-123',
        members: [],
      };

      (mockPartyRepository.findOne as any).mockResolvedValue(party);

      await expect(
        partyService.removeMember('party-123', 'user-123', 'char-456')
      ).rejects.toThrow('Character is not a member of this party');
    });
  });

  describe('getPublicParties', () => {
    it('should return public parties with default pagination', async () => {
      const publicParties = [
        { id: 'party-1', name: 'Public Party 1', is_public: true, members: [] },
        { id: 'party-2', name: 'Public Party 2', is_public: true, members: [] },
      ];

      (mockPartyRepository.find as any).mockResolvedValue(publicParties);

      const result = await partyService.getPublicParties();

      expect(result).toEqual(publicParties);
      expect(mockPartyRepository.find).toHaveBeenCalledWith({
        where: { is_public: true },
        relations: ['members'],
        order: { created_at: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should return public parties with custom pagination', async () => {
      (mockPartyRepository.find as any).mockResolvedValue([]);

      await partyService.getPublicParties(10, 30);

      expect(mockPartyRepository.find).toHaveBeenCalledWith({
        where: { is_public: true },
        relations: ['members'],
        order: { created_at: 'DESC' },
        skip: 30,
        take: 10,
      });
    });
  });

  describe('exportAsJSON', () => {
    it('should export party with members', () => {
      const character1 = new Character();
      character1.id = 'char-1';
      character1.name = 'Fighter';
      character1.character_data.basics = {
        race: 'Human',
        class: 'Fighter',
        level: 5,
        experience: 6500,
      };

      const character2 = new Character();
      character2.id = 'char-2';
      character2.name = 'Wizard';
      character2.character_data.basics = {
        race: 'Elf',
        class: 'Wizard',
        level: 4,
        experience: 2700,
      };

      const party = {
        id: 'party-123',
        name: 'Adventurers',
        description: 'A party of adventurers',
        campaign_name: 'Lost Mines',
        is_public: true,
        notes: 'Weekly sessions',
        shared_gold: 500,
        shared_inventory: [{ name: 'Rope', quantity: 2 }],
        members: [character1, character2],
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-15'),
      } as Party;

      const result = partyService.exportAsJSON(party);

      expect(result).toEqual({
        id: 'party-123',
        name: 'Adventurers',
        description: 'A party of adventurers',
        campaignName: 'Lost Mines',
        isPublic: true,
        notes: 'Weekly sessions',
        sharedGold: 500,
        sharedInventory: [{ name: 'Rope', quantity: 2 }],
        memberCount: 2,
        members: [
          { id: 'char-1', name: 'Fighter', class: 'Fighter', race: 'Human', level: 5 },
          { id: 'char-2', name: 'Wizard', class: 'Wizard', race: 'Elf', level: 4 },
        ],
        createdAt: party.created_at,
        updatedAt: party.updated_at,
      });
    });

    it('should export party without members', () => {
      const party = {
        id: 'party-456',
        name: 'Empty Party',
        is_public: false,
        shared_gold: 0,
        created_at: new Date(),
        updated_at: new Date(),
      } as Party;

      const result = partyService.exportAsJSON(party);

      expect(result).toMatchObject({
        id: 'party-456',
        name: 'Empty Party',
        memberCount: 0,
        members: [],
        sharedInventory: [],
      });
    });
  });
});
