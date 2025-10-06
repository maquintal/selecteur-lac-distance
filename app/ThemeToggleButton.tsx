'use client';

import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from './ThemeProvider';
import { useEffect, useState } from 'react';

export function ThemeToggleButton() {
  const { mode, toggleTheme } = useThemeMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <IconButton color="inherit"><Brightness7 /></IconButton>;
  }

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}