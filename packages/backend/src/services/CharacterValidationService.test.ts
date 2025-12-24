import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterValidationService } from './CharacterValidationService.js';
import { SystemConfigService } from './SystemConfigService.js';
import { CharacterData } from '@character-creator/shared';

// Mock SystemConfigService
vi.mock('./SystemConfigService.js');

describe('CharacterValidationService', () => {
  let validationService: CharacterValidationService;
  let mockSystemConfigService: jest.Mocked<SystemConfigService>;

  const mockSystemConfig = {
    id: 'd&d5e',
    name: 'D&D 5e',
    getConfigData: () => ({
      metadata: {
        name: 'D&D 5e',
        version: '1.0.0',
        description: 'Test',
      },
      attributes: [
        {
          id: 'strength',
          name: 'Strength',
          abbreviation: 'STR',
          type: 'numeric' as const,
          min: 1,
          max: 20,
          default: 10,
        },
        {
          id: 'dexterity',
          name: 'Dexterity',
          abbreviation: 'DEX',
          type: 'numeric' as const,
          min: 1,
          max: 20,
          default: 10,
        },
        {
          id: 'constitution',
          name: 'Constitution',
          abbreviation: 'CON',
          type: 'numeric' as const,
          min: 1,
          max: 20,
          default: 10,
        },
        {
          id: 'intelligence',
          name: 'Intelligence',
          abbreviation: 'INT',
          type: 'numeric' as const,
          min: 1,
          max: 20,
          default: 10,
        },
        {
          id: 'wisdom',
          name: 'Wisdom',
          abbreviation: 'WIS',
          type: 'numeric' as const,
          min: 1,
          max: 20,
          default: 10,
        },
        {
          id: 'charisma',
          name: 'Charisma',
          abbreviation: 'CHA',
          type: 'numeric' as const,
          min: 1,
          max: 20,
          default: 10,
        },
      ],
      classes: [
        { id: 'fighter', name: 'Fighter', hitDice: 'd10', primaryAbility: 'strength' },
        { id: 'wizard', name: 'Wizard', hitDice: 'd6', primaryAbility: 'intelligence' },
      ],
      races: [
        { id: 'human', name: 'Human', size: 'Medium', speed: 30 },
        { id: 'elf', name: 'Elf', size: 'Medium', speed: 30 },
      ],
      skills: [
        { id: 'athletics', name: 'Athletics', ability: 'strength' },
        { id: 'arcana', name: 'Arcana', ability: 'intelligence' },
      ],
      alignments: [
        { id: 'lawful-good', name: 'Lawful Good' },
        { id: 'chaotic-neutral', name: 'Chaotic Neutral' },
      ],
      formulas: {
        abilityModifier: 'floor((score - 10) / 2)',
        proficiencyBonus: 'ceil(level / 4) + 1',
      },
    }),
  };

  beforeEach(() => {
    mockSystemConfigService = {
      getSystemById: vi.fn(),
      getAttributeDefinitions: vi.fn(),
      isValidClass: vi.fn(),
      isValidRace: vi.fn(),
      isValidAlignment: vi.fn(),
      getSkills: vi.fn(),
    } as any;

    validationService = new CharacterValidationService(mockSystemConfigService);
  });

  describe('validateCharacter', () => {
    it('should return error if system not found', async () => {
      vi.mocked(mockSystemConfigService.getSystemById).mockResolvedValue(null);

      const result = await validationService.validateCharacter('non-existent', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SYSTEM_NOT_FOUND');
    });

    it('should validate valid character successfully', async () => {
      vi.mocked(mockSystemConfigService.getSystemById).mockResolvedValue(
        mockSystemConfig as any
      );
      vi.mocked(mockSystemConfigService.getAttributeDefinitions).mockResolvedValue(
        mockSystemConfig.getConfigData().attributes
      );
      vi.mocked(mockSystemConfigService.isValidClass).mockResolvedValue(true);
      vi.mocked(mockSystemConfigService.isValidRace).mockResolvedValue(true);
      vi.mocked(mockSystemConfigService.isValidAlignment).mockResolvedValue(true);
      vi.mocked(mockSystemConfigService.getSkills).mockResolvedValue(
        mockSystemConfig.getConfigData().skills
      );

      const characterData: Partial<CharacterData> = {
        attributes: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        basics: {
          race: 'human',
          class: 'fighter',
          level: 5,
          experience: 6500,
        },
        hitPoints: {
          current: 38,
          maximum: 45,
          temporary: 0,
        },
        skills: {},
        proficiencies: {
          skills: [],
          weapons: [],
          armor: [],
        },
        currency: {
          platinum: 0,
          gold: 100,
          electrum: 0,
          silver: 0,
          copper: 0,
        },
      };

      const result = await validationService.validateCharacter('d&d5e', characterData);

      if (!result.valid) {
        console.log('Validation errors:', result.errors);
      }

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAttributes', () => {
    beforeEach(() => {
      vi.mocked(mockSystemConfigService.getAttributeDefinitions).mockResolvedValue(
        mockSystemConfig.getConfigData().attributes
      );
    });

    it('should accept attributes within range', async () => {
      const errors = await validationService.validateAttributes('d&d5e', {
        strength: 10,
        dexterity: 15,
      });

      expect(errors).toHaveLength(0);
    });

    it('should reject attribute below minimum', async () => {
      const errors = await validationService.validateAttributes('d&d5e', {
        strength: 0,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('VALUE_TOO_LOW');
      expect(errors[0].field).toBe('attributes.strength');
    });

    it('should reject attribute above maximum', async () => {
      const errors = await validationService.validateAttributes('d&d5e', {
        strength: 25,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('VALUE_TOO_HIGH');
      expect(errors[0].field).toBe('attributes.strength');
    });

    it('should reject non-numeric attribute', async () => {
      const errors = await validationService.validateAttributes('d&d5e', {
        strength: 'very strong' as any,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_TYPE');
    });

    it('should reject unknown attribute', async () => {
      const errors = await validationService.validateAttributes('d&d5e', {
        unknown_attr: 10,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('UNKNOWN_ATTRIBUTE');
    });
  });

  describe('validateBasics', () => {
    beforeEach(() => {
      vi.mocked(mockSystemConfigService.isValidClass).mockResolvedValue(true);
      vi.mocked(mockSystemConfigService.isValidRace).mockResolvedValue(true);
      vi.mocked(mockSystemConfigService.isValidAlignment).mockResolvedValue(true);
    });

    it('should validate valid basics', async () => {
      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'human',
        level: 5,
        experience: 6500,
      });

      expect(errors).toHaveLength(0);
    });

    it('should reject invalid class', async () => {
      vi.mocked(mockSystemConfigService.isValidClass).mockResolvedValue(false);

      const errors = await validationService.validateBasics('d&d5e', {
        class: 'invalid-class',
        race: 'human',
        level: 5,
        experience: 0,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_CLASS')).toBeDefined();
    });

    it('should reject invalid race', async () => {
      vi.mocked(mockSystemConfigService.isValidRace).mockResolvedValue(false);

      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'invalid-race',
        level: 5,
        experience: 0,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_RACE')).toBeDefined();
    });

    it('should reject invalid alignment', async () => {
      vi.mocked(mockSystemConfigService.isValidAlignment).mockResolvedValue(false);

      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'human',
        level: 5,
        experience: 0,
        alignment: 'invalid-alignment',
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_ALIGNMENT')).toBeDefined();
    });

    it('should reject level below 1', async () => {
      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'human',
        level: 0,
        experience: 0,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'VALUE_TOO_LOW')).toBeDefined();
    });

    it('should reject level above 30', async () => {
      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'human',
        level: 35,
        experience: 0,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'VALUE_TOO_HIGH')).toBeDefined();
    });

    it('should reject non-integer level', async () => {
      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'human',
        level: 5.5,
        experience: 0,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });

    it('should reject negative experience', async () => {
      const errors = await validationService.validateBasics('d&d5e', {
        class: 'fighter',
        race: 'human',
        level: 5,
        experience: -100,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'VALUE_TOO_LOW')).toBeDefined();
    });
  });

  describe('validateHitPoints', () => {
    it('should validate valid hit points', () => {
      const errors = validationService.validateHitPoints(
        {
          current: 30,
          maximum: 45,
          temporary: 5,
        },
        5
      );

      expect(errors).toHaveLength(0);
    });

    it('should reject negative current HP', () => {
      const errors = validationService.validateHitPoints(
        {
          current: -5,
          maximum: 45,
          temporary: 0,
        },
        5
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.field === 'hitPoints.current')).toBeDefined();
    });

    it('should reject negative maximum HP', () => {
      const errors = validationService.validateHitPoints(
        {
          current: 0,
          maximum: 0,
          temporary: 0,
        },
        5
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.field === 'hitPoints.maximum')).toBeDefined();
    });

    it('should reject current HP exceeding maximum', () => {
      const errors = validationService.validateHitPoints(
        {
          current: 50,
          maximum: 45,
          temporary: 0,
        },
        5
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'CURRENT_EXCEEDS_MAXIMUM')).toBeDefined();
    });

    it('should reject unreasonably high maximum HP', () => {
      const errors = validationService.validateHitPoints(
        {
          current: 500,
          maximum: 500,
          temporary: 0,
        },
        5
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'VALUE_TOO_HIGH')).toBeDefined();
    });

    it('should reject non-integer hit points', () => {
      const errors = validationService.validateHitPoints(
        {
          current: 30.5,
          maximum: 45,
          temporary: 0,
        },
        5
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });
  });

  describe('validateSkills', () => {
    beforeEach(() => {
      vi.mocked(mockSystemConfigService.getSkills).mockResolvedValue(
        mockSystemConfig.getConfigData().skills
      );
    });

    it('should validate valid skills', async () => {
      const errors = await validationService.validateSkills('d&d5e', {
        athletics: { proficient: true, modifier: 5 },
        arcana: { proficient: false, modifier: 0 },
      });

      expect(errors).toHaveLength(0);
    });

    it('should reject unknown skill', async () => {
      const errors = await validationService.validateSkills('d&d5e', {
        'unknown-skill': { proficient: true, modifier: 3 },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'UNKNOWN_SKILL')).toBeDefined();
    });

    it('should reject non-boolean proficient field', async () => {
      const errors = await validationService.validateSkills('d&d5e', {
        athletics: { proficient: 'yes' as any, modifier: 5 },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });

    it('should reject non-number modifier field', async () => {
      const errors = await validationService.validateSkills('d&d5e', {
        athletics: { proficient: true, modifier: 'high' as any },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });
  });

  describe('validateProficiencies', () => {
    beforeEach(() => {
      vi.mocked(mockSystemConfigService.getSkills).mockResolvedValue(
        mockSystemConfig.getConfigData().skills
      );
    });

    it('should validate valid proficiencies', async () => {
      const errors = await validationService.validateProficiencies(
        'd&d5e',
        {
          skills: ['athletics', 'arcana'],
          weapons: ['longsword', 'shortbow'],
          armor: ['light', 'medium'],
        },
        'fighter'
      );

      expect(errors).toHaveLength(0);
    });

    it('should reject unknown skill proficiency', async () => {
      const errors = await validationService.validateProficiencies(
        'd&d5e',
        {
          skills: ['unknown-skill'],
          weapons: [],
          armor: [],
        },
        'fighter'
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'UNKNOWN_SKILL')).toBeDefined();
    });

    it('should reject duplicate skill proficiencies', async () => {
      const errors = await validationService.validateProficiencies(
        'd&d5e',
        {
          skills: ['athletics', 'athletics'],
          weapons: [],
          armor: [],
        },
        'fighter'
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'DUPLICATE_PROFICIENCY')).toBeDefined();
    });

    it('should reject non-array skills', async () => {
      const errors = await validationService.validateProficiencies(
        'd&d5e',
        {
          skills: 'athletics' as any,
          weapons: [],
          armor: [],
        },
        'fighter'
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });
  });

  describe('validateCurrency', () => {
    it('should validate valid currency', () => {
      const errors = validationService.validateCurrency({
        platinum: 5,
        gold: 100,
        electrum: 0,
        silver: 50,
        copper: 25,
      });

      expect(errors).toHaveLength(0);
    });

    it('should reject negative currency', () => {
      const errors = validationService.validateCurrency({
        platinum: 5,
        gold: -10,
        electrum: 0,
        silver: 50,
        copper: 25,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.field === 'currency.gold')).toBeDefined();
    });

    it('should reject non-integer currency', () => {
      const errors = validationService.validateCurrency({
        platinum: 5,
        gold: 100.5,
        electrum: 0,
        silver: 50,
        copper: 25,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });
  });

  describe('validateEquipment', () => {
    it('should validate valid equipment', () => {
      const errors = validationService.validateEquipment({
        weapons: [
          { id: 'longsword-1', name: 'Longsword', quantity: 1, equipped: true },
        ],
        armor: [{ id: 'chainmail-1', name: 'Chainmail', quantity: 1, equipped: true }],
        backpack: [
          { id: 'rope-1', name: 'Rope (50ft)', quantity: 1 },
          { id: 'torch-1', name: 'Torch', quantity: 10 },
        ],
      });

      expect(errors).toHaveLength(0);
    });

    it('should reject equipment without ID', () => {
      const errors = validationService.validateEquipment({
        weapons: [{ id: '', name: 'Longsword', quantity: 1 }],
        armor: [],
        backpack: [],
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'MISSING_FIELD')).toBeDefined();
    });

    it('should reject equipment without name', () => {
      const errors = validationService.validateEquipment({
        weapons: [{ id: 'sword-1', name: '', quantity: 1 }],
        armor: [],
        backpack: [],
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'MISSING_FIELD')).toBeDefined();
    });

    it('should reject equipment with invalid quantity', () => {
      const errors = validationService.validateEquipment({
        weapons: [{ id: 'sword-1', name: 'Longsword', quantity: 0 }],
        armor: [],
        backpack: [],
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_VALUE')).toBeDefined();
    });

    it('should reject non-array equipment', () => {
      const errors = validationService.validateEquipment({
        weapons: 'longsword' as any,
        armor: [],
        backpack: [],
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.code === 'INVALID_TYPE')).toBeDefined();
    });
  });
});
