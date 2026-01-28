/**
 * Testes para AuthContext - Criação de Perfil
 * 
 * Testa:
 * - Criação automática de perfil quando não existe
 * - Fallback para criar perfil manualmente se trigger falhar
 * - Busca de perfil existente
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseAvailable: true,
}));

describe('AuthContext - Criação de Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProfileOnce', () => {
    it('deve criar perfil manualmente se não existir (trigger falhou)', async () => {
      const userId = 'test-user-id';
      const userEmail = 'teste@exemplo.com';

      // Mock: perfil não existe (erro PGRST116)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      // Mock: getUser retorna usuário
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: userEmail,
          },
        },
        error: null,
      });

      // Mock: insert cria perfil
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: userId,
          email: userEmail,
          role: 'user',
          is_active: true,
        },
        error: null,
      });

      // Mock: busca perfil recém-criado
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: userId,
          email: userEmail,
          role: 'user',
          is_active: true,
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          id: userId,
          email: userEmail,
          role: 'user',
          is_active: true,
        });
      });
    });

    it('deve retornar perfil existente sem tentar criar', async () => {
      const userId = 'existing-user-id';
      const existingProfile = {
        id: userId,
        email: 'existing@exemplo.com',
        role: 'user',
        is_active: true,
      };

      mockSupabase.single.mockResolvedValue({
        data: existingProfile,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(mockSupabase.insert).not.toHaveBeenCalled();
      });
    });
  });
});
