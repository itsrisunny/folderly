import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

const META = {
  success: { icon: CheckCircle2, title: 'Success', ms: 4500 },
  error: { icon: AlertCircle, title: 'Error', ms: 7000 },
  warning: { icon: AlertTriangle, title: 'Warning', ms: 6000 },
  info: { icon: Info, title: 'Information', ms: 4500 },
};

/*  toast.success('Saved')  |  toast.error('Failed', 'Custom title')  */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = (id) => setItems((x) => x.filter((i) => i.id !== id));
  const close = useCallback((id) => {
    setItems((x) => x.map((i) => (i.id === id ? { ...i, out: true } : i)));
    setTimeout(() => remove(id), 220);
  }, []);

  const push = useCallback((type, message, title) => {
    const id = Math.random().toString(36).slice(2);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setItems((x) => [...x.slice(-3), { id, type, message, title: title || META[type].title, time }]);
  }, []);

  const toast = useMemo(
    () => ({
      success: (m, t) => push('success', m, t),
      error: (m, t) => push('error', m, t),
      warning: (m, t) => push('warning', m, t),
      info: (m, t) => push('info', m, t),
    }),
    [push]
  );

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => {
          const I = META[t.type].icon;
          return (
            <div key={t.id} className={`toast ${t.type} ${t.out ? 'out' : ''}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <div className="toast-h">
                <I size={18} className="t-ico" /><b>{t.title}</b><small className="mut">{t.time}</small>
                <button className="icon-btn" aria-label="Dismiss" onClick={() => close(t.id)}><X size={14} /></button>
              </div>
              <div className="toast-b">{t.message}</div>
              <i className="t-prog" style={{ animationDuration: `${META[t.type].ms}ms` }} onAnimationEnd={() => close(t.id)} />
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
