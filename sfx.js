/* ═══════════════════════════════════════════════════════════
   HEUND OS sound — typewriter keys and mouse clicks, synthesised with Web Audio (no audio files)
     SFX.key(ch)   one typewriter strike (space: a duller thunk)      ← the `type` action, per character
     SFX.click()   a mouse click (press + release)                    ← every cursor click / double-click / press
   M : mute / unmute (remembered on this computer)
   Browsers only start audio after a click or key press on the page, as with video sound.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const KEY = 'heund-sfx-muted';
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* private mode */ }

  let ac = null, master = null, noise = null;
  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.8;
    master.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);          // 1 s of white noise, shared by every sound
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const wake = () => { init(); if (ac && ac.state !== 'running') ac.resume().catch(() => {}); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) => addEventListener(t, wake, { capture: true, passive: true }));
  const ready = () => !muted && ac && ac.state === 'running';
  const rnd = (a, b) => a + Math.random() * (b - a);

  // a short burst of filtered noise
  function hiss(t, { type = 'bandpass', freq = 2500, q = 1, gain = 0.3, attack = 0.001, decay = 0.04 }) {
    const src = ac.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = rnd(0.9, 1.1);
    const f = ac.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    src.connect(f).connect(g).connect(master);
    src.start(t, rnd(0, 0.5));
    src.stop(t + attack + decay + 0.02);
  }
  // a short pitched body that drops as it fades
  function tone(t, { freq = 150, type = 'triangle', gain = 0.2, decay = 0.05, drop = 0.6 }) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * drop, t + decay);
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + decay + 0.02);
  }

  // typewriter strike: a metal tick, the key's clack and the platen's thock, a little different each time
  function key(ch) {
    if (!ready()) return;
    const t = ac.currentTime + 0.003;
    if (ch === ' ' || ch === ' ') {
      hiss(t, { freq: rnd(900, 1200), q: 0.8, gain: 0.14, decay: 0.05 });
      tone(t, { freq: rnd(95, 115), gain: 0.16, decay: 0.07 });
      return;
    }
    hiss(t, { type: 'highpass', freq: rnd(5500, 7000), q: 0.7, gain: rnd(0.08, 0.12), decay: 0.012 });
    hiss(t, { freq: rnd(1800, 3000), q: rnd(1.2, 2), gain: rnd(0.22, 0.3), decay: rnd(0.03, 0.045) });
    tone(t + 0.002, { freq: rnd(140, 190), gain: rnd(0.12, 0.17), decay: 0.045 });
  }

  // mouse click: press, then a lighter release
  function click() {
    if (!ready()) return;
    const t = ac.currentTime + 0.003;
    hiss(t, { freq: rnd(3200, 4200), q: 2.5, gain: 0.55, decay: 0.012 });
    tone(t, { freq: rnd(1700, 2100), type: 'square', gain: 0.06, decay: 0.01, drop: 0.9 });
    hiss(t + 0.055, { freq: rnd(2600, 3400), q: 2.5, gain: 0.3, decay: 0.01 });
  }

  addEventListener('keydown', (e) => {
    if ((e.key !== 'm' && e.key !== 'M') || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    muted = !muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e2) { /* private mode */ }
  });

  window.SFX = { key, click, get muted() { return muted; }, get state() { return ac ? ac.state : 'off'; } };
})();
