(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scenes = $$('.scene');
  var N = scenes.length;
  var items = scenes.map(function (s) { return $$('.it', s); });
  var spacer = $('#spacer'), scrim = $('#scrim'), prog = $('#prog'), vid = $('#bg');
  var dots = $$('.dots button');
  var H = 800, dirty = true, introDone = false, heroT = 0, heroStart = null;

  var DIRS = { u: [0, 1, 0], d: [0, -1, 0], l: [-1, 0, -1], r: [1, 0, 1], z: [0, 0.5, 0] };
  var clamp = function (x) { return Math.min(1, Math.max(0, x)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t; };

  function size() {
    H = Math.max(window.innerHeight * 1.7, 620);
    spacer.style.height = ((N - 1 + 0.55) * H + window.innerHeight) + 'px';
    dirty = true;
  }

  function render() {
    var y = window.scrollY || window.pageYOffset || 0;
    var g = y / H;
    var active = Math.min(N - 1, Math.max(0, Math.round(g)));

    scenes.forEach(function (sc, i) {
      var p = g - i, maxOp = 0;
      items[i].forEach(function (el, k) {
        var dir = DIRS[el.getAttribute('data-d') || 'u'];
        var en;
        if (i === 0) {
          en = introDone ? easeOut(clamp((heroT - k * 0.08) / 0.55)) : 0;
        } else {
          en = easeOut(clamp((p + 0.06 - k * 0.035) / 0.24));
        }
        var ex = (i === N - 1) ? 0 : easeIn(clamp((p - (0.6 + k * 0.028)) / 0.2));
        var op = en * (1 - ex);
        if (op > maxOp) maxOp = op;
        el.style.opacity = op.toFixed(3);
        if (reduce) return;
        var dx = dir[0] * (1 - en) * 70;
        var dy = dir[1] * (1 - en) * 70 - ex * 80;
        var rot = dir[2] * (1 - en) * 3;
        var sc2 = 0.95 + 0.05 * en - 0.04 * ex;
        var blur = (1 - en) * 8 + ex * 6;
        el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc2.toFixed(3) + ')';
        el.style.filter = blur > 0.4 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
      });
      sc.style.visibility = maxOp > 0.01 ? 'visible' : 'hidden';
      sc.classList.toggle('on', i === active);
    });

    var total = (N - 1) * H;
    var f = clamp(y / total);
    scrim.style.setProperty('--dk', f.toFixed(3));
    if (!reduce) vid.style.transform = 'scale(' + (1 + 0.07 * f).toFixed(4) + ')';
    prog.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    dots.forEach(function (d, i) { d.classList.toggle('on', i === active); });
  }

  function loop() {
    if (heroStart !== null && heroT < 1.5) {
      heroT = (performance.now() - heroStart) / 1000;
      dirty = true;
    }
    if (dirty) { dirty = false; render(); }
    requestAnimationFrame(loop);
  }

  function goTo(i) {
    var top = i === 0 ? 0 : (i === N - 1 ? (N - 1 + 0.5) * H : (i + 0.4) * H);
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }

  window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
  window.addEventListener('resize', size);
  $$('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { goTo(parseInt(b.getAttribute('data-go'), 10)); });
  });
  $('#brand').addEventListener('click', function (e) { e.preventDefault(); goTo(0); });

  // Som do vídeo
  var snd = $('#snd');
  snd.addEventListener('click', function () {
    vid.muted = !vid.muted;
    var on = !vid.muted;
    snd.setAttribute('aria-pressed', on ? 'true' : 'false');
    snd.setAttribute('aria-label', on ? 'Desligar o som do vídeo' : 'Ligar o som do vídeo');
    $('#snd-on').hidden = !on;
    $('#snd-off').hidden = on;
    var pl = vid.play(); if (pl && pl.catch) pl.catch(function () {});
  });

  // Copiar telefone
  var copy = $('#copy');
  copy.addEventListener('click', function () {
    var txt = '(83) 99662-3538';
    var done = function () {
      copy.textContent = 'Copiado';
      setTimeout(function () { copy.textContent = 'Copiar'; }, 1600);
    };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents($('#phone'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    try {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } catch (e) { fallback(); }
  });

  // Abertura
  var intro = $('#intro'), typed = $('#typed'), result = $('#result'), load = $('#load');
  var QUERY = 'especialista seo local joão pessoa';
  var finished = false, timer = null;
  document.documentElement.classList.add('lock');

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    intro.classList.add('open');
    introDone = true;
    heroStart = performance.now() + 450;
    var pl = vid.play(); if (pl && pl.catch) pl.catch(function () {});
    setTimeout(function () {
      intro.hidden = true;
      document.documentElement.classList.remove('lock');
    }, reduce ? 50 : 1250);
  }

  $('#skip').addEventListener('click', finish);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });

  size();
  requestAnimationFrame(loop);

  if (reduce) {
    typed.textContent = QUERY;
    finish();
  } else {
    var i = 0;
    setTimeout(function () {
      timer = setInterval(function () {
        i++;
        typed.textContent = QUERY.slice(0, i);
        load.style.width = (i / QUERY.length * 100) + '%';
        if (i >= QUERY.length) {
          clearInterval(timer);
          result.classList.add('show');
          setTimeout(finish, 1000);
        }
      }, 48);
    }, 450);
    setTimeout(finish, 6000);
  }
})();
