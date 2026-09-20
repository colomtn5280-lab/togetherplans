/**
 * ThemeContext — provides dark/light palette throughout the app.
 * Mobile follows system (useColorScheme). Override via Profile > Appearance.
 * Override is persisted to AsyncStorage so it survives app restarts.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '@/constants';

type ThemeOverride = 'system' | 'light' | 'dark';

interface ThemeCtx {
  dark: boolean;
  colors: ReturnType<typeof palette>;
  override: ThemeOverride;
  setOverride: (v: ThemeOverride) => void;
}

const THEME_KEY = 'theme_override';

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverrideState] = useState<ThemeOverride>('system');
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setOverrideState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setOverride = (v: ThemeOverride) => {
    setOverrideState(v);
    AsyncStorage.setItem(THEME_KEY, v);
  };

  const dark = override === 'system' ? system === 'dark' : override === 'dark';
  const colors = palette(dark);

  // Don't render until we've loaded the stored preference
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ dark, colors, override, setOverride }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
