import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemsManagementPage } from './SystemsManagementPage';
import { renderWithProviders, mockSystemSummary, mockSystemConfigData } from '../test/test-utils';
import * as systemSlice from '../store/systemSlice';

// Mock the dispatch function
const mockDispatch = vi.fn();

// Mock useAppDispatch
vi.mock('../store/hooks', async () => {
  const actual = await vi.importActual('../store/hooks');
  return {
    ...actual,
    useAppDispatch: () => mockDispatch,
  };
});

// Mock URL and blob creation
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('SystemsManagementPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();

    mockDispatch.mockImplementation((action: any) => {
      if (typeof action === 'function') {
        return action(mockDispatch, () => ({}));
      }
      return Promise.resolve({ type: action.type });
    });
  });

  describe('rendering', () => {
    it('should render the page title', () => {
      renderWithProviders(<SystemsManagementPage />);
      expect(screen.getByText('System Configuration Management')).toBeInTheDocument();
    });

    it('should render Create New System button', () => {
      renderWithProviders(<SystemsManagementPage />);
      expect(screen.getByRole('link', { name: /create new system/i })).toBeInTheDocument();
    });

    it('should render Import System button', () => {
      renderWithProviders(<SystemsManagementPage />);
      expect(screen.getByRole('button', { name: /import system/i })).toBeInTheDocument();
    });

    it('should dispatch fetchSystems on mount', () => {
      renderWithProviders(<SystemsManagementPage />);
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [],
            selectedSystem: null,
            loading: true,
            error: null,
          },
        },
      });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when error exists', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [],
            selectedSystem: null,
            loading: false,
            error: 'Failed to load systems',
          },
        },
      });

      expect(screen.getByText('Failed to load systems')).toBeInTheDocument();
    });
  });

  describe('systems table', () => {
    it('should render systems in table', () => {
      const customSystem = {
        ...mockSystemSummary,
        id: 'custom-system',
        name: 'Custom System',
        isDefault: false,
      };

      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary, customSystem],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('D&D 5e')).toBeInTheDocument();
      expect(screen.getByText('Custom System')).toBeInTheDocument();
    });

    it('should show Default chip for default systems', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should display system version and description', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Fifth Edition Dungeons & Dragons')).toBeInTheDocument();
    });

    it('should display system ID as code', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      const codeElement = screen.getByText('d&d5e');
      expect(codeElement.tagName).toBe('CODE');
    });

    it('should display dash for missing description', () => {
      const systemNoDesc = {
        ...mockSystemSummary,
        description: undefined,
      };

      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [systemNoDesc],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      const cells = screen.getAllByRole('cell');
      const dashCell = cells.find((cell) => cell.textContent === '-');
      expect(dashCell).toBeInTheDocument();
    });

    it('should render action buttons for systems', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      expect(screen.getByTitle('Export')).toBeInTheDocument();
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('should handle export when clicking export button', async () => {
      mockDispatch.mockResolvedValueOnce({
        type: systemSlice.exportSystem.fulfilled.type,
        payload: {
          id: 'd&d5e',
          name: 'D&D 5e',
          version: '1.0.0',
          config: mockSystemConfigData,
          exportedAt: '2024-01-20T10:00:00Z',
        },
      });

      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      const exportButton = screen.getByTitle('Export');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('table structure', () => {
    it('should have proper table headers', () => {
      renderWithProviders(<SystemsManagementPage />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render table with correct structure', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const rows = screen.getAllByRole('row');
      // 1 header row + 1 data row
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('navigation links', () => {
    it('should have link to create new system page', () => {
      renderWithProviders(<SystemsManagementPage />);

      const createButton = screen.getByRole('link', { name: /create new system/i });
      expect(createButton).toHaveAttribute('href', '/systems/new');
    });

    it('should have link to edit system page for each system', () => {
      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems: [mockSystemSummary],
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      const editButton = screen.getByTitle('Edit');
      expect(editButton).toHaveAttribute('href', '/systems/d&d5e/edit');
    });
  });

  describe('multiple systems', () => {
    it('should render multiple systems correctly', () => {
      const systems = [
        mockSystemSummary,
        {
          id: 'pathfinder2e',
          name: 'Pathfinder 2e',
          version: '2.0.0',
          description: 'Second edition',
          isDefault: false,
        },
        {
          id: 'custom',
          name: 'Custom System',
          version: '1.0.0',
          isDefault: false,
        },
      ];

      renderWithProviders(<SystemsManagementPage />, {
        preloadedState: {
          system: {
            systems,
            selectedSystem: null,
            loading: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('D&D 5e')).toBeInTheDocument();
      expect(screen.getByText('Pathfinder 2e')).toBeInTheDocument();
      expect(screen.getByText('Custom System')).toBeInTheDocument();

      // Should have 3 export buttons (one for each system)
      const exportButtons = screen.getAllByTitle('Export');
      expect(exportButtons).toHaveLength(3);
    });
  });
});
