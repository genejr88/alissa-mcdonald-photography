# Alissa McDonald Photography — Project Context

**BLUEPRINT.md is the source of truth.** Read it fully before building anything. It defines the brand foundation, the standout design directives (implement them exactly — they are specs, not inspiration), data models, API routes, and the 5-phase build order. Build one phase at a time and verify before moving on.

## Quick orientation
- Monorepo: `backend/` (Express + Prisma + PostgreSQL) and `frontend/` (React + Vite + Tailwind + TanStack Query + Framer Motion), same conventions as the towne-rental project.
- All frontend API calls live in `frontend/src/lib/api.js` — always check there before adding new calls.
- Brand CSS variables + Tailwind tokens are in `frontend/src/index.css` and `frontend/tailwind.config.js` (paper/ink/accent palette; Fraunces/Hanken Grotesk/IBM Plex Mono). Never introduce other colors or fonts.
- `.meta` class = mono contact-sheet label; `.link-draw` = draw-in underline. Reuse them.
- Admin pages stay plain and dense; all design polish goes to the public site.
- Photos: Cloudinary only, browser-direct signed uploads — never proxy image bytes through Express, never store locally.
- Railway deploy: migrations + seed run in backend `start` script; `prisma migrate deploy`, never `db push`. Migration files live in `backend/prisma/migrations/`.
- `docs/pixieset-*.html` are saved copies of her old site — source for her real testimonial text and package copy.

## Status
Phase 1 (skeleton) complete. Next: Phase 2 — Galleries + CMS (see BLUEPRINT.md build order).
