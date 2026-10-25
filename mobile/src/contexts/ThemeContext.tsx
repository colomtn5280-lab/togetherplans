/**
 * ThemeContext — always light mode. Dark mode removed per product decision.
 */
import React, { createContext, useContext } from 'react';
import { palette } from '@/constants';

interface ThemeCtx {
  dark: boolean;
  colors: ReturnType<typeof palette>;
  override: 'light';
  setOverride: (v: string) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colors = palette(false); // always light

  return (
    <ThemeContext.Provider value={{ dark: false, colors, override: 'light', setOverride: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
