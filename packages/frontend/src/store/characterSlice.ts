import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { axiosInstance } from '../services/authService';

export interface Character {
  id: string;
  name: string;
  system: string;
  class: string;
  race: string;
  level: number;
  alignment: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  abilityModifiers: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  health: {
    maxHitPoints: number;
    currentHitPoints: number;
    temporaryHitPoints: number;
  };
  background?: string;
  backstory?: string;
  gold: number;
  isPublic: boolean;
  imageUrl?: string;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus?: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: string;
}

export interface ShareTokenInfo {
  token: string;
  shareUrl: string;
  expiresAt: string | null;
  characterId: string;
  characterName: string;
}

export interface CharacterState {
  characters: Character[];
  selectedCharacter: Character | null;
  loading: boolean;
  error: string | null;
}

const initialState: CharacterState = {
  characters: [],
  selectedCharacter: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchCharacters = createAsyncThunk(
  'character/fetchCharacters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/characters');
      // Backend returns { characters: [], total, limit, offset }
      return response.data.characters || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch characters');
    }
  }
);

export const fetchCharacterById = createAsyncThunk(
  'character/fetchCharacterById',
  async (characterId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/characters/${characterId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch character');
    }
  }
);

export const createCharacter = createAsyncThunk(
  'character/createCharacter',
  async (
    input: {
      name: string;
      system_id: string;
      character_data?: any;
      image_url?: string;
      is_public?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/api/characters', input);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create character');
    }
  }
);

export const updateCharacter = createAsyncThunk(
  'character/updateCharacter',
  async (
    { characterId, ...updates }: { characterId: string; [key: string]: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/api/characters/${characterId}`, updates);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update character');
    }
  }
);

export const deleteCharacter = createAsyncThunk(
  'character/deleteCharacter',
  async (characterId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/characters/${characterId}`);
      return characterId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete character');
    }
  }
);

export const fetchPublicCharacters = createAsyncThunk(
  'character/fetchPublicCharacters',
  async (
    { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get('/api/characters/browse/public', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch public characters');
    }
  }
);

export const fetchSharedCharacter = createAsyncThunk(
  'character/fetchSharedCharacter',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/characters/shared/${token}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shared character');
    }
  }
);

export const generateShareToken = createAsyncThunk(
  'character/generateShareToken',
  async (
    { characterId, expiresInDays }: { characterId: string; expiresInDays?: number | null },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(`/api/characters/${characterId}/share`, {
        expiresInDays,
      });
      return response.data as ShareTokenInfo;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate share token');
    }
  }
);

export const getShareTokenInfo = createAsyncThunk(
  'character/getShareTokenInfo',
  async (characterId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/characters/${characterId}/share`);
      return response.data as ShareTokenInfo;
    } catch (error: any) {
      // 404 means no token exists, which is not an error
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to get share token info');
    }
  }
);

export const revokeShareToken = createAsyncThunk(
  'character/revokeShareToken',
  async (characterId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/characters/${characterId}/share`);
      return characterId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to revoke share token');
    }
  }
);

export const importCharacter = createAsyncThunk(
  'character/importCharacter',
  async (jsonData: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/characters/import', jsonData);
      return response.data.character;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to import character');
    }
  }
);

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setSelectedCharacter: (state, action: PayloadAction<Character | null>) => {
      state.selectedCharacter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Characters
      .addCase(fetchCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = action.payload;
      })
      .addCase(fetchCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Character By ID
      .addCase(fetchCharacterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacterById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCharacter = action.payload;
      })
      .addCase(fetchCharacterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Character
      .addCase(createCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.characters.push(action.payload);
        state.selectedCharacter = action.payload;
      })
      .addCase(createCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Character
      .addCase(updateCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCharacter.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.characters.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.characters[index] = action.payload;
        }
        if (state.selectedCharacter?.id === action.payload.id) {
          state.selectedCharacter = action.payload;
        }
      })
      .addCase(updateCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Character
      .addCase(deleteCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = state.characters.filter((c) => c.id !== action.payload);
        if (state.selectedCharacter?.id === action.payload) {
          state.selectedCharacter = null;
        }
      })
      .addCase(deleteCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Public Characters
      .addCase(fetchPublicCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = action.payload;
      })
      .addCase(fetchPublicCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Shared Character
      .addCase(fetchSharedCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCharacter = action.payload;
      })
      .addCase(fetchSharedCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Import Character
      .addCase(importCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.characters.push(action.payload);
        state.selectedCharacter = action.payload;
      })
      .addCase(importCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCharacter, clearError } = characterSlice.actions;
export default characterSlice.reducer;
