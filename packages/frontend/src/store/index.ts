import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import characterReducer from './characterSlice';
import partyReducer from './partySlice';
import syncReducer from './syncSlice';
import systemReducer from './systemSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    character: characterReducer,
    party: partyReducer,
    sync: syncReducer,
    system: systemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
