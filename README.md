# Alissa McDonald Photography

Portfolio + booking + contract-signing site. Replaces her Pixieset site.
**Read [BLUEPRINT.md](BLUEPRINT.md) before building anything — it defines the architecture, design system, and build phases.**

## Status

- ✅ **Phase 1 — Skeleton** (done): monorepo, Express + Prisma + full DB schema, JWT auth, settings store, seed data (her real services/testimonials/copy), React shell with brand foundation (palette, Fraunces/Hanken Grotesk/Plex Mono, public + admin layouts), Railway-ready.
- ⬜ Phase 2 — Galleries + CMS (Cloudinary signed uploads, editorial grid, lightbox)
- ⬜ Phase 3 — Services + Booking (availability engine, emails)
- ⬜ Phase 4 — Contracts (templates, signature pad, PDF)
- ⬜ Phase 5 — Polish (remaining public pages, SEO, mobile pass)

## Local dev

```bash
# backend (needs DATABASE_URL in backend/.env — see backend/.env.example)
cd backend && npx prisma migrate deploy && npm run seed && npm run dev   # :3001

# frontend (proxies /api to :3001)
cd frontend && npm run dev   # :5173
```

## Deploy (Railway, single service)

- Build command: `npm run build` (root) · Start command: `npm start` (root)
- Migrations + seed run inside backend `start` script (Railpack ignores Procfile release phase)
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLOUDINARY_*`
- Backend serves `frontend/dist` in production — one service, one domain.
