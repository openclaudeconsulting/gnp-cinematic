/* GNP gallery subpage — smooth scroll, reveal-on-scroll, and a lightbox.
   Self-contained; degrades gracefully without Lenis or with reduced motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("header");
  var progress = document.getElementById("progress");

  function onScroll(y) {
    if (header) header.classList.add("scrolled"); // solid header on subpages
    if (progress) {
      var h = document.documentElement, max = (h.scrollHeight - h.clientHeight) || 1;
      progress.style.transform = "scaleX(" + Math.min(y / max, 1) + ")";
    }
  }

  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on("scroll", function (e) { onScroll(e.scroll || window.scrollY); });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } else {
    window.addEventListener("scroll", function () { onScroll(window.scrollY); }, { passive: true });
  }
  onScroll(0);

  /* in-page anchors (category chips / footer) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -72 });
      else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* lightbox */
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".gal-item img"));
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var idx = -1;
  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    var im = imgs[idx];
    lbImg.src = im.getAttribute("data-full") || im.src;
    lbImg.alt = im.alt;
    lbCap.textContent = im.getAttribute("data-cap") || "";
  }
  function open(i) {
    show(i);
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function close() {
    lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; idx = -1;
    if (lenis) lenis.start();
  }
  imgs.forEach(function (im, i) {
    im.style.cursor = "zoom-in";
    im.addEventListener("click", function () { open(i); });
  });
  if (lb) {
    document.getElementById("lbClose").addEventListener("click", close);
    document.getElementById("lbPrev").addEventListener("click", function () { show(idx - 1); });
    document.getElementById("lbNext").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    window.addEventListener("keydown", function (e) {
      if (idx < 0) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });
  }
})();
