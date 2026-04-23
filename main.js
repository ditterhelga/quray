(function () {
  "use strict";

  const headerCta = document.getElementById("header-cta");
  const siteHeader = document.getElementById("site-header");
  const heroSpatial = document.querySelector("[data-hero-spatial]");

  function easeOutCubic(t) {
    const x = Math.max(0, Math.min(1, t));
    return 1 - (1 - x) ** 3;
  }

  function smoothstep(edge0, edge1, x) {
    if (x <= edge0) return 0;
    if (x >= edge1) return 1;
    const t = (x - edge0) / (edge1 - edge0);
    return t * t * (3 - 2 * t);
  }

  function updateHeaderCtaVisibility(scrollY) {
    const threshold = Math.max(window.innerHeight * 0.22, 120);
    const visible = scrollY > threshold;

    if (headerCta) {
      headerCta.classList.toggle("opacity-0", !visible);
      headerCta.classList.toggle("-translate-y-2", !visible);
      headerCta.classList.toggle("pointer-events-none", !visible);
    }

    if (siteHeader) {
      siteHeader.classList.toggle("is-scrolled", visible);
    }
  }

  function updateHeroSequence() {
    if (!heroSpatial) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const rect = heroSpatial.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const sceneRange = Math.max(1, rect.height - viewportH);
    const traveled = Math.max(0, Math.min(sceneRange, -rect.top));
    const raw = traveled / sceneRange;

    const sceneP = smoothstep(0.22, 0.96, raw);
    const titleP = easeOutCubic(sceneP);
    const subP = smoothstep(0.28, 0.7, sceneP);
    const ctaP = smoothstep(0.56, 0.92, sceneP);
    const imgDim = smoothstep(0.18, 1, sceneP);
    const deviceP = smoothstep(0.02, 1, sceneP);
    const deviceY = -22.4 * sceneP;

    heroSpatial.style.setProperty("--hero-t", sceneP.toFixed(4));
    heroSpatial.style.setProperty("--hero-title-p", titleP.toFixed(4));
    heroSpatial.style.setProperty("--hero-sub-p", subP.toFixed(4));
    heroSpatial.style.setProperty("--hero-cta-p", ctaP.toFixed(4));
    heroSpatial.style.setProperty("--hero-img-dim", imgDim.toFixed(4));
    heroSpatial.style.setProperty("--hero-device-p", deviceP.toFixed(4));
    heroSpatial.style.setProperty("--hero-device-y", `${deviceY.toFixed(4)}vh`);

    heroSpatial.classList.toggle("is-cta-interactive", ctaP > 0.2);
  }

  function updateOnScroll(scrollY) {
    const y = typeof scrollY === "number" ? scrollY : window.scrollY;
    updateHeaderCtaVisibility(y);
    updateHeroSequence();
  }

  function bindNativeScroll() {
    window.addEventListener("scroll", () => updateOnScroll(), { passive: true });
    window.addEventListener("resize", () => updateOnScroll());
    updateOnScroll();
  }

  function bindLenisScroll() {
    const LenisCtor = globalThis.Lenis;
    if (typeof LenisCtor !== "function") {
      throw new Error("Lenis not found (expected vendor/lenis.min.js before main.js)");
    }

    document.documentElement.classList.add("lenis", "lenis-smooth");

    const lenis = new LenisCtor({
      smoothWheel: true,
      lerp: 0.085,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.65,
    });

    lenis.on("scroll", () => updateOnScroll(lenis.scroll));
    window.addEventListener("resize", () => updateOnScroll(lenis.scroll));

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    updateOnScroll(lenis.scroll);
  }

  function revealBody() {
    document.body.classList.add("is-ready");
  }

  function whenDomReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  whenDomReady(function () {
    revealBody();

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      if (heroSpatial) {
        heroSpatial.style.setProperty("--hero-t", "1");
        heroSpatial.style.setProperty("--hero-title-p", "1");
        heroSpatial.style.setProperty("--hero-sub-p", "1");
        heroSpatial.style.setProperty("--hero-cta-p", "1");
        heroSpatial.style.setProperty("--hero-img-dim", "1");
        heroSpatial.style.setProperty("--hero-device-p", "1");
        heroSpatial.style.setProperty("--hero-device-y", "-22.4vh");
        heroSpatial.classList.add("is-cta-interactive");
      }
      bindNativeScroll();
      window.addEventListener("load", () => updateOnScroll(), { once: true });
      return;
    }

    try {
      bindLenisScroll();
    } catch (err) {
      console.warn("Lenis unavailable; using native scroll.", err);
      bindNativeScroll();
    }

    window.addEventListener("load", () => updateOnScroll(), { once: true });
  });
})();
