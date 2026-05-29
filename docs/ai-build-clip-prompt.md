# Photoreal "self-building barn" — AI video clip brief

Goal: a short, **loop-friendly, scroll-scrubbable** clip of a GNP pole barn
erecting itself, to use as the Process-section background (the LOFT-reel effect,
but a pole barn instead of a luxury house). You scrub it with scroll; it is NOT
played with sound.

## Hard requirements (so it scrubs cleanly)

- **Locked-off camera.** No camera move, no pan, no zoom, no parallax. The
  camera must be perfectly static on a tripod so only the *structure* changes.
  (Camera motion fights scroll-scrubbing and makes people seasick.)
- **One continuous build, front 3/4 view**, structure centered-right so website
  text can sit on the left third.
- **Even, monotonic progress** — empty pad → posts → trusses → purlins → roof
  metal → done. No cuts, no time jumping backward.
- **Daylight, clear sky, Florida pasture/cleared-lot setting.** Bright, clean,
  optimistic. Golden-hour is fine but keep exposure steady.
- **9:16 vertical AND 16:9 versions** if the tool allows (vertical for mobile,
  wide for desktop). If only one, do **16:9, 1920×1080+**.
- **Length 6–10s, 24–30fps.** Short is good; we stretch it across scroll.
- **No on-screen text, no logos, no watermark, no people walking through frame.**
  (We add text/branding in CSS.)

## Prompt (paste into Sora / Runway Gen-3 / Kling / Veo)

> Static locked-off tripod shot, no camera movement. A steel-truss pole barn
> assembles itself in fast, smooth time-lapse on a cleared Florida lot under a
> bright blue sky. Sequence: empty graded pad, then tall treated wood posts rise
> in a grid, then galvanized steel roof trusses lift and lock across the span,
> then horizontal purlins fill in, then standing-seam metal roof panels slide on
> and the roof completes. Front three-quarter angle, the barn positioned slightly
> right of center with open sky on the left. Realistic construction, clean modern
> agricultural building, warm daylight, crisp shadows, photoreal, no people, no
> text, no logos. Camera absolutely still the entire time.

Negative / avoid: `camera pan, camera zoom, dolly, handheld shake, people,
text overlay, watermark, logo, lens flare sweep, scene cut, nighttime`.

## After you get the clip — how I wire it in

1. Drop the file at `gnp-cinematic/assets/video/barn-build.mp4` (and/or the
   vertical cut as `barn-build-portrait.mp4`).
2. I slice it into ~120–180 numbered frames (ffmpeg) into
   `assets/img/seq/frame_###.webp`.
3. The image-sequence player (Version 2) draws the frame matching scroll
   position onto a `<canvas>` — same Apple-style scrub as the vector build.
   Using frames (not a `<video>`) gives precise, jank-free scrubbing on mobile.

## Brand note (needs your OK)

The project rule in `CLAUDE.md` flags AI **"rendering"** assets as internal-only
and keeps them off customer-facing media. An AI build clip is exactly that kind
of asset — so using it on the public site is a deliberate exception you'd be
approving. Alternatives that sidestep the rule: a **real drone time-lapse** of a
GNP build, or the **owned 3D render** (Version 3) exported to frames.
