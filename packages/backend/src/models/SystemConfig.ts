import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Attribute definition for a game system
export interface AttributeDefinition {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  type: 'numeric' | 'string' | 'boolean';
  min?: number;
  max?: number;
  default: number | string | boolean;
}

// Class definition for a game system
export interface ClassDefinition {
  id: string;
  name: string;
  description?: string;
  hitDice: string;
  primaryAbility: string;
  savingThrows?: string[];
}

// Race definition for a game system
export interface RaceDefinition {
  id: string;
  name: string;
  description?: string;
  abilityBonuses?: Array<{ attribute: string; bonus: number }>;
  size: string;
  speed: number;
  languages?: string[];
  traits?: Array<{ id: string; name: string; description?: string }>;
}

// Skill definition for a game system
export interface SkillDefinition {
  id: string;
  name: string;
  ability: string;
  description?: string;
}

// Alignment definition for a game system
export interface AlignmentDefinition {
  id: string;
  name: string;
  description?: string;
}

// Currency definition for a game system
export interface CurrencyDefinition {
  id: string;
  name: string;
  abbreviation: string;
  conversionToBase: number; // How many base units this is worth
}

// Calculation formulas for a game system
export interface SystemFormulas {
  abilityModifier: string; // Formula like "floor((score - 10) / 2)"
  proficiencyBonus?: string; // Formula like "ceil(level / 4) + 1"
  armorClass?: string; // Base AC formula
  initiative?: string; // Initiative formula
  hitPoints?: string; // HP per level formula
}

// Full system configuration data
export interface SystemConfigData {
  metadata: {
    name: string;
    version: string;
    description: string;
    author?: string;
    compatibility?: string;
  };
  attributes: AttributeDefinition[];
  classes: ClassDefinition[];
  races: RaceDefinition[];
  skills: SkillDefinition[];
  alignments?: AlignmentDefinition[];
  currencies?: CurrencyDefinition[];
  formulas: SystemFormulas;
  characterDefaults?: Record<string, unknown>;
}

@Entity('system_configs')
@Index(['is_active'])
export class SystemConfig {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  version!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  config_data!: string; // JSON string of SystemConfigData

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  constructor() {
    this.is_active = true;
    this.is_default = false;
  }

  // Helper to get parsed config data
  getConfigData(): SystemConfigData {
    return JSON.parse(this.config_data);
  }

  // Helper to set config data
  setConfigData(data: SystemConfigData): void {
    this.config_data = JSON.stringify(data);
  }
}
