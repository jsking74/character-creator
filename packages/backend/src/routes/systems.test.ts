import 'reflect-metadata';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { SystemConfigData } from '../models/SystemConfig.js';

// Mock the system config service - define mocks before vi.mock
vi.mock('../services/SystemConfigService.js', () => {
  return {
    systemConfigService: {
      getAllSystems: vi.fn(),
      getSystemById: vi.fn(),
      getClasses: vi.fn(),
      getRaces: vi.fn(),
      getAlignments: vi.fn(),
      getAttributes: vi.fn(),
      getSkills: vi.fn(),
      createSystem: vi.fn(),
      updateSystem: vi.fn(),
      deleteSystem: vi.fn(),
    },
  };
});

// Mock authentication middleware
vi.mock('../middlewares/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

// Import after mocking
import systemsRouter from './systems.js';
import { systemConfigService } from '../services/SystemConfigService.js';

describe('Systems Routes', () => {
  let app: Express;

  const mockConfigData: SystemConfigData = {
    metadata: {
      name: 'Test System',
      version: '1.0.0',
      description: 'Test description',
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

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/systems', systemsRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/systems', () => {
    it('should return all systems', async () => {
      const mockSystems = [
        {
          id: 'd&d5e',
          name: 'D&D 5e',
          version: '1.0.0',
          description: 'Fifth edition',
          isDefault: true,
        },
        {
          id: 'pathfinder2e',
          name: 'Pathfinder 2e',
          version: '1.0.0',
          isDefault: false,
        },
      ];

      vi.mocked(systemConfigService.getAllSystems).mockResolvedValue(mockSystems);

      const response = await request(app).get('/api/systems');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSystems);
      expect(systemConfigService.getAllSystems).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      vi.mocked(systemConfigService.getAllSystems).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/systems');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/systems/:id', () => {
    it('should return system by ID', async () => {
      const mockSystem = {
        id: 'd&d5e',
        name: 'D&D 5e',
        version: '1.0.0',
        description: 'Fifth edition',
        is_default: true,
        getConfigData: () => mockConfigData,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(mockSystem);

      const response = await request(app).get('/api/systems/d&d5e');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'd&d5e');
      expect(response.body).toHaveProperty('config');
      expect(systemConfigService.getSystemById).toHaveBeenCalledWith('d&d5e');
    });

    it('should return 404 when system not found', async () => {
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(null);

      const response = await request(app).get('/api/systems/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'System not found');
    });
  });

  describe('GET /api/systems/:id/classes', () => {
    it('should return classes for a system', async () => {
      const mockClasses = [
        { id: 'fighter', name: 'Fighter' },
        { id: 'wizard', name: 'Wizard' },
      ];

      vi.mocked(systemConfigService.getClasses).mockResolvedValue(mockClasses);

      const response = await request(app).get('/api/systems/d&d5e/classes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockClasses);
      expect(systemConfigService.getClasses).toHaveBeenCalledWith('d&d5e');
    });

    it('should return 404 when system not found and no classes', async () => {
      vi.mocked(systemConfigService.getClasses).mockResolvedValue([]);
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(null);

      const response = await request(app).get('/api/systems/non-existent/classes');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'System not found');
    });

    it('should return empty array when system exists but has no classes', async () => {
      vi.mocked(systemConfigService.getClasses).mockResolvedValue([]);
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue({ id: 'd&d5e' });

      const response = await request(app).get('/api/systems/d&d5e/classes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/systems/:id/races', () => {
    it('should return races for a system', async () => {
      const mockRaces = [
        { id: 'human', name: 'Human' },
        { id: 'elf', name: 'Elf' },
      ];

      vi.mocked(systemConfigService.getRaces).mockResolvedValue(mockRaces);

      const response = await request(app).get('/api/systems/d&d5e/races');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRaces);
    });
  });

  describe('GET /api/systems/:id/alignments', () => {
    it('should return alignments for a system', async () => {
      const mockAlignments = [
        { id: 'lawful-good', name: 'Lawful Good' },
        { id: 'chaotic-neutral', name: 'Chaotic Neutral' },
      ];

      vi.mocked(systemConfigService.getAlignments).mockResolvedValue(mockAlignments);

      const response = await request(app).get('/api/systems/d&d5e/alignments');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAlignments);
    });
  });

  describe('GET /api/systems/:id/attributes', () => {
    it('should return attributes for a system', async () => {
      const mockAttributes = [
        { id: 'strength', name: 'Strength', abbreviation: 'STR' },
        { id: 'dexterity', name: 'Dexterity', abbreviation: 'DEX' },
      ];

      vi.mocked(systemConfigService.getAttributes).mockResolvedValue(mockAttributes);

      const response = await request(app).get('/api/systems/d&d5e/attributes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAttributes);
    });
  });

  describe('GET /api/systems/:id/skills', () => {
    it('should return skills for a system', async () => {
      const mockSkills = [
        { id: 'athletics', name: 'Athletics', ability: 'strength' },
        { id: 'stealth', name: 'Stealth', ability: 'dexterity' },
      ];

      vi.mocked(systemConfigService.getSkills).mockResolvedValue(mockSkills);

      const response = await request(app).get('/api/systems/d&d5e/skills');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSkills);
    });
  });

  describe('POST /api/systems', () => {
    it('should create a new system', async () => {
      const mockSystem = {
        id: 'new-system',
        name: 'New System',
        version: '1.0.0',
        description: 'Test',
        is_default: false,
        getConfigData: () => mockConfigData,
      };

      vi.mocked(systemConfigService.createSystem).mockResolvedValue(mockSystem);

      const response = await request(app)
        .post('/api/systems')
        .send({
          id: 'new-system',
          name: 'New System',
          version: '1.0.0',
          description: 'Test',
          config: mockConfigData,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'new-system');
      expect(systemConfigService.createSystem).toHaveBeenCalledWith(
        'new-system',
        'New System',
        '1.0.0',
        mockConfigData,
        'Test'
      );
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/systems')
        .send({
          name: 'New System',
          // Missing id and config
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/systems/:id', () => {
    it('should update an existing system', async () => {
      const existingSystem = {
        id: 'custom-system',
        name: 'Old Name',
        is_default: false,
      };

      const updatedSystem = {
        id: 'custom-system',
        name: 'New Name',
        version: '2.0.0',
        description: 'Updated',
        is_default: false,
        getConfigData: () => mockConfigData,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(existingSystem);
      vi.mocked(systemConfigService.updateSystem).mockResolvedValue(updatedSystem);

      const response = await request(app)
        .put('/api/systems/custom-system')
        .send({
          name: 'New Name',
          version: '2.0.0',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'New Name');
      expect(systemConfigService.updateSystem).toHaveBeenCalled();
    });

    it('should return 404 when system not found', async () => {
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/systems/non-existent')
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'System not found');
    });

    it('should return 403 when trying to modify default system', async () => {
      const defaultSystem = {
        id: 'd&d5e',
        name: 'D&D 5e',
        is_default: true,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(defaultSystem);

      const response = await request(app)
        .put('/api/systems/d&d5e')
        .send({ name: 'Modified D&D' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Cannot modify default system configurations');
      expect(systemConfigService.updateSystem).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/systems/:id', () => {
    it('should delete a custom system', async () => {
      const customSystem = {
        id: 'custom-system',
        is_default: false,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(customSystem);
      vi.mocked(systemConfigService.deleteSystem).mockResolvedValue(true);

      const response = await request(app).delete('/api/systems/custom-system');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'System deleted successfully');
      expect(systemConfigService.deleteSystem).toHaveBeenCalledWith('custom-system');
    });

    it('should return 404 when system not found', async () => {
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(null);

      const response = await request(app).delete('/api/systems/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'System not found');
    });

    it('should return 403 when trying to delete default system', async () => {
      const defaultSystem = {
        id: 'd&d5e',
        is_default: true,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(defaultSystem);

      const response = await request(app).delete('/api/systems/d&d5e');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Cannot delete default system configurations');
      expect(systemConfigService.deleteSystem).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/systems/:id/export', () => {
    it('should export a system as JSON', async () => {
      const mockSystem = {
        id: 'test-system',
        name: 'Test System',
        version: '1.0.0',
        description: 'Test',
        getConfigData: () => mockConfigData,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(mockSystem);

      const response = await request(app).post('/api/systems/test-system/export');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'test-system');
      expect(response.body).toHaveProperty('config');
      expect(response.body).toHaveProperty('exportedAt');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 404 when system not found', async () => {
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(null);

      const response = await request(app).post('/api/systems/non-existent/export');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'System not found');
    });
  });

  describe('POST /api/systems/import', () => {
    it('should import a system from JSON', async () => {
      const mockSystem = {
        id: 'imported-system',
        name: 'Imported System',
        version: '1.0.0',
        description: 'Imported',
        is_default: false,
        getConfigData: () => mockConfigData,
      };

      vi.mocked(systemConfigService.getSystemById).mockResolvedValue(null); // System doesn't exist yet
      vi.mocked(systemConfigService.createSystem).mockResolvedValue(mockSystem);

      const response = await request(app)
        .post('/api/systems/import')
        .send({
          id: 'imported-system',
          name: 'Imported System',
          version: '1.0.0',
          description: 'Imported',
          config: mockConfigData,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'imported-system');
      expect(response.body).toHaveProperty('message', 'System imported successfully');
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/systems/import')
        .send({
          name: 'Incomplete System',
          // Missing id and config
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 when system already exists', async () => {
      vi.mocked(systemConfigService.getSystemById).mockResolvedValue({ id: 'existing-system' });

      const response = await request(app)
        .post('/api/systems/import')
        .send({
          id: 'existing-system',
          name: 'Existing System',
          config: mockConfigData,
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'System with this ID already exists');
    });
  });
});
