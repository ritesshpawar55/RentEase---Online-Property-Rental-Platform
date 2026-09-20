import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('rentease_theme') || 'light',
  setTheme: (theme) => {
    localStorage.setItem('rentease_theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const currentTheme = localStorage.getItem('rentease_theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('rentease_theme', nextTheme);
    set({ theme: nextTheme });
  }
}));
