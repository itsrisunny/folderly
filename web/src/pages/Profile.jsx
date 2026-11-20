import { useState } from 'react';
import { Loader2, LogOut, Mail, Monitor, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { api, errText } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../theme.jsx';
import { useToast } from '../toast.jsx';
import { Badge, Card, Err, PageHead, PasswordRules, fmtDate, initials, pwValid } from '../components/ui.jsx';

export default function Profile() {
  const { user, signOut, endSession } = useAuth();
  const { mode, setMode } = useTheme();
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const change = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: f });
      toast.success('Password changed. Please sign in again.');
      endSession(); // server revoked all sessions
    } catch (x) { setErr(errText(x)); setBusy(false); }
  };

  return (
    <>
      <PageHead title="Profile" sub="Your account, security and appearance" />
      <div className="bento">
        <Card cls="s2" title="Account" icon={User}>
          <div className="profile">
            <span className="avatar xl">{initials(user.name)}</span>
            <div><h2 style={{ margin: 0 }}>{user.name}</h2><Badge tone="indigo">{user.role}</Badge></div>
          </div>
          <dl className="kv">
            <dt><User size={14} />Username</dt><dd>@{user.username}</dd>
            <dt><Mail size={14} />Email</dt><dd>{user.email}</dd>
            <dt><ShieldCheck size={14} />Last login</dt><dd>{user.lastLoginAt ? fmtDate(user.lastLoginAt) : '—'}</dd>
          </dl>
        </Card>

        <Card cls="s2 r2" title="Change password" icon={ShieldCheck}>
          <form className="stack" onSubmit={change}>
            <label>Current password<input type="password" required autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></label>
            <label>New password<input type="password" required autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></label>
            <PasswordRules value={f.newPassword} />
            <Err>{err}</Err>
            <button className="btn" disabled={busy || !pwValid(f.newPassword) || !f.currentPassword}>{busy && <Loader2 size={15} className="spin" />}Update password</button>
            <p className="hint mut">You will be signed out of every device after changing your password.</p>
          </form>
        </Card>

        <Card cls="s2" title="Appearance" icon={Sun}>
          <div className="seg full">
            {[['system', Monitor, 'System'], ['light', Sun, 'Light'], ['dark', Moon, 'Dark']].map(([m, I, l]) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}><I size={14} />{l}</button>
            ))}
          </div>
          <div className="divider" />
          <button className="btn ghost" onClick={() => signOut(true)}><LogOut size={15} />Sign out of all devices</button>
        </Card>
      </div>
    </>
  );
}
