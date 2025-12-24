import { describe, it, expect, vi, beforeEach } from 'vitest';
import partyReducer, {
  PartyState,
  fetchParties,
  fetchPartyById,
  createParty,
  updateParty,
  deleteParty,
  addPartyMember,
  removePartyMember,
  setSelectedParty,
  clearError,
} from './partySlice';
import { configureStore } from '@reduxjs/toolkit';

// Mock axios
vi.mock('../services/authService', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { axiosInstance } from '../services/authService';

describe('partySlice', () => {
  const initialState: PartyState = {
    parties: [],
    selectedParty: null,
    loading: false,
    error: null,
  };

  const mockParty = {
    id: 'party-123',
    name: 'Test Party',
    description: 'A test party',
    campaignName: 'Lost Mines',
    isPublic: false,
    notes: 'Weekly sessions',
    sharedGold: 500,
    sharedInventory: [{ name: 'Rope', quantity: 2 }],
    memberCount: 2,
    members: [
      { id: 'char-1', name: 'Fighter', class: 'Fighter', race: 'Human', level: 5 },
      { id: 'char-2', name: 'Wizard', class: 'Wizard', race: 'Elf', level: 4 },
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      expect(partyReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setSelectedParty', () => {
      const state = partyReducer(initialState, setSelectedParty(mockParty));
      expect(state.selectedParty).toEqual(mockParty);
    });

    it('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = partyReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('fetchParties', () => {
    it('should handle pending, fulfilled, and rejected states', () => {
      let state = partyReducer(initialState, { type: fetchParties.pending.type });
      expect(state.loading).toBe(true);

      state = partyReducer(initialState, {
        type: fetchParties.fulfilled.type,
        payload: [mockParty],
      });
      expect(state.loading).toBe(false);
      expect(state.parties).toEqual([mockParty]);

      state = partyReducer(initialState, {
        type: fetchParties.rejected.type,
        payload: 'Error',
      });
      expect(state.error).toBe('Error');
    });

    it('should fetch parties successfully', async () => {
      (axiosInstance.get as any).mockResolvedValue({ data: [mockParty] });
      const store = configureStore({ reducer: { party: partyReducer } });
      await store.dispatch(fetchParties() as any);

      expect(store.getState().party.parties).toEqual([mockParty]);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/parties');
    });
  });

  describe('createParty', () => {
    it('should create party successfully', async () => {
      (axiosInstance.post as any).mockResolvedValue({ data: mockParty });
      const store = configureStore({ reducer: { party: partyReducer } });
      await store.dispatch(createParty({ name: 'Test Party' }) as any);

      const state = store.getState().party;
      expect(state.parties).toContainEqual(mockParty);
      expect(state.selectedParty).toEqual(mockParty);
    });
  });

  describe('updateParty', () => {
    it('should update party successfully', async () => {
      const updatedParty = { ...mockParty, name: 'Updated Party' };
      (axiosInstance.put as any).mockResolvedValue({ data: updatedParty });

      const store = configureStore({
        reducer: { party: partyReducer },
        preloadedState: { party: { ...initialState, parties: [mockParty], selectedParty: mockParty } },
      });

      await store.dispatch(updateParty({ partyId: 'party-123', name: 'Updated Party' }) as any);

      expect(store.getState().party.parties[0].name).toBe('Updated Party');
      expect(store.getState().party.selectedParty?.name).toBe('Updated Party');
    });
  });

  describe('deleteParty', () => {
    it('should delete party successfully', async () => {
      (axiosInstance.delete as any).mockResolvedValue({});

      const store = configureStore({
        reducer: { party: partyReducer },
        preloadedState: { party: { ...initialState, parties: [mockParty], selectedParty: mockParty } },
      });

      await store.dispatch(deleteParty('party-123') as any);

      expect(store.getState().party.parties).toHaveLength(0);
      expect(store.getState().party.selectedParty).toBeNull();
    });
  });

  describe('addPartyMember', () => {
    it('should add member successfully', async () => {
      const updatedParty = {
        ...mockParty,
        members: [...mockParty.members, { id: 'char-3', name: 'Rogue', class: 'Rogue', race: 'Halfling', level: 3 }],
        memberCount: 3,
      };
      (axiosInstance.post as any).mockResolvedValue({ data: updatedParty });

      const store = configureStore({
        reducer: { party: partyReducer },
        preloadedState: { party: { ...initialState, parties: [mockParty], selectedParty: mockParty } },
      });

      await store.dispatch(addPartyMember({ partyId: 'party-123', characterId: 'char-3' }) as any);

      expect(store.getState().party.parties[0].memberCount).toBe(3);
      expect(store.getState().party.selectedParty?.memberCount).toBe(3);
    });
  });

  describe('removePartyMember', () => {
    it('should remove member successfully', async () => {
      const updatedParty = {
        ...mockParty,
        members: [mockParty.members[0]],
        memberCount: 1,
      };
      (axiosInstance.delete as any).mockResolvedValue({ data: updatedParty });

      const store = configureStore({
        reducer: { party: partyReducer },
        preloadedState: { party: { ...initialState, parties: [mockParty], selectedParty: mockParty } },
      });

      await store.dispatch(removePartyMember({ partyId: 'party-123', characterId: 'char-2' }) as any);

      expect(store.getState().party.parties[0].memberCount).toBe(1);
    });
  });
});
