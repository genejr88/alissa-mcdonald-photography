import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMailConfig, getMailMessages, searchMailMessages, getMailMessage, setMailSeen,
  deleteMailMessage, sendMailMessage, downloadMailAttachment,
  adminGetContractTemplates, adminSendContract,
} from '../../lib/api';

const FOLDERS = [['INBOX', 'Inbox'], ['Sent', 'Sent'], ['Trash', 'Trash']];

const iconProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...iconProps} d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-.8 12.1A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-1.9L6 7" />
      <path {...iconProps} d="M10 11v6M14 11v6" />
    </svg>
  );
}
function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...iconProps} cx="11" cy="11" r="7" />
      <path {...iconProps} d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function PaperclipIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...iconProps} d="M21 11.5 12.4 20a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.1-2.1l7.1-7.1" />
    </svg>
  );
}
function ReplyIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...iconProps} d="M9 17 4 12l5-5M4 12h11a5 5 0 0 1 5 5v1" />
    </svg>
  );
}

// A timed-out/network-level failure has no .response at all (no HTTP
// response was ever received), so the server's own error text isn't there
// to fall back on — name that case specifically instead of a vague default.
function mailErrorMessage(error, fallback) {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.code === 'ECONNABORTED') return 'Timed out waiting on the mailbox — it may still have gone through.';
  return fallback;
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtSize(bytes) {
  if (!bytes) return '';
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function extractEmail(fromHeader) {
  return fromHeader?.match(/<(.+)>/)?.[1] || fromHeader || '';
}

function initialOf(fromHeader) {
  const name = fromHeader?.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim() || extractEmail(fromHeader);
  return (name?.[0] || '?').toUpperCase();
}

function Avatar({ from, seen }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold ${
        seen ? 'bg-gray-100 text-gray-400' : 'bg-accent/15 text-accent'
      }`}
    >
      {initialOf(from)}
    </div>
  );
}

function ComposeForm({ defaultTo = '', defaultSubject = '', quoteText = '', onSent, onCancel }) {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);

  const send = useMutation({
    mutationFn: () => sendMailMessage({ to, cc: cc || undefined, subject, text, inReplyToText: quoteText || undefined, files }),
    onSuccess: () => onSent?.(),
  });

  const removeFile = (idx) => setFiles((fs) => fs.filter((_, i) => i !== idx));

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">To</label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">CC (optional)</label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="another@email.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Subject</label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Message</label>
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-2 flex cursor-pointer items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 hover:text-gray-600">
          <PaperclipIcon /> Attach files
          <input type="file" multiple onChange={(e) => setFiles((fs) => [...fs, ...Array.from(e.target.files || [])])} className="hidden" />
        </label>
        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 truncate text-gray-600"><PaperclipIcon className="h-3 w-3 shrink-0 opacity-50" />{f.name} <span className="opacity-40">({fmtSize(f.size)})</span></span>
                <button onClick={() => removeFile(i)} className="ml-2 shrink-0 text-gray-400 transition-colors hover:text-red-500">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {send.isError && (
        <p className="text-sm text-red-500">{mailErrorMessage(send.error, 'Failed to send.')}</p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          disabled={!to || !subject || !text || send.isPending}
          onClick={() => send.mutate()}
          className="rounded-lg bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper shadow-sm transition-all hover:shadow-md disabled:opacity-40 disabled:shadow-none"
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SendContractPicker({ toEmail, defaultName, onDone, onCancel }) {
  const { data: templates = [] } = useQuery({ queryKey: ['contract-templates'], queryFn: adminGetContractTemplates });
  const [templateId, setTemplateId] = useState('');
  const [clientName, setClientName] = useState(defaultName || '');
  const [sessionType, setSessionType] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!templateId && templates.length) setTemplateId(templates[0].id);
  }, [templates, templateId]);

  const send = useMutation({
    mutationFn: () => adminSendContract({
      templateId, clientName, clientEmail: toEmail, sessionType, sessionDate, price, deposit,
    }),
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-5 text-sm">
        <p className="mb-2 font-medium text-green-700">✓ Contract sent to {toEmail}.</p>
        <button onClick={onDone} className="text-xs font-semibold uppercase tracking-wide text-green-700 underline">Done</button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-accent/20 bg-accent/5 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Template</label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Client Name</label>
          <input className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Session Type</label>
          <input className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10" value={sessionType} onChange={(e) => setSessionType(e.target.value)} placeholder="The Mini Session" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Session Date</label>
          <input className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} placeholder="July 15, 2026" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Price</label>
          <input className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$175" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Deposit</label>
          <input className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      {send.isError && (
        <p className="text-sm text-red-500">{mailErrorMessage(send.error, 'Failed to send.')}</p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          disabled={!templateId || !clientName || send.isPending}
          onClick={() => send.mutate()}
          className="rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:shadow-md disabled:opacity-40 disabled:shadow-none"
        >
          {send.isPending ? 'Sending…' : 'Send Contract'}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-gray-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:bg-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

function MessageDetail({ folder, uid, onRead, onDeleted }) {
  const [mode, setMode] = useState(null); // null | 'reply' | 'contract'
  const { data, isLoading } = useQuery({
    queryKey: ['mail-message', folder, uid],
    queryFn: () => getMailMessage(folder, uid),
  });

  const markSeen = useMutation({
    mutationFn: () => setMailSeen(folder, uid, true),
    onSuccess: () => onRead?.(),
  });

  const del = useMutation({
    mutationFn: () => deleteMailMessage(folder, uid),
    onSuccess: () => onDeleted?.(),
  });

  // Mark as read once, after the message body loads.
  useEffect(() => {
    if (data) markSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.uid]);

  if (isLoading) return <p className="p-5 text-sm text-gray-400">Loading…</p>;
  if (!data) return null;

  const senderEmail = extractEmail(data.from);
  const senderName = data.from?.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim() || senderEmail;

  return (
    <div className="space-y-4 border-t border-gray-100 bg-gray-50/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 text-xs text-gray-500">
          <div><span className="text-gray-400">From</span> &nbsp;{data.from}</div>
          <div><span className="text-gray-400">To</span> &nbsp;&nbsp;&nbsp;{data.to}</div>
          <div><span className="text-gray-400">Date</span> &nbsp;{fullDate(data.date)}</div>
        </div>
        <button
          onClick={() => {
            if (confirm(folder === 'Trash' ? 'Permanently delete this message? This cannot be undone.' : 'Move this message to Trash?')) del.mutate();
          }}
          title={folder === 'Trash' ? 'Delete permanently' : 'Move to Trash'}
          className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <TrashIcon />
        </button>
      </div>

      {data.html ? (
        <iframe
          title="Message body"
          sandbox=""
          srcDoc={data.html}
          className="w-full rounded-lg border border-gray-200 bg-white"
          style={{ minHeight: 240 }}
        />
      ) : (
        <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed">
          {data.text}
        </pre>
      )}

      {data.attachments?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.attachments.map((a, i) => (
            <button
              key={i}
              onClick={() => downloadMailAttachment(folder, uid, i, a.filename)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-accent/30 hover:bg-accent/5"
            >
              <PaperclipIcon className="h-3 w-3 opacity-50" /> {a.filename} {a.size ? <span className="opacity-40">({fmtSize(a.size)})</span> : null}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setMode(mode === 'reply' ? null : 'reply')}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'reply' ? 'border-ink bg-ink text-paper' : 'border-gray-200 text-gray-600 hover:bg-white'}`}
        >
          <ReplyIcon className="h-3.5 w-3.5" /> Reply
        </button>
        <button
          onClick={() => setMode(mode === 'contract' ? null : 'contract')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'contract' ? 'border-accent bg-accent text-white' : 'border-accent/30 text-accent hover:bg-accent/5'}`}
        >
          Send Contract →
        </button>
      </div>

      {mode === 'reply' && (
        <ComposeForm
          defaultTo={senderEmail}
          defaultSubject={data.subject?.startsWith('Re:') ? data.subject : `Re: ${data.subject}`}
          quoteText={`On ${fullDate(data.date)}, ${data.from} wrote:\n${data.text || ''}`}
          onSent={() => setMode(null)}
          onCancel={() => setMode(null)}
        />
      )}

      {mode === 'contract' && (
        <SendContractPicker
          toEmail={senderEmail}
          defaultName={senderName}
          onDone={() => setMode(null)}
          onCancel={() => setMode(null)}
        />
      )}
    </div>
  );
}

function MessageRow({ folder, msg, open, onToggle, onRead, onDeleted }) {
  const del = useMutation({
    mutationFn: () => deleteMailMessage(folder, msg.uid),
    onSuccess: () => onDeleted?.(),
  });

  return (
    <div className={`group overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-sm ${open ? 'border-accent/30 shadow-sm' : 'border-gray-100'}`}>
      <div
        className="flex cursor-pointer items-center gap-3 p-3.5"
        onClick={onToggle}
      >
        <Avatar from={msg.from} seen={msg.seen} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate text-sm ${msg.seen ? 'text-gray-500' : 'font-semibold text-ink'}`}>
              {msg.from || '(unknown sender)'}
            </span>
            {!msg.seen && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
          </div>
          <p className={`truncate text-sm ${msg.seen ? 'text-gray-400' : 'text-gray-600'}`}>{msg.subject}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">{formatDate(msg.date)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(folder === 'Trash' ? 'Permanently delete this message? This cannot be undone.' : 'Move this message to Trash?')) del.mutate();
          }}
          title={folder === 'Trash' ? 'Delete permanently' : 'Move to Trash'}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 active:bg-red-50 active:text-red-500"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && <MessageDetail folder={folder} uid={msg.uid} onRead={onRead} onDeleted={onDeleted} />}
    </div>
  );
}

export default function AdminMail() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState('INBOX');
  const [page, setPage] = useState(1);
  const [openUid, setOpenUid] = useState(null);
  const [composing, setComposing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { data: config } = useQuery({ queryKey: ['mail-config'], queryFn: getMailConfig });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: activeSearch ? ['mail-search', folder, activeSearch, page] : ['mail-messages', folder, page],
    queryFn: () => (activeSearch ? searchMailMessages(folder, activeSearch, page) : getMailMessages(folder, page)),
    enabled: !!config?.configured,
  });

  const refreshList = () => {
    qc.invalidateQueries({ queryKey: ['mail-messages', folder] });
    qc.invalidateQueries({ queryKey: ['mail-search', folder] });
  };
  const handleDeleted = () => { setOpenUid(null); refreshList(); };

  const changeFolder = (f) => { setFolder(f); setPage(1); setOpenUid(null); setActiveSearch(''); setSearchInput(''); };
  const runSearch = () => { setActiveSearch(searchInput.trim()); setPage(1); setOpenUid(null); };
  const clearSearch = () => { setActiveSearch(''); setSearchInput(''); setPage(1); };

  if (config && !config.configured) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-serif text-3xl">Mail</h1>
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-400">
          <p className="text-sm">
            Mailbox isn&rsquo;t connected yet — add <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">IMAP_HOST</code>,{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">SMTP_USER</code>, and{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">SMTP_PASS</code> in Railway to turn this on.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Mail</h1>
        <button
          onClick={() => setComposing((c) => !c)}
          className="rounded-lg bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper shadow-sm transition-all hover:shadow-md"
        >
          {composing ? 'Close' : 'Compose →'}
        </button>
      </div>

      {composing && (
        <ComposeForm
          onSent={() => { setComposing(false); refreshList(); }}
          onCancel={() => setComposing(false)}
        />
      )}

      <div className="my-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5 self-start overflow-x-auto rounded-xl bg-gray-100 p-1">
          {FOLDERS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => changeFolder(v)}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${folder === v ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto sm:w-80">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Search mail…"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
          {activeSearch && (
            <button onClick={clearSearch} className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-50">
              Clear
            </button>
          )}
        </div>
      </div>

      {activeSearch && (
        <p className="mb-4 text-xs text-gray-400">
          Results for &ldquo;{activeSearch}&rdquo; in {folder === 'INBOX' ? 'Inbox' : folder}
        </p>
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-500">
          {mailErrorMessage(error, 'Could not reach the mailbox.')}
        </p>
      )}

      {!isLoading && data && data.messages.length === 0 && (
        <div className="py-24 text-center text-gray-300">
          <p className="text-sm uppercase tracking-widest">No messages.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {data?.messages.map((msg) => (
          <MessageRow
            key={msg.uid}
            folder={folder}
            msg={msg}
            open={openUid === msg.uid}
            onToggle={() => setOpenUid((u) => (u === msg.uid ? null : msg.uid))}
            onRead={refreshList}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {data && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
          >
            ← Newer
          </button>
          <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  );
}
