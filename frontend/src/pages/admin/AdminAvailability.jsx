import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAvailabilityRules,
  updateAvailabilityRules,
  getAvailabilityExceptions,
  addAvailabilityException,
  deleteAvailabilityException,
} from '../../lib/api';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [];
for (let h = 7; h <= 20; h++) {
  for (let m of [0, 30]) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    TIMES.push(`${hh}:${mm}`);
  }
}

function TimeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none"
    >
      {TIMES.map((t) => {
        const [h, m] = t.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const display = `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${period}`;
        return <option key={t} value={t}>{display}</option>;
      })}
    </select>
  );
}

function WeeklySchedule({ rules, onSave, isPending }) {
  // Initialize from existing rules, defaulted to off
  const [schedule, setSchedule] = useState(() => {
    const map = {};
    for (const r of rules) {
      map[r.weekday] = { enabled: true, startTime: r.startTime, endTime: r.endTime };
    }
    return Array.from({ length: 7 }, (_, i) =>
      map[i] || { enabled: false, startTime: '09:00', endTime: '17:00' }
    );
  });

  const toggle = (idx) =>
    setSchedule((s) => s.map((d, i) => i === idx ? { ...d, enabled: !d.enabled } : d));
  const setTime = (idx, key, val) =>
    setSchedule((s) => s.map((d, i) => i === idx ? { ...d, [key]: val } : d));

  const save = () => {
    const rules = schedule
      .map((d, weekday) => ({ weekday, ...d }))
      .filter((d) => d.enabled)
      .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }));
    onSave(rules);
  };

  return (
    <div>
      <div className="space-y-3">
        {WEEKDAYS.map((day, idx) => {
          const d = schedule[idx];
          return (
            <div key={day} className="flex items-center gap-4">
              <label className="flex items-center gap-2 w-28 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={() => toggle(idx)}
                />
                <span className={`text-sm ${d.enabled ? '' : 'opacity-30'}`}>{day}</span>
              </label>
              {d.enabled && (
                <>
                  <TimeSelect value={d.startTime} onChange={(v) => setTime(idx, 'startTime', v)} />
                  <span className="text-sm opacity-40">to</span>
                  <TimeSelect value={d.endTime} onChange={(v) => setTime(idx, 'endTime', v)} />
                </>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={save}
        disabled={isPending}
        className="mt-6 bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        {isPending ? 'Saving…' : 'Save Schedule'}
      </button>
    </div>
  );
}

function ExceptionForm({ onAdd, isPending }) {
  const [date, setDate] = useState('');
  const [type, setType] = useState('BLACKOUT');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!date) return;
    onAdd({
      date,
      type,
      startTime: type === 'EXTRA' ? startTime : null,
      endTime: type === 'EXTRA' ? endTime : null,
      note: note || null,
    });
    setDate(''); setNote('');
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="BLACKOUT">Blackout (day off)</option>
            <option value="EXTRA">Extra opening</option>
          </select>
        </div>
        {type === 'EXTRA' && (
          <>
            <div>
              <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">From</label>
              <TimeSelect value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">To</label>
              <TimeSelect value={endTime} onChange={setEndTime} />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Vacation, pop-up event…"
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none w-48"
          />
        </div>
        <button
          disabled={!date || isPending}
          onClick={submit}
          className="bg-black text-white px-4 py-1.5 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function AdminAvailability() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['availability-rules'],
    queryFn: getAvailabilityRules,
  });

  const { data: exceptions = [], isLoading: excLoading } = useQuery({
    queryKey: ['availability-exceptions'],
    queryFn: getAvailabilityExceptions,
  });

  const saveRules = useMutation({
    mutationFn: updateAvailabilityRules,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability-rules'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addException = useMutation({
    mutationFn: addAvailabilityException,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-exceptions'] }),
  });

  const delException = useMutation({
    mutationFn: deleteAvailabilityException,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-exceptions'] }),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl mb-8">Availability</h1>

      {/* Weekly schedule */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest opacity-40 mb-4">Weekly Schedule</h2>
        {rulesLoading ? (
          <p className="opacity-40 text-sm">Loading…</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <WeeklySchedule
              rules={rules}
              onSave={(r) => saveRules.mutate(r)}
              isPending={saveRules.isPending}
            />
            {saved && <p className="mt-3 text-sm text-green-600">Saved!</p>}
          </div>
        )}
      </section>

      {/* Exceptions */}
      <section>
        <h2 className="text-xs uppercase tracking-widest opacity-40 mb-4">Exceptions (Blackouts & Extra Openings)</h2>

        <ExceptionForm
          onAdd={(data) => addException.mutate(data)}
          isPending={addException.isPending}
        />

        <div className="mt-4 space-y-2">
          {excLoading && <p className="opacity-40 text-sm">Loading…</p>}
          {!excLoading && !exceptions.length && (
            <p className="text-sm opacity-30 py-4">No exceptions — your weekly schedule applies everywhere.</p>
          )}
          {exceptions.map((ex) => {
            const d = new Date(ex.date);
            const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
            return (
              <div key={ex.id} className="flex items-center justify-between bg-white border border-gray-100 rounded px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${ex.type === 'BLACKOUT' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {ex.type.toLowerCase()}
                  </span>
                  <span className="text-sm">{dateLabel}</span>
                  {ex.type === 'EXTRA' && ex.startTime && (
                    <span className="text-xs opacity-40" style={{ fontFamily: 'monospace' }}>
                      {ex.startTime} – {ex.endTime}
                    </span>
                  )}
                  {ex.note && <span className="text-xs opacity-40">{ex.note}</span>}
                </div>
                <button
                  onClick={() => delException.mutate(ex.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors ml-4"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
