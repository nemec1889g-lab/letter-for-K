/* ============ НАСТРОЙКИ: меняй текст здесь ============ */
const CONFIG = {
  name: "Ветерочек",
  autoGreeting: true,          // «Доброе утро / Добрый день / ...» по времени суток
  story: [                     // экран 2 — появляются по одной
    "{greeting}, мой {name} 💞",
    "Я знаю, что сегодня у тебя важный день...",
    "И я просто хочу пожелать тебе удачи."
  ],
  wishParts: [                 // экран 3 — части пожелания (с фото, если они есть)
    "У тебя всё получится.",
    "Ты умнее и сильнее, чем сама о себе думаешь.",
    "Что бы ни случилось сегодня — я тобой горжусь.",
    "И я рядом, даже когда не рядом."
  ],
  wishTitle: "удачи тебе\nсегодня",   // кульминация
  wishSub: "я верю в тебя 💞",
  photos: [                    // например: "assets/photos/1.jpg", "assets/photos/2.jpg"
  ],
  storyHold: 3400,             // сколько мс держится фраза на экране 2
  partHold: 4200               // ...и на экране 3
};
/* ======================================================= */

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let skip = null;
const wait = ms => new Promise(r => { const t = setTimeout(() => { skip = null; r(); }, ms); skip = () => { clearTimeout(t); skip = null; r(); }; });
addEventListener('pointerdown', () => { if (skip && performance.now() - lastShow > 1400) skip(); });
let lastShow = 0;

/* ---------- AUDIO ---------- */
const a1 = $('a1'), a2 = $('a2');
let ac = null, an = null, data = null, gains = [], master = null, muted = false;
function initAudio() {
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    an = ac.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = .8;
    data = new Uint8Array(an.frequencyBinCount);
    master = ac.createGain(); an.connect(master); master.connect(ac.destination);
    [a1, a2].forEach((a, i) => { const s = ac.createMediaElementSource(a), g = ac.createGain(); g.gain.value = i ? 0 : 1; s.connect(g); g.connect(an); gains.push(g); });
  } catch (e) { ac = null; }
}
function vol(i, v, sec = 3) {
  if (ac) gains[i].gain.setTargetAtTime(v, ac.currentTime, sec / 3);
  else (i ? a2 : a1).volume = v;
}
function setMute(m) {
  muted = m; $('mute').classList.toggle('off', m);
  if (ac) master.gain.value = m ? 0 : 1; else { a1.muted = a2.muted = m; }
}
$('mute').onclick = () => setMute(!muted);

/* ---------- BACKGROUND CANVAS ---------- */
const cv = $('bg'), ctx = cv.getContext('2d');
let W, H, DPR, px = 0, py = 0, tpx = 0, tpy = 0, boost = 0, energy = 0, mood = 0;
function resize() { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
addEventListener('resize', resize); resize();
addEventListener('pointermove', e => { tpx = e.clientX / W - .5; tpy = e.clientY / H - .5; });
const PAL = [[255,138,60],[255,62,165],[34,230,200],[255,255,255],[255,90,120],[120,160,255]];
const rnd = Math.random;
const lights = Array.from({ length: 72 }, () => ({ x: rnd(), y: rnd(), z: .15 + rnd() * .85, c: PAL[rnd() * PAL.length | 0], s: (rnd() * .6 + .2) * (rnd() < .5 ? -1 : 1), st: rnd() < .3, ph: rnd() * 6.28 }));
const TINTS = [[[40,10,50],[255,70,170],'#ffe3f4'], [[5,40,45],[34,230,200],'#dcfff9'], [[50,25,10],[255,138,60],'#fff0dc'], [[20,20,60],[130,150,255],'#e8ecff'], [[50,10,30],[255,62,120],'#ffe0ea']];
const orbs = TINTS.map((t, i) => ({ t, fx: .13 + i * .035, fy: .1 + i * .03, p: i * 1.9, r: .09 + (i % 3) * .035, z: .5 + (i % 3) * .25 }));

function chrome(x, y, r, rot, t, a) {
  const [dark, mid, hi] = [`rgb(${t[0]})`, `rgb(${t[1]})`, t[2]];
  ctx.save(); ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'lighter';
  let g = ctx.createRadialGradient(x, y, r * .8, x, y, r * (1.9 + energy));
  g.addColorStop(0, `rgba(${t[1]},${.35 + energy * .3})`); g.addColorStop(1, `rgba(${t[1]},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * (1.9 + energy), 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.translate(x, y); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
  ctx.rotate(rot);
  g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#f2fbff'); g.addColorStop(.26, '#86a9d8'); g.addColorStop(.46, '#161c3a'); g.addColorStop(.5, '#04050d');
  g.addColorStop(.54, dark); g.addColorStop(.78, mid); g.addColorStop(1, hi);
  ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.rotate(-rot);
  g = ctx.createRadialGradient(0, 0, r * .5, 0, 0, r); g.addColorStop(0, 'rgba(0,0,10,0)'); g.addColorStop(1, 'rgba(0,0,14,.6)');
  ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  g = ctx.createRadialGradient(-r * .36, -r * .46, 0, -r * .36, -r * .46, r * .4); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.restore();
}

let t0 = performance.now(), beatT = 0;
function frame(now) {
  const t = (now - t0) / 1000;
  px += (tpx - px) * .04; py += (tpy - py) * .04;
  // audio energy
  let bass = 0;
  if (an && !a1.paused) { an.getByteFrequencyData(data); let s = 0; for (let i = 1; i < 8; i++) s += data[i]; bass = Math.min(1, Math.pow(s / (7 * 255), 1.6) * 2.2); }
  if (bass < .02 && !a1.paused) bass = (Math.max(0, Math.sin(t * 2.6)) ** 6) * .5; // запасной «пульс»
  boost *= .985;
  energy += (Math.max(bass, boost) - energy) * .18;
  mood += ((a2.paused ? 0 : 1) - mood) * .01;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#04050b'); bg.addColorStop(.6, `rgb(${8 + mood * 14},${6},${20 + mood * 10})`); bg.addColorStop(1, '#0a1214');
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // orbs (behind lights)
  orbs.forEach((o, i) => {
    const x = W * (.5 + .36 * Math.sin(t * o.fx + o.p)) + px * 60 * o.z;
    const y = H * (.5 + .36 * Math.cos(t * o.fy + o.p * 1.3)) + py * 60 * o.z;
    const r = Math.min(W, H) * o.r * (1 + energy * .28) * (.7 + o.z * .5) * (1 + mood * .12);
    chrome(x, y, r, Math.sin(t * .4 + i) * .5, o.t, .55 + o.z * .4);
  });

  // city bokeh + motion streaks
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const x = (((l.x + t * .012 * l.s * l.z * (1 + mood * 2.5) + px * l.z * .03) % 1) + 1) % 1 * W;
    const y = l.y * H + Math.sin(t * .3 + l.ph) * 8 * l.z + py * 30 * l.z;
    const r = (4 + l.z * 24) * (1 + energy * .7);
    const a = (.16 + l.z * .4) * (.55 + energy * .9) * (.7 + .3 * Math.sin(t * 1.3 + l.ph));
    ctx.save(); ctx.translate(x, y); if (l.st) ctx.scale(5 + mood * 6, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(${l.c},${a})`); g.addColorStop(.4, `rgba(${l.c},${a * .35})`); g.addColorStop(1, `rgba(${l.c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- TEXT HELPERS ---------- */
function words(el, text) {
  el.className = el.className.replace(/\b(show|out)\b/g, '').trim();
  el.innerHTML = '';
  text.split(' ').forEach((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.style.transitionDelay = (i * .14) + 's'; el.appendChild(s); });
}
async function say(el, text, hold) {
  words(el, text); void el.offsetWidth; el.classList.add('show'); lastShow = performance.now();
  await wait(hold);
  el.classList.remove('show'); el.classList.add('out'); await sleep(1000);
}
function flash(big) { const f = $('flash'); f.className = ''; void f.offsetWidth; f.className = big ? 'big' : 'go'; }
function screen(id) { ['intro', 'story', 'finale'].forEach(s => $(s).classList.toggle('active', s === id)); }
function greeting() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'Доброе утро' : h < 18 && h >= 12 ? 'Добрый день' : h >= 18 && h < 23 ? 'Добрый вечер' : 'Доброй ночи';
}

/* ---------- PHOTOS ---------- */
const frameEl = $('frame'), photo = $('photo');
if (CONFIG.photos.length) frameEl.classList.add('has');
let pi = 0;
async function nextPhoto() {
  if (!CONFIG.photos.length) return;
  frameEl.classList.remove('in'); await sleep(a1 && frameEl.classList.contains('has') && photo.src ? 700 : 50);
  photo.src = CONFIG.photos[pi++ % CONFIG.photos.length];
  try { await photo.decode(); } catch (e) {}
  frameEl.classList.add('in');
}

/* ---------- SEQUENCE ---------- */
async function run() {
  const greet = CONFIG.autoGreeting ? greeting() : 'Доброе утро';
  // экран 2
  screen('story'); await sleep(1200);
  for (const raw of CONFIG.story) await say($('line'), raw.replace('{greeting}', greet).replace('{name}', CONFIG.name), CONFIG.storyHold);
  await sleep(600);

  // экран 3
  boost = 1; flash(false);
  screen('finale'); $('finale').classList.remove('end');
  vol(0, 0, 5); a2.currentTime = 0; a2.play().catch(() => {}); vol(1, 1, 2.5);
  await sleep(900);
  for (const p of CONFIG.wishParts) { nextPhoto(); await say($('part'), p, CONFIG.partHold); }

  // кульминация
  $('part').innerHTML = ''; $('part').style.minHeight = '0'; $('part').style.margin = '0';
  flash(true); boost = 1.6; $('finale').classList.add('end');
  $('title').textContent = CONFIG.wishTitle; $('title').classList.add('in');
  await sleep(2600); $('sub').textContent = CONFIG.wishSub; $('sub').classList.add('in');
  await sleep(2400); $('replay').classList.add('in');
}

$('openBtn').onclick = async () => {
  $('openBtn').classList.add('pop'); $('openBtn').disabled = true;
  initAudio(); if (ac) ac.resume();
  try { await a1.play(); } catch (e) {}
  a2.play().then(() => { a2.pause(); a2.currentTime = 0; }).catch(() => {}); // «разблокировка» второго трека для iOS
  if (!ac) a2.volume = 0;
  $('mute').classList.add('on'); boost = 1.2; flash(false);
  await sleep(900); document.querySelector('.hint').style.opacity = 0;
  run();
};

$('replay').onclick = async () => {
  $('replay').classList.remove('in'); $('title').classList.remove('in'); $('sub').classList.remove('in'); frameEl.classList.remove('in');
  $('part').style.minHeight = ''; $('part').style.margin = '';
  a2.pause(); vol(1, 0, .5); vol(0, 1, 2); a1.currentTime = 0; pi = 0;
  await sleep(1500); run();
};
