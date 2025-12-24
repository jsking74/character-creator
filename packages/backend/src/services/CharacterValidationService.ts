import { CharacterData } from '@character-creator/shared';
import { SystemConfigService } from './SystemConfigService.js';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class CharacterValidationService {
  constructor(private systemConfigService: SystemConfigService) {}

  /**
   * Validate complete character data against system configuration
   */
  async validateCharacter(
    systemId: string,
    characterData: Partial<CharacterData>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Get system configuration
    const system = await this.systemConfigService.getSystemById(systemId);
    if (!system) {
      errors.push({
        field: 'system_id',
        message: `System '${systemId}' not found`,
        code: 'SYSTEM_NOT_FOUND',
      });
      return { valid: false, errors };
    }

    // Validate attributes
    if (characterData.attributes) {
      const attributeErrors = await this.validateAttributes(
        systemId,
        characterData.attributes
      );
      errors.push(...attributeErrors);
    }

    // Validate basics (class, race, level)
    if (characterData.basics) {
      const basicsErrors = await this.validateBasics(systemId, characterData.basics);
      errors.push(...basicsErrors);
    }

    // Validate hit points
    if (characterData.hitPoints && characterData.basics) {
      const hpErrors = this.validateHitPoints(
        characterData.hitPoints,
        characterData.basics.level || 1
      );
      errors.push(...hpErrors);
    }

    // Validate skills
    if (characterData.skills) {
      const skillErrors = await this.validateSkills(systemId, characterData.skills);
      errors.push(...skillErrors);
    }

    // Validate proficiencies
    if (characterData.proficiencies && characterData.basics) {
      const profErrors = await this.validateProficiencies(
        systemId,
        characterData.proficiencies,
        characterData.basics.class
      );
      errors.push(...profErrors);
    }

    // Validate currency (non-negative)
    if (characterData.currency) {
      const currencyErrors = this.validateCurrency(characterData.currency);
      errors.push(...currencyErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate attribute scores against system configuration
   */
  async validateAttributes(
    systemId: string,
    attributes: Partial<Record<string, number>>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const systemAttributes = await this.systemConfigService.getAttributeDefinitions(systemId);

    for (const attr of systemAttributes) {
      const value = attributes[attr.id];

      if (value === undefined) {
        continue; // Allow partial data
      }

      // Check type
      if (attr.type === 'numeric' && typeof value !== 'number') {
        errors.push({
          field: `attributes.${attr.id}`,
          message: `${attr.name} must be a number`,
          code: 'INVALID_TYPE',
        });
        continue;
      }

      // Check min/max range
      if (attr.type === 'numeric') {
        if (attr.min !== undefined && value < attr.min) {
          errors.push({
            field: `attributes.${attr.id}`,
            message: `${attr.name} must be at least ${attr.min} (got ${value})`,
            code: 'VALUE_TOO_LOW',
          });
        }

        if (attr.max !== undefined && value > attr.max) {
          errors.push({
            field: `attributes.${attr.id}`,
            message: `${attr.name} must be at most ${attr.max} (got ${value})`,
            code: 'VALUE_TOO_HIGH',
          });
        }
      }
    }

    // Check for unknown attributes
    const validAttributeIds = new Set(systemAttributes.map((a) => a.id));
    for (const attrId in attributes) {
      if (!validAttributeIds.has(attrId)) {
        errors.push({
          field: `attributes.${attrId}`,
          message: `Unknown attribute '${attrId}' for system '${systemId}'`,
          code: 'UNKNOWN_ATTRIBUTE',
        });
      }
    }

    return errors;
  }

  /**
   * Validate character basics (class, race, level)
   */
  async validateBasics(
    systemId: string,
    basics: Partial<CharacterData['basics']>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validate class
    if (basics.class) {
      const validClass = await this.systemConfigService.isValidClass(
        systemId,
        basics.class
      );
      if (!validClass) {
        errors.push({
          field: 'basics.class',
          message: `Class '${basics.class}' is not valid for system '${systemId}'`,
          code: 'INVALID_CLASS',
        });
      }
    }

    // Validate race
    if (basics.race) {
      const validRace = await this.systemConfigService.isValidRace(systemId, basics.race);
      if (!validRace) {
        errors.push({
          field: 'basics.race',
          message: `Race '${basics.race}' is not valid for system '${systemId}'`,
          code: 'INVALID_RACE',
        });
      }
    }

    // Validate alignment (if provided)
    if (basics.alignment) {
      const validAlignment = await this.systemConfigService.isValidAlignment(
        systemId,
        basics.alignment
      );
      if (!validAlignment) {
        errors.push({
          field: 'basics.alignment',
          message: `Alignment '${basics.alignment}' is not valid for system '${systemId}'`,
          code: 'INVALID_ALIGNMENT',
        });
      }
    }

    // Validate level
    if (basics.level !== undefined) {
      if (!Number.isInteger(basics.level)) {
        errors.push({
          field: 'basics.level',
          message: 'Level must be an integer',
          code: 'INVALID_TYPE',
        });
      } else if (basics.level < 1) {
        errors.push({
          field: 'basics.level',
          message: 'Level must be at least 1',
          code: 'VALUE_TOO_LOW',
        });
      } else if (basics.level > 30) {
        // Max level 30 for most systems
        errors.push({
          field: 'basics.level',
          message: 'Level must be at most 30',
          code: 'VALUE_TOO_HIGH',
        });
      }
    }

    // Validate experience
    if (basics.experience !== undefined) {
      if (!Number.isInteger(basics.experience)) {
        errors.push({
          field: 'basics.experience',
          message: 'Experience must be an integer',
          code: 'INVALID_TYPE',
        });
      } else if (basics.experience < 0) {
        errors.push({
          field: 'basics.experience',
          message: 'Experience cannot be negative',
          code: 'VALUE_TOO_LOW',
        });
      }
    }

    return errors;
  }

  /**
   * Validate hit points
   */
  validateHitPoints(
    hitPoints: Partial<CharacterData['hitPoints']>,
    characterLevel: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate current HP
    if (hitPoints.current !== undefined) {
      if (!Number.isInteger(hitPoints.current)) {
        errors.push({
          field: 'hitPoints.current',
          message: 'Current hit points must be an integer',
          code: 'INVALID_TYPE',
        });
      } else if (hitPoints.current < 0) {
        errors.push({
          field: 'hitPoints.current',
          message: 'Current hit points cannot be negative',
          code: 'VALUE_TOO_LOW',
        });
      }
    }

    // Validate maximum HP
    if (hitPoints.maximum !== undefined) {
      if (!Number.isInteger(hitPoints.maximum)) {
        errors.push({
          field: 'hitPoints.maximum',
          message: 'Maximum hit points must be an integer',
          code: 'INVALID_TYPE',
        });
      } else if (hitPoints.maximum < 1) {
        errors.push({
          field: 'hitPoints.maximum',
          message: 'Maximum hit points must be at least 1',
          code: 'VALUE_TOO_LOW',
        });
      } else if (hitPoints.maximum > characterLevel * 20 + 200) {
        // Reasonable upper bound: d12 hit dice * level + 20 CON bonus per level
        errors.push({
          field: 'hitPoints.maximum',
          message: `Maximum hit points seems unreasonably high for level ${characterLevel}`,
          code: 'VALUE_TOO_HIGH',
        });
      }
    }

    // Validate temporary HP
    if (hitPoints.temporary !== undefined) {
      if (!Number.isInteger(hitPoints.temporary)) {
        errors.push({
          field: 'hitPoints.temporary',
          message: 'Temporary hit points must be an integer',
          code: 'INVALID_TYPE',
        });
      } else if (hitPoints.temporary < 0) {
        errors.push({
          field: 'hitPoints.temporary',
          message: 'Temporary hit points cannot be negative',
          code: 'VALUE_TOO_LOW',
        });
      }
    }

    // Validate current <= maximum (if both provided)
    if (
      hitPoints.current !== undefined &&
      hitPoints.maximum !== undefined &&
      hitPoints.current > hitPoints.maximum
    ) {
      errors.push({
        field: 'hitPoints.current',
        message: `Current hit points (${hitPoints.current}) cannot exceed maximum (${hitPoints.maximum})`,
        code: 'CURRENT_EXCEEDS_MAXIMUM',
      });
    }

    return errors;
  }

  /**
   * Validate skills against system configuration
   */
  async validateSkills(
    systemId: string,
    skills: Record<string, any>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const systemSkills = await this.systemConfigService.getSkills(systemId);
    const validSkillIds = new Set(systemSkills.map((s) => s.id));

    for (const skillId in skills) {
      if (!validSkillIds.has(skillId)) {
        errors.push({
          field: `skills.${skillId}`,
          message: `Unknown skill '${skillId}' for system '${systemId}'`,
          code: 'UNKNOWN_SKILL',
        });
      }

      const skillValue = skills[skillId];
      if (typeof skillValue === 'object' && skillValue !== null) {
        if (typeof skillValue.proficient !== 'boolean') {
          errors.push({
            field: `skills.${skillId}.proficient`,
            message: 'Proficient must be a boolean',
            code: 'INVALID_TYPE',
          });
        }

        if (typeof skillValue.modifier !== 'number') {
          errors.push({
            field: `skills.${skillId}.modifier`,
            message: 'Modifier must be a number',
            code: 'INVALID_TYPE',
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate proficiencies
   */
  async validateProficiencies(
    systemId: string,
    proficiencies: Partial<CharacterData['proficiencies']>,
    _characterClass?: string
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const systemSkills = await this.systemConfigService.getSkills(systemId);
    const validSkillIds = new Set(systemSkills.map((s) => s.id));

    // Validate skill proficiencies
    if (proficiencies.skills) {
      if (!Array.isArray(proficiencies.skills)) {
        errors.push({
          field: 'proficiencies.skills',
          message: 'Skills must be an array',
          code: 'INVALID_TYPE',
        });
      } else {
        for (const skillId of proficiencies.skills) {
          if (!validSkillIds.has(skillId)) {
            errors.push({
              field: 'proficiencies.skills',
              message: `Unknown skill '${skillId}' for system '${systemId}'`,
              code: 'UNKNOWN_SKILL',
            });
          }
        }

        // Check for duplicates
        const uniqueSkills = new Set(proficiencies.skills);
        if (uniqueSkills.size < proficiencies.skills.length) {
          errors.push({
            field: 'proficiencies.skills',
            message: 'Duplicate skill proficiencies found',
            code: 'DUPLICATE_PROFICIENCY',
          });
        }
      }
    }

    // Validate weapon proficiencies (array of strings)
    if (proficiencies.weapons && !Array.isArray(proficiencies.weapons)) {
      errors.push({
        field: 'proficiencies.weapons',
        message: 'Weapons must be an array',
        code: 'INVALID_TYPE',
      });
    }

    // Validate armor proficiencies (array of strings)
    if (proficiencies.armor && !Array.isArray(proficiencies.armor)) {
      errors.push({
        field: 'proficiencies.armor',
        message: 'Armor must be an array',
        code: 'INVALID_TYPE',
      });
    }

    return errors;
  }

  /**
   * Validate currency values
   */
  validateCurrency(currency: Partial<CharacterData['currency']>): ValidationError[] {
    const errors: ValidationError[] = [];
    const currencyTypes = ['platinum', 'gold', 'electrum', 'silver', 'copper'] as const;

    for (const type of currencyTypes) {
      const value = currency[type];
      if (value !== undefined) {
        if (!Number.isInteger(value)) {
          errors.push({
            field: `currency.${type}`,
            message: `${type} must be an integer`,
            code: 'INVALID_TYPE',
          });
        } else if (value < 0) {
          errors.push({
            field: `currency.${type}`,
            message: `${type} cannot be negative`,
            code: 'VALUE_TOO_LOW',
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate equipment items
   */
  validateEquipment(
    equipment: Partial<CharacterData['equipment']>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const validateItems = (items: any[], itemType: string) => {
      if (!Array.isArray(items)) {
        errors.push({
          field: `equipment.${itemType}`,
          message: `${itemType} must be an array`,
          code: 'INVALID_TYPE',
        });
        return;
      }

      items.forEach((item, index) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push({
            field: `equipment.${itemType}[${index}].id`,
            message: 'Item must have a valid id',
            code: 'MISSING_FIELD',
          });
        }

        if (!item.name || typeof item.name !== 'string') {
          errors.push({
            field: `equipment.${itemType}[${index}].name`,
            message: 'Item must have a valid name',
            code: 'MISSING_FIELD',
          });
        }

        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          errors.push({
            field: `equipment.${itemType}[${index}].quantity`,
            message: 'Quantity must be a positive integer',
            code: 'INVALID_VALUE',
          });
        }
      });
    };

    if (equipment.weapons) {
      validateItems(equipment.weapons, 'weapons');
    }

    if (equipment.armor) {
      validateItems(equipment.armor, 'armor');
    }

    if (equipment.backpack) {
      validateItems(equipment.backpack, 'backpack');
    }

    return errors;
  }
}
