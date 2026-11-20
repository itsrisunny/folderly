import { useRef, useState } from 'react';
import { Download, Files, Folder, HardDrive, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { api, errText, useFetch } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../toast.jsx';
import { Badge, Card, Empty, ErrorState, FileIcon, PageHead, Pager, Skeleton, Stat, fmtBytes, fmtDate, typeLabel } from '../components/ui.jsx';

const EXT = ['pdf', 'png', 'jpg', 'jpeg', 'csv', 'txt', 'docx', 'xlsx'];
const MAX_FILES = 5, MAX_MB = 10;

export default function Uploads() {
  const { user } = useAuth();
  const toast = useToast();
  const admin = user.role === 'admin';
  const [scope, setScope] = useState('me');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch(`/uploads${scope === 'me' ? '/me' : ''}?page=${page}&limit=10`);
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inp = useRef();

  const add = (list) => {
    const next = [...queue];
    for (const f of list) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (!EXT.includes(ext)) { toast.error(`${f.name}: file type not allowed`); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name}: larger than ${MAX_MB} MB`); continue; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= MAX_FILES) { toast.error(`Max ${MAX_FILES} files per upload`); break; }
      next.push(f);
    }
    setQueue(next);
    if (inp.current) inp.current.value = '';
  };

  const upload = async () => {
    const form = new FormData();
    queue.forEach((f) => form.append('files', f));
    setBusy(true);
    try {
      const r = await api('/uploads', { method: 'POST', form });
      toast.success(`Uploaded ${r.data.length} file(s) to ${r.data[0].key.split('/').slice(0, 3).join('/')}/`);
      setQueue([]); setPage(1); reload();
    } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  const download = async (id) => {
    try { const r = await api(`/uploads/${id}/download`); window.open(r.data.url, '_blank', 'noopener'); }
    catch (e) { toast.error(errText(e)); }
  };

  const rows = data?.data || [];
  const meta = data?.meta;
  const today = new Date().toLocaleDateString('en-CA');
  const qSize = queue.reduce((a, f) => a + f.size, 0);

  return (
    <>
      <PageHead title="Uploads" sub="Files are encrypted and stored privately in S3" />
      <div className="bento">
        <Card cls="s2 r2" title="Upload files" icon={UploadCloud}>
          <div
            className={`drop ${drag ? 'over' : ''}`}
            role="button" tabIndex={0}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
            onClick={() => inp.current.click()}
            onKeyDown={(e) => e.key === 'Enter' && inp.current.click()}
          >
            <span className="ico lg float"><UploadCloud size={26} /></span>
            <b>Drop files here or click to browse</b>
            <small className="mut">PDF, PNG, JPG, CSV, TXT, DOCX, XLSX · up to {MAX_FILES} files · {MAX_MB} MB each</small>
            <input ref={inp} type="file" multiple hidden onChange={(e) => add(e.target.files)} />
          </div>
          {queue.length > 0 && (
            <div className="queue">
              {queue.map((f) => (
                <div key={f.name + f.size} className="q-item">
                  <span className="ico sm"><FileIcon name={f.name} size={16} /></span>
                  <span className="grow trunc">{f.name}</span><small className="mut">{fmtBytes(f.size)}</small>
                  <button className="icon-btn" aria-label={`Remove ${f.name}`} onClick={() => setQueue(queue.filter((x) => x !== f))}><Trash2 size={14} /></button>
                </div>
              ))}
              {busy && <div className="indeterminate" />}
              <button className="btn block-btn" disabled={busy} onClick={upload}>
                {busy ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />}Upload {queue.length} file{queue.length > 1 && 's'} · {fmtBytes(qSize)}
              </button>
            </div>
          )}
        </Card>
        <Stat cls="s2" label="Destination folder" icon={Folder} tone="indigo" value={<span className="path">{user.role}/{user.username}/{today}/</span>} sub="ROLE / USERNAME / DATE" />
        <Stat label="Total files" value={meta?.total ?? 0} icon={Files} tone="teal" sub={scope === 'me' ? 'yours' : 'all users'} />
        <Stat label="This page" value={rows.reduce((a, r) => a + r.size, 0)} format={fmtBytes} icon={HardDrive} tone="amber" />

        <Card cls="s4" title={scope === 'me' ? 'My files' : 'All files'} icon={Files} right={admin && (
          <div className="seg">
            <button className={scope === 'me' ? 'on' : ''} onClick={() => { setScope('me'); setPage(1); }}>Mine</button>
            <button className={scope === 'all' ? 'on' : ''} onClick={() => { setScope('all'); setPage(1); }}>Everyone</button>
          </div>
        )}>
          {error && <ErrorState message={error} onRetry={reload} />}
          {loading && !data && <div className="stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={44} />)}</div>}
          {data && !rows.length && <Empty icon={Files} title="No files yet" text="Upload your first file using the panel on the left." />}
          {rows.length > 0 && (
            <div className="scroll">
              <table className="tbl">
                <thead><tr><th>File</th><th>Type</th><th>Size</th>{scope === 'all' && <th>Owner</th>}<th>Uploaded</th><th /></tr></thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.id}>
                      <td><div className="who"><span className="ico sm"><FileIcon mime={f.mimeType} size={16} /></span><span className="trunc">{f.originalName}</span></div></td>
                      <td><Badge tone="indigo">{typeLabel(f.mimeType)}</Badge></td>
                      <td>{fmtBytes(f.size)}</td>
                      {scope === 'all' && <td>{f.username} <small className="mut">· {f.role}</small></td>}
                      <td className="mut">{fmtDate(f.createdAt)}</td>
                      <td className="acts"><button className="icon-btn bordered" title="Download" aria-label={`Download ${f.originalName}`} onClick={() => download(f.id)}><Download size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} setPage={setPage} meta={meta} />
        </Card>
      </div>
    </>
  );
}
