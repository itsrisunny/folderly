import { useEffect, useState } from 'react';

// Animates 0 -> target (ease-out cubic)
export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

// Polls GET /health every 30s -> 'checking' | 'online' | 'offline'
export function useHealth() {
  const [s, setS] = useState('checking');
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '';
    const ping = () => fetch(`${base}/health`).then((r) => setS(r.ok ? 'online' : 'offline')).catch(() => setS('offline'));
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, []);
  return s;
}
