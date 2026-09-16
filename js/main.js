/* =========================================================
   FRIGUS — main.js
   Navegação · menu · progresso · campo de partículas
   ========================================================= */
(function (w, d) {
  "use strict";

  var html = d.documentElement;
  var REDUCED = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_GSAP = !!(w.gsap && w.ScrollTrigger);

  function q(s, c) { return (c || d).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function raf(fn) { return w.requestAnimationFrame(fn); }

  /* Sem GSAP (offline, bloqueio de CDN) o site continua legível. */
  if (!HAS_GSAP) html.classList.add("no-anim");

  /* ---------------------------------------------------------
     NAVEGAÇÃO — fundo, tema claro/escuro e seção atual
     --------------------------------------------------------- */
  function navigation() {
    var nav = q("#nav");
    var bar = q("#scrollBar");
    if (!nav) return;

    var lightSections = qa(".intro, .svc, .comfort, .proof");
    var sections = qa("[data-section]");
    var links = qa(".nav__menu a[data-nav]");
    var lastY = 0;
    var ticking = false;

    function update() {
      ticking = false;
      var y = w.pageYOffset || html.scrollTop;
      var navMid = nav.offsetHeight * 0.5;

      /* fundo sólido depois do hero inicial */
      nav.classList.toggle("is-solid", y > 40);

      /* tema do menu conforme a seção sob ele */
      var onLight = lightSections.some(function (s) {
        var r = s.getBoundingClientRect();
        return r.top <= navMid && r.bottom >= navMid;
      });
      nav.classList.toggle("is-light", onLight);

      /* esconde ao descer, mostra ao subir */
      var goingDown = y > lastY && y > 340;
      nav.classList.toggle("is-hidden", goingDown && !q(".mnav.is-open"));
      lastY = y;

      /* barra de progresso */
      if (bar) {
        var max = d.body.scrollHeight - w.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      }

      /* indicador da seção atual */
      var mid = w.innerHeight * 0.45;
      var current = null;
      sections.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) current = s.getAttribute("data-section");
      });
      links.forEach(function (a) {
        a.classList.toggle("is-current", a.getAttribute("data-nav") === current);
      });
    }

    w.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; raf(update); }
    }, { passive: true });
    w.addEventListener("resize", update);
    update();
  }

  /* ---------------------------------------------------------
     MENU MOBILE
     --------------------------------------------------------- */
  function mobileMenu() {
    var burger = q("#burger");
    var menu = q("#mobileMenu");
    if (!burger || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      html.classList.toggle("is-locked", open);
    }

    burger.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });
    qa("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
    setOpen(false);
  }

  /* ---------------------------------------------------------
     CAMPO DE PARTÍCULAS — ar frio em circulação (seção Tecnologia)
     Canvas 2D leve: pausa fora da viewport e respeita reduced-motion.
     --------------------------------------------------------- */
  function particleField() {
    var canvas = q("#techCanvas");
    if (!canvas || REDUCED) return;
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    var particles = [];
    var wdt = 0, hgt = 0;
    var running = false;
    var frame = null;

    function resize() {
      var r = canvas.getBoundingClientRect();
      wdt = r.width; hgt = r.height;
      canvas.width = Math.floor(wdt * dpr);
      canvas.height = Math.floor(hgt * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var target = Math.round(Math.min(150, (wdt * hgt) / 11000));
      particles = [];
      for (var i = 0; i < target; i++) {
        particles.push({
          x: Math.random() * wdt,
          y: Math.random() * hgt,
          r: Math.random() * 1.6 + 0.4,
          vx: (Math.random() * 0.5 + 0.12) * (Math.random() < 0.5 ? -1 : 1),
          vy: -(Math.random() * 0.22 + 0.05),
          a: Math.random() * 0.45 + 0.12,
          p: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      frame = null;
      if (!running) return;
      ctx.clearRect(0, 0, wdt, hgt);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.p += 0.012;
        p.x += p.vx + Math.sin(p.p) * 0.28;
        p.y += p.vy;

        if (p.y < -12) { p.y = hgt + 12; p.x = Math.random() * wdt; }
        if (p.x < -12) p.x = wdt + 12;
        if (p.x > wdt + 12) p.x = -12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(141,213,232," + p.a + ")";
        ctx.fill();
      }
      frame = raf(draw);
    }

    function start() { if (!running) { running = true; if (!frame) frame = raf(draw); } }
    function stop() { running = false; if (frame) { cancelAnimationFrame(frame); frame = null; } }

    resize();
    w.addEventListener("resize", function () { resize(); }, { passive: true });
    d.addEventListener("visibilitychange", function () { d.hidden ? stop() : start(); });

    if ("IntersectionObserver" in w) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { rootMargin: "120px" }).observe(canvas);
    } else {
      start();
    }
  }

  /* ---------------------------------------------------------
     ÂNCORAS — rolagem suave com compensação do menu fixo
     --------------------------------------------------------- */
  function anchors() {
    qa('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var target = q(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + (w.pageYOffset || 0) - 8;
        w.scrollTo({ top: top, behavior: REDUCED ? "auto" : "smooth" });
      });
    });
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  /* Remede os gatilhos quando algo que afeta altura termina de chegar:
     webfont (títulos gigantes mudam de métrica), imagens e metadados de
     vídeo. Sem isso os pontos de start/end ficam presos na medição antiga. */
  function refreshWhenSettled() {
    if (!HAS_GSAP) return;
    var ST = w.ScrollTrigger;
    function refresh() { ST.refresh(); }

    if (d.fonts && d.fonts.ready && d.fonts.ready.then) d.fonts.ready.then(refresh);
    w.addEventListener("load", refresh, { once: true });
    /* última rede de segurança depois da página assentar.
       Os vídeos ficam de fora de propósito: todos moram em caixas de
       proporção fixa, então o metadado não muda altura nenhuma — remedir
       quando um deles carrega só arriscaria um salto no meio do scroll. */
    setTimeout(refresh, 1200);
  }

  function boot() {
    navigation();
    mobileMenu();
    particleField();
    anchors();

    if (REDUCED) {
      /* movimento reduzido: sem scrub e sem vídeo em movimento, só os posters */
      html.classList.add("no-anim");
      qa("video").forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); });
    } else if (!HAS_GSAP) {
      /* sem GSAP: o site perde as animações, mas os vídeos continuam rodando */
      qa("video").forEach(function (v) { w.FrigusVideo.playInView(v); });
    }

    /* A partir daqui quem manda no hero é o GSAP (ou o .no-anim): a trava
       anti-piscada do CSS já cumpriu o papel dela e sai de cena. */
    html.classList.remove("js-anim");

    if (!HAS_GSAP || REDUCED) return;

    /* Sem preloader, o init roda aqui — o documento já tem a altura final
       porque nada trava o scroll nem encolhe o <body>. O que ainda chega
       depois (webfont, window.load) é coberto por refreshWhenSettled. */
    try {
      w.FrigusAnim.init();
      if (w.FrigusAnim.heroIntro) w.FrigusAnim.heroIntro.play();
      refreshWhenSettled();
    } catch (err) {
      /* nunca deixa uma falha de animação quebrar a página */
      html.classList.add("no-anim");
      qa("video").forEach(function (v) { w.FrigusVideo.playInView(v); });
      if (w.console) console.warn("[FRIGUS] animações desativadas:", err);
    }
  }

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window, document);
