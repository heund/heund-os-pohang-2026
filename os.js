/* ═══════════════════════════════════════════════════════════
   HEUND OS — presentation engine
   → / Space / PageDown / click : next     ← / PageUp / right-click : back
   Home / End : first / last       F : fullscreen     H : hide progress
   URL #5 : jump to step 5
   ═══════════════════════════════════════════════════════════ */
(() => {
  const W = 1920, H = 1080, MENU = 56, TASK = 64;
  const TYPE_MS = 55;
  const TALK = window.TALK || [];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const viewport = $('#viewport');
  const stage = $('#stage');
  const camera = $('#camera');
  const desk = $('#desk');
  const cursorEl = $('#cursor');
  const boot = $('#boot');

  /* ─────────────── pixel art ─────────────── */

  const PAL = { k: '#1c1a17', w: '#ffffff', o: '#2b8fd6', b: '#74c7f2', y: '#ffd84a' };
  const PIXELS = {
    sparkle: [
      '....o....',
      '....o....',
      '...obo...',
      '..obwbo..',
      'oobwwwboo',
      '..obwbo..',
      '...obo...',
      '....o....',
      '....o....',
    ],
    warning: [
      '......k......',
      '.....kyk.....',
      '.....kyk.....',
      '....kyyyk....',
      '....kykyk....',
      '...kyykyyk...',
      '...kyykyyk...',
      '..kyyykyyyk..',
      '..kyyyyyyyk..',
      '.kyyyykyyyyk.',
      '.kyyyyyyyyyk.',
      'kkkkkkkkkkkkk',
    ],
    cursor: [
      'k...........',
      'kk..........',
      'kwk.........',
      'kwwk........',
      'kwwwk.......',
      'kwwwwk......',
      'kwwwwwk.....',
      'kwwwwwwk....',
      'kwwwwwwwk...',
      'kwwwwwwwwk..',
      'kwwwwwwwwwk.',
      'kwwwwwwkkkkk',
      'kwwwkwwk....',
      'kwwk.kwwk...',
      'kwk..kwwk...',
      'kk....kwwk..',
      'k.....kwwk..',
      '.......kk...',
    ],
  };
  function pixel(name, size) {
    const map = PIXELS[name];
    const h = map.length, w = map[0].length;
    let rects = '';
    map.forEach((row, y) => [...row].forEach((c, x) => {
      if (PAL[c]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[c]}"/>`;
    }));
    return `<svg viewBox="0 0 ${w} ${h}" width="${w * size}" height="${h * size}" shape-rendering="crispEdges">${rects}</svg>`;
  }

  /* ─────────────── one-time DOM prep (before snapshot) ─────────────── */

  $$('[data-px]').forEach((el) => { el.innerHTML = pixel(el.dataset.px, +el.dataset.size || 4); });
  cursorEl.innerHTML = pixel('cursor', 4);

  $$('.win').forEach((w) => {
    w.insertAdjacentHTML('afterbegin',
      `<div class="win-bar"><i class="win-x"></i><span class="win-title">${w.dataset.title}</span>` +
      `<span class="win-lines"></span><span class="win-btns"><i class="b-min"></i><i class="b-max"></i></span></div>`);
  });
  $$('.cw').forEach((w) => {
    w.insertAdjacentHTML('afterbegin', '<div class="cw-bar"><i class="win-x"></i><span class="win-lines"></span></div>');
  });

  // split typewriter text into per-character spans (revealed one by one by the `type` action)
  $$('[data-type]').forEach((root) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const c of n.textContent) {
            if (c === '\n') continue;
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            frag.appendChild(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(root);
    root.insertAdjacentHTML('beforeend', '<span class="caret"></span>');
  });

  // relation map: draw cables between nodes and CV chips from data-edges
  //   "a>b"  node → chip cable      "a|b"  chip → chip timeline      trailing "*" = revealed later
  $$('[data-edges]').forEach((map) => {
    const svg = $('.map-svg', map);
    const NS = 'http://www.w3.org/2000/svg';
    const box = (id) => {
      const e = $(`#${id}`, map);
      return { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight, left: e.offsetLeft + e.offsetWidth / 2 < map.offsetWidth / 2 };
    };
    const specs = map.dataset.edges.trim().split(/\s+/).map((s) => {
      const late = s.endsWith('*');
      const tl = s.includes('|');
      const [a, b] = s.replace('*', '').split(/[>|]/);
      return { a, b, tl, late };
    });
    // spread several cables arriving at the same side of a box
    const slots = {};
    specs.filter((s) => !s.tl).forEach((s) => {
      const side = box(s.a).left ? 'L' : 'R';
      s.ka = `${s.a}`; s.kb = `${s.b}:${side}`;
      (slots[s.ka] ||= []).push(s);
      (slots[s.kb] ||= []).push(s);
    });
    // order each bundle by where the other end sits, so cables don't cross at the port
    Object.entries(slots).forEach(([key, list]) => {
      const other = (s) => box(key === s.ka ? s.b : s.a);
      list.sort((p, q) => other(p).y - other(q).y);
    });
    const spread = (key, s) => { const l = slots[key]; return (l.indexOf(s) - (l.length - 1) / 2) * 18; };
    const add = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      svg.appendChild(el);
      return el;
    };
    let k = 0;
    specs.forEach((s) => {
      const A = box(s.a), B = box(s.b);
      let d, end;
      if (s.tl) {
        const x = A.x + A.w / 2;
        d = `M${x} ${A.y + A.h} L${x} ${B.y}`;
      } else {
        const x1 = A.left ? A.x + A.w : A.x, y1 = A.y + A.h / 2 + spread(s.ka, s);
        const x2 = A.left ? B.x : B.x + B.w, y2 = B.y + B.h / 2 + spread(s.kb, s);
        const dx = (x2 - x1) * .55;
        d = `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        end = [x2, y2];
      }
      const cls = `edge${s.tl ? ' tl' : ''}${s.late ? ' late' : ''}`;
      const p = add('path', { d, class: cls, 'data-a': s.a, 'data-b': s.b });
      const idx = s.tl ? specs.filter((t) => t.tl).indexOf(s) : k++;
      p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 2);
      p.style.setProperty('--k', idx);
      if (end) {
        const c = add('circle', { cx: end[0], cy: end[1], r: 7, class: `port${s.late ? ' late' : ''}`, 'data-a': s.a, 'data-b': s.b });
        c.style.setProperty('--k', idx);
      }
    });
    // keep cables under the cards
    map.prepend(svg);
  });

  // 포항 지도: map.js (OpenStreetMap) + window.PLACES (위도/경도) in talk.js.
  // each .pmap starts on the whole city, then zooms to its place (data-zoom), and the pins drop in.
  const PLACES = window.PLACES || {};
  const MAPS = { pohang: window.POHANG_MAP, jeju: window.JEJU_MAP };
  const MW = 600, MH = 560;
  $$('.pmap').forEach((pm) => {
    const MAP = MAPS[pm.dataset.map || 'pohang'];
    if (!MAP) return;
    const geo = (p) => ({ x: (p.lon - MAP.proj.lon0) * MAP.proj.kx, y: (MAP.proj.lat1 - p.lat) * MAP.proj.ky });
    const PX_PER_M = MAP.proj.ky / 110574;
    const on = (pm.dataset.pins || '').split(/\s+/).filter((id) => PLACES[id]);
    const pts = on.map((id) => geo(PLACES[id]));
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const z = +pm.dataset.zoom || Math.min(4, (MW * .62) / Math.max(bw, 1), (MH * .62) / Math.max(bh, 1));
    const tx = Math.min(0, Math.max(MW - MW * z, MW / 2 - cx * z));
    const ty = Math.min(0, Math.max(MH - MH * z, MH / 2 - cy * z));
    const scr = (p) => ({ x: p.x * z + tx, y: p.y * z + ty });
    pm.style.setProperty('--zs', z);
    pm.style.setProperty('--zt', `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${z.toFixed(3)})`);

    let html = `<div class="pmap-layer"><svg viewBox="0 0 ${MW} ${MH}">${MAP.svg}</svg></div><div class="pmap-over">`;
    if (pm.dataset.net) {
      const d = on.map((id, i) => { const s = scr(geo(PLACES[id])); return `${i ? 'L' : 'M'}${s.x.toFixed(1)} ${(s.y - 20).toFixed(1)}`; }).join(' ') + ' Z';
      html += `<svg class="pmap-net" viewBox="0 0 ${MW} ${MH}"><path class="net" d="${d}"/></svg>`;
    }
    Object.entries(PLACES).forEach(([id, p]) => {
      const s = scr(geo(p));
      if (s.x < -20 || s.x > MW + 20 || s.y < -20 || s.y > MH + 20) return;
      const k = on.indexOf(id);
      html += k < 0
        ? `<span class="pin off" style="left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px"><i class="pin-mk"></i></span>`
        : `<span class="pin side-${p.side || 'r'}" style="left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;--c:${p.c};--k:${k}"><i class="pin-mk"></i><b class="pin-lb">${p.label}</b></span>`;
    });
    // scale bar: 500 m, or 1 km when zoomed out
    // scale bar: the round distance that draws closest to ~110 px
    const m = [100, 200, 500, 1000, 2000, 5000, 10000].reduce((a, b) => (Math.abs(b * PX_PER_M * z - 110) < Math.abs(a * PX_PER_M * z - 110) ? b : a));
    html += `<span class="pmap-scale" style="--w:${(m * PX_PER_M * z).toFixed(1)}px"><i></i>${m >= 1000 ? m / 1000 + ' km' : m + ' m'}</span>`;
    html += `<span class="pmap-north">N</span></div>`;
    pm.innerHTML = html;
    if (pm.dataset.river) pm.classList.add('hl-river');
    pm.classList.toggle('z-hi', z >= 3);
    pm.classList.toggle('has-river', on.includes('river'));
  });

  /* globe: 포항 지도에서 지구로 줌아웃 (canvas). data: globe.js, places: talk.js */
  const GD = window.GLOBE_DATA, GP = window.GLOBE_PLACES || [], GV = window.GLOBE_VIEW || { lat: 30, lon: 96, r: 380 };
  const RAD = Math.PI / 180;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const easeIO = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const PM = window.POHANG_MAP, PW = window.POHANG_WIDE;
  const PH = PM ? { lon: PM.proj.lon0 + 300 / PM.proj.kx, lat: PM.proj.lat1 - 280 / PM.proj.ky } : { lon: 129.36, lat: 36.02 };
  const MAP_PX_PER_KM = PM ? PM.proj.ky / 110.574 : 47.6;
  const M0 = 2.9;                                    // map scale at the start (fills the window)
  const R0 = 6371 * MAP_PX_PER_KM * M0;              // matching globe radius
  const ortho = (l0, p0) => {
    const sp0 = Math.sin(p0 * RAD), cp0 = Math.cos(p0 * RAD);
    return (lon, lat) => {
      const l = (lon - l0) * RAD, p = lat * RAD, cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
      return [cp * Math.sin(l), -(cp0 * sp - sp0 * cp * cl), sp0 * sp + cp0 * cp * cl];
    };
  };
  const toVec = (lon, lat) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  const toLL = (v) => [Math.atan2(v[1], v[0]) / RAD, Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD];
  function globeView(el, t) {
    const W = el.offsetWidth, H = el.offsetHeight;
    const e = easeIO(clamp01(t));
    const R = Math.exp(Math.log(R0) + (Math.log(GV.r) - Math.log(R0)) * e);
    const k = easeIO(clamp01((t - .35) / .65));
    const l0 = PH.lon + (GV.lon - PH.lon) * k, p0 = PH.lat + (GV.lat - PH.lat) * k;
    const cx = W / 2 + (W * .62 - W / 2) * k, cy = H / 2 + 14 * k;
    const pr = ortho(l0, p0);
    const at = (lon, lat, lift = 0) => { const q = pr(lon, lat); return [cx + R * q[0] * (1 + lift), cy + R * q[1] * (1 + lift), q[2]]; };
    return { W, H, R, l0, p0, cx, cy, at };
  }
  function globeDraw(el, t, u) {
    const cv = $('.globe-cv', el), ctx = cv.getContext('2d');
    const v = globeView(el, t);
    const { W, H, R, cx, cy, at } = v;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const big = R > 3 * Math.hypot(W, H);
    // sea disc
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#a9daf2';
    if (big) ctx.fillRect(0, 0, W, H); else { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    // East Asia land (filled) while zoomed in, fading into the dotted globe
    const a1 = clamp01((Math.log(R) - Math.log(2000)) / (Math.log(6000) - Math.log(2000)));
    if (a1 > 0 && GD) {
      ctx.globalAlpha = a1;
      ctx.beginPath();
      GD.coast.forEach((ring) => {
        let pen = false;
        for (let i = 0; i < ring.length; i += 2) {
          const q = at(ring[i], ring[i + 1]);
          if (q[2] <= 0) { pen = false; continue; }
          if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
          pen = true;
        }
        ctx.closePath();
      });
      ctx.fillStyle = '#f7efd9'; ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = '#1c1a17'; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // land dots
    const a2 = 1 - a1;
    if (a2 > 0 && GD) {
      const ds = Math.max(1.6, Math.min(4, R * .0088));
      ctx.fillStyle = '#1c1a17';
      const d = GD.dots;
      for (let i = 0; i < d.length; i += 2) {
        const q = at(d[i], d[i + 1]);
        if (q[2] <= .02 || q[0] < -10 || q[0] > W + 10 || q[1] < -10 || q[1] > H + 10) continue;
        ctx.globalAlpha = a2 * (.3 + .7 * q[2]);
        ctx.fillRect(q[0] - ds / 2, q[1] - ds / 2, ds, ds);
      }
    }
    // globe outline
    if (!big) {
      ctx.globalAlpha = clamp01((3000 - R) / 2000);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = '#1c1a17'; ctx.stroke();
    }
    // arcs from 포항 (u: 0 → 1)
    if (u > 0 && GP.length) {
      const a = toVec(GP[0].lon, GP[0].lat);
      GP.slice(1).forEach((g) => {
        const b = toVec(g.lon, g.lat);
        const om = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
        const lift = .22 * Math.min(1, om / .9) + .02;
        ctx.globalAlpha = 1; ctx.beginPath();
        const n = 64, m = Math.max(1, Math.round(n * u));
        for (let i = 0; i <= m; i++) {
          const s2 = i / n, f1 = Math.sin((1 - s2) * om) / Math.sin(om), f2 = Math.sin(s2 * om) / Math.sin(om);
          const ll = toLL([a[0] * f1 + b[0] * f2, a[1] * f1 + b[1] * f2, a[2] * f1 + b[2] * f2]);
          const q = at(ll[0], ll[1], lift * Math.sin(Math.PI * s2));
          if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
        }
        ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#f6735f'; ctx.stroke();
      });
    }
    // 포항 maps riding on the globe: the city map on top, the ~40 km map under it, each fading as it shrinks
    const ride = (layer, M, sc, alpha) => {
      const c = { lon: M.proj.lon0 + 300 / M.proj.kx, lat: M.proj.lat1 - 280 / M.proj.ky }, p = at(c.lon, c.lat);
      layer.style.transform = 'translate(' + (p[0] - 300 * sc).toFixed(1) + 'px, ' + (p[1] - 280 * sc).toFixed(1) + 'px) scale(' + sc.toFixed(5) + ')';
      layer.style.setProperty('--zs', sc);
      layer.style.opacity = alpha;
    };
    const sc = M0 * R / R0;
    ride($('.globe-map', el), PM, sc, clamp01((600 * sc - 200) / 260));
    if (PW) {
      const sw = (R / 6371) / (PW.proj.ky / 110.574);
      ride($('.globe-wide', el), PW, sw, clamp01((600 * sw - 60) / 220));
    }
    // live readout
    const km = W / (R / 6371);
    $('.globe-span', el).textContent = '↔ ' + (km < 100 ? km.toFixed(1) : Math.round(km).toLocaleString('en-US')) + ' km';
    $('.globe-coord', el).textContent = v.p0.toFixed(2) + '°N · ' + v.l0.toFixed(2) + '°E';
  }
  $$('.globe-body').forEach((el) => {
    const W = el.offsetWidth, H = el.offsetHeight, cv = $('.globe-cv', el);
    cv.width = W * 2; cv.height = H * 2;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    if (PM) $('.globe-map', el).innerHTML = '<svg viewBox="0 0 600 560">' + PM.svg + '</svg>';
    if (PW) $('.globe-wide', el).innerHTML = '<svg viewBox="0 0 600 560">' + PW.svg + '</svg>';
    globeDraw(el, 0, 0);   // layers start in their first-frame position (kept in the snapshot)
    const fin = globeView(el, 1);
    $('.globe-tags', el).innerHTML = GP.map((g, i) => {
      const q = fin.at(g.lon, g.lat);
      return '<span class="gtag side-' + (g.side || 'r') + '" style="left:' + q[0].toFixed(1) + 'px;top:' + q[1].toFixed(1) + 'px;--c:' + g.c + ';--k:' + i + '">' +
        '<i></i><b>' + g.label + (g.sub ? '<small>' + g.sub + '</small>' : '') + '</b></span>';
    }).join('');
  });

  /* geo maps (encmap.js): viewBox-animated so strokes stay crisp at any zoom.
     views are { lon, lat, km } = centre and width across the container */
  const GMAPS = { enc: window.ENC_MAP };
  const EP = window.ENC_PLACES || [], EV = window.ENC_VIEWS || {}, EN = window.ENC_NODES || [];
  const ENC_COL = { boundary: 'var(--blue)', civic: 'var(--coral)', community: 'var(--yellow)', venue: 'var(--green)' };
  const ENC_TYPE = { boundary: '사방위', civic: '공공기관', community: '공동체', venue: '비엔날레 베뉴' };
  function gmapView(el, v) {
    const M = GMAPS[el.dataset.gmap];
    if (!M || !v) return;
    const cw = el.clientWidth || 1, ch = el.clientHeight || 1;
    const perKm = M.proj.ky / 110.574;
    const w = v.km * perKm, h = w * ch / cw;
    const x0 = (v.lon - M.proj.lon0) * M.proj.kx - w / 2, y0 = (M.proj.lat1 - v.lat) * M.proj.ky - h / 2;
    $('svg', el).setAttribute('viewBox', `${x0.toFixed(2)} ${y0.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    const sc = cw / w;
    $$('.gpin, .gcallout', el).forEach((pin) => {
      const x = (+pin.dataset.lon - M.proj.lon0) * M.proj.kx, y = (M.proj.lat1 - +pin.dataset.lat) * M.proj.ky;
      pin.style.left = `${((x - x0) * sc).toFixed(1)}px`;
      pin.style.top = `${((y - y0) * sc).toFixed(1)}px`;
    });
    el.style.setProperty('--detail', clamp01((sc * perKm - 160) / 200).toFixed(3));   // fades in with px per km
    const m = [100, 200, 500, 1000, 2000, 5000].reduce((a, b) => (Math.abs(b * perKm / 1000 * sc - 110) < Math.abs(a * perKm / 1000 * sc - 110) ? b : a));
    const bar = $('.gscale', el);
    if (bar) { $('i', bar).style.width = `${(m * perKm / 1000 * sc).toFixed(1)}px`; $('em', bar).textContent = m >= 1000 ? `${m / 1000} km` : `${m} m`; }
    el.dataset.cur = `${v.lon},${v.lat},${v.km}`;
  }
  $$('.gmap').forEach((el) => {
    const M = GMAPS[el.dataset.gmap];
    if (!M) return;
    let html = `<svg preserveAspectRatio="none" viewBox="0 0 ${M.w} ${M.h}">${M.svg}</svg><div class="gpins">`;
    EP.forEach((q, k) => { html += `<span class="gpin" data-n="${q.n}" data-lat="${q.lat}" data-lon="${q.lon}" style="--c:${ENC_COL[q.type]};--k:${k}">${q.n}</span>`; });
    (window.ENC_CALLOUTS || []).forEach((c) => { html += `<span class="gcallout ${c.cls || ''}" data-lat="${c.lat}" data-lon="${c.lon}">${c.text}</span>`; });
    html += `</div><span class="gscale"><i></i><em></em></span>`;
    el.innerHTML = html;
    el.dataset.viewNow = el.dataset.view;
    gmapView(el, EV[el.dataset.view]);
  });
  const encList = $('#enc-list');
  if (encList) {
    encList.innerHTML = EP.map((q, k) => `<div class="enc-row${q.far ? ' far' : ''}" style="--k:${k};--c:${ENC_COL[q.type]}"><i>${q.n}</i><b>${q.ko}</b><small>${q.bon}</small></div>`).join('') +
      `<div class="enc-legend">${Object.keys(ENC_TYPE).map((t) => `<span style="--c:${ENC_COL[t]}"><i></i>${ENC_TYPE[t]}</span>`).join('')}</div>`;
  }
  const appSteps = $('#app-steps');
  if (appSteps) {
    appSteps.innerHTML = EN.map((d) => { const q = EP.find((x) => x.n === d.n) || {};
      return `<li data-n="${d.n}"><i style="--c:${ENC_COL[q.type]}">${d.n}</i>${q.ko || ''}<em>${d.lang === 'en' ? 'EN' : 'KR'}</em></li>`; }).join('');
  }
  // system phone: nodes-montage.mp4 = 4 s of each ENC_NODES clip, in the same order (1 → 14).
  // the node pins + place + 본풀이 follow whichever encounter is on screen.
  const MONTAGE_SEG = 4;
  function sysNow(root, k) {
    const ol = $('#sys-nodes', root), now = $('.sys-now', root);
    if (!ol || !now || ol.dataset.k === String(k)) return;
    ol.dataset.k = k;
    $$('li', ol).forEach((li, j) => li.classList.toggle('is-now', j === k));
    const q = EP.find((x) => x.n === EN[k].n) || {};
    now.innerHTML = `<b>${q.ko || ''}</b><span>${q.bon || ''}</span>`;
    now.classList.remove('swap'); void now.offsetWidth; now.classList.add('swap');
  }
  const sysNodes = $('#sys-nodes');
  if (sysNodes && EN.length) {
    sysNodes.innerHTML = EN.map((d) => { const q = EP.find((x) => x.n === d.n) || {}; return `<li style="--c:${ENC_COL[q.type]}">${d.n}</li>`; }).join('');
    sysNow(desk, 0);
    $('.sys-now', desk).classList.remove('swap');
  }

  const INITIAL = desk.innerHTML;

  /* ─────────────── stage fit ─────────────── */

  let scale = 1;
  function fit() {
    scale = Math.min(innerWidth / W, innerHeight / H);
    const x = (innerWidth - W * scale) / 2, y = (innerHeight - H * scale) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }
  addEventListener('resize', fit);
  fit();

  // stage-space rect of an element (accounts for stage scale, camera & window transforms)
  function stageRect(el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: (r.left - s.left) / scale, y: (r.top - s.top) / scale, w: r.width / scale, h: r.height / scale };
  }

  /* ─────────────── state ─────────────── */

  let cam = { x: 0, y: 0, s: 1 };
  let cur = { x: 1500, y: 880 };
  let openOrder = [];
  let focused = null;
  let z = 10;
  let current = -1;
  let busy = false;
  let token = 0;

  const win = (id) => $(`[data-win="${id}"]`, desk);

  function setCam(c) {
    cam = c;
    camera.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.s})`;
  }
  function deskRect(el) {
    const r = stageRect(el);
    return { x: (r.x - cam.x) / cam.s, y: (r.y - cam.y) / cam.s, w: r.w / cam.s, h: r.h / cam.s };
  }

  function moveCursor(p, ms) {
    cursorEl.style.transitionDuration = `${ms}ms, .25s`;
    cursorEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
    cursorEl.classList.add('is-visible');
    void cursorEl.offsetWidth;
    cur = p;
  }

  function burst() {
    if (window.SFX) SFX.click();                       // sfx.js: mouse click sound
    const b = document.createElement('span');
    b.className = 'burst';
    b.style.left = `${cur.x + 2}px`;
    b.style.top = `${cur.y + 2}px`;
    b.innerHTML = Array.from({ length: 8 }, (_, k) => `<i style="--a:${k * 45}deg"></i>`).join('');
    stage.appendChild(b);
    setTimeout(() => b.remove(), 500);
  }

  function focus(id) {
    $$('.win.is-focused', desk).forEach((w) => w.classList.remove('is-focused'));
    focused = id || null;
    if (!id) return;
    const w = win(id);
    w.style.zIndex = w.dataset.z || ++z;
    w.classList.add('is-focused');
  }

  function renderTabs() {
    $('#tabs').innerHTML = openOrder.map((id) => {
      const w = win(id);
      return `<span class="tab${id === focused ? ' is-focused' : ''}" style="--wc:${w.style.getPropertyValue('--wc')}">` +
        `<i></i>${w.dataset.title}<b>×</b></span>`;
    }).join('');
  }

  function tween(el, to, ms, t) {
    const from = el.scrollTop, t0 = performance.now();
    const ease = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    return new Promise((res) => {
      const step = (now) => {
        if (t !== token) return res();
        const k = Math.min(1, (now - t0) / ms);
        el.scrollTop = from + (to - from) * ease(k);
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }

  /* ─────────────── actions ─────────────── */

  const later = (ctx, ms) => (ctx.instant ? null : sleep(ms));

  const A = {
    wait: (ctx, ms) => later(ctx, ms),

    add: (ctx, sel, cls) => { $$(sel, stage).forEach((e) => e.classList.add(cls)); },
    remove: (ctx, sel, cls) => { $$(sel, stage).forEach((e) => e.classList.remove(cls)); },
    show: (ctx, sel) => { $$(sel, stage).forEach((e) => e.classList.add('is-shown')); return later(ctx, 400); },
    hide: (ctx, sel) => { $$(sel, stage).forEach((e) => e.classList.remove('is-shown')); },
    wall: (ctx, name) => { stage.dataset.wall = name; },

    open(ctx, id, opts = {}) {
      const w = win(id);
      if (opts.from && !ctx.instant) {
        const r = deskRect($(opts.from, desk));
        const ox = r.x + r.w / 2 - parseFloat(w.style.left);
        const oy = r.y + r.h / 2 - parseFloat(w.style.top);
        w.style.transformOrigin = `${ox}px ${oy}px`;
      }
      w.classList.add('is-open');
      if (!openOrder.includes(id)) openOrder.push(id);
      focus(id);
      renderTabs();
      return later(ctx, 600);
    },
    // opts.fade (ms): fade the window out where it stands instead of the quick shrink;
    // its videos keep running until it is gone
    close(ctx, id, opts = {}) {
      const w = win(id);
      const fade = !ctx.instant && opts.fade && w.classList.contains('is-open') ? opts.fade : 0;
      if (fade) {
        w.style.transition = `opacity ${fade}ms ease-in-out, visibility 0s linear ${fade}ms`;
        w.style.transform = 'none';
        setTimeout(() => {
          w.style.transition = ''; w.style.transform = '';
          if (!w.classList.contains('is-open')) $$('video', w).forEach((v) => v.pause());
        }, fade + 60);
      } else {
        $$('video', w).forEach((v) => v.pause());
      }
      if (w.classList.contains('is-full')) stage.classList.remove('fs');
      w.classList.remove('is-open', 'is-focused');
      openOrder = openOrder.filter((x) => x !== id);
      if (focused === id) focus(openOrder[openOrder.length - 1]);
      renderTabs();
      return later(ctx, fade || 250);
    },
    closeAll(ctx) {
      $$('video', desk).forEach((v) => v.pause());
      stage.classList.remove('fs');
      $$('.win.is-open', desk).forEach((w) => w.classList.remove('is-open', 'is-focused'));
      openOrder = [];
      focus(null);
      renderTabs();
      return later(ctx, 350);
    },
    focus(ctx, id) { focus(id); renderTabs(); },
    place(ctx, id, r) {
      const w = win(id);
      if (r.x != null) w.style.left = `${r.x}px`;
      if (r.y != null) w.style.top = `${r.y}px`;
      if (r.w != null) w.style.width = `${r.w}px`;
      if (r.h != null) w.style.height = `${r.h}px`;
      return later(ctx, 800);
    },

    cursor(ctx, target, opts = {}) {
      let p = target;
      if (typeof target === 'string') {
        const r = stageRect($(target, stage));
        p = { x: r.x + r.w * (opts.ax ?? .5), y: r.y + r.h * (opts.ay ?? .5) };
      }
      const ms = ctx.instant ? 0 : (opts.ms ?? 900);
      moveCursor(p, ms);
      return later(ctx, ms);
    },
    hideCursor: () => { cursorEl.classList.remove('is-visible'); },
    showCursor: () => { cursorEl.classList.add('is-visible'); },
    click(ctx) { if (!ctx.instant) burst(); return later(ctx, 250); },
    dblclick(ctx) {
      if (!ctx.instant) { burst(); setTimeout(burst, 150); }
      return later(ctx, 380);
    },
    select(ctx, sel) {
      const el = $(sel, desk);
      $$('.is-selected', el.parentElement).forEach((e) => e.classList.remove('is-selected'));
      el.classList.add('is-selected');
    },
    press(ctx, sel) {
      if (ctx.instant) return;
      const el = $(sel, desk);
      el.classList.add('is-pressed');
      burst();
      return sleep(240).then(() => el.classList.remove('is-pressed'));
    },

    // typewriter: reveal characters one by one, caret follows the last visible one
    type(ctx, sel) {
      const el = $(sel, desk);
      const chars = $$('.ch', el);
      const caret = $('.caret', el);
      el.classList.add('is-typed');
      if (ctx.instant) { chars.forEach((c) => c.classList.add('on')); return; }
      const ms = +el.dataset.ms || TYPE_MS;
      return (async () => {
        for (const c of chars) {
          if (ctx.token !== token) return;
          c.classList.add('on');
          c.after(caret);
          if (window.SFX) SFX.key(c.textContent);            // sfx.js: typewriter strike
          await sleep(ms);
        }
        await sleep(250);
      })();
    },

    // draw the first frame (full city map) before the window shows, so nothing pops in
    globeStart(ctx, sel) {
      const el = $(sel, desk);
      el.classList.remove('is-arrived');
      globeDraw(el, 0, 0);
    },

    // globe: 포항 지도 → 지구, then arcs from 포항
    globe(ctx, sel) {
      const el = $(sel, desk);
      if (ctx.instant) { globeDraw(el, 1, 1); el.classList.add('is-arrived'); return; }
      el.classList.remove('is-arrived');
      const T1 = 4600, T2 = 1300;
      return new Promise((res) => {
        const t0 = performance.now();
        const step = (now) => {
          if (ctx.token !== token) return res();
          const t = Math.min(1, (now - t0) / T1), u = clamp01((now - t0 - T1) / T2);
          globeDraw(el, t, easeIO(u));
          if (u < 1) requestAnimationFrame(step);
          else { el.classList.add('is-arrived'); setTimeout(res, 500); }
        };
        requestAnimationFrame(step);
      });
    },

    // slow scroll through a document, in the background (the next click moves on)
    autoscroll(ctx, id, ms = 30000) {
      const body = $('.scroll', win(id));
      body.scrollTop = 0;
      if (ctx.instant) return;
      const t = ctx.token, t0 = performance.now() + 1200;
      const step = (now) => {
        if (t !== token) return;
        const k = clamp01((now - t0) / ms);
        body.scrollTop = (body.scrollHeight - body.clientHeight) * (.5 - .5 * Math.cos(Math.PI * k));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    // pdf viewer layout: 'page' (100%), 'spread' (two pages), 'grid' (all pages)
    pdfMode(ctx, id, mode) {
      const w = win(id), pages = $('.pdf-pages', w), body = $('.scroll', w);
      const apply = () => {
        w.classList.remove('is-spread', 'is-grid');
        if (mode !== 'page') w.classList.add(`is-${mode}`);
        if (mode === 'grid') body.scrollTop = 0;
      };
      if (ctx.instant) { apply(); return; }
      return (async () => {
        pages.style.opacity = 0;
        await sleep(200);
        apply();
        pages.style.opacity = '';
        await sleep(300);
      })();
    },

    // geo map: animate to a named view (ENC_VIEWS in talk.js)
    gmapTo(ctx, sel, name, opts = {}) {
      const el = $(sel, desk), to = EV[name];
      if (!el || !to) return;
      el.dataset.viewNow = name;
      const [lon, lat, km] = (el.dataset.cur || '').split(',').map(Number);
      if (ctx.instant || !km) { gmapView(el, to); return; }
      const ms = opts.ms || 1800, t0 = performance.now();
      return new Promise((res) => {
        const step = (now) => {
          if (ctx.token !== token) return res();
          const e = easeIO(clamp01((now - t0) / ms));
          gmapView(el, { lon: lon + (to.lon - lon) * e, lat: lat + (to.lat - lat) * e, km: Math.exp(Math.log(km) + (Math.log(to.km) - Math.log(km)) * e) });
          if (e < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
    },

    // phone showcase: one recorded encounter, its words, its place on the map
    encNode(ctx, n) {
      const d = EN.find((x) => x.n === n), q = EP.find((x) => x.n === n);
      const app = $('#enc-app', desk);
      if (!d || !q || !app) return;
      const v = $('#enc-video', app);
      if (v.getAttribute('src') !== d.video) { v.setAttribute('src', d.video); v.setAttribute('poster', d.video.replace(/\.mp4$/, '.jpg')); }
      $('.app-node', app).textContent = `NODE ${String(n).padStart(2, '0')} · ${q.bon}`;
      $('.app-lang', app).textContent = d.lang === 'en' ? 'EN' : 'KR';
      $('.app-place', app).innerHTML = `${q.ko}<small>${q.en}</small>`;
      $('.app-title', app).innerHTML = `<span>${d.title}</span>`;
      $('.app-action', app).textContent = d.action;
      $('.app-how', app).textContent = d.how;          // the encounter's own on-screen instruction
      const info = $('.app-info', app);
      info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
      let seen = true;
      $$('#app-steps li', app).forEach((li) => {
        const m = +li.dataset.n;
        li.classList.toggle('is-now', m === n);
        li.classList.toggle('is-done', seen && m !== n);
        if (m === n) seen = false;
      });
      const map = $('#app-map', app);
      $$('.gpin', map).forEach((pin) => pin.classList.toggle('is-hot', +pin.dataset.n === n));
      map.classList.add('pins-on');
      const view = q.far ? 'all' : 'old';
      if (!ctx.instant) { v.currentTime = 0; v.play().catch(() => {}); }
      return A.gmapTo(ctx, '#app-map', view, { ms: 900 });
    },

    // window → full screen (menubar and taskbar slide away)
    maximize(ctx, id) {
      const w = win(id);
      w.classList.add('is-full');
      w.style.zIndex = 1500;
      Object.assign(w.style, { left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
      stage.classList.add('fs');
      return later(ctx, 900);
    },
    playVideo(ctx, sel) {
      if (ctx.instant) return;
      const v = $(sel, desk);
      if (v && v.getAttribute('src')) { v.currentTime = 0; v.play().catch(() => {}); }
    },
    // run actions at moments of a playing video: [[seconds, [[action, ...args], ...]], ...]
    // only while this step is current; scrubbing back before a cue arms it again.
    videoCues(ctx, sel, cues) {
      if (ctx.instant) return;
      const v = $(sel, desk);
      if (!v) return;
      if (v._cueOff) v._cueOff();
      const list = cues.map(([t, acts]) => ({ t, acts, done: false }));
      const onTime = () => {
        if (ctx.token !== token) return v._cueOff && v._cueOff();
        const now = v.currentTime;
        for (const c of list) {
          if (c.done && now < c.t - 0.5) c.done = false;
          if (!c.done && now >= c.t) {
            c.done = true;
            (async () => { for (const [name, ...args] of c.acts) { if (ctx.token !== token) return; await run(name, ctx, args); } })();
          }
        }
      };
      v.addEventListener('timeupdate', onTime);
      v._cueOff = () => { v.removeEventListener('timeupdate', onTime); v._cueOff = null; };
    },
    // keep a video going without restarting it (used when landing on a later step of the same window)
    resume(ctx, sel) {
      if (ctx.instant) return;
      const v = $(sel, desk);
      if (v && v.getAttribute('src') && v.paused) v.play().catch(() => {});
    },

    // relations.map as the chapter index: retitle the map, spotlight the chapter's CV line(s)
    // and the people connected to them. { no, title, sub, chips: ['c24', ...] }
    chapterMap(ctx, d) {
      const map = $('#map', desk);
      const head = $('.map-head', map);
      head.innerHTML = `<span class="mh-no">${d.no}</span>${d.title}${d.sub ? `<small>${d.sub}</small>` : ''}`;
      if (!ctx.instant) { head.classList.remove('swap'); void head.offsetWidth; head.classList.add('swap'); }
      map.classList.add('is-chapter');
      $$('.is-active', map).forEach((e) => e.classList.remove('is-active'));
      const chips = d.chips || [];
      map.dataset.chips = chips.join(' ');          // focusNode stays inside this chapter
      map.classList.toggle('is-focus', chips.length > 0);
      chips.forEach((id) => {
        $(`#${id}`, map).classList.add('is-active');
        $$('.edge, .port', map).forEach((e) => {
          if (e.dataset.b !== id && !(e.classList.contains('tl') && e.dataset.a === id)) return;
          e.classList.add('is-active');
          if (!e.classList.contains('tl')) $(`#${e.dataset.a}`, map).classList.add('is-active');
        });
      });
      return later(ctx, 700);
    },

    // relations.map: spotlight one node and its cables (null = clear).
    // inside a chapter only the cables to that chapter's CV line(s) light up:
    // 시민들 in CHAPTER 01 is the 2024 audience, not 2025 / ISEA as well.
    focusNode(ctx, id) {
      const map = $('#map', desk);
      $$('.is-active', map).forEach((e) => e.classList.remove('is-active'));
      if (!id) { map.classList.remove('is-focus'); return; }
      map.classList.add('is-focus');
      $(`#${id}`, map).classList.add('is-active');
      const scope = (map.dataset.chips || '').split(' ').filter(Boolean);
      $$('.edge, .port', map).forEach((e) => {
        if (e.dataset.a !== id) return;
        if (scope.length && !scope.includes(e.dataset.b)) return;
        e.classList.add('is-active');
        $(`#${e.dataset.b}`, map).classList.add('is-active');
      });
      return later(ctx, 450);
    },

    // chapter card: { no, title, sub }. title may contain \n
    chapter(ctx, d) {
      const ch = $('#chapter', desk);
      const fill = () => {
        $('.ch-no', ch).textContent = d.no;
        $('.ch-title', ch).innerHTML = d.title.split('\n').map((t) => `<span>${t}</span>`).join('<br>');
        $('.ch-sub', ch).innerHTML = `<span>${d.sub}</span>`;
      };
      if (ctx.instant) { fill(); ch.classList.add('is-shown'); return; }
      return (async () => {
        if (ch.classList.contains('is-shown')) { ch.classList.remove('is-shown'); await sleep(450); }
        if (ctx.token !== token) return;
        fill();
        ch.classList.add('is-shown');
        await sleep(900);
      })();
    },
    mark(ctx, sel, opts = {}) {
      const els = $$(sel, desk);
      if (ctx.instant) { els.forEach((e) => e.classList.add('is-marked')); return; }
      return (async () => {
        for (const e of els) {
          if (ctx.token !== token) return;
          e.classList.add('is-marked');
          await sleep(opts.stagger ?? 280);
        }
        await sleep(450);
      })();
    },
    unmark(ctx, sel = '.hl') { $$(sel, desk).forEach((e) => e.classList.remove('is-marked')); },

    scroll(ctx, id, sel, offset = 32) {
      const body = $('.scroll', win(id));
      const el = $(sel, body);
      const br = body.getBoundingClientRect();
      const k = br.height / body.offsetHeight || 1;
      const max = body.scrollHeight - body.clientHeight;
      const to = Math.max(0, Math.min(max, body.scrollTop + (el.getBoundingClientRect().top - br.top) / k - offset));
      if (ctx.instant) { body.scrollTop = to; return; }
      return tween(body, to, 1000, ctx.token);
    },

    camera(ctx, sel, zoom) {
      if (!sel) setCam({ x: 0, y: 0, s: 1 });
      else {
        const r = deskRect($(sel, desk));
        const s = zoom || Math.min((W * .8) / r.w, ((H - MENU - TASK) * .6) / r.h, 3);
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        setCam({ x: W / 2 - cx * s, y: (H + MENU - TASK) / 2 - cy * s, s });
      }
      return later(ctx, 1100);
    },
  };

  /* ─────────────── runner ─────────────── */

  function reset() {
    desk.innerHTML = INITIAL;
    stage.dataset.wall = 'mint';
    boot.classList.remove('is-booted', 'is-off');
    $('#end').classList.remove('is-on');
    stage.classList.remove('fs');
    setCam({ x: 0, y: 0, s: 1 });
    openOrder = []; focused = null; z = 10;
    cur = { x: 1500, y: 880 };
    cursorEl.classList.remove('is-visible');
    cursorEl.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
    $$('.burst', stage).forEach((b) => b.remove());
    renderTabs();
  }

  function run(name, ctx, args) {
    const fn = A[name];
    if (!fn) { console.warn('unknown action', name); return null; }
    try { return fn(ctx, ...args); } catch (e) { console.error(`[${name}]`, args, e); return null; }
  }

  async function play(i) {
    const t = ++token;
    busy = true;
    current = i;
    hud();
    const ctx = { instant: false, token: t };
    for (const [name, ...args] of TALK[i].do) {
      if (t !== token) return;
      await run(name, ctx, args);
    }
    if (t === token) busy = false;
  }

  const AMBIENT = new Set(['autoscroll', 'playVideo', 'videoCues', 'resume', 'encNode']);
  function jump(i) {
    i = Math.max(0, Math.min(TALK.length - 1, i));
    token++;
    busy = false;
    stage.classList.add('instant');
    reset();
    const ctx = { instant: true, token };
    for (let k = 0; k <= i; k++) for (const [name, ...args] of TALK[k].do) run(name, ctx, args);
    current = i;
    hud();
    void stage.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      stage.classList.remove('instant');
      // background actions (slow scroll, video) start again on the step we landed on
      for (const [name, ...args] of TALK[i].do) if (AMBIENT.has(name)) run(name, { instant: false, token }, args);
    }));
  }

  // going back (or jumping) hides the hard cut behind a short ◀◀ overlay.
  // repeated presses while it is up keep stepping back.
  const rewindEl = $('#rewind');
  let seekTarget = null, seekTimer;
  function seek(i) {
    i = Math.max(0, Math.min(TALK.length - 1, i));
    token++; busy = false;                       // stop whatever is animating
    seekTarget = i;
    $('span', rewindEl).textContent = String(i).padStart(2, '0');
    rewindEl.classList.add('is-on');
    clearTimeout(seekTimer);
    seekTimer = setTimeout(() => {
      seekTarget = null;
      jump(i);
      requestAnimationFrame(() => rewindEl.classList.remove('is-on'));
    }, 160);
  }

  function next() {
    if (seekTarget !== null) return;            // a rewind is landing
    if (busy) return jump(current);            // finish current animation instantly
    if (current < TALK.length - 1) play(current + 1);
  }
  function prev() {
    const from = seekTarget ?? current;
    if (from > 0) seek(from - 1);
  }

  function hud() {
    const n = TALK.length - 1;
    $('#step-count').textContent = `${String(current).padStart(2, '0')}/${String(n).padStart(2, '0')}`;
    $('#step-label').textContent = TALK[current]?.label || '';
    $('#pbar').innerHTML = TALK.map((_, k) => `<i class="${k < current ? 'on' : k === current ? 'now' : ''}"></i>`).join('');
    $('#nav-prev').classList.toggle('is-disabled', current <= 0);
    $('#nav-next').classList.toggle('is-disabled', current >= n);
    try { history.replaceState(null, '', `#${current}`); } catch (e) { /* file:// in some browsers */ }
    dispatchEvent(new CustomEvent('heund:step', { detail: { step: current } }));   // the phone remote listens
  }

  /* ─────────────── input ─────────────── */

  const flash = (id) => { const b = $(id); b.classList.add('is-pressed'); setTimeout(() => b.classList.remove('is-pressed'), 120); };
  addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); flash('#nav-next'); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); flash('#nav-prev'); prev(); }
    else if (k === 'Home') { e.preventDefault(); seek(0); }
    else if (k === 'End') { e.preventDefault(); seek(TALK.length - 1); }
    else if (k === 'f' || k === 'F') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (k === 'h' || k === 'H') stage.classList.toggle('no-hud');
  });
  viewport.addEventListener('click', next);
  viewport.addEventListener('contextmenu', (e) => { e.preventDefault(); prev(); });   // right click = back
  $('#nav-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  $('#nav-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
  viewport.tabIndex = -1;
  viewport.focus();

  // in-window video players: progress bar, time, play state (capture: media events don't bubble)
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const playerUI = (e) => {
    const v = e.target, w = v.closest && v.closest('.win');
    if (!w || v.tagName !== 'VIDEO') return;
    w.classList.toggle('is-playing', !v.paused && !v.ended);
    const bar = $('.pb-track i', w), time = $('.pb-time', w);
    if (bar && v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
    if (time && v.duration) time.textContent = `${mmss(v.currentTime)} / ${mmss(v.duration)}`;
  };
  ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach((t) => desk.addEventListener(t, playerUI, true));
  // follow the montage frame by frame (timeupdate alone lags a cut by up to ~250 ms)
  const sysAt = (t) => sysNow(desk, Math.min(EN.length - 1, Math.floor(t / MONTAGE_SEG)));
  desk.addEventListener('timeupdate', (e) => { if (e.target.id === 'sys-video') sysAt(e.target.currentTime); }, true);
  desk.addEventListener('play', (e) => {
    const v = e.target;
    if (v.id !== 'sys-video' || v._sync || !v.requestVideoFrameCallback) return;
    v._sync = true;
    const tick = (now, meta) => { if (!v.isConnected) return; sysAt(meta.mediaTime); v.requestVideoFrameCallback(tick); };
    v.requestVideoFrameCallback(tick);
  }, true);
  // K, the phone remote or clicking an in-window player: pause / resume (a click on the player doesn't advance the talk).
  // the main video is the open player window's (작가와의 대화, ISEA), not the muted loops inside the popup.
  const toggleVideo = (v) => { if (v) v.paused ? v.play().catch(() => {}) : v.pause(); };
  const mainVideo = () => $$('.win-player.is-open video', desk).find((x) => x.getAttribute('src'))
    || $$('.win.is-open video', desk).find((x) => x.getAttribute('src')) || null;
  addEventListener('keydown', (e) => {
    if (e.key !== 'k' && e.key !== 'K') return;
    toggleVideo(mainVideo());
  });
  desk.addEventListener('click', (e) => {
    const w = e.target.closest('.win-player.is-open');
    if (!w || !e.target.closest('.player-body, .player-bar')) return;
    e.stopPropagation();
    toggleVideo($('video', w));
  });

  let idleTimer;
  addEventListener('mousemove', () => {
    viewport.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => viewport.classList.add('idle'), 1500);
  });

  /* ─────────────── clock ─────────────── */

  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  function tick() {
    const d = new Date();
    $('#clock').textContent = `${DAYS[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  tick();
  setInterval(tick, 10000);

  /* ─────────────── start ─────────────── */

  reset();
  const start = () => {
    const h = parseInt(location.hash.slice(1), 10);
    if (h > 0) jump(h); else play(0);
  };
  Promise.race([document.fonts.ready, sleep(2500)]).then(start);

  window.HEUND = {
    next, prev, jump, mainVideo,
    toggleVideo: () => toggleVideo(mainVideo()),
    get step() { return current; },
    get last() { return TALK.length - 1; },
    label: (i) => TALK[i]?.label || '',
  };
})();
