/* ============================================================
   GNP Steel Trusses — cinematic interactions
   Lenis smooth scroll + GSAP ScrollTrigger.
   Degrades gracefully: if libraries or motion are unavailable,
   content is fully visible and the page scrolls normally.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST   = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";

  /* ---- Header scrolled state + scroll progress (always on) ---- */
  var header = document.getElementById("header");
  var progress = document.getElementById("progress");
  function onScrollBasics(y) {
    if (header) header.classList.toggle("scrolled", y > 40);
    if (progress) {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      progress.style.transform = "scaleX(" + Math.min(y / max, 1) + ")";
    }
  }

  /* ---- Smooth scroll (Lenis) ---- */
  var lenis = null;
  if (hasLenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on("scroll", function (e) {
      onScrollBasics(e.scroll || window.scrollY);
      if (hasST) ScrollTrigger.update();
    });
    if (hasGSAP) {
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else {
    window.addEventListener("scroll", function () { onScrollBasics(window.scrollY); }, { passive: true });
    onScrollBasics(window.scrollY);
  }

  /* ---- Anchor links route through Lenis ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---- Reveal-on-scroll (IntersectionObserver — robust, no GSAP needed) ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- The rest needs GSAP + ScrollTrigger ---- */
  if (!hasST || reduceMotion) {
    var pStatic = document.getElementById("process");
    if (pStatic) pStatic.classList.add("process--static");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* Process section runs the cinematic build; drop the static fallback class */
  var processEl = document.getElementById("process");
  if (processEl) processEl.classList.remove("process--static");

  /* Hero media parallax */
  var heroMedia = document.getElementById("heroMedia");
  if (heroMedia) {
    gsap.to(heroMedia, {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* Statement — light up word by word as it scrolls through */
  var words = gsap.utils.toArray("#statementText .word");
  if (words.length) {
    ScrollTrigger.create({
      trigger: "#statement",
      start: "top 80%",
      end: "bottom 60%",
      scrub: true,
      onUpdate: function (self) {
        var lit = Math.round(self.progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
      }
    });
  }

  /* Process — self-erecting pole barn driven by scroll */
  (function () {
    var section = document.getElementById("process");
    if (!section) return;
    var panel = section.querySelector(".process__sticky");
    var steps = gsap.utils.toArray("#process .pstep");
    var dots  = gsap.utils.toArray("#process .process__dots li");
    var bar   = section.querySelector(".process__progress > i");

    function setActive(i) {
      steps.forEach(function (s, idx) { s.classList.toggle("active", idx === i); });
      dots.forEach(function (d, idx) { d.classList.toggle("on", idx <= i); });
    }
    setActive(0);

    // Cache each post's real geometry so we can grow it from the ground via attributes
    var posts = gsap.utils.toArray("#posts rect").map(function (r) {
      return { el: r, y: parseFloat(r.getAttribute("y")), h: parseFloat(r.getAttribute("height")) };
    });

    // Override the CSS flash-guard, which sets these GROUPS to opacity:0. A group at
    // opacity:0 hides its children regardless of the child's own opacity — so we make the
    // groups visible here and control visibility per-child below. (#blueprint and #finish
    // ARE meant to be group-faded, so they start at 0.)
    gsap.set("#dims, #posts, #truss, #trussFar, #frame, #roof", { opacity: 1 });
    gsap.set("#blueprint, #finish", { opacity: 0 });
    // Per-child hidden states:
    gsap.set("#ground .pad, #ground .gline", { opacity: 0 });
    gsap.set("#dims .draw, #blueprint path, #truss .draw, #trussFar .draw, #frame .draw", { strokeDashoffset: 1 });
    gsap.set("#dims text", { opacity: 0 });
    posts.forEach(function (p) { gsap.set(p.el, { attr: { y: p.y + p.h, height: 0 } }); });
    gsap.set("#roof polygon", { opacity: 0 });

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: panel,
        start: "top top",
        end: "+=2600",        // 2600px of scroll drives the full build
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          // Timeline total == 1.0, so position params line up with these quarters.
          setActive(Math.min(3, Math.floor(self.progress * 4)));
          if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
        }
      }
    });

    // Positions below are progress-aligned (timeline total duration == 1.0).
    tl.to("#ground .pad",    { opacity: 1, duration: 0.04 }, 0.03)   // 01 — Consult & Design (0.00–0.25)
      .to("#ground .gline",  { opacity: 1, duration: 0.03 }, 0.06)
      .to("#dims .draw",     { strokeDashoffset: 0, duration: 0.10 }, 0.08)
      .to("#dims text",      { opacity: 1, duration: 0.05 }, 0.16)
      .to("#blueprint",      { opacity: 1, duration: 0.03 }, 0.27)   // 02 — Engineer (0.25–0.50)
      .to("#blueprint path", { strokeDashoffset: 0, duration: 0.17 }, 0.27)
      .to("#dims",           { opacity: 0, duration: 0.05 }, 0.46)
      .to(posts.map(function (p) { return p.el; }), {               // 03 — Fabricate & Raise (0.50–0.75)
            attr: { y: function (i) { return posts[i].y; }, height: function (i) { return posts[i].h; } },
            duration: 0.10, stagger: 0.02
          }, 0.52)
      .to("#truss .draw",    { strokeDashoffset: 0, duration: 0.10, stagger: 0.015 }, 0.60)
      .to("#trussFar .draw", { strokeDashoffset: 0, duration: 0.08 }, 0.62)
      .to("#frame .draw",    { strokeDashoffset: 0, duration: 0.08 }, 0.68)
      .to("#blueprint",      { opacity: 0, duration: 0.06 }, 0.74)
      .to("#roof polygon",   { opacity: 1, duration: 0.10, stagger: 0.04 }, 0.78) // 04 — Deliver & Install (0.75–1.00)
      .to("#grid",           { opacity: 0, duration: 0.08 }, 0.82)
      .to("#finish",         { opacity: 1, duration: 0.06 }, 0.90)
      .to({}, { duration: 0.04 }, 0.96);   // dwell to 1.0 — hold the finished barn before release
  })();

  /* Horizontal gallery — pin and scroll the track sideways */
  var track = document.getElementById("galleryTrack");
  var pin = document.getElementById("galleryPin");
  if (track && pin) {
    var getScrollX = function () { return track.scrollWidth - window.innerWidth; };
    var tween = gsap.to(track, {
      x: function () { return -getScrollX(); },
      ease: "none",
      scrollTrigger: {
        trigger: "#gallery",
        start: "top top",
        end: function () { return "+=" + getScrollX(); },
        pin: pin,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
    // keep measurements correct after images load
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* Animated stat counters */
  gsap.utils.toArray(".stat .num").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var suffix = el.getAttribute("data-suffix") || "";
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: 1.4, ease: "power2.out",
          onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
          onComplete: function () { el.textContent = target + suffix; }
        });
      }
    });
  });

  /* Safety: recalc on resize */
  window.addEventListener("resize", function () { ScrollTrigger.refresh(); });
})();
