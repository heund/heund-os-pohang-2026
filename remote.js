/* ═══════════════════════════════════════════════════════════
   Phone remote (remote.html)
   The passphrase picks the channel (remote-link.js); a wrong one simply never finds the screen.
   ◀ / ▶ step the talk, the middle button pauses / resumes the video on screen.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const $ = (id) => document.getElementById(id);
  const NOTES = window.TALK_NOTES || {};
  const KEY = 'heund-remote-phone';
  const store = {
    get: () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
    set: (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) { /* private mode */ } },
  };
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (t) => `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}`;
  // a short buzz on taps (Android); skipped where the browser doesn't allow it
  const buzz = () => { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.isActive)) navigator.vibrate(12); };

  let link = null, mode = '', lastSeen = 0, lastLabel = null, helloTimer = 0, watchTimer = 0, wake = null;

  const setStatus = (kind, text) => { const el = $('status'); el.className = `status ${kind}`; el.textContent = text; };

  function render(s) {
    $('cur').textContent = pad(s.i);
    $('last').textContent = pad(s.last);
    $('label').textContent = s.label || '—';
    const entry = NOTES[s.label] || {};
    $('desc').textContent = entry.desc || '';
    $('next').textContent = s.next || '끝';
    if (s.label !== lastLabel) {
      const notes = $('notes');
      notes.textContent = entry.note || '노트 없음';
      notes.classList.toggle('is-empty', !entry.note);
      notes.scrollTop = 0;
      lastLabel = s.label;
    }
    const v = s.video || {};
    const btn = $('b-video');
    btn.disabled = !v.has;
    $('v-icon').textContent = !v.has ? '▶' : v.paused ? '▶' : '❚❚';
    $('v-time').textContent = !v.has ? '영상 없음' : `${v.paused ? '재생' : '일시정지'} · ${mmss(v.t || 0)} / ${mmss(v.d || 0)}`;
    $('warn').hidden = s.active !== false;
  }

  const onMessage = (event, payload) => {
    if (event !== 'state') return;
    lastSeen = Date.now();
    render(payload);
    setStatus('on', mode === 'local' ? '화면 연결됨 · 테스트' : '화면 연결됨');
  };

  const onStatus = (s) => {
    if (s === 'online' || s === 'local') { if (!lastSeen) setStatus('wait', '화면 찾는 중…'); hello(); }
    else if (s === 'error' || s === 'offline') setStatus('off', '네트워크 재연결 중…');
    else if (s === 'connecting') setStatus('wait', '연결 중…');
  };

  const hello = () => { if (link) link.send('hello', {}); };

  async function start(pass) {
    $('gate').hidden = true;
    $('app').hidden = false;
    setStatus('wait', '연결 중…');
    try {
      link = await RemoteLink.connect(pass, onMessage, onStatus);
      mode = link.mode;
    } catch (e) {
      setStatus('off', '연결할 수 없음 · 네트워크 확인');
      return;
    }
    // keep asking until the screen answers; afterwards the screen reports every few seconds
    clearInterval(helloTimer);
    helloTimer = setInterval(() => { if (Date.now() - lastSeen > 6000) hello(); }, 2500);
    clearInterval(watchTimer);
    watchTimer = setInterval(() => {
      if (!lastSeen) {
        setStatus('wait', '화면 찾는 중…');
        $('desc').textContent = '노트북의 발표 화면에서 R을 눌러 같은 비밀번호를 입력하세요.';
      } else if (Date.now() - lastSeen > 10000) setStatus('off', '화면 응답 없음');
    }, 2000);
    keepAwake();
  }

  function stop() {
    clearInterval(helloTimer); clearInterval(watchTimer);
    if (link) link.close();
    link = null; lastSeen = 0; lastLabel = null;
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }

  async function keepAwake() {
    try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wake = await navigator.wakeLock.request('screen'); } catch (e) { /* not available */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && link) { keepAwake(); hello(); }
  });

  const press = (id, action) => {
    const b = $(id);
    b.addEventListener('click', () => {
      if (b.disabled || !link) return;
      link.send('cmd', { a: action });
      buzz();
      b.classList.add('is-pressed');
      setTimeout(() => b.classList.remove('is-pressed'), 140);
    });
  };
  press('b-prev', 'prev');
  press('b-next', 'next');
  press('b-video', 'video');

  $('b-lock').addEventListener('click', () => {
    stop();
    store.set('');
    $('pass').value = '';
    $('app').hidden = true;
    $('gate').hidden = false;
  });

  /* ── stopwatch: ▶ start / ❚❚ stop, ↺ reset (only while stopped). Stored on this phone. ── */
  const TKEY = 'heund-remote-timer';
  const timer = (() => {
    let s = { run: false, start: 0, acc: 0 };
    try { s = { ...s, ...JSON.parse(localStorage.getItem(TKEY) || '{}') }; } catch (e) { /* fresh */ }
    const save = () => { try { localStorage.setItem(TKEY, JSON.stringify(s)); } catch (e) { /* private mode */ } };
    const elapsed = () => s.acc + (s.run ? Date.now() - s.start : 0);
    const fmt = (ms) => {
      const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
      return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
    };
    const draw = () => {
      $('t-toggle').textContent = `${s.run ? '❚❚' : '▶'} ${fmt(elapsed())}`;
      $('timer').classList.toggle('is-running', s.run);
      $('t-reset').disabled = s.run || elapsed() === 0;
    };
    $('t-toggle').addEventListener('click', () => {
      if (s.run) { s.acc = elapsed(); s.run = false; } else { s.start = Date.now(); s.run = true; }
      save(); draw();
      buzz();
    });
    $('t-reset').addEventListener('click', () => { if (s.run) return; s = { run: false, start: 0, acc: 0 }; save(); draw(); });
    setInterval(() => { if (s.run) draw(); }, 250);
    draw();
    return { draw };
  })();

  $('gate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = $('pass').value.trim();
    if (!pass) return;
    store.set($('keep').checked ? pass : '');
    start(pass);
  });

  const saved = store.get();
  if (saved) start(saved);
})();
