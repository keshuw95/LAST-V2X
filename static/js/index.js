document.documentElement.classList.add('js');

var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', function () {
  setupReveal();
  setupConsole();
  setupTabs();
  setupLightbox();
  setupCopy();
  setupReplay();
});

// Fade sections in as they scroll into view; count up the key numbers.
function setupReveal() {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || REDUCED) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('.count').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  items.forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });
}

function countUp(el) {
  var to = parseFloat(el.dataset.to);
  if (!to) return;
  var t0 = null;
  function step(ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / 1100);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  el.textContent = '0';
  requestAnimationFrame(step);
}

// Hero editor: type real prompts from the paper, then show the specification they compile to.
// Each row is [key, value, comment]; values are pre-highlighted HTML.
var S = function (v) { return '<span class="j-s">"' + v + '"</span>'; };
var N = function (v) { return '<span class="j-n">' + v + '</span>'; };
var P = function (v) { return '<span class="j-p">' + v + '</span>'; };
var K = function (v) { return '<span class="j-k">"' + v + '"</span>'; };
var PROMPTS = [
  {
    text: 'An ego car nears a signal on amber while SPaT messages freeze.',
    rows: [
      ['app', S('RLVW')],
      ['fault', P('{') + K('op') + P(': ') + S('freeze') + P(', ') + K('stream') + P(': ') + S('SPaT') + P('}')],
      ['anchor', S('amber_onset')],
      ['verifier', S('pass'), '<span class="j-ok">// feasible ✓</span>']
    ]
  },
  {
    text: 'A clear sunset rush hour at a large multi-lane signalized intersection in a hilly downtown. The ego turns left across a dense oncoming stream.',
    rows: [
      ['app', S('LTA'), '<span class="j-c">// inferred from the conflict</span>'],
      ['town', S('Town03')],
      ['agents', N('9')],
      ['channel', S('healthy'), '<span class="j-c">// no faults</span>']
    ]
  },
  {
    text: 'The SPaT feed freezes and stays stuck at red 5 seconds before the ego reaches the stop bar.',
    rows: [
      ['fault', P('{') + K('op') + P(': ') + S('freeze') + P(', ') + K('fields') + P(': [') + S('phase') + P(', ') + S('countdown') + P(']}')],
      ['anchor', S('ego_at_decision_point')],
      ['offset_s', N('-5')],
      ['window', S('open-ended')]
    ]
  }
];

function setupConsole() {
  var typed = document.getElementById('typed');
  var out = document.getElementById('compiled');
  var tabIn = document.getElementById('tab-in'), tabOut = document.getElementById('tab-out');
  if (!typed) return;

  function focusTab(onOut) {
    tabIn.classList.toggle('is-on', !onOut);
    tabOut.classList.toggle('is-on', onOut);
  }

  function renderOut(p) {
    var lines = [P('{')];
    p.rows.forEach(function (r, i) {
      lines.push('  ' + K(r[0]) + P(': ') + r[1] + (i < p.rows.length - 1 ? P(',') : '') + (r[2] ? '  ' + r[2] : ''));
    });
    lines.push(P('}'));
    out.innerHTML = '';
    lines.forEach(function (html, i) {
      var li = document.createElement('li');
      li.innerHTML = html;
      li.style.animationDelay = (i * 0.09) + 's';
      out.appendChild(li);
    });
    focusTab(true);
  }

  if (REDUCED) {
    typed.textContent = PROMPTS[0].text;
    renderOut(PROMPTS[0]);
    return;
  }

  var idx = 0;
  function run() {
    var p = PROMPTS[idx];
    var i = 0;
    out.innerHTML = '';
    typed.textContent = '';
    focusTab(false);
    (function type() {
      if (i <= p.text.length) {
        typed.textContent = p.text.slice(0, i++);
        setTimeout(type, 22 + Math.random() * 30);
      } else {
        setTimeout(function () { renderOut(p); }, 300);
        setTimeout(function () { idx = (idx + 1) % PROMPTS.length; run(); }, 5600);
      }
    })();
  }
  run();
}

function setupTabs() {
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('is-active', p.id === 'panel-' + tab.dataset.tab);
      });
    });
  });
}

function setupLightbox() {
  var box = document.getElementById('lightbox');
  var boxImg = box.querySelector('img');
  function open(src, alt) {
    if (typeof box.showModal !== 'function') { window.open(src, '_blank'); return; }
    boxImg.src = src;
    boxImg.alt = alt || '';
    box.showModal();
  }
  document.querySelectorAll('img.zoomable').forEach(function (img) {
    img.addEventListener('click', function () { open(img.src, img.alt); });
  });
  document.querySelectorAll('[data-zoom]').forEach(function (btn) {
    btn.addEventListener('click', function () { open(btn.dataset.zoom, 'Detailed LAST-V2X architecture'); });
  });
  box.addEventListener('click', function () { box.close(); });
}

function setupCopy() {
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = document.querySelector(btn.dataset.copy).textContent;
      var label = btn.querySelector('span');
      navigator.clipboard.writeText(text).then(function () {
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = 'Copy'; }, 1500);
      }).catch(function () {});
    });
  });
}

// Paired rollout replay of rlvw_late_freeze (keyframes read off the paper's refinement-case figure).
var CASES = {
  orig: {
    prompt: '“…<mark>Well after the ego has already stopped at the bar, the SPaT feed freezes for a few seconds.</mark> Stress-test the red-light violation warning.”',
    signal: [[0, 1, 'g'], [1, 4, 'y'], [4, 16, 'r'], [16, 18, 'g']],
    recv: [[0, 1.1, 'g'], [1.1, 4.1, 'y'], [4.1, 8.5, 'r'], [8.5, 11.5, 'r', 1], [11.5, 16.1, 'r'], [16.1, 18, 'g']],
    ego: [[0, -45], [2.5, -25.5], [18, -25.5]],
    twin: [[0, -50], [3, -29.2], [4, -27], [18, -27]],
    verdictAt: 17.6,
    verdict: 'Not admitted · neither violates',
    admitted: false
  },
  rev: {
    prompt: '“…<mark>The SPaT feed freezes and stays stuck at red 5 seconds before the ego reaches the stop bar.</mark>” <small>The compiled freeze holds the phase it captures, which is green.</small>',
    signal: [[0, 1, 'g'], [1, 4, 'y'], [4, 16, 'r'], [16, 18, 'g']],
    recv: [[0, 18, 'g', 1]],
    ego: [[0, -45], [3, -18.5], [6.4, -2.6], [9.3, -0.2], [10.6, 5], [12, 16.2], [15, 41], [18, 41]],
    twin: [[0, -50], [3, -25], [6.4, -4], [9.3, -3.5], [16, -3.5], [18, 3]],
    verdictAt: 9.35,
    verdict: 'Admitted · only the ego violates',
    admitted: true
  }
};
var T_END = 18;

function setupReplay() {
  var root = document.querySelector('.replay');
  if (!root) return;
  var ego = document.getElementById('ego');
  var twin = document.getElementById('twin');
  var flash = document.getElementById('flash');
  var lamps = { r: document.getElementById('lamp-r'), y: document.getElementById('lamp-y'), g: document.getElementById('lamp-g') };
  var recvLamp = document.getElementById('recv-lamp');
  var verdict = document.getElementById('verdict');
  var promptEl = document.getElementById('replay-prompt');
  var tlTrue = document.getElementById('tl-true');
  var tlRecv = document.getElementById('tl-recv');
  var head = document.getElementById('playhead');
  var scrub = document.getElementById('scrub');
  var playBtn = document.getElementById('play');
  var rT = document.getElementById('r-t'), rEgo = document.getElementById('r-ego'), rTwin = document.getElementById('r-twin');
  var COLORS = { g: '#3fb950', y: '#e3b341', r: '#e5534b' };

  var key = 'rev', t = 0, playing = !REDUCED, visible = false, last = null, hold = 0;

  function lerp(keys, x) {
    for (var i = 1; i < keys.length; i++) {
      if (x <= keys[i][0]) {
        var a = keys[i - 1], b = keys[i];
        var u = (x - a[0]) / (b[0] - a[0]);
        u = u * u * (3 - 2 * u);
        return a[1] + (b[1] - a[1]) * u;
      }
    }
    return keys[keys.length - 1][1];
  }
  function phaseAt(segs, x) {
    for (var i = 0; i < segs.length; i++) if (x < segs[i][1]) return segs[i][2];
    return segs[segs.length - 1][2];
  }
  function bars(el, segs) {
    el.innerHTML = '';
    segs.forEach(function (s) {
      var d = document.createElement('span');
      d.className = 'tl-seg ' + s[2] + (s[3] ? ' frozen' : '');
      d.style.width = ((s[1] - s[0]) / T_END * 100) + '%';
      el.appendChild(d);
    });
  }
  function xOf(d) { return 470 + d * 6.5 - 26; }
  function fmt(d) { return (d > 0 ? '+' : '') + d.toFixed(1); }

  function load(k) {
    key = k;
    var c = CASES[k];
    promptEl.innerHTML = c.prompt;
    bars(tlTrue, c.signal);
    bars(tlRecv, c.recv);
    root.querySelectorAll('.seg-btn').forEach(function (b) {
      var on = b.dataset.case === k;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    t = REDUCED && k === 'rev' ? 10.2 : 0;
    hold = 0;
    render();
  }

  function render() {
    var c = CASES[key];
    var de = lerp(c.ego, t), dt = lerp(c.twin, t);
    ego.setAttribute('transform', 'translate(' + xOf(de) + ' 0)');
    twin.setAttribute('transform', 'translate(' + xOf(dt) + ' 0)');
    var ph = phaseAt(c.signal, t);
    ['r', 'y', 'g'].forEach(function (p) { lamps[p].setAttribute('class', 'lamp' + (p === ph ? ' on-' + p : '')); });
    recvLamp.setAttribute('fill', COLORS[phaseAt(c.recv, t)]);
    var showFlash = c.admitted && t >= c.verdictAt && t < c.verdictAt + 3.2;
    flash.setAttribute('opacity', showFlash ? 1 : 0);
    if (t >= c.verdictAt) {
      verdict.textContent = c.verdict;
      verdict.className = 'verdict-chip ' + (c.admitted ? 'is-admitted' : 'is-clean');
    } else {
      verdict.textContent = 'Paired rollout running…';
      verdict.className = 'verdict-chip';
    }
    // Playhead over the timeline bars.
    var box = tlTrue.getBoundingClientRect(), parent = head.parentNode.getBoundingClientRect();
    head.style.left = (box.left - parent.left + box.width * (t / T_END) - 1) + 'px';
    scrub.value = t;
    rT.textContent = t.toFixed(1);
    rEgo.textContent = fmt(de);
    rTwin.textContent = fmt(dt);
  }

  function setPlayIcon() {
    playBtn.innerHTML = '<i class="fas fa-' + (playing ? 'pause' : 'play') + '"></i>';
  }

  function tick(ts) {
    if (last === null) last = ts;
    var dt = Math.min(0.1, (ts - last) / 1000);
    last = ts;
    if (playing && visible) {
      if (t >= T_END) {
        hold += dt;
        if (hold > 1.8) { t = 0; hold = 0; }
      } else {
        t = Math.min(T_END, t + dt);
      }
      render();
    }
    requestAnimationFrame(tick);
  }

  root.querySelectorAll('.seg-btn').forEach(function (b) {
    b.addEventListener('click', function () { load(b.dataset.case); });
  });
  playBtn.addEventListener('click', function () {
    playing = !playing;
    if (playing && t >= T_END) t = 0;
    setPlayIcon();
  });
  scrub.addEventListener('input', function () {
    t = parseFloat(scrub.value);
    hold = 0;
    render();
  });
  window.addEventListener('resize', render);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.3 }).observe(root);
  } else {
    visible = true;
  }

  setPlayIcon();
  load('rev');
  requestAnimationFrame(tick);
}
