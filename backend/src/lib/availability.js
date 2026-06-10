// Converts a studio-local date+time string to a UTC Date object.
// timezone: IANA string like "America/New_York"
// dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
function studioTimeToUtc(dateStr, timeStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  // Create a date as if it were UTC at the given local time
  const pseudoUtc = new Date(Date.UTC(year, month - 1, day, hour, min, 0));
  // Get the studio timezone's offset at that moment (in minutes, positive = ahead)
  const utcMs = new Date(pseudoUtc.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const studioMs = new Date(pseudoUtc.toLocaleString('en-US', { timeZone: timezone })).getTime();
  const offsetMs = studioMs - utcMs;
  return new Date(pseudoUtc.getTime() - offsetMs);
}

// Returns day-of-week (0=Sun...6=Sat) in studio timezone for a given date string.
function studioWeekday(dateStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // noon UTC to avoid date boundary issues
  const local = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
  return local.getDay();
}

// Returns "HH:MM" from a Date in studio timezone.
function utcToStudioTime(date, timezone) {
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Compares two "HH:MM" strings.
function timeGte(a, b) { return a >= b; }
function timeLt(a, b) { return a < b; }

// Adds minutes to a "HH:MM" string → "HH:MM"
function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Returns available time slot strings ("HH:MM") for a given date + service.
 *
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {{ durationMin: number, bufferMin: number }} service
 * @param {Array<{ weekday: number, startTime: string, endTime: string }>} rules
 * @param {Array<{ date: Date, type: string, startTime: string|null, endTime: string|null }>} exceptions
 * @param {Array<{ startsAt: Date, endsAt: Date }>} existingBookings
 * @param {string} timezone
 * @returns {string[]}
 */
function getAvailableSlots(dateStr, service, rules, exceptions, existingBookings, timezone) {
  const weekday = studioWeekday(dateStr, timezone);
  const rule = rules.find((r) => r.weekday === weekday);

  // Check for blackout
  const blackout = exceptions.find(
    (e) => e.type === 'BLACKOUT' && toDateStr(e.date) === dateStr
  );
  if (blackout) return [];

  // Determine open window
  let windowStart, windowEnd;
  const extra = exceptions.find(
    (e) => e.type === 'EXTRA' && toDateStr(e.date) === dateStr
  );

  if (extra && extra.startTime && extra.endTime) {
    windowStart = extra.startTime;
    windowEnd = extra.endTime;
  } else if (rule) {
    windowStart = rule.startTime;
    windowEnd = rule.endTime;
  } else {
    return []; // No rule and no EXTRA exception → closed
  }

  // Generate candidate slots every 30 minutes
  const slots = [];
  let cursor = windowStart;
  while (timeLt(addMinutes(cursor, service.durationMin), windowEnd) ||
         addMinutes(cursor, service.durationMin) === windowEnd) {
    slots.push(cursor);
    cursor = addMinutes(cursor, 30);
    if (timeGte(cursor, windowEnd)) break;
  }

  // Filter out slots that overlap existing bookings (including buffers on both ends)
  const available = slots.filter((slotTime) => {
    const slotStart = studioTimeToUtc(dateStr, slotTime, timezone);
    const slotEnd = new Date(slotStart.getTime() + service.durationMin * 60000);
    const windowS = new Date(slotStart.getTime() - service.bufferMin * 60000);
    const windowE = new Date(slotEnd.getTime() + service.bufferMin * 60000);

    for (const booking of existingBookings) {
      const bStart = new Date(booking.startsAt);
      const bEnd = new Date(booking.endsAt);
      const bWindowS = new Date(bStart.getTime() - service.bufferMin * 60000);
      const bWindowE = new Date(bEnd.getTime() + service.bufferMin * 60000);
      // Overlap check: our window overlaps booking's window
      if (windowS < bWindowE && windowE > bWindowS) return false;
    }
    return true;
  });

  return available;
}

function toDateStr(date) {
  // date may be a Prisma Date (stored as Date at midnight UTC)
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

module.exports = { getAvailableSlots, studioTimeToUtc, studioWeekday, toDateStr };
