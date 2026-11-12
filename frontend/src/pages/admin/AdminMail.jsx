import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMailConfig, getMailMessages, getMailMessage, setMailSeen, sendMailMessage,
} from '../../lib/api';

const FOLDERS = [['INBOX', 'Inbox'], ['Sent', 'Sent']];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function ComposeForm({ defaultTo = '', defaultSubject = '', quoteText = '', onSent, onCancel }) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [text, setText] = useState('');

  const send = useMutation({
    mutationFn: () => sendMailMessage({ to, subject, text, inReplyToText: quoteText || undefined }),
    onSuccess: () => onSent?.(),
  });

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide opacity-40">To</label>
          <input
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide opacity-40">Subject</label>
          <input
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide opacity-40">Message</label>
        <textarea
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {send.isError && (
        <p className="text-sm text-red-500">{send.error?.response?.data?.error || 'Failed to send.'}</p>
      )}
      <div className="flex gap-3">
        <button
          disabled={!to || !subject || !text || send.isPending}
          onClick={() => send.mutate()}
          className="rounded bg-black px-4 py-2 text-xs uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-gray-200 px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MessageDetail({ folder, uid, onRead }) {
  const [replying, setReplying] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['mail-message', folder, uid],
    queryFn: () => getMailMessage(folder, uid),
  });

  const markSeen = useMutation({
    mutationFn: () => setMailSeen(folder, uid, true),
    onSuccess: () => onRead?.(),
  });

  // Mark as read once, after the message body loads.
  useEffect(() => {
    if (data) markSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.uid]);

  if (isLoading) return <p className="p-4 text-sm opacity-40">Loading…</p>;
  if (!data) return null;

  return (
    <div className="space-y-4 border-t border-gray-100 bg-gray-50 p-5">
      <div className="space-y-0.5 text-xs opacity-50">
        <div><span className="opacity-60">From:</span> {data.from}</div>
        <div><span className="opacity-60">To:</span> {data.to}</div>
        <div><span className="opacity-60">Date:</span> {formatDate(data.date)}</div>
      </div>

      {data.html ? (
        <iframe
          title="Message body"
          sandbox=""
          srcDoc={data.html}
          className="w-full rounded border border-gray-200 bg-white"
          style={{ minHeight: 240 }}
        />
      ) : (
        <pre className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm">
          {data.text}
        </pre>
      )}

      {data.attachments?.length > 0 && (
        <div className="text-xs opacity-50">
          Attachments: {data.attachments.map((a) => a.filename).join(', ')}
        </div>
      )}

      {!replying ? (
        <button
          onClick={() => setReplying(true)}
          className="rounded border border-gray-200 px-3 py-1.5 text-xs transition-colors hover:bg-white"
        >
          Reply
        </button>
      ) : (
        <ComposeForm
          defaultTo={data.from?.match(/<(.+)>/)?.[1] || data.from || ''}
          defaultSubject={data.subject?.startsWith('Re:') ? data.subject : `Re: ${data.subject}`}
          quoteText={`On ${formatDate(data.date)}, ${data.from} wrote:\n${data.text || ''}`}
          onSent={() => setReplying(false)}
          onCancel={() => setReplying(false)}
        />
      )}
    </div>
  );
}

function MessageRow({ folder, msg, open, onToggle, onRead }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
      <div
        className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!msg.seen && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
            <span className={`truncate text-sm ${msg.seen ? 'opacity-60' : 'font-semibold'}`}>
              {msg.from || '(unknown sender)'}
            </span>
          </div>
          <p className={`truncate text-sm ${msg.seen ? 'opacity-50' : ''}`}>{msg.subject}</p>
        </div>
        <span className="shrink-0 text-xs opacity-40">{formatDate(msg.date)}</span>
      </div>
      {open && <MessageDetail folder={folder} uid={msg.uid} onRead={onRead} />}
    </div>
  );
}

export default function AdminMail() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState('INBOX');
  const [page, setPage] = useState(1);
  const [openUid, setOpenUid] = useState(null);
  const [composing, setComposing] = useState(false);

  const { data: config } = useQuery({ queryKey: ['mail-config'], queryFn: getMailConfig });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mail-messages', folder, page],
    queryFn: () => getMailMessages(folder, page),
    enabled: !!config?.configured,
  });

  const refreshList = () => qc.invalidateQueries({ queryKey: ['mail-messages', folder] });

  if (config && !config.configured) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-serif text-3xl">Mail</h1>
        <div className="rounded-lg border border-gray-100 bg-white p-8 text-center opacity-50">
          <p className="text-sm">
            Mailbox isn&rsquo;t connected yet — add <code>IMAP_HOST</code>, <code>SMTP_USER</code>, and{' '}
            <code>SMTP_PASS</code> in Railway to turn this on.
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
          className="rounded bg-black px-5 py-2 text-xs uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
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

      <div className="my-6 flex gap-2">
        {FOLDERS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => { setFolder(v); setPage(1); setOpenUid(null); }}
            className={`rounded px-4 py-2 text-xs transition-colors ${folder === v ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm opacity-40">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-500">
          {error?.response?.data?.error || 'Could not reach the mailbox.'}
        </p>
      )}

      {!isLoading && data && data.messages.length === 0 && (
        <div className="py-24 text-center opacity-30">
          <p className="text-sm uppercase tracking-widest">No messages.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.messages.map((msg) => (
          <MessageRow
            key={msg.uid}
            folder={folder}
            msg={msg}
            open={openUid === msg.uid}
            onToggle={() => setOpenUid((u) => (u === msg.uid ? null : msg.uid))}
            onRead={refreshList}
          />
        ))}
      </div>

      {data && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-gray-200 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-30"
          >
            ← Newer
          </button>
          <span className="text-xs opacity-40">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-200 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-30"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  );
}
