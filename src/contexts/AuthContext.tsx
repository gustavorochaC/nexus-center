import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configurações de retry para busca de perfil
const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 200,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

// Helper para delay com Promise
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref para rastrear se é um novo registro (para aplicar retry)
  const isNewSignUpRef = useRef(false);

  const isAdmin = profile?.role === 'admin';

  // Buscar perfil do usuário (tentativa única)
  const fetchProfileOnce = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!isSupabaseAvailable) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .schema('Hub_Flex')
        .from('hub_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = "JSON object requested, multiple (or no) rows returned"
        // Isso significa que o perfil ainda não foi criado pelo trigger
        if (error.code === 'PGRST116') {
          console.log('Auth: perfil ainda não existe (aguardando trigger)');
          return null;
        }
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }, []);

  // Buscar perfil com retry (para após registro)
  const fetchProfileWithRetry = useCallback(async (userId: string): Promise<Profile | null> => {
    let currentDelay = RETRY_CONFIG.initialDelayMs;
    
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      console.log(`Auth: tentativa ${attempt}/${RETRY_CONFIG.maxAttempts} de buscar perfil...`);
      
      const profileData = await fetchProfileOnce(userId);
      
      if (profileData) {
        console.log(`Auth: perfil encontrado na tentativa ${attempt}`);
        return profileData;
      }
      
      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < RETRY_CONFIG.maxAttempts) {
        console.log(`Auth: aguardando ${currentDelay}ms antes da próxima tentativa...`);
        await delay(currentDelay);
        currentDelay = Math.min(
          currentDelay * RETRY_CONFIG.backoffMultiplier, 
          RETRY_CONFIG.maxDelayMs
        );
      }
    }
    
    console.warn('Auth: não foi possível obter o perfil após todas as tentativas');
    return null;
  }, [fetchProfileOnce]);

  // Buscar perfil (decide se usa retry ou não)
  const fetchProfile = useCallback(async (userId: string, forceRetry = false): Promise<Profile | null> => {
    const shouldRetry = forceRetry || isNewSignUpRef.current;
    
    if (shouldRetry) {
      console.log('Auth: buscando perfil com retry (novo registro detectado)');
      const result = await fetchProfileWithRetry(userId);
      isNewSignUpRef.current = false; // Reset após busca
      return result;
    }
    
    return fetchProfileOnce(userId);
  }, [fetchProfileOnce, fetchProfileWithRetry]);

  // Atualizar perfil
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, true);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  // Login
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseAvailable) {
      // Sem Supabase, não faz nada mas retorna sucesso para não quebrar a UI
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // Registro
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseAvailable) {
      // Sem Supabase, não faz nada mas retorna sucesso para não quebrar a UI
      return { error: null };
    }

    try {
      // Marcar que é um novo registro para ativar retry na busca de perfil
      isNewSignUpRef.current = true;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        isNewSignUpRef.current = false; // Reset em caso de erro
        return { error };
      }

      return { error: null };
    } catch (error) {
      isNewSignUpRef.current = false; // Reset em caso de erro
      return { error: error as Error };
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    if (isSupabaseAvailable) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // Atualizar email
  const updateEmail = useCallback(async (newEmail: string) => {
    if (!isSupabaseAvailable) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // Atualizar senha
  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!isSupabaseAvailable) {
      return { error: null };
    }

    try {
      // Verificar senha atual fazendo login
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          return { error: new Error('Senha atual incorreta') };
        }
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user?.email]);

  // Inicializar e escutar mudanças de autenticação
  useEffect(() => {
    // Se Supabase não estiver disponível, apenas finalizar loading
    if (!isSupabaseAvailable) {
      setIsLoading(false);
      return;
    }

    // Buscar sessão inicial
    const initializeAuth = async () => {
      console.log('Auth: iniciando inicialização...');
      
      // Safety timeout - garante que o loading termine em no máximo 5 segundos
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Auth: timeout de inicialização atingido, forçando fim do loading');
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth: erro ao buscar sessão:', error);
          throw error;
        }

        console.log('Auth: sessão obtida:', currentSession ? 'Sim' : 'Não');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          console.log('Auth: buscando perfil...');
          const profileData = await fetchProfile(currentSession.user.id);
          console.log('Auth: perfil obtido:', profileData ? 'Sim' : 'Não');
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        console.log('Auth: finalizando inicialização');
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth: mudança de estado:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Se é um SIGNED_IN após registro, usar retry
          // O evento SIGNED_UP indica que o usuário acabou de se registrar
          const isSignUp = event === 'SIGNED_UP' || isNewSignUpRef.current;
          
          if (isSignUp) {
            console.log('Auth: novo registro detectado, usando retry para buscar perfil');
            // Pequeno delay inicial para dar tempo ao trigger
            await delay(300);
          }
          
          const profileData = await fetchProfile(newSession.user.id, isSignUp);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

