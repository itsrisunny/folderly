import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';
let token = null; // access token lives in memory only (never localStorage)
let refreshing = null;
let onExpire = () => {};
export const setOnExpire = (fn) => (onExpire = fn);
export const forgetSession = () => { token = null; };

const send = (path, { method = 'GET', body, form } = {}) => {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE}/api/v1${path}`, {
    method,
    headers,
    credentials: 'include', // sends the httpOnly refresh cookie
    body: form || (body ? JSON.stringify(body) : undefined),
  });
};

// Single-flight refresh: concurrent 401s share one refresh call
export function refreshSession() {
  refreshing ||= fetch(`${BASE}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return (token = null);
      token = j.data.accessToken;
      return j.data.user;
    })
    .catch(() => (token = null))
    .finally(() => (refreshing = null));
  return refreshing;
}

export async function api(path, opts = {}) {
  let res = await send(path, opts);
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    if (await refreshSession()) res = await send(path, opts);
    else onExpire();
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(json.message || 'Request failed');
    e.status = res.status;
    e.details = json.details;
    throw e;
  }
  return json;
}

export async function login(identifier, password) {
  const j = await api('/auth/login', { method: 'POST', body: { identifier, password } });
  token = j.data.accessToken;
  return j.data.user;
}

export async function logout(all = false) {
  try { await api(all ? '/auth/logout-all' : '/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  token = null;
}

export const errText = (e) =>
  e.details?.length ? `${e.message}: ${e.details.map((d) => `${d.path} ${d.message}`).join('; ')}` : e.message;

// useFetch('/path?x=1') -> { data, error, loading, reload }.  Pass null to skip.
export function useFetch(path) {
  const [s, set] = useState({ data: null, error: null, loading: !!path });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) { set({ data: null, error: null, loading: false }); return; }
    let off = false;
    set((x) => ({ ...x, loading: true, error: null }));
    api(path)
      .then((r) => !off && set({ data: r, error: null, loading: false }))
      .catch((e) => !off && set({ data: null, error: e.message, loading: false }));
    return () => { off = true; };
  }, [path, tick]);
  return { ...s, reload: () => setTick((t) => t + 1) };
}
