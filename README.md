# GNP Steel Trusses — Cinematic Site (testing-phase design)

A scroll-driven, cinematic single-page marketing site for **GNP Steel Trusses**,
inspired by high-end Framer "design-build" sites — rebuilt as plain, ownable code.

> This is a **separate, testing-phase** design. The live site
> (`../southern-barn-builders`, deployed on Cloudflare Pages at
> gnp-steel-trusses.com) is untouched. If this design wins, it can be promoted
> to the main site later.

## Stack

- **Static HTML/CSS/JS** — no build step, no framework.
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth scrolling (CDN).
- [GSAP + ScrollTrigger](https://gsap.com/) — cinematic scroll animations (CDN).
- Google Fonts: Montserrat (display) + Inter (body).
- Brand tokens mirror the `--pc-*` system from the live site (navy/blue + amber).

## Run locally

```bash
npx serve -l 5173 .
# or
npm install && npm run dev
```

Then open http://localhost:5173.

## Structure

```
gnp-cinematic/
├── index.html        Single cinematic page
├── css/styles.css    Design system + cinematic styles
├── js/app.js         Lenis + GSAP scroll interactions (graceful fallbacks)
└── assets/img/       Real GNP project photos
```

## Sections

Hero → Statement (word-by-word reveal) → Process scrollytelling (Consult ·
Engineer · Fabricate · Install) → What We Build → Pinned horizontal project
gallery → Why GNP + animated stats → CTA → Footer.

## Brand & lead routing rules (honored)

- Contact info is always the owner's: **(352) 440-0905** /
  **GNPSteelTrusses@gmail.com**. No subcontractor numbers.
- Services = pole-barn structures only (pole barns, barndominiums, stables,
  workshops, garages, custom). No roofing/fencing/porches/decks.
- No `schematic`/`rendering` images on customer-facing media.
- "Get a Free Quote" currently points at the live contact form
  (`gnp-steel-trusses.com/contact`) so the existing lead pipeline stays intact.

## Deploy (when ready)

Static — deploys to Cloudflare Pages / Netlify / GitHub Pages as-is. Point the
project at this repo; no build command, output dir = root.
