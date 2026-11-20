import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3, ChevronDown, FolderLock, Heart, LayoutDashboard, LogOut, Maximize, Menu, Minimize, Monitor, Moon, Search,
  Sun, UploadCloud, UserCog, Users,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import { useHealth } from '../hooks.js';
import { initials } from './ui.jsx';

const SECTIONS = [
  { title: 'Main', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/uploads', label: 'Uploads', icon: UploadCloud },
  ] },
  { title: 'Administration', admin: true, items: [
    { to: '/users', label: 'Users', icon: Users },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ] },
  { title: 'Account', items: [{ to: '/profile', label: 'Profile', icon: UserCog }] },
];
const MODES = [['system', Monitor], ['light', Sun], ['dark', Moon]];
const STATUS = { online: 'System online', offline: 'API unreachable', checking: 'Checking…' };
const isMobile = () => window.innerWidth <= 1000;

export default function Layout() {
  const { user, signOut } = useAuth();
  const { mode, setMode } = useTheme();
  const health = useHealth();
  const loc = useLocation();
  const admin = user.role === 'admin';
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [full, setFull] = useState(false);
  const menuRef = useRef();

  const sections = SECTIONS.filter((s) => !s.admin || admin)
    .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())) }))
    .filter((s) => s.items.length);
  const all = SECTIONS.flatMap((s) => s.items);
  const current = all.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)));
  const ThemeIcon = MODES.find(([m]) => m === mode)[1];

  useEffect(() => { setOpen(false); setMenu(false); }, [loc.pathname]);
  useEffect(() => { document.title = `${current?.label || 'Folderly'} · Folderly`; }, [current]);
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const toggleSide = () => (isMobile() ? setOpen((o) => !o) : setCollapsed((c) => !c));
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  const cycleTheme = () => setMode(MODES[(MODES.findIndex(([m]) => m === mode) + 1) % 3][0]);

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      {/* ===== Sidebar ===== */}
      <aside className={`rail ${open ? 'open' : ''}`}>
        <div className="rail-brand">
          <span className="logo"><FolderLock size={20} /></span>
          <div className="lbl"><b>Folderly</b><small>Secure file workspace</small></div>
        </div>

        <div className="rail-user">
          <span className="avatar">{initials(user.name)}<i className="presence" /></span>
          <div className="lbl"><b className="trunc block">{user.name}</b><small className="role">{user.role}</small></div>
        </div>

        <div className="rail-search lbl">
          <Search size={15} /><input placeholder="Search menu…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search menu" />
        </div>

        <nav>
          {sections.map((s) => (
            <div key={s.title}>
              <div className="nav-h">{s.title}</div>
              {s.items.map(({ to, label, icon: I, end }) => (
                <NavLink key={to} to={to} end={end} title={label}>
                  <span className="ni"><I size={17} /></span><span className="lbl">{label}</span>
                  {s.admin && <span className="lbl nav-badge">Admin</span>}
                </NavLink>
              ))}
            </div>
          ))}
          {!sections.length && <p className="mut nav-empty">No menu matches “{q}”.</p>}
        </nav>

        <div className="rail-foot">
          <div className={`status ${health}`} title={STATUS[health]}><i /><span className="lbl">{STATUS[health]}</span></div>
          <button className="signout" onClick={() => signOut()} title="Sign out"><LogOut size={16} /><span className="lbl">Sign out</span></button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="wrap">
        <header className="navbar">
          <button className="icon-btn" aria-label="Toggle sidebar" onClick={toggleSide}><Menu size={20} /></button>
          <nav className="nav-links">
            <Link to="/">Home</Link><Link to="/uploads">Uploads</Link>{admin && <Link to="/reports">Reports</Link>}
          </nav>
          <span className="grow" />
          <button className="icon-btn" title="Toggle fullscreen" aria-label="Toggle fullscreen" onClick={toggleFull}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button>
          <button className="icon-btn" title={`Theme: ${mode}`} aria-label="Change theme" onClick={cycleTheme}><ThemeIcon size={18} /></button>
          <div className="dropdown" ref={menuRef}>
            <button className="user-btn" onClick={() => setMenu(!menu)} aria-expanded={menu}>
              <span className="avatar sm">{initials(user.name)}</span>
              <span className="uname">{user.name.split(' ')[0]}</span><ChevronDown size={14} />
            </button>
            {menu && (
              <div className="menu">
                <div className="menu-h"><span className="avatar lg">{initials(user.name)}</span><b>{user.name}</b><small className="mut">{user.email}</small></div>
                <Link to="/profile"><UserCog size={15} />My profile</Link>
                <button onClick={cycleTheme}><ThemeIcon size={15} />Theme: {mode}</button>
                <button className="danger" onClick={() => signOut()}><LogOut size={15} />Sign out</button>
              </div>
            )}
          </div>
        </header>

        <main className="content"><div className="page" key={loc.pathname}><Outlet /></div></main>

        <footer className="footer">
          <span>© {new Date().getFullYear()} <b>Folderly</b>. All rights reserved.</span>
          <span className="mut">Made with <Heart size={12} className="heart" /> · v{__APP_VERSION__} · <span className={`dotline ${health}`}>{STATUS[health]}</span></span>
        </footer>
      </div>
    </div>
  );
}
