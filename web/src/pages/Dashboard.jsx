import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, Files, Gauge, HardDrive, Layers, Trophy, UploadCloud, UserCheck, UserPlus, Users, Zap } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useFetch } from '../api.js';
import {
  Bars, BentoSkeleton, Card, DayChart, Donut, Empty, ErrorState, FileIcon, PageHead, RangeSelect, SmallBox,
  fmtBytes, fmtDate, sinceDays, typeLabel,
} from '../components/ui.jsx';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

// Shared by the user dashboard and the admin per-user drawer (Reports page)
export function ReportBento({ r, links = false }) {
  const avg = r.totals.files ? r.totals.bytes / r.totals.files : 0;
  return (
    <div className="bento">
      <SmallBox label="Files uploaded" value={r.totals.files} icon={Files} tone="indigo" spark={r.byDay.map((d) => d.files)} to={links ? '/uploads' : undefined} more="View files" sub={`${r.range.from} → ${r.range.to}`} />
      <SmallBox label="Storage used" value={r.totals.bytes} format={fmtBytes} icon={HardDrive} tone="teal" spark={r.byDay.map((d) => d.bytes)} to={links ? '/uploads' : undefined} more="Manage files" sub="Encrypted in S3" />
      <SmallBox label="Average file size" value={avg} format={fmtBytes} icon={Gauge} tone="amber" sub="per upload" />
      <SmallBox label="Active days" value={r.byDay.length} icon={CalendarDays} tone="rose" sub="days with uploads" />
      <Card cls="s3" tone="indigo" title="Uploads per day" icon={Activity}><DayChart data={r.byDay} /></Card>
      <Card tone="teal" title="File types" icon={Layers}>
        <Donut rows={r.byType.map((t) => ({ label: typeLabel(t.mimeType), value: t.files }))} />
      </Card>
      <Card cls="s4" tone="amber" title="Recent files" icon={Files}>
        {r.recent.length ? (
          <ul className="list cols">
            {r.recent.slice(0, 6).map((f) => (
              <li key={f.id}>
                <span className="ico sm"><FileIcon mime={f.mimeType} size={16} /></span>
                <span className="grow"><span className="trunc block">{f.originalName}</span><small className="mut">{fmtDate(f.createdAt)}</small></span>
                <small className="mut">{fmtBytes(f.size)}</small>
              </li>
            ))}
          </ul>
        ) : <Empty title="No uploads yet" text="Files you upload will appear here." />}
      </Card>
    </div>
  );
}

function AdminOverview({ r }) {
  const u = r.uploads;
  return (
    <div className="bento">
      <SmallBox label="Total users" value={r.users.total} icon={Users} tone="indigo" to="/users" more="Manage users" />
      <SmallBox label="Files uploaded" value={u.files} icon={Files} tone="teal" spark={u.byDay.map((d) => d.files)} to="/uploads" more="View all files" />
      <SmallBox label="Storage used" value={u.bytes} format={fmtBytes} icon={HardDrive} tone="amber" spark={u.byDay.map((d) => d.bytes)} to="/reports" more="Open reports" />
      <SmallBox label="Users who uploaded" value={u.usersWhoUploaded} icon={UserCheck} tone="rose" to="/reports" more="Per-user report" />

      <Card cls="s3" tone="indigo" title="Uploads per day" icon={Activity}><DayChart data={u.byDay} /></Card>
      <Card tone="teal" title="File types" icon={Layers}>
        <Donut rows={u.byType.map((t) => ({ label: typeLabel(t.mimeType), value: t.files }))} />
      </Card>

      <Card cls="s2" tone="amber" title="Top uploaders" icon={Trophy}>
        {u.topUsers.length ? (
          <ul className="list">
            {u.topUsers.slice(0, 5).map((x, i) => (
              <li key={x.userId}>
                <span className={`rank r${i + 1}`}>{i + 1}</span>
                <span className="grow">{x.username} <small className="mut">· {x.role}</small></span>
                <b>{x.files}</b><small className="mut">{fmtBytes(x.bytes)}</small>
              </li>
            ))}
          </ul>
        ) : <Empty title="No uploads yet" />}
      </Card>
      <Card cls="s2" tone="rose" title="Files by role" icon={Files}>
        <Bars rows={u.byRole.map((x) => ({ label: x.role, value: x.files, note: `${x.files} · ${fmtBytes(x.bytes)}` }))} />
      </Card>
      <Card cls="s2" tone="sky" title="Users by role" icon={Users}>
        <Bars rows={r.users.byRole.map((x) => ({ label: x.role, value: x.users }))} />
      </Card>
      <Card cls="s2" tone="indigo" title="Quick actions" icon={Zap}>
        <div className="quick">
          <Link to="/users" className="qa g-indigo"><UserPlus size={22} /><b>Create user</b><small>Add a team member</small></Link>
          <Link to="/uploads" className="qa g-teal"><UploadCloud size={22} /><b>Upload files</b><small>To your S3 folder</small></Link>
          <Link to="/reports" className="qa g-amber"><BarChart3 size={22} /><b>View reports</b><small>Per-user activity</small></Link>
        </div>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useFetch(`/reports/${admin ? 'dashboard' : 'me'}?from=${sinceDays(days)}`);

  return (
    <>
      <PageHead title={`${greet()}, ${user.name.split(' ')[0]}`} sub={admin ? 'Organisation overview' : 'Your upload activity'}>
        <RangeSelect days={days} setDays={setDays} />
      </PageHead>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && !error && <BentoSkeleton />}
      {data && (admin ? <AdminOverview r={data.data} /> : <ReportBento r={data.data} links />)}
    </>
  );
}
