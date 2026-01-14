import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';

export interface UserSettings {
  displayName: string;
  language: 'pt-BR' | 'en-US' | 'es-ES';
  timezone: string;
  avatarUrl: string;
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateDisplayName: (name: string) => void;
  updateLanguage: (language: 'pt-BR' | 'en-US' | 'es-ES') => void;
  updateTimezone: (timezone: string) => void;
  updateAvatarUrl: (avatarUrl: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'user-settings';

const defaultSettings: UserSettings = {
  displayName: '',
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  avatarUrl: '',
};

// Função para carregar configurações do localStorage
const loadSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
  return defaultSettings;
};

// Função para salvar configurações no localStorage
const saveSettings = (settings: UserSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
};

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const lastSavedRef = useRef<string>(JSON.stringify(loadSettings()));

  // Carregar configurações ao montar
  useEffect(() => {
    const loaded = loadSettings();
    // Só atualizar se os valores forem diferentes
    setSettings((prev) => {
      const prevStr = JSON.stringify(prev);
      const loadedStr = JSON.stringify(loaded);
      if (prevStr !== loadedStr) {
        lastSavedRef.current = loadedStr;
        return loaded;
      }
      return prev;
    });
  }, []);

  // Salvar sempre que as configurações mudarem (apenas se realmente mudou)
  useEffect(() => {
    const currentStr = JSON.stringify(settings);
    if (currentStr !== lastSavedRef.current) {
      saveSettings(settings);
      lastSavedRef.current = currentStr;
    }
  }, [settings]);

  const updateDisplayName = useCallback((name: string) => {
    setSettings((prev) => ({ ...prev, displayName: name.trim() }));
  }, []);

  const updateLanguage = useCallback((language: 'pt-BR' | 'en-US' | 'es-ES') => {
    setSettings((prev) => ({ ...prev, language }));
  }, []);

  const updateTimezone = useCallback((timezone: string) => {
    setSettings((prev) => ({ ...prev, timezone }));
  }, []);

  const updateAvatarUrl = useCallback((avatarUrl: string) => {
    setSettings((prev) => ({ ...prev, avatarUrl }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const value: UserSettingsContextType = useMemo(() => ({
    settings,
    updateDisplayName,
    updateLanguage,
    updateTimezone,
    updateAvatarUrl,
    updateSettings,
  }), [settings, updateDisplayName, updateLanguage, updateTimezone, updateAvatarUrl, updateSettings]);

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  
  if (context === undefined) {
    throw new Error('useUserSettings deve ser usado dentro de um UserSettingsProvider');
  }
  
  return context;
}
