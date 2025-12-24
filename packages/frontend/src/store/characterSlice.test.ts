import { describe, it, expect, vi, beforeEach } from 'vitest';
import characterReducer, {
  CharacterState,
  fetchCharacters,
  fetchCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  fetchPublicCharacters,
  setSelectedCharacter,
  clearError,
} from './characterSlice';
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

describe('characterSlice', () => {
  const initialState: CharacterState = {
    characters: [],
    selectedCharacter: null,
    loading: false,
    error: null,
  };

  const mockCharacter = {
    id: 'char-123',
    name: 'Test Character',
    system: 'd&d5e',
    class: 'Fighter',
    race: 'Human',
    level: 5,
    alignment: 'Lawful Good',
    abilityScores: {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    abilityModifiers: {
      strength: 3,
      dexterity: 2,
      constitution: 2,
      intelligence: 0,
      wisdom: 1,
      charisma: -1,
    },
    health: {
      maxHitPoints: 45,
      currentHitPoints: 45,
      temporaryHitPoints: 0,
    },
    background: 'Soldier',
    backstory: 'A brave warrior',
    gold: 100,
    isPublic: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      expect(characterReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setSelectedCharacter', () => {
      const state = characterReducer(initialState, setSelectedCharacter(mockCharacter));
      expect(state.selectedCharacter).toEqual(mockCharacter);
    });

    it('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = characterReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('fetchCharacters', () => {
    it('should handle pending state', () => {
      const state = characterReducer(initialState, {
        type: fetchCharacters.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const characters = [mockCharacter];
      const state = characterReducer(initialState, {
        type: fetchCharacters.fulfilled.type,
        payload: characters,
      });
      expect(state.loading).toBe(false);
      expect(state.characters).toEqual(characters);
      expect(state.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const error = 'Failed to fetch characters';
      const state = characterReducer(initialState, {
        type: fetchCharacters.rejected.type,
        payload: error,
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error);
    });

    it('should fetch characters successfully', async () => {
      const characters = [mockCharacter];
      (axiosInstance.get as any).mockResolvedValue({ data: characters });

      const store = configureStore({ reducer: { character: characterReducer } });
      await store.dispatch(fetchCharacters() as any);

      const state = store.getState().character;
      expect(state.characters).toEqual(characters);
      expect(state.loading).toBe(false);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/characters');
    });

    it('should handle fetch characters error', async () => {
      const errorMessage = 'Network error';
      (axiosInstance.get as any).mockRejectedValue({
        response: { data: { error: errorMessage } },
      });

      const store = configureStore({ reducer: { character: characterReducer } });
      await store.dispatch(fetchCharacters() as any);

      const state = store.getState().character;
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchCharacterById', () => {
    it('should handle pending state', () => {
      const state = characterReducer(initialState, {
        type: fetchCharacterById.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const state = characterReducer(initialState, {
        type: fetchCharacterById.fulfilled.type,
        payload: mockCharacter,
      });
      expect(state.loading).toBe(false);
      expect(state.selectedCharacter).toEqual(mockCharacter);
      expect(state.error).toBeNull();
    });

    it('should fetch character by ID successfully', async () => {
      (axiosInstance.get as any).mockResolvedValue({ data: mockCharacter });

      const store = configureStore({ reducer: { character: characterReducer } });
      await store.dispatch(fetchCharacterById('char-123') as any);

      const state = store.getState().character;
      expect(state.selectedCharacter).toEqual(mockCharacter);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/characters/char-123');
    });
  });

  describe('createCharacter', () => {
    it('should handle pending state', () => {
      const state = characterReducer(initialState, {
        type: createCharacter.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const state = characterReducer(initialState, {
        type: createCharacter.fulfilled.type,
        payload: mockCharacter,
      });
      expect(state.loading).toBe(false);
      expect(state.characters).toContainEqual(mockCharacter);
      expect(state.selectedCharacter).toEqual(mockCharacter);
      expect(state.error).toBeNull();
    });

    it('should create character successfully', async () => {
      (axiosInstance.post as any).mockResolvedValue({ data: mockCharacter });

      const input = {
        name: 'Test Character',
        system_id: 'd&d5e',
      };

      const store = configureStore({ reducer: { character: characterReducer } });
      await store.dispatch(createCharacter(input) as any);

      const state = store.getState().character;
      expect(state.characters).toContainEqual(mockCharacter);
      expect(state.selectedCharacter).toEqual(mockCharacter);
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/characters', input);
    });
  });

  describe('updateCharacter', () => {
    const stateWithCharacter = {
      ...initialState,
      characters: [mockCharacter],
      selectedCharacter: mockCharacter,
    };

    it('should handle pending state', () => {
      const state = characterReducer(stateWithCharacter, {
        type: updateCharacter.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const updatedCharacter = { ...mockCharacter, name: 'Updated Character' };
      const state = characterReducer(stateWithCharacter, {
        type: updateCharacter.fulfilled.type,
        payload: updatedCharacter,
      });
      expect(state.loading).toBe(false);
      expect(state.characters[0]).toEqual(updatedCharacter);
      expect(state.selectedCharacter).toEqual(updatedCharacter);
      expect(state.error).toBeNull();
    });

    it('should update character successfully', async () => {
      const updatedCharacter = { ...mockCharacter, name: 'Updated Character' };
      (axiosInstance.put as any).mockResolvedValue({ data: updatedCharacter });

      const store = configureStore({
        reducer: { character: characterReducer },
        preloadedState: { character: stateWithCharacter },
      });

      await store.dispatch(
        updateCharacter({
          characterId: 'char-123',
          name: 'Updated Character',
        }) as any
      );

      const state = store.getState().character;
      expect(state.characters[0].name).toBe('Updated Character');
      expect(axiosInstance.put).toHaveBeenCalledWith('/api/characters/char-123', {
        name: 'Updated Character',
      });
    });

    it('should not update if character not found in list', () => {
      const differentCharacter = { ...mockCharacter, id: 'char-456' };
      const state = characterReducer(stateWithCharacter, {
        type: updateCharacter.fulfilled.type,
        payload: differentCharacter,
      });
      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].id).toBe('char-123');
    });
  });

  describe('deleteCharacter', () => {
    const stateWithCharacter = {
      ...initialState,
      characters: [mockCharacter],
      selectedCharacter: mockCharacter,
    };

    it('should handle pending state', () => {
      const state = characterReducer(stateWithCharacter, {
        type: deleteCharacter.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const state = characterReducer(stateWithCharacter, {
        type: deleteCharacter.fulfilled.type,
        payload: 'char-123',
      });
      expect(state.loading).toBe(false);
      expect(state.characters).toHaveLength(0);
      expect(state.selectedCharacter).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should delete character successfully', async () => {
      (axiosInstance.delete as any).mockResolvedValue({});

      const store = configureStore({
        reducer: { character: characterReducer },
        preloadedState: { character: stateWithCharacter },
      });

      await store.dispatch(deleteCharacter('char-123') as any);

      const state = store.getState().character;
      expect(state.characters).toHaveLength(0);
      expect(state.selectedCharacter).toBeNull();
      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/characters/char-123');
    });

    it('should not clear selected character if different character deleted', () => {
      const state = characterReducer(stateWithCharacter, {
        type: deleteCharacter.fulfilled.type,
        payload: 'char-456',
      });
      expect(state.selectedCharacter).toEqual(mockCharacter);
    });
  });

  describe('fetchPublicCharacters', () => {
    it('should handle pending state', () => {
      const state = characterReducer(initialState, {
        type: fetchPublicCharacters.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const characters = [mockCharacter];
      const state = characterReducer(initialState, {
        type: fetchPublicCharacters.fulfilled.type,
        payload: characters,
      });
      expect(state.loading).toBe(false);
      expect(state.characters).toEqual(characters);
      expect(state.error).toBeNull();
    });

    it('should fetch public characters successfully', async () => {
      const characters = [mockCharacter];
      (axiosInstance.get as any).mockResolvedValue({ data: characters });

      const store = configureStore({ reducer: { character: characterReducer } });
      await store.dispatch(fetchPublicCharacters({ limit: 10, offset: 0 }) as any);

      const state = store.getState().character;
      expect(state.characters).toEqual(characters);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/characters/browse/public', {
        params: { limit: 10, offset: 0 },
      });
    });

    it('should use default pagination params', async () => {
      (axiosInstance.get as any).mockResolvedValue({ data: [] });

      const store = configureStore({ reducer: { character: characterReducer } });
      await store.dispatch(fetchPublicCharacters() as any);

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/characters/browse/public', {
        params: { limit: 20, offset: 0 },
      });
    });
  });
});
