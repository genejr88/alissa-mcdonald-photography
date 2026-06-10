import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getServices, getAvailableMonth, getAvailableSlots, createBooking } from '../lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── Step 1: Choose session type ───────────────────────────────────────────────
function StepService({ onSelect }) {
  const { data: services, isLoading } = useQuery({ queryKey: ['services'], queryFn: getServices });

  if (isLoading) return <div className="py-24 text-center opacity-50 text-sm tracking-widest uppercase">Loading…</div>;

  return (
    <div>
      <StepHeader step={1} title="Choose your session" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        {services?.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="text-left border border-current/10 hover:border-current/30 p-8 transition-all duration-300 group"
            style={{ background: 'transparent' }}
          >
            <p className="text-xs tracking-widest uppercase opacity-60 mb-3" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              № {String(s.number).padStart(2, '0')}
            </p>
            <h3 className="font-serif text-2xl md:text-3xl mb-4 group-hover:opacity-70 transition-opacity">
              {s.name}
            </h3>
            <p className="text-sm leading-relaxed opacity-60 mb-6">{s.description}</p>
            {s.includes && (
              <ul className="space-y-1 mb-6">
                {s.includes.split('\n').filter(Boolean).map((item, i) => (
                  <li key={i} className="text-xs tracking-widest uppercase opacity-60" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                    — {item}
                  </li>
                ))}
              </ul>
            )}
            <p className="font-serif text-xl opacity-80">
              From ${parseFloat(s.price).toFixed(0)}
              {s.depositAmount && (
                <span className="text-sm opacity-70 ml-2">(${parseFloat(s.depositAmount).toFixed(0)} deposit)</span>
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Choose date ───────────────────────────────────────────────────────
function StepDate({ service, onSelect, onBack }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const mk = monthKey(year, month);
  const { data: availableDates, isLoading } = useQuery({
    queryKey: ['available-month', service.id, mk],
    queryFn: () => getAvailableMonth(service.id, mk),
  });

  const availableSet = new Set(availableDates || []);
  const todayStr = today();
  const firstDay = firstDayOfMonth(year, month);
  const numDays = daysInMonth(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Don't allow navigating before current month
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div>
      <StepHeader step={2} title="Choose a date" />
      <BackButton onClick={onBack} />

      <div className="mt-8 max-w-md">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            disabled={isCurrentMonth}
            className="text-sm opacity-60 hover:opacity-80 disabled:opacity-20 transition-opacity px-2"
          >
            ‹ Prev
          </button>
          <p className="font-serif text-xl">{MONTHS[month]} {year}</p>
          <button onClick={nextMonth} className="text-sm opacity-60 hover:opacity-80 transition-opacity px-2">
            Next ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs tracking-widest uppercase opacity-70 py-1" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="h-48 flex items-center justify-center opacity-50 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: numDays }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isPast = dateStr <= todayStr;
              const isAvailable = availableSet.has(dateStr);
              return (
                <button
                  key={day}
                  disabled={isPast || !isAvailable}
                  onClick={() => onSelect(dateStr)}
                  className="relative h-10 w-full flex items-center justify-center text-sm transition-all duration-200 rounded-sm group"
                  style={{
                    opacity: isPast || !isAvailable ? 0.2 : 1,
                    cursor: isPast || !isAvailable ? 'default' : 'pointer',
                  }}
                >
                  <span className="relative z-10">{day}</span>
                  {isAvailable && !isPast && (
                    <span className="absolute inset-0 rounded-full border border-current scale-0 group-hover:scale-100 transition-transform duration-200" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Choose time ───────────────────────────────────────────────────────
function StepTime({ service, date, onSelect, onBack }) {
  const { data: slots, isLoading } = useQuery({
    queryKey: ['slots', service.id, date],
    queryFn: () => getAvailableSlots(service.id, date),
  });

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <StepHeader step={3} title={`Available times — ${displayDate}`} />
      <BackButton onClick={onBack} />

      {isLoading && <div className="py-16 text-center opacity-50 text-sm">Loading…</div>}

      {!isLoading && !slots?.length && (
        <div className="py-16 text-center opacity-60">
          <p className="text-sm tracking-widest uppercase">No times available on this date.</p>
          <button onClick={onBack} className="mt-4 text-xs underline">Choose another date</button>
        </div>
      )}

      <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {slots?.map((time) => {
          const [h, m] = time.split(':').map(Number);
          const period = h >= 12 ? 'PM' : 'AM';
          const display = `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${period}`;
          return (
            <button
              key={time}
              onClick={() => onSelect(time)}
              className="border border-current/20 px-2 py-3 text-center text-sm tracking-wide transition-all duration-200 hover:border-current/60 hover:bg-ink hover:text-paper"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Client details ────────────────────────────────────────────────────
function StepDetails({ onSubmit, onBack, isSubmitting, error }) {
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.clientName.trim() && form.clientEmail.includes('@');

  return (
    <div>
      <StepHeader step={4} title="Your details" />
      <BackButton onClick={onBack} />

      <div className="mt-8 max-w-md space-y-5">
        <Field label="Full name *" value={form.clientName} onChange={v => set('clientName', v)} placeholder="Your full name" />
        <Field label="Email *" type="email" value={form.clientEmail} onChange={v => set('clientEmail', v)} placeholder="you@email.com" />
        <Field label="Phone" type="tel" value={form.clientPhone} onChange={v => set('clientPhone', v)} placeholder="Optional" />
        <div>
          <label className="block text-xs tracking-widest uppercase opacity-60 mb-2">Anything you'd like me to know?</label>
          <textarea
            className="w-full border-b border-current/20 bg-transparent py-2 text-sm focus:outline-none focus:border-current/60 resize-none transition-colors"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Kids' ages, pets, location ideas, shoot purpose…"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          disabled={!valid || isSubmitting}
          onClick={() => onSubmit(form)}
          className="mt-4 text-sm tracking-widest uppercase opacity-80 hover:opacity-100 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? 'Sending…' : 'Request session →'}
        </button>
      </div>
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────────────────────
function Confirmed({ token, service, date, time }) {
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayTime = `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${period}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-lg"
    >
      <p className="text-xs tracking-widest uppercase opacity-60 mb-6" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        Session requested
      </p>
      <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1 }}>
        I can't wait to meet you.
      </h2>
      <div className="mt-8 space-y-2 text-sm opacity-60">
        <p>{service.name}</p>
        <p>{displayDate} at {displayTime}</p>
      </div>
      <p className="mt-6 text-sm opacity-70 leading-relaxed">
        Check your email for a confirmation — I'll be in touch soon to confirm your spot. You can view your booking anytime at the link in your email.
      </p>
      <div className="mt-8 border-t border-current/10 pt-6">
        <p className="text-xs opacity-60 mb-3 tracking-widest uppercase">Next step</p>
        <p className="text-sm opacity-70 leading-relaxed">
          Once your date is confirmed, I&rsquo;ll email you a contract to sign online — no
          printing needed.
        </p>
      </div>
    </motion.div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function StepHeader({ step, title }) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-xs tracking-widest uppercase opacity-70 mb-3" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        Step {step} of 4
      </p>
      <h2 className="font-serif" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.75rem)', lineHeight: 1.1 }}>
        {title}
      </h2>
    </motion.div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 text-xs tracking-widest uppercase opacity-70 hover:opacity-80 transition-opacity"
    >
      ← Back
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase opacity-60 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-current/20 bg-transparent py-2 text-sm focus:outline-none focus:border-current/60 transition-colors"
      />
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function Book() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [confirmed, setConfirmed] = useState(null); // { token }
  const [bookError, setBookError] = useState(null);

  const book = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => setConfirmed(data),
    onError: (e) => setBookError(e.response?.data?.error || 'Something went wrong. Please try again.'),
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="max-w-4xl mx-auto px-6 md:px-16 pt-24 pb-24">
        {/* Page title */}
        <motion.h1
          className="font-serif mb-12"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)', lineHeight: 0.95, letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
        >
          Book a Session
        </motion.h1>

        <AnimatePresence mode="wait">
          {confirmed ? (
            <Confirmed
              key="confirmed"
              token={confirmed.token}
              service={service}
              date={date}
              time={time}
            />
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <StepService
                  onSelect={(s) => { setService(s); setStep(2); }}
                />
              )}
              {step === 2 && service && (
                <StepDate
                  service={service}
                  onSelect={(d) => { setDate(d); setStep(3); }}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && service && date && (
                <StepTime
                  service={service}
                  date={date}
                  onSelect={(t) => { setTime(t); setStep(4); }}
                  onBack={() => setStep(2)}
                />
              )}
              {step === 4 && service && date && time && (
                <StepDetails
                  onSubmit={(form) => {
                    setBookError(null);
                    book.mutate({ serviceId: service.id, date, time, ...form });
                  }}
                  onBack={() => setStep(3)}
                  isSubmitting={book.isPending}
                  error={bookError}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
