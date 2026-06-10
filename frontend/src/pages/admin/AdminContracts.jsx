import { useState } from 'react';

const CONTRACT_BASE_URL = 'https://alissamcdonaldphotography.com/contract';
const GOOGLE_FORM_EDIT_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeC8ZSlBbUbvDeiZlUeA2zwmeyJgJb3Ak5a-n2y-PZLwOZhAA/viewform';

function CopyButton({ text, label = 'Copy Link' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="shrink-0 bg-black text-white px-4 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

export default function AdminContracts() {
  const [clientName, setClientName] = useState('');
  const [sessionNote, setSessionNote] = useState('');

  // Build a shareable message
  const link = CONTRACT_BASE_URL;
  const smsBody = clientName
    ? `Hi ${clientName}! Please complete your photography contract here: ${link}${sessionNote ? ` — ${sessionNote}` : ''}`
    : `Please complete your photography contract here: ${link}`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl mb-2">Contracts</h1>
      <p className="text-sm opacity-50 mb-10">
        Share the contract link with clients before their session.
      </p>

      {/* Contract link card */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 mb-6 shadow-sm">
        <p className="text-xs tracking-widest uppercase opacity-40 mb-3">Contract URL</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-gray-50 text-sm px-3 py-2 rounded font-mono text-gray-700 truncate">
            {link}
          </code>
          <CopyButton text={link} />
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Preview ↗
          </a>
        </div>
      </div>

      {/* Generate personalized message */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 mb-6 shadow-sm">
        <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Generate a Message to Send</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs opacity-50 mb-1">Client First Name</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Sarah"
            />
          </div>
          <div>
            <label className="block text-xs opacity-50 mb-1">Optional Note (session date, type, etc.)</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="e.g. Your mini session on June 14"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded p-4 text-sm text-gray-700 leading-relaxed">
            {smsBody}
          </div>

          <div className="flex gap-3">
            <CopyButton text={smsBody} label="Copy Message" />
            <a
              href={`sms:?body=${encodeURIComponent(smsBody)}`}
              className="px-4 py-2 text-xs tracking-widest uppercase rounded border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Open in Messages
            </a>
          </div>
        </div>
      </div>

      {/* View form responses */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
        <p className="text-xs tracking-widest uppercase opacity-40 mb-3">Form Responses</p>
        <p className="text-sm opacity-50 mb-4">
          Completed contracts are stored in Google Forms. View and download responses from the form editor.
        </p>
        <a
          href={GOOGLE_FORM_EDIT_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs tracking-widest uppercase px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          View Google Form Responses ↗
        </a>
      </div>
    </div>
  );
}
