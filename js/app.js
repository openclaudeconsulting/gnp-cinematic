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
  if (!hasST || reduceMotion) { return; }
  gsap.registerPlugin(ScrollTrigger);

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

  /* Process step backgrounds — parallax drift */
  gsap.utils.toArray(".step").forEach(function (step) {
    var bg = step.querySelector(".step__bg");
    if (!bg) return;
    gsap.fromTo(bg, { yPercent: -10 }, {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: step, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

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
