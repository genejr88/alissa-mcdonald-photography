import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetContracts,
  adminGetContractTemplates,
  adminCreateContractTemplate,
  adminUpdateContractTemplate,
  adminSendContract,
  adminGetBookings,
} from '../../lib/api';
import { renderMarkdown } from '../../lib/contractMarkdown';
import { LOGO_DARK } from '../../lib/branding';

const SITE_URL = 'https://alissamcdonaldphotography.com';

function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// ── Send Contract Modal ───────────────────────────────────────────────────────
function SendModal({ templates, bookings, onClose, onSent }) {
  const [bookingId, setBookingId] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [manual, setManual] = useState({ clientName: '', clientEmail: '', sessionType: '', sessionDate: '', price: '', deposit: '' });
  const [result, setResult] = useState(null);

  const qc = useQueryClient();
  const send = useMutation({
    mutationFn: adminSendContract,
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['admin-contracts'] });
    },
  });

  // Auto-fill from selected booking
  const selectedBooking = bookings?.find((b) => b.id === bookingId);
  const effectiveName = bookingId && selectedBooking ? selectedBooking.clientName : manual.clientName;
  const effectiveEmail = bookingId && selectedBooking ? selectedBooking.clientEmail : manual.clientEmail;
  const effectiveType = bookingId && selectedBooking ? selectedBooking.service?.name : manual.sessionType;
  const effectiveDate = bookingId && selectedBooking
    ? new Date(selectedBooking.startsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : manual.sessionDate;
  const effectivePrice = bookingId && selectedBooking
    ? `$${parseFloat(selectedBooking.service?.price || 0).toFixed(0)}`
    : manual.price;
  const effectiveDeposit = bookingId && selectedBooking && selectedBooking.service?.depositAmount
    ? `$${parseFloat(selectedBooking.service.depositAmount).toFixed(0)}`
    : manual.deposit;

  const canSend = templateId && effectiveName && effectiveEmail;

  const handleSend = () => {
    send.mutate({
      templateId,
      bookingId: bookingId || undefined,
      clientName: effectiveName,
      clientEmail: effectiveEmail,
      sessionType: effectiveType,
      sessionDate: effectiveDate,
      price: effectivePrice,
      deposit: effectiveDeposit,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {result ? (
            // Success state
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-500 text-xl">✓</span>
              </div>
              <h3 className="font-serif text-xl mb-2">Contract sent!</h3>
              <p className="text-sm opacity-50 mb-4">Email sent to {effectiveEmail}</p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-600 break-all mb-4">
                {result.signingLink}
              </div>
              <div className="flex gap-3 justify-center">
                <CopyBtn text={result.signingLink} label="Copy link" />
                <a
                  href={`sms:?body=${encodeURIComponent(`Hi ${effectiveName}! Please sign your photography contract here: ${result.signingLink}`)}`}
                  className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Open in Messages
                </a>
                <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-black text-white hover:bg-gray-800">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl mb-6">Send Contract</h2>

              {/* Pick a booking */}
              <div className="mb-5">
                <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Link to a Booking (optional)</label>
                <select
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                >
                  <option value="">No booking — enter details manually</option>
                  {bookings?.filter(b => b.status !== 'CANCELLED').map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.clientName} — {b.service?.name} — {new Date(b.startsAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual fields (shown when no booking selected) */}
              {!bookingId && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Client Name *</label>
                    <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none" value={manual.clientName} onChange={e => setManual(m => ({ ...m, clientName: e.target.value }))} placeholder="Full name" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Client Email *</label>
                    <input type="email" className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none" value={manual.clientEmail} onChange={e => setManual(m => ({ ...m, clientEmail: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Session Type</label>
                    <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none" value={manual.sessionType} onChange={e => setManual(m => ({ ...m, sessionType: e.target.value }))} placeholder="The Mini" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Session Date</label>
                    <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none" value={manual.sessionDate} onChange={e => setManual(m => ({ ...m, sessionDate: e.target.value }))} placeholder="July 15, 2025" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Price</label>
                    <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none" value={manual.price} onChange={e => setManual(m => ({ ...m, price: e.target.value }))} placeholder="$175" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Deposit</label>
                    <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none" value={manual.deposit} onChange={e => setManual(m => ({ ...m, deposit: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
              )}

              {/* Preview filled fields */}
              {bookingId && (
                <div className="bg-gray-50 rounded p-3 text-xs mb-5 space-y-1 font-mono">
                  <div><span className="opacity-40">client:</span> {effectiveName} &lt;{effectiveEmail}&gt;</div>
                  {effectiveType && <div><span className="opacity-40">session:</span> {effectiveType}</div>}
                  {effectiveDate && <div><span className="opacity-40">date:</span> {effectiveDate}</div>}
                  {effectivePrice && <div><span className="opacity-40">price:</span> {effectivePrice}</div>}
                </div>
              )}

              {/* Template */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Contract Template *</label>
                <select
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {send.isError && (
                <p className="text-red-500 text-sm mb-3">{send.error?.response?.data?.error || 'Failed to send.'}</p>
              )}

              <div className="flex gap-3">
                <button
                  disabled={!canSend || send.isPending}
                  onClick={handleSend}
                  className="flex-1 bg-black text-white py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {send.isPending ? 'Sending…' : 'Send Contract →'}
                </button>
                <button onClick={onClose} className="border border-gray-200 px-4 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template editor ───────────────────────────────────────────────────────────

const MERGE_FIELDS = [
  { token: '{{client_name}}', label: 'Client name', sample: 'Jane Smith' },
  { token: '{{session_type}}', label: 'Session type', sample: 'The Full Session' },
  { token: '{{session_date}}', label: 'Session date', sample: 'Saturday, July 18, 2026' },
  { token: '{{price}}', label: 'Price', sample: '$200' },
  { token: '{{deposit}}', label: 'Deposit', sample: '$50' },
];

const STARTER_TEMPLATE = `# Photography Services Agreement

This agreement is between **Alissa McDonald Photography** ("Photographer") and **{{client_name}}** ("Client") for the session described below.

**Session:** {{session_type}}
**Date:** {{session_date}}
**Session fee:** {{price}}
**Deposit due to confirm:** {{deposit}}

## 1. Booking & Payment
A deposit is required to confirm your session date. The remaining balance is due on or before the session date.

## 2. Cancellation & Rescheduling
Client may reschedule with at least 48 hours notice. Deposits are non-refundable but may be applied to one rescheduled session within 90 days.

## 3. Image Delivery
Edited images are delivered via a private online gallery. Photographer selects and edits images in her artistic style; unedited files are not provided.

## 4. Copyright & Usage
Photographer retains copyright. Client receives a personal-use license to download, print, and share delivered images.

## 5. Model Release
Client grants Photographer permission to use session images for portfolio, website, and social media unless otherwise agreed in writing.

By signing below, Client agrees to the terms above.`;

// Substitute merge tokens with ⟦sample⟧ markers the preview renderer highlights
function withSampleData(body) {
  let out = body;
  for (const f of MERGE_FIELDS) {
    out = out.split(f.token).join(`⟦${f.sample}⟧`);
  }
  return out;
}

function TemplateEditor({ template, onSave, onCancel, isPending }) {
  const [name, setName] = useState(template?.name || '');
  const [body, setBody] = useState(template?.body || '');
  const [mobileView, setMobileView] = useState('write'); // write | preview (below lg)
  const textareaRef = useRef(null);

  // Insert text at the caret and restore focus
  function insertAtCursor(text) {
    const ta = textareaRef.current;
    if (!ta) return setBody((b) => b + text);
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  }

  // Wrap the current selection (e.g. bold), or insert placeholder
  function wrapSelection(prefix, suffix, placeholder) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + selected.length;
    });
  }

  // Insert a new section heading on its own line
  function insertSection() {
    const ta = textareaRef.current;
    const atLineStart = !ta || ta.selectionStart === 0 || body[ta.selectionStart - 1] === '\n';
    insertAtCursor(`${atLineStart ? '' : '\n\n'}## New Section\n`);
  }

  const toolbarBtn =
    'rounded border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-50 transition-colors';

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5">
      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wide opacity-50 mb-1">Template Name</label>
        <input
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Standard Photography Agreement"
        />
      </div>

      {/* Toolbar */}
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest opacity-50 mr-1">Auto-fill fields</span>
          {MERGE_FIELDS.map((f) => (
            <button
              key={f.token}
              type="button"
              onClick={() => insertAtCursor(f.token)}
              title={`Inserts ${f.token} — replaced with the real value when you send`}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800 hover:bg-amber-100 transition-colors"
            >
              + {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest opacity-50 mr-1">Formatting</span>
          <button type="button" onClick={insertSection} className={toolbarBtn}>
            ¶ Section heading
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('**', '**', 'bold text')}
            className={`${toolbarBtn} font-bold`}
          >
            B Bold
          </button>
          {/* Mobile-only write/preview toggle */}
          <div className="ml-auto flex gap-1 lg:hidden">
            {[['write', 'Write'], ['preview', 'Preview']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMobileView(v)}
                className={`rounded px-3 py-1.5 text-xs ${mobileView === v ? 'bg-black text-white' : 'border border-gray-200'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor + live preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${mobileView === 'write' ? 'block' : 'hidden'} lg:block`}>
          {!body.trim() && (
            <button
              type="button"
              onClick={() => setBody(STARTER_TEMPLATE)}
              className="mb-2 w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              ✦ Start from the standard agreement
            </button>
          )}
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded border border-gray-200 px-3 py-2 font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-gray-400"
            rows={26}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'# Title\n\nWrite your contract here. Click the buttons above to insert auto-fill fields and section headings.'}
          />
        </div>

        {/* Live preview — exactly what the client sees on the signing page */}
        <div className={`${mobileView === 'preview' ? 'block' : 'hidden'} lg:block`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest opacity-50">
              Live preview — what your client sees
            </p>
            <p className="text-[10px] opacity-50">
              <mark className="rounded bg-accent/15 px-1">highlighted</mark> = filled in automatically
            </p>
          </div>
          <div
            className="h-[520px] overflow-y-auto rounded border border-gray-200 px-6 py-6"
            style={{ background: 'var(--paper)' }}
          >
            <img src={LOGO_DARK} alt="" className="mb-4 h-12 w-auto" />
            <div className="border-b pb-4 mb-2" style={{ borderColor: 'rgba(46,44,39,0.1)' }} />
            {body.trim() ? (
              renderMarkdown(withSampleData(body))
            ) : (
              <p className="text-sm italic opacity-40">Start typing to see the preview…</p>
            )}
            {body.trim() && (
              <div className="mt-10 border-t pt-6" style={{ borderColor: 'rgba(46,44,39,0.1)' }}>
                <p className="font-serif text-lg mb-4" style={{ color: 'var(--ink)' }}>Sign Below</p>
                <p className="font-serif text-2xl italic opacity-40" style={{ color: 'var(--ink)' }}>
                  Jane Smith
                </p>
                <div className="mt-1 h-px w-56" style={{ background: 'rgba(46,44,39,0.25)' }} />
                <p className="mt-2 text-[10px] uppercase tracking-widest opacity-40">
                  Client signs here on their phone or computer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          disabled={!name || !body || isPending}
          onClick={() => onSave({ name, body })}
          className="bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save Template'}
        </button>
        <button onClick={onCancel} className="border border-gray-200 px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminContracts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('sent');
  const [showSend, setShowSend] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null); // null | 'new' | template object

  const { data: contracts = [] } = useQuery({ queryKey: ['admin-contracts'], queryFn: adminGetContracts });
  const { data: templates = [] } = useQuery({ queryKey: ['contract-templates'], queryFn: adminGetContractTemplates });
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings', 'all'], queryFn: () => adminGetBookings({}) });

  const createTemplate = useMutation({
    mutationFn: adminCreateContractTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contract-templates'] }); setEditTemplate(null); },
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }) => adminUpdateContractTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contract-templates'] }); setEditTemplate(null); },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Contracts</h1>
        <button
          onClick={() => setShowSend(true)}
          className="bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors"
        >
          Send Contract →
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['sent', 'Sent'], ['templates', 'Templates']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`text-xs px-4 py-2 rounded transition-colors ${tab === v ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
          >
            {l} {v === 'sent' && contracts.length ? `(${contracts.length})` : ''}
          </button>
        ))}
      </div>

      {/* Sent contracts */}
      {tab === 'sent' && (
        <div>
          {!contracts.length && (
            <div className="text-center py-24 opacity-30">
              <p className="text-sm tracking-widest uppercase">No contracts sent yet.</p>
              <p className="mt-2 text-xs">Click "Send Contract" to get started.</p>
            </div>
          )}
          <div className="space-y-3">
            {contracts.map((c) => {
              const signed = !!c.signedAt;
              const expired = !signed && new Date() > new Date(c.expiresAt);
              const link = `${SITE_URL}/sign/${c.token}`;
              return (
                <div key={c.id} className="bg-white border border-gray-100 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-medium text-sm">
                          {c.booking?.clientName || '—'}
                        </span>
                        <span className="text-xs opacity-40">{c.booking?.clientEmail || ''}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${signed ? 'bg-green-50 text-green-600 border border-green-200' : expired ? 'bg-red-50 text-red-400 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                          {signed ? '✓ Signed' : expired ? 'Expired' : 'Awaiting signature'}
                        </span>
                      </div>
                      <p className="text-xs opacity-30 font-mono">
                        {c.template?.name} · Sent {new Date(c.createdAt).toLocaleDateString()}
                        {signed && ` · Signed ${new Date(c.signedAt).toLocaleDateString()} by ${c.signerName}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {!signed && !expired && <CopyBtn text={link} label="Copy link" />}
                      {c.pdfUrl && (
                        <a
                          href={c.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          PDF ↗
                        </a>
                      )}
                      {!signed && !expired && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Preview ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates */}
      {tab === 'templates' && (
        <div>
          {editTemplate === 'new' && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest opacity-40 mb-3">New Template</p>
              <TemplateEditor
                template={null}
                onSave={(data) => createTemplate.mutate(data)}
                onCancel={() => setEditTemplate(null)}
                isPending={createTemplate.isPending}
              />
            </div>
          )}

          {!editTemplate && (
            <button
              onClick={() => setEditTemplate('new')}
              className="mb-6 border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 text-xs px-4 py-2 rounded transition-colors"
            >
              + New Template
            </button>
          )}

          <div className="space-y-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                {editTemplate?.id === t.id ? (
                  <div className="p-4">
                    <TemplateEditor
                      template={t}
                      onSave={(data) => updateTemplate.mutate({ id: t.id, data })}
                      onCancel={() => setEditTemplate(null)}
                      isPending={updateTemplate.isPending}
                    />
                  </div>
                ) : (
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-sm mb-1">{t.name}</h3>
                      <p className="text-xs opacity-30">
                        Last updated {new Date(t.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditTemplate(t)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showSend && (
        <SendModal
          templates={templates}
          bookings={bookings}
          onClose={() => setShowSend(false)}
          onSent={() => setShowSend(false)}
        />
      )}
    </div>
  );
}
