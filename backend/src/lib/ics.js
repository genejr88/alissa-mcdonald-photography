// Minimal iCalendar (RFC 5545) builder — just enough for a single-event
// "Add to calendar" download and a read-only feed of confirmed bookings.
// No external dependency; the format is small enough to hand-roll correctly.

function escapeText(str) {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatUtc(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Fold lines over 75 octets per RFC 5545 — most clients tolerate long lines,
// but folding keeps the feed compliant for the pickier ones (e.g. Outlook).
function foldLine(line) {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    out += '\r\n ' + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return out;
}

function buildEvent({ uid, summary, description, location, start, end, createdAt }) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtc(createdAt || new Date())}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeText(summary)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (location) lines.push(`LOCATION:${escapeText(location)}`);
  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

function buildCalendar(events, { name } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alissa McDonald Photography//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  if (name) lines.push(foldLine(`X-WR-CALNAME:${escapeText(name)}`));
  lines.push(...events);
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

module.exports = { buildEvent, buildCalendar };
