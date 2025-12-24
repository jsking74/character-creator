import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockCharacter } from '../test/test-utils';
import { EditCharacterPage } from './EditCharacterPage';

// Mock the useCharacter hook
const mockFetchCharacterById = vi.fn();
const mockUpdateCharacter = vi.fn();

vi.mock('../hooks/useCharacter', () => ({
  useCharacter: () => ({
    selectedCharacter: mockCharacter,
    loading: false,
    error: null,
    fetchCharacterById: mockFetchCharacterById,
    updateCharacter: mockUpdateCharacter,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '123e4567-e89b-12d3-a456-426614174000' }),
  };
});

describe('EditCharacterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateCharacter.mockReturnValue({
      unwrap: () => Promise.resolve(mockCharacter),
    });
  });

  it('renders the edit form with character data', async () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/character name/i)).toHaveValue('Test Character');
    });
  });

  it('displays the character name in the header', () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    expect(screen.getByText(/Editing: Test Character/)).toBeInTheDocument();
  });

  it('renders all ability score fields', async () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/strength/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dexterity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/constitution/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/intelligence/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wisdom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/charisma/i)).toBeInTheDocument();
    });
  });

  it('renders health fields', async () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/max hp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current hp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/temp hp/i)).toBeInTheDocument();
    });
  });

  it('renders gold field', async () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/gold/i)).toBeInTheDocument();
    });
  });

  it('renders backstory textarea', () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    expect(screen.getByPlaceholderText(/write your character's backstory/i)).toBeInTheDocument();
  });

  it('renders public toggle switch', () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    expect(screen.getByLabelText(/make this character public/i)).toBeInTheDocument();
  });

  it('allows editing character name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    const nameInput = screen.getByLabelText(/character name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    expect(nameInput).toHaveValue('New Name');
  });

  it('navigates back to character view when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/characters/123e4567-e89b-12d3-a456-426614174000'
    );
  });

  it('navigates back when Back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    const backButton = screen.getByRole('button', { name: /back to character/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/characters/123e4567-e89b-12d3-a456-426614174000'
    );
  });

  it('calls updateCharacter when Save button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateCharacter).toHaveBeenCalled();
    });
  });

  it('shows success message after successful save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/character saved successfully/i)).toBeInTheDocument();
    });
  });

  it('fetches character on mount', () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    expect(mockFetchCharacterById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  it('disables system field (cannot change after creation)', () => {
    renderWithProviders(<EditCharacterPage />, {
      route: '/characters/123e4567-e89b-12d3-a456-426614174000/edit',
      path: '/characters/:id/edit',
    });

    const systemField = screen.getByLabelText(/system/i);
    expect(systemField).toBeDisabled();
  });
});
