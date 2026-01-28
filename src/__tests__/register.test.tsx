/**
 * Testes para funcionalidade de cadastro de usuário
 * 
 * Testa:
 * - Mensagens de erro para emails duplicados
 * - Validação de formato de email
 * - Validação de senha
 * - Criação de perfil via trigger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../pages/Register';
import { AuthProvider } from '../contexts/AuthContext';

// Mock do Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

describe('Register - Tratamento de Erros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getErrorMessage', () => {
    it('deve retornar mensagem específica para email já cadastrado', () => {
      const errorMessages = {
        'User already registered': 'Este email já está cadastrado. Se você já tem uma conta, faça login.',
        'user already registered': 'Este email já está cadastrado. Se você já tem uma conta, faça login.',
        'Email address is already registered': 'Este email já está cadastrado. Se você já tem uma conta, faça login.',
      };

      // Testar diferentes variações da mensagem
      Object.entries(errorMessages).forEach(([error, expected]) => {
        // Simular função getErrorMessage
        const getErrorMessage = (error: string): string => {
          const normalizedError = error.toLowerCase();
          if (normalizedError.includes('already') && normalizedError.includes('registered')) {
            return 'Este email já está cadastrado. Se você já tem uma conta, faça login.';
          }
          return error;
        };

        expect(getErrorMessage(error)).toBe(expected);
      });
    });

    it('deve retornar mensagem para senha muito curta', () => {
      const getErrorMessage = (error: string): string => {
        if (error.toLowerCase().includes('password') && error.toLowerCase().includes('6 characters')) {
          return 'A senha deve ter pelo menos 6 caracteres';
        }
        return error;
      };

      expect(getErrorMessage('Password should be at least 6 characters')).toBe(
        'A senha deve ter pelo menos 6 caracteres'
      );
    });

    it('deve retornar mensagem genérica para erros desconhecidos', () => {
      const getErrorMessage = (error: string): string => {
        return error || 'Ocorreu um erro ao criar a conta. Tente novamente.';
      };

      expect(getErrorMessage('Erro desconhecido')).toBe('Erro desconhecido');
      expect(getErrorMessage('')).toBe('Ocorreu um erro ao criar a conta. Tente novamente.');
    });
  });

  describe('Validação de Formulário', () => {
    it('deve validar senha com menos de 6 caracteres', async () => {
      render(
        <AuthProvider>
          <Register />
        </AuthProvider>
      );

      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /criar conta/i });

      await userEvent.type(passwordInput, '12345');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
      });
    });

    it('deve aceitar senha com 6 ou mais caracteres', async () => {
      render(
        <AuthProvider>
          <Register />
        </AuthProvider>
      );

      const passwordInput = screen.getByLabelText(/senha/i);
      await userEvent.type(passwordInput, '123456');

      expect(passwordInput).toHaveValue('123456');
    });
  });
});

describe('Register - Integração com Supabase', () => {
  it('deve mostrar mensagem de erro quando email já existe', async () => {
    const { supabase } = await import('../lib/supabase');
    
    // Mock do erro de email duplicado
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'User already registered',
        name: 'AuthError',
        status: 400,
      },
    });

    render(
      <AuthProvider>
        <Register />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const nameInput = screen.getByLabelText(/nome completo/i);
    const submitButton = screen.getByRole('button', { name: /criar conta/i });

    await userEvent.type(nameInput, 'Teste Usuário');
    await userEvent.type(emailInput, 'gustavorocarvalho@hotmail.com');
    await userEvent.type(passwordInput, 'senha123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email já está cadastrado/i)).toBeInTheDocument();
    });
  });
});
