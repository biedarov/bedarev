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
  store = {save: s => ref.set(JSON.parse(JSON.stringify(s)))}; theme(); setLang(SITE || S.lang || 'zh'); brandTo(LANGS[S.lang]); if (!busy && PLAN) refresh();
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
const PLAN_START = '2026-11-23', dateOfDay = d => addDays(PLAN_START, d - 1);
const dIdx = (a, b) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 864e5);
const schedDay = () => Math.max(1, Math.min(40, dIdx(PLAN_START, today()) + 1));   // the plan day that falls on today
const words = d => WORDS.filter(w => w.d === d);
function tasks(d){
  const x = info(d), T = [], ph = PLAN.phonetics;
  if (d <= ph.days[1]) {
    const gs = (ph.schedule[String(d)] || []).map(n => ph.groups[n - 1]), st = ((d - 1) * ph.syllables.perDay) % ph.syllables.minutes;
    const s1 = gs.reduce((a, g) => a + (g.sec || 0), 0);
    T.push({id: 'ph1', g: 'Фонетика', t: gs.length ? 'Звуки · группы ' + gs.map(g => g.n).join(' и ') : 'Звуки · трудная группа', links: (gs.length ? gs : ph.groups).map(g => [g.video, 'гр. ' + g.n]), sec: s1, note: s1 ? Math.round(s1 / 60) + ' мин' : ''});
    T.push({id: 'ph2', g: 'Фонетика', t: `Слоги · ${st}:00–${st + 10}:00`, links: [[ph.syllables.video + '&t=' + st * 60 + 's', 'видео']], sec: ph.syllables.perDay * 60, note: ph.syllables.perDay + ' мин'});
  }
  const n = words(d).length, b = PLAN.blocks.find(b => d >= b.days[0] && d <= b.days[1]);
  const AL = S.lang === 'zh' && akOn() ? AK.langs.zh : null, own = d <= schedDay(), dk = AL?.days?.[d];   // Anki says what is done
  if (AL && own && AL.due === 0 && AL.rated > 0) (S.done[d] ??= {}).a1 = true;
  if (dk && n && dk.nw === 0 && dk.tot > 0) (S.done[d] ??= {}).a2 = true;
  T.push({id: 'a1', g: 'Лексика', t: 'Anki · повторения', note: AL && own ? (AL.due ? `осталось ${AL.due}` : 'готово в Anki') : ''});
  T.push({id: 'a2', g: 'Лексика', t: n ? `Anki · ${n} новых слов` : 'Повтори слова недели', go: n ? `#words-d${d}` : `#words-b${b.n}`, note: dk && n && dk.nw ? `осталось ${dk.nw}` : ''});
  T.push({id: 'a3', g: 'Лексика', t: x.chars ? `Пропись · ${[...x.chars].length} иероглифов` : 'Пропись недели', go: x.chars ? `#words-d${d}` : `#words-b${b.n}`});
  const due = gramDueN('zh');
  T.push({id: 'g1', g: 'Грамматика', auto: true, t: x.lessons.length ? x.lessons.map(id => LES[id].title.split(' — ')[0]).join(' · ') : 'Повторение грамматики', note: due ? `↻ ${due}` : '', go: due || x.lessons.some(id => !passed(id)) ? '#s' : '#lessons'});
  return T;
}
const gramDone = d => info(d).lessons.length ? info(d).lessons.every(passed) : !!S.done[d]?.g1;
const done = (d, t) => t.auto ? gramDone(d) : !!S.done[d]?.[t.id];
const frac = d => { const T = tasks(d); return T.filter(t => done(d, t)).length / T.length; };
const complete = d => frac(d) >= 1;
function curDay(){ for (let d = 1; d <= 40; d++) { if (!complete(d)) return d; if (S.doneOn[d] === today() && d < 40 && !S.done[d + 1]?._go && dateOfDay(d + 1) > today()) return d; } return 40; }
function track(){ const d = curDay(); if (complete(d) && !S.doneOn[d]) S.doneOn[d] = today(); }
const learned = d => !!S.done[d]?.a2;

/* ---------- time ---------- */
const sec = (date, k) => (S.time[date]?.[k] || 0) + (S.timer?.s === k && date === today() ? (Date.now() - S.timer.at) / 1000 : 0);
const dayT = date => ['anki', 'phon', 'gram'].reduce((a, k) => a + sec(date, k), 0);
const h2 = (s, p = 2) => (s / 3600).toFixed(p);
const add = (k, s) => { const t = today(); (S.time[t] ??= {})[k] = (S.time[t][k] || 0) + s; };
function timer(k){ if (S.timer) { add(S.timer.s, (Date.now() - S.timer.at) / 1000); const same = S.timer.s === k; S.timer = null; if (same) return persist(); } S.timer = {s: k, at: Date.now()}; persist(); }
let tk = Date.now();
setInterval(() => { if (document.visibilityState === 'visible' && /^#(s|t-|lessons|jsheet|jmap|pinyin)/.test(location.hash)) { add('gram', (Date.now() - tk) / 1000); persist(); } tk = Date.now(); }, 5000);

/* ---------- view swap: one crossfade between sections ---------- */
let first = true, curSec = '';
let QUIET = false;   // true while a refresh repaints the page the user is already looking at
const refresh = () => { QUIET = true; try { route(true); } finally { QUIET = false; } };
function show(html, cls = '', after, sec = ''){
  curSec = sec;
  let painted = false;
  const paint = () => { if (painted) return; painted = true; app.className = cls; app.classList.toggle('still', QUIET); app.innerHTML = html; after?.(); };
  if (first || !document.startViewTransition || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { first = false; return paint(); }
  try { const vt = document.startViewTransition(paint); vt.updateCallbackDone?.catch(paint); vt.finished?.catch(() => {}); vt.ready?.catch(() => {}); } catch (e) { paint(); }
  setTimeout(paint, 400);   // safety net: the page is drawn even if the browser skips the transition
}

/* ---------- grammar line on the home page ---------- */
function revBtn(){
  const n = gramDueN('zh');
  if (n) return `<p><a class="rev" href="#s">${RV}<span>Повторение грамматики</span><em class="num">${n}</em></a></p>`;
  const nx = Object.values(gMem('zh').cards).map(c => c.due).sort((a, b) => a - b)[0];
  return '';
}
const RV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>';

/* ---------- illustration ---------- */
const GIRL = {zh: '/l/img/girl_zh.webp', de: '/l/img/girl_de2.webp', ja: '/l/img/girl_ja.webp'};
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
/* Japanese has no 40-day plan: the right card is today's grammar (Genki's day queue) */
function jaHomePlan(){
  if (!JG) { loadJg().then(() => { if (JG && S.lang === 'ja' && /^#?(home)?$/.test(location.hash.replace('#', ''))) route(true); });
    return `<section class="card plan" aria-label="Сегодня"><div class="day"><h1>Грамматика</h1><p class="mute" style="margin-top:8px">Загружаю…</p></div></section>`; }
  const P = gPlanHead(), m = gMem('ja'), next = [...P.due.map(t => [t, 'повтор']), ...P.nw.map(t => [t, 'новая'])].slice(0, JA_MAX);   // 7 tasks a day in all: 3 Anki + 4 topics
  const jd = jaCur(), debt = jaSched() - jd;
  // Anki: reviews, and today's share of the words still new so that all are started by 1 January
  const A = akOn() ? AK.langs.ja : null, dl = Math.max(1, dIdx(today(), JA_END) + 1), wt = A && A.wNew != null ? Math.ceil((A.wNew + A.wIntro) / dl) : null, kt = A && A.kNew != null ? Math.ceil((A.kNew + A.kIntro) / dl) : null;
  const row = (done, title, note) => `<div class="task ${done ? 'done' : ''}"><button class="chk" disabled aria-label="${esc(title)}">${I.chk}</button><b>${title}</b><span class="r"><span>${note}</span></span></div>`;
  const ak = A ? row(A.due === 0 && A.rated > 0, 'Anki · повторения', A.due ? 'осталось ' + A.due : 'готово') + (wt != null ? row(A.wIntro >= wt, `Anki · ${wt} новых слов`, A.wIntro >= wt ? 'готово' : 'осталось ' + (wt - A.wIntro)) : '')
      + (kt ? row(A.kIntro >= kt, `Anki · ${kt} ${pl(kt, 'новый кандзи', 'новых кандзи', 'новых кандзи')}`, A.kIntro >= kt ? 'готово' : 'осталось ' + (kt - A.kIntro)) : '')
    : row(false, 'Anki', 'открой Anki на компьютере');
  return `<section class="card plan" aria-label="Сегодня">
    <div class="day"><h1 class="num">День ${jaCur()}<span>/${JA_DAYS}</span></h1><p class="mute" style="margin-top:8px">${P.head} · ${P.sub}</p>
      <p style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">${P.due.length + P.nw.length ? `<a class="btn main" href="#s">${P.did ? 'Продолжить' : 'Начать'}</a>` : ''}<a class="btn" href="#lessons">Все темы</a></p></div>
    <div class="tasks"><div class="grp"><div class="gh"><span class="eye">лексика</span></div>${ak}</div>
      <div class="grp q"><div class="gh"><span class="eye">${next.length ? 'грамматика на очереди' : 'грамматика'}</span></div>
      ${next.length ? next.map(([t, k]) => { const c = m.cards[t.id]; return `<a class="task" href="#t-${t.id}"><span class="gc ${c ? memClass(memOf(c)) : ''}" style="flex:none"></span><b>${rich(t.t)}</b><span class="r">${k === 'новая' ? '' : `<span>${k}${c ? ' · ' + pct(memOf(c)) + '%' : ''}</span>`}</span></a>`; }).join('')
        : `<p class="mute" style="font-size:13px">${learnedN('ja')} из ${gTopics('ja').length} тем пройдено.</p>`}</div></div></section>`;
}
/* German: dated plan to 31 December — Anki words and Grammatik aktiv topics */
function deHomePlan(){
  if (!DG) { loadDg().then(() => { if (DG && S.lang === 'de' && /^#?(home)?$/.test(location.hash.replace('#', ''))) route(true); });
    return `<section class="card plan" aria-label="Сегодня"><div class="day"><h1>Грамматика</h1><p class="mute" style="margin-top:8px">Загружаю…</p></div></section>`; }
  const P = gPlanHead(), m = gMem('de'), next = [...P.due.map(t => [t, 'повтор']), ...P.nw.map(t => [t, 'новая'])].slice(0, JA_MAX);
  const A = akOn() ? AK.langs.de : null, wt = A && A.wNew != null ? akTargets(AK).de : null;
  const row = (done, title, note) => `<div class="task ${done ? 'done' : ''}"><button class="chk" disabled aria-label="${esc(title)}">${I.chk}</button><b>${title}</b><span class="r"><span>${note}</span></span></div>`;
  const ak = A ? row(A.due === 0 && A.rated > 0, 'Anki · повторения', A.due ? 'осталось ' + A.due : 'готово') + (wt != null ? row(A.wIntro >= wt, `Anki · ${wt} новых слов`, A.wIntro >= wt ? 'готово' : 'осталось ' + (wt - A.wIntro)) : '')
    : row(false, 'Anki', 'открой Anki на компьютере');
  return `<section class="card plan" aria-label="Сегодня">
    <div class="day"><h1 class="num">День ${deCur()}<span>/${DE_DAYS}</span></h1><p class="mute" style="margin-top:8px">${P.head} · ${P.sub}</p>
      <p style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">${P.due.length + P.nw.length ? `<a class="btn main" href="#s">${P.did ? 'Продолжить' : 'Начать'}</a>` : ''}<a class="btn" href="#lessons">Все темы</a></p></div>
    <div class="tasks"><div class="grp"><div class="gh"><span class="eye">лексика</span></div>${ak}</div>
      <div class="grp q"><div class="gh"><span class="eye">${next.length ? 'грамматика на очереди' : 'грамматика'}</span></div>
      ${next.length ? next.map(([t, k]) => { const c = m.cards[t.id]; return `<a class="task" href="#t-${t.id}"><span class="gc ${c ? memClass(memOf(c)) : ''}" style="flex:none"></span><b>${esc(t.t)}</b><span class="r">${k === 'новая' ? '' : `<span>${k}${c ? ' · ' + pct(memOf(c)) + '%' : ''}</span>`}</span></a>`; }).join('')
        : `<p class="mute" style="font-size:13px">${learnedN('de')} из ${gTopics('de').length} тем пройдено.</p>`}</div></div></section>`;
}
/* phone: the queue shows as many whole rows as the screen holds (desktop: 7) */
function fitQ(){
  const g = $('.grp.q'); if (!g) return; const ts = [...g.querySelectorAll('.task')];
  ts.forEach((t, i) => t.style.display = innerWidth > 600 && i >= 7 ? 'none' : '');
  if (innerWidth > 600) return;
  const bot = g.getBoundingClientRect().bottom; ts.forEach(t => { if (t.getBoundingClientRect().bottom > bot + 1) t.style.display = 'none'; });
}
addEventListener('resize', () => fitQ());
function home(){
  track();
  const d = curDay(), T = tasks(d), lw = WORDS.filter(wKnown).length, nL = Object.keys(LES).length, nl = Object.keys(LES).filter(passed).length;
  const t = today(), tod = dayT(t), yes = dayT(addDays(t, -1)), tot = Object.keys(S.time).reduce((a, k) => a + dayT(k), 0);
  const ring = (v, max, lab) => { const r = 70, C = 2 * Math.PI * r; return `<div class="ring"><svg viewBox="0 0 156 156"><circle class="tr" cx="78" cy="78" r="${r}"/><circle class="pr" cx="78" cy="78" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-to="${C * (1 - Math.min(1, v / max))}"/></svg><div class="c"><b class="num" data-count="${v}">0</b>${lab ? `<small>${lab}</small>` : ''}</div></div>`; };
  const cal = PLAN.days.map(x => { const f = frac(x.d), bg = f >= 1 ? 'var(--ink)' : f > 0 ? `color-mix(in srgb,var(--ink) ${Math.round(20 + f * 50)}%,var(--c2))` : '';
    return `<i class="${f > 0 ? 'f' : ''} ${x.d === d ? 'cur' : ''}" style="animation-delay:${300 + x.d * 12}ms;${bg ? 'background:' + bg : ''}" title="День ${x.d}"></i>`; }).join('');
  // today's day by the date; what is left of earlier days comes first (one «Anki · повторения» for all); 7 tasks at most
  const D = d, Q = tasks(d).map(x => ({...x, k: d}));   // the first unfinished day; the next one opens when it is done
  const QS = Q.slice(0, 7), gs = [...new Set(QS.map(x => x.g))];
  const row = x => `<div class="task ${done(x.k, x) ? 'done' : ''}" data-g="${x.g}" ${x.go ? `data-go="${x.go}"` : ''}><button class="chk" data-t="${x.id}" data-d="${x.k}" ${x.auto ? 'disabled' : ''} aria-label="${esc(x.t)}">${I.chk}</button><b>${esc(x.t)}</b>
      <span class="r">${x.k < D ? `<span class="dk">день ${x.k}</span>` : ''}${x.note ? `<span>${x.note}</span>` : ''}${(x.links || []).map(([u, l]) => `<a class="mini" href="${esc(u)}" target="_blank" rel="noopener">${l}</a>`).join('')}</span></div>`;
  const tmr = g => { const s = {Лексика: 'anki'}[g]; if (!s) return ''; const run = S.timer?.s === s; return `<button class="mini ${run ? 'on' : ''}" data-timer="${s}">${run ? '■ стоп' : '▶ таймер'}</button>`; };
  show(`<div class="stack ${S.lang === 'ja' || S.lang === 'de' ? 'jah' : ''}">
    <section class="card top ${S.settings.girl === false ? 'nogirl' : ''}" aria-label="Статистика">${S.settings.girl === false ? '' : peek()}
      <div class="rings">${S.lang === 'ja' && JA ? ring(JA.words.filter(w => w.s === 'known').length, JA.words.length, '') + ring(JG ? learnedN('ja') : 0, 137, 'тем') : S.lang === 'de' && DE ? ring(DE.words.filter(w => w.s === 'known').length, DE.words.length, '') + ring(DG ? learnedN('de') : 0, 80, 'тем') : ring(lw, WORDS.length, '') + ring(nl, nL, 'уроков')}</div>
      <div class="nums">
        <div class="fr"><div class="frac"><b class="num">${h2(tod, innerWidth <= 600 ? 1 : 2)}<i>${tod > yes ? '↑' : tod && tod < yes ? '↓' : ''}</i></b><hr><span>часы</span></div>
          <div class="frac"><b class="num">${h2(tot, 1)}</b><hr><span>total</span></div></div>
        ${calHtml()}
      </div></section>
    ${S.lang === 'ja' ? jaHomePlan() : S.lang === 'de' ? deHomePlan() : `<section class="card plan" aria-label="Сегодня">
      <div class="day"><h1 class="num">День ${D}<span>/40</span></h1><div class="dprog"><b><i style="width:${Math.round(frac(D) * 100)}%"></i></b><span class="num">${T.filter(x => done(d, x)).length} из ${T.length}</span></div>${revBtn()}${complete(d) && d < 40 ? `<p style="margin-top:18px"><button class="btn main" id="next">День ${d + 1} →</button></p>` : ''}</div>
      <div class="tasks">${gs.map(g => `<div class="grp" style="--n:${QS.filter(x => x.g === g).length}"><div class="gh"><span class="eye">${g}</span>${tmr(g)}</div>${QS.filter(x => x.g === g).map(row).join('')}</div>`).join('')}
        </div>
    </section>`}</div>`, 'home', () => {
    if (app.classList.contains('still')) { $$('.pr').forEach(c => c.style.strokeDashoffset = c.dataset.to); $$('[data-count]').forEach(el => el.textContent = el.dataset.count); }
    else setTimeout(() => {
      $$('.pr').forEach(c => c.style.strokeDashoffset = c.dataset.to);
      $$('[data-count]').forEach(el => { const to = +el.dataset.count, t0 = performance.now(); const f = n => { const p = Math.min(1, (n - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    }, 180);
    fitQ();
    const tp = $('.top'); let pim = $('.peek img'), pk = $('.pk');
    if (pk) reveal(pk, pim);
    if (tp && pim && matchMedia('(hover:hover)').matches) { tp.onmousemove = e => { const r = tp.getBoundingClientRect(); pim.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5) * -10 + 'px'); pim.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5) * -6 + 'px'); };
      tp.onmouseleave = () => { pim.style.setProperty('--px', '0px'); pim.style.setProperty('--py', '0px'); }; }
    $$('.chk[data-t]').forEach(b => b.onclick = e => { e.stopPropagation(); if (b.disabled) return; const k = b.dataset.t, dd = +b.dataset.d, on = !S.done[dd]?.[k];
      for (let j = k === 'a1' ? d : dd; j <= dd; j++) { (S.done[j] ??= {})[k] = on; if (!complete(j)) delete S.doneOn[j]; }   // «повторения» counts for every owed day
      const tk = tasks(dd).find(x => x.id === k), tt = today(); if (tk?.sec) { (S.time[tt] ??= {}); S.time[tt].phon = Math.max(0, (S.time[tt].phon || 0) + (on ? tk.sec : -tk.sec)); }   // a watched video counts its length
      track(); persist(); b.closest('.task').classList.toggle('done', on); setTimeout(() => route(true), 500); });
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
function cells(h, size){ const z = size || (wide() ? 36 : 28);
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
    rows = ws.map(w => ({d: w.d, k: wKnown(w), html: `<div class="row ${wKnown(w) ? 'learned' : ''}" data-h="${esc(w.h)}">${cells(w.h)}<span class="py">${esc(w.p)}</span><span class="en">${esc(w.e)}</span><span>${w.a ? I.pen : ''}</span></div>`}));
  } else {
    const fd = new Map(), act = new Set(WORDS.filter(w => w.a).flatMap(w => [...w.h]));
    for (const w of WORDS) for (const c of w.h) if (CH[c] && !fd.has(c)) fd.set(c, w.d);
    const cs = [...fd].filter(([c, d]) => (!F.day || d === F.day) && (F.write === 'all' || (F.write === 'w') === act.has(c)) && (!q || (CH[c].py || []).some(p => strip(p).includes(strip(q))) || (CH[c].def || '').toLowerCase().includes(q)));
    head = `<div class="lh"><span class="eye">знак</span><span class="eye">чтение</span><span class="eye x">значение</span><span></span></div>`;
    rows = cs.map(([c, d]) => ({d, k: learned(d), html: `<div class="row ${learned(d) ? 'learned' : ''}" data-c="${esc(c)}">${cells(c, wide() ? 38 : 30)}<span class="py">${esc((CH[c].py || []).join(', '))}</span><span class="en">${esc(CH[c].def)}</span><span>${act.has(c) ? I.pen : ''}</span></div>`}));
  }
  const cnt = {}; rows.forEach(r => cnt[r.d] = (cnt[r.d] || 0) + 1); const kn = rows.filter(r => r.k).length;
  let h = `<div class="wct"><b>${rows.length}</b> ${F.tab === 'w' ? pl(rows.length, 'слово', 'слова', 'слов') : pl(rows.length, 'знак', 'знака', 'знаков')} · <span class="tok">выучено ${kn}</span></div>` + head, cur = 0;
  for (const r of rows) { if (r.d !== cur) { cur = r.d; h += `<div class="dh"><b>ДЕНЬ ${cur}</b><span>${cnt[cur]}</span></div>`; } h += r.html; }
  L.innerHTML = h;
  $$('.row', L).forEach(r => { r.onmouseenter = () => { if (matchMedia('(hover:hover)').matches) openFly(r); }; r.onclick = () => openFly(r, true); });
  L.onmouseleave = () => { if (matchMedia('(hover:hover)').matches) hideFly(); };
}
let wrs = [], flyT, flyKey;
const fly = $('#fly');
fly.onmouseenter = () => clearTimeout(flyT);
fly.onmouseleave = () => hideFly();
document.addEventListener('scroll', () => { if (fly.classList.contains('on') && innerWidth > 860) hideFly(true); }, {passive: true, capture: true});
function hideFly(now){ clearTimeout(flyT); const go = () => { fly.classList.remove('on'); $$('.row.sel').forEach(x => x.classList.remove('sel')); flyKey = null; wrs.forEach(w => { try { w.pauseAnimation(); } catch (e) {} }); };
  now ? go() : (flyT = setTimeout(go, 350)); }
function openFly(r, tap){
  clearTimeout(flyT);
  const key = r.dataset.h || r.dataset.c;
  if (key === flyKey) { if (tap && AMAP?.w[key]) sayW(key, $('#fp')); return; }   // a click on the open row plays it again
  flyKey = key;
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
  if (tap && AMAP?.w[w.h]) sayW(w.h, $('#fp'));   // sound only on a click in the row, never on hover
}

/* ---------- Japanese word list (from the user's Anki deck; known = card in review) ---------- */
let JA = null, jaP = null;
const loadJa = () => jaP ??= fetch('/l/data/ja_words.json', {cache: 'no-cache'}).then(r => r.json()).then(x => { x.words.sort((a, b) => a.l - b.l); x.chars.sort((a, b) => a.l - b.l); JA = x; akApply(); }).catch(() => {});
const jaLessonsDone = () => { let n = 0; for (let l = 1; l <= 23; l++) { const ws = JA.words.filter(w => w.l === l); if (ws.length && ws.every(w => w.s === 'known')) n++; } return n; };
const JF = {tab: 'w', lesson: 0, st: 'all', q: ''};
const ST = {known: 'выучено', learning: 'учу', new: 'новое'};
/* particles such as (〜を), (person に) are written without brackets */
const PT = /[(（]((?!=)(?:[~〜～][^()（）]*|[^()（）]*[をにがとの]))[)）]/g;
const jaE = e => esc(e).replace(PT, (m, x) => `<span class="pt ja">${x.replace(/[~～]/g, '〜')}</span>`);
const KJ = /[\u3005\u3040-\u30ff\u3400-\u9fff〜～]/;
function jaCells(h, size){ const z = size || (wide() ? 36 : 28); h = h.replace(PT, '$1').replace(/[~～]/g, '〜');   // every sign in a cell of the same size, long words go on to the next line
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
  const cnt = {}; list.forEach(([w]) => cnt[w.l] = (cnt[w.l] || 0) + 1);
  let h = `<div class="wct"><b>${list.length}</b> ${JF.tab === 'w' ? pl(list.length, 'слово', 'слова', 'слов') : 'кандзи'} · <span class="tok">выучено ${list.filter(([w]) => w.s === 'known').length}</span></div><div class="lh"><span class="eye">слово</span><span class="eye">чтение</span><span class="eye x">перевод</span><span></span></div>`, cur = -1;
  for (const [w, i] of list) {
    if (w.l !== cur) { cur = w.l; h += `<div class="dh"><b>УРОК ${cur}</b><span>${cnt[cur]}</span></div>`; }
    h += `<div class="row ${w.s === 'known' ? 'learned' : ''} ${w.r ? '' : 'nr'}" data-ji="${i}">${jaCells(w.h)}${w.r ? `<span class="py ja">${esc(w.r.replace(PT, "$1"))}</span>` : ''}<span class="en">${jaE(w.e)}</span><span class="stdot ${w.s}" title="${ST[w.s]}"></span></div>`;
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
  const cnt = {}; list.forEach(([w]) => cnt[w.l] = (cnt[w.l] || 0) + 1);
  let h = `<div class="wct"><b>${list.length}</b> ${pl(list.length, 'слово', 'слова', 'слов')} · <span class="tok">выучено ${list.filter(([w]) => w.s === 'known').length}</span></div><div class="lh"><span class="eye">слово</span><span class="eye pl">мн. число</span><span class="eye x">перевод</span><span></span></div>`, cur = -1;
  for (const [w, i] of list) {
    if (w.l !== cur) { cur = w.l; h += `<div class="dh"><b>УРОК ${cur}</b><span lang="de">${esc(DE.titles[cur])}</span><span class="num">· ${cnt[cur]}</span></div>`; }
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
/* ---------- grammar: Genki's system in both languages ----------
   Every topic (zh: a lesson of the 40-day plan, ja: a Genki topic) has an FSRS-5 memory card.
   «Сегодня» = reviews due (weakest first) + new topics; a new topic is read, then all its questions;
   a review asks part of them. The share right on the first try sets the grade — no self-rating:
   <60% «не закрепилось» (back at the end of the session), <80% «слабо», <100% «хорошо», 100% on a review «отлично».
   The day ends at 04:00. */
const DAYMS = 864e5, ROLL = 4;
const dayNo = (ts = Date.now()) => Math.floor((ts - new Date(ts).getTimezoneOffset() * 6e4 - ROLL * 36e5) / DAYMS);
const dayDate = n => new Date(n * DAYMS + ROLL * 36e5 + new Date(n * DAYMS + ROLL * 36e5).getTimezoneOffset() * 6e4);
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONF = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WDAY = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const fmtDay = n => { const d = dayDate(n); return d.getDate() + ' ' + MON[d.getMonth()]; };
const pl = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; };
const pct = r => Math.round(r * 100);
const FW = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const FF = 19 / 81, FDEC = -0.5, FTARGET = 0.9;
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
const fd0 = g => clampN(FW[4] - Math.exp(FW[5] * (g - 1)) + 1, 1, 10);
const retention = (s, t) => Math.pow(1 + FF * Math.max(0, t) / s, FDEC);
const memOf = (c, now = Date.now()) => c.relearn ? 0 : retention(c.S, (now - c.last) / DAYMS);
const ivDays = s => Math.max(1, Math.round(s / FF * (Math.pow(FTARGET, 1 / FDEC) - 1)));
function fsrs(card, g, now = Date.now()){
  const td = dayNo(now);
  if (!card) { const s = FW[g - 1]; return {S: s, D: fd0(g), last: now, due: td + ivDays(s), reps: 1, lapses: g === 1 ? 1 : 0, born: td, relearn: g === 1}; }
  const t = (now - card.last) / DAYMS, R = retention(card.S, t);
  let D = card.D - FW[6] * (g - 3); D = card.D + (D - card.D) * (10 - card.D) / 9; D = clampN(FW[7] * fd0(4) + (1 - FW[7]) * D, 1, 10);
  let s;
  if (dayNo(card.last) === td) s = card.S * Math.exp(FW[17] * (g - 3 + FW[18]));
  else if (g === 1) s = Math.min(card.S, FW[11] * Math.pow(card.D, -FW[12]) * (Math.pow(card.S + 1, FW[13]) - 1) * Math.exp(FW[14] * (1 - R)));
  else s = card.S * (1 + Math.exp(FW[8]) * (11 - card.D) * Math.pow(card.S, -FW[9]) * (Math.exp(FW[10] * (1 - R)) - 1) * (g === 2 ? FW[15] : 1) * (g === 4 ? FW[16] : 1));
  s = clampN(s, 0.1, 36500);
  return {...card, S: s, D, last: now, due: td + ivDays(s), reps: card.reps + 1, lapses: card.lapses + (g === 1 ? 1 : 0), relearn: g === 1};
}
const memClass = r => r >= 0.97 ? 'm5' : r >= 0.9 ? 'm4' : r >= 0.8 ? 'm3' : r >= 0.65 ? 'm2' : 'm1';
const gMem = (lang = S.lang) => { const m = ((S.mem ??= {})[lang] ??= {cards: {}, log: {}, start: dayNo(), perDay: 5}); return m; };
const dueLabel = c => { if (c.relearn) return 'сегодня, в конце занятия'; const d = c.due - dayNo(); return d <= 0 ? 'сегодня' : d === 1 ? 'завтра' : fmtDay(c.due); };
/* old Chinese progress (lesson tests) becomes memory cards once */
function migrateZh(){ const m = gMem('zh'); if (m.migrated) return; m.migrated = true;
  Object.entries(S.tests || {}).forEach(([id, t]) => { if (LES[id] && t.best >= Math.ceil(t.total * .8) && !m.cards[id]) m.cards[id] = fsrs(null, 3, Date.parse((t.date || today()) + 'T12:00:00')); }); }

/* ---------- topics of each language ---------- */
let JG = null, JQ = null, jgP = null, JT = {}, JFB = {}, JFF = new Set();
const loadJg = () => jgP ??= Promise.all(['/l/data/ja_grammar.json', '/l/data/ja_questions.json'].map(u => fetch(u, {cache: 'no-cache'}).then(r => r.json()))).then(([g, q]) => {
  JG = g; JQ = q; g.lessons.forEach(l => l.topics.forEach((t, i) => { t.lesson = l.n; t.num = i + 1; t.title = t.t; t.q = q[t.id] || []; JT[t.id] = t; }));
  Object.values(JT).forEach(t => (t.from || []).forEach(f => JT[f] && (JT[f].to ??= []).push(t.id)));
  Object.keys(g.furi).sort((a, b) => b.length - a.length).forEach(k => { (JFB[k[0]] ??= []).push(k); JFF.add(k[0]); });
}).catch(() => { jgP = null; });
const zhOrder = () => PLAN.days.flatMap(d => d.lessons.map(id => ({id, day: d.d}))).filter(x => LES[x.id]);
function gTopics(lang = S.lang){
  if (lang === 'ja') return JG ? Object.values(JT) : [];
  if (lang === 'de') return DG ? DG.all : [];
  return zhOrder().map(({id, day}) => ({id, day, title: LES[id].title, g: LES[id].g, q: LES[id].q}));
}
const gTopic = id => S.lang === 'de' ? DGT[id] : S.lang === 'ja' ? JT[id] : LES[id] && {id, title: LES[id].title, g: LES[id].g, q: LES[id].q, day: LES[id].day};
/* books on the «Сегодня» page: zh = grammar groups split in two cards, ja = Genki I and II */
function gBooks(){
  if (S.lang === 'ja') return JG ? [{name: 'Genki I', rows: JG.lessons.filter(l => l.n <= 12)}, {name: 'Genki II', rows: JG.lessons.filter(l => l.n > 12)}].map(b => ({name: b.name, rows: b.rows.map(l => ({n: l.n, name: l.name, ids: l.topics.map(t => t.id)}))})) : [];
  if (S.lang === 'de') return DG ? [{name: DG.book, rows: DG.sections.map((s, i) => ({n: i + 1, name: s.name, ids: s.topics.map(t => t.id)}))}] : [];
  const ord = zhOrder(), rows = PLAN.groups.map((g, i) => ({n: i + 1, name: g.name, ids: ord.filter(x => LES[x.id].g === g.id).map(x => x.id)})).filter(r => r.ids.length), h = Math.ceil(rows.length / 2);
  return [{name: 'Грамматика', rows}];   // Chinese grammar is one list
}
const BASE_JA = 12;   // Genki I goes without a daily limit (as in Genki), then perDay new topics
function duePool(lang = S.lang, now = Date.now()){
  const m = gMem(lang), td = dayNo(now);
  return gTopics(lang).filter(t => { const c = m.cards[t.id]; return c && (c.relearn || c.due <= td); }).sort((a, b) => memOf(m.cards[a.id], now) - memOf(m.cards[b.id], now));
}
function newPool(lang = S.lang, now = Date.now()){
  const m = gMem(lang), td = dayNo(now), left = gTopics(lang).filter(t => !m.cards[t.id]);
  if (lang === 'zh') { const d = curDay(); return left.filter(t => t.day <= d); }   // the 40-day plan decides
  if (lang === 'de') return left.slice(0, Math.max(0, deTgtD(deCur(now)) - (gTopics(lang).length - left.length)));   // one plan day at a time; owed days come one after another
  return left.slice(0, Math.max(0, jaTgtD(jaCur(now)) - (gTopics(lang).length - left.length)));   // one plan day at a time; owed days come one after another
}
/* Japanese plan: day 1 = 23 November; Genki I (lessons 1–12) by 1 December, Genki II by 1 January */
const JA_START = '2026-11-23', JA_G1 = '2026-12-01', JA_END = '2027-01-01';
const JA_DAYS = 40, JA_MAX = 4, jaTgtD = k => Math.min(JA_MAX * k, jaTarget(Date.parse(addDays(JA_START, k - 1) + 'T12:00:00')));   // never more than 7 new topics a day
const jaSched = (now = Date.now()) => Math.max(1, Math.min(JA_DAYS, dIdx(JA_START, isoD(dayDate(dayNo(now)))) + 1));
function jaCur(now = Date.now()){ const L = learnedN('ja'), s = jaSched(now); for (let k = 1; k <= s; k++) if (jaTgtD(k) > L) return k; return s; }
function jaTarget(now = Date.now()){
  const d = dayDate(dayNo(now)), t = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const all = gTopics('ja').length, g1 = gTopics('ja').filter(x => x.lesson <= 12).length;
  if (t < JA_START) return 0;
  if (t <= JA_G1) return Math.ceil(g1 * (dIdx(JA_START, t) + 1) / (dIdx(JA_START, JA_G1) + 1));
  return Math.min(all, g1 + Math.ceil((all - g1) * dIdx(JA_G1, t) / dIdx(JA_G1, JA_END)));
}
const learnedN = (lang = S.lang) => gTopics(lang).filter(t => gMem(lang).cards[t.id]).length;
function overallMem(lang = S.lang, now = Date.now()){ const cs = Object.values(gMem(lang).cards); return cs.length ? cs.reduce((a, c) => a + memOf(c, now), 0) / cs.length : null; }
const rowMem = (ids, now = Date.now()) => { const m = gMem(), cs = ids.map(id => m.cards[id]).filter(Boolean); return cs.length ? cs.reduce((a, c) => a + memOf(c, now), 0) / ids.length : null; };
const passed = id => !!gMem('zh').cards[id];
const gramDueN = (lang = S.lang) => duePool(lang).length;

/* ---------- Japanese text: readings over kanji, [..] = the key part ---------- */
const JP_RUN = /[぀-ヿ㐀-鿿々〜ー]+(?:\{[^}]+\}[぀-ヿ㐀-鿿々〜ー]*)*/g, isKj = c => /[㐀-鿿々]/.test(c);
function furiTpl(v){ const o = []; for (let i = 0; i < v.length; i++) { if (v[i + 1] === '{') { const e = v.indexOf('}', i); o.push([v[i], v.slice(i + 2, e)]); i = e; } else o.push([v[i], null]); } return o; }
function furiTok(run){
  const o = []; let i = 0;
  while (i < run.length) {
    if (run[i + 1] === '{' && isKj(run[i])) { const e = run.indexOf('}', i); o.push([run[i], run.slice(i + 2, e)]); i = e + 1; continue; }
    if (!JG || (!isKj(run[i]) && !JFF.has(run[i]))) { o.push([run[i], null]); i++; continue; }
    const hit = (JFB[run[i]] || []).find(k => run.startsWith(k, i));
    if (!hit) { o.push([run[i], null]); i++; continue; }
    const v = JG.furi[hit]; v.includes('{') ? o.push(...furiTpl(v)) : o.push([hit, v]); i += hit.length;
  }
  return o;
}
const furiH = run => furiTok(run).map(([t, r]) => r ? `<ruby>${t}<rt>${r}</rt></ruby>` : t).join('');
const jpH = s => s.replace(JP_RUN, m => `<span class="ja" lang="ja">${furiH(m)}</span>`);
const rich = s => String(s ?? '').split(/(\[[^\]]*\])/).map(p => p.startsWith('[') && p.endsWith(']') && p.length > 2 ? `<span class="hl">${jpH(esc(p.slice(1, -1)))}</span>` : jpH(esc(p))).join('');
const plainJ = s => String(s ?? '').replace(/\[|\]/g, '').replace(/\{[^}]*\}/g, '');
const sayJa = text => { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; const v = speechSynthesis.getVoices().find(x => /^ja/i.test(x.lang)); if (v) u.voice = v; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
const bindSay = V => V.addEventListener('click', e => { const s = e.target.closest('.ja'); if (!s || e.target.closest('a,button')) return; const c = s.cloneNode(true); $$('rt', c).forEach(r => r.remove()); sayJa(c.textContent); });
const tTitle = t => S.lang === 'ja' ? rich(t.t) : esc(t.title);

/* ---------- written answers: romaji turns into kana, kanji are compared by their reading ---------- */
const KANA = {a:'あ',i:'い',u:'う',e:'え',o:'お',ka:'か',ki:'き',ku:'く',ke:'け',ko:'こ',ga:'が',gi:'ぎ',gu:'ぐ',ge:'げ',go:'ご',sa:'さ',si:'し',shi:'し',su:'す',se:'せ',so:'そ',za:'ざ',zi:'じ',ji:'じ',zu:'ず',ze:'ぜ',zo:'ぞ',ta:'た',ti:'ち',chi:'ち',tu:'つ',tsu:'つ',te:'て',to:'と',da:'だ',di:'ぢ',du:'づ',de:'で',do:'ど',na:'な',ni:'に',nu:'ぬ',ne:'ね',no:'の',ha:'は',hi:'ひ',fu:'ふ',hu:'ふ',he:'へ',ho:'ほ',ba:'ば',bi:'び',bu:'ぶ',be:'べ',bo:'ぼ',pa:'ぱ',pi:'ぴ',pu:'ぷ',pe:'ぺ',po:'ぽ',ma:'ま',mi:'み',mu:'む',me:'め',mo:'も',ya:'や',yu:'ゆ',yo:'よ',ra:'ら',ri:'り',ru:'る',re:'れ',ro:'ろ',wa:'わ',wo:'を',kya:'きゃ',kyu:'きゅ',kyo:'きょ',gya:'ぎゃ',gyu:'ぎゅ',gyo:'ぎょ',sha:'しゃ',shu:'しゅ',sho:'しょ',sya:'しゃ',syu:'しゅ',syo:'しょ',ja:'じゃ',ju:'じゅ',jo:'じょ',zya:'じゃ',zyu:'じゅ',zyo:'じょ',cha:'ちゃ',chu:'ちゅ',cho:'ちょ',tya:'ちゃ',tyu:'ちゅ',tyo:'ちょ',nya:'にゃ',nyu:'にゅ',nyo:'にょ',hya:'ひゃ',hyu:'ひゅ',hyo:'ひょ',bya:'びゃ',byu:'びゅ',byo:'びょ',pya:'ぴゃ',pyu:'ぴゅ',pyo:'ぴょ',mya:'みゃ',myu:'みゅ',myo:'みょ',rya:'りゃ',ryu:'りゅ',ryo:'りょ','-':'ー',xtu:'っ',ltu:'っ'};
// final=true: хвостовая n становится ん (при проверке)
function romajiToKana(input, final) {
  const s = input.toLowerCase(); let out = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (!/[a-z'-]/.test(c)) { out += c; i++; continue; }
    if (c === 'n') {
      const nx = s[i + 1];
      if (nx === 'n') { out += 'ん'; i += /[aiueoy]/.test(s[i + 2] || '') ? 1 : 2; continue; }
      if (nx === "'") { out += 'ん'; i += 2; continue; }
      if (nx && !/[aiueoy]/.test(nx)) { out += 'ん'; i++; continue; }
      if (nx === undefined) { if (final) { out += 'ん'; i++; continue; } out += c; i++; continue; }
    }
    if (c !== 'n' && c === s[i + 1] && /[bcdfghjkmpqrstvwxyz]/.test(c)) { out += 'っ'; i++; continue; }
    let done = false;
    for (const len of [3, 2, 1]) {
      const k = s.slice(i, i + len);
      if (KANA[k]) { out += KANA[k]; i += len; done = true; break; }
    }
    if (!done) { out += c; i++; }
  }
  return out;
}
const toRd = s => String(s).replace(/\{[^}]*\}|\[|\]/g, '').replace(JP_RUN, m => furiTok(m).map(([t, r]) => r || t).join(''));
const normAnswer = s => toRd(romajiToKana(String(s), true).replace(/[\s　。．.、,，？?！!「」…・]/g, '')).replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お');
const normDe = s => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[.,!?;:«»„“"–—-]/g, ' ').replace(/\s+/g, ' ').trim();
const writeOk = (typed, q) => { if (S.lang === 'de') { const u = normDe(typed); return !!u && [...q.a, ...(q.r || [])].some(x => normDe(x) === u); } const u = normAnswer(typed); return !!u && [...q.a, ...(q.r || [])].some(x => normAnswer(x) === u); };
// phone: while typing, the question card is exactly the part of the screen above the keyboard
if (window.visualViewport) { const vvFit = () => { const on = document.activeElement?.id === 'wa'; document.documentElement.style.setProperty('--vvh', (on ? visualViewport.height : innerHeight) + 'px'); if (on && innerWidth <= 860) window.scrollTo(0, 0); };
  visualViewport.addEventListener('resize', vvFit); document.addEventListener('focusin', () => setTimeout(vvFit, 250)); document.addEventListener('focusout', () => setTimeout(vvFit, 120)); }

/* ---------- pages ---------- */
function gNeed(fn){ if (S.lang === 'ja' && !JG) { show('<p class="mute" style="text-align:center;margin-top:30vh">Загружаю грамматику…</p>', '', null, 'g'); loadJg().then(() => JG && route(true)); return false; } if (S.lang === 'de' && !DG) { show('<p class="mute" style="text-align:center;margin-top:30vh">Загружаю грамматику…</p>', '', null, 'g'); loadDg().then(() => DG && route(true)); return false; } return true; }
/* German grammar: «Grammatik aktiv A1–B1», same system as zh/ja (no questions yet: reading a topic counts) */
let DG = null, dgP = null; const DGT = {};
const loadDg = () => dgP ??= fetch('/l/data/de_grammar.json', {cache: 'no-cache'}).then(r => r.json()).then(x => { x.all = x.sections.flatMap((s, i) => s.topics.map(t => Object.assign(t, {sec: s.name, secN: i + 1, title: t.t, q: t.q || []}))); x.all.forEach(t => DGT[t.id] = t); DG = x; }).catch(() => { dgP = null; });
const deDay = (now = Date.now()) => Math.max(1, Math.min(DE_DAYS, dIdx(DE_START, isoD(dayDate(dayNo(now)))) + 1));
const deTgtD = k => DG ? Math.ceil(DG.all.length * Math.min(k, DE_DAYS) / DE_DAYS) : 0;   // topics that should be done by the end of plan day k
function deCur(now = Date.now()){ const L = learnedN('de'), s = deDay(now); for (let k = 1; k <= s; k++) if (deTgtD(k) > L) return k; return s; }   // first unfinished day
const deTopicTarget = (now = Date.now()) => deTgtD(deDay(now));
function gRing(m, big){ const r = 62, C = 2 * Math.PI * r, v = m === null ? 0 : m;
  return `<div class="ring gring ${big ? '' : 'sm'} ${m === null ? '' : memClass(m)}"><svg viewBox="0 0 140 140"><circle class="tr" cx="70" cy="70" r="${r}"/><circle class="pr" cx="70" cy="70" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - v)}"/></svg><div class="c"><b class="num">${m === null ? '—' : pct(m)}<i>%</i></b><small>память</small></div></div>`; }
function gPlanHead(){
  const due = duePool(), nw = newPool(), td = dayNo(), d = dayDate(td), log = gMem().log[td] || {n: 0, r: 0}, did = log.n + log.r;
  const head = due.length + nw.length ? [due.length ? `${due.length} ${pl(due.length, 'повторение', 'повторения', 'повторений')}` : '', nw.length ? `${nw.length} ${pl(nw.length, 'новая тема', 'новые темы', 'новых тем')}` : ''].filter(Boolean).join(' и ') : 'На сегодня всё';
  const mins = Math.max(1, Math.round(nw.length * 3 + due.length * 1.5));
  const sub = due.length + nw.length ? `≈ ${mins} мин${did ? ` · сделано сегодня ${did}` : ''}` : tomorrowLine();
  return {due, nw, did, head, sub, date: `${WDAY[d.getDay()]}, ${d.getDate()} ${MONF[d.getMonth()]}`};
}
function tomorrowLine(){ const t = Date.now() + DAYMS, r = duePool(S.lang, t).length, n = newPool(S.lang, t).length;
  return !r && !n ? (S.lang === 'zh' ? 'Новые темы придут с новым днём плана.' : 'Завтра заданий нет.') : `Завтра: ${r} ${pl(r, 'повторение', 'повторения', 'повторений')}${S.lang === 'ja' ? `, ${n} ${pl(n, 'новая тема', 'новые темы', 'новых тем')}` : ''}.`; }
function gToday(){
  if (!gNeed()) return;
  if (S.lang === 'zh') migrateZh();
  const P = gPlanHead(), m = overallMem(), now = Date.now(), cs = Object.values(gMem().cards);
  const later = m === null ? '' : `<dl>${[[1, 'завтра'], [7, 'через неделю'], [30, 'через месяц']].map(([n, l]) => `<div><dt>${l}</dt><dd class="num">${pct(cs.reduce((a, c) => a + memOf(c, now + n * DAYMS), 0) / cs.length)}%</dd></div>`).join('')}</dl>`;
  const cell = id => { const c = gMem().cards[id], t = gTopic(id), r = c ? memOf(c, now) : null, due = c && (c.relearn || c.due <= dayNo());
    const tip = (S.lang === 'ja' ? id + ' ' + plainJ(t.t) : t.title) + ' · ' + (c ? `${pct(r)}%, повтор ${dueLabel(c)}` : 'ещё не пройдена');
    return `<a class="gc ${c ? memClass(r) : ''} ${due ? 'due' : ''}" href="#t-${id}" aria-label="${esc(tip)}"></a>`; };
  const book = b => { const ids = b.rows.flatMap(r => r.ids), n = ids.filter(id => gMem().cards[id]).length, bm = rowMem(ids);
    return `<section class="card gbook"><h2>${esc(b.name)}<small class="num">${n}/${ids.length} тем${bm === null ? '' : ' · память ' + pct(bm) + '%'}</small></h2><div class="gbar"><i style="width:${n / ids.length * 100}%"></i></div>
      ${b.rows.map(r => { const rm = rowMem(r.ids); return `<div class="grow"><span class="n num">${r.n}</span><span class="nm" title="${esc(r.name)}">${esc(r.name)}</span><span class="gcs">${r.ids.map(cell).join('')}</span><span class="p num">${rm === null ? '' : pct(rm) + '%'}</span></div>`; }).join('')}</section>`; };
  const extra = S.lang === 'ja' ? '<a class="btn" href="#jsheet">Шпаргалка</a><a class="btn" href="#jmap">Карта форм</a>' : S.lang === 'de' ? '' : '<a class="btn" href="#pinyin">Правила пиньиня</a>';
  show(`<div class="gk"><div class="gtop" ${m === null ? 'style="grid-template-columns:1fr"' : ''}>
      <section class="card gplan"><h1>${P.head}</h1><p class="mute">${P.sub}</p>
        <div class="acts">${P.due.length + P.nw.length ? `<a class="btn main" href="#s">${P.did ? 'Продолжить' : 'Начать'}</a>` : ''}${extra}</div></section>
      ${m === null ? '' : `<section class="card gmem">${gRing(m, true)}${later}</section>`}</div>
    <div class="gbooks" ${gBooks().length === 1 ? 'style="grid-template-columns:1fr"' : ''}>${gBooks().map(book).join('')}</div>${gList()}
</div>`, '', null, 'g');
}
const GOPEN = new Set();
function gList(){
  const m = gMem(), now = Date.now(), B = gBooks(), all = B.flatMap(b => b.rows.flatMap(r => r.ids)), n = all.filter(id => m.cards[id]).length, om = rowMem(all);
  const cv = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const sq = id => { const c = m.cards[id], due = c && (c.relearn || c.due <= dayNo()); return `<span class="gc ${c ? memClass(memOf(c, now)) : ''} ${due ? 'due' : ''}"></span>`; };
  const ti = id => { const c = m.cards[id], t = gTopic(id); return `<a class="gti" href="#t-${id}">${sq(id)}<span class="tt">${tTitle(t)}</span><span class="st">${c ? pct(memOf(c, now)) + '% · ' + dueLabel(c) : ''}</span></a>`; };
  const row = (r, key) => { const rm = rowMem(r.ids), op = GOPEN.has(key);
    return `<div class="gr ${op ? 'open' : ''}" data-k="${key}"><button class="grb" aria-expanded="${op}"><span class="n num">${r.n}</span><span class="nm">${esc(r.name)}</span><span class="sq">${r.ids.map(sq).join('')}</span><span class="p num">${rm === null ? '' : pct(rm) + '%'}</span>${cv}</button>
      <div class="gt"><div>${r.ids.map(ti).join('')}</div></div></div>`; };
  return `<section class="card gl"><div class="glh"><h2>Грамматика</h2><small class="num">${n}/${all.length} тем${om === null ? '' : ' · память ' + pct(om) + '%'}</small></div><div class="gbar"><i style="width:${n / all.length * 100}%"></i></div>
    ${B.map(b => (S.lang === 'ja' ? `<div class="gsec">${esc(b.name)}</div>` : '') + b.rows.map(r => row(r, S.lang + r.n)).join('')).join('')}</section>`;
}
document.addEventListener('click', e => { const b = e.target.closest('.grb'); if (!b) return; const r = b.parentElement, k = r.dataset.k, op = !r.classList.contains('open');
  r.classList.toggle('open', op); b.setAttribute('aria-expanded', op); op ? GOPEN.add(k) : GOPEN.delete(k); });
{ const gf = $('#gfly'); let gfT = null, gfId = null;
  const hide = now => { clearTimeout(gfT); const go = () => { gf.classList.remove('on'); gfId = null; }; now ? go() : (gfT = setTimeout(go, 160)); };
  const card = id => { const t = gTopic(id), c = gMem().cards[id], r = c ? memOf(c) : null;
    let head, sub, rule, ex = '';
    if (S.lang === 'ja') { const l = JG.lessons.find(x => x.n === t.lesson); head = rich(t.t); sub = `Genki ${t.lesson <= 12 ? 'I' : 'II'} · урок ${t.lesson} · ${esc(l.name)}`; rule = rich(t.g || '') + (t.r ? `<span class="gr2">${rich(t.r)}</span>` : '');
      const tb = [].concat(t.v || [])[0], row = tb?.r?.[0]; if (row) ex = `<div class="gx"><b>${rich(row[0])}</b>${row[1] ? `<span>${rich(row[row.length - 1])}</span>` : ''}</div>`; }
    else if (S.lang === 'de') { head = esc(t.t); sub = `${esc(t.sec)} · глава ${t.n} · ${t.lv}`; rule = rich(t.g || '') + (t.r ? `<span class="gr2">${rich(t.r)}</span>` : '');
      const row = [].concat(t.v || [])[0]?.r?.[0]; if (row) ex = `<div class="gx"><b>${rich(row[0])}</b>${row.length > 1 ? `<span>${rich(row[row.length - 1])}</span>` : ''}</div>`; }
    else { const L = LES[id], R = L.rules[0], e = R?.ex?.[0]; head = esc(L.title); sub = `день ${L.day} · ${esc(PLAN.groups.find(g => g.id === L.g)?.name || '')}`; rule = R ? `${zh(R.f)} — ${esc(R.m)}` : '';
      if (e) ex = `<div class="gx"><b class="zh">${esc(e[0])}</b><span>${esc(e[1])} · ${esc(e[2])}</span></div>`; }
    const st = c ? [[`<b class="num ${memClass(r)}">${pct(r)}%</b>`, 'память'], [`<b>${dueLabel(c)}</b>`, 'повтор'], [`<b class="num">${c.reps}</b>`, 'оценок']]
      : [['<b>—</b>', 'память'], ['<b>новая</b>', 'статус'], [`<b class="num">${t.q.length}</b>`, 'вопросов']];
    return `<div class="fh"><span class="gc ${c ? memClass(r) : ''}"></span><div><b>${head}</b><span>${sub}</span></div></div>
      <div class="gfb">${rule ? `<div class="gr1">${rule}</div>` : ''}${ex}</div><div class="gfs">${st.map(([v, l]) => `<div>${v}<span>${l}</span></div>`).join('')}</div>`; };
  document.addEventListener('mouseover', e => {
    if (!matchMedia('(hover:hover)').matches || innerWidth <= 860) return;
    const a = e.target.closest?.('.gbook a.gc'); if (!a) { if (gfId && !e.target.closest?.('.gcs')) hide(); return; }
    const id = a.getAttribute('href').slice(3); clearTimeout(gfT); if (id === gfId) return; gfId = id;
    try { gf.innerHTML = card(id); } catch (er) { return; }
    const rc = a.getBoundingClientRect(), w = 310, h = gf.offsetHeight || 220, up = rc.top - h - 12 > 52;
    if (!gf.classList.contains('on')) gf.style.transition = 'opacity .18s ease,transform .18s ease';   // first show: no slide from the old place
    gf.style.left = Math.max(12, Math.min(innerWidth - w - 12, rc.left + rc.width / 2 - w / 2)) + 'px'; gf.style.top = (up ? rc.top - h - 12 : rc.bottom + 12) + 'px';
    requestAnimationFrame(() => gf.style.transition = '');
    gf.classList.add('on');
  });
  document.addEventListener('mouseout', e => { if (gfId && e.target.closest?.('.gbook a.gc') && !e.relatedTarget?.closest?.('.gbook a.gc')) hide(); });   // off the squares: gone at once (a short grace only for the gap between two squares)
  addEventListener('hashchange', () => hide(true)); document.addEventListener('scroll', () => gfId && hide(true), {passive: true, capture: true}); }
/* the topic itself */
const jgTable = tb => `${tb.cap ? `<div class="jcap">${rich(tb.cap)}</div>` : ''}<div class="jtw"><table>${tb.h.some(Boolean) ? `<thead><tr>${tb.h.map(h => `<th>${rich(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>${tb.r.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const jChip = id => JT[id] ? `<a class="jt" href="#t-${id}"><span>${rich(JT[id].t)}</span><em>${id}</em></a>` : '';
function topicBody(id){
  if (S.lang === 'ja') { const t = JT[id], k = JG.kinds[t.k], l = JG.lessons.find(x => x.n === t.lesson), sec = (lab, html) => `<section class="jsec"><span class="eye">${lab}</span>${html}</section>`;
    return `<div class="ph"><span class="eye">Genki ${t.lesson <= 12 ? 'I' : 'II'} · урок ${t.lesson} · ${esc(l.name)}${k ? ' · ' + esc(k.name) : ''}</span><h1>${rich(t.t)}</h1><div class="g">${rich(t.g)}</div></div>
    <div class="body jgr">
      <div class="jrule"><span class="eye">Правило</span>${rich(t.r)}</div>
      ${t.o ? sec('Откуда', `<p>${rich(t.o)}</p>`) : ''}
      ${t.v ? sec('Все варианты', [].concat(t.v).map(jgTable).join('')) : ''}
      ${t.e ? sec('Исключения', `<ul>${t.e.map(x => `<li>${rich(x)}</li>`).join('')}</ul>`) : ''}
      ${t.c ? sec('Сравнение', jgTable(t.c)) : ''}
      ${t.from?.length ? `<div class="jlinks"><span>Опирается на</span>${t.from.map(jChip).join('')}</div>` : ''}
      ${t.to?.length ? `<div class="jlinks"><span>Ведёт к</span>${t.to.map(jChip).join('')}</div>` : ''}
      ${k ? `<div class="jhow"><span class="eye">как учить</span><p>${rich(k.how)}</p></div>` : ''}
      ${t.src ? `<p class="jsrc">${rich(t.src)}</p>` : ''}</div>`; }
  if (S.lang === 'de') { const t = DGT[id], k = DG.kinds[t.k], sec = (lab, html) => `<section class="jsec"><span class="eye">${lab}</span>${html}</section>`;
    const chip = x => DGT[x] ? `<a class="jt" href="#t-${x}"><span>${esc(DGT[x].t)}</span><em>${DGT[x].n}</em></a>` : '';
    return `<div class="ph"><span class="eye">${esc(t.sec)} · глава ${t.n} · ${t.lv}${k ? ' · ' + esc(k.name) : ''}</span><h1>${esc(t.t)}</h1><div class="g">${rich(t.g || t.ex)}</div></div>
    <div class="body jgr dgr">
      ${t.r ? `<div class="jrule"><span class="eye">Правило</span>${rich(t.r)}</div>` : ''}
      ${t.o ? sec('Откуда', `<p>${rich(t.o)}</p>`) : ''}
      ${t.v ? sec('Все варианты', [].concat(t.v).map(jgTable).join('')) : ''}
      ${t.e ? sec('Исключения', `<ul>${t.e.map(x => `<li>${rich(x)}</li>`).join('')}</ul>`) : ''}
      ${t.c ? sec('Сравнение', jgTable(t.c)) : ''}
      ${t.from?.length ? `<div class="jlinks"><span>Опирается на</span>${t.from.map(chip).join('')}</div>` : ''}
      ${t.to?.length ? `<div class="jlinks"><span>Ведёт к</span>${t.to.map(chip).join('')}</div>` : ''}
      ${k ? `<div class="jhow"><span class="eye">как учить</span><p>${rich(k.how)}</p></div>` : ''}
      <p class="jsrc">${esc(DG.book)} · «${esc(t.ex)}» · стр. ${t.p}–${t.p + 1}</p></div>`; }
  const L = LES[id];
  return `<div class="ph"><span class="eye">день ${L.day} · ${esc(PLAN.groups.find(g => g.id === L.g)?.name || '')}</span><h1>${esc(L.title)}</h1></div><div class="body">
    ${L.rules.map(r => `<div><div class="f">${zh(r.f)}</div><p class="m" style="margin:8px 0 6px">${esc(r.m)}</p>${r.ex.map(e => `<div class="ex"><button class="play" data-t="${esc(e[0])}" aria-label="Послушать">${I.play}</button><span class="zh">${esc(e[0])}</span><small>${esc(e[1])}<i>${esc(e[2])}</i></small></div>`).join('')}</div>`).join('')}
    ${L.trap ? `<div class="trap"><s>${zh(L.trap[0])}</s><span>→</span><b>${zh(L.trap[1])}</b><span class="mute">${esc(L.trap[2])}</span></div>` : ''}</div>`;
}
function panelPage(html, after){ show(`<div class="gkw"><section class="card panel gpanel" id="P"><div class="pv">${html}</div></section></div>`, '', () => { const P = $('#P'); bindPlay(P); bindSay(P); fitPanel(P); after?.(P.firstElementChild); }, 'g'); }
function gTopicPage(id){
  if (!gNeed()) return;
  const all = gTopics(), i = all.findIndex(t => t.id === id); if (i < 0) { location.hash = 'lessons'; return; }
  const prev = all[i - 1], next = all[i + 1], c = gMem().cards[id];
  const met = c ? `<div class="gmet">${[[pct(memOf(c)) + '%', 'память'], [(c.S < 10 ? c.S.toFixed(1) : Math.round(c.S)) + ' дн.', 'прочность'], [dueLabel(c), 'повтор'], [c.reps + ' / ' + c.lapses, 'оценок / забыл']].map(([v, l]) => `<div><b class="num">${v}</b><span>${l}</span></div>`).join('')}</div>` : '';
  panelPage(`<div class="pbar"><a href="#lessons">← Сегодня</a><span class="pa"><a href="${prev ? '#t-' + prev.id : '#'}" ${prev ? '' : 'aria-disabled="true"'} aria-label="Предыдущая тема">←</a><span>${S.lang === 'ja' ? id : i + 1}</span><a href="${next ? '#t-' + next.id : '#'}" ${next ? '' : 'aria-disabled="true"'} aria-label="Следующая тема">→</a></span></div>
    ${topicBody(id)}<div class="body" style="padding-top:0">${met}<div class="gacts">${c ? (gTopic(id).q.length ? `<button class="btn main" id="gtest">Проверить себя · ${Math.min(REV_N, gTopic(id).q.length)}</button>` : `<button class="btn main" id="gtest">Повторил</button>`) : `<button class="btn main" id="gtest">Учить сейчас</button>`}</div></div>`, V => {
    $('#gtest', V).onclick = () => { SS = newSession([{id, mode: c ? 'review' : 'new'}], true); location.hash = 's'; if (location.hash === '#s') route(); };
    keys(e => { if (e.target.closest?.('input,textarea')) return; const go = x => x && (location.hash = 't-' + x.id);
      if (e.key === 'ArrowRight') go(next); else if (e.key === 'ArrowLeft') go(prev); else if (e.key === 'Escape') location.hash = 'lessons'; });
  });
}
/* ---------- session ---------- */
const NEW_N = 8, REV_N = 4;
let SS = null;
const newSession = (queue, single) => ({lang: S.lang, queue, i: 0, done: 0, missed: 0, began: Date.now(), phase: null, single: !!single});
function buildQueue(){ return [...duePool().map(t => ({id: t.id, mode: gMem().cards[t.id].relearn ? 'relearn' : 'review'})), ...newPool().map(t => ({id: t.id, mode: 'new'}))]; }
function gSession(){
  if (!gNeed()) return;
  if (!SS || SS.lang !== S.lang) { const q = buildQueue(); if (!q.length) { location.hash = 'lessons'; return; } SS = newSession(q); }
  if (SS.i >= SS.queue.length) return gSummary();
  const it = SS.queue[SS.i], t = gTopic(it.id), card = gMem().cards[it.id];
  if (it.mode === 'new' && !card && SS.phase !== 'quiz') {
    SS.phase = 'read';
    return panelPage(`<div class="pbar"><span class="mute">Тема ${SS.i + 1} из ${SS.queue.length} · новая</span><a href="#lessons">Выйти</a></div>${topicBody(it.id)}
      <div class="gfoot"><span></span><button class="btn main" id="gq">${t.q.length ? 'К вопросам' : 'Прочитал'} · Enter</button></div>`, V => {
      const go = () => { SS.phase = 'quiz'; route(); };
      $('#gq', V).onclick = go; keys(e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }
  // the questions: all of a new topic (up to NEW_N), part of them in a review
  const W = S.lang === 'de' ? [] : t.q.filter(q => q.k === 'write'), n = it.mode === 'new' ? NEW_N : REV_N, qs = W.length ? (it.mode === 'new' ? W : shuffle(W).slice(0, REV_N)) : shuffle(t.q).slice(0, n);
  if (!qs.length) { rateTopic(it, 3, 1); return gSession(); }
  panelPage('', () => quiz(qs.map((q, k) => ({q, key: it.id + ':' + k})), {title: `${S.lang === 'ja' ? plainJ(t.t) : t.title} · тема ${SS.i + 1} из ${SS.queue.length}`, back: '#s', end: ok => {
    const sc = ok / qs.length, fresh = !gMem().cards[it.id], g = sc < 0.6 ? 1 : sc < 0.8 ? 2 : sc < 1 ? 3 : fresh ? 3 : 4;
    const c = rateTopic(it, g, sc);
    return `${['', 'Не закрепилось', 'Слабо', 'Хорошо', 'Отлично'][g]} · ${g === 1 ? 'вернётся в конце занятия' : 'повтор ' + dueLabel(c)}`; }}));
}
function rateTopic(it, g, sc){
  const m = gMem(), now = Date.now(), c = fsrs(m.cards[it.id] || null, g, now); m.cards[it.id] = c;
  const td = dayNo(now), lg = m.log[td] ??= {n: 0, r: 0}; it.mode === 'new' ? lg.n++ : lg.r++;
  SS.done++; if (g <= 2) SS.missed++; if (g === 1) SS.queue.push({id: it.id, mode: 'relearn'});
  SS.i++; SS.phase = null; add('gram', 0); track(); persist(); return c;
}
function gSummary(){
  const mins = Math.max(1, Math.round((Date.now() - SS.began) / 6e4)), m = overallMem(), left = buildQueue().length, done = SS.done, missed = SS.missed, single = SS.single;
  SS = null;
  panelPage(`<div class="quiz"><span class="eye">занятие окончено</span><span class="big num">${done}</span><p style="font-weight:800">${pl(done, 'тема', 'темы', 'тем')} за ${mins} мин${missed ? ` · ${missed} вернутся раньше` : ''}</p>
    <p class="mute">Память сейчас ${m === null ? '—' : pct(m) + '%'} · пройдено ${learnedN()}/${gTopics().length}${left && !single ? ` · осталось на сегодня ${left}` : ''}</p>
    <p style="display:flex;gap:10px;justify-content:center">${left && !single ? '<a class="btn main" href="#s">Продолжить</a>' : ''}<a class="btn ${left && !single ? '' : 'main'}" href="#lessons">К грамматике</a></p></div>`);
}
/* ---------- Japanese cheat sheet and form map ---------- */
let jsHide = false, jsOpen = new Set(), JMV = 0;
function jgSheet(){
  if (S.lang !== 'ja') { location.hash = 'lessons'; return; } if (!gNeed()) return;
  const total = JG.sheet.reduce((a, g) => a + g.items.length, 0);
  show(`<div class="gk"><div class="gtop1"><a class="btn" href="#lessons">← Сегодня</a><div><span class="eye">шпаргалка</span><h1>Вся грамматика на одном экране</h1></div><span class="sp"></span><button class="btn" id="jsh"></button><button class="btn" id="jss">Показать всё</button></div>
    <div class="jsheet jgr">${JG.sheet.map((g, gi) => `<section class="card"><h2>${esc(g.h)}${g.ex ? ` <span class="ja" lang="ja">${furiH(g.ex)}</span>` : ''}</h2>
      ${g.items.map(([jp, ru, id], ii) => `<div class="r"><a href="#t-${id}">${rich(jp)}</a><button data-k="${gi}:${ii}"></button></div>`).join('')}</section>`).join('')}</div>
    <div class="jlinks jgr" style="margin-top:18px"><span>Коротко не объяснить, читай целиком</span>${JG.sheetLong.map(([n, id]) => `<a class="jt" href="#t-${id}"><span>${rich(n)}</span><em>${id}</em></a>`).join('')}</div></div>`, '', () => {
    const X = $('.gk'); bindSay(X);
    const paint = () => { $('#jsh').textContent = jsHide ? `Открыто ${jsOpen.size} из ${total}` : 'Скрыть значения'; $('#jsh').classList.toggle('main', jsHide); $('#jss').hidden = !jsHide;
      $$('.r button', X).forEach(b => { const [g, ii] = b.dataset.k.split(':'), on = !jsHide || jsOpen.has(b.dataset.k); b.className = on ? '' : 'closed'; b.innerHTML = on ? rich(JG.sheet[g].items[ii][1]) : '?'; }); };
    $('#jsh').onclick = () => { jsHide = !jsHide; jsOpen.clear(); paint(); }; $('#jss').onclick = () => { jsHide = false; jsOpen.clear(); paint(); };
    $$('.r button', X).forEach(b => b.onclick = () => { if (!jsHide) return; jsOpen.has(b.dataset.k) ? jsOpen.delete(b.dataset.k) : jsOpen.add(b.dataset.k); paint(); });
    paint(); }, 'g');
}
function jgMap(){
  if (S.lang !== 'ja') { location.hash = 'lessons'; return; } if (!gNeed()) return;
  const M = JG.map;
  const base = r => `<section class="card base"><div class="bh"><b class="ja" lang="ja">${furiH(r.title)}</b><span><strong>${esc(r.name)}</strong> — ${rich(r.sub)}</span></div>
    ${M.why[r.name] ? `<p class="why">${rich(M.why[r.name])}</p>` : ''}<div class="forms">${r.items.map(([jp, ru, id]) => `<a href="#t-${id}"><span class="ja" lang="ja">${furiH(jp)}</span><small>${rich(ru)}</small></a>`).join('')}</div></section>`;
  show(`<div class="gk"><div class="gtop1"><a class="btn" href="#lessons">← Сегодня</a><div><span class="eye">карта форм</span><h1>Одна форма — всё, что к ней цепляется</h1></div></div>
    <div class="seg" id="jmv" style="flex-wrap:wrap;margin-bottom:16px;width:max-content;max-width:100%">${M.verbs.map((x, i) => `<button data-v="${i}" class="ja" lang="ja" style="flex:none;padding:0 14px;font-size:13px">${esc(x.label)}</button>`).join('')}</div>
    <div class="jmap jgr" id="jmb"></div></div>`, '', () => {
    const X = $('.gk'); bindSay(X);
    const draw = () => { $('#jmb').innerHTML = M.verbs[JMV].rows.map(base).join('') + M.other.map(g => `<h2 class="gt">${esc(g.name)}</h2>${g.rows.map(base).join('')}`).join('');
      $$('#jmv button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === JMV)); };
    $$('#jmv button').forEach(b => b.onclick = () => { JMV = +b.dataset.v; draw(); }); draw(); }, 'g');
}
function pinyin(){
  if (S.lang !== 'zh') { location.hash = 'lessons'; return; }
  panelPage(`<div class="pbar"><a href="#lessons">← Сегодня</a></div><div class="ph"><span class="eye">справочник</span><h1>${esc(PIN.title)}</h1></div><div class="body">
    ${PIN.sections.map(s => `<div><h2 style="font-size:15px;margin-bottom:8px">${esc(s.title)}</h2>${s.text ? `<div class="m" style="color:var(--ink)">${s.text}</div>` : ''}
      ${s.table ? `<div style="overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;font-size:12.5px"><tr>${s.table.head.map(x => `<th class="eye" style="text-align:left;padding:5px 10px 5px 0;border-bottom:1px solid var(--line)">${esc(x)}</th>`).join('')}</tr>${s.table.rows.map(r => `<tr>${r.map(c => `<td style="padding:5px 10px 5px 0;border-bottom:1px solid var(--line);vertical-align:top">${zh(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
      ${(s.ex || []).map(e => `<div class="ex"><button class="play" data-t="${esc(e[0])}" aria-label="Послушать">${I.play}</button><span class="zh">${esc(e[0])}</span><small>${esc(e[1])}<i>${esc(e[2])}</i></small></div>`).join('')}</div>`).join('')}</div>`);
}
/* the centre panel height follows its content, animated */
let panelRO = null;
function fitPanel(P){
  const pv = P.firstElementChild; if (!pv) return; panelRO?.disconnect();
  const set = () => { if (!pv.isConnected) return; const max = P.parentElement.clientHeight; P.style.height = Math.min(pv.offsetHeight + 2, max) + 'px'; };
  set(); panelRO = new ResizeObserver(set); panelRO.observe(pv);
}

/* ---------- Anki link (AnkiConnect, add-on 2055492159, on this computer) ----------
   With Anki open, the site reads: cards due and answered today per deck, today's Anki time, the state of every word
   (known = card in review). «Anki · повторения» and «Anki · N новых слов» tick themselves; word lists and the
   Japanese/Chinese word rings take the state from Anki. Without Anki the site works as before (manual ticks). */
// 8765 is AnkiConnect's default; on this computer it is taken, so AnkiConnect is set to 8766 (webBindPort)
const AK_PORTS = [8766, 8765], AK_DECK = {zh: 'Mandarin', ja: 'Japanese', de: 'German'};
let AK = null, akBusy = false, akErr = '', AK_URL = null;
try { const t = JSON.parse(localStorage.getItem('lcm-anki') || 'null'); if (t && t.day === today()) AK = t; } catch (e) {}
async function akCall(action, params = {}, ms = 8000){
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(AK_URL, {method: 'POST', body: JSON.stringify({action, version: 6, params}), signal: c.signal}); const j = await r.json(); if (j.error) throw new Error(j.error); return j.result; }
  finally { clearTimeout(t); }
}
const akClean = s => String(s || '').replace(/\[sound:[^\]]*\]/g, '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const akFields = n => Object.entries(n.fields).sort((a, b) => a[1].order - b[1].order).map(([k, v]) => [k, akClean(v.value)]);
async function akSync(){
  if (akBusy) return; akBusy = true;
  try {
    if (!AK_URL) { for (const p of AK_PORTS) { AK_URL = 'http://127.0.0.1:' + p; try { if (await akCall('version', {}, 2000) >= 6) break; } catch (e) {} AK_URL = null; } if (!AK_URL) throw new Error('нет связи'); }
    const td = new Date(); td.setHours(ROLL, 0, 0, 0); if (Date.now() < td.getTime()) td.setDate(td.getDate() - 1);
    const out = {day: today(), at: Date.now(), langs: {}}, names = await akCall('deckNames'), bd = {};
    for (const [lang, deck] of Object.entries(AK_DECK)) {
      if (!names.some(n => n === deck || n.startsWith(deck + '::'))) continue;
      const q = `"deck:${deck}"`;
      // one request at a time: AnkiConnect serves a single connection and refuses the rest
      const due = await akCall('findCards', {query: q + ' is:due'}), rated = await akCall('findCards', {query: q + ' rated:1'}),
        revs = rated.length ? Object.values(await akCall('getReviewsOfCards', {cards: rated})).flat().filter(r => r.id >= td.getTime()) : [], nids = await akCall('findNotes', {query: q}),
        revN = await akCall('findNotes', {query: q + ' is:review'}), lrnN = await akCall('findNotes', {query: q + ' is:learn'});
      revs.forEach(r => { const k = isoD(new Date(r.id)); bd[k] = (bd[k] || 0) + (r.time || 0) / 1000; });
      const L = out.langs[lang] = {due: due.length, rated: rated.length, secs: Math.round(revs.reduce((a, r) => a + (r.time || 0), 0) / 1000)};
      if (lang === 'zh') {   // every day deck up to today's plan day: are its new cards done?
        const want = {}; for (let d = 1; d <= schedDay(); d++) { const dn = names.find(n => new RegExp(`^${deck}::Day ${String(d).padStart(2, '0')}( |$)`).test(n)); if (dn) want[dn] = d; }
        L.days = {}; if (Object.keys(want).length) Object.values(await akCall('getDeckStats', {decks: Object.keys(want)})).forEach(st => { const d = +(/Day ([0-9]+)/.exec(st.name) || [])[1]; if (d) L.days[d] = {nw: st.new_count + st.learn_count, nn: st.new_count, tot: st.total_in_deck}; });
        L.intro = (await akCall('findCards', {query: q + ' introduced:1'})).length;   // Anki gives the short name «Day 01 · …»
      }
      if (lang === 'ja') {   // words (not kanji): still new, and introduced today
        L.wNew = (await akCall('findCards', {query: q + ' -note:Kanji is:new'})).length; L.wIntro = (await akCall('findCards', {query: q + ' -note:Kanji introduced:1'})).length;
        L.kNew = (await akCall('findCards', {query: q + ' note:Kanji is:new'})).length; L.kIntro = (await akCall('findCards', {query: q + ' note:Kanji introduced:1'})).length;
      }
      if (lang === 'de') { L.wNew = (await akCall('findCards', {query: q + ' is:new'})).length; L.wIntro = (await akCall('findCards', {query: q + ' introduced:1'})).length; continue; }
      // word states by note: zh = Hanzi field; ja words = Kanji or reading, ja kanji = third field of «Kanji» notes
      const rv = new Set(revN), lr = new Set(lrnN), info = await akCall('notesInfo', {notes: nids}), st = {}, kst = {};
      for (const n of info) { if (!n || !n.fields) continue; const f = akFields(n), s = rv.has(n.noteId) ? 'known' : lr.has(n.noteId) ? 'learning' : 'new', get = k => (f.find(x => x[0] === k) || [])[1];
        if (lang === 'zh') { const h = get('Hanzi'); if (h) st[h] = s; }
        else if (n.modelName === 'Kanji') { const k = f[2]?.[1]; if (k) kst[k] = s; }
        else { const k = get('Kanji') || get('Back'); if (k) st[k] = s; } }
      L.st = st; if (lang === 'ja') L.kst = kst;
    }
    try { out.plan = await akPlan(out); } catch (e) { out.plan = {err: e.message}; }
    AK = out; akErr = '';
    try { localStorage.setItem('lcm-anki', JSON.stringify(AK)); } catch (e) {}
    // Anki time goes into today's hours (the larger of the timer and Anki's own count)
    Object.entries(bd).forEach(([k, v]) => { (S.time[k] ??= {}); if (v > (S.time[k].anki || 0)) S.time[k].anki = Math.round(v); });   // by calendar date, like the site's hours
    akApply(); track(); persist();
    if (!busy && /^#?(home|words.*|stats)?$/.test(location.hash.replace('#', ''))) refresh();
  } catch (e) { AK_URL = null; akErr = e.name === 'AbortError' || /fetch|network|Failed/i.test(e.message) ? 'нет связи' : e.message; }
  finally { akBusy = false; akUI(); }
}
/* Anki plan: on every sync each language's «new cards per day» is set to what the plan asks for today, debt included.
   Only the site's own presets are touched (never Default): zh «LCM · План дня» on Mandarin (you study from the top deck),
   de «DE · План дня» on German, ja «JA · План дня» on Japanese with «JA · Слова» / «JA · Kanji» splitting words and kanji. */
const DE_START = '2026-11-23', DE_END = '2027-01-01', DE_DAYS = dIdx(DE_START, DE_END) + 1;   // German: day 1 = 23 November … day 40 = 1 January, like the other two
const deDaysLeft = () => Math.max(1, dIdx(today(), DE_END) + 1);   // today included, as in Japanese
const akTargets = A => {
  const t = {}, zh = A.langs.zh, de = A.langs.de, ja = A.langs.ja;
  if (zh?.days) t.zh = Object.entries(zh.days).filter(([d]) => +d <= schedDay()).reduce((a, [, x]) => a + (x.nn || 0), 0) + (zh.intro || 0);   // every owed day's new words + today's
  if (de?.wNew != null) t.de = Math.ceil((de.wNew + de.wIntro) / deDaysLeft());
  if (ja?.wNew != null) { const dl = Math.max(1, dIdx(today(), JA_END) + 1); t.jaW = Math.ceil((ja.wNew + ja.wIntro) / dl); t.jaK = Math.ceil((ja.kNew + ja.kIntro) / dl); }
  return t;
};
async function akPreset(decks, name, perDay, own){
  let conf = null, changed = false;
  for (const d of decks) {
    let c; try { c = await akCall('getDeckConfig', {deck: d}); } catch (e) { continue; } if (!c || !c.id) continue;
    if (!conf) {
      if (c.name === name) conf = c;
      else if (own) { conf = c; conf.name = name; changed = true; }   // the site's own preset: rename in place
      else { const id = await akCall('cloneDeckConfigId', {name, cloneFrom: c.id}); await akCall('setDeckConfigId', {decks: [d], configId: id}); conf = await akCall('getDeckConfig', {deck: d}); }
    } else if (c.id !== conf.id) await akCall('setDeckConfigId', {decks: [d], configId: conf.id});
  }
  if (!conf || conf.id === 1 || conf.name === 'Default') return null;   // never touch the shared Default preset
  if (conf.new.perDay !== perDay) { conf.new.perDay = perDay; changed = true; }
  if (changed) await akCall('saveDeckConfig', {config: conf});
  return perDay;
}
async function akPlan(A){
  const t = akTargets(A), done = {};
  if (t.zh != null) done.zh = await akPreset(['Mandarin'], 'LCM · План дня', t.zh, true);
  if (t.de != null) done.de = await akPreset(['German'], 'DE · План дня', t.de);
  if (t.jaW != null) { done.jaW = await akPreset(['Japanese::Japanese: A'], 'JA · Слова', t.jaW); done.jaK = await akPreset(['Japanese::Japanese: Kanji A'], 'JA · Kanji', t.jaK, true);
    done.ja = await akPreset(['Japanese'], 'JA · План дня', t.jaW + t.jaK); }
  return done;
}
const akOn = () => !!AK && AK.day === today();
/* word states from Anki override the ones baked into the site */
function akApply(){
  const ja = akOn() && AK.langs.ja;
  if (ja && JA) { JA.words.forEach(w => { const s = ja.st?.[w.h]; if (s) w.s = s; }); JA.chars.forEach(c => { const s = ja.kst?.[c.h]; if (s) c.s = s; }); }
}
const wKnown = w => akOn() && AK.langs.zh?.st?.[w.h] ? AK.langs.zh.st[w.h] === 'known' : learned(w.d);
function akUI(){
  const el = $('#ak'); if (!el) return;
  el.innerHTML = akOn() ? `<span class="akdot on"></span><span>Подключено · ${new Date(AK.at).toTimeString().slice(0, 5)}</span><button class="mini" id="akr">обновить</button>`
    : `<span class="akdot"></span><span>${akBusy ? 'Ищу Anki…' : akErr && akErr !== 'нет связи' ? 'Ошибка: ' + esc(akErr) : 'Anki не найден'}</span><button class="mini" id="akr">ещё раз</button><p class="akh">Нужен AnkiConnect: в Anki «Инструменты → Дополнения → Получить дополнения», код <b>2055492159</b>, в его Config поставь <b>"webBindPort": 8766</b> (8765 занят) и добавь адрес сайта в <b>webCorsOriginList</b>. Перезапусти Anki и держи его открытым.</p>`;
  $('#akr', el).onclick = e => { e.stopPropagation(); akSync(); akUI(); };
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') akSync(); });
setInterval(() => { if (document.visibilityState === 'visible') akSync(); }, 5 * 60e3);

/* ---------- calendar: every day until the exam (1 June), Easter holidays marked ---------- */
const EXAM = '2027-06-01', EASTER = '2027-03-22';
const isoD = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function calStart(){
  const ds = [...Object.keys(S.time), ...Object.values(S.doneOn || {}), ...Object.values(S.mem || {}).flatMap(m => Object.keys(m.log || {}).map(n => isoD(dayDate(+n))))].filter(Boolean).sort();
  return ds[0] && ds[0] < today() ? ds[0] : today();
}
function calHtml(){
  // the calendar starts on the plan's first day; a plan day's cell shows how much of THAT day is done, even if it is done later
  const P0 = S.lang === 'zh' ? PLAN_START : S.lang === 'ja' ? JA_START : S.lang === 'de' ? DE_START : null;
  const pDay = ds => P0 && ds >= P0 ? dIdx(P0, ds) + 1 : 0, cur = S.lang === 'zh' ? dateOfDay(curDay()) : S.lang === 'ja' && JG ? addDays(JA_START, jaCur() - 1) : S.lang === 'de' && DG ? addDays(DE_START, deCur() - 1) : null;
  const pFrac = k => { if (S.lang === 'zh') return k <= 40 ? frac(k) : 0; const de = S.lang === 'de'; if (de ? !DG : !JG) return 0; const T = de ? deTgtD : jaTgtD, a = k > 1 ? T(k - 1) : 0, b = T(k); return b > a ? Math.max(0, Math.min(1, (learnedN(S.lang) - a) / (b - a))) : 0; };
  const t = today(), start = P0 && P0 < t ? P0 : t, d0 = new Date(start + 'T12:00:00'); d0.setDate(d0.getDate() - (d0.getDay() + 6) % 7);   // from Monday
  const end = new Date(EXAM + 'T12:00:00'); end.setDate(end.getDate() + (7 - end.getDay()) % 7);
  const m = gMem(), planDone = new Set(Object.values(S.doneOn || {})), MS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  let cells = '', months = '', wk = 0, lastM = -1, left = 0;
  for (const d = new Date(d0); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = isoD(d), dow = (d.getDay() + 6) % 7;
    if (dow === 0) { months += `<span>${d.getMonth() !== lastM ? MS[d.getMonth()] : ''}</span>`; lastM = d.getMonth(); wk++; }
    let cls = '', tip = `${d.getDate()} ${MS[d.getMonth()]}`;
    if (ds < start || ds > EXAM) cls = 'out';
    else {
      const g = m.log[dayNo(d.getTime())], gn = g ? g.n + g.r : 0, mins = dayT(ds) / 60, sc = mins + gn * 3 + (S.lang === 'zh' && planDone.has(ds) ? 30 : 0);
      const k = pDay(ds), pf = k && ds <= t ? pFrac(k) : null;
      if (pf !== null) { cls = pf >= 1 ? 'l4' : pf >= .6 ? 'l3' : pf >= .3 ? 'l2' : pf > 0 ? 'l1' : ds < t ? 'miss' : ''; tip += ` · день ${k} · сделано ${Math.round(pf * 100)}%`; }
      else cls = ds > t ? 'fut' : sc >= 80 ? 'l4' : sc >= 40 ? 'l3' : sc >= 15 ? 'l2' : sc > 0 ? 'l1' : '';
      if (sc > 0) tip += ` · ${Math.round(mins)} мин${gn ? ` · тем ${gn}` : ''}`;
      if (ds >= t) left++;
    }
    if (ds === (cur || t)) cls += ' cur';
    if (ds === EASTER) { cls += ' eas'; tip += ' · пасхальные каникулы'; }
    if (ds === EXAM) { cls += ' exam'; tip += ' · экзамен'; }
    cells += `<i class="${cls}" title="${tip}"></i>`;
  }
  return `<div class="cal2" aria-label="Календарь до 1 июня" style="--wk:${wk}"><div class="cm">${months}</div><div class="cg">${cells}</div></div>`;
}

/* ---------- quiz ---------- */
let keyH = null;
const keys = fn => { if (keyH) removeEventListener('keydown', keyH); keyH = fn; if (fn) addEventListener('keydown', fn); };
function quiz(items, o){
  busy = true; const P = $('#P .pv') || $('#P'); let i = 0, ok = 0; const res = [];
  const step = () => {
    if (i >= items.length) { keys(null); busy = false; const msg = o.end(ok);
      P.innerHTML = `<div class="quiz"><span class="eye">${esc(o.title)}</span><span class="big num ${ok / items.length >= .8 ? 'tok' : ok / items.length < .6 ? 'tbad' : ''}">${ok}/${items.length}</span><p style="font-weight:800">${esc(msg)}</p><p><a class="btn main" href="${o.back}">Дальше</a></p></div>`;
      refit();
      if (o.back === location.hash) P.querySelector('a').onclick = e => { e.preventDefault(); route(); }; return; }
    const {q, key} = items[i], me = i; let ans = false;
    const next = () => { if (i !== me) return; i++; step(); };
    const fin = (good, extra = '') => { if (ans) return; ans = true; res[i] = good; if (good) ok++;
      const own = $('#wok', P) || $('#ock', P);   // write / order: their own button turns into «Дальше», no second one
      if (own) own.textContent = 'Дальше';
      $('#fb').innerHTML = (good ? '<b class="tok">Верно</b> ' : '<b class="tbad">Неверно</b> ') + extra + (good ? '' : `${own ? '' : ' <button class="btn main nx" id="nx">Дальше</button>'} <button class="btn ovr" id="ovr" title="Мой ответ тоже правильный">Засчитать</button>`); bindPlay(P);
      $('#nx', P) && ($('#nx', P).onclick = next);
      $('#ovr', P) && ($('#ovr', P).onclick = () => { if (i !== me || res[i]) return; res[i] = true; ok++; $('#wa', P)?.classList.replace('wrong', 'right'); $$('.o.wrong', P).forEach(x => x.classList.remove('wrong')); next(); });
      if (good) setTimeout(next, 900); };
    const JA = S.lang === 'ja', DEq = S.lang === 'de', LC = JA ? 'ja' : DEq ? 'de' : 'zh', tx = x => JA || DEq ? rich(x) : esc(x), sent = q.ja ?? q.de ?? q.zh;
    const opts = (arr, allZh) => { const ord = shuffle(arr.map((x, j) => [x, j])); return [ord, `<div class="opts">${ord.map(([x, j], n) => `<button class="o ${allZh || HAN.test(x) ? LC : ''} in" style="animation-delay:${n * 50}ms" data-j="${j}"><kbd>${n + 1}</kbd><span>${tx(x)}</span></button>`).join('')}</div>`]; };
    let ord = [], body = '';
    if (q.k === 'choice') { const r = opts(q.o); ord = r[0]; body = `<div class="qp">${JA || DEq ? rich(q.q) : zh(q.q)}</div>${r[1]}`; }
    if (q.k === 'listen') { const r = opts(q.o); ord = r[0]; body = `<div style="display:flex;gap:14px;align-items:center"><button class="play" id="qa" style="width:52px;height:52px" aria-label="Послушать">${I.play}</button><span class="qp">Что прозвучало?</span></div>${r[1]}`; }
    if (q.k === 'fill') { const r = opts(q.o, true); ord = r[0]; body = `<div class="qp">${esc(q.ru)}</div><div class="qz ${LC}" id="qz">${esc(sent).replace('＿', '<span style="display:inline-block;min-width:48px;border-bottom:2px solid var(--ink)">&nbsp;</span>')}</div>${r[1]}`; }
    if (q.k === 'write') body = `<div class="qp">${esc(q.ru)}</div>${q.ja || q.de ? `<div class="qz ${LC}" id="qz">${rich(q.ja || q.de)}</div>` : ''}<div class="wf"><input id="wa" class="${DEq ? 'de' : 'ja'}" lang="${DEq ? 'de' : 'ja'}" enterkeyhint="go" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ответ" aria-label="Ответ"><button class="btn main" id="wok">Проверить</button></div>`;
    if (q.k === 'order') { const all = shuffle([...q.t, ...(q.x || [])]);
      body = `<div class="qp">${esc(q.ru)}</div><div class="tiles" id="ans"></div><div class="tiles pool" id="pool">${all.map((x, n) => `<button class="tile ${JA ? 'ja' : ''}" data-n="${n + 1}"><kbd>${n + 1}</kbd>${esc(x)}</button>`).join('')}</div><p class="oc"><button class="btn main" id="ock">Проверить</button></p><p class="hint">цифра — взять · Backspace — убрать · Enter — проверить</p>`; }
    P.innerHTML = `<div class="quiz"><div class="qtop"><div class="bar">${items.map((_, k) => `<i class="${k < i ? (res[k] ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div><a class="qx" href="${o.exit || (o.back === '#s' ? '#lessons' : o.back)}">Выйти</a></div>${body}<p class="fb" id="fb"></p></div>`;
    const pick = j => { if (ans) return; const good = j === q.a;
      $$('.o', P).forEach(x => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add('right'); }); if (!good) $(`.o[data-j="${j}"]`, P).classList.add('wrong');
      let ex = ''; if (q.k === 'listen') ex = `<span class="zh">${esc(q.zh)}</span>`;
      if (q.k === 'fill') { const full = sent.replace('＿', q.o[q.a]); $('#qz').textContent = full; ex = JA || DEq ? '' : `<button class="play" data-t="${esc(full)}" style="display:inline-grid;vertical-align:middle;width:26px;height:26px" aria-label="Послушать">${I.play}</button>`; }
      fin(good, ex + (good ? '' : '')); };
    refit();
    $('.qx', P).onclick = () => { keys(null); busy = false; };
    $$('.o', P).forEach(b => b.onclick = () => pick(+b.dataset.j));
    if (q.k === 'listen') { $('#qa').onclick = () => sayT(q.zh, $('#qa')); if (touched) setTimeout(() => sayT(q.zh, $('#qa')), 200); }
    const check = () => { if (ans) return next(); const got = $$('#ans .tile', P).map(t => t.lastChild.textContent).join(DEq ? ' ' : ''), want = q.t.join(DEq ? ' ' : ''); if (!got) return;
      $$('.tile', P).forEach(t => t.disabled = true);
      fin(got === want, `<span class="${LC}" style="font-size:17px">${esc(want)}</span> ${JA || DEq ? '' : `<button class="play" data-t="${esc(want)}" style="display:inline-grid;vertical-align:middle;width:26px;height:26px" aria-label="Послушать">${I.play}</button>`}${got === want ? '' : ''}`); };
    const move = t => { if (ans) return; ($('#pool').contains(t) ? $('#ans') : $('#pool')).appendChild(t); };
    $$('.tile', P).forEach(t => t.onclick = () => move(t));
    if ($('#ock', P)) $('#ock', P).onclick = check;
    if (q.k === 'write') { const W = $('#wa', P), wcheck = () => { if (ans) return next(); if (!W.value.trim()) return W.focus(); if (!DEq) W.value = romajiToKana(W.value, true); const good = writeOk(W.value, q);
        W.readOnly = true; W.classList.add(good ? 'right' : 'wrong');
        fin(good, `<span class="${LC}" style="font-size:18px">${rich(q.a[0])}</span>`); };
      W.oninput = () => { if (!DEq && /[a-z]/i.test(W.value)) { const p = W.selectionStart === W.value.length; W.value = romajiToKana(W.value, false); if (p) W.setSelectionRange(W.value.length, W.value.length); } };
      W.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); wcheck(); } };
      $('#wok', P).onclick = wcheck; setTimeout(() => W.focus({preventScroll: true}), 60); }
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
  const ja = S.lang === 'ja' && JG && JA;
  if (S.lang === 'ja' && !ja) { loadJg().then(() => loadJa()).then(() => { if (S.lang === 'ja' && location.hash === '#stats') route(true); }); }
  // Japanese: words from the Anki deck, Genki topics with memory; Mandarin: the 40-day plan
  const lw = ja ? JA.words.filter(w => w.s === 'known').length : WORDS.filter(wKnown).length, wN = ja ? JA.words.length : WORDS.length;
  const nL = ja ? gTopics('ja').length : Object.keys(LES).length, nl = ja ? learnedN('ja') : Object.keys(LES).filter(passed).length;
  const tot = Object.keys(S.time).reduce((a, k) => a + dayT(k), 0), gm = overallMem(ja ? 'ja' : 'zh');
  const gRows = ja ? JG.lessons.map(l => ({name: l.n + ' · ' + l.name, n: l.topics.length, p: l.topics.filter(t => gMem('ja').cards[t.id]).length}))
    : PLAN.groups.map(g => { const ls = Object.values(LES).filter(l => l.g === g.id); return {name: g.name, n: ls.length, p: ls.filter(l => passed(l.id)).length}; });
  const ds = Object.keys(S.time).sort().slice(-21), mx = Math.max(.5, ...ds.map(d => dayT(d) / 3600)), W = 900, H = 170, bw = Math.min(30, (W - 40) / Math.max(ds.length, 1) - 6);
  let bars = '';
  ds.forEach((d, i) => { let y = H - 20; const x = 30 + i * (bw + 6);
    [['anki', 'var(--ink)'], ['phon', 'var(--mute)'], ['gram', 'var(--dim)']].forEach(([k, c]) => { const hh = sec(d, k) / 3600 / mx * (H - 40); if (hh) { y -= hh; bars += `<rect x="${x}" y="${y}" width="${bw}" height="${hh}" rx="3" fill="${c}"/>`; } });
    bars += `<text x="${x + bw / 2}" y="${H - 5}" text-anchor="middle">${d.slice(8)}.${d.slice(5, 7)}</text>`; });
  show(`<div class="st">
    <div class="card k"><b class="num">${lw}<span>/${wN}</span></b><span class="eye">слова</span></div>
    <div class="card k"><b class="num">${nl}<span>/${nL}</span></b><span class="eye">${ja ? 'темы' : 'уроки'}</span></div>
    <div class="card k"><b class="num">${h2(tot, 1)}<span> ч</span></b><span class="eye">время</span></div>
    <div class="card k mem"><b class="num">${gm === null ? '—' : pct(gm)}<span>${gm === null ? '' : '%'}</span></b><span class="eye">память грамматики</span></div>
    <div class="card wide"><span class="eye">часы · Anki / фонетика / грамматика</span><div class="chart" style="margin-top:12px">${ds.length ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Часы по дням">${bars}</svg>` : '<p class="mute" style="margin-top:8px">Появится после первого дня.</p>'}</div></div>
    <div class="card wide"><span class="eye">грамматика${ja ? ' · Genki' : ''}</span><div style="margin-top:10px">${gRows.map((g, i) =>
      `<div class="gb"><span>${esc(g.name)}</span><span class="t"><i style="width:${g.p / g.n * 100}%;animation-delay:${200 + i * 40}ms"></i></span><span class="num mute">${g.p}/${g.n}</span></div>`).join('')}</div></div>
  </div>`);
}

/* ---------- other languages ---------- */
{ const m = $('.menu'), hl = $('.menu .hl');
  const to = el => { hl.style.left = el.offsetLeft + 'px'; hl.style.width = el.offsetWidth + 'px'; hl.style.opacity = 1; };
  $$('.lang', m).forEach(el => el.addEventListener('mouseenter', () => to(el)));
  m.addEventListener('mouseleave', () => { hl.style.opacity = 0; }); }
{ const bw = $('.bw');
  const touch = () => matchMedia('(hover: none)').matches;
  // everywhere (mouse and touch): one click on the name goes home, a second tap within 0.4 s opens the languages
  let lastTap = 0;
  $('.brand', bw).addEventListener('click', e => { const now = Date.now();
    if (now - lastTap < 400) { e.preventDefault(); e.stopImmediatePropagation(); bw.classList.add('open'); bw.classList.remove('shut'); lastTap = 0; return; } lastTap = now; }, true);
  document.addEventListener('click', e => { if (bw.classList.contains('open') && !$('.brand', bw).contains(e.target)) bw.classList.remove('open'); });
  bw.addEventListener('click', e => { if (e.target.closest('.brand')) return; bw.classList.add('shut'); bw.classList.remove('open'); document.activeElement?.blur(); });
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
  const out = quiet ? null : app.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateX(${-70 * dir}px) scale(.98)`}], {duration: 220, easing: 'cubic-bezier(.5,0,.85,.3)', fill: 'forwards'});
  const need = k === 'ja' ? Promise.all([loadJa(), loadJg()]) : k === 'de' ? Promise.all([loadDe(), loadDg()]) : Promise.resolve();
  Promise.all([need.catch(() => {}), new Promise(r => setTimeout(r, quiet ? 0 : 235))]).then(() => { if (me !== swN) return;
    switching = false; route(true); swUntil = Date.now() + 1100;   // draw first, then hold off background redraws out?.cancel(); app.getAnimations().forEach(a => a.cancel());
    if (quiet) return;
    const box = app.firstElementChild, els = box ? ($('.top', box) ? [$('.top', box), $('.plan', box)] : [...box.children]) : [];
    const A = [...els.map((el, i) => el.animate([{opacity: 0, transform: `translateX(${110 * dir}px) scale(.98)`}, {opacity: 1, transform: 'none'}], {duration: 680, delay: i * 100, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'})),
      ...$$('.task', box).map((el, i) => el.animate([{opacity: 0, transform: `translateX(${40 * dir}px)`}, {opacity: 1, transform: 'none'}], {duration: 520, delay: 240 + i * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'}))];
    A.forEach(a => a.pause()); requestAnimationFrame(() => requestAnimationFrame(() => { if (me === swN) A.forEach(a => a.play()); }));
  });
}
$$('.lang[data-lang]').forEach(a => { const k = a.dataset.lang; a.href = SITE ? '/l/' + LANGS[k] + '/' : '#home';
  a.addEventListener('click', e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); $('.bw').blur?.(); document.activeElement?.blur(); switchLang(k, true); }); });
if (SITE) addEventListener('popstate', () => { const k = LK.find(x => location.pathname.startsWith('/l/' + LANGS[x])); if (k && k !== S.lang) switchLang(k, false); });
setLang(SITE || S.lang || 'zh'); brandTo(LANGS[S.lang]);

addEventListener('keydown', e => { if (busy || e.target.closest?.('input,textarea,select')) return; const k = {Numpad7: 'zh', Numpad8: 'de', Numpad9: 'ja'}[e.code]; if (k) { e.preventDefault(); switchLang(k, true); } });   // numpad 7 8 9 = languages

/* ---------- settings ---------- */
const pop = $('#pop');
$('#gear').onclick = e => { e.stopPropagation(); pop.classList.toggle('hide'); akUI(); };
$$('#th button').forEach(b => b.onclick = () => { S.settings.theme = b.dataset.v; theme(); persist(); hideFly(true); });
$$('#gi button').forEach(b => { b.setAttribute('aria-pressed', (b.dataset.v === '1') === (S.settings.girl !== false)); b.onclick = () => setGirl(b.dataset.v === '1'); });
document.addEventListener('click', e => { if (!pop.contains(e.target) && e.target.id !== 'gear') pop.classList.add('hide');
  if (innerWidth <= 860 && fly.classList.contains('on') && !fly.contains(e.target) && !e.target.closest('.row')) hideFly(true); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { pop.classList.add('hide'); hideFly(true); } });

/* ---------- router ---------- */
let swUntil = 0, swDefer = null;
function route(silent){
  document.body.classList.toggle('sess', location.hash === '#s' || location.hash.startsWith('#t-'));
  if (!PLAN || switching) return;
  if (silent && Date.now() < swUntil) return;   // the switch has just drawn this language with its data: a second redraw would only restart the animations
  const h = decodeURIComponent(location.hash.slice(1)) || 'home';
  const tab = /^(lesson|pinyin|review|start|s$|t-|jsheet|jmap)/.test(h) ? 'lessons' : h.startsWith('words') ? 'words' : h;
  $$('nav a[data-tab]').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  keys(null); busy = false; hideFly(true);
  if (silent) { first = true; curSec = ''; }
  if (h.startsWith('words')) return wordlist(h.split('-')[1]);
  if (h === 'lessons') return gToday();
  if (h.startsWith('lesson-')) { location.replace('#t-' + h.slice(7)); return; }
  if (h === 'review' || h === 'start') { location.replace('#s'); return; }
  if (h.startsWith('t-')) return gTopicPage(h.slice(2));
  if (h === 's') return gSession();
  if (h === 'jsheet') return jgSheet();
  if (h === 'jmap') return jgMap();
  if (h === 'pinyin') return pinyin();
  if (h === 'stats') return stats();
  home();
}
addEventListener('hashchange', () => route());
Promise.all(['/l/data/plan.json', '/l/data/words.json', '/l/data/lessons.json', '/l/data/pinyin.json', '/l/audio/map.json'].map(u => fetch(u, {cache: 'no-cache'}).then(r => r.json())))
  .then(([p, w, l, pin, am]) => { PLAN = p; WORDS = w.words; LES = l.lessons; PIN = pin; AMAP = am;
    const need = S.lang === 'ja' ? [loadJa(), loadJg()] : S.lang === 'de' ? [loadDe(), loadDg()] : [];   // the language on screen loads before the first paint
    Promise.all(need).catch(() => {}).then(() => { route(); akSync(); loadChars(); loadJa(); loadDe(); }); })
  .catch(() => { app.innerHTML = '<p class="mute" style="text-align:center;margin-top:30vh">Не удалось загрузить данные. Обнови страницу.</p>'; });
})();
