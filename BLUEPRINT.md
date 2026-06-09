# Photography Website — Build Blueprint

A clean, minimalist photography portfolio + business site for a solo photographer.
Public-facing portfolio with galleries, client booking, and digital contract signing.
Private admin area (CMS) where the photographer manages galleries, photos, bookings, and contracts herself.

## Brand Foundation — Alissa McDonald Photography (researched from her live site)

This site replaces https://alissamcdonaldphotography.mypixieset.com/. Everything below is grounded in her actual brand — keep the soul, elevate the execution to bespoke-studio level.

**Who she is:** natural-light lifestyle photographer. Families, children, couples, maternity, seniors, prom, milestones. Has a physical studio. Tagline territory: *"Moments That Feel Like You."* Voice: warm, personal, first-person, emotional — never corporate. Instagram: `@alissamcdonald.photography_`, Facebook: `uncagedcreations.byAlissa`.

**Palette (evolved from her current site — warm and organic, NOT stark gallery-white):**
```
--paper:    #F8F6F0   warm cream page background
--paper-2:  #EFECE2   secondary surface / section alternation
--ink:      #2E2C27   warm near-black text
--ink-soft: #6B655A   secondary text
--accent:   #8A7C2E   her olive-gold — hairlines, links, small accents ONLY (never large fills)
--dark:     #232019   "dark mood" gallery background (warm charcoal, not pure black)
```
All as CSS variables. The site should feel like a linen-bound photo album: warm paper, ink, light.

**Typography (the single biggest upgrade over Pixieset):** replace template-default Lora/Montserrat with:
- Display & headings: **Fraunces** (Google Fonts, variable) — use its optical sizing and a touch of its "wonk"/soft axis at display sizes; warm, characterful, expensive-feeling. Italic Fraunces for the one-italic-moment-per-page rule.
- Body & UI: **Hanken Grotesk** — quiet, humanist, disappears behind the serif.
- Meta/captions: **IBM Plex Mono** (the contact-sheet detail below).

**Her superpower is testimonials — design for them.** She has 9+ long, deeply emotional reviews. Do not dump them in slabs like the current site:
- Homepage gets ONE testimonial, full-bleed treatment: a giant Fraunces italic pull-quote (one killer sentence, e.g. *"a gallery of stunning, heartfelt photos that truly took my breath away"*) over `--paper-2`, attribution in mono caps, with a quiet "read more kind words →" link.
- A dedicated **/kind-words** page: editorial alternation of pull-quote spreads and photos, slow scroll, one voice at a time. Testimonials live in the CMS (text, attribution, optional photo, featured flag).
- Sprinkle one short quote into the booking flow sidebar ("You're in good hands") — social proof exactly at the moment of commitment.

**Services become "The Experience":** her two packages (30-min from $175, 1-hr from $200) are real, keep them — but present each as a numbered experience (`№ 01 — THE MINI`, `№ 02 — THE FULL SESSION`) with what-it-feels-like copy, what's included as a quiet mono list, and "from $—" pricing in Fraunces. Mention the studio AND on-location options. These map 1:1 to the bookable Services in the DB.

**Design philosophy:** the photos are the product; the site is the album they live in.
- Whitespace-heavy, near-zero chrome. No cards-with-borders, no shadows, no gradients.
- Warm paper palette above — the photos (golden-hour family work) will harmonize with cream far better than clinical white.
- Motion: subtle, organic, ≤1000ms. Nothing bouncy, nothing parallax-heavy.
- **Mobile-first.** Her traffic is Instagram moms on phones. Every page flawless at 390px before desktop ships.
- No stock UI-kit look. No default Tailwind blue, no rounded-xl-shadow-lg cards. If a component looks like a SaaS dashboard, redo it.
- Copy stays in her first-person voice everywhere ("I can't wait to meet you"), including system emails and the booking confirmation screen.

## Stack (mirrors towne-apps conventions — do not deviate)

- **Backend:** Node.js + Express, Prisma ORM, PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS + TanStack Query + Framer Motion
- **Images:** Cloudinary (all uploads — never local filesystem; hosting storage is ephemeral)
- **Auth:** JWT in localStorage, single admin account for the photographer (same pattern as towne-rental `requireAuth` middleware)
- **Deploy:** Railway. **CRITICAL:** Railpack ignores Procfile release phase — migrations go in the start script:
  `"start": "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"`
  Use `prisma migrate deploy`, NOT `db push`. `postinstall` runs `prisma generate`.
- **Monorepo layout:** `backend/` + `frontend/` packages, root `package.json` — identical structure to towne-rental.
- **Frontend env:** `VITE_API_URL`; all API calls live in one file `frontend/src/lib/api.js`.

## Standout Design Directives (implement these exactly — this is what separates the site from templates)

These are not optional garnish. Each is specified concretely so it can be coded, not interpreted.

### 1. Editorial layout, NOT a uniform grid
Uniform masonry = every Squarespace photo site ever. Instead, gallery pages use a **repeating editorial rhythm**, like spreads in a printed photo book. Define 4–5 CSS grid "spread" patterns and cycle through them:
- Spread A: one full-bleed image (100vw, breaks out of the content column)
- Spread B: two images offset vertically — left one starts 15vh lower than right, asymmetric widths (40% / 55%)
- Spread C: one small image (~35vw) alone, pushed to one side, surrounded by emptiness
- Spread D: large image + a thin caption column beside it
- Spread E: three-up strip, equal heights, different widths
Implement as a single `EditorialGrid` component that chunks the photo array and assigns spreads cyclically. Vertical gaps between spreads are huge: `clamp(6rem, 15vh, 12rem)`. Portrait vs landscape orientation (from stored width/height) decides which slot a photo takes within a spread.

### 2. Typography as a graphic element
- Display sizes are genuinely huge: gallery titles at `clamp(3rem, 12vw, 11rem)`, tight tracking (`letter-spacing: -0.03em`), and they **overlap the first image** (title layered partially over the hero with `mix-blend-mode: difference; color: white` so it inverts over the photo and stays legible on any image).
- The nav wordmark and lightbox UI also use `mix-blend-mode: difference` — UI floats over photos without ever needing a background bar.
- Big headings animate in as a **line-by-line mask reveal**: each line wrapped in `overflow:hidden`, inner span translates up from 110% with a small stagger (Framer Motion). No fades on type — masks only.
- One italic serif moment per page maximum (e.g. the word *"photographer"* in the hero strapline). Italics lose power if repeated.

### 3. Cinematic image reveals (clip-path, not opacity)
Images never fade in. They **wipe**: `clip-path: inset(0 0 100% 0)` → `inset(0)`, 900ms, `cubic-bezier(0.77, 0, 0.175, 1)`, triggered at 20% viewport intersection, with a simultaneous subtle scale from 1.08 → 1 inside an `overflow:hidden` frame. This single change makes the whole site feel shot-on-film instead of loaded-from-CDN. Build it once as `<RevealImage>` and use it everywhere. Wrap all motion in a `prefers-reduced-motion` check that swaps to instant display.

### 4. The signature detail: photographic metadata as UI
Lean into the craft of photography as the design language:
- Photo captions render in a **monospace font** (JetBrains Mono or IBM Plex Mono, 11px, uppercase, wide tracking) styled like contact-sheet markings: `№ 04 — GOLDEN HOUR, 85MM` . The CMS caption field supports this; frame numbers are automatic from sort order.
- The lightbox counter is `04 / 23` in the same mono, bottom-left, blend-mode difference.
- Gallery index entries show `(12)` photo counts in mono superscript next to the serif title.
- A barely-there **film grain overlay** on hero/full-bleed sections only: an inline SVG `feTurbulence` noise at 2.5% opacity, `pointer-events:none`. At this opacity it reads as texture, not effect.

### 5. Custom cursor (desktop only)
Native cursor everywhere by default; over gallery images a 72px circle labeled "VIEW" in mono caps trails the pointer (Framer Motion spring, `damping: 25`); over the lightbox it becomes "←" / "→" halves. Hidden entirely on touch devices and under `prefers-reduced-motion`. This is ~60 lines and is the detail visitors remember.

### 6. Shared-element lightbox via View Transitions API
Clicking a thumbnail does NOT pop a modal over the grid. The thumbnail itself **expands into the lightbox** using the View Transitions API (`document.startViewTransition` + matching `view-transition-name` on thumb and lightbox image). Feature-detect; fall back to a fast crossfade in non-supporting browsers. This is the single most "how did they do that" moment on the site and it's ~30 lines.

### 7. Color comes from the photographs
- On upload, request Cloudinary's dominant color (`colors: true` on the upload response) and store it per photo. Blur-up placeholders are a solid swatch of that color — the page palette literally becomes the photographer's palette while loading.
- Each gallery has a CMS-selectable **mood**: `light` (default `--paper` cream) or `dark` (`--dark` warm charcoal — never pure black, it fights warm-toned photos). A moody golden-hour gallery gets the charcoal page; a bright family session stays on cream. The page background crossfades (600ms) when entering a gallery. One field, huge editorial payoff.

### 8. Micro-interactions (exactly these, nothing more)
- Links: underline draws in left→right on hover (`background-size` transition on a `linear-gradient` underline), draws out the same direction on leave.
- Primary buttons ("Book a Session"): text-only with an arrow `→` that nudges 4px right on hover; on click the arrow leads a 200ms slide. No filled-rectangle buttons anywhere on the public site.
- Booking calendar: day cells are bare numerals in mono; the hovered day shows a thin 1px circle drawn around it (SVG `stroke-dashoffset` animation, 250ms); the selected day is a filled circle. Unavailable days at 25% opacity, no strikethrough.
- Page transitions: 300ms fade-through-background-color between routes. Never slide pages.

### 9. The homepage hero
Full-viewport featured image. On scroll, the hero image scales from `1` to `1.15` and its container clip-paths from full-bleed to the content column width — a slow "settling into the page" effect. Use **CSS scroll-driven animations** (`animation-timeline: scroll()`) with a no-op fallback (hero simply static) where unsupported. Her name sits over it in the difference-blend display type. No hero carousel, no autoplay video, no scroll-down bouncing chevron — a single line of mono text `( SCROLL )` at the bottom edge is enough.

### 10. Restraint budget (enforce mechanically)
Everything above works only against a silent baseline. Hard rules:
- Max 2 typefaces + 1 mono. Max 1 accent color. Zero box-shadows. Zero border-radius above 2px. Zero gradients except image scrims.
- Every animation ≤ 1000ms; every hover response ≤ 250ms; everything respects `prefers-reduced-motion`.
- If a page contains more than one "moment" (hero settle, mask reveal, etc.) competing in the same viewport, cut one.
- Admin/CMS pages are exempt from the fancy details — keep admin plain, fast, and dense; spend the polish budget on the public site.

## Public Pages

| Page | Route | Notes |
|------|-------|-------|
| Home | `/` | Full-bleed hero image (or slow crossfade of 3–4 featured photos), her name/logo, minimal nav. One scroll section: short intro + 3 featured gallery links + CTA "Book a Session". |
| Galleries index | `/galleries` | Grid of gallery covers (title overlaid on hover/tap). Only published galleries. |
| Single gallery | `/galleries/:slug` | Masonry/justified grid of photos. Click → fullscreen lightbox with keyboard/swipe nav. Lazy-load with low-res Cloudinary placeholders (blur-up). Right-click disabled on images (deterrent, not DRM) + Cloudinary watermark option per-gallery. |
| About | `/about` | Portrait, bio, her philosophy ("Moments That Feel Like You" expanded), studio + on-location note. Content editable from admin (stored as settings, not hardcoded). |
| The Experience | `/experience` | Session types as numbered experiences (pulled from DB — these are also the bookable options). Each: name, what-it-feels-like copy, duration, includes-list, starting price. |
| Kind Words | `/kind-words` | Editorial testimonial page: alternating giant pull-quote spreads and photos. Testimonials from CMS. |
| Booking | `/book` | The appointment flow (detail below). |
| Contact | `/contact` | Simple form → stores inquiry in DB + emails her. Socials/email/location footer. |
| Contract signing | `/sign/:token` | Public, no auth — token link (same pattern as towne-rental intake tokens / towne-landing contracts). |
| Booking confirm/manage | `/booking/:token` | Public token link where a client can view their booking details and cancel/reschedule-request. |

## Admin (CMS) Pages — all behind login at `/admin`

| Page | Route | Notes |
|------|-------|-------|
| Login | `/admin/login` | JWT, single admin user seeded. |
| Dashboard | `/admin` | Upcoming bookings, pending contract signatures, recent inquiries. |
| Galleries | `/admin/galleries` | Create/edit/delete galleries: title, slug (auto from title), description, cover photo, published toggle, sort order (drag to reorder). |
| Gallery photos | `/admin/galleries/:id` | **The core CMS feature.** Multi-file drag-and-drop upload straight to Cloudinary (use unsigned upload preset or signed upload via backend). Thumbnail grid with drag-to-reorder, set-as-cover, delete, optional per-photo caption/alt text. Show upload progress per file. Must handle 50+ photos in one batch without choking — queue uploads 3–4 at a time. |
| Services | `/admin/services` | CRUD session types: name, description, duration (min), price, deposit amount (optional), active toggle, buffer time before/after. |
| Availability | `/admin/availability` | Weekly recurring schedule (e.g. Tue–Sat 9–5) + blackout dates (vacations) + one-off extra openings. Simple is fine: weekly template + exceptions list. |
| Bookings | `/admin/bookings` | List/calendar of bookings, status (PENDING / CONFIRMED / COMPLETED / CANCELLED), client details, confirm/decline buttons, link to send contract. |
| Contracts | `/admin/contracts` | Contract template editor (see below), list of sent/signed contracts, view signed PDF, resend link. |
| Testimonials | `/admin/testimonials` | CRUD: full quote, pull-quote sentence, attribution, optional photo, featured toggle, reorder. |
| Inquiries | `/admin/inquiries` | Contact form submissions, mark handled. |
| Settings | `/admin/settings` | Key/value AppSetting store: site title, about text, social links, accent color, email-from address, watermark toggle. |

## Booking System (special coding #1)

Flow on `/book`:
1. **Pick a session type** (from Services). Shows duration + price + deposit if any.
2. **Pick a date** — calendar shows only days with availability (computed from weekly template − blackouts − existing bookings − buffer times).
3. **Pick a time slot** — generated from availability at the service's duration granularity.
4. **Client details** — name, email, phone, notes ("what's the shoot for?").
5. **Confirm** — booking created as `PENDING`. Client gets a confirmation email with their `/booking/:token` link. Photographer gets a notification email.
6. Photographer confirms from admin → status `CONFIRMED` → client gets confirmation email, optionally with the contract signing link attached.

Rules:
- Slot collision check MUST be server-side at creation time (two clients picking the same slot simultaneously → second one gets a clear "slot just taken" error and the calendar refreshes).
- Timezone: store UTC in DB, render in the studio's timezone (a setting, default America/New_York). Don't overthink multi-timezone — clients are local.
- v1 has **no payment processing**. Deposit is displayed as "due to confirm your session" and she handles it via Venmo/Zelle manually. Leave a clean seam (a `depositPaid` boolean + notes field) so Stripe can be added later.
- Email: use Resend (simplest) or Nodemailer + SMTP. All emails plain and elegant, matching the site's typography.

## Contract Signing (special coding #2 — same pattern as towne-landing / towne-rental signatures)

- Photographer maintains **contract templates** in admin: a rich-text body (store as HTML or markdown; a simple textarea + markdown preview is acceptable for v1) with merge fields: `{{client_name}}`, `{{session_type}}`, `{{session_date}}`, `{{price}}`, `{{deposit}}`.
- From a booking, she clicks "Send contract" → picks a template → system renders merge fields, creates a `Contract` row with a random token, emails the client a `/sign/:token` link.
- Signing page: shows the rendered contract, client types their full legal name AND draws a signature on a **canvas signature pad** (same canvas→base64 approach as towne-rental), checks an "I agree" box, submits.
- On submit: store signature image (base64 or upload to Cloudinary), signer name, timestamp, and IP address. Mark token used. Generate a **PDF of the signed contract** (pdf-lib or puppeteer — pdf-lib preferred, no headless browser on Railway) and store the PDF in Cloudinary (resource_type raw). Email a copy to both parties.
- Tokens expire (14 days) and are single-use, same as towne-rental intake tokens.

## Database Models (Prisma)

```
User              — admin account (username, email, passwordHash, role)
Gallery           — title, slug (unique), description, coverPhotoId, published, sortOrder
Photo             — galleryId, cloudinaryPublicId, url, width, height, caption, alt, sortOrder
Service           — name, description, durationMin, price, depositAmount?, bufferMin, active, sortOrder
AvailabilityRule  — weekday (0–6), startTime, endTime  (weekly template)
AvailabilityException — date, type: BLACKOUT | EXTRA, startTime?, endTime?
Booking           — serviceId, clientName, clientEmail, clientPhone, notes,
                    startsAt (UTC), endsAt (UTC), status: PENDING|CONFIRMED|COMPLETED|CANCELLED,
                    token (unique), depositPaid, adminNotes
ContractTemplate  — name, body (with merge fields), active
Contract          — bookingId?, templateId, renderedBody, token (unique), expiresAt,
                    signedAt?, signerName?, signatureData?, signerIp?, pdfUrl?
Testimonial       — quote (full), pullQuote (the one killer sentence), attribution,
                    photoId?, featured, sortOrder
Inquiry           — name, email, message, handled, createdAt
AppSetting        — key/value store (about text, socials, timezone, accent color, etc.)
```

## Key API Routes

```
Public:
GET  /api/galleries                      published galleries
GET  /api/galleries/:slug                gallery + photos
GET  /api/services                       active services
GET  /api/availability?serviceId&month   available slots for the booking calendar
POST /api/bookings                       create booking (server-side collision check)
GET  /api/bookings/token/:token          client view of own booking
POST /api/bookings/token/:token/cancel   client cancel
POST /api/inquiries                      contact form
GET  /api/contracts/sign/:token          fetch contract for signing
POST /api/contracts/sign/:token          submit signature

Admin (requireAuth):
Full CRUD on galleries, photos, services, availability, bookings, templates, contracts, inquiries, settings
POST /api/admin/photos/sign-upload       returns signed Cloudinary upload params (so the
                                         browser uploads directly to Cloudinary, not through Express)
POST /api/admin/bookings/:id/confirm     confirm + optional send-contract
POST /api/admin/contracts                create + send contract from template
```

## Cloudinary Specifics

- Browser uploads go **directly to Cloudinary** with backend-signed params — never proxy multi-MB photo files through Express.
- Store `publicId` + intrinsic `width`/`height` (needed for masonry layout without layout shift).
- Serve via transformation URLs: thumbnails `w_600,q_auto,f_auto`, lightbox `w_2000,q_auto,f_auto`, blur placeholder `w_30,e_blur:1000,q_1`. Never serve originals on the public site.
- Optional watermark: a per-gallery toggle adds an `l_<watermark_public_id>,o_30,g_south_east` overlay transformation.
- Deleting a Photo row must also delete the Cloudinary asset (backend call).

## Seed Data

- Admin user (credentials via env vars, not hardcoded).
- Her two real services: "The Mini Session" 30min/$175 and "The Full Session" 60min/$200 (she can edit copy/pricing in admin).
- Her real testimonials seeded as Testimonial rows (pull the text from her current Pixieset site; pick the strongest single sentence of each as the pullQuote).
- Default availability Tue–Sat 9:00–17:00 (she adjusts in admin).
- One sample contract template (standard photography services agreement: scope, payment, cancellation/rescheduling, image rights/usage, model release clause).
- One unpublished sample gallery so the CMS flow is testable immediately.

## Build Order (do it in these phases, verify each before the next)

1. **Skeleton:** monorepo, Express + Prisma + Postgres, JWT auth, React shell with public/admin layouts, Railway-ready scripts.
2. **Galleries + CMS:** models, Cloudinary signed upload, admin gallery/photo management with drag-and-drop + reorder, public gallery pages with lightbox. *(This is the heart of the site — get it beautiful before moving on.)*
3. **Services + Booking:** availability engine, public booking flow, admin booking management, emails.
4. **Contracts:** templates, token signing page with signature pad, PDF generation, emails.
5. **Polish:** home/about/services/contact pages, settings-driven content, SEO (meta/OG tags per gallery, sitemap), 404 page, loading states, mobile pass on every page.

## Non-negotiables / gotchas

- Every photo `<img>` needs explicit aspect ratio (from stored width/height) — zero layout shift.
- Lightbox: arrow keys + swipe + Esc, preload adjacent images.
- All admin mutations use TanStack Query `invalidateQueries` — no stale lists.
- Public pages must work logged-out (no auth headers on public API calls).
- Booking slot math: write unit tests for the availability generator (template + exceptions + bookings + buffers) — this is where the bugs will live.
- Don't build payment processing, client photo-delivery/proofing galleries, or blog in v1. Note them as future ideas and stop.
