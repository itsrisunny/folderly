import { createContext, useContext, useEffect, useState } from 'react';
import { forgetSession, login, logout, refreshSession, setOnExpire } from './api.js';
import { useToast } from './toast.jsx';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOnExpire(() => {
      setUser(null);
      toast.warning('Your session has expired. Please sign in again.', 'Session expired');
    });
    // restore the session on page load using the httpOnly refresh cookie
    refreshSession().then((u) => { setUser(u || null); setReady(true); });
  }, [toast]);

  const value = {
    user,
    ready,
    signIn: async (id, pw) => {
      const u = await login(id, pw);
      setUser(u);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`, 'Signed in');
    },
    signOut: async (all = false) => {
      await logout(all);
      setUser(null);
      toast.info(all ? 'You were signed out of all devices.' : 'You have been signed out.', 'Signed out');
    },
    endSession: () => { forgetSession(); setUser(null); }, // after password change (server revoked sessions)
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
