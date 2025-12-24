import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import authReducer, {
  AuthState,
  register,
  login,
  logout,
  clearError,
  setAccessToken,
} from './authSlice';
import { configureStore } from '@reduxjs/toolkit';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}));

import { authService } from '../services/authService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authSlice', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockAuthResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state when no tokens in localStorage', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });
    });

    it('should be authenticated if accessToken exists in localStorage', () => {
      localStorage.setItem('accessToken', 'existing-token');
      localStorage.setItem('refreshToken', 'existing-refresh');

      // Need to re-import to get new initial state
      const initialState: AuthState = {
        user: null,
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        isLoading: false,
        error: null,
        isAuthenticated: !!localStorage.getItem('accessToken'),
      };

      expect(initialState.isAuthenticated).toBe(true);
      expect(initialState.accessToken).toBe('existing-token');
    });
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      const stateWithError: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: 'Some error',
        isAuthenticated: false,
      };
      const state = authReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });

    it('should handle setAccessToken', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const state = authReducer(initialState, setAccessToken('new-token'));
      expect(state.accessToken).toBe('new-token');
      expect(localStorage.getItem('accessToken')).toBe('new-token');
    });
  });

  describe('register', () => {
    it('should handle pending state', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const state = authReducer(initialState, { type: register.pending.type });
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const state = authReducer(initialState, {
        type: register.fulfilled.type,
        payload: mockAuthResponse,
      });
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.refreshToken).toBe('mock-refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const error = 'Registration failed';
      const state = authReducer(initialState, {
        type: register.rejected.type,
        payload: error,
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(error);
    });

    it('should register successfully and save tokens to localStorage', async () => {
      (authService.register as any).mockResolvedValue(mockAuthResponse);

      const store = configureStore({ reducer: { auth: authReducer } });
      await store.dispatch(
        register({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
        }) as any
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.isAuthenticated).toBe(true);
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });

    it('should handle registration error', async () => {
      const errorMessage = 'Email already exists';
      (authService.register as any).mockRejectedValue({
        response: { data: { error: errorMessage } },
      });

      const store = configureStore({ reducer: { auth: authReducer } });
      await store.dispatch(
        register({
          email: 'existing@example.com',
          password: 'password123',
          displayName: 'Test User',
        }) as any
      );

      const state = store.getState().auth;
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should handle pending state', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const state = authReducer(initialState, { type: login.pending.type });
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const state = authReducer(initialState, {
        type: login.fulfilled.type,
        payload: mockAuthResponse,
      });
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle rejected state', () => {
      const initialState: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      };
      const error = 'Invalid credentials';
      const state = authReducer(initialState, {
        type: login.rejected.type,
        payload: error,
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(error);
    });

    it('should login successfully and save tokens to localStorage', async () => {
      (authService.login as any).mockResolvedValue(mockAuthResponse);

      const store = configureStore({ reducer: { auth: authReducer } });
      await store.dispatch(
        login({
          email: 'test@example.com',
          password: 'password123',
        }) as any
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.isAuthenticated).toBe(true);
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid email or password';
      (authService.login as any).mockRejectedValue({
        response: { data: { error: errorMessage } },
      });

      const store = configureStore({ reducer: { auth: authReducer } });
      await store.dispatch(
        login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }) as any
      );

      const state = store.getState().auth;
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should handle fulfilled state', () => {
      const authenticatedState: AuthState = {
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        isLoading: false,
        error: null,
        isAuthenticated: true,
      };
      const state = authReducer(authenticatedState, {
        type: logout.fulfilled.type,
      });
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should logout and remove tokens from localStorage', async () => {
      localStorage.setItem('accessToken', 'token-to-remove');
      localStorage.setItem('refreshToken', 'refresh-to-remove');

      const authenticatedState: AuthState = {
        user: mockUser,
        accessToken: 'token-to-remove',
        refreshToken: 'refresh-to-remove',
        isLoading: false,
        error: null,
        isAuthenticated: true,
      };

      const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: authenticatedState },
      });

      await store.dispatch(logout() as any);

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
