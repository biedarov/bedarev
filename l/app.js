(() => {
const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HAN = /[㐀-鿿]/, zh = s => esc(s).replace(/([㐀-鿿〇，。？！：]+)/g, '<span class="zh">$1</span>');
const app = $('#app');
const I = {
  play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.8v12.4c0 .6.7 1 1.2.7l10-6.2c.5-.3.5-1.1 0-1.4l-10-6.2C3.7.8 3 1.2 3 1.8z"/></svg>',
  chk: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
  pen: '<svg class="pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-label="писать"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>'
};
let PLAN, WORDS, LES, PIN, AMAP, CH = null;
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- state ---------- */
const DEF = () => ({v: 2, done: {}, doneOn: {}, tests: {}, srs: {}, time: {}, timer: null, settings: {theme: 'dark'}});
let S = DEF(), store = {save: async () => {}}, saveT;
const LS = 'lcm40-state-v2';
try { const t = localStorage.getItem(LS); if (t) S = Object.assign(DEF(), JSON.parse(t)); } catch (e) {}
const persist = () => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} clearTimeout(saveT); saveT = setTimeout(() => store.save(S).catch(() => {}), 500); };
let busy = false;
(async () => { try {
  const [db, user] = await Promise.all([window.claude?.use?.('db'), window.claude?.use?.('user')]); if (!db || !user) return;
  const id = await user.id(); if (!id) return;
  const ref = db.collection('/l/data/users/' + id).doc('state40v2');
  const snap = await Promise.race([ref.get(), new Promise(r => setTimeout(() => r('t'), 10000))]); if (snap === 't') return;
  if (snap?.exists && snap.data()?.v === 2) S = Object.assign(DEF(), JSON.parse(JSON.stringify(snap.data()))); else await ref.set(JSON.parse(JSON.stringify(S)));
  store = {save: s => ref.set(JSON.parse(JSON.stringify(s)))}; theme(); setLang(SITE || S.lang || 'zh'); brandTo(LANGS[S.lang]); if (!busy && PLAN) route(true);
} catch (e) {} })();
function syncGi(){ $$('#gi button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === '1') === (S.settings.girl !== false))); }
function theme(){ syncGi?.(); const t = S.settings.theme === 'light' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; $$('#th button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === t)); }
theme();

/* ---------- audio ---------- */
const PACKS = {}; let audio = null;
const SIL = 'data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYzLjEuMTAyAAAAAAAAAAAAAAD/83DAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAACWAB6enp6enp6enp6enp6enp6enp6enp6enqmpqampqampqampqampqampqampqampqam09PT09PT09PT09PT09PT09PT09PT09PT0/////////////////////////////////8AAAAATGF2YzYzLjEuAAAAAAAAAAAAAAAAJAJxAAAAAAAAAlj7+oWZAAAAAAAAAAAAAAAAAP/zQMQAAAADSAAAAABMQU1FMy4xMDBVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxFsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
function playRef(ref, btn){
  if (!ref) return; try { audio?.pause(); } catch (e) {}
  $$('.play.on').forEach(b => b.classList.remove('on')); btn?.classList.add('on');
  const a = audio = new Audio(SIL); a.play().catch(() => {});
  const [k, f] = ref.split('/');
  PACKS[k] ??= fetch(`/l/audio/pack_${k}.json`, {cache: 'no-cache'}).then(r => r.json()).catch(e => { delete PACKS[k]; throw e; });
  PACKS[k].then(p => { if (audio !== a || !p[f]) return; a.src = 'data:audio/mpeg;base64,' + p[f]; a.onended = () => btn?.classList.remove('on'); return a.play(); }).catch(() => btn?.classList.remove('on'));
}
const sayT = (t, b) => playRef(AMAP?.l[t], b), sayW = (h, b) => playRef(AMAP?.w[h]?.[0], b);
let touched = false; addEventListener('pointerdown', () => touched = true, true); addEventListener('keydown', () => touched = true, true);
const bindPlay = root => $$('.play[data-t]', root).forEach(b => b.onclick = e => { e.stopPropagation(); sayT(b.dataset.t, b); });

/* ---------- plan ---------- */
const info = d => PLAN.days[d - 1];
const passed = id => { const t = S.tests[id]; return !!t && t.best >= Math.ceil(t.total * .8); };
const words = d => WORDS.filter(w => w.d === d);
function tasks(d){
  const x = info(d), T = [], ph = PLAN.phonetics;
  if (d <= ph.days[1]) {
    const gs = (ph.schedule[String(d)] || []).map(n => ph.groups[n - 1]), st = ((d - 1) * ph.syllables.perDay) % ph.syllables.minutes;
    T.push({id: 'ph1', g: 'Фонетика', t: gs.length ? 'Звуки · группы ' + gs.map(g => g.n).join(' и ') : 'Звуки · трудная группа', links: (gs.length ? gs : ph.groups).map(g => [g.video, 'гр. ' + g.n])});
    T.push({id: 'ph2', g: 'Фонетика', t: `Слоги · ${st}:00–${st + 10}:00`, links: [[ph.syllables.video + '&t=' + st * 60 + 's', 'видео']]});
  }
  const n = words(d).length, b = PLAN.blocks.find(b => d >= b.days[0] && d <= b.days[1]);
  T.push({id: 'a1', g: 'Лексика', t: 'Anki · повторения'});
  T.push({id: 'a2', g: 'Лексика', t: n ? `Anki · ${n} новых слов` : 'Повтори слова недели', go: n ? `#words-d${d}` : `#words-b${b.n}`});
  T.push({id: 'a3', g: 'Лексика', t: x.chars ? `Пропись · ${[...x.chars].length} иероглифов` : 'Пропись недели', go: x.chars ? `#words-d${d}` : `#words-b${b.n}`});
  const due = dueCards().length;
  T.push({id: 'g1', g: 'Грамматика', auto: true, t: x.lessons.length ? x.lessons.map(id => LES[id].title.split(' — ')[0]).join(' · ') : 'Повторение грамматики', note: due ? `↻ ${due}` : '', go: '#start'});
  return T;
}
const gramDone = d => info(d).lessons.length ? info(d).lessons.every(passed) : !!S.done[d]?.g1;
const done = (d, t) => t.auto ? gramDone(d) : !!S.done[d]?.[t.id];
const frac = d => { const T = tasks(d); return T.filter(t => done(d, t)).length / T.length; };
const complete = d => frac(d) >= 1;
function curDay(){ for (let d = 1; d <= 40; d++) { if (!complete(d)) return d; if (S.doneOn[d] === today() && d < 40 && !S.done[d + 1]?._go) return d; } return 40; }
function track(){ const d = curDay(); if (complete(d) && !S.doneOn[d]) S.doneOn[d] = today(); }
const learned = d => !!S.done[d]?.a2;

/* ---------- time ---------- */
const sec = (date, k) => (S.time[date]?.[k] || 0) + (S.timer?.s === k && date === today() ? (Date.now() - S.timer.at) / 1000 : 0);
const dayT = date => ['anki', 'phon', 'gram'].reduce((a, k) => a + sec(date, k), 0);
const h2 = (s, p = 2) => (s / 3600).toFixed(p);
const add = (k, s) => { const t = today(); (S.time[t] ??= {})[k] = (S.time[t][k] || 0) + s; };
function timer(k){ if (S.timer) { add(S.timer.s, (Date.now() - S.timer.at) / 1000); const same = S.timer.s === k; S.timer = null; if (same) return persist(); } S.timer = {s: k, at: Date.now()}; persist(); }
let tk = Date.now();
setInterval(() => { if (document.visibilityState === 'visible' && /^#(lesson|start|review|pinyin)/.test(location.hash)) { add('gram', (Date.now() - tk) / 1000); persist(); } tk = Date.now(); }, 5000);

/* ---------- spaced repetition ---------- */
const IV = [1, 3, 7, 14, 30];
const schedule = id => LES[id].q.forEach((q, k) => { S.srs[id + ':' + k] ??= {due: addDays(today(), 1), iv: 0}; });
const dueCards = () => Object.entries(S.srs).filter(([, c]) => !c.done && c.due <= today()).sort((a, b) => a[1].due.localeCompare(b[1].due)).slice(0, 12).map(([k]) => k);
function grade(key, ok){ const c = S.srs[key]; if (!c) return; c.n = (c.n || 0) + 1; c.ok = (c.ok || 0) + (ok ? 1 : 0);
  if (ok) { c.iv++; if (c.iv >= IV.length) c.done = true; else c.due = addDays(today(), IV[c.iv]); } else { c.iv = 0; c.due = addDays(today(), 1); } }
const cardQ = key => { const [id, k] = key.split(':'); return LES[id]?.q[+k]; };

/* ---------- view swap: one crossfade between sections ---------- */
let first = true, curSec = '';
function show(html, cls = '', after, sec = ''){
  curSec = sec;
  let painted = false;
  const paint = () => { if (painted) return; painted = true; app.className = cls; app.innerHTML = html; after?.(); };
  if (first || !document.startViewTransition || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { first = false; return paint(); }
  try { const vt = document.startViewTransition(paint); vt.updateCallbackDone?.catch(paint); vt.finished?.catch(() => {}); vt.ready?.catch(() => {}); } catch (e) { paint(); }
  setTimeout(paint, 400);   // safety net: the page is drawn even if the browser skips the transition
}

/* ---------- review button ---------- */
const RV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>';
function revBtn(){
  const n = dueCards().length;
  if (n) return `<p><a class="rev" href="#review">${RV}<span>Повторение уроков</span><em class="num">${n}</em></a></p>`;
  const nx = Object.values(S.srs).filter(c => !c.done).map(c => c.due).sort()[0];
  return `<p><span class="rev none">${I.chk.replace('<svg', '<svg style="width:14px;height:14px"')}<span>Повторять нечего</span><em>${nx ? 'след. ' + nx.slice(8) + '.' + nx.slice(5, 7) : 'после первого урока'}</em></span></p>`;
}

/* ---------- illustration ---------- */
const GIRL = {zh: '/l/img/girl_zh.webp', de: '/l/img/girl_zh.webp', ja: '/l/img/girl_ja.webp'};
const peek = () => { const k = GIRL[S.lang] ? S.lang : 'zh'; return `<div class="peek ${k}" aria-hidden="true"><div class="pk"><img src="${GIRL[k]}" alt=""></div></div>`; };
function reveal(pk, img){ let done = false; const go = () => { if (done) return; done = true; requestAnimationFrame(() => pk.classList.add('up')); setTimeout(() => pk.classList.add('up'), 60); };
  setTimeout(go, 300); img?.decode?.().then(go).catch(go); }
function setGirl(on){
  S.settings.girl = on; persist(); $$('#gi button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === '1') === on));
  const top = $('.top'); if (!top) return;
  if (!on) { const pk = $('.pk', top); if (pk) { pk.classList.add('out'); pk.classList.remove('up'); }
    setTimeout(() => { $('.peek', top)?.remove(); top.classList.add('nogirl'); }, pk ? 650 : 0); }
  else if (!$('.peek', top)) { top.classList.remove('nogirl');
    setTimeout(() => { top.insertAdjacentHTML('afterbegin', peek()); reveal($('.pk', top), $('.peek img', top)); }, 750); }
}

/* ---------- home ---------- */
function home(){
  track();
  const d = curDay(), T = tasks(d), lw = WORDS.filter(w => learned(w.d)).length, nL = Object.keys(LES).length, nl = Object.keys(LES).filter(passed).length;
  const t = today(), tod = dayT(t), yes = dayT(addDays(t, -1)), tot = Object.keys(S.time).reduce((a, k) => a + dayT(k), 0);
  const ring = (v, max, lab) => { const r = 70, C = 2 * Math.PI * r; return `<div class="ring"><svg viewBox="0 0 156 156"><circle class="tr" cx="78" cy="78" r="${r}"/><circle class="pr" cx="78" cy="78" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-to="${C * (1 - Math.min(1, v / max))}"/></svg><div class="c"><b class="num" data-count="${v}">0</b>${lab ? `<small>${lab}</small>` : ''}</div></div>`; };
  const cal = PLAN.days.map(x => { const f = frac(x.d), bg = f >= 1 ? 'var(--ink)' : f > 0 ? `color-mix(in srgb,var(--ink) ${Math.round(20 + f * 50)}%,var(--c2))` : '';
    return `<i class="${f > 0 ? 'f' : ''} ${x.d === d ? 'cur' : ''}" style="animation-delay:${300 + x.d * 12}ms;${bg ? 'background:' + bg : ''}" title="День ${x.d}"></i>`; }).join('');
  const gs = [...new Set(T.map(x => x.g))];
  const row = x => `<div class="task ${done(d, x) ? 'done' : ''}" ${x.go ? `data-go="${x.go}"` : ''}><button class="chk" data-t="${x.id}" ${x.auto ? 'disabled' : ''} aria-label="${esc(x.t)}">${I.chk}</button><b>${esc(x.t)}</b>
      <span class="r">${x.note ? `<span>${x.note}</span>` : ''}${(x.links || []).map(([u, l]) => `<a class="mini" href="${esc(u)}" target="_blank" rel="noopener">${l}</a>`).join('')}</span></div>`;
  const tmr = g => { const s = {Фонетика: 'phon', Лексика: 'anki'}[g]; if (!s) return ''; const run = S.timer?.s === s; return `<button class="mini ${run ? 'on' : ''}" data-timer="${s}">${run ? '■ стоп' : '▶ таймер'}</button>`; };
  show(`<div class="stack">
    <section class="card top ${S.settings.girl === false ? 'nogirl' : ''}" aria-label="Статистика">${S.settings.girl === false ? '' : peek()}
      <div class="rings">${S.lang === 'ja' && JA ? ring(JA.words.filter(w => w.s === 'known').length, JA.words.length, '') + ring(jaLessonsDone(), 23, 'уроков') : S.lang === 'de' && DE ? ring(DE.words.filter(w => w.s === 'known').length, DE.words.length, '') + ring(deLessonsDone(), 30, 'уроков') : ring(lw, WORDS.length, '') + ring(nl, nL, 'уроков')}</div>
      <div class="nums">
        <div class="fr"><div class="frac"><b class="num">${h2(tod)}<i>${tod > yes ? '↑' : tod && tod < yes ? '↓' : ''}</i></b><hr><span>часы</span></div>
          <div class="frac"><b class="num">${h2(tot, 1)}</b><hr><span>total</span></div></div>
        <div class="cal" aria-label="40 дней плана">${cal}</div>
      </div></section>
    <section class="card plan" aria-label="Сегодня">
      <div class="day"><h1 class="num">День ${d}<span>/40</span></h1>${revBtn()}${complete(d) && d < 40 ? `<p style="margin-top:18px"><button class="btn main" id="next">День ${d + 1} →</button></p>` : ''}</div>
      <div class="tasks">${gs.map(g => `<div class="grp"><div class="gh"><span class="eye">${g}</span>${tmr(g)}</div>${T.filter(x => x.g === g).map(row).join('')}</div>`).join('')}</div>
    </section></div>`, 'home', () => {
    setTimeout(() => {
      $$('.pr').forEach(c => c.style.strokeDashoffset = c.dataset.to);
      $$('[data-count]').forEach(el => { const to = +el.dataset.count, t0 = performance.now(); const f = n => { const p = Math.min(1, (n - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    }, 180);
    const tp = $('.top'); let pim = $('.peek img'), pk = $('.pk');
    if (pk) reveal(pk, pim);
    if (tp && pim && matchMedia('(hover:hover)').matches) { tp.onmousemove = e => { const r = tp.getBoundingClientRect(); pim.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5) * -10 + 'px'); pim.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5) * -6 + 'px'); };
      tp.onmouseleave = () => { pim.style.setProperty('--px', '0px'); pim.style.setProperty('--py', '0px'); }; }
    $$('.chk[data-t]').forEach(b => b.onclick = e => { e.stopPropagation(); if (b.disabled) return; const k = b.dataset.t; (S.done[d] ??= {})[k] = !S.done[d][k];
      if (!complete(d)) delete S.doneOn[d]; track(); persist(); b.closest('.task').classList.toggle('done', !!S.done[d][k]); if (complete(d)) setTimeout(() => route(true), 600); });
    $$('[data-timer]').forEach(b => b.onclick = () => { timer(b.dataset.timer); $$('[data-timer]').forEach(o => { const run = S.timer?.s === o.dataset.timer; o.classList.toggle('on', run); o.textContent = run ? '■ стоп' : '▶ таймер'; }); });
    $$('.task[data-go]').forEach(r => r.onclick = e => { if (!e.target.closest('a,button')) location.hash = r.dataset.go; });
    $('#next')?.addEventListener('click', () => { (S.done[d + 1] ??= {})._go = true; persist(); route(); });
  });
}

/* ---------- handwriting cells ---------- */
const sym = new Set();
function symbol(c){ if (sym.has(c) || !CH?.[c]) return; sym.add(c);
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'symbol'); s.id = 'c' + c.codePointAt(0).toString(16); s.setAttribute('viewBox', '0 0 1024 1024');
  s.innerHTML = `<g transform="translate(0,900) scale(1,-1)">${CH[c].s.map(p => `<path d="${p}"/>`).join('')}</g>`; $('#sprite').appendChild(s); }
const G = '<line class="g" x1="512" y1="0" x2="512" y2="1024"/><line class="g" x1="0" y1="512" x2="1024" y2="512"/>';
const wide = () => matchMedia('(min-width:1500px)').matches;
function cells(h, size){ const z = size || (wide() ? 46 : 34);
  return `<span class="cells">${[...h].map(c => CH?.[c] ? (symbol(c), `<span class="cell" style="width:${z}px;height:${z}px"><svg viewBox="0 0 1024 1024">${G}<use class="k" href="#c${c.codePointAt(0).toString(16)}" x="70" y="70" width="884" height="884"/></svg></span>`)
    : `<span class="cell" style="width:${z}px;height:${z}px"><svg viewBox="0 0 1024 1024">${G}</svg><span class="t" style="font-size:${z * .55}px">${esc(c)}</span></span>`).join('')}</span>`; }
let charsP; const loadChars = () => charsP ??= fetch('/l/data/chars.json').then(r => r.json()).then(x => CH = x);

/* ---------- Word List ---------- */
const F = {tab: 'w', day: 0, write: 'all', q: ''};
function wordlist(arg){
  if (S.lang === 'ja') return jaWordlist();
  if (S.lang === 'de') return deWordlist();
  if (arg?.startsWith('d')) F.day = +arg.slice(1);
  if (arg?.startsWith('b')) F.day = 0;
  const seg = (id, val, opts) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;
  show(`<div class="wl">
    <div class="side"><div class="tabs">${[['w', 'Слова'], ['c', 'Иероглифы']].map(([v, l]) => `<button data-tab="${v}" aria-pressed="${F.tab === v}">${l}</button>`).join('')}</div>
      <div class="card filters">
        <label><span class="eye">день</span><select id="fd"><option value="0">все</option>${PLAN.days.filter(x => !x.review).map(x => `<option value="${x.d}" ${F.day === x.d ? 'selected' : ''}>${x.d}</option>`).join('')}</select></label>
        <label><span class="eye">написание</span>${seg('fw', F.write, [['all', 'все'], ['w', 'писать'], ['r', 'узнавать']])}</label>
        <label><span class="eye">поиск</span><input type="text" id="fq" value="${esc(F.q)}" placeholder="pinyin · english"></label>
      </div></div>
    <section class="card list" id="list"></section></div>`, '', () => {
    $$('.tabs button').forEach(b => b.onclick = () => { F.tab = b.dataset.tab; $$('.tabs button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderList(); });
    $('#fd').onchange = e => { F.day = +e.target.value; renderList(); };
    $$('#fw button').forEach(b => b.onclick = () => { F.write = b.dataset.v; $$('#fw button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderList(); });
    $('#fq').oninput = e => { F.q = e.target.value; renderList(); };
    loadChars().then(renderList);
  });
}
const strip = s => s.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').toLowerCase().replace(/[\s']/g, '');
function renderList(){
  const L = $('#list'); if (!L || !CH) return; hideFly(true);
  const q = F.q.trim().toLowerCase();
  let rows, head;
  if (F.tab === 'w') {
    const ws = WORDS.filter(w => (!F.day || w.d === F.day) && (F.write === 'all' || (F.write === 'w') === !!w.a) && (!q || w.h.includes(q) || strip(w.p).includes(strip(q)) || w.e.toLowerCase().includes(q)));
    head = `<div class="lh"><span class="eye">написание</span><span class="eye">чтение</span><span class="eye x">перевод</span><span></span></div>`;
    rows = ws.map(w => ({d: w.d, html: `<div class="row ${learned(w.d) ? 'learned' : ''}" data-h="${esc(w.h)}">${cells(w.h)}<span class="py">${esc(w.p)}</span><span class="en">${esc(w.e)}</span><span>${w.a ? I.pen : ''}</span></div>`}));
  } else {
    const fd = new Map(), act = new Set(WORDS.filter(w => w.a).flatMap(w => [...w.h]));
    for (const w of WORDS) for (const c of w.h) if (CH[c] && !fd.has(c)) fd.set(c, w.d);
    const cs = [...fd].filter(([c, d]) => (!F.day || d === F.day) && (F.write === 'all' || (F.write === 'w') === act.has(c)) && (!q || (CH[c].py || []).some(p => strip(p).includes(strip(q))) || (CH[c].def || '').toLowerCase().includes(q)));
    head = `<div class="lh"><span class="eye">знак</span><span class="eye">чтение</span><span class="eye x">значение</span><span></span></div>`;
    rows = cs.map(([c, d]) => ({d, html: `<div class="row ${learned(d) ? 'learned' : ''}" data-c="${esc(c)}">${cells(c, wide() ? 48 : 36)}<span class="py">${esc((CH[c].py || []).join(', '))}</span><span class="en">${esc(CH[c].def)}</span><span>${act.has(c) ? I.pen : ''}</span></div>`}));
  }
  let h = head, cur = 0;
  for (const r of rows) { if (r.d !== cur) { cur = r.d; h += `<div class="dh"><b>ДЕНЬ ${cur}</b></div>`; } h += r.html; }
  L.innerHTML = h;
  $$('.row', L).forEach(r => { r.onmouseenter = () => { if (matchMedia('(hover:hover)').matches) openFly(r); }; r.onclick = () => openFly(r, true); });
  L.onmouseleave = () => { if (matchMedia('(hover:hover)').matches) hideFly(); };
}
let wrs = [], flyT, flyKey, spoken;
const fly = $('#fly');
fly.onmouseenter = () => clearTimeout(flyT);
fly.onmouseleave = () => hideFly();
document.addEventListener('scroll', () => { if (fly.classList.contains('on') && innerWidth > 860) hideFly(true); }, {passive: true, capture: true});
function hideFly(now){ clearTimeout(flyT); const go = () => { fly.classList.remove('on'); $$('.row.sel').forEach(x => x.classList.remove('sel')); flyKey = null; wrs.forEach(w => { try { w.pauseAnimation(); } catch (e) {} }); };
  now ? go() : (flyT = setTimeout(go, 350)); }
function openFly(r, tap){
  clearTimeout(flyT);
  const key = r.dataset.h || r.dataset.c; if (key === flyKey) return; flyKey = key;
  $$('.row.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel');
  const w = WORDS.find(x => x.h === key) || {h: key, p: (CH[key].py || []).join(', '), e: CH[key].def};
  const chs = [...w.h].filter(c => CH[c]), n = chs.length, wasOn = fly.classList.contains('on');
  fly.innerHTML = `<div class="fh"><button class="play" id="fp" aria-label="Послушать">${I.play}</button><div><b>${esc(w.p)}</b><span>${esc(w.e)}</span></div></div>
    <div class="fchars" style="grid-template-columns:repeat(${Math.min(n, 4) || 1},1fr)">${chs.map((c, i) => `<div class="fchar"><div class="wr" style="max-width:${n > 2 ? 90 : n === 2 ? 140 : 220}px"><svg class="gg" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="50" y1="0" x2="50" y2="100" stroke="var(--dim)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/><line x1="0" y1="50" x2="100" y2="50" stroke="var(--dim)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/></svg><div class="hw" id="hw${i}"></div></div>
      <dl><dt>черт</dt><dd class="num">${CH[c].s.length}</dd><dt>ключ</dt><dd><span class="zh">${esc(CH[c].rad)}</span> ${esc(CH[c].radm)}</dd></dl></div>`).join('')}</div>`;
  if (innerWidth > 860) {
    const L = $('#list').getBoundingClientRect(), R = r.getBoundingClientRect(), hgt = fly.offsetHeight || 320;
    if (!wasOn) fly.style.transition = 'none';
    fly.style.left = Math.min(L.right + 20, innerWidth - 356) + 'px';
    fly.style.top = Math.max(56, Math.min(innerHeight - hgt - 16, R.top - 40)) + 'px';
    if (!wasOn) { void fly.offsetWidth; fly.style.transition = ''; }
  }
  fly.classList.add('on');
  $('#fp').onclick = () => sayW(w.h, $('#fp'));
  wrs.forEach(x => { try { x.pauseAnimation(); } catch (e) {} }); wrs = [];
  if (window.HanziWriter) { const cs = getComputedStyle(document.documentElement);
    chs.forEach((c, i) => { const el = $('#hw' + i), z = el.clientWidth || 140;
      const hw = HanziWriter.create(el, c, {width: z, height: z, padding: z * .07, showCharacter: false, showOutline: true, outlineColor: cs.getPropertyValue('--line').trim(), strokeColor: cs.getPropertyValue('--ink').trim(),
        strokeAnimationSpeed: 1.2, delayBetweenStrokes: 160, delayBetweenLoops: 1400, charDataLoader: (ch, ok) => ok({strokes: CH[ch].s, medians: CH[ch].m, radStrokes: CH[ch].r})});
      setTimeout(() => hw.loopCharacterAnimation(), 250 + i * 450); wrs.push(hw); }); }
  if ((touched || tap) && spoken !== w.h && AMAP.w[w.h]) { spoken = w.h; sayW(w.h, $('#fp')); }
}

/* ---------- Japanese word list (from the user's Anki deck; known = card in review) ---------- */
let JA = null, jaP = null;
const loadJa = () => jaP ??= fetch('/l/data/ja_words.json', {cache: 'no-cache'}).then(r => r.json()).then(x => JA = x).catch(() => {});
const jaLessonsDone = () => { let n = 0; for (let l = 1; l <= 23; l++) { const ws = JA.words.filter(w => w.l === l); if (ws.length && ws.every(w => w.s === 'known')) n++; } return n; };
const JF = {tab: 'w', lesson: 0, st: 'all', q: ''};
const ST = {known: 'выучено', learning: 'учу', new: 'новое'};
/* particles such as (〜を), (person に) are written without brackets */
const PT = /[(（]((?!=)(?:[~〜～][^()（）]*|[^()（）]*[をにがとの]))[)）]/g;
const jaE = e => esc(e).replace(PT, (m, x) => `<span class="pt ja">${x.replace(/[~～]/g, '〜')}</span>`);
const KJ = /[\u3005\u3040-\u30ff\u3400-\u9fff〜～]/;
function jaCells(h, size){ const z = size || (wide() ? 46 : 34); h = h.replace(PT, '$1').replace(/[~～]/g, '〜');   // every sign in a cell of the same size, long words go on to the next line
  return `<span class="cells">${(h.match(/[\u3005\u3040-\u30ff\u3400-\u9fff〜～]|[^\u3005\u3040-\u30ff\u3400-\u9fff〜～]+/g) || []).map(c => !KJ.test(c) ? (c.trim() ? `<span class="lat">${esc(c.trim())}</span>` : '') : `<span class="cell" style="width:${z}px;height:${z}px"><svg viewBox="0 0 1024 1024">${G}</svg><span class="t ja" style="font-size:${z * .62}px">${esc(c)}</span></span>`).join('')}</span>`; }
function jaWordlist(){
  const seg = (id, val, opts) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;
  show(`<div class="wl jp">
    <div class="side"><div class="tabs">${[['w', 'Слова'], ['c', 'Кандзи']].map(([v, l]) => `<button data-tab="${v}" aria-pressed="${JF.tab === v}">${l}</button>`).join('')}</div>
      <div class="card filters">
        <label><span class="eye">урок</span><select id="fl"><option value="0">все</option>${[...Array(23)].map((_, i) => `<option value="${i + 1}" ${JF.lesson === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>
        <label><span class="eye">статус</span>${seg('fs', JF.st, [['all', 'все'], ['known', 'знаю'], ['learn', 'учу']])}</label>
        <label><span class="eye">поиск</span><input type="text" id="fq" value="${esc(JF.q)}" placeholder="かな · english"></label>
      </div></div>
    <section class="card list" id="list"></section></div>`, '', () => {
    $$('.tabs button').forEach(b => b.onclick = () => { JF.tab = b.dataset.tab; $$('.tabs button').forEach(x => x.setAttribute('aria-pressed', x === b)); jaList(); });
    $('#fl').onchange = e => { JF.lesson = +e.target.value; jaList(); };
    $$('#fs button').forEach(b => b.onclick = () => { JF.st = b.dataset.v; $$('#fs button').forEach(x => x.setAttribute('aria-pressed', x === b)); jaList(); });
    $('#fq').oninput = e => { JF.q = e.target.value; jaList(); };
    loadJa().then(jaList);
  });
}
function jaList(){
  const L = $('#list'); if (!L || !JA) return; hideFly(true);
  const src = JF.tab === 'w' ? JA.words : JA.chars, q = JF.q.trim().toLowerCase();
  const list = src.map((w, i) => [w, i]).filter(([w]) => (!JF.lesson || w.l === JF.lesson) && (JF.st === 'all' || (JF.st === 'known' ? w.s === 'known' : w.s !== 'known'))
    && (!q || w.h.includes(q) || (w.r || '').includes(q) || w.e.toLowerCase().includes(q)));
  let h = `<div class="lh"><span class="eye">слово</span><span class="eye">чтение</span><span class="eye x">перевод</span><span></span></div>`, cur = -1;
  for (const [w, i] of list) {
    if (w.l !== cur) { cur = w.l; h += `<div class="dh"><b>УРОК ${cur}</b></div>`; }
    h += `<div class="row ${w.s === 'known' ? 'learned' : ''}" data-ji="${i}">${jaCells(w.h)}<span class="py ja">${esc(w.r.replace(PT, "$1"))}</span><span class="en">${jaE(w.e)}</span><span class="stdot ${w.s}" title="${ST[w.s]}"></span></div>`;
  }
  L.innerHTML = list.length ? h : h + '<p class="mute" style="padding:18px">Ничего не найдено.</p>';
  $$('.row', L).forEach(r => { r.onmouseenter = () => { if (matchMedia('(hover:hover)').matches) jaFly(r, src); }; r.onclick = () => jaFly(r, src); });
  L.onmouseleave = () => { if (matchMedia('(hover:hover)').matches) hideFly(); };
}
function jaFly(r, src){
  clearTimeout(flyT);
  const key = 'ja' + JF.tab + r.dataset.ji; if (key === flyKey) return; flyKey = key;
  $$('.row.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel');
  const w = src[+r.dataset.ji], wasOn = fly.classList.contains('on');
  fly.innerHTML = `<div class="fh"><div><b class="ja" style="font-family:'Klee One',var(--zh);font-size:22px">${esc((w.r || w.h).replace(PT, '$1'))}</b><span>${jaE(w.e)}</span></div></div>
    <div style="padding:18px;display:flex;justify-content:center">${jaCells(w.h, 56).replace('class="cells"', 'class="cells" style="justify-content:center"')}</div>
    ${w.x ? `<div style="padding:0 18px 14px;font-size:13px"><span class="eye">пример</span><p class="ja" style="font-family:'Klee One',var(--zh);font-size:16px;margin-top:4px">${esc(w.x)}</p></div>` : ''}
    <div style="padding:10px 18px 16px;border-top:1px solid var(--line);font-size:12px;color:var(--mute)">${ST[w.s]}${w.s === 'known' ? ` · интервал ${w.iv} дн.` : ''} · урок ${w.l}</div>`;
  if (innerWidth > 860) {
    const L = $('#list').getBoundingClientRect(), R = r.getBoundingClientRect(), hgt = fly.offsetHeight || 260;
    if (!wasOn) fly.style.transition = 'none';
    fly.style.left = Math.min(L.right + 20, innerWidth - 356) + 'px';
    fly.style.top = Math.max(56, Math.min(innerHeight - hgt - 16, R.top - 40)) + 'px';
    if (!wasOn) { void fly.offsetWidth; fly.style.transition = ''; }
  }
  fly.classList.add('on');
}

/* ---------- German word list (Motive A1–B1, 30 lessons; known comes from the «Знаю» column of the xlsx) ---------- */
let DE = null, deP = null;
const deKey = s => strip(s).replace(/ß/g, 'ss');
const loadDe = () => deP ??= fetch('/l/data/de_words.json', {cache: 'no-cache'}).then(r => r.json()).then(x => { x.words.forEach(w => w.k = deKey((w.a || '') + w.h + '|' + (w.p || '') + '|' + w.e)); DE = x; }).catch(() => {});
const deLessonsDone = () => { let n = 0; for (let l = 1; l <= 30; l++) { const ws = DE.words.filter(w => w.l === l); if (ws.length && ws.every(w => w.s === 'known')) n++; } return n; };
const DF = {lesson: 1, st: 'all', q: ''};
const deW = w => `<span class="dw" lang="de">${w.a ? `<i>${esc(w.a)}</i>` : ''}${esc(w.h)}</span>`;
function deWordlist(){
  const seg = (id, val, opts) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;
  show(`<div class="wl de">
    <div class="side"><div class="tabs"><button aria-pressed="true">Слова</button></div>
      <div class="card filters">
        <label><span class="eye">урок</span><select id="fl"><option value="0">все</option>${[...Array(30)].map((_, i) => `<option value="${i + 1}" ${DF.lesson === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>
        <label><span class="eye">статус</span>${seg('fs', DF.st, [['all', 'все'], ['known', 'знаю'], ['learn', 'учу']])}</label>
        <label><span class="eye">поиск</span><input type="text" id="fq" value="${esc(DF.q)}" placeholder="deutsch · русский"></label>
      </div></div>
    <section class="card list" id="list"></section></div>`, '', () => {
    $('#fl').onchange = e => { DF.lesson = +e.target.value; deList(); };
    $$('#fs button').forEach(b => b.onclick = () => { DF.st = b.dataset.v; $$('#fs button').forEach(x => x.setAttribute('aria-pressed', x === b)); deList(); });
    $('#fq').oninput = e => { DF.q = e.target.value; deList(); };
    loadDe().then(deList);
  });
}
function deList(){
  const L = $('#list'); if (!L || !DE || !$('.wl.de')) return; hideFly(true);
  const q = deKey(DF.q.trim());   // a search looks through every lesson
  const list = DE.words.map((w, i) => [w, i]).filter(([w]) => (q || !DF.lesson || w.l === DF.lesson) && (DF.st === 'all' || (DF.st === 'known' ? w.s === 'known' : w.s !== 'known')) && (!q || w.k.includes(q)));
  let h = `<div class="lh"><span class="eye">слово</span><span class="eye pl">мн. число</span><span class="eye x">перевод</span><span></span></div>`, cur = -1;
  for (const [w, i] of list) {
    if (w.l !== cur) { cur = w.l; h += `<div class="dh"><b>УРОК ${cur}</b><span lang="de">${esc(DE.titles[cur])}</span></div>`; }
    h += `<div class="row ${w.s === 'known' ? 'learned' : ''}" data-di="${i}">${deW(w)}<span class="dp" lang="de">${esc(w.p)}</span><span class="en">${esc(w.e)}</span><span class="stdot ${w.s}" title="${ST[w.s]}"></span></div>`;
  }
  L.innerHTML = list.length ? h : h + '<p class="mute" style="padding:18px">Ничего не найдено.</p>'; L.scrollTop = 0;
  $$('.row', L).forEach(r => { r.onmouseenter = () => { if (matchMedia('(hover:hover)').matches) deFly(r); }; r.onclick = () => deFly(r); });
  L.onmouseleave = () => { if (matchMedia('(hover:hover)').matches) hideFly(); };
}
function deFly(r){
  clearTimeout(flyT);
  const key = 'de' + r.dataset.di; if (key === flyKey) return; flyKey = key;
  $$('.row.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel');
  const w = DE.words[+r.dataset.di], wasOn = fly.classList.contains('on');
  const line = (t, v) => v ? `<div style="padding:12px 18px 0;font-size:13.5px"><span class="eye">${t}</span><p style="margin-top:3px;overflow-wrap:anywhere" lang="de">${esc(v)}</p></div>` : '';
  fly.innerHTML = `<div class="fh"><div style="min-width:0"><b class="dw" lang="de" style="overflow-wrap:anywhere;hyphens:auto">${w.a ? `<i>${esc(w.a)}</i>` : ''}${esc(w.h)}</b><span style="color:var(--ink);font-size:14px">${esc(w.e)}</span></div></div>
    ${line('мн. число', w.p)}${line('Австрия / Швейцария', w.v)}
    <div style="padding:12px 18px 16px;${w.p || w.v ? 'margin-top:14px;border-top:1px solid var(--line);' : ''}font-size:12px;color:var(--mute)">${ST[w.s]} · урок ${w.l} · ${esc(w.c)}</div>`;
  if (innerWidth > 860) {
    const L = $('#list').getBoundingClientRect(), R = r.getBoundingClientRect(), hgt = fly.offsetHeight || 200;
    if (!wasOn) fly.style.transition = 'none';
    fly.style.left = Math.min(L.right + 20, innerWidth - 356) + 'px';
    fly.style.top = Math.max(56, Math.min(innerHeight - hgt - 16, R.top - 40)) + 'px';
    if (!wasOn) { void fly.offsetWidth; fly.style.transition = ''; }
  }
  fly.classList.add('on');
}

/* ---------- Lessons: the shell stays, only the centre panel changes ---------- */
let LG = null;
function groupsHtml(act){
  return `<button data-go="#review" aria-pressed="${act === 'review'}"><span>Повторение</span><small class="num">${dueCards().length}</small></button><hr>
  ${PLAN.groups.map(g => { const ls = Object.values(LES).filter(l => l.g === g.id); return `<button data-g="${g.id}" aria-pressed="${act === g.id}"><span>${esc(g.name)}</span><small class="num">${ls.filter(l => passed(l.id)).length}/${ls.length}</small></button>`; }).join('')}
  <hr><button data-go="#pinyin" aria-pressed="${act === 'pinyin'}"><span>Правила пиньиня</span></button>`;
}
/* the centre panel height follows its content, animated */
let panelRO = null;
function fitPanel(P){
  const pv = P.firstElementChild; if (!pv) return; panelRO?.disconnect();
  const set = () => { if (!pv.isConnected) return; const max = P.parentElement.clientHeight; P.style.height = Math.min(pv.offsetHeight + 2, max) + 'px'; };
  set(); panelRO = new ResizeObserver(set); panelRO.observe(pv);
}
function lessonsView(act, build){
  const fill = () => {
    const G = $('#G'); G.innerHTML = groupsHtml(act);
    $$('[data-g]', G).forEach(b => b.onclick = () => { LG = b.dataset.g; location.hash === '#lessons' ? route() : location.hash = 'lessons'; });
    $$('[data-go]', G).forEach(b => b.onclick = () => location.hash = b.dataset.go);
  };
  const P = $('#P');
  if (curSec === 'lessons' && P) {
    fill(); P.firstElementChild?.classList.add('fade');
    setTimeout(() => { P.innerHTML = '<div class="pv fade"></div>'; P.scrollTop = 0; build(P.firstElementChild); fitPanel(P); requestAnimationFrame(() => requestAnimationFrame(() => P.firstElementChild?.classList.remove('fade'))); }, 170);
    return;
  }
  show(`<div class="ls"><div class="side"><div class="card groups" id="G"></div></div><section class="card panel" id="P"><div class="pv"></div></section></div>`, '', () => { fill(); build($('#P').firstElementChild); fitPanel($('#P')); }, 'lessons');
}
function lessons(){
  LG ??= LES[info(curDay()).lessons[0]]?.g || 'base';
  const g = PLAN.groups.find(x => x.id === LG), ls = Object.values(LES).filter(l => l.g === LG).sort((a, b) => a.day - b.day);
  lessonsView(LG, V => { V.innerHTML = `<div class="ph"><span class="eye">группа</span><h1>${esc(g.name)}</h1></div>
    ${ls.map(l => { const t = S.tests[l.id]; return `<a class="lrow ${passed(l.id) ? 'ok' : ''}" href="#lesson-${l.id}"><span class="d num">${String(l.day).padStart(2, '0')}</span><b>${esc(l.title)}</b><span class="s num">${t ? t.best + '/' + t.total : ''}</span></a>`; }).join('')}`; });
}
function lesson(id){
  const L = LES[id]; if (!L) return location.hash = 'lessons'; LG = L.g; const t = S.tests[id];
  lessonsView(L.g, V => {
    V.innerHTML = `<div class="ph"><span class="eye">день ${L.day}</span><h1>${esc(L.title)}</h1></div><div class="body">
    ${L.rules.map(r => `<div><div class="f">${zh(r.f)}</div><p class="m" style="margin:8px 0 6px">${esc(r.m)}</p>${r.ex.map(e => `<div class="ex"><button class="play" data-t="${esc(e[0])}" aria-label="Послушать">${I.play}</button><span class="zh">${esc(e[0])}</span><small>${esc(e[1])}<i>${esc(e[2])}</i></small></div>`).join('')}</div>`).join('')}
    ${L.trap ? `<div class="trap"><s>${zh(L.trap[0])}</s><span>→</span><b>${zh(L.trap[1])}</b><span class="mute">${esc(L.trap[2])}</span></div>` : ''}
    <div><button class="btn main" id="go">Проверка · ${L.q.length}</button>${t ? `<span class="mute" style="margin-left:12px;font-weight:800">${t.best}/${t.total}</span>` : ''}</div></div>`;
    bindPlay(V);
    $('#go', V).onclick = () => quiz(L.q.map((q, k) => ({q, key: id + ':' + k})), {title: L.title, back: '#lesson-' + id,
      end: n => { const p = S.tests[id]; S.tests[id] = {best: Math.max(n, p?.best || 0), last: n, total: L.q.length, att: (p?.att || 0) + 1, date: today()}; if (passed(id)) schedule(id); track(); persist();
        return n >= Math.ceil(L.q.length * .8) ? 'Сдано' : `Нужно ${Math.ceil(L.q.length * .8)}`; }});
  });
}
function review(next){
  const due = dueCards();
  lessonsView('review', V => {
    if (!due.length) { V.innerHTML = `<div class="ph"><span class="eye">повторение</span><h1>На сегодня всё</h1></div>`; return; }
    quiz(due.map(k => ({q: cardQ(k), key: k})), {title: 'Повторение', srs: true, back: next || '#lessons', end: () => { track(); persist(); return 'Готово'; }});
  });
}
function start(){
  const d = curDay(), ls = info(d).lessons, nx = ls.find(id => !passed(id));
  if (dueCards().length) return review(nx ? '#lesson-' + nx : '#home');
  if (!ls.length) { (S.done[d] ??= {}).g1 = true; track(); persist(); location.hash = 'home'; return; }
  location.hash = 'lesson-' + (nx || ls[0]);
}
function pinyin(){
  lessonsView('pinyin', V => { V.innerHTML = `<div class="ph"><span class="eye">справочник</span><h1>${esc(PIN.title)}</h1></div><div class="body">
    ${PIN.sections.map(s => `<div><h2 style="font-size:15px;margin-bottom:8px">${esc(s.title)}</h2>${s.text ? `<div class="m" style="color:var(--ink)">${s.text}</div>` : ''}
      ${s.table ? `<div style="overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;font-size:12.5px"><tr>${s.table.head.map(x => `<th class="eye" style="text-align:left;padding:5px 10px 5px 0;border-bottom:1px solid var(--line)">${esc(x)}</th>`).join('')}</tr>${s.table.rows.map(r => `<tr>${r.map(c => `<td style="padding:5px 10px 5px 0;border-bottom:1px solid var(--line);vertical-align:top">${zh(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
      ${(s.ex || []).map(e => `<div class="ex"><button class="play" data-t="${esc(e[0])}" aria-label="Послушать">${I.play}</button><span class="zh">${esc(e[0])}</span><small>${esc(e[1])}<i>${esc(e[2])}</i></small></div>`).join('')}</div>`).join('')}</div>`; bindPlay(V); });
}

/* ---------- quiz ---------- */
let keyH = null;
const keys = fn => { if (keyH) removeEventListener('keydown', keyH); keyH = fn; if (fn) addEventListener('keydown', fn); };
function quiz(items, o){
  busy = true; const P = $('#P .pv') || $('#P'); let i = 0, ok = 0; const res = [];
  const step = () => {
    if (i >= items.length) { keys(null); busy = false; const msg = o.end(ok);
      P.innerHTML = `<div class="quiz"><span class="eye">${esc(o.title)}</span><span class="big num">${ok}/${items.length}</span><p style="font-weight:800">${esc(msg)}</p><p><a class="btn main" href="${o.back}">Дальше</a></p></div>`;
      refit();
      if (o.back === location.hash) P.querySelector('a').onclick = e => { e.preventDefault(); route(); }; return; }
    const {q, key} = items[i], me = i; let ans = false;
    const next = () => { if (i !== me) return; i++; step(); };
    const fin = (good, extra = '') => { if (ans) return; ans = true; res[i] = good; if (good) ok++; if (o.srs) { grade(key, good); persist(); }
      $('#fb').innerHTML = (good ? '<b>Верно</b> ' : '<b>Неверно</b> ') + extra; bindPlay(P); if (good) setTimeout(next, 900); };
    const opts = (arr, allZh) => { const ord = shuffle(arr.map((x, j) => [x, j])); return [ord, `<div class="opts">${ord.map(([x, j], n) => `<button class="o ${allZh || HAN.test(x) ? 'zh' : ''} in" style="animation-delay:${n * 50}ms" data-j="${j}"><kbd>${n + 1}</kbd><span>${esc(x)}</span></button>`).join('')}</div>`]; };
    let ord = [], body = '';
    if (q.k === 'choice') { const r = opts(q.o); ord = r[0]; body = `<div class="qp">${zh(q.q)}</div>${r[1]}`; }
    if (q.k === 'listen') { const r = opts(q.o); ord = r[0]; body = `<div style="display:flex;gap:14px;align-items:center"><button class="play" id="qa" style="width:52px;height:52px" aria-label="Послушать">${I.play}</button><span class="qp">Что прозвучало?</span></div>${r[1]}`; }
    if (q.k === 'fill') { const r = opts(q.o, true); ord = r[0]; body = `<div class="qp">${esc(q.ru)}</div><div class="qz" id="qz">${esc(q.zh).replace('＿', '<span style="display:inline-block;min-width:48px;border-bottom:2px solid var(--ink)">&nbsp;</span>')}</div>${r[1]}`; }
    if (q.k === 'order') { const all = shuffle([...q.t, ...(q.x || [])]);
      body = `<div class="qp">${esc(q.ru)}</div><div class="tiles" id="ans"></div><div class="tiles pool" id="pool">${all.map((x, n) => `<button class="tile" data-n="${n + 1}"><kbd>${n + 1}</kbd>${esc(x)}</button>`).join('')}</div><p class="hint">цифра — взять · Backspace — убрать · Enter — проверить</p>`; }
    P.innerHTML = `<div class="quiz"><div class="bar">${items.map((_, k) => `<i class="${k < i ? (res[k] ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>${body}<p class="fb" id="fb"></p></div>`;
    const pick = j => { if (ans) return; const good = j === q.a;
      $$('.o', P).forEach(x => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add('right'); }); if (!good) $(`.o[data-j="${j}"]`, P).classList.add('wrong');
      let ex = ''; if (q.k === 'listen') ex = `<span class="zh">${esc(q.zh)}</span>`;
      if (q.k === 'fill') { const full = q.zh.replace('＿', q.o[q.a]); $('#qz').textContent = full; ex = `<button class="play" data-t="${esc(full)}" style="display:inline-grid;vertical-align:middle;width:26px;height:26px" aria-label="Послушать">${I.play}</button>`; }
      fin(good, ex + (good ? '' : ' · Enter — дальше')); };
    refit();
    $$('.o', P).forEach(b => b.onclick = () => pick(+b.dataset.j));
    if (q.k === 'listen') { $('#qa').onclick = () => sayT(q.zh, $('#qa')); if (touched) setTimeout(() => sayT(q.zh, $('#qa')), 200); }
    const check = () => { if (ans) return; const got = $$('#ans .tile', P).map(t => t.lastChild.textContent).join(''), want = q.t.join(''); if (!got) return;
      $$('.tile', P).forEach(t => t.disabled = true);
      fin(got === want, `<span class="zh" style="font-size:17px">${esc(want)}</span> <button class="play" data-t="${esc(want)}" style="display:inline-grid;vertical-align:middle;width:26px;height:26px" aria-label="Послушать">${I.play}</button>${got === want ? '' : ' · Enter — дальше'}`); };
    const move = t => { if (ans) return; ($('#pool').contains(t) ? $('#ans') : $('#pool')).appendChild(t); };
    $$('.tile', P).forEach(t => t.onclick = () => move(t));
    keys(e => { if (e.target.closest?.('input,select,textarea')) return;
      if (ans && e.key === 'Enter') { e.preventDefault(); return next(); }
      if (q.k === 'order') { if (/^[1-9]$/.test(e.key)) { const t = $$('#pool .tile', P).find(x => x.dataset.n === e.key); t && move(t); }
        if (e.key === 'Backspace') { e.preventDefault(); const l = $('#ans').lastElementChild; l && move(l); }
        if (e.key === 'Enter') { e.preventDefault(); check(); } }
      else { const n = +e.key; if (n >= 1 && n <= ord.length) pick(ord[n - 1][1]); if (e.key === ' ' && q.k === 'listen') { e.preventDefault(); sayT(q.zh, $('#qa')); } } });
  };
  step();
}
const refit = () => { const P = $('#P'); if (P && P.firstElementChild) fitPanel(P); };

/* ---------- statistics ---------- */
function stats(){
  track();
  const lw = WORDS.filter(w => learned(w.d)).length, nL = Object.keys(LES).length, nl = Object.keys(LES).filter(passed).length;
  const tot = Object.keys(S.time).reduce((a, k) => a + dayT(k), 0), cards = Object.values(S.srs), n = cards.reduce((a, c) => a + (c.n || 0), 0), okc = cards.reduce((a, c) => a + (c.ok || 0), 0);
  const ds = Object.keys(S.time).sort().slice(-21), mx = Math.max(.5, ...ds.map(d => dayT(d) / 3600)), W = 900, H = 170, bw = Math.min(30, (W - 40) / Math.max(ds.length, 1) - 6);
  let bars = '';
  ds.forEach((d, i) => { let y = H - 20; const x = 30 + i * (bw + 6);
    [['anki', 'var(--ink)'], ['phon', 'var(--mute)'], ['gram', 'var(--dim)']].forEach(([k, c]) => { const hh = sec(d, k) / 3600 / mx * (H - 40); if (hh) { y -= hh; bars += `<rect x="${x}" y="${y}" width="${bw}" height="${hh}" rx="3" fill="${c}"/>`; } });
    bars += `<text x="${x + bw / 2}" y="${H - 5}" text-anchor="middle">${d.slice(8)}.${d.slice(5, 7)}</text>`; });
  show(`<div class="st">
    <div class="card k"><b class="num">${lw}<span>/${WORDS.length}</span></b><span class="eye">слова</span></div>
    <div class="card k"><b class="num">${nl}<span>/${nL}</span></b><span class="eye">уроки</span></div>
    <div class="card k"><b class="num">${h2(tot, 1)}<span> ч</span></b><span class="eye">время</span></div>
    <div class="card k"><b class="num">${n ? Math.round(okc / n * 100) : '—'}<span>${n ? '%' : ''}</span></b><span class="eye">повторение</span></div>
    <div class="card wide"><span class="eye">часы · Anki / фонетика / грамматика</span><div class="chart" style="margin-top:12px">${ds.length ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Часы по дням">${bars}</svg>` : '<p class="mute" style="margin-top:8px">Появится после первого дня.</p>'}</div></div>
    <div class="card wide"><span class="eye">грамматика</span><div style="margin-top:10px">${PLAN.groups.map((g, i) => { const ls = Object.values(LES).filter(l => l.g === g.id), p = ls.filter(l => passed(l.id)).length;
      return `<div class="gb"><span>${esc(g.name)}</span><span class="t"><i style="width:${p / ls.length * 100}%;animation-delay:${200 + i * 60}ms"></i></span><span class="num mute">${p}/${ls.length}</span></div>`; }).join('')}</div></div>
  </div>`);
}

/* ---------- other languages ---------- */
{ const m = $('.menu'), hl = $('.menu .hl');
  const to = el => { hl.style.left = el.offsetLeft + 'px'; hl.style.width = el.offsetWidth + 'px'; hl.style.opacity = 1; };
  $$('.lang', m).forEach(el => el.addEventListener('mouseenter', () => to(el)));
  m.addEventListener('mouseleave', () => { hl.style.opacity = 0; }); }
{ const bw = $('.bw');
  bw.addEventListener('click', () => { bw.classList.add('shut'); document.activeElement?.blur(); });
  bw.addEventListener('mouseleave', () => bw.classList.remove('shut')); }
/* German and Japanese reuse the Mandarin site as a template for now: the switch renames the site.
   On bedarev.com/l/ every language has its own address (data-site is set there); on claude.ai it is only a state. */
const LANGS = {zh: 'mandarin', de: 'german', ja: 'japanese'}, LK = Object.keys(LANGS);
const SITE = document.documentElement.dataset.site;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden;
function setLang(k){
  S.lang = LANGS[k] ? k : 'zh';
  document.title = LANGS[S.lang][0].toUpperCase() + LANGS[S.lang].slice(1);
  $$('.lang[data-lang]').forEach(a => a.classList.toggle('on', a.dataset.lang === S.lang));
}
/* the title rolls letter by letter: the old word leaves upwards, the new one comes from below (or the other way round) */
let brandN = 0;
function brandTo(name, dir){
  const b = $('nav .brand'), me = ++brandN; b.getAnimations().forEach(a => a.cancel());
  if (!dir || calm()) { b.textContent = name; return; }
  const spans = t => [...t].map(c => `<i aria-hidden="true">${c}</i>`).join(''), w0 = b.offsetWidth;
  b.setAttribute('aria-label', name); b.innerHTML = spans(b.textContent);
  $$('i', b).forEach((el, i) => el.animate([{transform: 'none', opacity: 1}, {transform: `translateY(${-115 * dir}%) rotate(${-8 * dir}deg)`, opacity: 0}], {duration: 190, delay: i * 14, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards'}));
  setTimeout(() => { if (me !== brandN) return;
    b.innerHTML = spans(name); const w1 = b.offsetWidth;
    b.animate([{width: w0 + 'px'}, {width: w1 + 'px'}], {duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)'});
    $$('i', b).forEach((el, i) => el.animate([{transform: `translateY(${115 * dir}%) rotate(${8 * dir}deg)`, opacity: 0}, {transform: 'none', opacity: 1}], {duration: 520, delay: i * 32, easing: 'cubic-bezier(.2,1.1,.3,1)', fill: 'backwards'}));
    setTimeout(() => { if (me === brandN) b.textContent = name; }, 560 + name.length * 32);
  }, 230);
}
/* the page: the old one slides away and blurs, the new cards arrive one after another from the other side */
let switching = false, swN = 0;
function switchLang(k, push){
  if (!LANGS[k]) return;
  if (k === S.lang && !switching) { if (push) { if (location.hash && location.hash !== '#home') location.hash = 'home'; else route(); } return; }
  const dir = LK.indexOf(k) > LK.indexOf(S.lang) ? 1 : -1, me = ++swN, quiet = calm();
  switching = true; setLang(k); persist(); brandTo(LANGS[k], dir); hideFly(true); keys(null);
  if (push) try { history.pushState(null, '', (SITE ? '/l/' + LANGS[k] + '/' : location.pathname + location.search) + (SITE ? '' : '#home')); } catch (e) {}
  const out = quiet ? null : app.animate([{opacity: 1, transform: 'none', filter: 'blur(0)'}, {opacity: 0, transform: `translateX(${-90 * dir}px) scale(.97)`, filter: 'blur(12px)'}], {duration: 240, easing: 'cubic-bezier(.5,0,.85,.3)', fill: 'forwards'});
  setTimeout(() => { if (me !== swN) return;
    switching = false; route(true); out?.cancel(); app.getAnimations().forEach(a => a.cancel());
    if (quiet) return;
    const box = app.firstElementChild, els = box ? ($('.top', box) ? [$('.top', box), $('.plan', box)] : [...box.children]) : [];
    els.forEach((el, i) => el.animate([{opacity: 0, transform: `translateX(${130 * dir}px) scale(.97)`, filter: 'blur(14px)'}, {opacity: 1, transform: 'none', filter: 'blur(0)'}], {duration: 720, delay: i * 110, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'}));
    $$('.task', box).forEach((el, i) => el.animate([{opacity: 0, transform: `translateX(${46 * dir}px)`}, {opacity: 1, transform: 'none'}], {duration: 560, delay: 260 + i * 55, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'}));
  }, quiet ? 0 : 235);
}
$$('.lang[data-lang]').forEach(a => { const k = a.dataset.lang; a.href = SITE ? '/l/' + LANGS[k] + '/' : '#home';
  a.addEventListener('click', e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); $('.bw').blur?.(); document.activeElement?.blur(); switchLang(k, true); }); });
if (SITE) addEventListener('popstate', () => { const k = LK.find(x => location.pathname.startsWith('/l/' + LANGS[x])); if (k && k !== S.lang) switchLang(k, false); });
setLang(SITE || S.lang || 'zh'); brandTo(LANGS[S.lang]);

/* ---------- settings ---------- */
const pop = $('#pop');
$('#gear').onclick = e => { e.stopPropagation(); pop.classList.toggle('hide'); };
$$('#th button').forEach(b => b.onclick = () => { S.settings.theme = b.dataset.v; theme(); persist(); hideFly(true); });
$$('#gi button').forEach(b => { b.setAttribute('aria-pressed', (b.dataset.v === '1') === (S.settings.girl !== false)); b.onclick = () => setGirl(b.dataset.v === '1'); });
document.addEventListener('click', e => { if (!pop.contains(e.target) && e.target.id !== 'gear') pop.classList.add('hide'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { pop.classList.add('hide'); hideFly(true); } });

/* ---------- router ---------- */
function route(silent){
  if (!PLAN || switching) return;
  const h = decodeURIComponent(location.hash.slice(1)) || 'home';
  const tab = /^(lesson|pinyin|review|start)/.test(h) ? 'lessons' : h.startsWith('words') ? 'words' : h;
  $$('nav a[data-tab]').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  keys(null); busy = false; hideFly(true);
  if (silent) { first = true; curSec = ''; }
  if (h.startsWith('words')) return wordlist(h.split('-')[1]);
  if (h === 'lessons') return lessons();
  if (h.startsWith('lesson-')) return lesson(h.slice(7));
  if (h === 'pinyin') return pinyin();
  if (h === 'review') return review();
  if (h === 'start') return start();
  if (h === 'stats') return stats();
  home();
}
addEventListener('hashchange', () => route());
Promise.all(['/l/data/plan.json', '/l/data/words.json', '/l/data/lessons.json', '/l/data/pinyin.json', '/l/audio/map.json'].map(u => fetch(u, {cache: 'no-cache'}).then(r => r.json())))
  .then(([p, w, l, pin, am]) => { PLAN = p; WORDS = w.words; LES = l.lessons; PIN = pin; AMAP = am; route(); loadChars(); loadJa().then(() => { if (S.lang === 'ja' && !busy) route(true); }); loadDe().then(() => { if (S.lang === 'de' && !busy && !$('.wl.de')) route(true); }); })
  .catch(() => { app.innerHTML = '<p class="mute" style="text-align:center;margin-top:30vh">Не удалось загрузить данные. Обнови страницу.</p>'; });
})();
