import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SettingsModalContextType {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | undefined>(undefined);

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSettings = useCallback(() => {
    setIsOpen(true);
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
    // Restaurar scroll do body
    document.body.style.overflow = '';
  }, []);

  return (
    <SettingsModalContext.Provider value={{ isOpen, openSettings, closeSettings }}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  
  if (context === undefined) {
    throw new Error('useSettingsModal deve ser usado dentro de um SettingsModalProvider');
  }
  
  return context;
}
