import React, {createContext, useContext, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';
import {darkPalette, lightPalette} from '../config/theme';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({children}) => {
  const systemScheme = useColorScheme();
  const initialMode = systemScheme === 'light' ? 'light' : 'dark';
  const [mode, setMode] = useState(initialMode);

  const colors = useMemo(() => (mode === 'dark' ? darkPalette : lightPalette), [mode]);
  const isDark = mode === 'dark';

  const toggleTheme = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

  const value = useMemo(() => ({
    mode,
    isDark,
    colors,
    toggleTheme,
    setTheme: setMode
  }), [mode, isDark, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
