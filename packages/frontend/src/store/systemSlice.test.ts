import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import systemReducer, {
  fetchSystems,
  fetchSystemById,
  fetchSystemClasses,
  fetchSystemRaces,
  fetchSystemAlignments,
  createSystem,
  updateSystem,
  deleteSystem,
  exportSystem,
  importSystem,
  setSelectedSystem,
  clearError,
  SystemState,
} from './systemSlice';
import { axiosInstance } from '../services/authService';
import { mockSystemSummary, mockFullSystemConfig, mockSystemConfigData } from '../test/test-utils';

// Mock axios instance
vi.mock('../services/authService', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('systemSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        system: systemReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().system;
      expect(state).toEqual({
        systems: [],
        selectedSystem: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle setSelectedSystem', () => {
      store.dispatch(setSelectedSystem(mockFullSystemConfig));
      const state = store.getState().system;
      expect(state.selectedSystem).toEqual(mockFullSystemConfig);
    });

    it('should handle setSelectedSystem with null', () => {
      store.dispatch(setSelectedSystem(mockFullSystemConfig));
      store.dispatch(setSelectedSystem(null));
      const state = store.getState().system;
      expect(state.selectedSystem).toBeNull();
    });

    it('should handle clearError', () => {
      // First set an error state by rejecting a fetch
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: 'Test error' } },
      });

      return store.dispatch(fetchSystems()).then(() => {
        let state = store.getState().system;
        expect(state.error).toBe('Test error');

        store.dispatch(clearError());
        state = store.getState().system;
        expect(state.error).toBeNull();
      });
    });
  });

  describe('fetchSystems', () => {
    it('should fetch systems successfully', async () => {
      const mockSystems = [mockSystemSummary];
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockSystems });

      await store.dispatch(fetchSystems());

      const state = store.getState().system;
      expect(state.systems).toEqual(mockSystems);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/systems');
    });

    it('should handle fetch systems error', async () => {
      const errorMessage = 'Network error';
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(fetchSystems());

      const state = store.getState().system;
      expect(state.systems).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle fetch systems error without response data', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error('Network failure'));

      await store.dispatch(fetchSystems());

      const state = store.getState().system;
      expect(state.error).toBe('Failed to fetch systems');
    });

    it('should set loading state while fetching', () => {
      vi.mocked(axiosInstance.get).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
      );

      store.dispatch(fetchSystems());
      const state = store.getState().system;
      expect(state.loading).toBe(true);
    });
  });

  describe('fetchSystemById', () => {
    it('should fetch system by ID successfully', async () => {
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockFullSystemConfig });

      await store.dispatch(fetchSystemById('d&d5e'));

      const state = store.getState().system;
      expect(state.selectedSystem).toEqual(mockFullSystemConfig);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/systems/d&d5e');
    });

    it('should handle fetch system by ID error', async () => {
      const errorMessage = 'System not found';
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(fetchSystemById('non-existent'));

      const state = store.getState().system;
      expect(state.selectedSystem).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('fetchSystemClasses', () => {
    it('should fetch system classes successfully', async () => {
      const mockClasses = [
        { id: 'fighter', name: 'Fighter' },
        { id: 'wizard', name: 'Wizard' },
      ];
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockClasses });

      const result = await store.dispatch(fetchSystemClasses('d&d5e'));

      expect(result.payload).toEqual(mockClasses);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/systems/d&d5e/classes');
    });

    it('should handle fetch classes error', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: 'Failed to fetch' } },
      });

      const result = await store.dispatch(fetchSystemClasses('d&d5e'));

      expect(result.type).toBe('system/fetchSystemClasses/rejected');
      expect(result.payload).toBe('Failed to fetch');
    });
  });

  describe('fetchSystemRaces', () => {
    it('should fetch system races successfully', async () => {
      const mockRaces = [
        { id: 'human', name: 'Human' },
        { id: 'elf', name: 'Elf' },
      ];
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockRaces });

      const result = await store.dispatch(fetchSystemRaces('d&d5e'));

      expect(result.payload).toEqual(mockRaces);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/systems/d&d5e/races');
    });

    it('should handle fetch races error', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: 'Failed to fetch' } },
      });

      const result = await store.dispatch(fetchSystemRaces('d&d5e'));

      expect(result.type).toBe('system/fetchSystemRaces/rejected');
      expect(result.payload).toBe('Failed to fetch');
    });
  });

  describe('fetchSystemAlignments', () => {
    it('should fetch system alignments successfully', async () => {
      const mockAlignments = [
        { id: 'lawful-good', name: 'Lawful Good' },
        { id: 'chaotic-neutral', name: 'Chaotic Neutral' },
      ];
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockAlignments });

      const result = await store.dispatch(fetchSystemAlignments('d&d5e'));

      expect(result.payload).toEqual(mockAlignments);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/systems/d&d5e/alignments');
    });

    it('should handle fetch alignments error', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: 'Failed to fetch' } },
      });

      const result = await store.dispatch(fetchSystemAlignments('d&d5e'));

      expect(result.type).toBe('system/fetchSystemAlignments/rejected');
      expect(result.payload).toBe('Failed to fetch');
    });
  });

  describe('createSystem', () => {
    it('should create system successfully', async () => {
      const newSystem = {
        id: 'custom-system',
        name: 'Custom System',
        version: '1.0.0',
        description: 'My custom RPG',
        config: mockSystemConfigData,
      };

      const createdSystem = {
        ...newSystem,
        isDefault: false,
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: createdSystem });

      await store.dispatch(createSystem(newSystem));

      const state = store.getState().system;
      expect(state.systems).toHaveLength(1);
      expect(state.systems[0]).toEqual({
        id: 'custom-system',
        name: 'Custom System',
        version: '1.0.0',
        description: 'My custom RPG',
        isDefault: false,
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/systems', newSystem);
    });

    it('should handle create system error', async () => {
      const newSystem = {
        id: 'custom-system',
        name: 'Custom System',
        version: '1.0.0',
        config: mockSystemConfigData,
      };

      const errorMessage = 'System already exists';
      vi.mocked(axiosInstance.post).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(createSystem(newSystem));

      const state = store.getState().system;
      expect(state.systems).toHaveLength(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateSystem', () => {
    it('should update system successfully', async () => {
      // First add a system to the state
      const initialSystem = mockSystemSummary;
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: [initialSystem] });
      await store.dispatch(fetchSystems());

      // Now update it
      const updates = {
        name: 'Updated D&D 5e',
        version: '2.0.0',
      };

      const updatedSystem = {
        ...mockFullSystemConfig,
        ...updates,
      };

      vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: updatedSystem });

      await store.dispatch(updateSystem({ id: 'd&d5e', updates }));

      const state = store.getState().system;
      expect(state.systems[0].name).toBe('Updated D&D 5e');
      expect(state.systems[0].version).toBe('2.0.0');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(axiosInstance.put).toHaveBeenCalledWith('/api/systems/d&d5e', updates);
    });

    it('should update selectedSystem if it matches the updated system', async () => {
      // Set selected system
      store.dispatch(setSelectedSystem(mockFullSystemConfig));

      const updates = { name: 'Updated Name' };
      const updatedSystem = {
        ...mockFullSystemConfig,
        name: 'Updated Name',
      };

      vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: updatedSystem });

      await store.dispatch(updateSystem({ id: 'd&d5e', updates }));

      const state = store.getState().system;
      expect(state.selectedSystem?.name).toBe('Updated Name');
    });

    it('should handle update system error', async () => {
      const errorMessage = 'Cannot modify default system';
      vi.mocked(axiosInstance.put).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(updateSystem({ id: 'd&d5e', updates: { name: 'New Name' } }));

      const state = store.getState().system;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('deleteSystem', () => {
    it('should delete system successfully', async () => {
      // First add systems to the state
      const systems = [
        mockSystemSummary,
        { ...mockSystemSummary, id: 'custom-system', name: 'Custom', isDefault: false },
      ];
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: systems });
      await store.dispatch(fetchSystems());

      // Now delete the custom system
      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: { message: 'Deleted' } });

      await store.dispatch(deleteSystem('custom-system'));

      const state = store.getState().system;
      expect(state.systems).toHaveLength(1);
      expect(state.systems[0].id).toBe('d&d5e');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/systems/custom-system');
    });

    it('should clear selectedSystem if it matches deleted system', async () => {
      const customSystem = {
        ...mockFullSystemConfig,
        id: 'custom-system',
        isDefault: false,
      };

      store.dispatch(setSelectedSystem(customSystem));

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: { message: 'Deleted' } });

      await store.dispatch(deleteSystem('custom-system'));

      const state = store.getState().system;
      expect(state.selectedSystem).toBeNull();
    });

    it('should handle delete system error', async () => {
      const errorMessage = 'Cannot delete default system';
      vi.mocked(axiosInstance.delete).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(deleteSystem('d&d5e'));

      const state = store.getState().system;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('exportSystem', () => {
    it('should export system successfully', async () => {
      const exportData = {
        id: 'd&d5e',
        name: 'D&D 5e',
        version: '1.0.0',
        config: mockSystemConfigData,
        exportedAt: '2024-01-20T10:00:00Z',
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: exportData });

      const result = await store.dispatch(exportSystem('d&d5e'));

      expect(result.payload).toEqual(exportData);
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/systems/d&d5e/export');
    });

    it('should handle export system error', async () => {
      vi.mocked(axiosInstance.post).mockRejectedValueOnce({
        response: { data: { error: 'Export failed' } },
      });

      const result = await store.dispatch(exportSystem('d&d5e'));

      expect(result.type).toBe('system/exportSystem/rejected');
      expect(result.payload).toBe('Export failed');
    });
  });

  describe('importSystem', () => {
    it('should import system successfully', async () => {
      const importData = {
        id: 'imported-system',
        name: 'Imported System',
        version: '1.0.0',
        description: 'Imported from file',
        config: mockSystemConfigData,
      };

      const importedSystem = {
        ...importData,
        isDefault: false,
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: importedSystem });

      await store.dispatch(importSystem(importData));

      const state = store.getState().system;
      expect(state.systems).toHaveLength(1);
      expect(state.systems[0]).toEqual({
        id: 'imported-system',
        name: 'Imported System',
        version: '1.0.0',
        description: 'Imported from file',
        isDefault: false,
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/systems/import', importData);
    });

    it('should handle import system error', async () => {
      const importData = {
        id: 'imported-system',
        name: 'Imported System',
        version: '1.0.0',
        config: mockSystemConfigData,
      };

      const errorMessage = 'System already exists';
      vi.mocked(axiosInstance.post).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(importSystem(importData));

      const state = store.getState().system;
      expect(state.systems).toHaveLength(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      // Fetch systems
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: [mockSystemSummary] });
      await store.dispatch(fetchSystems());

      let state = store.getState().system;
      expect(state.systems).toHaveLength(1);

      // Create a new system
      const newSystem = {
        id: 'custom',
        name: 'Custom',
        version: '1.0.0',
        config: mockSystemConfigData,
      };
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { ...newSystem, isDefault: false },
      });
      await store.dispatch(createSystem(newSystem));

      state = store.getState().system;
      expect(state.systems).toHaveLength(2);

      // Delete the custom system
      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: { message: 'Deleted' } });
      await store.dispatch(deleteSystem('custom'));

      state = store.getState().system;
      expect(state.systems).toHaveLength(1);
      expect(state.systems[0].id).toBe('d&d5e');
    });

    it('should maintain error state across failed operations', async () => {
      // First operation fails
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { error: 'First error' } },
      });
      await store.dispatch(fetchSystems());

      let state = store.getState().system;
      expect(state.error).toBe('First error');

      // Clear error
      store.dispatch(clearError());
      state = store.getState().system;
      expect(state.error).toBeNull();

      // Second operation fails
      vi.mocked(axiosInstance.post).mockRejectedValueOnce({
        response: { data: { error: 'Second error' } },
      });
      await store.dispatch(
        createSystem({ id: 'test', name: 'Test', version: '1.0.0', config: mockSystemConfigData })
      );

      state = store.getState().system;
      expect(state.error).toBe('Second error');
    });
  });
});
