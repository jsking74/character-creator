import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { syncQueueStore, conflictStore, ConflictRecord, SyncQueueItem } from '../services/indexedDb';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  conflictCount: number;
  conflicts: ConflictRecord[];
  syncQueue: SyncQueueItem[];
  error: string | null;
}

const initialState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncedAt: null,
  pendingCount: 0,
  conflictCount: 0,
  conflicts: [],
  syncQueue: [],
  error: null,
};

// Async thunks
export const loadSyncState = createAsyncThunk(
  'sync/loadSyncState',
  async () => {
    const queue = await syncQueueStore.getAll();
    const conflicts = await conflictStore.getAll();
    return {
      syncQueue: queue,
      conflicts: conflicts.filter((c) => !c.resolvedAt),
      pendingCount: queue.length,
      conflictCount: conflicts.filter((c) => !c.resolvedAt).length,
    };
  }
);

export const addToSyncQueue = createAsyncThunk(
  'sync/addToQueue',
  async (item: Omit<SyncQueueItem, 'id'>) => {
    const id = await syncQueueStore.add(item);
    const queue = await syncQueueStore.getAll();
    return { id, item: { ...item, id }, queue };
  }
);

export const removeFromSyncQueue = createAsyncThunk(
  'sync/removeFromQueue',
  async (id: string) => {
    await syncQueueStore.remove(id);
    const queue = await syncQueueStore.getAll();
    return { id, queue };
  }
);

export const clearSyncQueue = createAsyncThunk('sync/clearQueue', async () => {
  await syncQueueStore.clear();
  return [];
});

export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async ({ id, resolution }: { id: string; resolution: 'local' | 'server' | 'merged' }) => {
    await conflictStore.resolve(id, resolution);
    const conflicts = await conflictStore.getAll();
    return {
      id,
      resolution,
      conflicts: conflicts.filter((c) => !c.resolvedAt),
    };
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    setLastSyncedAt(state, action: PayloadAction<string>) {
      state.lastSyncedAt = action.payload;
    },
    setSyncError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    updatePendingCount(state, action: PayloadAction<number>) {
      state.pendingCount = action.payload;
    },
    addConflict(state, action: PayloadAction<ConflictRecord>) {
      state.conflicts.push(action.payload);
      state.conflictCount = state.conflicts.length;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load sync state
      .addCase(loadSyncState.fulfilled, (state, action) => {
        state.syncQueue = action.payload.syncQueue;
        state.conflicts = action.payload.conflicts;
        state.pendingCount = action.payload.pendingCount;
        state.conflictCount = action.payload.conflictCount;
      })
      // Add to queue
      .addCase(addToSyncQueue.fulfilled, (state, action) => {
        state.syncQueue = action.payload.queue;
        state.pendingCount = action.payload.queue.length;
      })
      // Remove from queue
      .addCase(removeFromSyncQueue.fulfilled, (state, action) => {
        state.syncQueue = action.payload.queue;
        state.pendingCount = action.payload.queue.length;
      })
      // Clear queue
      .addCase(clearSyncQueue.fulfilled, (state) => {
        state.syncQueue = [];
        state.pendingCount = 0;
      })
      // Resolve conflict
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.conflicts = action.payload.conflicts;
        state.conflictCount = action.payload.conflicts.length;
      });
  },
});

export const {
  setOnlineStatus,
  setSyncing,
  setLastSyncedAt,
  setSyncError,
  updatePendingCount,
  addConflict,
} = syncSlice.actions;

export default syncSlice.reducer;
