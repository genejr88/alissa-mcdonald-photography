// Sunset time via the standard sunrise equation (NOAA simplification).
// Pure math, no API — accurate to a minute or two, which is plenty for
// tagging golden-hour booking slots.

const RAD = Math.PI / 180;

/**
 * @param {string} dateStr - "YYYY-MM-DD" (studio-local calendar date)
 * @param {number} lat - latitude (north positive)
 * @param {number} lng - longitude (east positive; CT is ~ -73)
 * @returns {Date|null} sunset as a UTC instant, or null in polar edge cases
 */
export function sunsetUtc(dateStr, lat, lng) {
  const [y, m, d] = dateStr.split('-').map(Number);

  // Julian day number for the civil date
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045;

  // Mean solar time at this longitude
  const n = jdn - 2451545;
  const jStar = n - lng / 360;

  // Solar mean anomaly, equation of center, ecliptic longitude
  const M = ((357.5291 + 0.98560028 * jStar) % 360 + 360) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = ((M + C + 180 + 102.9372) % 360 + 360) % 360;

  // Solar transit (local true noon)
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);

  // Declination of the sun
  const sinDelta = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDelta = Math.cos(Math.asin(sinDelta));

  // Hour angle at sunset (sun center at -0.833° accounts for refraction + disc)
  const cosOmega =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDelta) / (Math.cos(lat * RAD) * cosDelta);
  if (cosOmega < -1 || cosOmega > 1) return null; // midnight sun / polar night

  const omega = Math.acos(cosOmega) / RAD; // degrees
  const jSet = jTransit + omega / 360;

  return new Date((jSet - 2440587.5) * 86400 * 1000);
}

/**
 * Sunset expressed as minutes-after-midnight in the given IANA timezone,
 * plus a friendly display string. Returns null when no sunset.
 */
export function sunsetLocal(dateStr, lat, lng, timeZone) {
  const utc = sunsetUtc(dateStr, lat, lng);
  if (!utc) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(utc);
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24;
  const min = Number(parts.find((p) => p.type === 'minute').value);
  const display = utc.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' });
  return { minutes: h * 60 + min, display };
}
