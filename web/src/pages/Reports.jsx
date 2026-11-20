import { useState } from 'react';
import { BarChart3, ChevronRight, Files, HardDrive, Users } from 'lucide-react';
import { useFetch } from '../api.js';
import { Badge, Card, Drawer, Empty, ErrorState, PageHead, Pager, RangeSelect, Skeleton, Stat, fmtBytes, fmtDate, initials, sinceDays, BentoSkeleton } from '../components/ui.jsx';
import { ReportBento } from './Dashboard.jsx';

const ROLES = ['', 'admin', 'marketing', 'sales', 'hr', 'finance', 'support'];

export default function Reports() {
  const [days, setDays] = useState(30);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(null);
  const from = sinceDays(days);
  const list = useFetch(`/reports/users?page=${page}&limit=10&from=${from}${role ? `&role=${role}` : ''}`);
  const detail = useFetch(sel ? `/reports/users/${sel.userId}?from=${from}` : null);
  const rows = list.data?.data.items || [];
  const meta = list.data?.meta;
  const max = Math.max(1, ...rows.map((r) => r.files));
  const pageFiles = rows.reduce((a, r) => a + r.files, 0);

  return (
    <>
      <PageHead title="Reports" sub="Per-user activity. Select a row to see the full report.">
        <select className="compact" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          {ROLES.map((r) => <option key={r} value={r}>{r || 'All roles'}</option>)}
        </select>
        <RangeSelect days={days} setDays={(d) => { setDays(d); setPage(1); }} />
      </PageHead>

      <div className="bento">
        <Stat label="Users matched" value={meta?.total ?? 0} icon={Users} tone="indigo" />
        <Stat label="Files (this page)" value={pageFiles} icon={Files} tone="teal" />
        <Stat label="Storage (this page)" value={rows.reduce((a, r) => a + r.bytes, 0)} format={fmtBytes} icon={HardDrive} tone="amber" />
        <Stat label="Range" value={`${days}d`} icon={BarChart3} tone="rose" sub={`${from} →`} />

        <Card cls="s4" title="Users" icon={Users}>
          {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
          {list.loading && !list.data && <div className="stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={44} />)}</div>}
          {list.data && !rows.length && <Empty icon={Users} title="No users" text="No users match this filter." />}
          {rows.length > 0 && (
            <div className="scroll">
              <table className="tbl hover">
                <thead><tr><th>User</th><th>Role</th><th>Files</th><th>Storage</th><th>Last upload</th><th /></tr></thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.userId} onClick={() => setSel(u)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(u)}>
                      <td><div className="who"><span className="avatar sm">{initials(u.name)}</span><div><b>{u.name}</b>{!u.isActive && <Badge tone="red">Disabled</Badge>}<small className="mut block">@{u.username}</small></div></div></td>
                      <td>{u.role}</td>
                      <td><div className="mini-wrap"><b>{u.files}</b><div className="mini"><i style={{ width: `${(u.files / max) * 100}%` }} /></div></div></td>
                      <td>{fmtBytes(u.bytes)}</td>
                      <td className="mut">{u.lastUploadAt ? fmtDate(u.lastUploadAt) : '—'}</td>
                      <td className="acts mut"><ChevronRight size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} setPage={setPage} meta={meta} />
        </Card>
      </div>

      <Drawer open={!!sel} title={sel ? `${sel.name} · @${sel.username}` : ''} onClose={() => setSel(null)}>
        {detail.error && <ErrorState message={detail.error} onRetry={detail.reload} />}
        {detail.loading && !detail.data && <BentoSkeleton />}
        {detail.data && <ReportBento r={detail.data.data.report} />}
      </Drawer>
    </>
  );
}
