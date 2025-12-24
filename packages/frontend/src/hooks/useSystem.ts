import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchSystems,
  fetchSystemById,
  setSelectedSystem,
  SystemSummary,
  FullSystemConfig,
  ClassDefinition,
  RaceDefinition,
  AlignmentDefinition,
  AttributeDefinition,
  SkillDefinition,
} from '../store/systemSlice';

export interface UseSystemReturn {
  // State
  systems: SystemSummary[];
  selectedSystem: FullSystemConfig | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadSystems: () => Promise<void>;
  loadSystem: (systemId: string) => Promise<void>;
  selectSystem: (system: FullSystemConfig | null) => void;

  // Helpers
  getClasses: () => ClassDefinition[];
  getRaces: () => RaceDefinition[];
  getAlignments: () => AlignmentDefinition[];
  getAttributes: () => AttributeDefinition[];
  getSkills: () => SkillDefinition[];
  getDefaultSystem: () => SystemSummary | undefined;

  // Calculations
  calculateAbilityModifier: (score: number) => number;
  calculateProficiencyBonus: (level: number) => number;
}

export function useSystem(): UseSystemReturn {
  const dispatch = useAppDispatch();
  const { systems, selectedSystem, loading, error } = useAppSelector(
    (state) => state.system
  );

  // Load all available systems
  const loadSystems = useCallback(async () => {
    await dispatch(fetchSystems());
  }, [dispatch]);

  // Load a specific system by ID
  const loadSystem = useCallback(
    async (systemId: string) => {
      await dispatch(fetchSystemById(systemId));
    },
    [dispatch]
  );

  // Set the selected system
  const selectSystem = useCallback(
    (system: FullSystemConfig | null) => {
      dispatch(setSelectedSystem(system));
    },
    [dispatch]
  );

  // Get classes from selected system
  const getClasses = useCallback((): ClassDefinition[] => {
    if (!selectedSystem?.config?.classes) return [];
    return selectedSystem.config.classes;
  }, [selectedSystem]);

  // Get races from selected system
  const getRaces = useCallback((): RaceDefinition[] => {
    if (!selectedSystem?.config?.races) return [];
    return selectedSystem.config.races;
  }, [selectedSystem]);

  // Get alignments from selected system
  const getAlignments = useCallback((): AlignmentDefinition[] => {
    if (!selectedSystem?.config?.alignments) return [];
    return selectedSystem.config.alignments;
  }, [selectedSystem]);

  // Get attributes from selected system
  const getAttributes = useCallback((): AttributeDefinition[] => {
    if (!selectedSystem?.config?.attributes) return [];
    return selectedSystem.config.attributes;
  }, [selectedSystem]);

  // Get skills from selected system
  const getSkills = useCallback((): SkillDefinition[] => {
    if (!selectedSystem?.config?.skills) return [];
    return selectedSystem.config.skills;
  }, [selectedSystem]);

  // Get the default system
  const getDefaultSystem = useCallback((): SystemSummary | undefined => {
    return systems.find((s) => s.isDefault);
  }, [systems]);

  // Calculate ability modifier (D&D 5e formula as default)
  const calculateAbilityModifier = useCallback((score: number): number => {
    // Standard D&D 5e formula: floor((score - 10) / 2)
    // In future, this could parse the formula from system config
    return Math.floor((score - 10) / 2);
  }, []);

  // Calculate proficiency bonus (D&D 5e formula as default)
  const calculateProficiencyBonus = useCallback((level: number): number => {
    // Standard D&D 5e formula: ceil(level / 4) + 1
    return Math.ceil(level / 4) + 1;
  }, []);

  return {
    // State
    systems,
    selectedSystem,
    loading,
    error,

    // Actions
    loadSystems,
    loadSystem,
    selectSystem,

    // Helpers
    getClasses,
    getRaces,
    getAlignments,
    getAttributes,
    getSkills,
    getDefaultSystem,

    // Calculations
    calculateAbilityModifier,
    calculateProficiencyBonus,
  };
}

/**
 * Hook to automatically load systems on mount and optionally load a specific system
 */
export function useSystemWithAutoLoad(systemId?: string): UseSystemReturn {
  const systemHook = useSystem();

  useEffect(() => {
    // Load all systems on mount
    systemHook.loadSystems();
  }, []);

  useEffect(() => {
    // Load specific system if provided
    if (systemId) {
      systemHook.loadSystem(systemId);
    }
  }, [systemId]);

  return systemHook;
}
