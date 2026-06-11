// Brand assets — the logo lives in Cloudinary (uploaded from her original SVG).
// `e_trim` crops the transparent padding; `e_colorize` makes the white knockout.
const BASE = 'https://res.cloudinary.com/dxngcapcj/image/upload';

export const LOGO_DARK = `${BASE}/e_trim/c_scale,w_800/amp-brand/logo.png`;
export const LOGO_WHITE = `${BASE}/e_trim/c_scale,w_800/co_white,e_colorize:100/amp-brand/logo.png`;

// Her real signature ("Alissa ♥"), extracted from a marker original —
// transparent PNG tinted to brand ink. 459x171.
export const SIGNATURE = `${BASE}/amp-brand/signature.png`;
export const SIGNATURE_WHITE = `${BASE}/co_white,e_colorize:100/amp-brand/signature.png`;

// Her real handwriting — phrases from the same pen, extracted like the signature.
export const HAND_TAGLINE = `${BASE}/amp-brand/hand-tagline.png`; // "Capturing moments, one click at a time"
export const HAND_PERFECT = `${BASE}/amp-brand/hand-perfect.png`; // "Perfect !"
export const HAND_THANKYOU = `${BASE}/amp-brand/hand-thankyou.png`; // "Thank you!"
export const HAND_WELCOME = `${BASE}/amp-brand/hand-welcome.png`; // "Welcome"
export const HAND_ILOVEYOU = `${BASE}/amp-brand/hand-iloveyou.png`; // "I love you" (kept for her, unused on site)
