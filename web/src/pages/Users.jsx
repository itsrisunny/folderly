import { useState } from 'react';
import { KeyRound, Loader2, Plus, Power, Search, ShieldCheck, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import { api, errText, useFetch } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDebounce } from '../hooks.js';
import { useToast } from '../toast.jsx';
import { Badge, Card, Empty, Err, ErrorState, Modal, PageHead, PasswordRules, Skeleton, Stat, fmtDate, initials, pwValid } from '../components/ui.jsx';

const ROLES = ['admin', 'marketing', 'sales', 'hr', 'finance', 'support'];
const empty = { name: '', username: '', email: '', password: '', role: 'marketing' };

function CreateUser({ open, onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState(empty);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/users', { method: 'POST', body: f });
      toast.success(`User “${f.username}” created`);
      setF(empty); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} title="Create user" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="two">
          <label>Full name<input required minLength={2} value={f.name} onChange={set('name')} /></label>
          <label>Username<input required pattern="[a-zA-Z0-9_\-]{3,30}" title="3–30 chars: letters, numbers, _ or -" value={f.username} onChange={set('username')} /></label>
        </div>
        <div className="two">
          <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
          <label>Role<select value={f.role} onChange={set('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        </div>
        <label>Password<input type="password" required autoComplete="new-password" value={f.password} onChange={set('password')} /></label>
        <PasswordRules value={f.password} />
        <p className="hint mut">Files will be stored under <code>{f.role}/{f.username.toLowerCase() || 'username'}/DATE/</code></p>
        <Err>{err}</Err>
        <div className="actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !pwValid(f.password)}>{busy && <Loader2 size={15} className="spin" />}Create user</button></div>
      </form>
    </Modal>
  );
}

function ResetPassword({ target, onClose }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api(`/users/${target.id}/reset-password`, { method: 'POST', body: { newPassword: pw } });
      toast.success('Password reset. User was signed out everywhere.'); setPw(''); onClose();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <Modal open={!!target} title={`Reset password · ${target?.username}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>New password<input type="password" required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <PasswordRules value={pw} /><Err>{err}</Err>
        <div className="actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !pwValid(pw)}>{busy && <Loader2 size={15} className="spin" />}Reset password</button></div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 300);
  const { data, error, loading, reload } = useFetch(`/users?limit=100${dq ? `&search=${encodeURIComponent(dq)}` : ''}`);
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const patch = async (id, body, okMsg) => {
    try { await api(`/users/${id}`, { method: 'PATCH', body }); toast.success(okMsg); reload(); }
    catch (x) { toast.error(errText(x)); }
  };
  const users = data?.data || [];

  return (
    <>
      <PageHead title="Users" sub="Create accounts and manage access">
        <button className="btn" onClick={() => setCreating(true)}><Plus size={16} />New user</button>
      </PageHead>

      <div className="bento">
        <Stat label="Total users" value={data?.meta?.total ?? 0} icon={UsersIcon} tone="indigo" />
        <Stat label="Active" value={users.filter((u) => u.isActive).length} icon={UserCheck} tone="teal" />
        <Stat label="Disabled" value={users.filter((u) => !u.isActive).length} icon={UserX} tone="rose" />
        <Stat label="Admins" value={users.filter((u) => u.role === 'admin').length} icon={ShieldCheck} tone="amber" />

        <Card cls="s4" title="All users" icon={UsersIcon} right={
          <div className="field search"><Search size={15} /><input placeholder="Search name, username, email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        }>
          {error && <ErrorState message={error} onRetry={reload} />}
          {loading && !data && <div className="stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={44} />)}</div>}
          {data && !users.length && <Empty icon={UsersIcon} title="No users found" text="Try a different search." />}
          {users.length > 0 && (
            <div className="scroll">
              <table className="tbl">
                <thead><tr><th>User</th><th>Role</th><th>Last login</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {users.map((u) => {
                    const self = u.id === me.id;
                    return (
                      <tr key={u.id}>
                        <td><div className="who"><span className="avatar sm">{initials(u.name)}</span><div><b>{u.name}{self && <Badge tone="indigo">You</Badge>}</b><small className="mut block">@{u.username} · {u.email}</small></div></div></td>
                        <td>
                          <select className="compact" value={u.role} disabled={self} aria-label={`Role for ${u.username}`}
                            onChange={(e) => patch(u.id, { role: e.target.value }, `${u.username} is now ${e.target.value}`)}>
                            {ROLES.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="mut">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}</td>
                        <td><Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                        <td className="acts">
                          <button className="icon-btn bordered" title="Reset password" aria-label="Reset password" onClick={() => setResetFor(u)}><KeyRound size={15} /></button>
                          {!self && <button className="icon-btn bordered" title={u.isActive ? 'Deactivate' : 'Activate'} aria-label="Toggle active" onClick={() => setConfirm(u)}><Power size={15} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <CreateUser open={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />
      <ResetPassword target={resetFor} onClose={() => setResetFor(null)} />
      <Modal open={!!confirm} title={confirm?.isActive ? 'Deactivate user?' : 'Activate user?'} onClose={() => setConfirm(null)}>
        <p className="mut">{confirm?.isActive ? `${confirm?.name} will be signed out and unable to log in. Their files and history are kept.` : `${confirm?.name} will be able to log in again.`}</p>
        <div className="actions"><button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
          <button className={`btn ${confirm?.isActive ? 'danger' : ''}`} onClick={() => { patch(confirm.id, { isActive: !confirm.isActive }, confirm.isActive ? 'User deactivated' : 'User activated'); setConfirm(null); }}>
            {confirm?.isActive ? 'Deactivate' : 'Activate'}</button></div>
      </Modal>
    </>
  );
}
