/* =========================================================
   FRIGUS — video-scroll.js
   Liga a posição do scroll à timeline do vídeo.
   SCROLL POSITION === VIDEO TIMELINE
   ========================================================= */
(function (w, d) {
  "use strict";

  var SUPPORTS_SCRUB = (function () {
    if (w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // Scrub por currentTime é caro em telas pequenas / touch: usamos fallback.
    var coarse = w.matchMedia && w.matchMedia("(pointer: coarse)").matches;
    var small = w.innerWidth < 900;
    return !(coarse && small);
  })();

  /* Espera os metadados (duration) ficarem disponíveis. */
  function whenReady(video, cb) {
    if (video.readyState >= 1 && video.duration && isFinite(video.duration)) { cb(); return; }
    var done = false;
    function fire() { if (!done) { done = true; cb(); } }
    video.addEventListener("loadedmetadata", fire, { once: true });
    video.addEventListener("canplay", fire, { once: true });
    // rede lenta / poster apenas: não trava a página
    setTimeout(function () { if (video.duration && isFinite(video.duration)) fire(); }, 4000);
  }

  /**
   * Origem alternativa: se o arquivo local não existir (pasta assets/videos
   * ainda vazia), o vídeo passa a carregar direto do CDN onde foi gerado.
   * Assim a página funciona antes e depois do download dos arquivos.
   */
  function attachFallback(video) {
    var remote = video.getAttribute("data-fallback");
    if (!remote) return;
    var swapped = false;

    function swap() {
      if (swapped) return;
      swapped = true;
      var sources = video.querySelectorAll("source");
      for (var i = 0; i < sources.length; i++) sources[i].parentNode.removeChild(sources[i]);
      video.src = remote;
      video.load();
    }

    /**
     * Só troca quando o arquivo local realmente não serve.
     * O navegador aborta o download de vídeos pausados e fora da tela
     * (MEDIA_ERR_ABORTED) e isso dispara "error" sem nada estar quebrado —
     * trocar aí jogaria fora um arquivo local bom em favor do remoto.
     */
    function isMissing() {
      if (video.networkState === 3 /* NETWORK_NO_SOURCE */) return true;
      var e = video.error;
      if (!e) return false;
      /* 1 = ABORTED (cancelado de propósito), 3 = DECODE (o arquivo existe) */
      return e.code === 2 /* NETWORK */ || e.code === 4 /* SRC_NOT_SUPPORTED */;
    }

    function maybeSwap() { if (isMissing()) swap(); }

    /* o erro pode ter acontecido antes deste script rodar */
    if (isMissing()) { swap(); return; }

    video.addEventListener("error", maybeSwap);
    /* O erro de um <source> chega antes de o navegador desistir de todos:
       reavalia no tique seguinte, quando networkState já está definido. */
    var srcEls = video.querySelectorAll("source");
    for (var j = 0; j < srcEls.length; j++) {
      srcEls[j].addEventListener("error", function () { setTimeout(maybeSwap, 0); });
    }
  }

  function initFallbacks(root) {
    var list = (root || d).querySelectorAll("video[data-fallback]");
    for (var i = 0; i < list.length; i++) attachFallback(list[i]);
  }

  /* Reprodução simples em loop (fallback). */
  function loopPlay(video) {
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica no poster */ });
  }

  /**
   * Começa a baixar o vídeo sem esperar o play.
   * `preload="none"` no HTML mantém o carregamento inicial leve; aqui
   * promovemos para "auto" assim que a seção se aproxima da viewport,
   * para o vídeo já estar decodificável quando entrar em cena.
   */
  function warmUp(video) {
    if (!video || video.dataset.warm === "1") return;
    video.dataset.warm = "1";
    if (video.preload === "none" || !video.preload) video.preload = "auto";
    /* readyState 0 = nada carregado: precisa de um load() explícito,
       porque mudar o atributo preload depois do parse não reinicia a busca. */
    if (video.readyState === 0) { try { video.load(); } catch (e) { /* ignora */ } }
  }

  /**
   * scrubToScroll(video, opts)
   *  opts.trigger  elemento que define o intervalo de scroll
   *  opts.start / opts.end   strings do ScrollTrigger
   *  opts.onProgress(p)      callback 0..1
   */
  function scrubToScroll(video, opts) {
    opts = opts || {};
    var gsap = w.gsap, ST = w.ScrollTrigger;
    if (!video) return;

    if (!gsap || !ST || !SUPPORTS_SCRUB) { loopPlay(video); return; }

    warmUp(video);

    whenReady(video, function () {
      var dur = video.duration || 1;
      var state = { t: 0 };

      /* ---- laço de seek guiado pelo evento `seeked` ----
         Reatribuir currentTime enquanto um seek ainda está em andamento faz o
         decodificador enfileirar trabalho e engasgar. Mantemos no máximo um
         seek em voo: o alvo mais recente sobrescreve o anterior e é aplicado
         assim que o anterior termina. */
      var target = null;
      var seeking = false;
      var guard = null;

      function done() {
        if (guard) { clearTimeout(guard); guard = null; }
        seeking = false;
        pump();
      }

      function pump() {
        if (seeking || target === null) return;
        var t = target;
        target = null;
        if (Math.abs(video.currentTime - t) < 0.016) return; /* já está no frame */
        seeking = true;
        /* se o `seeked` não vier (erro de rede, buffer), destrava sozinho */
        guard = setTimeout(done, 400);
        try {
          video.currentTime = t;
        } catch (e) {
          done(); /* seek fora de alcance: ignora */
        }
      }

      video.addEventListener("seeked", done);
      video.addEventListener("error", done);

      function seek(t) {
        target = Math.max(0, Math.min(dur - 0.02, t));
        pump();
      }

      video.pause();
      seek(0);

      gsap.to(state, {
        t: dur,
        ease: "none",
        scrollTrigger: {
          trigger: opts.trigger || video,
          start: opts.start || "top top",
          end: opts.end || "bottom bottom",
          scrub: opts.scrub == null ? 0.4 : opts.scrub,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (typeof opts.onProgress === "function") opts.onProgress(self.progress);
          }
        },
        onUpdate: function () { seek(state.t); }
      });
    });
  }

  /**
   * Toca o vídeo somente enquanto a seção está visível (economiza CPU/bateria).
   * O download começa antes, um pouco abaixo da dobra, para o vídeo não
   * aparecer em branco/poster no momento em que entra na tela.
   */
  function playInView(video, trigger) {
    if (!video) return;
    var ST = w.ScrollTrigger;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    function start() {
      warmUp(video);
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    function stop() { video.pause(); }

    if (!ST) { start(); return; }

    /* pré-carrega uma viewport inteira antes de entrar em cena */
    ST.create({
      trigger: trigger || video,
      start: "top bottom+=100%",
      end: "bottom top-=100%",
      onEnter: function () { warmUp(video); },
      onEnterBack: function () { warmUp(video); }
    });

    ST.create({
      trigger: trigger || video,
      start: "top bottom",
      end: "bottom top",
      onEnter: start,
      onEnterBack: start,
      onLeave: stop,
      onLeaveBack: stop
    });
  }

  w.FrigusVideo = {
    scrubToScroll: scrubToScroll,
    playInView: playInView,
    initFallbacks: initFallbacks,
    warmUp: warmUp,
    supportsScrub: SUPPORTS_SCRUB
  };

  /* liga as origens alternativas o quanto antes */
  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", function () { initFallbacks(); });
  } else {
    initFallbacks();
  }
})(window, document);
