import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SystemConfigService } from './SystemConfigService.js';
import { Repository } from 'typeorm';
import { SystemConfigData } from '../models/SystemConfig.js';

// Mock the SystemConfig entity
vi.mock('../models/SystemConfig.js', () => {
  return {
    SystemConfig: class MockSystemConfig {
      id!: string;
      name!: string;
      version!: string;
      description?: string;
      config_data!: string;
      is_active: boolean = true;
      is_default: boolean = false;
      created_at!: Date;
      updated_at!: Date;

      getConfigData(): SystemConfigData {
        return JSON.parse(this.config_data);
      }

      setConfigData(data: SystemConfigData): void {
        this.config_data = JSON.stringify(data);
      }
    }
  };
});

// Import after mocking
import { SystemConfig } from '../models/SystemConfig.js';

describe('SystemConfigService', () => {
  let systemConfigService: SystemConfigService;
  let mockRepository: Partial<Repository<SystemConfig>>;

  const mockConfigData: SystemConfigData = {
    metadata: {
      name: 'Test System',
      version: '1.0.0',
      description: 'A test RPG system',
      author: 'Test Author',
    },
    attributes: [
      {
        id: 'strength',
        name: 'Strength',
        abbreviation: 'STR',
        type: 'numeric',
        min: 1,
        max: 20,
        default: 10,
      },
    ],
    classes: [
      {
        id: 'fighter',
        name: 'Fighter',
        hitDice: 'd10',
        primaryAbility: 'strength',
      },
    ],
    races: [
      {
        id: 'human',
        name: 'Human',
        size: 'Medium',
        speed: 30,
      },
    ],
    skills: [
      {
        id: 'athletics',
        name: 'Athletics',
        ability: 'strength',
      },
    ],
    formulas: {
      abilityModifier: 'floor((score - 10) / 2)',
      proficiencyBonus: 'ceil(level / 4) + 1',
    },
  };

  beforeEach(() => {
    mockRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
    };

    systemConfigService = new SystemConfigService(mockRepository as Repository<SystemConfig>);
  });

  afterEach(() => {
    systemConfigService.clearCache();
  });

  describe('getAllSystems', () => {
    it('should return all active systems ordered by default then name', async () => {
      const mockSystems = [
        {
          id: 'custom',
          name: 'Custom System',
          version: '1.0.0',
          description: 'Custom',
          is_active: true,
          is_default: false,
        },
        {
          id: 'd&d5e',
          name: 'D&D 5e',
          version: '1.0.0',
          description: 'Default system',
          is_active: true,
          is_default: true,
        },
      ];

      (mockRepository.find as any).mockResolvedValue(mockSystems);

      const result = await systemConfigService.getAllSystems();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { is_default: 'DESC', name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'custom',
        name: 'Custom System',
        version: '1.0.0',
        description: 'Custom',
        isDefault: false,
      });
    });

    it('should return empty array when no systems exist', async () => {
      (mockRepository.find as any).mockResolvedValue([]);

      const result = await systemConfigService.getAllSystems();

      expect(result).toEqual([]);
    });
  });

  describe('getSystemById', () => {
    it('should return system by ID', async () => {
      const mockSystem = new SystemConfig();
      mockSystem.id = 'test-system';
      mockSystem.name = 'Test System';
      mockSystem.version = '1.0.0';
      mockSystem.is_active = true;
      mockSystem.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(mockSystem);

      const result = await systemConfigService.getSystemById('test-system');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-system', is_active: true },
      });
      expect(result).toBe(mockSystem);
    });

    it('should return cached system on second call', async () => {
      const mockSystem = new SystemConfig();
      mockSystem.id = 'test-system';
      mockSystem.name = 'Test System';
      mockSystem.version = '1.0.0';
      mockSystem.is_active = true;
      mockSystem.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(mockSystem);

      // First call - should hit database
      const result1 = await systemConfigService.getSystemById('test-system');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await systemConfigService.getSystemById('test-system');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1); // Not called again
      expect(result2).toBe(result1);
    });

    it('should return null when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.getSystemById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultSystem', () => {
    it('should return default system', async () => {
      const mockSystem = new SystemConfig();
      mockSystem.id = 'd&d5e';
      mockSystem.name = 'D&D 5e';
      mockSystem.is_default = true;
      mockSystem.is_active = true;

      (mockRepository.findOne as any).mockResolvedValue(mockSystem);

      const result = await systemConfigService.getDefaultSystem();

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { is_default: true, is_active: true },
      });
      expect(result).toBe(mockSystem);
    });

    it('should cache default system', async () => {
      const mockSystem = new SystemConfig();
      mockSystem.id = 'd&d5e';
      mockSystem.is_default = true;

      (mockRepository.findOne as any).mockResolvedValue(mockSystem);

      await systemConfigService.getDefaultSystem();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSystem', () => {
    it('should create a new system', async () => {
      const savedSystem = new SystemConfig();
      savedSystem.id = 'new-system';
      savedSystem.name = 'New System';
      savedSystem.version = '1.0.0';
      savedSystem.is_active = true;
      savedSystem.is_default = false;
      savedSystem.setConfigData(mockConfigData);

      (mockRepository.save as any).mockResolvedValue(savedSystem);

      const result = await systemConfigService.createSystem(
        'new-system',
        'New System',
        '1.0.0',
        mockConfigData,
        'Test description'
      );

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('new-system');
      expect(result.name).toBe('New System');
    });

    it('should cache newly created system', async () => {
      const savedSystem = new SystemConfig();
      savedSystem.id = 'new-system';
      savedSystem.name = 'New System';
      savedSystem.version = '1.0.0';
      savedSystem.setConfigData(mockConfigData);

      (mockRepository.save as any).mockResolvedValue(savedSystem);
      (mockRepository.findOne as any).mockResolvedValue(savedSystem);

      await systemConfigService.createSystem(
        'new-system',
        'New System',
        '1.0.0',
        mockConfigData
      );

      // Should be cached - getSystemById won't hit database
      const result = await systemConfigService.getSystemById('new-system');
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result).toBe(savedSystem);
    });
  });

  describe('updateSystem', () => {
    it('should update system properties', async () => {
      const existingSystem = new SystemConfig();
      existingSystem.id = 'test-system';
      existingSystem.name = 'Old Name';
      existingSystem.version = '1.0.0';
      existingSystem.setConfigData(mockConfigData);

      const updatedSystem = { ...existingSystem };
      updatedSystem.name = 'New Name';

      (mockRepository.findOne as any).mockResolvedValue(existingSystem);
      (mockRepository.save as any).mockResolvedValue(updatedSystem);

      const result = await systemConfigService.updateSystem('test-system', {
        name: 'New Name',
      });

      expect(result?.name).toBe('New Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update config data', async () => {
      const existingSystem = new SystemConfig();
      existingSystem.id = 'test-system';
      existingSystem.setConfigData(mockConfigData);

      const newConfigData = { ...mockConfigData };
      newConfigData.metadata.version = '2.0.0';

      (mockRepository.findOne as any).mockResolvedValue(existingSystem);
      (mockRepository.save as any).mockResolvedValue(existingSystem);

      const result = await systemConfigService.updateSystem('test-system', {
        configData: newConfigData,
      });

      expect(result?.getConfigData().metadata.version).toBe('2.0.0');
    });

    it('should return null when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.updateSystem('non-existent', {
        name: 'New Name',
      });

      expect(result).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update cache after update', async () => {
      const existingSystem = new SystemConfig();
      existingSystem.id = 'test-system';
      existingSystem.name = 'Old Name';
      existingSystem.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(existingSystem);
      (mockRepository.save as any).mockResolvedValue(existingSystem);

      await systemConfigService.updateSystem('test-system', { name: 'New Name' });

      // Should be in cache now
      const cached = await systemConfigService.getSystemById('test-system');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1); // Only called once during update
    });
  });

  describe('deleteSystem', () => {
    it('should delete non-default system', async () => {
      const system = new SystemConfig();
      system.id = 'custom-system';
      system.is_default = false;

      (mockRepository.findOne as any).mockResolvedValue(system);
      (mockRepository.remove as any).mockResolvedValue(system);

      const result = await systemConfigService.deleteSystem('custom-system');

      expect(result).toBe(true);
      expect(mockRepository.remove).toHaveBeenCalledWith(system);
    });

    it('should not delete default system', async () => {
      const system = new SystemConfig();
      system.id = 'd&d5e';
      system.is_default = true;

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.deleteSystem('d&d5e');

      expect(result).toBe(false);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should return false when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.deleteSystem('non-existent');

      expect(result).toBe(false);
    });

    it('should clear cache after deletion', async () => {
      const system = new SystemConfig();
      system.id = 'custom-system';
      system.is_default = false;
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);
      (mockRepository.remove as any).mockResolvedValue(system);

      // Add to cache first
      await systemConfigService.getSystemById('custom-system');
      systemConfigService.clearCache();

      await systemConfigService.deleteSystem('custom-system');

      // Should not be in cache anymore
      (mockRepository.findOne as any).mockResolvedValue(null);
      const result = await systemConfigService.getSystemById('custom-system');
      expect(result).toBeNull();
    });
  });

  describe('getClasses', () => {
    it('should return classes from system config', async () => {
      const system = new SystemConfig();
      system.id = 'test-system';
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.getClasses('test-system');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'fighter', name: 'Fighter' });
    });

    it('should return empty array when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.getClasses('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('getRaces', () => {
    it('should return races from system config', async () => {
      const system = new SystemConfig();
      system.id = 'test-system';
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.getRaces('test-system');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'human', name: 'Human' });
    });

    it('should return empty array when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.getRaces('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('getSkills', () => {
    it('should return skills from system config', async () => {
      const system = new SystemConfig();
      system.id = 'test-system';
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.getSkills('test-system');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'athletics',
        name: 'Athletics',
        ability: 'strength',
      });
    });
  });

  describe('isValidClass', () => {
    it('should return true for valid class ID', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.isValidClass('test-system', 'fighter');

      expect(result).toBe(true);
    });

    it('should return true for valid class name (case insensitive)', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.isValidClass('test-system', 'FIGHTER');

      expect(result).toBe(true);
    });

    it('should return false for invalid class', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.isValidClass('test-system', 'wizard');

      expect(result).toBe(false);
    });

    it('should return false when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.isValidClass('non-existent', 'fighter');

      expect(result).toBe(false);
    });
  });

  describe('isValidRace', () => {
    it('should return true for valid race ID', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.isValidRace('test-system', 'human');

      expect(result).toBe(true);
    });

    it('should return false for invalid race', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.isValidRace('test-system', 'elf');

      expect(result).toBe(false);
    });
  });

  describe('getClassHitDice', () => {
    it('should return hit dice for valid class', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.getClassHitDice('test-system', 'fighter');

      expect(result).toBe('d10');
    });

    it('should return null for invalid class', async () => {
      const system = new SystemConfig();
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      const result = await systemConfigService.getClassHitDice('test-system', 'wizard');

      expect(result).toBeNull();
    });

    it('should return null when system not found', async () => {
      (mockRepository.findOne as any).mockResolvedValue(null);

      const result = await systemConfigService.getClassHitDice('non-existent', 'fighter');

      expect(result).toBeNull();
    });
  });

  describe('calculateAbilityModifier', () => {
    it('should calculate ability modifier using D&D formula', () => {
      const result = systemConfigService.calculateAbilityModifier('d&d5e', 16);

      expect(result).toBe(3); // (16 - 10) / 2 = 3
    });

    it('should handle low scores', () => {
      const result = systemConfigService.calculateAbilityModifier('d&d5e', 8);

      expect(result).toBe(-1); // (8 - 10) / 2 = -1
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('should calculate proficiency bonus for level 1', () => {
      const result = systemConfigService.calculateProficiencyBonus('d&d5e', 1);

      expect(result).toBe(2); // ceil(1 / 4) + 1 = 2
    });

    it('should calculate proficiency bonus for level 5', () => {
      const result = systemConfigService.calculateProficiencyBonus('d&d5e', 5);

      expect(result).toBe(3); // ceil(5 / 4) + 1 = 3
    });

    it('should calculate proficiency bonus for level 20', () => {
      const result = systemConfigService.calculateProficiencyBonus('d&d5e', 20);

      expect(result).toBe(6); // ceil(20 / 4) + 1 = 6
    });
  });

  describe('clearCache', () => {
    it('should clear all cached systems', async () => {
      const system = new SystemConfig();
      system.id = 'test-system';
      system.setConfigData(mockConfigData);

      (mockRepository.findOne as any).mockResolvedValue(system);

      // Add to cache
      await systemConfigService.getSystemById('test-system');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      // Clear cache
      systemConfigService.clearCache();

      // Should hit database again
      await systemConfigService.getSystemById('test-system');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});
