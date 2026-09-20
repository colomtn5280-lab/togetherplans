/**
 * ThemeContext — provides dark/light palette throughout the app.
 * Mobile follows system (useColorScheme). Override via Profile > Appearance.
 */
import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { palette } from '@/constants';

type ThemeOverride = 'system' | 'light' | 'dark';

interface ThemeCtx {
  dark: boolean;
  colors: ReturnType<typeof palette>;
  override: ThemeOverride;
  setOverride: (v: ThemeOverride) => void;
}

const ThemeContext = createContext<ThemeCtx>({} as ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeOverride>('system');
  const dark = override === 'system' ? system === 'dark' : override === 'dark';
  const colors = palette(dark);

  return (
    <ThemeContext.Provider value={{ dark, colors, override, setOverride }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
