import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { AlertTriangle, ArrowRightCircle, Check, Circle, File, FileImage, FileSpreadsheet, FileText, Home, Inbox, RefreshCw, X } from 'lucide-react';
import { useCountUp } from '../hooks.js';

/* ---------- formatters ---------- */
export const fmtBytes = (n = 0) => {
  if (n < 1024) return `${Math.round(n)} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${u[i]}`;
};
export const fmtDate = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
export const TYPES = {
  'application/pdf': 'PDF', 'image/png': 'PNG', 'image/jpeg': 'JPG', 'text/csv': 'CSV',
  'application/vnd.ms-excel': 'CSV', 'text/plain': 'TXT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};
export const typeLabel = (m) => TYPES[m] || m;
export const sinceDays = (days) => new Date(Date.now() - (days - 1) * 864e5).toLocaleDateString('en-CA');
export const initials = (n = '?') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const FileIcon = ({ mime, name, size = 18 }) => {
  const t = mime ? typeLabel(mime) : (name || '').split('.').pop().toUpperCase();
  const I = ['PNG', 'JPG', 'JPEG'].includes(t) ? FileImage : ['CSV', 'XLSX'].includes(t) ? FileSpreadsheet : ['PDF', 'DOCX', 'TXT'].includes(t) ? FileText : File;
  return <I size={size} />;
};

/* ---------- layout primitives ---------- */
const glow = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export const Card = ({ cls = '', tone, title, icon: Icon, right, children }) => (
  <section className={`card ${tone ? `outline o-${tone}` : ''} ${cls}`} onMouseMove={glow}>
    {(title || right) && (
      <header className="card-h">
        <h3>{Icon && <Icon size={16} />}{title}</h3>{right}
      </header>
    )}
    {children}
  </section>
);

export const Spark = ({ data }) => {
  if (data.length < 2) return null;
  const w = 90, h = 28, max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 5) - 2}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline pathLength="1" points={pts} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const useShown = (value, format) => {
  const isNum = typeof value === 'number';
  const n = useCountUp(isNum ? value : 0);
  return isNum ? (format ? format(n) : Math.round(n).toLocaleString()) : value;
};

// AdminLTE "small-box": solid gradient KPI with a big faded icon and a footer link
export function SmallBox({ label, value, format, icon: Icon, tone = 'indigo', to, more = 'More info', sub, spark }) {
  const shown = useShown(value, format);
  return (
    <section className={`smallbox g-${tone}`}>
      <div className="sb-body"><b className="big">{shown}</b><span>{label}</span></div>
      {Icon && <Icon className="sb-ico" size={84} strokeWidth={1.4} />}
      {spark && <Spark data={spark} />}
      {to ? <Link to={to} className="sb-foot">{more} <ArrowRightCircle size={14} /></Link> : <div className="sb-foot static">{sub || '\u00a0'}</div>}
    </section>
  );
}

// AdminLTE "info-box": colored icon block + label + number
export function InfoBox({ label, value, format, sub, icon: Icon, tone = 'indigo', cls = '' }) {
  const shown = useShown(value, format);
  return (
    <section className={`infobox ${cls}`}>
      <span className={`ib-ico g-${tone}`}>{Icon && <Icon size={26} />}</span>
      <div className="ib-body"><span className="mut">{label}</span><b className="big">{shown}</b>{sub && <small className="mut">{sub}</small>}</div>
    </section>
  );
}
export const Stat = InfoBox;

export const Badge = ({ tone = 'gray', children }) => <span className={`badge ${tone}`}>{children}</span>;
export const Skeleton = ({ h = 20, w = '100%' }) => <div className="skel" style={{ height: h, width: w }} />;

export const BentoSkeleton = () => (
  <div className="bento">
    {[0, 1, 2, 3].map((i) => <div key={i} className="card"><Skeleton h={34} w="50%" /><div style={{ height: 12 }} /><Skeleton h={14} w="70%" /></div>)}
    <div className="card s3"><Skeleton h={16} w="30%" /><div style={{ height: 14 }} /><Skeleton h={230} /></div>
    <div className="card"><Skeleton h={230} /></div>
    <div className="card s4"><Skeleton h={150} /></div>
  </div>
);

export const Empty = ({ icon: Icon = Inbox, title = 'Nothing here yet', text, children }) => (
  <div className="empty"><span className="ico"><Icon size={22} /></span><b>{title}</b>{text && <p className="mut">{text}</p>}{children}</div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="empty err-state">
    <span className="ico"><AlertTriangle size={22} /></span><b>Couldn’t load data</b><p className="mut">{message}</p>
    {onRetry && <button className="btn sm" onClick={onRetry}><RefreshCw size={14} />Retry</button>}
  </div>
);

export const PageHead = ({ title, sub, children }) => (
  <div className="head">
    <div>
      <h1>{title}</h1>
      <ol className="crumbs"><li><Home size={13} />Home</li><li>{title}</li></ol>
      {sub && <p className="mut sub">{sub}</p>}
    </div>
    <div className="row">{children}</div>
  </div>
);

export const RangeSelect = ({ days, setDays }) => (
  <div className="seg" role="tablist">
    {[[7, '7D'], [30, '30D'], [90, '90D'], [365, '1Y']].map(([d, l]) => (
      <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{l}</button>
    ))}
  </div>
);

export const Err = ({ children }) => (children ? <p className="alert"><AlertTriangle size={15} />{children}</p> : null);

export const Pager = ({ page, setPage, meta }) =>
  meta && meta.pages > 1 ? (
    <div className="pager">
      <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
      <span className="mut">Page {page} of {meta.pages} · {meta.total} total</span>
      <button className="btn ghost sm" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  ) : null;

/* ---------- overlays ---------- */
function useEsc(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
}

export function Modal({ open, title, onClose, children }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header><h3>{title}</h3><button className="icon-btn" aria-label="Close" onClick={onClose}><X size={16} /></button></header>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, title, onClose, children }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay right" onMouseDown={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button></header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}

/* ---------- charts ---------- */
const PALETTE = ['#5b5bf0', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
const tip = { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--ink)', fontSize: 13 };

export const DayChart = ({ data }) =>
  data.length ? (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ left: 0, right: 6, top: 10 }}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b5bf0" stopOpacity=".38" />
            <stop offset="100%" stopColor="#5b5bf0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
        <Tooltip contentStyle={tip} cursor={{ stroke: 'var(--line)' }} />
        <Area type="monotone" dataKey="files" name="Files" stroke="#5b5bf0" strokeWidth={2.5} fill="url(#area)" animationDuration={1100} />
      </AreaChart>
    </ResponsiveContainer>
  ) : <Empty title="No uploads in this range" text="Try a longer range." />;

export const Donut = ({ rows }) => {
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!rows.length) return <Empty title="No files yet" />;
  return (
    <div className="donut">
      <div className="donut-c">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="label" innerRadius={54} outerRadius={80} paddingAngle={2} stroke="none" animationDuration={1000}>
              {rows.map((r, i) => <Cell key={r.label} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip contentStyle={tip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-mid"><b>{total}</b><small className="mut">files</small></div>
      </div>
      <ul className="legend">
        {rows.map((r, i) => (
          <li key={r.label}><i style={{ background: PALETTE[i % PALETTE.length] }} /><span>{r.label}</span><b>{r.value}</b></li>
        ))}
      </ul>
    </div>
  );
};

// rows = [{label, value, note}]
export const Bars = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <Empty title="No data" />;
  return (
    <div className="bars">
      {rows.map((r, i) => (
        <div key={r.label} className="bar">
          <div className="bar-t"><span>{r.label}</span><span className="mut">{r.note ?? r.value}</span></div>
          <div className="track"><i style={{ width: `${(r.value / max) * 100}%`, '--d': `${i * 80}ms` }} /></div>
        </div>
      ))}
    </div>
  );
};

/* ---------- password rules ---------- */
export const pwChecks = (p = '') => [
  ['12+ characters', p.length >= 12], ['Uppercase letter', /[A-Z]/.test(p)], ['Lowercase letter', /[a-z]/.test(p)],
  ['A number', /\d/.test(p)], ['A special character', /[^A-Za-z0-9]/.test(p)],
];
export const pwValid = (p) => pwChecks(p).every((c) => c[1]) && p.length <= 72;

export function PasswordRules({ value }) {
  const c = pwChecks(value);
  const score = c.filter((x) => x[1]).length;
  return (
    <div className="pw">
      <div className="meter"><i style={{ width: `${score * 20}%` }} data-s={score} /></div>
      <ul>{c.map(([l, ok]) => <li key={l} className={ok ? 'ok' : ''}>{ok ? <Check size={12} /> : <Circle size={12} />}{l}</li>)}</ul>
    </div>
  );
}
