import Joi from 'joi';

export const createPartySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).allow('').optional(),
  campaign_name: Joi.string().max(100).allow('').optional(),
  is_public: Joi.boolean().optional(),
  notes: Joi.string().max(10000).allow('').optional(),
  shared_gold: Joi.number().integer().min(0).optional(),
  shared_inventory: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      description: Joi.string().allow('').optional(),
    })
  ).optional(),
});

export const updatePartySchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).allow('').optional(),
  campaign_name: Joi.string().max(100).allow('').optional(),
  is_public: Joi.boolean().optional(),
  notes: Joi.string().max(10000).allow('').optional(),
  shared_gold: Joi.number().integer().min(0).optional(),
  shared_inventory: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      description: Joi.string().allow('').optional(),
    })
  ).optional(),
}).min(1);

export const partyIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const addMemberSchema = Joi.object({
  characterId: Joi.string().uuid().required(),
});
