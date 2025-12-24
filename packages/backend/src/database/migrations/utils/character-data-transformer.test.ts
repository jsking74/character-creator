import { describe, it, expect } from 'vitest';
import { flatToNested, nestedToFlat, validateCharacterData } from './character-data-transformer.js';
import { CharacterData } from '@character-creator/shared';

describe('character-data-transformer', () => {
  describe('flatToNested', () => {
    it('should transform a complete flat character to nested structure', () => {
      const flatCharacter = {
        id: 'test-id-1',
        name: 'Test Character',
        system: 'd&d5e',
        class: 'Fighter',
        race: 'Human',
        level: 5,
        alignment: 'Lawful Good',
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
        max_hit_points: 45,
        current_hit_points: 35,
        temporary_hit_points: 5,
        skills_json: '{"Athletics":{"proficient":true,"modifier":4}}',
        proficiencies_json: '{"skills":["Athletics"],"weapons":["Longsword"],"armor":["Heavy"]}',
        equipment_json: '{"weapons":[{"id":"1","name":"Longsword","quantity":1,"equipped":true}],"armor":[],"backpack":[]}',
        traits_json: '{"features":["Second Wind"],"flaws":"Overconfident","bonds":"Protect the innocent","ideals":"Justice"}',
        gold: 250,
        background: 'Soldier',
        backstory: 'A brave warrior from the north',
      };

      const result = flatToNested(flatCharacter);

      expect(result).toMatchObject({
        attributes: {
          strength: 18,
          dexterity: 14,
          constitution: 16,
          intelligence: 10,
          wisdom: 12,
          charisma: 8,
        },
        basics: {
          race: 'Human',
          class: 'Fighter',
          level: 5,
          experience: 0,
          alignment: 'Lawful Good',
          background: 'Soldier',
        },
        hitPoints: {
          current: 35,
          maximum: 45,
          temporary: 5,
        },
        skills: {
          Athletics: {
            proficient: true,
            modifier: 4,
          },
        },
        proficiencies: {
          skills: ['Athletics'],
          weapons: ['Longsword'],
          armor: ['Heavy'],
        },
        equipment: {
          weapons: [
            {
              id: '1',
              name: 'Longsword',
              quantity: 1,
              equipped: true,
            },
          ],
          armor: [],
          backpack: [],
        },
        traits: {
          features: ['Second Wind'],
          flaws: 'Overconfident',
          bonds: 'Protect the innocent',
          ideals: 'Justice',
        },
        backstory: {
          description: 'A brave warrior from the north',
        },
        currency: {
          platinum: 0,
          gold: 250,
          electrum: 0,
          silver: 0,
          copper: 0,
        },
      });
    });

    it('should handle minimal character with defaults', () => {
      const flatCharacter = {
        id: 'test-id-2',
        name: 'Minimal Character',
        system: 'd&d5e',
        class: 'Wizard',
        race: 'Elf',
        level: 1,
      };

      const result = flatToNested(flatCharacter);

      expect(result.attributes).toEqual({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      });

      expect(result.basics).toEqual({
        race: 'Elf',
        class: 'Wizard',
        level: 1,
        experience: 0,
        alignment: undefined,
        background: undefined,
      });

      expect(result.hitPoints).toEqual({
        current: 0,
        maximum: 0,
        temporary: 0,
      });

      expect(result.skills).toEqual({});
      expect(result.proficiencies).toEqual({
        skills: [],
        weapons: [],
        armor: [],
      });
    });

    it('should handle null and undefined values gracefully', () => {
      const flatCharacter = {
        id: 'test-id-3',
        name: 'Null Test',
        system: 'd&d5e',
        class: 'Rogue',
        race: 'Halfling',
        level: 3,
        strength: null,
        dexterity: undefined,
        skills_json: null,
        proficiencies_json: undefined,
        equipment_json: '',
        traits_json: null,
        gold: null,
        background: null,
        backstory: null,
      };

      const result = flatToNested(flatCharacter);

      expect(result.attributes.strength).toBe(10);
      expect(result.attributes.dexterity).toBe(10);
      expect(result.skills).toEqual({});
      expect(result.proficiencies).toEqual({
        skills: [],
        weapons: [],
        armor: [],
      });
      expect(result.currency.gold).toBe(0);
      expect(result.basics.background).toBeUndefined();
      expect(result.backstory.description).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', () => {
      const flatCharacter = {
        id: 'test-id-4',
        name: 'Invalid JSON Test',
        system: 'd&d5e',
        class: 'Cleric',
        race: 'Dwarf',
        level: 2,
        skills_json: '{invalid json}',
        proficiencies_json: 'not even close to json',
        equipment_json: '{"unclosed": ',
        traits_json: '}{backwards',
      };

      // Should not throw, should use defaults
      expect(() => flatToNested(flatCharacter)).not.toThrow();

      const result = flatToNested(flatCharacter);
      expect(result.skills).toEqual({});
      expect(result.proficiencies).toEqual({
        skills: [],
        weapons: [],
        armor: [],
      });
      expect(result.equipment).toEqual({
        weapons: [],
        armor: [],
        backpack: [],
      });
      expect(result.traits).toMatchObject({
        features: [],
      });
    });
  });

  describe('nestedToFlat', () => {
    it('should transform nested structure back to flat', () => {
      const nested: CharacterData = {
        attributes: {
          strength: 16,
          dexterity: 12,
          constitution: 14,
          intelligence: 13,
          wisdom: 15,
          charisma: 10,
        },
        basics: {
          race: 'Elf',
          class: 'Ranger',
          level: 4,
          experience: 6500,
          alignment: 'Neutral Good',
          background: 'Outlander',
        },
        hitPoints: {
          current: 30,
          maximum: 32,
          temporary: 0,
        },
        skills: {
          Survival: { proficient: true, modifier: 5 },
        },
        proficiencies: {
          skills: ['Survival', 'Perception'],
          weapons: ['Longbow'],
          armor: ['Light'],
        },
        equipment: {
          weapons: [{ id: '1', name: 'Longbow', quantity: 1, equipped: true }],
          armor: [],
          backpack: [],
        },
        spells: {
          prepared: [],
        },
        traits: {
          features: ['Favored Enemy'],
          flaws: 'Distrusts cities',
          bonds: 'Protect nature',
          ideals: 'Freedom',
        },
        backstory: {
          description: 'Raised in the wild',
          notes: 'Has a wolf companion',
        },
        currency: {
          platinum: 0,
          gold: 150,
          electrum: 0,
          silver: 50,
          copper: 0,
        },
      };

      const result = nestedToFlat(nested);

      expect(result).toMatchObject({
        class: 'Ranger',
        race: 'Elf',
        level: 4,
        alignment: 'Neutral Good',
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 13,
        wisdom: 15,
        charisma: 10,
        max_hit_points: 32,
        current_hit_points: 30,
        temporary_hit_points: 0,
        gold: 150,
        background: 'Outlander',
        backstory: 'Raised in the wild',
      });

      expect(result.skills_json).toBeDefined();
      expect(JSON.parse(result.skills_json)).toEqual({
        Survival: { proficient: true, modifier: 5 },
      });

      expect(result.proficiencies_json).toBeDefined();
      expect(JSON.parse(result.proficiencies_json)).toMatchObject({
        skills: ['Survival', 'Perception'],
        weapons: ['Longbow'],
        armor: ['Light'],
      });
    });

    it('should handle minimal nested data', () => {
      const nested: CharacterData = {
        attributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        basics: {
          race: 'Human',
          class: 'Fighter',
          level: 1,
          experience: 0,
        },
        hitPoints: {
          current: 10,
          maximum: 10,
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
      };

      const result = nestedToFlat(nested);

      expect(result.class).toBe('Fighter');
      expect(result.race).toBe('Human');
      expect(result.level).toBe(1);
      expect(result.gold).toBe(0);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through flat->nested->flat conversion', () => {
      const original = {
        id: 'test-id-5',
        name: 'Round Trip Test',
        system: 'd&d5e',
        class: 'Paladin',
        race: 'Dragonborn',
        level: 6,
        alignment: 'Lawful Good',
        strength: 18,
        dexterity: 10,
        constitution: 16,
        intelligence: 8,
        wisdom: 12,
        charisma: 14,
        max_hit_points: 52,
        current_hit_points: 52,
        temporary_hit_points: 0,
        skills_json: '{"Persuasion":{"proficient":true,"modifier":4}}',
        proficiencies_json: '{"skills":["Persuasion"],"weapons":["Martial"],"armor":["Heavy"]}',
        equipment_json: '{"weapons":[],"armor":[],"backpack":[]}',
        traits_json: '{"features":["Divine Smite"]}',
        gold: 500,
        background: 'Noble',
        backstory: 'Sworn to uphold justice',
      };

      const nested = flatToNested(original);
      const backToFlat = nestedToFlat(nested);

      expect(backToFlat.class).toBe(original.class);
      expect(backToFlat.race).toBe(original.race);
      expect(backToFlat.level).toBe(original.level);
      expect(backToFlat.alignment).toBe(original.alignment);
      expect(backToFlat.strength).toBe(original.strength);
      expect(backToFlat.gold).toBe(original.gold);
      expect(backToFlat.background).toBe(original.background);
      expect(backToFlat.backstory).toBe(original.backstory);

      // JSON fields should match when parsed
      expect(JSON.parse(backToFlat.skills_json)).toEqual(
        JSON.parse(original.skills_json)
      );
    });
  });

  describe('validateCharacterData', () => {
    it('should validate correct character data', () => {
      const validData: CharacterData = {
        attributes: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        basics: {
          race: 'Human',
          class: 'Fighter',
          level: 1,
          experience: 0,
        },
        hitPoints: {
          current: 12,
          maximum: 12,
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
      };

      expect(() => validateCharacterData(validData)).not.toThrow();
    });

    it('should throw on invalid attribute values', () => {
      const invalidData = {
        attributes: {
          strength: 40, // Too high
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        basics: {
          race: 'Human',
          class: 'Fighter',
          level: 1,
          experience: 0,
        },
        hitPoints: {
          current: 12,
          maximum: 12,
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

      expect(() => validateCharacterData(invalidData)).toThrow();
    });

    it('should throw on missing required fields', () => {
      const invalidData = {
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
        // Missing hitPoints
      } as any;

      expect(() => validateCharacterData(invalidData)).toThrow();
    });
  });
});
