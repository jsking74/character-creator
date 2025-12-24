import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { axiosInstance } from '../services/authService';

export interface PartyMember {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  description?: string;
}

export interface Party {
  id: string;
  name: string;
  description?: string;
  campaignName?: string;
  isPublic: boolean;
  notes?: string;
  sharedGold: number;
  sharedInventory: InventoryItem[];
  memberCount: number;
  members: PartyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface PartyState {
  parties: Party[];
  selectedParty: Party | null;
  loading: boolean;
  error: string | null;
}

const initialState: PartyState = {
  parties: [],
  selectedParty: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchParties = createAsyncThunk(
  'party/fetchParties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/parties');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch parties');
    }
  }
);

export const fetchPartyById = createAsyncThunk(
  'party/fetchPartyById',
  async (partyId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/parties/${partyId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch party');
    }
  }
);

export const createParty = createAsyncThunk(
  'party/createParty',
  async (
    input: {
      name: string;
      description?: string;
      campaign_name?: string;
      is_public?: boolean;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/api/parties', input);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create party');
    }
  }
);

export const updateParty = createAsyncThunk(
  'party/updateParty',
  async (
    { partyId, ...updates }: { partyId: string; [key: string]: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/api/parties/${partyId}`, updates);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update party');
    }
  }
);

export const deleteParty = createAsyncThunk(
  'party/deleteParty',
  async (partyId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/parties/${partyId}`);
      return partyId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete party');
    }
  }
);

export const addPartyMember = createAsyncThunk(
  'party/addMember',
  async (
    { partyId, characterId }: { partyId: string; characterId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(`/api/parties/${partyId}/members`, {
        characterId,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add member');
    }
  }
);

export const removePartyMember = createAsyncThunk(
  'party/removeMember',
  async (
    { partyId, characterId }: { partyId: string; characterId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.delete(
        `/api/parties/${partyId}/members/${characterId}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove member');
    }
  }
);

const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    setSelectedParty: (state, action: PayloadAction<Party | null>) => {
      state.selectedParty = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Parties
      .addCase(fetchParties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParties.fulfilled, (state, action) => {
        state.loading = false;
        state.parties = action.payload;
      })
      .addCase(fetchParties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Party By ID
      .addCase(fetchPartyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedParty = action.payload;
      })
      .addCase(fetchPartyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Party
      .addCase(createParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParty.fulfilled, (state, action) => {
        state.loading = false;
        state.parties.push(action.payload);
        state.selectedParty = action.payload;
      })
      .addCase(createParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Party
      .addCase(updateParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateParty.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.parties.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.parties[index] = action.payload;
        }
        if (state.selectedParty?.id === action.payload.id) {
          state.selectedParty = action.payload;
        }
      })
      .addCase(updateParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Party
      .addCase(deleteParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParty.fulfilled, (state, action) => {
        state.loading = false;
        state.parties = state.parties.filter((p) => p.id !== action.payload);
        if (state.selectedParty?.id === action.payload) {
          state.selectedParty = null;
        }
      })
      .addCase(deleteParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Member
      .addCase(addPartyMember.fulfilled, (state, action) => {
        const index = state.parties.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.parties[index] = action.payload;
        }
        if (state.selectedParty?.id === action.payload.id) {
          state.selectedParty = action.payload;
        }
      })
      .addCase(addPartyMember.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove Member
      .addCase(removePartyMember.fulfilled, (state, action) => {
        const index = state.parties.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.parties[index] = action.payload;
        }
        if (state.selectedParty?.id === action.payload.id) {
          state.selectedParty = action.payload;
        }
      })
      .addCase(removePartyMember.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedParty, clearError } = partySlice.actions;
export default partySlice.reducer;
