import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type CopilotMode = 'conservative' | 'aggressive';

interface CopilotModeContextValue {
  copilotMode: CopilotMode;
  setCopilotMode: (mode: CopilotMode) => void;
}

const CopilotModeContext = createContext<CopilotModeContextValue | null>(null);

export function CopilotModeProvider({ children }: { children: ReactNode }) {
  const [copilotMode, setCopilotModeState] = useState<CopilotMode>('conservative');
  const setCopilotMode = useCallback((mode: CopilotMode) => {
    setCopilotModeState(mode);
  }, []);

  return (
    <CopilotModeContext.Provider value={{ copilotMode, setCopilotMode }}>
      {children}
    </CopilotModeContext.Provider>
  );
}

export function useCopilotMode(): CopilotModeContextValue {
  const ctx = useContext(CopilotModeContext);
  if (!ctx) {
    return {
      copilotMode: 'conservative',
      setCopilotMode: () => {},
    };
  }
  return ctx;
}
