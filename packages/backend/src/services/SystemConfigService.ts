import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source.js';
import { SystemConfig, SystemConfigData } from '../models/SystemConfig.js';

export interface SystemSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  isDefault: boolean;
}

export interface CalculationContext {
  level: number;
  attributes: Record<string, number>;
  classId: string;
}

class SystemConfigService {
  private repository: Repository<SystemConfig>;
  private cache: Map<string, SystemConfig> = new Map();

  constructor(repository?: Repository<SystemConfig>) {
    this.repository = repository || AppDataSource.getRepository(SystemConfig);
  }

  /**
   * Get all active system configurations (summary only)
   */
  async getAllSystems(): Promise<SystemSummary[]> {
    const systems = await this.repository.find({
      where: { is_active: true },
      order: { is_default: 'DESC', name: 'ASC' },
    });

    return systems.map((s) => ({
      id: s.id,
      name: s.name,
      version: s.version,
      description: s.description,
      isDefault: s.is_default,
    }));
  }

  /**
   * Get a system configuration by ID
   */
  async getSystemById(id: string): Promise<SystemConfig | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const system = await this.repository.findOne({
      where: { id, is_active: true },
    });

    if (system) {
      this.cache.set(id, system);
    }

    return system;
  }

  /**
   * Get the default system configuration
   */
  async getDefaultSystem(): Promise<SystemConfig | null> {
    const system = await this.repository.findOne({
      where: { is_default: true, is_active: true },
    });

    if (system) {
      this.cache.set(system.id, system);
    }

    return system;
  }

  /**
   * Get full system config data by ID
   */
  async getSystemConfigData(id: string): Promise<SystemConfigData | null> {
    const system = await this.getSystemById(id);
    if (!system) return null;
    return system.getConfigData();
  }

  /**
   * Create a new system configuration
   */
  async createSystem(
    id: string,
    name: string,
    version: string,
    configData: SystemConfigData,
    description?: string
  ): Promise<SystemConfig> {
    const system = new SystemConfig();
    system.id = id;
    system.name = name;
    system.version = version;
    system.description = description;
    system.setConfigData(configData);
    system.is_active = true;
    system.is_default = false;

    const saved = await this.repository.save(system);
    this.cache.set(id, saved);
    return saved;
  }

  /**
   * Update a system configuration
   */
  async updateSystem(
    id: string,
    updates: Partial<{
      name: string;
      version: string;
      description: string;
      configData: SystemConfigData;
      isActive: boolean;
    }>
  ): Promise<SystemConfig | null> {
    const system = await this.repository.findOne({ where: { id } });
    if (!system) return null;

    if (updates.name) system.name = updates.name;
    if (updates.version) system.version = updates.version;
    if (updates.description !== undefined) system.description = updates.description;
    if (updates.configData) system.setConfigData(updates.configData);
    if (updates.isActive !== undefined) system.is_active = updates.isActive;

    const saved = await this.repository.save(system);
    this.cache.set(id, saved);
    return saved;
  }

  /**
   * Set a system as the default
   */
  async setDefaultSystem(id: string): Promise<boolean> {
    const system = await this.repository.findOne({ where: { id, is_active: true } });
    if (!system) return false;

    // Clear existing default
    await this.repository.update({ is_default: true }, { is_default: false });

    // Set new default
    system.is_default = true;
    await this.repository.save(system);
    this.cache.set(id, system);

    return true;
  }

  /**
   * Calculate ability modifier using system formula
   */
  calculateAbilityModifier(_systemId: string, score: number): number {
    // For now, use the standard D&D formula as default
    // In future, this would parse the formula from system config
    return Math.floor((score - 10) / 2);
  }

  /**
   * Calculate proficiency bonus using system formula
   */
  calculateProficiencyBonus(_systemId: string, level: number): number {
    // Standard D&D 5e formula
    return Math.ceil(level / 4) + 1;
  }

  /**
   * Get classes for a system
   */
  async getClasses(systemId: string): Promise<{ id: string; name: string }[]> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return [];
    return config.classes.map((c) => ({ id: c.id, name: c.name }));
  }

  /**
   * Get races for a system
   */
  async getRaces(systemId: string): Promise<{ id: string; name: string }[]> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return [];
    return config.races.map((r) => ({ id: r.id, name: r.name }));
  }

  /**
   * Get alignments for a system
   */
  async getAlignments(systemId: string): Promise<{ id: string; name: string }[]> {
    const config = await this.getSystemConfigData(systemId);
    if (!config || !config.alignments) return [];
    return config.alignments.map((a) => ({ id: a.id, name: a.name }));
  }

  /**
   * Get attributes for a system (simple version for dropdowns)
   */
  async getAttributes(systemId: string): Promise<{ id: string; name: string; abbreviation: string }[]> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return [];
    return config.attributes.map((a) => ({
      id: a.id,
      name: a.name,
      abbreviation: a.abbreviation,
    }));
  }

  /**
   * Get full attribute definitions (including min/max/type for validation)
   */
  async getAttributeDefinitions(systemId: string) {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return [];
    return config.attributes;
  }

  /**
   * Get skills for a system
   */
  async getSkills(systemId: string): Promise<{ id: string; name: string; ability: string }[]> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return [];
    return config.skills.map((s) => ({
      id: s.id,
      name: s.name,
      ability: s.ability,
    }));
  }

  /**
   * Validate that a class exists in a system
   */
  async isValidClass(systemId: string, classId: string): Promise<boolean> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return false;
    return config.classes.some((c) => c.id === classId || c.name.toLowerCase() === classId.toLowerCase());
  }

  /**
   * Validate that a race exists in a system
   */
  async isValidRace(systemId: string, raceId: string): Promise<boolean> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return false;
    return config.races.some((r) => r.id === raceId || r.name.toLowerCase() === raceId.toLowerCase());
  }

  /**
   * Validate that an alignment exists in a system
   */
  async isValidAlignment(systemId: string, alignmentId: string): Promise<boolean> {
    const config = await this.getSystemConfigData(systemId);
    if (!config || !config.alignments) return true; // If no alignments defined, accept anything
    return config.alignments.some((a) => a.id === alignmentId || a.name.toLowerCase() === alignmentId.toLowerCase());
  }

  /**
   * Get hit dice for a class
   */
  async getClassHitDice(systemId: string, classId: string): Promise<string | null> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return null;
    const classConfig = config.classes.find(
      (c) => c.id === classId || c.name.toLowerCase() === classId.toLowerCase()
    );
    return classConfig?.hitDice || null;
  }

  /**
   * Get race ability bonuses
   */
  async getRaceAbilityBonuses(
    systemId: string,
    raceId: string
  ): Promise<Array<{ attribute: string; bonus: number }>> {
    const config = await this.getSystemConfigData(systemId);
    if (!config) return [];
    const raceConfig = config.races.find(
      (r) => r.id === raceId || r.name.toLowerCase() === raceId.toLowerCase()
    );
    return raceConfig?.abilityBonuses || [];
  }

  /**
   * Delete a system configuration
   */
  async deleteSystem(id: string): Promise<boolean> {
    const system = await this.repository.findOne({ where: { id } });
    if (!system) return false;

    // Don't allow deletion of default systems
    if (system.is_default) return false;

    await this.repository.remove(system);
    this.cache.delete(id);
    return true;
  }

  /**
   * Clear the cache (useful for testing or after updates)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const systemConfigService = new SystemConfigService();

// Export class for testing
export { SystemConfigService };
