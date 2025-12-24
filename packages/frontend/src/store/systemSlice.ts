import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { axiosInstance } from '../services/authService';

// Types for system configuration
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

export interface ClassDefinition {
  id: string;
  name: string;
  description?: string;
  hitDice: string;
  primaryAbility: string;
  savingThrows?: string[];
}

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

export interface SkillDefinition {
  id: string;
  name: string;
  ability: string;
  description?: string;
}

export interface AlignmentDefinition {
  id: string;
  name: string;
  description?: string;
}

export interface CurrencyDefinition {
  id: string;
  name: string;
  abbreviation: string;
  conversionToBase: number;
}

export interface SystemFormulas {
  abilityModifier: string;
  proficiencyBonus?: string;
  armorClass?: string;
  initiative?: string;
  hitPoints?: string;
}

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

export interface SystemSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  isDefault: boolean;
}

export interface FullSystemConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  isDefault: boolean;
  config: SystemConfigData;
}

export interface SystemState {
  systems: SystemSummary[];
  selectedSystem: FullSystemConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: SystemState = {
  systems: [],
  selectedSystem: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchSystems = createAsyncThunk(
  'system/fetchSystems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/systems');
      return response.data as SystemSummary[];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch systems');
    }
  }
);

export const fetchSystemById = createAsyncThunk(
  'system/fetchSystemById',
  async (systemId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/systems/${systemId}`);
      return response.data as FullSystemConfig;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch system');
    }
  }
);

export const fetchSystemClasses = createAsyncThunk(
  'system/fetchSystemClasses',
  async (systemId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/systems/${systemId}/classes`);
      return response.data as Array<{ id: string; name: string }>;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch classes');
    }
  }
);

export const fetchSystemRaces = createAsyncThunk(
  'system/fetchSystemRaces',
  async (systemId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/systems/${systemId}/races`);
      return response.data as Array<{ id: string; name: string }>;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch races');
    }
  }
);

export const fetchSystemAlignments = createAsyncThunk(
  'system/fetchSystemAlignments',
  async (systemId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/systems/${systemId}/alignments`);
      return response.data as Array<{ id: string; name: string }>;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch alignments');
    }
  }
);

export const createSystem = createAsyncThunk(
  'system/createSystem',
  async (systemData: { id: string; name: string; version: string; description?: string; config: SystemConfigData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/systems', systemData);
      return response.data as FullSystemConfig;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to create system');
    }
  }
);

export const updateSystem = createAsyncThunk(
  'system/updateSystem',
  async ({ id, updates }: { id: string; updates: { name?: string; version?: string; description?: string; config?: SystemConfigData; is_active?: boolean } }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/systems/${id}`, updates);
      return response.data as FullSystemConfig;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to update system');
    }
  }
);

export const deleteSystem = createAsyncThunk(
  'system/deleteSystem',
  async (systemId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/systems/${systemId}`);
      return systemId;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to delete system');
    }
  }
);

export const exportSystem = createAsyncThunk(
  'system/exportSystem',
  async (systemId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/systems/${systemId}/export`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to export system');
    }
  }
);

export const importSystem = createAsyncThunk(
  'system/importSystem',
  async (systemData: { id: string; name: string; version: string; description?: string; config: SystemConfigData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/systems/import', systemData);
      return response.data as FullSystemConfig;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to import system');
    }
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setSelectedSystem: (state, action: PayloadAction<FullSystemConfig | null>) => {
      state.selectedSystem = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Systems
      .addCase(fetchSystems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystems.fulfilled, (state, action) => {
        state.loading = false;
        state.systems = action.payload;
      })
      .addCase(fetchSystems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch System By ID
      .addCase(fetchSystemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSystem = action.payload;
      })
      .addCase(fetchSystemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create System
      .addCase(createSystem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSystem.fulfilled, (state, action) => {
        state.loading = false;
        state.systems.push({
          id: action.payload.id,
          name: action.payload.name,
          version: action.payload.version,
          description: action.payload.description,
          isDefault: action.payload.isDefault,
        });
      })
      .addCase(createSystem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update System
      .addCase(updateSystem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSystem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.systems.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.systems[index] = {
            id: action.payload.id,
            name: action.payload.name,
            version: action.payload.version,
            description: action.payload.description,
            isDefault: action.payload.isDefault,
          };
        }
        if (state.selectedSystem?.id === action.payload.id) {
          state.selectedSystem = action.payload;
        }
      })
      .addCase(updateSystem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete System
      .addCase(deleteSystem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSystem.fulfilled, (state, action) => {
        state.loading = false;
        state.systems = state.systems.filter(s => s.id !== action.payload);
        if (state.selectedSystem?.id === action.payload) {
          state.selectedSystem = null;
        }
      })
      .addCase(deleteSystem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Import System
      .addCase(importSystem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importSystem.fulfilled, (state, action) => {
        state.loading = false;
        state.systems.push({
          id: action.payload.id,
          name: action.payload.name,
          version: action.payload.version,
          description: action.payload.description,
          isDefault: action.payload.isDefault,
        });
      })
      .addCase(importSystem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedSystem, clearError } = systemSlice.actions;
export default systemSlice.reducer;
