/* ═══════════════════════════════════════════════════════════
   Presentation side of the phone remote
   R : pair this screen with a passphrase (the same one you type on the phone).
       It is remembered on this computer; leave it empty to unpair.
   The screen follows 'cmd' from the phone and reports its state back after every
   step, every play / pause, about once a second while a video plays, and every 4 s.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const H = window.HEUND;
  if (!H || !window.RemoteLink) return;
  const KEY = 'heund-remote-pass';
  const store = {
    get: () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
    set: (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) { /* private mode */ } },
  };

  // a small notice at the top of the screen, only when pairing
  const toast = (msg) => {
    let el = document.getElementById('remote-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'remote-toast';
      el.style.cssText = 'position:fixed;left:50%;top:18px;z-index:99999;transform:translateX(-50%);padding:10px 18px;'
        + 'border:3px solid #1c1a17;border-radius:12px;background:#ffd84a;box-shadow:5px 5px 0 rgba(28,26,23,.25);'
        + 'font:700 16px/1.3 "Pretendard Variable",system-ui,sans-serif;color:#1c1a17;transition:opacity .4s;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2600);
  };

  let link = null, beat = 0;
  const video = () => {
    const v = H.mainVideo();
    if (!v) return { has: false };
    return { has: true, paused: v.paused || v.ended, t: v.currentTime || 0, d: Number.isFinite(v.duration) ? v.duration : 0 };
  };
  const state = () => ({
    i: H.step, last: H.last, label: H.label(H.step), next: H.label(H.step + 1),
    video: video(),
    active: navigator.userActivation ? navigator.userActivation.hasBeenActive : true,   // sound needs one click / key on this screen
    at: Date.now(),
  });
  const send = () => { if (link) link.send('state', state()); };

  const onMessage = (event, p) => {
    if (event === 'hello') return send();
    if (event !== 'cmd') return;
    if (p.a === 'next') H.next();
    else if (p.a === 'prev') H.prev();
    else if (p.a === 'video') H.toggleVideo();
    setTimeout(send, 80);
  };

  async function pair(pass, announce) {
    clearInterval(beat);
    if (link) { link.close(); link = null; }
    if (!pass) { if (announce) toast('리모컨 연결 해제'); return; }
    try {
      link = await RemoteLink.connect(pass, onMessage, (s) => {
        if (s === 'online' || s === 'local') {
          send();
          if (announce) toast(s === 'local' ? '리모컨 연결됨 · 같은 브라우저 테스트 모드' : '리모컨 연결됨');
        } else if (s === 'error' && announce) toast('리모컨 연결 중… (네트워크 확인)');
      });
      beat = setInterval(send, 4000);
    } catch (e) {
      toast('리모컨을 연결할 수 없습니다');
    }
  }

  addEventListener('heund:step', send);
  const desk = document.getElementById('desk');
  ['play', 'pause', 'ended'].forEach((t) => desk.addEventListener(t, () => setTimeout(send, 30), true));
  let lastTick = 0;
  desk.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastTick > 1000) { lastTick = now; send(); }
  }, true);

  addEventListener('keydown', (e) => {
    if ((e.key !== 'r' && e.key !== 'R') || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const had = store.get();
    const typed = prompt('리모컨 비밀번호 (휴대폰에 입력할 것과 같은 비밀번호)\n비워 두면 연결을 해제합니다.', had ? '••••••' : '');
    if (typed === null) return;                    // cancelled
    const pass = typed === '••••••' ? had : typed.trim();
    store.set(pass);
    pair(pass, true);
  });

  const saved = store.get();
  if (saved) pair(saved, false);
})();
