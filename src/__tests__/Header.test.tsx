/**
 * Testes para o Header: exibição do nome e foto do usuário.
 * Garante que displayName segue a regra: settings.displayName || profile?.full_name || user?.email || "Usuário".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockOpenSettings = vi.fn();
vi.mock('../contexts/SettingsModalContext', () => ({
  useSettingsModal: () => ({
    openSettings: mockOpenSettings,
    isOpen: false,
  }),
}));

const mockUseAuth = vi.fn();
const mockUseUserSettings = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/UserSettingsContext', () => ({
  useUserSettings: () => mockUseUserSettings(),
}));

describe('Header - displayName e foto do usuário', () => {
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
      user: baseUser,
      profile: baseProfile,
      signOut: vi.fn(),
      isAdmin: false,
    });
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });
  });

  it('exibe displayName do settings no trigger quando definido', () => {
    mockUseUserSettings.mockReturnValue({
      settings: {
        displayName: 'Gustavo Rocha',
        avatarUrl: '',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      },
    });

    render(<Header />);

    expect(screen.getByText('Gustavo Rocha')).toBeInTheDocument();
  });

  it('exibe email no trigger quando settings.displayName e profile.full_name estão vazios', () => {
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });

    render(<Header />);

    expect(screen.getByText('usuario@test.com')).toBeInTheDocument();
  });

  it('exibe profile.full_name no trigger quando settings.displayName está vazio', () => {
    mockUseUserSettings.mockReturnValue({
      settings: { displayName: '', avatarUrl: '', language: 'pt-BR', timezone: 'America/Sao_Paulo' },
    });
    mockUseAuth.mockReturnValue({
      user: baseUser,
      profile: { ...baseProfile, full_name: 'Nome do Perfil' },
      signOut: vi.fn(),
      isAdmin: false,
    });

    render(<Header />);

    expect(screen.getByText('Nome do Perfil')).toBeInTheDocument();
  });

  it('não renderiza o menu quando user é null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      signOut: vi.fn(),
      isAdmin: false,
    });

    const { container } = render(<Header />);

    expect(container.firstChild).toBeNull();
  });
});
