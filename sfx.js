/* ═══════════════════════════════════════════════════════════
   HEUND OS sound — recorded samples played with Web Audio
     SFX.key(ch)  typewriter, once per typed character        ← os.js `type`
     SFX.click()  the on-screen cursor's click / press        ← os.js `burst`
     SFX.pop()    things that pop up like speech bubbles      ← os.js `open` / `show` on [data-pop]
     SFX.big()    bigger transitions: chapter changes, full screen, the end  ← os.js `wall` / `maximize`, talk.js ['sfx', 'big']
   M : mute / unmute (remembered on this computer).
   Browsers only start audio after one click or key press on the page, as with video sound.

   Files (assets/sfx):
     type.wav   Kenney · Interface Sounds · click_003 (CC0, LICENSE-kenney.txt)
     click.wav  Mixkit · Message pop alert #2354, trimmed (Mixkit Sound Effects Free License)
     big.wav    Mixkit · Page forward single chime #1107, trimmed (Mixkit Sound Effects Free License)
   Sources and licences: assets/sfx/CREDITS.txt
   A sound with no file stays silent.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const FILES = {
    key: 'assets/sfx/type.wav',
    click: 'assets/sfx/click.wav',
    pop: '',
    big: 'assets/sfx/big.wav',
  };
  const LEVEL = { key: 0.85, click: 0.8, pop: 0.7, big: 0.75 };

  const KEY = 'heund-sfx-muted';
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* private mode */ }

  // fetch the (tiny) files right away; decode once audio is allowed to start
  const raw = {};
  Object.entries(FILES).forEach(([name, url]) => {
    if (url) raw[name] = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
  });

  let ac = null, master = null;
  const buf = {};
  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 1;
    master.connect(ac.destination);
    Object.entries(raw).forEach(([name, p]) => p.then((ab) => ab && ac.decodeAudioData(ab.slice(0))).then((b) => { if (b) buf[name] = b; }).catch(() => {}));
  }
  const wake = () => { init(); if (ac && ac.state !== 'running') ac.resume().catch(() => {}); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) => addEventListener(t, wake, { capture: true, passive: true }));

  const rnd = (a, b) => a + Math.random() * (b - a);
  function play(name, { rate = 1, gain = 1 } = {}) {
    if (muted || !ac || ac.state !== 'running' || !buf[name]) return;
    const src = ac.createBufferSource();
    src.buffer = buf[name];
    src.playbackRate.value = rate;
    const g = ac.createGain();
    g.gain.value = gain * LEVEL[name];
    src.connect(g).connect(master);
    src.start();
  }

  // a slightly different strike every time; spaces softer and lower
  function key(ch) {
    if (ch === ' ' || ch === ' ') play('key', { rate: rnd(0.8, 0.86), gain: 0.5 });
    else play('key', { rate: rnd(0.92, 1.08), gain: rnd(0.8, 1) });
  }
  const click = () => play('click');
  const pop = () => play('pop', { rate: rnd(0.97, 1.03) });
  const big = () => play('big');

  addEventListener('keydown', (e) => {
    if ((e.key !== 'm' && e.key !== 'M') || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    muted = !muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e2) { /* private mode */ }
  });

  window.SFX = {
    key, click, pop, big,
    get muted() { return muted; },
    get state() { return ac ? ac.state : 'off'; },
    get loaded() { return Object.keys(buf); },
  };
})();
