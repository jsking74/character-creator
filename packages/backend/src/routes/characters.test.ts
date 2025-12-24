import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock the data-source to avoid TypeORM initialization
vi.mock('../database/data-source.js', () => ({
  AppDataSource: {
    getRepository: vi.fn(),
  },
}));

// Mock the Character model to avoid TypeORM decorator issues
vi.mock('../models/Character.js', () => ({
  Character: class MockCharacter {},
}));

// Mock the CharacterService
vi.mock('../services/CharacterService.js', () => {
  const MockCharacterService = vi.fn();
  MockCharacterService.prototype.createCharacter = vi.fn();
  MockCharacterService.prototype.getCharactersByUserId = vi.fn();
  MockCharacterService.prototype.getCharacterById = vi.fn();
  MockCharacterService.prototype.updateCharacter = vi.fn();
  MockCharacterService.prototype.deleteCharacter = vi.fn();
  MockCharacterService.prototype.exportAsJSON = vi.fn();

  return { CharacterService: MockCharacterService };
});

// Mock SystemConfigService
vi.mock('../services/SystemConfigService.js', () => ({
  systemConfigService: {
    getSystemById: vi.fn(),
    getAttributeDefinitions: vi.fn(),
    isValidClass: vi.fn(),
    isValidRace: vi.fn(),
    isValidAlignment: vi.fn(),
    getSkills: vi.fn(),
  },
  SystemConfigService: vi.fn(),
}));

// Mock CharacterValidationService
vi.mock('../services/CharacterValidationService.js', () => {
  const MockCharacterValidationService = vi.fn();
  MockCharacterValidationService.prototype.validateCharacter = vi.fn().mockResolvedValue({
    valid: true,
    errors: [],
  });

  return { CharacterValidationService: MockCharacterValidationService };
});

// Mock PdfService
vi.mock('../services/PdfService.js', () => {
  const MockPdfService = vi.fn();
  MockPdfService.prototype.generateCharacterSheet = vi.fn(() => {
    // Store reference to the response for later
    let responseStream: any = null;

    const mockDoc = {
      pipe: vi.fn((res: any) => {
        responseStream = res;
        return mockDoc;
      }),
      end: vi.fn(() => {
        // When doc.end() is called, write mock content and end the response
        if (responseStream) {
          responseStream.write(Buffer.from('%PDF-1.4 mock content'));
          responseStream.end();
        }
        return mockDoc;
      }),
      on: vi.fn(() => mockDoc),
    };
    return mockDoc;
  });

  return { PdfService: MockPdfService };
});

// Mock auth middleware
vi.mock('../middlewares/auth.js', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-123' };
    next();
  },
}));

// Import after mocking
import characterRoutes from './characters.js';
import { CharacterService } from '../services/CharacterService.js';
import { AppDataSource } from '../database/data-source.js';

describe('Character Routes', () => {
  let app: Express;
  let mockCharacterService: any;

  beforeEach(() => {
    // Create a mock service instance
    mockCharacterService = new CharacterService();

    // Mock AppDataSource.getRepository to return a mock that creates our service
    (AppDataSource.getRepository as any).mockReturnValue({});

    // Mock CharacterService constructor to return our mock instance
    vi.mocked(CharacterService).mockImplementation(() => mockCharacterService);

    app = express();
    app.use(express.json());
    app.use('/api/characters', characterRoutes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/characters', () => {
    it('should create a new character', async () => {
      const newCharacter = {
        id: 'char-123',
        user_id: 'test-user-123',
        system_id: 'd&d5e',
        name: 'Test Character',
        character_data: {
          basics: { race: 'Human', class: 'Fighter', level: 1, experience: 0 },
          attributes: {
            strength: 16,
            dexterity: 14,
            constitution: 15,
            intelligence: 10,
            wisdom: 12,
            charisma: 8,
          },
        },
        is_public: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCharacterService.createCharacter.mockResolvedValue(newCharacter);
      mockCharacterService.exportAsJSON.mockReturnValue({
        id: newCharacter.id,
        name: newCharacter.name,
        system: newCharacter.system_id,
        class: 'Fighter',
        race: 'Human',
      });

      const response = await request(app)
        .post('/api/characters')
        .send({
          name: 'Test Character',
          system_id: 'd&d5e',
          character_data: {
            basics: { race: 'Human', class: 'Fighter', level: 1, experience: 0 },
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Character');
      expect(mockCharacterService.createCharacter).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          name: 'Test Character',
          system_id: 'd&d5e',
        })
      );
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/characters')
        .send({
          // Missing required 'name' field
          system_id: 'd&d5e',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid system_id', async () => {
      const response = await request(app)
        .post('/api/characters')
        .send({
          name: 'Test Character',
          system_id: '', // Empty system_id
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/characters', () => {
    it('should return all characters for the user', async () => {
      const characters = [
        { id: 'char-1', name: 'Character 1' },
        { id: 'char-2', name: 'Character 2' },
      ];

      mockCharacterService.getCharactersByUserId.mockResolvedValue({
        characters,
        total: 2,
      });
      mockCharacterService.exportAsJSON
        .mockReturnValueOnce({ id: 'char-1', name: 'Character 1' })
        .mockReturnValueOnce({ id: 'char-2', name: 'Character 2' });

      const response = await request(app).get('/api/characters').expect(200);

      expect(response.body.characters).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith(
        'test-user-123',
        {}
      );
    });

    it('should filter characters by class', async () => {
      mockCharacterService.getCharactersByUserId.mockResolvedValue({
        characters: [],
        total: 0,
      });

      await request(app).get('/api/characters?class=Fighter').expect(200);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ class: 'Fighter' })
      );
    });

    it('should filter characters by race', async () => {
      mockCharacterService.getCharactersByUserId.mockResolvedValue({
        characters: [],
        total: 0,
      });

      await request(app).get('/api/characters?race=Elf').expect(200);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ race: 'Elf' })
      );
    });

    it('should filter characters by level range', async () => {
      mockCharacterService.getCharactersByUserId.mockResolvedValue({
        characters: [],
        total: 0,
      });

      await request(app)
        .get('/api/characters?minLevel=5&maxLevel=10')
        .expect(200);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ minLevel: 5, maxLevel: 10 })
      );
    });

    it('should apply pagination', async () => {
      mockCharacterService.getCharactersByUserId.mockResolvedValue({
        characters: [],
        total: 0,
      });

      await request(app).get('/api/characters?limit=10&offset=20').expect(200);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });

    it('should apply sorting', async () => {
      mockCharacterService.getCharactersByUserId.mockResolvedValue({
        characters: [],
        total: 0,
      });

      await request(app)
        .get('/api/characters?sortBy=level&sortOrder=desc')
        .expect(200);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ sortBy: 'level', sortOrder: 'desc' })
      );
    });
  });

  describe('GET /api/characters/:id', () => {
    it('should return a specific character', async () => {
      const character = {
        id: 'char-123',
        user_id: 'test-user-123',
        name: 'Test Character',
      };

      mockCharacterService.getCharacterById.mockResolvedValue(character);
      mockCharacterService.exportAsJSON.mockReturnValue({
        id: character.id,
        name: character.name,
      });

      const response = await request(app)
        .get('/api/characters/char-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'char-123');
      expect(response.body).toHaveProperty('name', 'Test Character');
    });

    it('should return 404 if character not found', async () => {
      mockCharacterService.getCharacterById.mockResolvedValue(null);

      await request(app).get('/api/characters/nonexistent').expect(404);
    });
  });

  describe('PUT /api/characters/:id', () => {
    it('should update a character', async () => {
      const existingCharacter = {
        id: 'char-123',
        user_id: 'test-user-123',
        system_id: 'd&d5e',
        name: 'Old Character',
      };

      const updatedCharacter = {
        id: 'char-123',
        user_id: 'test-user-123',
        name: 'Updated Character',
      };

      // Mock getCharacterById for validation step
      mockCharacterService.getCharacterById.mockResolvedValue(existingCharacter);
      mockCharacterService.updateCharacter.mockResolvedValue(updatedCharacter);
      mockCharacterService.exportAsJSON.mockReturnValue({
        id: updatedCharacter.id,
        name: updatedCharacter.name,
      });

      const response = await request(app)
        .put('/api/characters/char-123')
        .send({
          name: 'Updated Character',
          character_data: {
            basics: { level: 5 },
          },
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Character');
      expect(mockCharacterService.updateCharacter).toHaveBeenCalledWith(
        'char-123',
        'test-user-123',
        expect.objectContaining({
          name: 'Updated Character',
        })
      );
    });

    it('should return 404 if character not found', async () => {
      mockCharacterService.updateCharacter.mockRejectedValue(
        new Error('Character not found')
      );

      await request(app)
        .put('/api/characters/nonexistent')
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put('/api/characters/char-123')
        .send({
          name: '', // Invalid empty name
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/characters/:id', () => {
    it('should delete a character', async () => {
      mockCharacterService.deleteCharacter.mockResolvedValue(true);

      const response = await request(app).delete('/api/characters/char-123').expect(200);

      expect(response.body).toHaveProperty('message', 'Character deleted successfully');
      expect(mockCharacterService.deleteCharacter).toHaveBeenCalledWith(
        'char-123',
        'test-user-123'
      );
    });

    it('should return 404 if character not found', async () => {
      mockCharacterService.deleteCharacter.mockRejectedValue(
        new Error('Character not found')
      );

      await request(app).delete('/api/characters/nonexistent').expect(404);
    });
  });

  describe('GET /api/characters/:id/pdf', () => {
    it('should generate a PDF for a character', async () => {
      const character = {
        id: 'char-123',
        user_id: 'test-user-123',
        name: 'Test Character',
      };

      mockCharacterService.getCharacterById.mockResolvedValue(character);

      // Mock PdfService will be handled in the route
      const response = await request(app)
        .get('/api/characters/char-123/pdf')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(mockCharacterService.getCharacterById).toHaveBeenCalledWith(
        'char-123',
        'test-user-123'
      );
    });

    it('should return 404 if character not found for PDF', async () => {
      mockCharacterService.getCharacterById.mockResolvedValue(null);

      await request(app).get('/api/characters/nonexistent/pdf').expect(404);
    });
  });
});
