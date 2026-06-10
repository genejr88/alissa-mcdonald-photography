import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getContractForSigning, submitContractSignature } from '../lib/api';

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(md) {
  const lines = md.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="font-serif text-2xl md:text-3xl mt-8 mb-3" style={{ color: 'var(--ink)' }}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="font-serif text-lg md:text-xl mt-6 mb-2 font-semibold" style={{ color: 'var(--ink)' }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-base font-semibold mt-4 mb-1" style={{ color: 'var(--ink)' }}>{line.slice(4)}</h3>);
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-3" />);
    } else {
      // Inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={key++} className="text-sm leading-relaxed mb-1" style={{ color: 'var(--ink)' }}>
          {parts.map((part, pi) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={pi}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    }
  }
  return elements;
}

// ── Canvas signature pad ──────────────────────────────────────────────────────
function SignaturePad({ onSigned, onCleared }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasMark = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawing.current = true;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2E2C27';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    if (!hasMark.current) {
      hasMark.current = true;
      onSigned();
    }
  }, [onSigned]);

  const stopDraw = useCallback(() => {
    drawing.current = false;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasMark.current = false;
    onCleared();
  }, [onCleared]);

  const getDataUrl = useCallback(() => {
    return canvasRef.current?.toDataURL('image/png');
  }, []);

  // Expose getDataUrl via ref
  useEffect(() => {
    if (canvasRef.current) canvasRef.current._getDataUrl = getDataUrl;
  }, [getDataUrl]);

  return (
    <div>
      <div className="relative border rounded" style={{ borderColor: 'var(--ink)', borderOpacity: 0.2, background: '#FAFAF7' }}>
        <canvas
          ref={canvasRef}
          width={700}
          height={200}
          style={{ width: '100%', height: '140px', display: 'block', touchAction: 'none', cursor: 'crosshair', borderRadius: '2px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
          <div style={{ height: '1px', width: '60%', background: 'var(--ink)', opacity: 0.15 }} />
        </div>
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity"
      >
        Clear
      </button>
    </div>
  );
}

// ── Main signing page ─────────────────────────────────────────────────────────
export default function Sign() {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const [signerName, setSignerName] = useState('');
  const [hasSig, setHasSig] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(null); // { pdfUrl }

  const { data: contract, isLoading, isError, error } = useQuery({
    queryKey: ['contract-sign', token],
    queryFn: () => getContractForSigning(token),
    retry: false,
  });

  const submit = useMutation({
    mutationFn: ({ signerName, signatureData }) =>
      submitContractSignature(token, { signerName, signatureData }),
    onSuccess: (data) => setDone(data),
  });

  const handleSubmit = () => {
    // Get data URL from canvas
    const sigEl = document.querySelector('canvas[data-sigpad]') || document.querySelector('canvas');
    const signatureData = sigEl?._getDataUrl?.() || sigEl?.toDataURL('image/png');
    submit.mutate({ signerName, signatureData });
  };

  const canSubmit = signerName.trim().length >= 3 && hasSig && agreed && !submit.isPending;

  if (isLoading) return <PageShell><p className="opacity-30 text-sm animate-pulse">Loading contract…</p></PageShell>;

  if (isError) {
    const msg = error?.response?.data?.error || 'This link is invalid, expired, or has already been used.';
    return (
      <PageShell>
        <p className="text-sm opacity-50">{msg}</p>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="w-10 h-10 rounded-full border flex items-center justify-center mb-6" style={{ borderColor: 'var(--ink)', opacity: 0.6 }}>
            <span className="text-lg">✓</span>
          </div>
          <h2 className="font-serif text-3xl mb-4">You're all signed.</h2>
          <p className="text-sm opacity-50 leading-relaxed max-w-sm mb-6">
            Thank you for signing. A copy has been sent to your email. I can't wait for your session!
          </p>
          {done.pdfUrl && (
            <a
              href={done.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline opacity-60 hover:opacity-90 transition-opacity"
            >
              Download signed contract (PDF) →
            </a>
          )}
        </motion.div>
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-20 pb-32">
        {/* Header */}
        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'rgba(46,44,39,0.1)' }}>
          <p className="text-xs tracking-widest uppercase opacity-40 mb-2" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            Alissa McDonald Photography
          </p>
          <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', lineHeight: 1.05, color: 'var(--ink)' }}>
            Photography Services Agreement
          </h1>
          <p className="text-xs opacity-30 mt-2" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            Please read the full agreement below before signing.
          </p>
        </div>

        {/* Contract body */}
        <div className="mb-12">
          {renderMarkdown(contract.renderedBody)}
        </div>

        {/* Signing section */}
        <div className="border-t pt-10" style={{ borderColor: 'rgba(46,44,39,0.1)' }}>
          <h2 className="font-serif text-xl mb-8" style={{ color: 'var(--ink)' }}>Sign Below</h2>

          {/* Typed name */}
          <div className="mb-8">
            <label className="block text-xs tracking-widest uppercase opacity-40 mb-3">
              Type your full legal name *
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Your full name as it appears on your ID"
              className="w-full max-w-md border-b bg-transparent py-2 text-base focus:outline-none transition-colors"
              style={{
                borderColor: signerName.trim().length >= 3 ? 'var(--ink)' : 'rgba(46,44,39,0.2)',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Canvas pad */}
          <div className="mb-8">
            <label className="block text-xs tracking-widest uppercase opacity-40 mb-3">
              Draw your signature *
            </label>
            <SignaturePad
              onSigned={() => setHasSig(true)}
              onCleared={() => setHasSig(false)}
            />
          </div>

          {/* I agree */}
          <label className="flex items-start gap-3 mb-10 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm leading-relaxed opacity-60">
              I have read and agree to the Photography Services Agreement above. I understand this constitutes a legally binding electronic signature.
            </span>
          </label>

          {/* Submit */}
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-8 py-3 text-sm tracking-widest uppercase transition-all duration-200"
            style={{
              background: canSubmit ? 'var(--ink)' : 'transparent',
              color: canSubmit ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid var(--ink)',
              opacity: canSubmit ? 1 : 0.3,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {submit.isPending ? 'Submitting…' : 'Sign & Submit →'}
          </button>

          {submit.isError && (
            <p className="mt-4 text-red-500 text-sm">
              {submit.error?.response?.data?.error || 'Something went wrong. Please try again.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--paper)' }}>
      <div className="max-w-md text-center">{children}</div>
    </div>
  );
}
