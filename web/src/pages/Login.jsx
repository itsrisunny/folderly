import { useState } from 'react';
import { ArrowRight, BarChart3, Eye, EyeOff, FolderLock, Loader2, Lock, ShieldCheck, UploadCloud, User } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { errText } from '../api.js';
import { useToast } from '../toast.jsx';

const FEATURES = [
  [UploadCloud, 'Private cloud uploads', 'Organised by role, user and date'],
  [BarChart3, 'Live activity reports', 'Per-user and organisation insights'],
  [ShieldCheck, 'Role-based access', 'Every action is permission checked'],
];

export default function Login() {
  const { signIn } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ identifier: '', password: '' });
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await signIn(f.identifier, f.password); }
    catch (x) {
      toast.error(errText(x), 'Login failed');
      setShake(true); setTimeout(() => setShake(false), 500); setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="aurora" aria-hidden><i /><i /><i /></div>
      <div className="login-card">
        <section className="login-hero">
          <div className="brand-line"><span className="logo lg"><FolderLock size={24} /></span><b>Folderly</b></div>
          <h1>Everything your team uploads, <span className="grad">at a glance.</span></h1>
          <ul>
            {FEATURES.map(([I, t, s], i) => (
              <li key={t} style={{ '--i': i }}><span className="ico"><I size={18} /></span><div><b>{t}</b><small className="mut block">{s}</small></div></li>
            ))}
          </ul>
        </section>
        <form className={`login-form ${shake ? 'shake' : ''}`} onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="mut">Use the credentials provided by your administrator.</p>
          <label>Username or email
            <div className="field"><User size={16} /><input autoFocus required autoComplete="username" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} /></div>
          </label>
          <label>Password
            <div className="field">
              <Lock size={16} />
              <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
              <button type="button" className="icon-btn" aria-label="Toggle password visibility" onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
          <button className="btn lg" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : <>Sign in <ArrowRight size={16} /></>}</button>
        </form>
      </div>
    </div>
  );
}
