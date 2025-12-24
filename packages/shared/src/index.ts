// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Character types
export interface Character {
  id: string;
  userId: string;
  systemId: string;
  name: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  isShared: boolean;
  sharedWith?: string[];
  shareToken?: string;
  data: CharacterData;
}

export interface CharacterData {
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  basics: {
    race: string;
    class: string;
    level: number;
    experience: number;
    alignment?: string;
    background?: string;
  };
  hitPoints: {
    current: number;
    maximum: number;
    temporary: number;
  };
  skills: Record<string, SkillValue>;
  proficiencies: Proficiencies;
  equipment: Equipment;
  spells: Spells;
  traits: Traits;
  backstory: {
    description?: string;
    notes?: string;
  };
  currency: Currency;
}

export interface SkillValue {
  proficient: boolean;
  modifier: number;
}

export interface Proficiencies {
  skills: string[];
  weapons: string[];
  armor: string[];
}

export interface Equipment {
  weapons: EquipmentItem[];
  armor: EquipmentItem[];
  backpack: EquipmentItem[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  equipped?: boolean;
}

export interface Spells {
  prepared: SpellItem[];
}

export interface SpellItem {
  id: string;
  name: string;
  castingTime: string;
  level: number;
}

export interface Traits {
  features: string[];
  flaws?: string;
  bonds?: string;
  ideals?: string;
}

export interface Currency {
  platinum: number;
  gold: number;
  electrum: number;
  silver: number;
  copper: number;
}

// Party types
export interface Party {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  members: PartyMember[];
  settings?: PartySettings;
}

export interface PartyMember {
  characterId: string;
  role?: string;
  joinedAt: Date;
}

export interface PartySettings {
  campaignName?: string;
  gm?: string;
}

// Sync types
export interface SyncQueueItem {
  id: string;
  characterId: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Character>;
  timestamp: Date;
}

export interface CharacterConflict {
  characterId: string;
  local: Character;
  cloud: Character;
  resolvedAt?: Date;
}

// System Config types
export interface SystemConfig {
  system: SystemMetadata;
  attributes: AttributeConfig;
  classes: ClassConfig[];
  races: RaceConfig[];
  skills: SkillConfig[];
  equipment: EquipmentConfig;
  spells: SpellConfig[];
}

export interface SystemMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  compatibility: string;
}

export interface AttributeConfig {
  core: AttributeDefinition[];
}

export interface AttributeDefinition {
  id: string;
  name: string;
  description?: string;
  abbreviation: string;
  type: 'numeric' | 'string' | 'boolean';
  min?: number;
  max?: number;
  default: number | string | boolean;
}

export interface ClassConfig {
  id: string;
  name: string;
  description?: string;
  hitDice: string;
  primaryAbility: string;
  savingThrows?: string[];
}

export interface RaceConfig {
  id: string;
  name: string;
  abilityBonuses?: AbilityBonus[];
  size: string;
  speed: number;
  languages?: string[];
  traits?: Trait[];
}

export interface AbilityBonus {
  attribute: string;
  bonus: number;
}

export interface Trait {
  id: string;
  name: string;
  description?: string;
}

export interface SkillConfig {
  id: string;
  name: string;
  ability: string;
}

export interface EquipmentConfig {
  weapons?: WeaponDefinition[];
  armor?: ArmorDefinition[];
  adventuringGear?: GearDefinition[];
}

export interface WeaponDefinition {
  id: string;
  name: string;
  damage: string;
  damageType: string;
  weight: number;
  cost: string;
  properties?: string[];
}

export interface ArmorDefinition {
  id: string;
  name: string;
  armorClass: number;
  weight: number;
  cost: string;
  armorType: string;
}

export interface GearDefinition {
  id: string;
  name: string;
  weight: number;
  cost: string;
}

export interface SpellConfig {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description?: string;
}
