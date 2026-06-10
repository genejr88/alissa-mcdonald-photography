// Brand assets — the logo lives in Cloudinary (uploaded from her original SVG).
// `e_trim` crops the transparent padding; `e_colorize` makes the white knockout.
const BASE = 'https://res.cloudinary.com/dxngcapcj/image/upload';

export const LOGO_DARK = `${BASE}/e_trim/c_scale,w_800/amp-brand/logo.png`;
export const LOGO_WHITE = `${BASE}/e_trim/c_scale,w_800/co_white,e_colorize:100/amp-brand/logo.png`;
