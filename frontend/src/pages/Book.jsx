import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getServices, getAvailableMonth, getAvailableSlots, createBooking } from '../lib/api';
import { sunsetLocal } from '../lib/sun';
import WaxSeal from '../components/WaxSeal';

// Studio location (Trumbull, CT area) — used for golden-hour slot tagging
const STUDIO = { lat: 41.24, lng: -73.2, tz: 'America/New_York' };
// A slot is "golden hour" if it starts in the window before sunset
const GOLDEN_BEFORE_SUNSET = 90; // window opens (minutes before sunset)
const GOLDEN_CUTOFF = 15; // window closes — too close to sunset to start

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
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {services?.map((s) => (
          <motion.button
            key={s.id}
            onClick={() => onSelect(s)}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-current/10 bg-white/40 p-7 text-left transition-colors duration-300 hover:border-current/30"
          >
            {/* accent rail that fills on hover */}
            <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent/70 transition-transform duration-300 group-hover:scale-x-100" />

            <div className="mb-4 flex items-baseline justify-between">
              <span className="font-serif text-3xl opacity-30">№{String(s.number).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] opacity-40" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                {s.durationMin} min
              </span>
            </div>

            <h3 className="mb-3 font-serif text-2xl md:text-3xl">{s.name}</h3>
            <p className="mb-6 text-sm leading-relaxed opacity-60">{s.description}</p>

            {s.includes && (
              <ul className="mb-6 space-y-1.5">
                {s.includes.split('\n').filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] opacity-60" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                    <span className="text-accent">✦</span> {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto flex items-end justify-between border-t border-current/10 pt-5">
              <p className="font-serif text-2xl">
                <span className="align-top text-sm opacity-50">From </span>${parseFloat(s.price).toFixed(0)}
                {s.depositAmount && (
                  <span className="ml-2 text-xs opacity-50">(${parseFloat(s.depositAmount).toFixed(0)} deposit)</span>
                )}
              </p>
              <span className="text-sm tracking-widest opacity-40 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-90">
                Select →
              </span>
            </div>
          </motion.button>
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
  const availableCount = availableSet.size;

  return (
    <div>
      <StepHeader step={2} title="Choose a date" />
      <BackButton onClick={onBack} />

      <div className="mt-8 max-w-md">
        {/* Month nav */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={isCurrentMonth}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-current/15 text-base transition-all hover:border-current/50 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-20"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="font-serif text-2xl leading-none">{MONTHS[month]}</p>
            <p className="mt-1 text-[10px] tracking-[0.3em] opacity-50" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {year}
            </p>
          </div>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-current/15 text-base transition-all hover:border-current/50 hover:bg-ink hover:text-paper"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-current/10 pb-2">
          {DAYS.map(d => (
            <div key={d} className="py-1 text-center text-[10px] tracking-[0.15em] opacity-40" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-current/[0.04]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: numDays }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              const isAvailable = availableSet.has(dateStr) && !isPast;

              if (isPast || (!isAvailable && !isToday)) {
                return (
                  <div
                    key={day}
                    className="flex aspect-square items-center justify-center text-sm opacity-20"
                  >
                    {day}
                  </div>
                );
              }

              return (
                <motion.button
                  key={day}
                  disabled={!isAvailable}
                  onClick={() => onSelect(dateStr)}
                  whileHover={isAvailable ? { y: -2 } : {}}
                  whileTap={isAvailable ? { scale: 0.92 } : {}}
                  className={`group relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors duration-200 ${
                    isAvailable
                      ? 'bg-accent/[0.07] font-medium hover:bg-ink hover:text-paper'
                      : 'cursor-default'
                  } ${isToday ? 'ring-1 ring-inset ring-current/30' : ''}`}
                >
                  <span>{day}</span>
                  {/* available marker dot — hidden on hover when tile fills */}
                  {isAvailable && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent transition-opacity group-hover:opacity-0" />
                  )}
                  {isToday && !isAvailable && (
                    <span className="absolute bottom-1 text-[8px] uppercase tracking-wider opacity-40">today</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-5 flex items-center gap-5 border-t border-current/10 pt-4 text-[10px] tracking-[0.12em] opacity-50" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> AVAILABLE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-1 ring-inset ring-current/40" /> TODAY
          </span>
          {!isLoading && (
            <span className="ml-auto normal-case tracking-normal">
              {availableCount} {availableCount === 1 ? 'date' : 'dates'} open
            </span>
          )}
        </div>
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

  const sunset = sunsetLocal(date, STUDIO.lat, STUDIO.lng, STUDIO.tz);
  const isGolden = (time) => {
    if (!sunset) return false;
    const [h, m] = time.split(':').map(Number);
    const slotMin = h * 60 + m;
    return slotMin >= sunset.minutes - GOLDEN_BEFORE_SUNSET && slotMin <= sunset.minutes - GOLDEN_CUTOFF;
  };
  const hasGolden = !!slots?.some(isGolden);

  return (
    <div>
      <StepHeader step={3} title={`Available times — ${displayDate}`} />
      <BackButton onClick={onBack} />

      {sunset && (
        <p className="mt-6 text-xs tracking-wide opacity-70" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          ☀ Sunset at {sunset.display}
          {hasGolden && ' — golden hour slots marked below'}
        </p>
      )}

      {isLoading && <div className="py-16 text-center opacity-50 text-sm">Loading…</div>}

      {!isLoading && !slots?.length && (
        <div className="py-16 text-center opacity-60">
          <p className="text-sm tracking-widest uppercase">No times available on this date.</p>
          <button onClick={onBack} className="mt-4 text-xs underline">Choose another date</button>
        </div>
      )}

      <div className="mt-6 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {slots?.map((time) => {
          const [h, m] = time.split(':').map(Number);
          const period = h >= 12 ? 'PM' : 'AM';
          const display = `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${period}`;
          const golden = isGolden(time);
          return (
            <motion.button
              key={time}
              onClick={() => onSelect(time)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg py-3 px-2 text-center text-sm tracking-wide transition-colors duration-200 hover:bg-ink hover:text-paper ${
                golden
                  ? 'border border-accent/50 bg-accent/[0.08]'
                  : 'border border-current/10 bg-accent/[0.04]'
              }`}
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              <span className="block">{display}</span>
              {golden && (
                <span className="mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-accent">
                  ☀ golden hour
                </span>
              )}
            </motion.button>
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
      className="relative max-w-lg"
    >
      {/* Sealed with wax — stamps down a beat after the page settles */}
      <WaxSeal className="absolute -top-4 right-0 md:-right-6" size={92} delay={0.7} />
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
const STEP_LABELS = ['Session', 'Date', 'Time', 'Details'];

function Stepper({ current }) {
  return (
    <div className="mb-12 flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] transition-colors duration-300 ${
                  active
                    ? 'border-ink bg-ink text-paper'
                    : done
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-current/20 opacity-40'
                }`}
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                {done ? '✓' : String(n).padStart(2, '0')}
              </span>
              <span
                className={`hidden text-[10px] uppercase tracking-[0.18em] transition-opacity sm:inline ${
                  active ? 'opacity-90' : 'opacity-40'
                }`}
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                {label}
              </span>
            </div>
            {n < STEP_LABELS.length && (
              <span className="relative h-px flex-1 bg-current/15">
                <motion.span
                  className="absolute inset-0 origin-left bg-accent/60"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepHeader({ step, title }) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-accent" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        № 0{step} — {STEP_LABELS[step - 1]}
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
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-24">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
          className="mb-10"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] opacity-50" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            Reserve your session
          </p>
          <h1
            className="font-serif"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', lineHeight: 0.95, letterSpacing: '-0.02em' }}
          >
            Book a <em className="italic">Session</em>
          </h1>
        </motion.div>

        {!confirmed && <Stepper current={step} />}

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
