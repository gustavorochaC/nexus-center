import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  // Buscar perfil do usuário (tentativa única, best effort)
  const fetchProfileOnce = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!isSupabaseAvailable) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('hub_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = "JSON object requested, multiple (or no) rows returned"
        // Isso significa que o perfil ainda não foi criado pelo trigger
        if (error.code === 'PGRST116') {
          console.warn('Auth: perfil ainda não existe para usuário', userId);
          // Tentar criar perfil manualmente se o trigger falhou
          // Isso pode acontecer se o trigger não executou corretamente
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              // Usar RPC ou insert direto com tipo any para contornar problema de tipos do Supabase
              const { error: insertError } = await (supabase
                .from('hub_profiles') as any)
                .insert({
                  id: userId,
                  email: userData.user.email || '',
                  role: 'user',
                  is_active: true,
                })
                .select()
                .single();
              
              if (!insertError) {
                console.log('Auth: perfil criado manualmente para usuário', userId);
                // Buscar o perfil recém-criado
                const { data: newProfile } = await supabase
                  .from('hub_profiles')
                  .select('*')
                  .eq('id', userId)
                  .single();
                return newProfile as Profile | null;
              }
            }
          } catch (createError) {
            console.error('Auth: erro ao tentar criar perfil manualmente:', createError);
          }
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

  // Atualizar perfil
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfileOnce(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfileOnce]);

  // Login
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseAvailable) {
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
      return { error: null };
    }

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
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    try {
      if (isSupabaseAvailable) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Erro ao fazer signOut no Supabase:', error);
    } finally {
      // Sempre limpar estado local, mesmo se o Supabase falhar
      setUser(null);
      setProfile(null);
      setSession(null);
    }
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

    let isMounted = true;

    console.log('Auth: iniciando inicialização...');

    // Supabase v2.39+ dispara INITIAL_SESSION automaticamente ao iniciar
    // Não precisamos chamar getSession() manualmente - o listener cuida de tudo
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth: mudança de estado:', event);

        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        // IMPORTANTE: Finalizar loading ANTES de buscar perfil
        // Isso garante que a UI responde mesmo se o fetch travar
        setIsLoading(false);

        // Buscar perfil em background (não bloqueia a UI)
        if (newSession?.user) {
          fetchProfileOnce(newSession.user.id).then(profileData => {
            if (isMounted) {
              setProfile(profileData);
            }
          }).catch(err => {
            console.error('Erro ao buscar perfil:', err);
          });
        } else {
          setProfile(null);
        }
      }
    );

    // Timeout de segurança caso o listener nunca dispare (conexão offline, etc)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth: safety timeout (10s) - finalizando loading');
        setIsLoading(false);
      }
    }, 10000);

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfileOnce]);


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
