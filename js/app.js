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

  /* ---- Animated stat counters (.num[data-count]) — count up on reveal ---- */
  (function () {
    var nums = document.querySelectorAll(".num[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
      var dur = 1400, t0 = null;
      function tick(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if ("IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); io2.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      nums.forEach(function (el) { io2.observe(el); });
    } else {
      nums.forEach(run);
    }
  })();

  /* ============================================================
     Build the accurate 40×60 pole barn into <g id="barn">.
     6 posts per long wall = 5 bays; 6 steel trusses; black roof.
     Pure DOM — no GSAP — so it works in the static fallback too.
     Returns references the timeline animates.
     ============================================================ */
  function buildBarn() {
    var svgNS = "http://www.w3.org/2000/svg";
    var barn = document.getElementById("barn");
    if (!barn) return null;
    barn.innerHTML = "";

    // isometric-ish projection (feet -> screen)
    var OX = 470, OY = 466, SX = 6.0, SY = 6.2, DZX = 4.35, DZY = -2.55;
    var H = 12, R = 7, Hr = H + R, ridgeX = 20;
    var zs = [0, 12, 24, 36, 48, 60];          // 6 posts per side => 5 bays
    function P(x, y, z) { return [OX + x * SX + z * DZX, OY - y * SY + z * DZY]; }
    function s(p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }
    function add(parent, tag, attrs) {
      var e = document.createElementNS(svgNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      parent.appendChild(e); return e;
    }
    function ln(parent, a, b, cls) {
      return add(parent, "line", { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), "class": cls, pathLength: 1 });
    }
    function poly(parent, pts, cls, draw) {
      var o = { points: pts.map(s).join(" "), "class": cls };
      if (draw) o.pathLength = 1;
      return add(parent, "polygon", o);
    }

    var gPad = add(barn, "g", { id: "b-pad" });
    var gBlue = add(barn, "g", { id: "b-blueprint" });
    var gPosts = add(barn, "g", { id: "b-posts" });
    var gPurl = add(barn, "g", { id: "b-purlins" });
    var gFrame = add(barn, "g", { id: "b-frame" });
    var gTruss = add(barn, "g", { id: "b-trusses" });
    var gWeld = add(barn, "g", { id: "b-welds" });
    var gRoofM = add(barn, "g", { id: "b-roof-metal" });
    var gRoofB = add(barn, "g", { id: "b-roof-black" });
    var gFin = add(barn, "g", { id: "b-finish" });
    var gDim = add(barn, "g", { id: "b-dim" });

    // ground pad + footings
    var c0 = P(0,0,0), c1 = P(40,0,0), c2 = P(40,0,60), c3 = P(0,0,60);
    poly(gPad, [c0, c1, c2, c3], "pad");
    var footings = [];
    zs.forEach(function (z) { [0,40].forEach(function (x) {
      var b = P(x,0,z); footings.push(add(gPad, "ellipse", { cx: b[0].toFixed(1), cy: b[1].toFixed(1), rx: 6, ry: 3, "class": "footing" }));
    }); });

    // blueprint (dashed): footprint + near gable + ridge
    var bp = [];
    bp.push(poly(gBlue, [c0, c1, c2, c3], "bp", true));
    bp.push(add(gBlue, "polyline", { points: [P(0,H,0), P(ridgeX,Hr,0), P(40,H,0)].map(s).join(" "), "class": "bp", pathLength: 1 }));
    bp.push(ln(gBlue, P(ridgeX,Hr,0), P(ridgeX,Hr,60), "bp"));

    // posts (12) — far->near, back wall before front so near overlaps
    var postData = [];
    zs.slice().reverse().forEach(function (z) { [40,0].forEach(function (x) {
      var base = P(x,0,z), top = P(x,H,z), w = 5;
      var r = add(gPosts, "rect", { x: (base[0]-w/2).toFixed(1), y: top[1].toFixed(1), width: w, height: (base[1]-top[1]).toFixed(1), rx: 1, "class": "post" });
      postData.push({ el: r, y: parseFloat(top[1].toFixed(1)), h: parseFloat((base[1]-top[1]).toFixed(1)) });
    }); });

    // eave beams + ridge
    var beams = [
      ln(gFrame, P(0,H,0),  P(0,H,60),  "draw beam"),
      ln(gFrame, P(40,H,0), P(40,H,60), "draw beam"),
      ln(gFrame, P(ridgeX,Hr,0), P(ridgeX,Hr,60), "draw beam ridge")
    ];

    // purlins on the slopes (x=10 and x=30)
    function roofY(x) { return (x <= ridgeX) ? (H + (Hr-H)*(x/ridgeX)) : (H + (Hr-H)*((40-x)/ridgeX)); }
    var purlins = [10,30].map(function (x) { return ln(gPurl, P(x,roofY(x),0), P(x,roofY(x),60), "draw purlin"); });

    // 6 steel trusses (far->near) + weld points. Each truss is its own group
    // so the crane can fly it in as a rigid piece (translate), back-to-front.
    var trussLines = [], trussGroups = [];
    zs.slice().reverse().forEach(function (z) {
      var eL = P(0,H,z), eR = P(40,H,z), ap = P(ridgeX,Hr,z), mid = P(ridgeX,H,z), qL = P(10,H,z), qR = P(30,H,z);
      var t = add(gTruss, "g", { "class": "truss" });
      [[eL,eR],[eL,ap],[ap,eR],[mid,ap],[qL,ap],[qR,ap]].forEach(function (seg) { trussLines.push(ln(t, seg[0], seg[1], "chord")); });
      [eL, eR, ap].forEach(function (j) { add(gWeld, "circle", { cx: j[0].toFixed(1), cy: j[1].toFixed(1), r: 3.2, "class": "weld" }); });
      trussGroups.push({ el: t, apex: ap });   // apex = where the crane hook grabs it
    });

    // roof skins — metal then painted black (two slopes each)
    var slopeL = [P(0,H,0), P(ridgeX,Hr,0), P(ridgeX,Hr,60), P(0,H,60)];
    var slopeR = [P(ridgeX,Hr,0), P(40,H,0), P(40,H,60), P(ridgeX,Hr,60)];
    var metal = [ poly(gRoofM, slopeL, "panel metal"), poly(gRoofM, slopeR, "panel metal") ];
    var black = [ poly(gRoofB, slopeL, "panel black"), poly(gRoofB, slopeR, "panel black") ];
    var cap = ln(gFin, P(ridgeX,Hr,0), P(ridgeX,Hr,60), "draw cap");

    // dimension annotations (shown during consultation)
    (function () {
      var a = P(0,0,0), b = P(40,0,0);
      ln(gDim, [a[0], a[1]+24], [b[0], b[1]+24], "dimline");
      var t1 = add(gDim, "text", { x: ((a[0]+b[0])/2).toFixed(1), y: ((a[1]+b[1])/2+40).toFixed(1), "text-anchor": "middle", "class": "dimtext" }); t1.textContent = "40′ SPAN";
      var c = P(40,0,0), d = P(40,0,60);
      var t2 = add(gDim, "text", { x: ((c[0]+d[0])/2+30).toFixed(1), y: ((c[1]+d[1])/2+4).toFixed(1), "text-anchor": "middle", "class": "dimtext" }); t2.textContent = "60′ · 5 BAYS";
    })();

    // ---- Tower crane: erects in fabrication, sets every truss, then leaves ----
    var gCrane = add(barn, "g", { id: "b-crane" });   // appended last -> paints on top
    var JIBY = 88, MASTX = 150, MASTTOP = 40, MASTBASE = 540, JIBEND = 902;
    var parkX = trussGroups[0].apex[0];               // start parked over the first (back) truss
    function cl(a, b, cls) { return ln(gCrane, a, b, cls); }
    var craneMast = cl([MASTX, MASTBASE], [MASTX, MASTTOP], "crane-beam draw");
    var craneCJib = cl([MASTX, JIBY], [70, JIBY], "crane-beam draw");      // counter-jib
    var craneJib  = cl([MASTX, JIBY], [JIBEND, JIBY], "crane-beam draw");  // working jib
    var craneFore = cl([MASTX, MASTTOP], [560, JIBY], "crane-stay draw");  // fore pendant
    var craneBack = cl([MASTX, MASTTOP], [70, JIBY], "crane-stay draw");   // back pendant
    var craneCwt  = add(gCrane, "rect", { x: 48, y: 80, width: 26, height: 18, rx: 2, "class": "crane-trolley" }); // counterweight
    var craneTrolley = add(gCrane, "rect", { x: (parkX - 13).toFixed(1), y: (JIBY - 6).toFixed(1), width: 26, height: 12, rx: 2, "class": "crane-trolley" });
    var craneCable = add(gCrane, "line", { x1: parkX, y1: JIBY, x2: parkX, y2: JIBY + 30, "class": "crane-cable", pathLength: 1 });

    return {
      padPoly: gPad.querySelector(".pad"), footings: footings,
      bp: bp, postData: postData, beams: beams, purlins: purlins,
      trussLines: trussLines, trussGroups: trussGroups, gWeld: gWeld, metal: metal, black: black, cap: cap, gDim: gDim,
      crane: {
        g: gCrane, parkX: parkX, jibY: JIBY,
        beams: [craneMast, craneCJib, craneJib], stays: [craneFore, craneBack],
        cwt: craneCwt, trolley: craneTrolley, cable: craneCable
      }
    };
  }

  /* ---- The rest needs GSAP + ScrollTrigger ---- */
  if (!hasST || reduceMotion) {
    var pStatic = document.getElementById("process");
    if (pStatic) pStatic.classList.add("process--static");
    // Build a finished barn for the static fallback
    var refs0 = buildBarn();
    if (refs0) {
      refs0.black.forEach(function (p) { p.style.opacity = 1; });
      refs0.metal.forEach(function (p) { p.style.opacity = 0; });
      if (refs0.gDim) refs0.gDim.style.opacity = 0;
      refs0.bp.forEach(function (b) { b.style.opacity = 0; });
      refs0.trussGroups.forEach(function (t) { t.el.style.opacity = 1; }); // trusses already set
      if (refs0.crane) refs0.crane.g.style.opacity = 0;                    // finished state has no crane
    }
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
      // Light the words as the line scrolls up to the middle of the screen,
      // spread over a long-enough scroll that it's an unhurried reveal (the
      // fixed +=N controls the pace; it finishes ~when the line is centered).
      trigger: "#statement", start: "top 90%", end: "+=820", scrub: true,
      onUpdate: function (self) {
        var lit = Math.round(self.progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
      }
    });
  }

  /* Process — accurate self-erecting pole barn, 4 themed stages */
  (function () {
    var section = document.getElementById("process");
    if (!section) return;
    var panel = section.querySelector(".process__sticky");
    var steps = gsap.utils.toArray("#process .pstep");
    var dots  = gsap.utils.toArray("#process .process__dots li");
    var bar   = section.querySelector(".process__progress > i");

    var refs = buildBarn();
    if (!refs) return;
    var postEls = refs.postData.map(function (p) { return p.el; });

    // Welding-arc flicker — runs continuously while the FABRICATION stage is active.
    // The arc only shows when #sc-fab is faded in, so this just makes it strobe.
    var weldFlicker = gsap.timeline({ repeat: -1, paused: true })
      .to("#weldArc", { opacity: 1, duration: 0.06, ease: "none" })
      .to("#weldArc", { opacity: 0.35, duration: 0.05, ease: "none" })
      .to("#weldArc", { opacity: 0.9, duration: 0.04, ease: "none" })
      .to("#weldArc", { opacity: 0.2, duration: 0.08, ease: "none" })
      .to("#weldArc", { opacity: 0.85, duration: 0.05, ease: "none" })
      .to("#weldArc", { opacity: 0.4, duration: 0.10, ease: "none" });

    function setActive(i) {
      steps.forEach(function (sx, idx) { sx.classList.toggle("active", idx === i); });
      dots.forEach(function (d, idx) { d.classList.toggle("on", idx <= i); });
      // strobe the welder only during stage 2 (Fabrication)
      if (i === 1) { if (weldFlicker.paused()) weldFlicker.play(); }
      else if (!weldFlicker.paused()) { weldFlicker.pause(); gsap.set("#weldArc", { opacity: 0 }); }
    }
    setActive(0);

    // ---- initial hidden states ----
    gsap.set(refs.padPoly, { opacity: 0 });
    gsap.set(refs.footings, { opacity: 0 });
    gsap.set(refs.bp, { strokeDashoffset: 1 });
    gsap.set(refs.beams.concat(refs.purlins).concat([refs.cap]), { strokeDashoffset: 1 });
    gsap.set(refs.trussLines, { strokeDashoffset: 0 });                 // trusses are flown in, not drawn
    refs.trussGroups.forEach(function (t) { gsap.set(t.el, { opacity: 0, y: 0 }); });
    refs.postData.forEach(function (p) { gsap.set(p.el, { attr: { y: p.y + p.h, height: 0 } }); });
    gsap.set(refs.metal, { opacity: 0 });
    gsap.set(refs.black, { opacity: 0 });
    gsap.set(refs.gWeld, { opacity: 0 });
    gsap.set(refs.gDim, { opacity: 0 });
    gsap.set(refs.crane.beams.concat(refs.crane.stays), { strokeDashoffset: 1 });   // crane un-erected
    gsap.set([refs.crane.cwt, refs.crane.trolley, refs.crane.cable], { opacity: 0 });
    gsap.set(["#sc-consult", "#sc-fab", "#sc-deliver"], { opacity: 0 });

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: panel, start: "top top", end: "+=3000",
        pin: true, pinSpacing: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          setActive(Math.min(3, Math.floor(self.progress * 4)));
          if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
        }
      }
    });

    var JIBY = refs.crane.jibY, LIFT = 86;

    // ---- STAGE 1 — CONSULTATION [0.00–0.25]: site, footprint, blueprint ----
    tl.to("#sc-consult", { opacity: 0.85, duration: 0.04 }, 0.01)
      .to(refs.padPoly,  { opacity: 1, duration: 0.04 }, 0.03)
      .to(refs.footings, { opacity: 1, duration: 0.05, stagger: 0.004 }, 0.05)
      .to(refs.gDim,     { opacity: 1, duration: 0.05 }, 0.07)
      .to(refs.bp,       { strokeDashoffset: 0, duration: 0.13, stagger: 0.02 }, 0.07)

    // ---- STAGE 2 — FABRICATION [0.25–0.50]: posts rise + the crane is erected ----
      .to("#sc-consult", { opacity: 0, duration: 0.04 }, 0.24)
      .to(refs.gDim,     { opacity: 0, duration: 0.04 }, 0.24)
      .to("#sc-fab",     { opacity: 0.9, duration: 0.04 }, 0.26)
      .to(postEls, { attr: { y: function (i) { return refs.postData[i].y; }, height: function (i) { return refs.postData[i].h; } }, duration: 0.08, stagger: 0.008 }, 0.27)
      .to(refs.crane.beams, { strokeDashoffset: 0, duration: 0.05, stagger: 0.028 }, 0.31)   // mast, jib raise
      .to(refs.crane.stays, { strokeDashoffset: 0, duration: 0.04, stagger: 0.015 }, 0.41)   // pendants
      .to([refs.crane.cwt, refs.crane.trolley, refs.crane.cable], { opacity: 1, duration: 0.03 }, 0.45)
      .to([refs.beams[0], refs.beams[1]], { strokeDashoffset: 0, duration: 0.05, stagger: 0.012 }, 0.46)  // eave beams cap the posts

    // ---- STAGE 3 — DELIVERY/RAISING [0.50–0.75]: the crane sets every truss ----
      .to("#sc-fab",     { opacity: 0, duration: 0.04 }, 0.49)
      .to("#sc-deliver", { opacity: 0.8, duration: 0.04 }, 0.51)
      .to(refs.beams[2], { strokeDashoffset: 0, duration: 0.04 }, 0.72)    // ridge beam, once trusses are set
      .to(refs.gWeld,    { opacity: 1, duration: 0.04 }, 0.72)
      .to(refs.purlins,  { strokeDashoffset: 0, duration: 0.045, stagger: 0.015 }, 0.725)

    // ---- STAGE 4 — INSTALLATION [0.75–1.00]: crane leaves, roof goes on ----
      .to("#sc-deliver", { opacity: 0, duration: 0.04 }, 0.75)
      .to(refs.crane.g,  { opacity: 0, duration: 0.06 }, 0.77)             // crane leaves — no crane at the finish
      .to(refs.bp,       { opacity: 0, duration: 0.05 }, 0.77)
      .to(refs.metal,    { opacity: 1, duration: 0.08, stagger: 0.04 }, 0.80)
      .to("#grid",       { opacity: 0, duration: 0.08 }, 0.84)
      .to(refs.black,    { opacity: 1, duration: 0.09, stagger: 0.05 }, 0.88)
      .to(refs.cap,      { strokeDashoffset: 0, duration: 0.05 }, 0.94)
      .to({}, { duration: 0.02 }, 0.99);

    // ---- Crane truss-lift: fly each truss in back-to-front; hook ends empty ----
    var cable = refs.crane.cable, trolley = refs.crane.trolley;
    var T0 = 0.515, STEP = 0.0335, DUR = 0.018;
    refs.trussGroups.forEach(function (t, i) {
      var ax = t.apex[0], ay = t.apex[1], Ti = T0 + i * STEP;
      tl.to(trolley, { attr: { x: (ax - 13) }, duration: 0.008 }, Ti)             // trolley slides to this bay
        .to(cable,   { attr: { x1: ax, x2: ax }, duration: 0.008 }, Ti)
        .set(t.el,   { opacity: 1, y: -LIFT }, Ti + 0.009)                        // truss appears at the hook
        .set(cable,  { attr: { y1: JIBY, y2: (ay - LIFT) } }, Ti + 0.009)
        .to(t.el,    { y: 0, duration: DUR, ease: "power1.in" }, Ti + 0.010)       // lower onto the posts
        .to(cable,   { attr: { y2: ay }, duration: DUR, ease: "power1.in" }, Ti + 0.010)
        .to(cable,   { attr: { y2: (JIBY + 20) }, duration: 0.006 }, Ti + 0.010 + DUR); // release, hook back up empty
    });
  })();

  /* Gallery — desktop horizontal scroll.
     Pin the gallery and translate the track left as the user scrolls so
     every project photo pans across. On <=980px the CSS turns the same
     markup into a native swipe rail, so only wire the GSAP version on
     desktop; gsap.matchMedia auto-reverts it (clearing the transform) if
     the viewport crosses back under the breakpoint. */
  (function () {
    var section = document.getElementById("gallery");
    var track = document.getElementById("galleryTrack");
    if (!section || !track) return;
    var mm = gsap.matchMedia();
    mm.add("(min-width: 981px)", function () {
      var amount = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.to(track, {
        x: function () { return -amount(); },
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: function () { return "+=" + amount(); },
          pin: true, pinSpacing: true, scrub: 0.7,
          anticipatePin: 1, invalidateOnRefresh: true
        }
      });
    });
  })();

  /* Safety: recalc on resize */
  window.addEventListener("resize", function () { ScrollTrigger.refresh(); });
})();
