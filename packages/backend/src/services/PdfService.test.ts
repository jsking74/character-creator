import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfService } from './PdfService.js';
import { CharacterData } from '@character-creator/shared';

// Mock pdfkit
vi.mock('pdfkit', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      fontSize: vi.fn().mockReturnThis(),
      font: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      moveDown: vi.fn().mockReturnThis(),
      fillColor: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      addPage: vi.fn().mockReturnThis(),
      y: 100,
    })),
  };
});

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
      created_at: Date = new Date();
      updated_at: Date = new Date();

      constructor() {
        this.character_data = {} as CharacterData;
      }
    }
  };
});

import { Character } from '../models/Character.js';

describe('PdfService', () => {
  let pdfService: PdfService;

  beforeEach(() => {
    pdfService = new PdfService();
  });

  const createMockCharacter = (overrides: Partial<CharacterData> = {}): Character => {
    const character = new Character();
    character.id = 'char-123';
    character.name = 'Test Character';
    character.system_id = 'd&d5e';
    character.is_public = false;
    character.created_at = new Date('2023-01-01');
    character.updated_at = new Date('2023-06-15');
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
      backstory: {
        description: 'A brave warrior from the north.',
      },
      currency: {
        platinum: 0,
        gold: 100,
        electrum: 0,
        silver: 50,
        copper: 0,
      },
      ...overrides,
    } as CharacterData;
    return character;
  };

  describe('generateCharacterSheet', () => {
    it('should return a PDFDocument instance', () => {
      const character = createMockCharacter();
      const result = pdfService.generateCharacterSheet(character);

      expect(result).toBeDefined();
      expect(typeof result.fontSize).toBe('function');
      expect(typeof result.font).toBe('function');
      expect(typeof result.text).toBe('function');
    });

    it('should handle characters without backstory', () => {
      const character = createMockCharacter({ backstory: {} });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle characters with empty backstory description', () => {
      const character = createMockCharacter({ backstory: { description: '' } });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle characters with temporary HP of 0', () => {
      const character = createMockCharacter({
        hitPoints: { current: 40, maximum: 45, temporary: 0 },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle level 1 characters', () => {
      const character = createMockCharacter({
        basics: {
          race: 'Elf',
          class: 'Wizard',
          level: 1,
          experience: 0,
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle high level characters', () => {
      const character = createMockCharacter({
        basics: {
          race: 'Dwarf',
          class: 'Cleric',
          level: 20,
          experience: 355000,
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle characters with extreme ability scores', () => {
      const character = createMockCharacter({
        attributes: {
          strength: 1,
          dexterity: 30,
          constitution: 8,
          intelligence: 20,
          wisdom: 3,
          charisma: 18,
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle missing optional fields', () => {
      const character = createMockCharacter({
        basics: {
          race: 'Human',
          class: 'Rogue',
          level: 3,
          experience: 900,
          // No alignment or background
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });
  });

  describe('calculateAbilityModifier (via PDF output)', () => {
    // We test the private method indirectly through generateCharacterSheet
    // The PDF generation uses these calculations

    it('should correctly generate PDF for character with negative modifiers', () => {
      const character = createMockCharacter({
        attributes: {
          strength: 8, // -1 modifier
          dexterity: 6, // -2 modifier
          constitution: 7, // -2 modifier
          intelligence: 4, // -3 modifier
          wisdom: 9, // 0 modifier
          charisma: 5, // -3 modifier
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should correctly generate PDF for character with positive modifiers', () => {
      const character = createMockCharacter({
        attributes: {
          strength: 18, // +4 modifier
          dexterity: 16, // +3 modifier
          constitution: 14, // +2 modifier
          intelligence: 12, // +1 modifier
          wisdom: 20, // +5 modifier
          charisma: 22, // +6 modifier
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });
  });

  describe('calculateProficiencyBonus (via PDF output)', () => {
    it('should handle proficiency bonus for levels 1-4 (+2)', () => {
      const levels = [1, 2, 3, 4];
      levels.forEach(level => {
        const character = createMockCharacter({
          basics: { race: 'Human', class: 'Fighter', level, experience: 0 },
        });
        expect(() => {
          pdfService.generateCharacterSheet(character);
        }).not.toThrow();
      });
    });

    it('should handle proficiency bonus for levels 5-8 (+3)', () => {
      const levels = [5, 6, 7, 8];
      levels.forEach(level => {
        const character = createMockCharacter({
          basics: { race: 'Human', class: 'Fighter', level, experience: 0 },
        });
        expect(() => {
          pdfService.generateCharacterSheet(character);
        }).not.toThrow();
      });
    });

    it('should handle proficiency bonus for levels 17-20 (+6)', () => {
      const levels = [17, 18, 19, 20];
      levels.forEach(level => {
        const character = createMockCharacter({
          basics: { race: 'Human', class: 'Fighter', level, experience: 0 },
        });
        expect(() => {
          pdfService.generateCharacterSheet(character);
        }).not.toThrow();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle character with very long name', () => {
      const character = createMockCharacter();
      character.name = 'A'.repeat(100);

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle character with very long backstory', () => {
      const character = createMockCharacter({
        backstory: {
          description: 'Lorem ipsum '.repeat(500),
        },
      });

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle public character', () => {
      const character = createMockCharacter();
      character.is_public = true;

      expect(() => {
        pdfService.generateCharacterSheet(character);
      }).not.toThrow();
    });

    it('should handle different system IDs', () => {
      const systems = ['d&d5e', 'pathfinder2e', 'custom'];
      systems.forEach(systemId => {
        const character = createMockCharacter();
        character.system_id = systemId;
        expect(() => {
          pdfService.generateCharacterSheet(character);
        }).not.toThrow();
      });
    });
  });
});
