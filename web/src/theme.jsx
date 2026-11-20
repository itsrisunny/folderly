import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
export const useTheme = () => useContext(Ctx);
const dark = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('folderly:theme') || 'system'); // system | light | dark
  useEffect(() => {
    const apply = () => { document.documentElement.dataset.theme = mode === 'system' ? (dark().matches ? 'dark' : 'light') : mode; };
    apply();
    localStorage.setItem('folderly:theme', mode);
    const m = dark();
    m.addEventListener('change', apply);
    return () => m.removeEventListener('change', apply);
  }, [mode]);
  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}
