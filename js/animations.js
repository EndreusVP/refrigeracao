/* =========================================================
   RefrigeraSim — animations.js
   Cada capítulo tem a sua própria linguagem de animação.

   HERO        scale + scrub
   INTRO       blur -> sharp (palavra a palavra)
   SERVIÇOS    slide lateral / escala central / máscara / vertical
   GALERIA     scroll horizontal com pin
   PROCESSO    stagger + linha de progresso
   TECNOLOGIA  parallax multicamada
   CONFORTO    fade + scale
   CTA         expansão de máscara (clip-path)
   ========================================================= */
(function (w, d) {
  "use strict";

  var F = (w.RefrigeraSimAnim = {});

  function q(s, c) { return (c || d).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* ---------- 01 — HERO : scale + scrub ---------- */
  F.hero = function () {
    var hero = q("#hero");
    var stage = q(".hero__stage");
    var media = q("#heroMedia");
    var video = q("#heroVideo");
    var frame = q("#hudFrame");
    var temp = q("#hudTemp");
    if (!hero || !media) return;

    /* vídeo conduzido pelo scroll */
    w.RefrigeraSimVideo.scrubToScroll(video, {
      trigger: hero,
      start: "top top",
      end: "bottom bottom",
      onProgress: function (p) {
        if (frame) frame.textContent = String(Math.round(p * 240)).padStart(3, "0");
        if (temp) temp.textContent = (-18 + p * 14).toFixed(1) + "°C";
      }
    });

    /* a câmera "aproxima": o vídeo cresce enquanto o texto sai */
    gsap.fromTo(media,
      { scale: 1.16 },
      {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "40% top", scrub: true }
      }
    );
    gsap.to(media, {
      scale: 1.1, ease: "none",
      scrollTrigger: { trigger: hero, start: "55% top", end: "bottom bottom", scrub: true }
    });

    /* entrada do título */
    /* fromTo, e não from: o CSS (.js-anim) já deixa estes elementos na
       posição inicial para não piscarem antes do GSAP assumir. Com .from()
       o GSAP leria esse mesmo estado como destino e animaria 118% -> 118%,
       deixando o título preso fora da máscara. */
    var intro = gsap.timeline({ paused: true });
    intro
      .fromTo("[data-hero-word]",
        { yPercent: 118 },
        { yPercent: 0, duration: 1.5, ease: "expo.out", stagger: 0.09 })
      .fromTo("[data-hero-fade]",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 1.1, ease: "power2.out", stagger: 0.12 },
        "-=1.05");
    F.heroIntro = intro;

    /* saída do título conforme o scroll avança */
    gsap.to(".hero__content", {
      yPercent: -28, opacity: 0, filter: "blur(10px)", ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "32% top", scrub: true }
    });
    gsap.to([".hero__scroll", ".hero__hud"], {
      opacity: 0, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "18% top", scrub: true }
    });

    /* entrega para a próxima seção: o vídeo recua atrás do conteúdo claro */
    gsap.to(stage, {
      opacity: 0.25, ease: "none",
      scrollTrigger: { trigger: hero, start: "80% top", end: "bottom bottom", scrub: true }
    });
  };

  /* ---------- 02 — INTRO : blur -> sharp ---------- */
  F.intro = function () {
    var el = q("#introText");
    if (!el) return;

    /* quebra em palavras preservando o texto original */
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map(function (word) { return '<span class="w">' + word + "</span>"; })
      .join(" ");

    gsap.fromTo(qa(".w", el),
      { opacity: 0.08, filter: "blur(14px)", y: 18 },
      {
        opacity: 1, filter: "blur(0px)", y: 0,
        ease: "power2.out", duration: 1.1, stagger: 0.055,
        scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 58%", toggleActions: "play none none reverse" }
      }
    );

    gsap.fromTo("[data-blur-item]",
      { opacity: 0, filter: "blur(9px)", y: 22 },
      {
        opacity: 1, filter: "blur(0px)", y: 0,
        ease: "power2.out", duration: 0.95, stagger: 0.12,
        scrollTrigger: { trigger: ".intro", start: "top 68%" }
      }
    );
  };

  /* ---------- 03 — SERVIÇOS : quatro animações distintas ---------- */
  F.services = function () {
    var rows = qa(".svc__row");
    if (!rows.length) return;

    /* cabeçalho */
    gsap.from(".svc__head .h-display", {
      yPercent: 30, opacity: 0, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: ".svc__head", start: "top 78%" }
    });

    rows.forEach(function (row) {
      var kind = row.getAttribute("data-svc");
      var visual = q(".svc__visual", row);
      var body = q(".svc__body", row);
      var video = q("video", row);
      var st = { trigger: row, start: "top 76%", end: "top 32%", scrub: 0.8 };

      if (kind === "a") {
        /* 01 — entra lateralmente */
        gsap.fromTo(visual, { xPercent: 26, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "none", scrollTrigger: st });
        gsap.fromTo(body, { x: -28, opacity: 0 }, { x: 0, opacity: 1, ease: "none", scrollTrigger: st });

      } else if (kind === "b") {
        /* 02 — cresce a partir do centro */
        gsap.fromTo(visual, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: st });
        gsap.fromTo(body, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: st });

      } else if (kind === "c") {
        /* 03 — revelação por máscara */
        gsap.fromTo(visual,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: st }
        );
        gsap.fromTo(body, { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", ease: "none", scrollTrigger: st });

      } else {
        /* 04 — desliza verticalmente */
        gsap.fromTo(visual, { yPercent: 22, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: st });
        gsap.fromTo(body, { y: 46, opacity: 0 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: st });
      }

      /* leve parallax interno no vídeo */
      if (video) {
        gsap.fromTo(video, { yPercent: -6 }, {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true }
        });
        w.RefrigeraSimVideo.playInView(video, row);
      }
    });
  };

  /* ---------- 04 — GALERIA : scroll horizontal ---------- */
  F.gallery = function () {
    var pin = q("#galPin");
    var track = q("#galTrack");
    if (!pin || !track) return;

    qa("video", track).forEach(function (v) { w.RefrigeraSimVideo.playInView(v, pin); });

    var tween = gsap.to(track, {
      x: function () { return -(track.scrollWidth - w.innerWidth); },
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        pin: true,
        scrub: 0.9,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        end: function () { return "+=" + Math.max(1, track.scrollWidth - w.innerWidth); }
      }
    });

    /* cada cartão ganha um leve avanço próprio dentro do trilho */
    qa(".gal__card", track).forEach(function (card, i) {
      gsap.fromTo(q(".gal__media", card),
        { scale: 1.12 },
        {
          scale: 1, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true }
        }
      );
      gsap.fromTo(card.querySelector("figcaption"),
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 78%" }
        }
      );
    });
  };

  /* ---------- 05 — PROCESSO : stagger + linha ---------- */
  F.process = function () {
    var rail = q("#procRail");
    var fill = q("#procFill");
    var steps = qa(".proc__step");
    if (!rail || !steps.length) return;

    gsap.from(".proc__head .h-display", {
      opacity: 0, y: 40, duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: ".proc__head", start: "top 78%" }
    });

    if (fill) {
      gsap.fromTo(fill, { width: "0%" }, {
        width: "100%", ease: "none",
        scrollTrigger: { trigger: rail, start: "top 72%", end: "bottom 62%", scrub: 0.5 }
      });
    }

    steps.forEach(function (step, i) {
      gsap.fromTo(step,
        { opacity: 0, y: 34 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: "power3.out", delay: i * 0.06,
          scrollTrigger: {
            trigger: step, start: "top 88%",
            onEnter: function () { step.classList.add("is-on"); },
            onLeaveBack: function () { step.classList.remove("is-on"); }
          }
        }
      );
    });
  };

  /* ---------- 06 — TECNOLOGIA : parallax ---------- */
  F.tech = function () {
    var sec = q("#tecnologia");
    if (!sec) return;

    qa("[data-tech-parallax]", sec).forEach(function (el) {
      var depth = parseFloat(el.getAttribute("data-tech-parallax")) || 0.2;
      gsap.fromTo(el,
        { y: 90 * depth },
        {
          y: -90 * depth, ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
        }
      );
    });

    gsap.from(qa(".tech__stage", sec), {
      opacity: 0, y: 60, filter: "blur(6px)",
      duration: 1, ease: "power3.out", stagger: 0.14,
      scrollTrigger: { trigger: ".tech__diagram", start: "top 80%" }
    });

    /* as linhas de fluxo correm com o scroll */
    qa(".tech__flow i", sec).forEach(function (line, i) {
      gsap.fromTo(line,
        { xPercent: -100 + i * 8, opacity: 0 },
        {
          xPercent: 100, opacity: 0.7, ease: "none",
          scrollTrigger: { trigger: sec, start: "top center", end: "bottom top", scrub: 1 + i * 0.25 }
        }
      );
    });
  };

  /* ---------- 07 — CONFORTO : fade + scale ---------- */
  F.comfort = function () {
    var sec = q("#conforto");
    if (!sec) return;
    var video = q("#comfortVideo");

    w.RefrigeraSimVideo.playInView(video, sec);

    gsap.fromTo(q(".comfort__media", sec),
      { scale: 1.2, opacity: 0.4 },
      {
        scale: 1, opacity: 1, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "center center", scrub: true }
      }
    );

    var tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: "top 62%", end: "center 42%", scrub: 0.7 }
    });
    tl.fromTo(".comfort__line--1",
      { opacity: 0, scale: 0.94, y: 40 },
      { opacity: 1, scale: 1, y: 0, ease: "power2.out" }
    )
      .fromTo(".comfort__line--2",
        { opacity: 0, scale: 0.86, letterSpacing: "0.12em" },
        { opacity: 1, scale: 1, letterSpacing: "-0.045em", ease: "power2.out" }, "-=0.25")
      .fromTo(".comfort__note",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, ease: "power2.out" }, "-=0.2");
  };

  /* ---------- 08 — PROVA : contadores ---------- */
  F.proof = function () {
    qa(".proof__num[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var prefix = el.getAttribute("data-prefix") || "";
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.9, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
        onUpdate: function () {
          el.textContent = prefix + Math.round(obj.v).toLocaleString("pt-BR");
        }
      });
    });

    gsap.from(".proof__item", {
      opacity: 0, y: 30, duration: 0.9, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: ".proof__grid", start: "top 84%" }
    });
  };

  /* ---------- 09 — CTA : expansão de máscara ---------- */
  F.cta = function () {
    var sec = q("#contato");
    var mask = q("#ctaMask");
    if (!sec || !mask) return;

    w.RefrigeraSimVideo.playInView(q(".cta__video", sec), sec);

    gsap.fromTo(mask,
      { clipPath: "inset(42% 24% 42% 24% round 3px)" },
      {
        clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: sec, start: "top 85%", end: "center center", scrub: 0.8 }
      }
    );

    gsap.from("[data-cta-word]", {
      yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: sec, start: "top 62%" }
    });
    gsap.from([".cta__sub", ".cta__actions"], {
      opacity: 0, y: 26, duration: 0.9, ease: "power2.out", stagger: 0.12,
      scrollTrigger: { trigger: sec, start: "top 52%" }
    });
  };

  /* ---------- inicialização ---------- */
  F.init = function () {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    F.hero();
    F.intro();
    F.services();
    F.gallery();
    F.process();
    F.tech();
    F.comfort();
    F.proof();
    F.cta();

    ScrollTrigger.refresh();
  };
})(window, document);
