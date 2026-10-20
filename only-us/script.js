/* ONLY US — script.js. All settings live in config.js. */
(() => {
'use strict';
const C = window.CONFIG, $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = $('#stage'), vinyl = $('#vinyl'), disk = $('#disk'), tag = $('#pauseTag'), statusEl = $('#status');
let statusT;
function say(msg, ms = 4500) { statusEl.textContent = msg; clearTimeout(statusT); if (msg && ms) statusT = setTimeout(() => statusEl.textContent = '', ms); }

/* ---------- Live timer (calendar-aware, from the real clock every tick) ---------- */
// Both instants are converted to wall-clock fields in C.timezone, then subtracted
// field by field with borrows (seconds→minutes→hours→days→months→years). The day
// borrow uses the real length of the month before "now", so leap years and 28–31
// day months are handled. Nothing is incremented or stored between ticks.
const startMs = Date.parse(C.start);
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: C.timezone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
function wall(ms) { const o = {}; fmt.formatToParts(ms).forEach(p => o[p.type] = +p.value); return { y: o.year, mo: o.month - 1, d: o.day, h: o.hour, mi: o.minute, s: o.second }; }
function elapsed(now) {
  if (now < startMs) return null;
  const a = wall(startMs), b = wall(now);
  let y = b.y - a.y, mo = b.mo - a.mo, d = b.d - a.d, h = b.h - a.h, mi = b.mi - a.mi, s = b.s - a.s;
  if (s < 0) { s += 60; mi--; } if (mi < 0) { mi += 60; h--; } if (h < 0) { h += 24; d--; }
  if (d < 0) { d += new Date(Date.UTC(b.y, b.mo, 0)).getUTCDate(); mo--; }
  if (mo < 0) { mo += 12; y--; }
  return { y, mo, d, h, mi, s };
}
const p2 = n => String(n).padStart(2, '0'), pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function tick() {
  const now = Date.now();
  const e = elapsed(now);

  if (!e) {
    $('#t1').textContent = 'Our story hasn’t started yet';
    $('#t2').textContent = '';
    return;
  }

  // Relationship duration
  $('#t1').textContent =
    `${pl(e.y, 'year')} · ${pl(e.mo, 'month')} · ${pl(e.d, 'day')}`;

  // Total time together
  const totalSeconds = Math.floor((now - startMs) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalSeconds / 3600);
  const seconds = totalSeconds % 60;

  $('#t2').textContent =
    `${totalHours.toLocaleString()} hours · ` +
    `${totalMinutes.toLocaleString()} minutes · ` +
    `${seconds.toString().padStart(2, '0')} seconds`;
}

tick(); setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (Date.now() - lastSync > C.syncSeconds * 1000) sync(); } });

/* ---------- Story + credits ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .45 });
C.story.forEach(([t, txt]) => {
  const s = document.createElement('section'); s.className = 'memory';
  const d = document.createElement('div'); d.className = 'rv';
  const sm_ = document.createElement('small'), p = document.createElement('p'); sm_.textContent = t; p.textContent = txt;
  d.append(sm_, p); s.append(d); $('#story').append(s); io.observe(d);
});
const cr = $('#credits');
if (C.herName) { const h = document.createElement('div'); h.className = 'her rv'; h.textContent = 'For ' + C.herName; cr.append(h); io.observe(h); }
C.credits.forEach(it => {
  const d = document.createElement('div');
  if (it === '') { d.className = 'gap'; } else {
    const [t, c] = Array.isArray(it) ? it : [it, ''];
    d.className = 'line rv ' + c; d.textContent = t; io.observe(d);
  }
  cr.append(d);
});
const sp = document.createElement('div'); sp.className = 'spindle rv'; cr.append(sp); io.observe(sp);

/* ---------- Photos from Drive ---------- */
const KEY = 'onlyus.cache.' + C.driveFolderId, OK = /^image\/(jpeg|png|webp)$/;
const thumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const alt = (id, w) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
let photos = [], cards = new Map(), openId = null, syncing = false, lastSync = 0;

async function jget(u) { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
async function list() {
  if (!C.driveFolderId) throw new Error('cfg:Set driveFolderId in config.js');
  if (C.appsScriptUrl) return (await jget(C.appsScriptUrl)).files || [];
  if (!C.driveApiKey) throw new Error('cfg:Add driveApiKey or appsScriptUrl in config.js (see README)');
  let out = [], tok = '';
  do {
    const q = new URLSearchParams({ q: `'${C.driveFolderId}' in parents and trashed=false and mimeType contains 'image/'`, fields: 'nextPageToken,files(id,name,mimeType,createdTime)', pageSize: 1000, key: C.driveApiKey, supportsAllDrives: true, includeItemsFromAllDrives: true });
    if (tok) q.set('pageToken', tok);
    const j = await jget('https://www.googleapis.com/drive/v3/files?' + q);
    out.push(...(j.files || [])); tok = j.nextPageToken;
  } while (tok);
  return out;
}
async function fetchList() {
  for (let i = 0; ; i++) {
    try { return (await list()).filter(f => OK.test(f.mimeType)); }
    catch (e) { if (String(e.message).startsWith('cfg:') || i >= 3) throw e; await new Promise(r => setTimeout(r, 1000 * 2 ** i)); }
  }
}
function sortFiles(a) {
  const k = C.sort, byName = (x, y) => x.name.localeCompare(y.name, undefined, { numeric: true });
  return [...a].sort(k === 'date' ? (x, y) => (x.createdTime || '').localeCompare(y.createdTime || '') || byName(x, y)
    : k === 'newest' ? (x, y) => (y.createdTime || '').localeCompare(x.createdTime || '') || byName(y, x) : byName);
}
function rng(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function capOf(f) { return C.captions[f.id] || C.captions[f.name] || (C.filenameCaptions ? f.name.replace(/\.[^.]+$/, '') : ''); }
function makeCard(p) {
  const b = document.createElement('button'); b.className = 'card'; b.dataset.id = p.id;
  b.setAttribute('aria-label', p.ph ? 'Placeholder photo' : 'Open photo: ' + (p.cap || p.name));
  const ph = document.createElement('span'), cap = document.createElement('span'); ph.className = 'ph'; cap.className = 'cap'; cap.textContent = p.cap || '';
  if (p.ph) b.classList.add('blank'); else {
    const img = new Image(); img.alt = p.cap || p.name || 'Our photo'; img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false; img.src = thumb(p.id, 800);
    img.onerror = () => { if (!img.dataset.r) { img.dataset.r = 1; img.src = alt(p.id, 800); } else { img.remove(); b.classList.add('broken'); } };
    ph.append(img);
  }
  b.append(ph, cap); stage.append(b); cards.set(p.id, b); p.el = b;
  const r = rng(p.id); p.rj = .9 + .28 * r(); p.da = (r() - .5) * .35; p.vo = (r() - .5) * .12; p.rot = (r() - .5) * 16; p.sc = .93 + .15 * r();
}
function apply(files) {
  const ids = new Set(files.map(f => f.id));
  photos = photos.filter(p => { if (ids.has(p.id) || p.id === openId) return true; p.el.remove(); cards.delete(p.id); return false; });
  const have = new Set(photos.map(p => p.id));
  sortFiles(files.filter(f => !have.has(f.id))).forEach(f => { const p = { id: f.id, name: f.name, cap: capOf(f) }; photos.push(p); makeCard(p); });
  if (C.limit > 0) while (photos.length > C.limit) { const p = photos.pop(); p.el.remove(); cards.delete(p.id); }
}
function placeholders() { if (photos.length) return; for (let i = 0; i < 4; i++) { const p = { id: 'ph' + i, ph: true, cap: '' }; photos.push(p); makeCard(p); } }
async function sync(manual) {
  if (syncing) return; syncing = true; $('#refresh').classList.add('spin');
  try {
    const f = await fetchList(); apply(f); lastSync = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), f })); } catch (_) {}
    if (!f.length) { placeholders(); say('The Drive folder has no photos yet.', 0); }
    else say(manual ? `Synced · ${photos.length} photo${photos.length === 1 ? '' : 's'}` : '');
  } catch (e) {
    const m = String(e.message);
    if (m.startsWith('cfg:')) say('Setup needed: ' + m.slice(4), 0); else say('Couldn’t reach Google Drive. Will retry.');
    placeholders();
  } finally { syncing = false; $('#refresh').classList.remove('spin'); layout(); draw(); }
}
$('#refresh').onclick = () => sync(true);
try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && Date.now() - c.t < C.cacheMinutes * 60000) apply(c.f); } catch (_) {}
setInterval(() => { if (!document.hidden) sync(); }, C.syncSeconds * 1000);

/* ---------- Motion: rot (vinyl), tp/sp (scroll progress), orbit phase derived from sp ---------- */
let vw, vh, D, cx, cy, cw, maxS = 1, rot = 0, tp = 0, spv = 0, last = 0, paused = false;
function layout() {
  vw = innerWidth; vh = innerHeight; D = Math.min(vh * .95, vw * 1.4); cx = -D * .12 + (vw > 900 ? vw * .12 : 0); cy = vh * .52; cw = clamp(vw * .38, 118, 210);
  const s = document.documentElement.style; s.setProperty('--D', D + 'px'); s.setProperty('--cw', cw + 'px');
  maxS = Math.max(1, $('#credits').offsetTop - vh * .3); onScroll();
}
function onScroll() { tp = clamp(scrollY / maxS); }
function draw() {
  const out = 1 - sm(.8, .95, spv), n = photos.length, V = 5, q = clamp(spv / .85), ocy = cy - spv * vh * .5;
  stage.style.opacity = out; stage.style.visibility = out < .01 ? 'hidden' : 'visible';
  disk.style.transform = `rotate(${rot}deg)`;
  vinyl.style.transform = `translate3d(${cx - D / 2}px,${ocy - D / 2}px,0)`;
  for (let i = 0; i < n; i++) {
    const p = photos[i], s = (q * (n + V - 1) + (V - 1) - i) / V, vis = sm(0, .12, s) * (1 - sm(.88, 1, s));
    const a = (-68 + 136 * clamp(s, -.1, 1.1)) * Math.PI / 180 + p.da;
    const x = cx + (D * .52 * p.rj + cw * .45) * Math.cos(a), y = ocy + D * .55 * p.rj * Math.sin(a) + p.vo * vh;
    const el = p.el; el.style.transform = `translate3d(${x - cw / 2}px,${y - cw * .64}px,0) rotate(${p.rot + a * 5}deg) scale(${p.sc})`;
    el.style.opacity = vis; el.style.visibility = vis < .02 ? 'hidden' : 'visible';
  }
}
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (t - last) / 1000 || 0); last = t;
  if (paused) return;                               // frozen exactly where it is; dt keeps updating so resume has no jump
  if (!RM) rot = (rot + dt * 360 / C.vinylSeconds) % 360;
  spv += (tp - spv) * Math.min(1, dt * 0.06);
  draw();
}
addEventListener('resize', layout); addEventListener('scroll', onScroll, { passive: true });

/* ---------- Interaction state machine: idle → press → (hold | tap) → idle ---------- */
let st = 'idle', pt, sx, sy, tgt;
const setPause = v => { paused = v; tag.hidden = !v; };
stage.addEventListener('pointerdown', e => {
  const t = e.target.closest('.card,#vinyl'); if (!t || e.button > 0) return;
  st = 'press'; tgt = t; sx = e.clientX; sy = e.clientY; clearTimeout(pt);
  pt = setTimeout(() => { if (st === 'press') { st = 'hold'; setPause(true); } }, C.longPressMs);
});
addEventListener('pointermove', e => { if (st === 'press' && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(pt); st = 'idle'; } });
addEventListener('pointerup', () => {
  clearTimeout(pt);
  if (st === 'hold') setPause(false);
  else if (st === 'press' && tgt && tgt.classList.contains('card') && !tgt.classList.contains('blank')) openLb(tgt.dataset.id);
  st = 'idle';
});
addEventListener('pointercancel', () => { clearTimeout(pt); if (st === 'hold') setPause(false); st = 'idle'; });   // fires when the browser takes over for scrolling
stage.addEventListener('click', e => { const c = e.target.closest('.card'); if (c && e.detail === 0 && !c.classList.contains('blank')) openLb(c.dataset.id); });   // keyboard Enter/Space
vinyl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPause(!paused); } });
addEventListener('keydown', e => { if ($('#lb').hidden && (e.key === 'p' || e.key === 'P')) setPause(!paused); });
['contextmenu', 'dragstart'].forEach(ev => stage.addEventListener(ev, e => e.preventDefault()));

/* ---------- Lightbox ---------- */
const lb = $('#lb'), lbi = $('#lbi'); let opener = null;
function openLb(id) {
  const p = photos.find(x => x.id === id); if (!p) return;
  openId = id; opener = document.activeElement; lb.hidden = false; document.body.classList.add('lock');
  lbi.dataset.r = ''; lbi.alt = p.cap || p.name; lbi.src = thumb(id, 2400); $('#lbc').textContent = p.cap || '';
  requestAnimationFrame(() => lb.classList.add('show')); $('#lbx').focus();
}
lbi.onerror = () => { if (!lbi.dataset.r) { lbi.dataset.r = 1; lbi.src = alt(openId, 2400); } else $('#lbc').textContent = 'This photo couldn’t be loaded.'; };
function closeLb() { lb.classList.remove('show'); document.body.classList.remove('lock'); openId = null; setTimeout(() => { if (!openId) lb.hidden = true; }, 300); if (opener) opener.focus(); }
function nav(d) { const real = photos.filter(p => !p.ph), i = real.findIndex(p => p.id === openId); if (i < 0 || real.length < 2) return; openLb(real[(i + d + real.length) % real.length].id); }
$('#lbx').onclick = closeLb; $('#lbp').onclick = () => nav(-1); $('#lbn').onclick = () => nav(1);
lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') closeLb(); });
addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') nav(-1); if (e.key === 'ArrowRight') nav(1); });
let lx = null; lb.addEventListener('pointerdown', e => lx = e.clientX);
lb.addEventListener('pointerup', e => { if (lx !== null && Math.abs(e.clientX - lx) > 50) nav(e.clientX < lx ? 1 : -1); lx = null; });

/* ---------- Music (only after a tap; failures never break the page) ---------- */

/* ---------- Music: attempt autoplay, with button fallback ---------- */
const au = $('#audio'), mb = $('#music');

if (!C.music) {
  mb.hidden = true;
} else {
  au.src = C.music;
  au.load();

  // Try to start music when the page opens
  au.play().catch(() => {
  const startMusic = () => {
    au.play().catch(() => {});
    document.removeEventListener('click', startMusic);
    document.removeEventListener('keydown', startMusic);
    document.removeEventListener('touchstart', startMusic);
    document.removeEventListener('scroll', startMusic);
  };

  document.addEventListener('click', startMusic);
  document.addEventListener('keydown', startMusic);
  document.addEventListener('touchstart', startMusic, { passive: true });
  document.addEventListener('scroll', startMusic, { passive: true });
});
}

au.onplay = () => {
  mb.classList.add('on');
  mb.setAttribute('aria-label', 'Pause music');
};

au.onpause = () => {
  mb.classList.remove('on');
  mb.setAttribute('aria-label', 'Play music');
};

au.onerror = () => mb.classList.add('off');

mb.onclick = async () => {
  if (!au.paused) {
    au.pause();
    return;
  }

  try {
    await au.play();
    mb.classList.remove('off');
  } catch (_) {
    mb.classList.add('off');
    say('Music isn’t available (check assets/our-song.mp3).');
  }
};

layout(); placeholders(); draw(); sync(); requestAnimationFrame(frame);
})();
