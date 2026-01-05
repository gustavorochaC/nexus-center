import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  // Buscar perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .schema('hub')
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  // Atualizar perfil
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Login
  const signIn = async (email: string, password: string) => {
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
  };

  // Registro
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
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
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Inicializar e escutar mudanças de autenticação
  useEffect(() => {
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
          const profileData = await fetchProfile(newSession.user.id);
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

