import Joi from 'joi';

// Schema for CharacterData nested structure
const characterDataSchema = Joi.object({
  // Allow any attribute keys (system-dependent like str, dex or strength, dexterity)
  attributes: Joi.object()
    .pattern(Joi.string(), Joi.number().integer().min(1).max(30))
    .optional(),
  basics: Joi.object({
    race: Joi.string().max(100).optional(),
    class: Joi.string().max(100).optional(),
    level: Joi.number().integer().min(1).max(30).optional(),
    experience: Joi.number().integer().min(0).optional(),
    alignment: Joi.string().max(50).optional(),
    background: Joi.string().max(255).allow('').optional(),
  }).optional(),
  hitPoints: Joi.object({
    current: Joi.number().integer().min(0).optional(),
    maximum: Joi.number().integer().min(1).optional(),
    temporary: Joi.number().integer().min(0).optional(),
  }).optional(),
  skills: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        proficient: Joi.boolean().required(),
        modifier: Joi.number().integer().required(),
      })
    )
    .optional(),
  proficiencies: Joi.object({
    skills: Joi.array().items(Joi.string()).optional(),
    weapons: Joi.array().items(Joi.string()).optional(),
    armor: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  equipment: Joi.object({
    weapons: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
          equipped: Joi.boolean().optional(),
        })
      )
      .optional(),
    armor: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          equipped: Joi.boolean().optional(),
        })
      )
      .optional(),
    backpack: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .optional(),
  }).optional(),
  spells: Joi.object({
    prepared: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          castingTime: Joi.string().required(),
          level: Joi.number().integer().min(0).required(),
        })
      )
      .optional(),
  }).optional(),
  traits: Joi.object({
    features: Joi.array().items(Joi.string()).optional(),
    flaws: Joi.string().max(1000).allow('').optional(),
    bonds: Joi.string().max(1000).allow('').optional(),
    ideals: Joi.string().max(1000).allow('').optional(),
  }).optional(),
  backstory: Joi.object({
    description: Joi.string().max(10000).allow('').optional(),
    notes: Joi.string().max(10000).allow('').optional(),
  }).optional(),
  currency: Joi.object({
    platinum: Joi.number().integer().min(0).optional(),
    gold: Joi.number().integer().min(0).optional(),
    electrum: Joi.number().integer().min(0).optional(),
    silver: Joi.number().integer().min(0).optional(),
    copper: Joi.number().integer().min(0).optional(),
  }).optional(),
}).optional();

export const createCharacterSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  system_id: Joi.string().min(1).max(50).required(),
  character_data: characterDataSchema,
  image_url: Joi.string().uri().max(2000).allow('').optional(),
  is_public: Joi.boolean().optional(),
});

export const updateCharacterSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  character_data: characterDataSchema,
  image_url: Joi.string().uri().max(2000).allow('').optional(),
  is_public: Joi.boolean().optional(),
}).min(1); // At least one field must be provided

export const characterIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const listCharactersQuerySchema = Joi.object({
  system_id: Joi.string().max(50).optional(),
  class: Joi.string().max(100).optional(),
  race: Joi.string().max(100).optional(),
  minLevel: Joi.number().integer().min(1).max(30).optional(),
  maxLevel: Joi.number().integer().min(1).max(30).optional(),
  search: Joi.string().max(255).optional(),
  sortBy: Joi.string().valid('name', 'level', 'created_at', 'updated_at').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

// Schema for importing a character from JSON export format
// Strips id, createdAt, updatedAt, abilityModifiers, viewCount as these are auto-generated
export const importCharacterSchema = Joi.object({
  id: Joi.any().strip(),
  createdAt: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  abilityModifiers: Joi.any().strip(),
  viewCount: Joi.any().strip(),
  name: Joi.string().min(1).max(255).required(),
  system: Joi.string().max(50).optional(),
  class: Joi.string().max(100).optional(),
  race: Joi.string().max(100).optional(),
  level: Joi.number().integer().min(1).max(30).optional(),
  alignment: Joi.string().max(50).optional(),
  background: Joi.string().max(255).allow('').optional(),
  abilityScores: Joi.object({
    strength: Joi.number().integer().min(1).max(30).optional(),
    dexterity: Joi.number().integer().min(1).max(30).optional(),
    constitution: Joi.number().integer().min(1).max(30).optional(),
    intelligence: Joi.number().integer().min(1).max(30).optional(),
    wisdom: Joi.number().integer().min(1).max(30).optional(),
    charisma: Joi.number().integer().min(1).max(30).optional(),
  }).optional(),
  health: Joi.object({
    maxHitPoints: Joi.number().integer().min(1).optional(),
    currentHitPoints: Joi.number().integer().min(0).optional(),
    temporaryHitPoints: Joi.number().integer().min(0).optional(),
  }).optional(),
  backstory: Joi.string().max(10000).allow('', null).optional(),
  gold: Joi.number().integer().min(0).optional(),
  isPublic: Joi.boolean().optional(),
  imageUrl: Joi.string().uri().max(2000).allow('', null).optional(),
});
