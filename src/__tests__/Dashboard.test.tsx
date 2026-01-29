/**
 * Testes para o Dashboard: mensagem "Bem vindo de volta" usa o mesmo displayName do Header.
 * Garante que displayName = settings.displayName || profile?.full_name || user?.email || "Usuário".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';

vi.mock('../components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
vi.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));
vi.mock('../pages/Settings', () => ({
  default: () => null,
}));

const mockUseAuth = vi.fn();
const mockUseUserSettings = vi.fn();
const mockUseSettingsModal = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/UserSettingsContext', () => ({
  useUserSettings: () => mockUseUserSettings(),
}));

vi.mock('../contexts/SettingsModalContext', () => ({
  useSettingsModal: () => mockUseSettingsModal(),
}));

vi.mock('../services/permissions', () => ({
  getUserAppsWithPermissions: vi.fn().mockResolvedValue([]),
}));

describe('Dashboard - Bem vindo de volta com displayName', () => {
  const baseUser = {
    id: 'user-1',
    email: 'usuario@test.com',
  };

  const baseProfile = {
    id: 'user-1',
    email: 'usuario@test.com',
    role: 'user' as const,
    is_active: true,
    created_at: '',
    updated_at: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      profile: baseProfile,
      user: baseUser,
      isLoading: false,
    });
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });
    mockUseSettingsModal.mockReturnValue({
      isOpen: false,
      closeSettings: vi.fn(),
    });
  });

  it('exibe "Bem vindo de volta" com displayName do settings quando definido', async () => {
    mockUseUserSettings.mockReturnValue({
      settings: {
        displayName: 'Gustavo Rocha',
        avatarUrl: '',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Bem vindo de volta, Gustavo Rocha/)).toBeInTheDocument();
    });
  });

  it('exibe "Bem vindo de volta" com email quando settings.displayName está vazio', async () => {
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Bem vindo de volta, usuario@test.com/)).toBeInTheDocument();
    });
  });

  it('exibe "Bem vindo de volta" com profile.full_name quando settings.displayName está vazio', async () => {
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });
    mockUseAuth.mockReturnValue({
      profile: { ...baseProfile, full_name: 'Nome do Perfil' },
      user: baseUser,
      isLoading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Bem vindo de volta, Nome do Perfil/)).toBeInTheDocument();
    });
  });

  it('exibe "Bem vindo de volta, Usuário" quando não há displayName nem perfil nem email', async () => {
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });
    mockUseAuth.mockReturnValue({
      profile: null,
      user: { id: 'user-1', email: '' },
      isLoading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Bem vindo de volta, Usuário/)).toBeInTheDocument();
    });
  });
});
