import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import characterReducer, { CharacterState } from '../store/characterSlice';
import partyReducer, { PartyState } from '../store/partySlice';
import authReducer from '../store/authSlice';
import systemReducer, { SystemState } from '../store/systemSlice';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: {
    character?: Partial<CharacterState>;
    party?: Partial<PartyState>;
    auth?: any;
    system?: Partial<SystemState>;
  };
  route?: string;
  path?: string;
}

export const mockCharacter = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Character',
  system: 'd&d5e',
  class: 'Fighter',
  race: 'Human',
  level: 5,
  alignment: 'Neutral Good',
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
    maxHitPoints: 44,
    currentHitPoints: 38,
    temporaryHitPoints: 5,
  },
  background: 'Soldier',
  backstory: 'A veteran of many battles.',
  gold: 150,
  isPublic: false,
  imageUrl: '',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T15:30:00Z',
};

export const mockParty = {
  id: '987e6543-e21b-12d3-a456-426614174000',
  name: 'The Adventurers',
  description: 'A band of brave heroes.',
  campaignName: 'Curse of Strahd',
  isPublic: false,
  memberCount: 2,
  members: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Character',
      class: 'Fighter',
      race: 'Human',
      level: 5,
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Elara Moonwhisper',
      class: 'Wizard',
      race: 'Elf',
      level: 5,
    },
  ],
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-20T15:30:00Z',
};

export const mockSystemConfigData = {
  metadata: {
    name: 'D&D 5e',
    version: '1.0.0',
    description: 'Fifth Edition Dungeons & Dragons',
    author: 'Wizards of the Coast',
  },
  attributes: [
    {
      id: 'strength',
      name: 'Strength',
      abbreviation: 'STR',
      type: 'numeric' as const,
      min: 1,
      max: 20,
      default: 10,
    },
    {
      id: 'dexterity',
      name: 'Dexterity',
      abbreviation: 'DEX',
      type: 'numeric' as const,
      min: 1,
      max: 20,
      default: 10,
    },
  ],
  classes: [
    {
      id: 'fighter',
      name: 'Fighter',
      hitDice: 'd10',
      primaryAbility: 'strength',
    },
    {
      id: 'wizard',
      name: 'Wizard',
      hitDice: 'd6',
      primaryAbility: 'intelligence',
    },
  ],
  races: [
    {
      id: 'human',
      name: 'Human',
      size: 'Medium',
      speed: 30,
    },
    {
      id: 'elf',
      name: 'Elf',
      size: 'Medium',
      speed: 30,
    },
  ],
  skills: [
    {
      id: 'athletics',
      name: 'Athletics',
      ability: 'strength',
    },
    {
      id: 'arcana',
      name: 'Arcana',
      ability: 'intelligence',
    },
  ],
  formulas: {
    abilityModifier: 'floor((score - 10) / 2)',
    proficiencyBonus: 'ceil(level / 4) + 1',
  },
};

export const mockSystemSummary = {
  id: 'd&d5e',
  name: 'D&D 5e',
  version: '1.0.0',
  description: 'Fifth Edition Dungeons & Dragons',
  isDefault: true,
};

export const mockFullSystemConfig = {
  id: 'd&d5e',
  name: 'D&D 5e',
  version: '1.0.0',
  description: 'Fifth Edition Dungeons & Dragons',
  isDefault: true,
  config: mockSystemConfigData,
};

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    route = '/',
    path = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const store = configureStore({
    reducer: {
      character: characterReducer,
      party: partyReducer,
      auth: authReducer,
      system: systemReducer,
    },
    preloadedState: {
      character: {
        characters: [],
        selectedCharacter: null,
        loading: false,
        error: null,
        ...preloadedState.character,
      },
      party: {
        parties: [],
        selectedParty: null,
        loading: false,
        error: null,
        ...preloadedState.party,
      },
      auth: {
        user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        isAuthenticated: true,
        loading: false,
        error: null,
        ...preloadedState.auth,
      },
      system: {
        systems: [],
        selectedSystem: null,
        loading: false,
        error: null,
        ...preloadedState.system,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={children} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from '@testing-library/react';
