'use strict';
(function () {
  const D = window.LC_DATA;
  const main = document.getElementById('main');
  if (!D) { main.innerHTML = '<div class="empty">Не найден файл data.js рядом с index.html.</div>'; return; }

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 864e5;
  const dayOf = ts => Math.floor((ts - new Date(ts).getTimezoneOffset() * 6e4) / DAY);
  const today = () => dayOf(Date.now());
  const dateOfDay = d => { const t = d * DAY; return new Date(t + new Date(t).getTimezoneOffset() * 6e4); };
  // language: the UI is written in Russian; in English mode the translator at the end of this file rewrites the page
  const LANG = () => { try { return S.settings.lang || 'en'; } catch (e) { return 'en'; } };
  const EN = () => LANG() === 'en';
  const LOC = () => (EN() ? 'en-GB' : 'ru-RU');
  const fmtDay = d => dateOfDay(d).toLocaleDateString(LOC(), { day: 'numeric', month: 'short' });
  const fmtDate = ts => new Date(ts).toLocaleString(LOC(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fmtDur = sec => { sec = Math.round(sec || 0); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; const [uh, um, us] = EN() ? ['h', 'min', 's'] : ['ч', 'мин', 'с']; return h ? `${h} ${uh} ${m} ${um}` : m ? `${m} ${um} ${s ? s + ' ' + us : ''}`.trim() : `${s} ${us}`; };
  const fmtClock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const plural = (n, a, b, c) => { if (EN()) return n === 1 ? a : c; const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2200); }

  /* ---------- static data ---------- */
  const Q = D.questions, QBY = {};
  Q.forEach(q => { QBY[q.id] = q; });
  const SEC = {}, CHAP = {}, CHAPS = [];
  D.books.forEach(b => b.chapters.forEach(ch => {
    ch.book = b.id; CHAP[ch.id] = ch; CHAPS.push(ch);
    ch.sections.forEach(s => { s.chapter = ch.id; s.book = b.id; SEC[s.code] = s; });
  }));
  const chapOf = code => code.split('.')[0];
  const secLabel = code => { const s = SEC[code]; return s ? `К${s.book}·${s.n} ${s.name}` : code; };
  const secShort = code => { const s = SEC[code]; return s ? `К${s.book}·${s.n}` : code; };
  const partLabel = p => p === '-' ? 'весь вопрос' : '(' + p.replace(/\./g, ')(').replace('-', '–') + ')';
  const YEARS = [...new Set(Q.map(q => q.year))].sort();
  const CONF = {
    1: { n: 'Не решил', d: 'Не смог начать или решение неверное' },
    2: { n: 'С решением', d: 'Решил только подглядывая в решение / с большой подсказкой' },
    3: { n: 'Частично', d: 'Часть пунктов решена или есть ошибки' },
    4: { n: 'Решил', d: 'Решил сам, но с сомнениями или медленно' },
    5: { n: 'Уверенно', d: 'Решил быстро и уверенно' },
  };
  const IVS = [[0, 'Сегодня'], [1, 'Завтра'], [2, '2 дня'], [4, '4 дня'], [7, 'Неделя'], [14, '2 недели'], [30, 'Месяц'], [60, '2 месяца'], [90, '3 месяца'], [null, 'Не показывать']];
  const ivName = d => d == null ? 'не показывать' : d === 0 ? 'сегодня' : d === 1 ? 'завтра' : `${d} ${plural(d, 'день', 'дня', 'дней')}`;
  // how often each subsection appears in the papers (by sub-part)
  const FREQ = {}; let FREQ_TOTAL = 0;
  Q.forEach(q => q.parts.forEach(p => p.codes.forEach(c => { FREQ[c] = (FREQ[c] || 0) + 1; FREQ_TOTAL++; })));

  /* ---------- textbook data (book.js) ---------- */
  const TT = window.TT_DATA || { books: [], groups: {}, items: [] };
  const TI = TT.items, TBY = {}, TG = TT.groups, GITEMS = {}, TBOOK = {}, TCH = {}, BOOK_ORDER = [];
  TI.forEach(t => { TBY[t.id] = t; (GITEMS[t.g] || (GITEMS[t.g] = [])).push(t); });
  Object.values(GITEMS).forEach(a => a.sort((x, y) => x.n - y.n));
  const gIds = g => (GITEMS[g] || []).map(t => t.id);
  TT.books.forEach(b => {
    TBOOK[b.id] = b;
    b.chapters.forEach(ch => {
      ch.book = b.id; ch.key = `${b.id}-${ch.n}`; TCH[ch.key] = ch;
      ch.groups = ch.sections.flatMap(s => s.groups);
      ch.revGroups = ['A', 'B', 'C'].map(t => ch.rev[t]).filter(Boolean);
      ch.exItems = ch.groups.flatMap(gIds);
      ch.revItems = ch.revGroups.flatMap(gIds);
      BOOK_ORDER.push(...ch.exItems, ...ch.revItems);
    });
  });
  const TIER = { A: { n: 'Core', ru: 'Базовый уровень', medal: '🥉', w: 1 }, B: { n: 'Advanced', ru: 'Продвинутый уровень', medal: '🥈', w: 2 }, C: { n: 'Extended-Response', ru: 'Развёрнутые задачи', medal: '🥇', w: 3 } };
  const groupTitle = g => g.kind === 'ex' ? `Упражнение ${g.key}` : `Повторение главы ${g.chapter} · ${TIER[g.tier].n}`;
  const bookTitle = t => { const g = TG[t.g]; return `${TBOOK[g.book].short} · ${groupTitle(g)} · №${t.n}`; };
  /* ---------- plans and paid content ----------
     On the published site (BM_CONFIG.cloud) the images, the worked solutions and the lore come from Supabase,
     which hands them out by plan; locally they are read from this folder. The plan checks below only shape the
     interface — what a plan may see is enforced by the database. */
  const ACC = window.BM || null;
  const CLOUD = !!(ACC && ACC.cloud);
  const PLAN_RANK = { none: 0, free: 1, pro: 2, max: 3 };
  const PLAN_LABEL = { none: 'Free', free: 'Free', pro: 'Pro', max: 'Max' };
  const myPlan = () => (ACC ? ACC.plan : 'max');
  const hasPlan = need => PLAN_RANK[myPlan()] >= PLAN_RANK[need];
  const SYNC = { at: 0, err: null, busy: false, t: null }; // MAX: progress sync between devices (see syncNow)
  // the textbooks and the 2015–2016 papers are free; the other papers are Pro
  const tierOf = path => (/^book\//.test(path) || /^(q|ms)\/(2015|2016)_/.test(path) || /^qc\/(2015|2016)-/.test(path) ? 'free' : 'pro');
  /* ---------- exam questions cut to the parts of a topic (tools/cutparts.py) ----------
     On the Path (a topic's exam questions, a boss fight) a question shows only the parts of that topic or chapter;
     the Vault always shows it whole. A note gives what a kept part needs from a cut one. */
  const CUTS = window.LC_CUTS || {};
  function cutFor(q, ctx) {
    const c = CUTS[q.id]; if (!c || !ctx) return null;
    const ch = String(ctx).startsWith('ch:') ? TCH[String(ctx).slice(3)] : null;
    const codes = ch ? ch.sections.map(x => x.code) : [ctx];
    const keep = q.parts.filter(p => p.codes.some(x => codes.includes(x))).map(p => p.p);
    if (!keep.length || keep.length === q.parts.length) return null;
    const e = c[keep.join('+')];
    const given = ((window.LC_CUT_NOTES || {})[q.id] || {})[keep.join('+')] || null;
    return e ? Object.assign({ keep, chapter: !!ch, given }, e) : null;
  }
  const partName = k => k.split('.').map(x => `(${x})`).join('');
  const cutBar = (cut, full, act, id) => `<div class="cutbar"><span class="cb-ic">✂</span><span class="cb-l">${full ? L('Показан весь вопрос', 'Showing the whole question') : `${L('Показаны только', 'Showing only')} <b>${cut.keep.map(partName).join(' ')}</b> — ${cut.chapter ? L('части этой главы', 'the parts on this chapter') : L('части этой темы', 'the parts on this topic')}`}</span><button class="btn sm ghost" data-a="${act}" data-id="${id}">${full ? L('Только нужные части', 'Only the needed parts') : L('Весь вопрос', 'Whole question')}</button></div>`;
  // what a kept part needs from a cut one, typeset on the paper above the question (rendered by tools/cutnotes.js)
  const givenSheet = cut => {
    if (!cut.given) return '';
    const from = esc(cut.given.from), keep = cut.keep.map(partName).join(' ');
    return `<div class="given-sheet" data-notr style="max-width:${S.settings.imgw}px"><div class="gs-h"><span class="gs-tag">${L('Дано', 'Given')}</span><span class="gs-t">${L('Ответ части', 'The answer to part')} ${from}</span></div>
      <div class="gs-why">${L(`Часть ${from} — из другой темы, поэтому скрыта. Её результат нужен для ${keep}: просто используй его.`, `Part ${from} is on another topic, so it is hidden. ${keep} builds on its result: just use it.`)}</div>
      <div class="gs-b">${EN() ? cut.given.en : cut.given.ru}</div></div>`;
  };
  const canSee = path => !path || hasPlan(tierOf(path));
  const itemTier = id => { const it = itemOf(id); return it ? tierOf(it.img) : 'free'; };
  const lockBox = (tier, what) => `<div class="lockbox"><span class="lk">🔒</span><b>${what || L('Этот материал', 'This material')} — ${L('в тарифе', 'in the plan')} ${PLAN_LABEL[tier]}</b>
    <span class="small muted">${tier === 'max' ? L('Max: всё из Pro, финальный босс, все записки лора, пробные экзамены и синхронизация между устройствами.', 'Max: everything in Pro, the final boss, all lore notes, mock exams and sync between devices.') : L('Pro: адаптивный режим изучения, вся статистика, ранги и достижения, история и Отсчёт, все экзамены 2015–2026 с marking schemes и решения задач на доказательство.', 'Pro: the adaptive study mode, all statistics, ranks and achievements, history and the Countdown, every paper 2015–2026 with marking schemes and worked solutions to proofs.')}</span>
    <a class="btn pri sm" href="../index.html#pricing">${L('Посмотреть тарифы', 'See the plans')}</a></div>`;
  // a free account sees what these Pro pages give instead of the page itself (the sessions list stays open)
  const PRO_PAGES = {
    stats: () => [L('Статистика', 'Statistics'), [L('обзор прогресса по учебникам и экзаменам', 'progress across the textbooks and the papers'), L('темы и главы: что изучено и что подтянуть', 'topics and chapters: what is studied and what needs work'), L('календарь занятий, уверенность по неделям, журнал попыток', 'practice calendar, confidence by week, the log of attempts'), L('карта экзаменов: какие темы чаще всего на Paper 1 и 2', 'the exam map: which topics come up most on Paper 1 and 2'), L('ранги и достижения', 'ranks and achievements')]],
    history: () => [L('История', 'History'), [L('хроника по дням: темы, боссы, ранги', 'a day-by-day chronicle: topics, bosses, ranks'), L('вехи подготовки на одной ленте', 'the milestones of your preparation on one timeline')]],
    doom: () => [L('Отсчёт', 'Countdown'), [L('сколько дней осталось и сколько ушло впустую', 'how many days are left and how many went to waste'), L('твой темп и прогноз к экзамену', 'your pace and the forecast for the exam'), L('учебный год по дням и задачи по неделям', 'the school year by day and questions by week')]],
  };
  function proPage(v) {
    if (hasPlan('pro') || !PRO_PAGES[v] || (v === 'stats' && statsTab === 'sessions')) return '';
    const [name, list] = PRO_PAGES[v]();
    return `<div class="pagehead"><div><div class="eyebrow">pro</div><h1>${name}</h1></div></div>
      <div class="propage">${lockBox('pro', name)}<ul class="prolist">${list.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  }
  // the free plan's home: what Pro adds, where the rank card would be
  const proPitch = () => `<a class="propitch" href="../index.html#pricing"><div class="eyebrow">pro</div><b>${L('Всё, что превращает задачи в подготовку', 'Everything that turns questions into preparation')}</b>
    <ul>${[L('Адаптивный режим изучения каждой темы', 'Adaptive study of every topic'), L('Статистика, прогноз и Отсчёт', 'Statistics, forecast and the Countdown'), L('Ранги и достижения', 'Ranks and achievements'), L('Все экзамены 2015–2026 с marking schemes', 'Every paper 2015–2026 with marking schemes')].map(x => `<li>${x}</li>`).join('')}</ul>
    <span class="btn pri sm">${L('Посмотреть тарифы', 'See the plans')}</span></a>`;
  const kpiLock = name => `<a class="kpi kpilock" href="../index.html#pricing"><b>🔒</b><span>${name} — Pro</span></a>`;
  function upsell(tier, what) { openModal(`<div class="box narrow">${lockBox(tier, what)}<div class="row" style="justify-content:center;margin-top:12px"><button class="btn sm ghost" data-a="closeModal">${L('Закрыть', 'Close')}</button></div></div>`); }
  // worked solutions written by Claude for questions whose book answer is only "Proof" or missing (Pro);
  // which questions have one is public (sol_ids.js), the texts are loaded for Pro
  const SOL = window.TT_SOL || {};
  const SOLIDS = new Set(window.TT_SOL_IDS || Object.keys(SOL));
  const csolBox = id => !hasPlan('pro') ? lockBox('pro', L('Решение Claude', 'Claude’s solution')) : `<div class="csol" id="cs"><div class="csol-h">✍ Решение написано Claude<span class="tiny muted"> · в ответах книги к этой задаче только «Proof» или ответа нет. Если найдёте ошибку — отметьте «⚐ Нет ответа?» и пришлите список.</span></div>${SOL[id] == null ? `<div class="muted small">${L('Загрузка решения…', 'Loading the solution…')}</div>` : `<div class="csol-b" data-notr>${esc(SOL[id])}</div>`}</div>`;
  function itemOf(id) {
    const q = QBY[id];
    if (q) return { id, kind: 'exam', q, title: qTitle(q), img: q.img, size: q.size, sol: q.ms, solSize: q.msSize, solName: 'решение (marking scheme)' };
    const t = TBY[id]; if (!t) return null;
    const g = TG[t.g];
    const whole = !t.ans && g.ansAll;
    return { id, kind: 'book', t, g, title: bookTitle(t), img: t.img, size: t.size, sol: whole ? g.ansAll.img : t.ans, solSize: whole ? g.ansAll.size : t.ansSize, solName: 'ответ', approx: t.ansApprox || !!whole, csol: SOLIDS.has(id) };
  }

  /* ---------- persistent state ---------- */
  const KEY = 'lcm_state_v1';
  const DEF_SETTINGS = { iv: { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 }, goal: 5, theme: 'auto', imgw: 880, newPerDay: 5, accent: 'blue', bg: 'grid', motion: 'full', lang: (() => { try { return localStorage.getItem('bm_lang') || 'en'; } catch (e) { return 'en'; } })() };
  function fresh() { return { version: 1, attempts: [], stars: {}, notes: {}, tags: {}, settings: JSON.parse(JSON.stringify(DEF_SETTINGS)), session: null, lastExport: null, created: Date.now(), challenges: {}, sessions: {}, flags: {}, ach: {}, study: {} }; }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.version) { s.settings = Object.assign({}, DEF_SETTINGS, s.settings || {}); s.settings.iv = Object.assign({}, DEF_SETTINGS.iv, s.settings.iv || {}); ['stars', 'notes', 'tags', 'challenges', 'sessions', 'flags', 'ach', 'study'].forEach(k => s[k] = s[k] || {}); s.attempts = s.attempts || []; return s; }
    } catch (e) { /* ignore */ }
    return fresh();
  }
  let S = load();
  (() => {
    if (!S.events) return;
    const seen = new Set(), n = S.events.length;
    S.events = S.events.filter(e => { if (!['topic', 'tfull', 'reveal', 'rank'].includes(e.k)) return true; const k = e.k + ':' + (e.code || e.ch || e.r); if (seen.has(k)) return false; seen.add(k); return true; });
    if (S.events.length !== n) localStorage.setItem(KEY, JSON.stringify(S));
  })();
  function saveLocal() { MEMO = {}; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Не удалось сохранить прогресс в браузере'); } }
  function save() { saveLocal(); syncSoon(); }

  /* ---------- derived cards ---------- */
  let C = {}, LIVE = [], CTXA = {};
  let MEMO = {};
  const memo = (k, f) => (k in MEMO ? MEMO[k] : (MEMO[k] = f()));
  function sessOff(id) { return !!(id && S.sessions[id] && S.sessions[id].off); }
  function rebuild(tMax = Infinity) {
    C = {}; CTXA = {}; MEMO = {};
    LIVE = S.attempts.filter(a => a.t < tMax && (QBY[a.q] || TBY[a.q]) && !sessOff(a.sess)).sort((a, b) => a.t - b.t);
    LIVE.forEach(a => {
      const c = C[a.q] || (C[a.q] = { n: 0, time: 0, first: a.t, hist: [] });
      c.n++; c.time += a.time || 0; c.last = a; c.lastConf = a.conf; c.iv = a.iv;
      c.retired = a.iv == null; c.due = a.iv == null ? null : dayOf(a.t) + a.iv;
      c.hist.push(a);
      if (QBY[a.q]) { const x = attCtx(a); if (x) (CTXA[a.q] || (CTXA[a.q] = {}))[x] = a; }
    });
  }
  rebuild();
  // An exam question counts for a topic (and its chapter boss) only when it was solved in that topic's context:
  // a topic exam session, the topic's study run, or the chapter's boss fight ('ch:<chapter>'). Attempts saved
  // before contexts existed get theirs from the session they belong to. Questions with one topic count anywhere.
  function attCtx(a) {
    const own = attCtxOwn(a); if (own) return own;
    // a question with a single topic is always solved in that topic's context
    const cs = S.tags[a.q] || QBY[a.q].codes; return cs.length === 1 ? cs[0] : null;
  }
  function attCtxOwn(a) {
    if ('ctx' in a) return a.ctx;
    const rec = S.sessions[a.sess]; if (!rec) return null;
    if (rec.ctx) return rec.ctx;
    if (rec.boss) return 'ch:' + rec.boss;
    if (rec.study && TG[rec.study]) return TG[rec.study].sec || null;
    const L0 = attCtxOwn.legacy || (attCtxOwn.legacy = {}); if (!attCtxOwn.legacyDone) { attCtxOwn.legacyDone = true; Object.keys(SEC).forEach(code => { L0[`${secShort(code)} ${SEC[code].name}`] = code; L0[`Экзамен по теме: ${SEC[code].n} ${SEC[code].name}`] = code; }); }
    return L0[rec.title] || null;
  }
  const status = id => { const c = C[id]; if (!c) return 'new'; if (c.retired) return 'retired'; return c.due <= today() ? 'due' : 'sched'; };
  const ST_NAME = { new: 'Новый', due: 'Пора повторить', sched: 'Запланирован', retired: 'Не показывать' };
  const codesOf = q => S.tags[q.id] || q.codes;
  const partsOf = q => S.tags[q.id] ? [] : q.parts;
  // confidence of the latest attempt for a given subsection
  function confFor(q, code) {
    const c = C[q.id]; if (!c) return null;
    const a = c.last; const ps = partsOf(q).filter(p => p.codes.includes(code));
    if (a.parts && ps.length) { const v = ps.map(p => a.parts[p.p]).filter(x => x); if (v.length) return avg(v); }
    return a.conf;
  }
  const chOfCode = code => String(code).split('.')[0];
  // the rating an attempt gives to one subsection (its parts for that subsection if they were rated)
  function partConf(q, a, code) {
    const ps = partsOf(q).filter(p => p.codes.includes(code));
    if (a.parts && ps.length) { const v = ps.map(p => a.parts[p.p]).filter(x => x); if (v.length) return avg(v); }
    return a.conf;
  }
  // the latest attempt of q made in the context of a topic (or of its chapter's boss fight)
  function ctxAtt(q, code) {
    const m = CTXA[q.id]; if (!m) return null;
    const a = m[code], b = m['ch:' + chOfCode(code)];
    return a && b ? (a.t > b.t ? a : b) : a || b || null;
  }
  const ctxConf = (q, code) => { const a = ctxAtt(q, code); return a ? partConf(q, a, code) : 0; };
  // ... and in the context of any topic of a chapter
  function chAtt(q, key) {
    const m = CTXA[q.id]; if (!m) return null;
    let best = null;
    Object.entries(m).forEach(([x, a]) => { if ((x === 'ch:' + key || chOfCode(x) === key) && (!best || a.t > best.t)) best = a; });
    return best;
  }
  // solved at least once, but not in this context: shown with a light outline, counts for nothing here
  const elsewhere = (q, att) => !!C[q.id] && !att;
  // a question is passed fully once it is at 4–5 in every topic it belongs to
  const qTopics = q => codesOf(q).filter(c => TOPIC[c]);
  const qFull = q => { const cs = qTopics(q); return cs.length > 0 && cs.every(c => ctxConf(q, c) >= 4); };
  function suggest(id, conf) {
    const base = +S.settings.iv[conf];
    const c = C[id];
    if (conf >= 4 && c && c.lastConf >= 4 && c.iv > 0) return Math.min(180, Math.max(base, Math.round(c.iv * (conf === 5 ? 2.5 : 1.8))));
    return base;
  }
  const dueAll = () => Q.map(q => q.id).concat(BOOK_ORDER).filter(id => status(id) === 'due').sort((a, b) => C[a].due - C[b].due || C[a].lastConf - C[b].lastConf);
  const dueList = () => Q.filter(q => status(q.id) === 'due').sort((a, b) => C[a.id].due - C[b.id].due || C[a.id].lastConf - C[b.id].lastConf);

  /* ---------- theme ---------- */
  function applyTheme() {
    const st = S.settings, el = document.documentElement;
    if (st.theme === 'auto') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', st.theme);
    el.setAttribute('data-accent', st.accent || 'blue'); el.setAttribute('data-bg', st.bg || 'grid'); el.setAttribute('data-motion', st.motion || 'full');
  }
  applyTheme();

  /* ---------- bank filters (per-viewer convenience) ---------- */
  const BF_KEY = 'lcm_bank_filters';
  const BF_DEF = { text: '', codes: [], years: [], papers: [], sections: [], status: [], conf: [], star: false, open: [] };
  let BF = (() => { try { return Object.assign({}, BF_DEF, JSON.parse(localStorage.getItem(BF_KEY)) || {}); } catch (e) { return Object.assign({}, BF_DEF); } })();
  const saveBF = () => { try { localStorage.setItem(BF_KEY, JSON.stringify(BF)); } catch (e) { /* ignore */ } };
  function passes(q, f = BF) {
    if (f.codes.length && !codesOf(q).some(c => f.codes.includes(c))) return false;
    if (f.years.length && !f.years.includes(q.year)) return false;
    if (f.papers.length && !f.papers.includes(q.paper)) return false;
    if (f.sections.length && !f.sections.includes(q.section)) return false;
    if (f.status.length && !f.status.includes(status(q.id))) return false;
    if (f.conf.length) { const c = C[q.id]; if (!c || !f.conf.includes(c.lastConf)) return false; }
    if (f.star && !S.stars[q.id]) return false;
    if (f.text) {
      const t = f.text.toLowerCase().replace(/\s+/g, '');
      const hay = (`${q.year}p${q.paper}q${q.q}` + q.id + codesOf(q).map(c => secLabel(c)).join('|') + (S.notes[q.id] || '')).toLowerCase().replace(/\s+/g, '');
      if (!hay.includes(t)) return false;
    }
    return true;
  }
  const filtered = () => Q.filter(q => passes(q));

  /* ---------- routing ---------- */
  let view = 'home';
  let skipHash = false;
  function go(v) { if (location.hash.slice(1) !== v) { skipHash = true; location.hash = v; } route(); }
  let bookSub = '';
  function route() {
    const h = location.hash.slice(1) || 'home';
    let [v, sub] = h.split('/');
    if (v === 'awards') { statsTab = 'ach'; v = 'stats'; }
    view = ['home', 'bank', 'book', 'practice', 'stats', 'history', 'doom', 'archive', 'settings'].includes(v) ? v : 'home';
    bookSub = view === 'book' ? (sub || '') : '';
    if (view === 'practice' && !S.session) view = 'home';
    render();
  }
  window.addEventListener('hashchange', () => { if (skipHash) { skipHash = false; return; } route(); });
  const VIEWS = {};
  function render() {
    document.querySelectorAll('#nav .tab').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    const gear = $('#gearBtn'); if (gear) gear.classList.toggle('on', view === 'settings');
    const edue = dueList().length, bdue = TI.length ? bookDue().length : 0;
    $('#nav [data-v="book"]').innerHTML = 'Путь' + (bdue ? `<span class="badge">${bdue}</span>` : '');
    $('#nav [data-v="bank"]').innerHTML = 'Хранилище' + (edue ? `<span class="badge">${edue}</span>` : '');
    $('#tab-practice').classList.toggle('hidden', !S.session);
    ['stats', 'history', 'doom'].forEach(v => { const b = $(`#nav [data-v="${v}"]`); if (b) b.classList.toggle('pro', !hasPlan('pro')); });
    headerRight();
    // on phones the tabs are one swipeable row: keep the open one in sight
    const nv = $('#nav'), on = nv && nv.querySelector('.tab.on');
    if (on && nv.scrollWidth > nv.clientWidth) nv.scrollLeft += on.getBoundingClientRect().left - nv.getBoundingClientRect().left - (nv.clientWidth - on.offsetWidth) / 2;
    const keep = {}; document.querySelectorAll('[data-ks]').forEach(e => { keep[e.dataset.ks] = e.scrollTop; });
    const y = window.scrollY;
    const key = view + bookSub + (view === 'stats' ? statsTab : '') + (view === 'bank' ? vaultTab : '') + (view === 'practice' && S.session ? S.session.id + ':' + S.session.i : '');
    const entering = key !== lastKey;
    // page changes are animated both ways: the old page leaves while the new one comes in
    if (entering && lastKey && !render.vt && !motionOff() && document.startViewTransition) {
      // the browser may hold the update while it is not painting (a background tab): never wait more than 350 ms
      render.vt = true;
      let ran = false;
      const run = () => { if (ran) return; ran = true; render(); render.vt = false; };
      try { const vt = document.startViewTransition(run); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(x => x && x.catch(() => { })); } catch (e) { run(); }
      setTimeout(run, 350);
      return;
    }
    main.innerHTML = proPage(view) || VIEWS[view]();
    main.classList.toggle('enter', entering && !motionOff());
    (AFTER[view] || (() => { }))();
    document.querySelectorAll('[data-ks]').forEach(e => { if (keep[e.dataset.ks]) e.scrollTop = keep[e.dataset.ks]; });
    window.scrollTo(0, entering ? 0 : y);
    lastKey = key;
    if (entering) countUp(main);
    document.body.classList.toggle('focus', busy());
    progressCheck();
    // a seal and a note can only come once a session is finished
    const s = S.session;
    if (s && view === 'practice' && !busy() && !s.lored) { s.lored = 1; finalCheck(s); save(); loreCheck(s); render(); return; }
    if (HELD.length && !busy()) { clearTimeout(showOverlay.h); showOverlay.h = setTimeout(flushOverlays, 450); }
  }
  let lastKey = '';
  const AFTER = {};

  /* ---------- small renderers ---------- */
  const confDot = v => v ? `<span class="dot cf${Math.round(v)}" title="${esc(CONF[Math.round(v)].n)}"></span>` : '<span class="dot" title="ещё не решался"></span>';
  const stBadge = id => { const s = status(id); const c = C[id]; let t = ST_NAME[s]; if (s === 'sched') t = 'через ' + ivName(c.due - today()).replace('завтра', '1 день'); if (s === 'due' && c.due < today()) t = 'просрочен ' + (today() - c.due) + ' дн.'; return `<span class="st st-${s}">${esc(t)}</span>`; };
  const qTitle = q => `${q.year} · Paper ${q.paper} · Q${q.q}`;
  const starBtn = id => `<button class="starbtn ${S.stars[id] ? 'on' : ''}" data-a="star" data-id="${id}" title="Избранное">★</button>`;
  const pdfLink = (q, ms) => {
    const file = ms ? 'marking scheme.pdf' : `Paper ${q.paper}.pdf`;
    const pg = ms ? (q.msPages || [])[0] : q.pages[0];
    return `../${q.year}/${encodeURIComponent(file)}#page=${pg || 1}`;
  };
  // scale: textbook crops are 2x scans, so show them at a fixed fraction of their size (short crops stay small)
  const BOOK_SCALE = 0.68;
  const imgTag = (src, size, alt, scale) => {
    if (!canSee(src)) return lockBox(tierOf(src));
    const dims = size ? `width="${size[0]}" height="${size[1]}"` : '', w = scale && size ? Math.min(S.settings.imgw, Math.round(size[0] * scale)) : S.settings.imgw;
    return CLOUD ? `<img class="cimg" data-c="${esc(src)}" alt="${esc(alt)}" ${dims} style="max-width:${w}px">` : `<img src="${src}" alt="${esc(alt)}" ${dims} style="max-width:${w}px">`;
  };
  // private bucket: links signed in batches, cached until shortly before they expire
  const SIGNED = new Map();
  let signT = null;
  function resolveImages() {
    clearTimeout(signT);
    signT = setTimeout(async () => {
      const imgs = [...document.querySelectorAll('img[data-c]:not([src])')]; if (!imgs.length) return;
      const now = Date.now(), need = [...new Set(imgs.map(i => i.dataset.c))].filter(p => !(SIGNED.get(p) && SIGNED.get(p).exp > now));
      if (need.length) {
        const { data } = await ACC.sb.storage.from('content').createSignedUrls(need.map(p => tierOf(p) + '/' + p), 3600);
        (data || []).forEach((d, k) => { if (d && d.signedUrl) SIGNED.set(need[k], { url: d.signedUrl, exp: now + 3300e3 }); });
      }
      imgs.forEach(i => { const x = SIGNED.get(i.dataset.c); if (x) i.src = x.url; else i.classList.add('cerr'); });
    }, 0);
  }
  if (CLOUD) new MutationObserver(resolveImages).observe(document.body, { childList: true, subtree: true });
  function tagChips(q, max = 99, dots = false) {
    const cs = codesOf(q);
    const out = cs.slice(0, max).map(c => `<span class="chip" title="${esc(secLabel(c))}">${dots && TOPIC[c] ? `<i class="tdot ${topicState(c).status}"></i>` : ''}${esc(secShort(c))} ${esc((SEC[c] || {}).name || '')}</span>`);
    if (cs.length > max) out.push(`<span class="chip">+${cs.length - max}</span>`);
    return out.join('');
  }

  /* ================= HOME ================= */
  VIEWS.home = () => {
    const st = computeStats('all');
    const due = dueAll(), edue = dueList().length, bdue = bookDue().length;
    const todayN = LIVE.filter(a => dayOf(a.t) === today()).length;
    const goal = +S.settings.goal || 5;
    const exportOld = S.attempts.length >= 10 && (!S.lastExport || Date.now() - S.lastExport > 7 * DAY);
    const nt = nextTopic();
    const cur = nt ? nt.t.ch : CHS.find(ch => chState(ch).state === 'none') || CHS[0];
    const cs = cur ? chState(cur) : null;
    const exDone = Q.filter(q => C[q.id]).length, bk = prog(BOOK_ORDER);
    const hr = new Date().getHours();
    const hello = hr < 5 ? 'Доброй ночи' : hr < 12 ? 'Доброе утро' : hr < 18 ? 'Добрый день' : 'Добрый вечер';
    let h = '';
    if (exportOld) h += `<div class="notice row"><span class="grow">Прогресс хранится только в этом браузере. Сделайте резервную копию, чтобы его не потерять.</span><button class="btn sm pri" data-a="export">Скачать копию</button></div>`;
    if (finalState() === 'awake') h += `<a class="notice row fnotice" href="#book/final"><span class="grow"><b data-notr>${L('Экзаменатор', 'The Examiner')}</b> ${L('сегодня ещё не запечатан.', 'has not been sealed today.')}</span><button class="btn sm boss-btn" data-a="finalFight">⛓ ${L('Запечатать', 'Seal him')}</button></a>`;
    if (S.session) {
      const s = S.session;
      h += s.i < s.qids.length
        ? `<div class="notice row"><span class="grow"><b>Незаконченная сессия:</b> ${esc(s.title)} — решено ${s.i} из ${s.qids.length}</span><button class="btn sm pri" data-a="go" data-v="practice">Продолжить</button><button class="btn sm" data-a="endSession">Завершить</button></div>`
        : `<div class="notice row"><span class="grow"><b>Сессия завершена:</b> ${esc(s.title)}</span><button class="btn sm" data-a="go" data-v="practice">Итоги</button><button class="btn sm" data-a="closeSession" data-v="home">Закрыть</button></div>`;
    }
    h += `<section class="card hero">
      <div class="hero-l">
        <div class="eyebrow">bedarev math · ${esc(new Date().toLocaleDateString(LOC(), { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
        <h1 class="hero-h">${hello}.<span class="muted">${todayN ? (todayN >= goal ? `Цель дня выполнена: решено ${todayN}.` : `Сегодня решено ${todayN} из ${goal}.`) : cur ? `Глава ${cur.n} · ${esc(cur.name)} ждёт.` : 'Все главы пройдены.'}</span></h1>
        ${topicBar(ALL_TOPICS, { big: true, title: 'Изучено тем' })}
        <div class="hero-books">${TT.books.map(b => { const codes = b.chapters.flatMap(chTopics), s = topicSum(codes); return `<div><div class="tiny muted">${esc(b.title)} · ${esc(b.name)}</div><div class="row" style="gap:8px;flex-wrap:nowrap"><b class="mono small">${s.done}/${s.total}${s.full ? ` <span class="tfull-n">★${s.full}</span>` : ''}</b><div style="flex:1">${topicBar(codes, { label: false })}</div></div></div>`; }).join('')}</div>
        <div class="row" style="margin-top:20px">${ntBtn(nt, 'btn pri lg')}<button class="btn lg" data-a="startDueAll" ${due.length ? '' : 'disabled'}>↻ Повторение <span class="badge">${due.length}</span></button></div>
      </div>
      <div class="hero-r">${hasPlan('pro') ? rankCard() : proPitch()}</div>
      ${heroDeco()}
    </section>`;
    if (cur && cs) {
      const B = BOSS[cur.key], s = bossStateOf(cs);
      h += `<div class="grid g2" style="margin-top:14px">
        <div class="card curch"><div class="eyebrow">текущая глава</div>
          <div class="row" style="margin-top:8px;align-items:flex-start;flex-wrap:nowrap"><div class="grow" style="min-width:0"><h2 style="font-size:1.15rem;margin:0 0 4px">${cur.n}. ${esc(cur.name)}</h2><div class="tiny muted">${esc(TBOOK[cur.book].title)}</div>
            <div style="margin-top:12px">${topicBar(cs.codes, { title: 'Темы главы' })}</div>
            ${nt && nt.t.ch === cur ? `<div class="small" style="margin-top:12px">Следующая тема: <b>${esc(nt.t.s.n)} ${esc(nt.t.s.name)}</b> ${topicChip(nt.t.code)}</div>` : ''}
            <div class="row" style="margin-top:12px"><button class="btn sm" data-a="go" data-v="book/${cur.key}">Открыть главу →</button></div></div></div></div>
        ${bossKnown(cur) ? `<div class="minib ${s}" data-a="go" data-v="book/${cur.key}" style="--bh:${B.h}">${bossArt(cur, 150, s)}<div class="grow" style="min-width:0"><div class="boss-cap">босс главы ${cur.n}</div><div class="mb-name">${esc(B.n)}</div><div class="boss-title">${esc(B.t)}</div>
          <div class="hp-l" style="margin-top:12px"><span>HP</span><b>${cs.hp}</b><span>/ ${cs.ex.length}</span></div><div class="hpmini dark"><i style="width:${pct(cs.hp, cs.ex.length)}%"></i></div>
          <button class="btn boss-btn sm" style="margin-top:12px" data-a="bossFight" data-ch="${cur.key}">⚔ В бой</button></div></div>`
          : `<div class="minib unknown" data-a="go" data-v="book/${cur.key}" style="--bh:240">${bossSilhouette(150)}<div class="grow" style="min-width:0"><div class="boss-cap">босс главы ${cur.n} · скрыт</div><div class="mb-name">???</div><div class="boss-title">Кто-то ждёт в конце этой главы. Пройдите учебник одной темы — и узнаете, кто.</div></div></div>`}
      </div>`;
    }
    h += `<div class="kpis" style="margin-top:14px">
      <div class="kpi">${ring(todayN / goal)}<b><span data-count="${todayN}">${todayN}</span> / ${goal}</b><span>сегодня решено / цель</span></div>
      <div class="kpi"><b data-count="${due.length}">${due.length}</b><span>пора повторить · учебник ${bdue} · экзамены ${edue}</span></div>
      ${hasPlan('pro') ? `<div class="kpi"><b>${st.streak} <small class="muted">${plural(st.streak, 'день', 'дня', 'дней')}</small></b><span>серия занятий · рекорд ${st.bestStreak}</span></div>` : kpiLock(L('Серия занятий', 'Study streak'))}
      <div class="kpi"><b><span data-count="${bk.done}">${bk.done}</span><small class="muted"> / ${bk.total}</small></b><span>задач учебников решено</span></div>
      <div class="kpi"><b><span data-count="${exDone}">${exDone}</span><small class="muted"> / ${Q.length}</small></b><span>вопросов exam papers решено</span></div>
      ${hasPlan('pro') ? `<div class="kpi"><b><span data-count="${st.readiness}">${st.readiness}</span>%</b><span>готовность к экзамену*</span></div>` : kpiLock(L('Готовность к экзамену', 'Exam readiness'))}
    </div>`;
    h += `<div class="section-title"><h2>Другие режимы</h2></div><div class="big-actions">
      <button class="big" data-a="startWeak"><span class="n">${st.weakQ}</span><b>Слабые места</b><span class="muted small">задачи с последней оценкой 1–2 и вопросы самых «приоритетных» тем</span></button>
      <button class="big" data-a="startNew"><span class="n">${Q.length - exDone}</span><b>Новые с экзаменов</b><span class="muted small">${S.settings.newPerDay} случайных ещё не решённых вопросов exam papers</span></button>
      <button class="big" data-a="examPick"><span class="n">2:30</span><b>Пробный экзамен</b><span class="muted small">целая работа (Paper 1 или 2) за выбранный год, с таймером</span></button>
    </div>`;
    h += `<div class="grid g2" style="margin-top:16px">
      <div class="card"><div class="row"><h2 class="grow">Что подтянуть</h2><button class="btn sm ghost" data-a="statsGo" data-v="topics">Все темы →</button></div>
        <p class="muted small" style="margin-top:0">Темы, которые чаще всего встречаются на экзамене и которые вы пока знаете хуже всего — учебник и экзаменационные вопросы вместе.</p>
        ${hasPlan('pro') ? prioList(st.prio.slice(0, 6)) : lockBox('pro', L('Подбор слабых тем', 'Picking the weak topics'))}</div>
      <div class="card"><h2>Повторения на 2 недели</h2>${forecastChart(Object.values(C), 14)}
        <h3 style="margin-top:14px">Последние решения</h3>${recentList(7)}</div>
    </div>
    <p class="muted tiny ${hasPlan('pro') ? '' : 'hidden'}" style="margin-top:12px">* Готовность — насколько изучены темы (учебник и экзаменационные вопросы поровну), с весом по частоте темы в работах 2015–2026.</p>`;
    return h;
  };
  function prioList(prio) {
    if (!prio.length) return '<div class="empty">Нет данных</div>';
    return `<div class="prio">${prio.map(p => { const ts = topicState(p.code), t = TOPIC[p.code];
      return `<div class="it"><div><b>${esc(secShort(p.code))}</b> ${esc(SEC[p.code].name)} ${ts ? topicChip(p.code) : ''}<div class="tiny muted">на экзамене: ${p.freq} ${plural(p.freq, 'пункт', 'пункта', 'пунктов')}${ts ? ` · учебник ${Math.round(ts.book * 100)}% · экзамен ${ts.good}/${ts.exN} на 4–5` : ''}</div></div>
      <div class="bar" title="тема освоена на ${Math.round((ts ? ts.m : p.m) * 100)}%"><i style="width:${Math.round((ts ? ts.m : p.m) * 100)}%;background:var(--c5)"></i></div>
      <div class="row" style="gap:4px;flex-wrap:nowrap">${t ? `<button class="btn sm" data-a="go" data-v="book/${t.ch.key}" title="Открыть главу на Пути">Путь</button>` : ''}${topicExam(p.code).length ? `<button class="btn sm" data-a="startCode" data-code="${p.code}" title="Экзаменационные вопросы по теме">Экзамен</button>` : ''}</div></div>`; }).join('')}</div>`;
  }
  function recentList(n) {
    const a = LIVE.slice().reverse().slice(0, n);
    if (!a.length) return '<div class="muted small">Пока ничего не решено.</div>';
    return `<div class="hist">${a.map(x => { const it = itemOf(x.q); return it ? `<div class="row">${confDot(x.conf)}<span class="kindtag ${it.kind}">${it.kind === 'exam' ? 'экзамен' : 'учебник'}</span><a href="#" data-a="preview" data-id="${it.id}">${esc(it.kind === 'exam' ? it.title : shortTitle(it.t))}</a><span class="muted grow">${esc(CONF[x.conf].n)}</span><span class="muted">${fmtDate(x.t)}</span></div>` : ''; }).join('')}</div>`;
  }

  /* ================= VAULT (all textbook and exam questions) ================= */
  let vaultTab = (() => { try { return localStorage.getItem('lcm_vault_tab') || 'book'; } catch (e) { return 'book'; } })();
  // on phones the Vault filters fold under their header (search stays visible)
  let filtOpen = false;
  let vaultLimit = 300;
  const VF_KEY = 'lcm_vault_book';
  const VF_DEF = { text: '', codes: [], rev: [], kinds: [], status: [], conf: [], star: false, sol: false, open: [] };
  let VF = (() => { try { return Object.assign({}, VF_DEF, JSON.parse(localStorage.getItem(VF_KEY)) || {}); } catch (e) { return Object.assign({}, VF_DEF); } })();
  const saveVF = () => { try { localStorage.setItem(VF_KEY, JSON.stringify(VF)); } catch (e) { /* ignore */ } };
  const chKeyOf = g => `${g.book}-${g.chapter}`;
  function bookPass(t, f = VF) {
    const g = TG[t.g];
    if (f.codes.length || f.rev.length) { if (!(g.kind === 'ex' ? f.codes.includes(g.sec) : f.rev.includes(chKeyOf(g)))) return false; }
    if (f.kinds.length && !f.kinds.includes(g.kind)) return false;
    if (f.status.length && !f.status.includes(status(t.id))) return false;
    if (f.conf.length) { const c = C[t.id]; if (!c || !f.conf.includes(c.lastConf)) return false; }
    if (f.star && !S.stars[t.id]) return false;
    if (f.sol && !SOLIDS.has(t.id)) return false;
    if (f.text) {
      const q = f.text.toLowerCase().replace(/[\s№#]+/g, '');
      const sec = g.sec ? SEC[g.sec] : null, ch = TCH[chKeyOf(g)];
      const hay = [TBOOK[g.book].short, g.key, `${g.key}-${t.n}`, `${g.key}${t.n}`, groupTitle(g), sec ? sec.n + sec.name : '', ch ? ch.name : '', S.notes[t.id] || ''].join('|').toLowerCase().replace(/[\s№#]+/g, '');
      if (!hay.includes(q)) return false;
    }
    return true;
  }
  const vaultBook = () => TI.filter(t => bookPass(t));
  const shortTitle = t => { const g = TG[t.g]; return `${TBOOK[g.book].short} · ${g.kind === 'ex' ? g.key : 'R' + g.chapter + g.tier} · №${t.n}`; };
  VIEWS.bank = () => {
    const head = `<div class="pagehead"><div><div class="eyebrow">все задания</div><h1>Хранилище</h1></div>
      <div class="seg lgseg">${[['book', 'Учебники', TI.length], ['exam', 'Экзамены', Q.length]].map(([k, l, n]) => `<button class="${vaultTab === k ? 'on' : ''}" data-a="vaultTab" data-v="${k}">${l} <small>${n}</small></button>`).join('')}</div></div>`;
    return head + (vaultTab === 'exam' ? examVault() : bookVault());
  };
  const chipSetOf = (F, act) => (field, vals, labelFn = v => v) => vals.map(v => `<button class="chip ${F[field].includes(v) ? 'on' : ''}" data-a="${act}" data-field="${field}" data-v="${v}">${labelFn(v)}</button>`).join('');
  function bookVault() {
    const list = vaultBook();
    const chk = (arr, v) => (arr.includes(v) ? 'checked' : '');
    let tree = '';
    TT.books.forEach(b => {
      tree += `<div class="book">${esc(b.title)}</div>`;
      b.chapters.forEach(ch => {
        const codes = chTopics(ch);
        const all = codes.every(c => VF.codes.includes(c)) && VF.rev.includes(ch.key);
        const some = codes.some(c => VF.codes.includes(c)) || VF.rev.includes(ch.key);
        const pc = prog(ch.exItems.concat(ch.revItems));
        tree += `<details ${VF.open.includes(ch.key) || some ? 'open' : ''} data-vch="${ch.key}"><summary><span class="arrow">▸</span>
          <input type="checkbox" data-f="vchap" data-ch="${ch.key}" ${all ? 'checked' : ''} ${!all && some ? 'data-ind="1"' : ''}>
          <span class="chap">${ch.n}. ${esc(ch.name)}</span><span class="cnt">${pc.done}/${pc.total}</span></summary>
          ${ch.sections.map(s => { const p = prog(s.groups.flatMap(gIds)); return `<label><input type="checkbox" data-f="vcode" value="${s.code}" ${chk(VF.codes, s.code)}><i class="tdot ${topicState(s.code).status}"></i> ${esc(s.n)} ${esc(s.name)} <span class="cnt">${p.done}/${p.total}</span></label>`; }).join('')}
          <label><input type="checkbox" data-f="vrev" value="${ch.key}" ${chk(VF.rev, ch.key)}> Σ Повторение главы <span class="cnt">${prog(ch.revItems).done}/${ch.revItems.length}</span></label>
        </details>`;
      });
    });
    const cs = chipSetOf(VF, 'vf');
    const active = VF.codes.length + VF.rev.length + VF.kinds.length + VF.status.length + VF.conf.length + (VF.star ? 1 : 0) + (VF.sol ? 1 : 0) + (VF.text ? 1 : 0);
    let rows = list.slice(0, vaultLimit).map(t => {
      const g = TG[t.g], c = C[t.id], ch = TCH[chKeyOf(g)];
      return `<div class="qrow" data-a="preview" data-id="${t.id}">
        <div><div class="row" style="gap:.3rem">${starBtn(t.id)}<span class="id">${esc(shortTitle(t))}</span></div><div class="meta">${g.kind === 'ex' ? 'упражнение' : 'повторение · ' + TIER[g.tier].n}${SOLIDS.has(t.id) ? ' · ✍ решение Claude' : ''}</div></div>
        <div class="chips">${g.sec ? `<span class="chip"><i class="tdot ${topicState(g.sec).status}"></i>${esc(SEC[g.sec].n)} ${esc(SEC[g.sec].name)}</span>` : `<span class="chip">Глава ${g.chapter}. ${esc(ch ? ch.name : '')}</span>`}</div>
        <div class="right"><div class="row" style="gap:.35rem">${confDot(c && c.lastConf)}${stBadge(t.id)}</div><div>${c ? c.n + ' ' + plural(c.n, 'попытка', 'попытки', 'попыток') : ''}</div></div></div>`;
    }).join('');
    if (list.length > vaultLimit) rows += `<button class="btn" data-a="vaultMore" style="align-self:center;margin-top:6px">Показать ещё (${list.length - vaultLimit})</button>`;
    return `<div class="bank">
      <aside class="card filters ${filtOpen ? 'open' : ''}" data-ks="vfilters">
        <div class="row"><h2 class="grow" style="margin:0">Фильтры</h2>${active ? `<button class="btn sm ghost" data-a="vfReset">Сбросить (${active})</button>` : ''}<button class="btn sm ghost ftog" data-a="filtToggle">${filtOpen ? 'Скрыть' : 'Все фильтры'}</button></div>
        <input type="search" placeholder="Поиск: 1.2 12, глава, тема, заметка…" value="${esc(VF.text)}" data-f="vtext" style="margin-top:10px">
        <h3>Вид</h3><div class="chips">${cs('kinds', ['ex', 'rev'], v => (v === 'ex' ? 'Упражнения' : 'Повторение'))}<button class="chip ${VF.star ? 'on' : ''}" data-a="vfFlag" data-v="star">★ Избранное</button><button class="chip ${VF.sol ? 'on' : ''}" data-a="vfFlag" data-v="sol">✍ С решением Claude</button></div>
        <h3>Статус</h3><div class="chips">${cs('status', ['new', 'due', 'sched', 'retired'], v => ST_NAME[v])}</div>
        <h3>Последняя уверенность</h3><div class="chips">${cs('conf', [1, 2, 3, 4, 5], v => `<span class="dot cf${v}"></span>${v}`)}</div>
        <h3>Главы и темы <span class="muted" style="text-transform:none;letter-spacing:0">(решено / всего)</span></h3>
        <div class="tree">${tree}</div>
      </aside>
      <section>
        <div class="card row" style="margin-bottom:12px">
          <div class="grow"><b>${list.length}</b> ${plural(list.length, 'задача', 'задачи', 'задач')} учебников по фильтру
            <span class="muted small"> · новых ${list.filter(t => !C[t.id]).length} · пора повторить ${list.filter(t => status(t.id) === 'due').length} · на 4–5 ${list.filter(t => C[t.id] && C[t.id].lastConf >= 4).length}</span></div>
          <button class="btn pri" data-a="builder" ${list.length ? '' : 'disabled'}>▶ Начать сессию</button>
        </div>
        <div class="qlist">${rows || '<div class="empty card">Ничего не найдено. Измените фильтры.</div>'}</div>
      </section></div>`;
  }
  function examVault() {
    const list = filtered();
    const count = code => topicExam(code).length;
    const doneCount = code => topicExam(code).filter(q => C[q.id]).length;
    const chk = (arr, v) => (arr.includes(v) ? 'checked' : '');
    let tree = '';
    D.books.forEach(b => {
      tree += `<div class="book">${esc(b.name)}</div>`;
      b.chapters.forEach(ch => {
        const secs = ch.sections.filter(s => count(s.code));
        const all = secs.length && secs.every(s => BF.codes.includes(s.code));
        const some = secs.some(s => BF.codes.includes(s.code));
        const qn = Q.filter(q => codesOf(q).some(c => chapOf(c) === ch.id)).length;
        tree += `<details ${BF.open.includes(ch.id) || some ? 'open' : ''} data-ch="${ch.id}"><summary><span class="arrow">▸</span>
          <input type="checkbox" data-f="chap" data-ch="${ch.id}" ${all ? 'checked' : ''} ${!all && some ? 'data-ind="1"' : ''}>
          <span class="chap">${ch.n}. ${esc(ch.name)}</span><span class="cnt">${qn}</span></summary>
          ${ch.sections.map(s => { const n = count(s.code); return n ? `<label><input type="checkbox" data-f="code" value="${s.code}" ${chk(BF.codes, s.code)}><i class="tdot ${topicState(s.code) ? topicState(s.code).status : 'new'}"></i> ${esc(s.n)} ${esc(s.name)} <span class="cnt">${doneCount(s.code)}/${n}</span></label>` : `<label class="muted" title="нет вопросов"><input type="checkbox" disabled> ${esc(s.n)} ${esc(s.name)} <span class="cnt">0</span></label>`; }).join('')}
        </details>`;
      });
    });
    const cs = chipSetOf(BF, 'bf');
    const active = BF.codes.length + BF.years.length + BF.papers.length + BF.sections.length + BF.status.length + BF.conf.length + (BF.star ? 1 : 0) + (BF.text ? 1 : 0);
    let rows = list.slice(0, 400).map(q => {
      const c = C[q.id];
      return `<div class="qrow" data-a="preview" data-id="${q.id}">
        <div><div class="row" style="gap:.3rem">${starBtn(q.id)}<span class="id">${q.year} P${q.paper} Q${q.q}</span></div><div class="meta">Section ${q.section} · ${q.marks} баллов</div></div>
        <div class="chips">${tagChips(q, 4, true)}</div>
        <div class="right"><div class="row" style="gap:.35rem">${confDot(c && c.lastConf)}${stBadge(q.id)}</div><div>${c ? c.n + ' ' + plural(c.n, 'попытка', 'попытки', 'попыток') : ''}</div></div>
      </div>`;
    }).join('');
    if (list.length > 400) rows += `<div class="muted small">Показаны первые 400 из ${list.length}. Уточните фильтр.</div>`;
    return `<div class="bank">
      <aside class="card filters ${filtOpen ? 'open' : ''}" data-ks="filters">
        <div class="row"><h2 class="grow" style="margin:0">Фильтры</h2>${active ? `<button class="btn sm ghost" data-a="bfReset">Сбросить (${active})</button>` : ''}<button class="btn sm ghost ftog" data-a="filtToggle">${filtOpen ? 'Скрыть' : 'Все фильтры'}</button></div>
        <input type="search" placeholder="Поиск: 2019 p1 q7, тема, заметка…" value="${esc(BF.text)}" data-f="text" style="margin-top:10px">
        <h3>Статус</h3><div class="chips">${cs('status', ['new', 'due', 'sched', 'retired'], v => ST_NAME[v])}</div>
        <h3>Последняя уверенность</h3><div class="chips">${cs('conf', [1, 2, 3, 4, 5], v => `<span class="dot cf${v}"></span>${v}`)}</div>
        <h3>Год</h3><div class="chips">${cs('years', YEARS)}</div>
        <h3>Работа и секция</h3><div class="chips">${cs('papers', [1, 2], v => 'Paper ' + v)}${cs('sections', ['A', 'B'], v => 'Section ' + v)}
          <button class="chip ${BF.star ? 'on' : ''}" data-a="bfStar">★ Избранное</button></div>
        <h3>Темы <span class="muted" style="text-transform:none;letter-spacing:0">(решено / всего)</span></h3>
        <div class="tree">${tree}</div>
      </aside>
      <section>
        <div class="card row" style="margin-bottom:12px">
          <div class="grow"><b>${list.length}</b> ${plural(list.length, 'вопрос', 'вопроса', 'вопросов')} с экзаменов по фильтру
            <span class="muted small"> · новых ${list.filter(q => !C[q.id]).length} · пора повторить ${list.filter(q => status(q.id) === 'due').length}</span></div>
          <button class="btn" data-a="statsGo" data-v="map">Карта экзаменов</button>
          <button class="btn pri" data-a="builder" ${list.length ? '' : 'disabled'}>▶ Начать сессию</button>
        </div>
        <div class="qlist">${rows || '<div class="empty card">Ничего не найдено. Измените фильтры.</div>'}</div>
      </section></div>`;
  }
  AFTER.bank = () => {
    document.querySelectorAll('input[data-ind]').forEach(i => { i.indeterminate = true; });
    document.querySelectorAll('.tree details[data-ch]').forEach(d => d.addEventListener('toggle', () => {
      const id = d.dataset.ch; BF.open = BF.open.filter(x => x !== id); if (d.open) BF.open.push(id); saveBF();
    }));
    document.querySelectorAll('.tree details[data-vch]').forEach(d => d.addEventListener('toggle', () => {
      const id = d.dataset.vch; VF.open = VF.open.filter(x => x !== id); if (d.open) VF.open.push(id); saveVF();
    }));
  };

  /* ---------- session builder ---------- */
  const vaultIds = () => (vaultTab === 'book' ? vaultBook().map(t => t.id) : filtered().map(q => q.id));
  function builderModal() {
    const ids = vaultIds(), book = vaultTab === 'book';
    const nNew = ids.filter(id => !C[id]).length, nDue = ids.filter(id => status(id) === 'due').length;
    openModal(`<div class="box narrow">
      <h2>Новая сессия</h2>
      <p class="muted small">${book ? 'Задачи учебников' : 'Вопросы с экзаменов'} по текущему фильтру: ${ids.length} (новых ${nNew}, пора повторить ${nDue}).</p>
      <div class="field"><label>Какие вопросы</label>
        <select id="b-mode"><option value="all">Все из фильтра (кроме «не показывать»)</option><option value="newdue">Новые + пора повторить</option><option value="new">Только новые</option><option value="due">Только пора повторить</option><option value="weak">Только слабые (последняя оценка 1–3)</option><option value="any">Абсолютно все из фильтра</option></select></div>
      <div class="field"><label>Порядок</label>
        <select id="b-order"><option value="random">Случайный</option><option value="weak">Сначала самые слабые</option><option value="chrono">${book ? 'По порядку книги' : 'По годам и номерам'}</option><option value="old">Давно не решал — первыми</option></select></div>
      <div class="field"><label>Сколько вопросов</label><input class="num" id="b-limit" type="number" min="1" value="${Math.min(10, ids.length)}"></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn" data-a="closeModal">Отмена</button><button class="btn pri" data-a="builderGo">Начать</button></div>
    </div>`);
  }
  function startSession(ids, title, opts = {}) {
    const shut = ids.filter(id => !hasPlan(itemTier(id)));
    if (shut.length) {
      ids = ids.filter(id => hasPlan(itemTier(id)));
      if (!ids.length) { upsell('pro', L('Эти задачи', 'These questions')); return; }
      toast(L(`${shut.length} ${plural(shut.length, 'задача доступна', 'задачи доступны', 'задач доступны')} в тарифе Pro — они пропущены`, `${shut.length} ${shut.length === 1 ? 'question needs' : 'questions need'} Pro — skipped`));
    }
    if (!ids.length) { toast('Нет вопросов для сессии'); return; }
    S.session = { id: uid(), qids: ids, i: 0, started: Date.now(), title, exam: !!opts.exam, limit: opts.limit || null, challenge: opts.challenge || null, study: opts.study || null, boss: opts.boss || null, bossHp0: opts.boss ? chState(TCH[opts.boss]).hp : null, final: !!opts.final, ctx: opts.ctx || (opts.boss ? 'ch:' + opts.boss : opts.study && TG[opts.study] ? TG[opts.study].sec || null : null), done: [] };
    S.sessions[S.session.id] = { id: S.session.id, title, started: S.session.started, exam: !!opts.exam, challenge: opts.challenge || null, study: opts.study || null, boss: opts.boss || null, final: !!opts.final, ctx: S.session.ctx, n: ids.length };
    save(); closeModal(); R = null; go('practice');
  }

  /* ================= PRACTICE ================= */
  let R = null; // rating UI state for the current question
  function curQ() { const s = S.session; return s && s.i < s.qids.length ? itemOf(s.qids[s.i]) : null; }
  function initR(it) {
    if (R && R.q === it.id) return;
    R = { q: it.id, conf: null, parts: {}, score: '', iv: undefined, showMs: false, showCs: false, elapsed: 0, since: Date.now(), paused: false, partsOpen: false };
  }
  const elapsed = () => R ? R.elapsed + (R.since ? Date.now() - R.since : 0) : 0;
  const sessLimit = s => s.limit || (s.exam ? 150 : null);
  const bookPdf = (bid, page) => `../books/${encodeURIComponent(TBOOK[bid].pdf)}#page=${page || 1}`;
  function examHead(q) {
    const parts = partsOf(q);
    return `<div class="row"><h2 class="grow" style="margin:0">${starBtn(q.id)} ${esc(qTitle(q))}</h2>
        <span class="chip">Section ${q.section}</span><span class="chip">${q.marks} баллов</span><span class="chip">~${Math.round(q.marks / 2)} мин на экзамене</span>
        ${stBadge(q.id)}</div>
      <div class="tagline">${tagChips(q, 99, true)}</div>
      ${parts.length > 1 ? `<div class="small muted">${parts.map(p => `<b>${esc(partLabel(p.p))}</b> ${p.codes.map(secShort).join(', ')}`).join(' · ')}</div>` : ''}`;
  }
  function bookHead(it) {
    const g = it.g, ch = TCH[`${g.book}-${g.chapter}`], sec = g.sec ? SEC[g.sec] : null;
    return `<div class="row"><h2 class="grow" style="margin:0">${starBtn(it.id)} ${esc(it.title)}</h2>
        ${g.kind === 'rev' ? `<span class="chip">Σ ${esc(TIER[g.tier].ru)}</span>` : ''}${stBadge(it.id)}</div>
      <div class="tagline"><a class="chip" href="#book/${ch.key}">Глава ${ch.n}. ${esc(ch.name)}</a>${sec ? `<span class="chip">${esc(sec.n)} ${esc(sec.name)}</span>${topicChip(g.sec)}` : ''}
        ${it.t.row ? '<span class="chip" title="В книге несколько вопросов стоят в одной строке">вопрос из строки</span>' : ''}</div>`;
  }
  VIEWS.practice = () => {
    const s = S.session; const it = curQ();
    if (!it) return summaryView();
    initR(it);
    const c = C[it.id];
    const exam = it.kind === 'exam', q = it.q;
    const parts = exam ? partsOf(q) : [];
    const sug = R.conf ? suggest(it.id, R.conf) : null;
    const ivSel = R.iv !== undefined ? R.iv : sug;
    const lim = sessLimit(s);
    const left = lim ? lim * 6e4 - (Date.now() - s.started) : null;
    const ivBtns = IVS.map(([d, l]) => `<button class="iv ${ivSel === d && R.conf ? 'on' : ''} ${R.conf && sug === d ? 'sug' : ''}" data-a="iv" data-v="${d}">${l}</button>`).join('');
    const custom = R.conf && ivSel != null && !IVS.some(([d]) => d === ivSel);
    const csBtn = it.csol ? `<button class="btn ${R.showCs || it.sol ? '' : 'pri'}" data-a="toggleCs" title="Решение, написанное Claude">✍ ${R.showCs ? 'Скрыть решение' : 'Решение Claude'}</button>${it.sol ? '' : ' <span class="kbd">S</span>'}` : '';
    const solBtn = it.sol
      ? `<button class="btn ${R.showMs ? '' : 'pri'}" data-a="toggleMs">${R.showMs ? 'Скрыть ' + it.solName : 'Показать ' + it.solName}</button> <span class="kbd">S</span>${csBtn ? ' ' + csBtn : ''}`
      : csBtn || `<span class="muted">${exam ? 'Решение для этого вопроса не найдено в marking scheme' : 'В ответах книги этот вопрос не найден'}</span>`;
    const links = exam
      ? `<a class="btn sm ghost" href="${pdfLink(q)}" target="_blank">Открыть PDF (стр. ${q.pages.join(', ')})</a>${q.ms ? `<a class="btn sm ghost" href="${pdfLink(q, true)}" target="_blank">PDF решения</a>` : ''}`
      : `${it.g.ansAll ? `<button class="btn sm ghost" data-a="ansAll" data-g="${it.g.id}">Все ответы упражнения</button>` : ''}<a class="btn sm ghost" href="${bookPdf(it.g.book, it.t.page)}" target="_blank">Страница в учебнике</a>${flagBtn(it.id)}`;
    return `
    <div class="sessbar">
      <b>${esc(s.title)}</b>
      ${s.study ? (() => { const sm = studySummary(studyState(s.study)); return `<span class="muted">задача ${s.i + 1} · типов освоено ${sm.done}/${sm.types}</span><div class="progress"><i style="width:${pct(sm.done, sm.types)}%"></i></div>`; })() : `<span class="muted">${s.i + 1} / ${s.qids.length}</span><div class="progress"><i style="width:${pct(s.i, s.qids.length)}%"></i></div>`}
      ${lim ? `<span class="chip" title="оставшееся время">⏳ <span class="timer" id="examtimer">${fmtClock(left)}</span></span>` : ''}
      <span class="chip" title="время на этот вопрос (идёт и при переключении вкладок; останавливается только кнопкой «Пауза»)">⏱ <span class="timer" id="qtimer">${fmtClock(elapsed())}</span></span>
      <button class="btn sm" data-a="pause">${R.since ? '⏸ Пауза' : '▶ Продолжить'}</button>
      <button class="btn sm" data-a="skip" title="Пропустить без оценки">Пропустить</button>
      <button class="btn sm" data-a="endSession">Завершить</button>
    </div>
    <div class="prac">
      <div>
        ${s.boss ? bossPanel(s) : s.final ? finalPanel(s) : exam ? (s.study ? examFinalPanel(it) : '') : studyPanel(it)}
        <div class="card" style="margin-bottom:12px">${exam ? examHead(q) : bookHead(it)}</div>
        ${(() => { const cut = exam ? cutFor(q, s.ctx) : null, full = !!R.fullQ;
          return (cut ? cutBar(cut, full, 'cutToggle', it.id) : '') + `<div class="paper" id="paper">${cut && !full ? givenSheet(cut) + imgTag(cut.img, cut.size, it.title) : imgTag(it.img, it.size, it.title, it.kind === 'book' ? BOOK_SCALE : 0)}</div>`; })()}
        <div class="row" style="margin:12px 0">${solBtn}<span class="grow"></span>${links}</div>
        ${R.showMs && it.sol ? `<div class="paper" id="ms">${it.approx ? `<div class="approx">Точное место ответа на №${it.t.n} не распознано — показан блок ответов с соседними номерами, найдите в нём №${it.t.n}.</div>` : ''}${imgTag(it.sol, it.solSize, it.solName, it.kind === 'book' ? BOOK_SCALE : 0)}</div>` : ''}
        ${R.showCs && it.csol ? csolBox(it.id) : ''}
      </div>
      <aside class="card rate">
        <h3>Насколько уверенно решил?</h3>
        <div class="confbtns">${[1, 2, 3, 4, 5].map(v => `<button class="confbtn ${R.conf === v ? 'on' : ''}" data-a="conf" data-v="${v}" title="${esc(CONF[v].d)}">${v}<small>${CONF[v].n}</small></button>`).join('')}</div>
        <div class="tiny muted" style="margin-top:6px">${R.conf ? esc(CONF[R.conf].d) : 'Клавиши <span class="kbd">1</span>–<span class="kbd">5</span>'}</div>
        ${parts.length > 1 ? `<div class="field"><label><button class="btn sm ghost" data-a="partsToggle">${R.partsOpen ? '▾' : '▸'} Оценить по пунктам</button> <span class="tiny muted" style="text-transform:none;letter-spacing:0;font-weight:400">(точнее статистика по подтемам)</span></label>
          ${R.partsOpen ? parts.map(p => `<div class="partrow"><span class="small" title="${esc(p.codes.map(secLabel).join('\n'))}"><b>${esc(partLabel(p.p))}</b></span><div class="minis">${[1, 2, 3, 4, 5].map(v => `<button class="mini ${R.parts[p.p] === v ? 'on' : ''}" data-a="pconf" data-p="${p.p}" data-v="${v}">${v}</button>`).join('')}<span class="tiny muted" style="margin-left:4px;align-self:center">${p.codes.map(secShort).join(', ')}</span></div></div>`).join('') : ''}</div>` : ''}
        ${exam ? `<div class="field"><label>Баллы (необязательно)</label><div class="row"><input class="num" type="number" min="0" max="${q.marks}" step="1" id="score" value="${esc(R.score)}" placeholder="—"> <span class="muted">из ${q.marks}</span></div></div>` : ''}
        <div class="field"><label>Показать снова через</label>
          <div class="ivs">${ivBtns}</div>
          <div class="row small" style="margin-top:6px">своё: <input class="num" type="number" min="0" max="999" id="ivCustom" value="${custom ? ivSel : ''}" placeholder="дней"> ${sug != null ? `<span class="muted">· рекомендуем: ${ivName(sug)}</span>` : ''}</div>
        </div>
        <div class="field"><label>Заметка к вопросу</label><textarea id="note" placeholder="Где ошибся, что запомнить…">${esc(S.notes[it.id] || '')}</textarea></div>
        <button class="btn pri" style="width:100%;justify-content:center;margin-top:14px" data-a="saveNext" ${R.conf ? '' : 'disabled'}>Сохранить и дальше <span class="kbd" style="color:var(--text)">Enter</span></button>
        ${c ? `<div class="field"><label>История (${c.n})</label><div class="hist">${c.hist.slice().reverse().slice(0, 6).map(a => `<div class="row">${confDot(a.conf)} <span>${esc(CONF[a.conf].n)}</span><span class="muted grow">${a.score != null && exam ? a.score + '/' + q.marks : ''}</span><span class="muted">${fmtDate(a.t)}</span></div>`).join('')}</div></div>` : ''}
      </aside>
    </div>`;
  };
  // score of a chapter challenge: tiers weigh 1/2/3, confidence 1..5 -> 0..1, skipped = 0
  function challengeScore(s, at) {
    let got = 0, tot = 0;
    s.qids.forEach(id => {
      const t = TBY[id]; if (!t) return;
      const w = TIER[TG[t.g].tier].w; tot += w;
      const a = at.filter(x => x.q === id).pop();
      if (a) got += w * (a.conf - 1) / 4;
    });
    const score = tot ? Math.round(100 * got / tot) : 0;
    return { score, stars: score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0 };
  }
  function sessCountBox(s, at) {
    if (!at.length) return '<div class="sesscount">В этой сессии нет решённых задач — она не сохранится.</div>';
    const off = sessOff(s.id);
    const before = Object.fromEntries(Object.entries(S.ach).map(([k, r]) => [k, r.tier || 0]));
    const fresh = off ? [] : achState(awardStats()).filter(r => r.tier > (before[r.a.id] || 0) || (r.when && r.when >= s.started));
    return `<div class="sesscount ${off ? 'off' : ''}"><div class="grow">${off ? 'Эта сессия <b>не засчитана</b>: она не влияет на статистику, прогресс и повторения.' : 'Сессия засчитана в статистику и прогресс.'}
        ${at.length <= 2 && !off ? '<span class="muted"> Если она случайная — нажмите «Не засчитывать».</span>' : ''}</div>
      <button class="btn sm" data-a="sessToggle" data-id="${s.id}">${off ? 'Засчитать' : 'Не засчитывать'}</button>
      <button class="btn sm ghost danger" data-a="sessDel" data-id="${s.id}">Удалить сессию</button></div>
      ${fresh.length ? `<div class="newach">${fresh.map(r => `<span class="chip">${r.a.g} ${esc(r.a.name)} · ${TIER_NAMES[r.tier - 1]}</span>`).join('')} <a href="#" data-a="statsGo" data-v="ach" class="small">все достижения →</a></div>` : ''}`;
  }
  function summaryView() {
    const s = S.session;
    const at = S.attempts.filter(a => a.sess === s.id);
    const tm = at.reduce((x, a) => x + (a.time || 0), 0);
    const ac = avg(at.map(a => a.conf));
    const weak = at.filter(a => a.conf <= 2).map(a => a.q);
    const anyExam = at.some(a => QBY[a.q]);
    const allBook = s.qids.every(id => TBY[id]);
    // back to where the session came from: the chapter of the boss, challenge or topic, the finale, or the Path
    const g0 = s.study ? TG[s.study] : null, ctx = s.ctx ? String(s.ctx) : '';
    const chk = s.challenge || s.boss || (ctx.startsWith('ch:') ? ctx.slice(3) : '') || (g0 ? `${g0.book}-${g0.chapter}` : '') || (TOPIC[ctx] ? TOPIC[ctx].ch.key : '');
    const back = s.final ? ['book/final', 'К финалу'] : chk && TCH[chk] ? ['book/' + chk, 'К главе'] : allBook ? ['book', 'К Пути'] : null;
    let chal = '';
    if (s.challenge) {
      const k = s.challenge;
      const list = S.challenges[k] || (S.challenges[k] = []);
      const prevBest = Math.max(-1, ...list.filter(r => r.sess !== s.id).map(r => r.score));
      let res = list.find(r => r.sess === s.id);
      if (!res) { res = Object.assign({ sess: s.id, t: Date.now(), time: tm, n: s.qids.length }, challengeScore(s, at)); list.push(res); save(); }
      const ch = TCH[k];
      chal = `<div class="chal-res"><div class="bigstars">${starStr(res.stars)}</div><div><b style="font-size:1.6rem">${res.score}%</b>
        <div class="muted small">Испытание главы ${ch.n}. ${esc(ch.name)}${res.score > prevBest && prevBest >= 0 ? ' · <b style="color:var(--c5)">новый рекорд!</b>' : prevBest < 0 ? ' · первая попытка' : ` · рекорд ${prevBest}%`}</div>
        <div class="tiny muted">★ от 50% · ★★ от 70% · ★★★ от 85%. Уровни Core / Advanced / Extended весят 1 / 2 / 3.</div></div></div>`;
    }
    return `<div class="card" style="max-width:860px;margin:0 auto">
      <div class="eyebrow">${s.challenge ? 'Испытание завершено' : 'Сессия завершена'}</div><h2 style="margin-top:6px">${esc(s.title)}</h2>
      ${chal}
      ${s.boss ? bossResult(s) : ''}
      ${s.final ? finalResult(s) : ''}
      ${s.study ? studySummaryBox(s) : ''}
      ${sessCountBox(s, at)}
      ${sessEvents(s)}
      <div class="kpis" style="margin:12px 0">
        <div class="kpi"><b>${at.length}</b><span>решено вопросов</span></div>
        <div class="kpi"><b>${fmtDur(tm)}</b><span>время</span></div>
        <div class="kpi"><b>${ac != null ? ac.toFixed(1) : '—'}</b><span>средняя уверенность</span></div>
        <div class="kpi"><b>${weak.length}</b><span>слабых (1–2)</span></div>
      </div>
      <div class="tablewrap"><table><tr><th>Вопрос</th><th>Уверенность</th>${anyExam ? '<th class="num">Баллы</th>' : ''}<th class="num">Время</th><th>Повтор</th></tr>
      ${at.map(a => { const it = itemOf(a.q); if (!it) return ''; return `<tr><td><a href="#" data-a="preview" data-id="${it.id}">${esc(it.title)}</a></td><td><span class="confcell">${confDot(a.conf)}${esc(CONF[a.conf].n)}</span></td>${anyExam ? `<td class="num">${a.score != null && it.q ? a.score + '/' + it.q.marks : '—'}</td>` : ''}<td class="num">${fmtDur(a.time)}</td><td>${esc(ivName(a.iv))}</td></tr>`; }).join('')}
      </table></div>
      <div class="row" style="margin-top:16px">
        ${weak.length ? `<button class="btn pri" data-a="redoWeak" data-ids="${weak.join(',')}" data-ctx="${esc(ctx)}">Ещё раз слабые (${weak.length})</button>` : ''}
        ${back ? `<button class="btn" data-a="closeSession" data-v="${back[0]}">${back[1]}</button>` : `<button class="btn" data-a="closeSession" data-v="stats">К статистике</button>`}
        <button class="btn ghost" data-a="closeSession" data-v="home">На главную</button>
      </div></div>`;
  }
  AFTER.practice = () => {
    const sc = $('#score'); if (sc) sc.addEventListener('input', () => { R.score = sc.value; });
    const ic = $('#ivCustom'); if (ic) ic.addEventListener('input', () => { const v = parseInt(ic.value, 10); if (!isNaN(v) && v >= 0) { R.iv = v; document.querySelectorAll('.iv').forEach(b => b.classList.remove('on')); } });
    const nt = $('#note'); if (nt) nt.addEventListener('input', () => { const it = curQ(); if (!it) return; if (nt.value.trim()) S.notes[it.id] = nt.value; else delete S.notes[it.id]; save(); });
  };
  setInterval(() => {
    if (view !== 'practice' || !R) return;
    const t = $('#qtimer'); if (t) t.textContent = fmtClock(elapsed());
    const e = $('#examtimer'); if (e && S.session) e.textContent = fmtClock(sessLimit(S.session) * 6e4 - (Date.now() - S.session.started));
  }, 1000);
  // the timer keeps running while the tab is hidden (only the Pause button stops it);
  // background tabs throttle setInterval, so refresh the clocks as soon as the tab is back
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || view !== 'practice' || !R) return;
    const t = $('#qtimer'); if (t) t.textContent = fmtClock(elapsed());
    const e = $('#examtimer'); if (e && S.session) e.textContent = fmtClock(sessLimit(S.session) * 6e4 - (Date.now() - S.session.started));
  });
  function saveAttempt() {
    const it = curQ(); if (!it || !R.conf) return;
    const sug = suggest(it.id, R.conf);
    const iv = R.iv !== undefined ? R.iv : sug;
    const parts = Object.keys(R.parts).length ? Object.assign({}, R.parts) : null;
    let sc = null;
    if (it.kind === 'exam' && R.score !== '') { sc = Math.max(0, Math.min(it.q.marks, Number(R.score))); if (isNaN(sc)) sc = null; }
    S.attempts.push({ id: uid(), q: it.id, ctx: it.kind === 'exam' ? S.session.ctx || null : undefined, t: Date.now(), conf: R.conf, parts, score: sc, time: Math.round(elapsed() / 1000), iv, sug, sess: S.session.id });
    if (S.sessions[S.session.id]) S.sessions[S.session.id].ended = Date.now();
    if (iv === 0 && !S.session.challenge && !S.session.study && S.session.qids.indexOf(it.id, S.session.i + 1) === -1) S.session.qids.push(it.id);
    S.session.i++;
    R = null; rebuild();
    if (S.session.study && S.session.i >= S.session.qids.length) { const nx = studyNext(studyState(S.session.study)); if (nx) S.session.qids.push(nx.id); else examFinale(S.session); }
    save(); render();
  }

  /* ================= STATS ================= */
  // src: 'all' (exam papers + textbooks), 'exam' or 'book'
  function computeStats(src = 'all') {
    return memo('cs:' + src, () => {
      const td = today();
      const att = LIVE.filter(a => src === 'all' || (src === 'exam' ? QBY[a.q] : TBY[a.q]));
      const days = new Set(att.map(a => dayOf(a.t)));
      let streak = 0; { let d = days.has(td) ? td : td - 1; while (days.has(d)) { streak++; d--; } }
      let bestStreak = 0, run = 0, prev = null;
      [...days].sort((a, b) => a - b).forEach(d => { run = prev != null && d === prev + 1 ? run + 1 : 1; bestStreak = Math.max(bestStreak, run); prev = d; });
      const items = [];
      if (src !== 'book') Q.forEach(q => { const codes = codesOf(q); items.push({ id: q.id, q, codes, chs: [...new Set(codes.map(chapOf))] }); });
      if (src !== 'exam') TI.forEach(t => { const g = TG[t.g]; items.push({ id: t.id, t, codes: g.sec ? [g.sec] : [], chs: [chKeyOf(g)] }); });
      const latest = items.filter(it => C[it.id]).map(it => C[it.id].lastConf);
      const blank = code => ({ code, total: 0, done: 0, confs: [], weak: 0, attempts: 0, time: 0, last: 0, scores: [], freq: FREQ[code] || 0, exT: 0, exD: 0, bkT: 0, bkD: 0 });
      const add = (r, it, v) => { const c = C[it.id]; r.total++; if (it.q) r.exT++; else r.bkT++; if (!c) return; r.done++; if (it.q) r.exD++; else r.bkD++; r.confs.push(v); if (v <= 2) r.weak++; r.attempts += c.n; r.time += c.time; r.last = Math.max(r.last, c.last.t); if (it.q) c.hist.forEach(a => { if (a.score != null) r.scores.push(a.score / it.q.marks); }); };
      const fin = r => { r.avg = avg(r.confs); r.m = r.total ? r.confs.reduce((x, v) => x + (v - 1) / 4, 0) / r.total : 0; r.score = avg(r.scores); };
      const sec = {}; Object.keys(SEC).forEach(code => { sec[code] = blank(code); });
      const chap = {}; CHAPS.forEach(ch => { chap[ch.id] = Object.assign(blank(ch.id), { id: ch.id, freq: 0 }); });
      items.forEach(it => {
        const c = C[it.id];
        it.codes.forEach(code => { if (sec[code]) add(sec[code], it, c ? (it.q ? confFor(it.q, code) : c.lastConf) : null); });
        it.chs.forEach(k => { if (chap[k]) add(chap[k], it, c ? (it.q ? avg(it.codes.filter(x => chapOf(x) === k).map(x => confFor(it.q, x))) : c.lastConf) : null); });
      });
      Object.values(sec).forEach(r => { fin(r); const ts = topicState(r.code); r.ts = ts; r.tm = ts ? ts.m : r.m; r.prio = (r.freq / (FREQ_TOTAL || 1)) * (1 - r.tm); });
      CHAPS.forEach(ch => { const r = chap[ch.id]; fin(r); r.freq = ch.sections.reduce((x, s) => x + sec[s.code].freq, 0); const ts = topicSum(ch.sections.map(s => s.code).filter(c => TOPIC[c])); r.tdone = ts.done; r.tfull = ts.full; r.tprog = ts.prog; r.ttotal = ts.total; r.tm = ts.m; r.prio = (r.freq / (FREQ_TOTAL || 1)) * (1 - r.tm); });
      // readiness: topics weighted by how often they appear in the papers; textbook and exam practice count equally
      const exM = code => { const qs = topicExam(code); return qs.length ? qs.reduce((x, q) => x + (C[q.id] ? (confFor(q, code) - 1) / 4 : 0), 0) / qs.length : 0; };
      const readiness = Math.round(100 * Object.values(sec).reduce((x, r) => x + (r.freq / (FREQ_TOTAL || 1)) * (r.ts ? 0.5 * exM(r.code) + 0.5 * r.ts.book : exM(r.code)), 0));
      const prio = Object.values(sec).filter(r => r.freq > 0).sort((a, b) => b.prio - a.prio);
      const done = items.filter(it => C[it.id]);
      return { src, att, items, streak, bestStreak, days, latest, sec, chap, readiness, prio,
        weakQ: done.filter(it => C[it.id].lastConf <= 2).length, doneQ: done.length, totalQ: items.length,
        totalTime: att.reduce((x, a) => x + (a.time || 0), 0), avgLatest: avg(latest), mastered: latest.filter(v => v >= 4).length };
    });
  }
  let statsTab = 'over', statsSrc = 'all', topicSort = 'order', topicBook = 'all', openChaps = new Set();
  const STABS = [['over', 'Обзор'], ['topics', 'Темы'], ['chapters', 'Главы и боссы'], ['ranks', 'Ранги'], ['ach', 'Достижения'], ['activity', 'Активность'], ['map', 'Карта экзаменов'], ['log', 'Журнал'], ['sessions', 'Сессии']];
  const SRC = { all: 'Всё', book: 'Учебники', exam: 'Экзамены' };
  VIEWS.stats = () => {
    const srcTabs = ['topics', 'activity', 'log'];
    let h = `<div class="pagehead"><div><div class="eyebrow">статистика</div><h1>Прогресс</h1></div>
      ${srcTabs.includes(statsTab) ? `<div class="seg">${Object.entries(SRC).map(([k, l]) => `<button class="${statsSrc === k ? 'on' : ''}" data-a="statsSrc" data-v="${k}">${l}</button>`).join('')}</div>` : ''}</div>
      <div class="stabs">${STABS.map(([k, l]) => `<button class="${statsTab === k ? 'on' : ''}" data-a="statsTab" data-v="${k}">${l}</button>`).join('')}</div>`;
    const st = computeStats(srcTabs.includes(statsTab) ? statsSrc : 'all');
    const T = { over: overTab, topics: topicsTab, chapters: chaptersTab, ranks: ranksTab, ach: achTab, activity: activityTab, map: mapTab, log: logTab, sessions: sessionsTab };
    return h + `<div class="tabbody">${(T[statsTab] || overTab)(st)}</div>`;
  };
  function confCell(v) { return v == null ? '<span class="muted">—</span>' : `<span class="confcell">${confDot(v)}${v.toFixed(1)}</span>`; }
  const distBar = (latest, total) => {
    const n = [1, 2, 3, 4, 5].map(v => latest.filter(x => x === v).length), un = Math.max(0, total - latest.length);
    return `<div class="dist">${n.map((c, j) => (c ? `<i class="cf${j + 1}" style="flex:${c}" title="${esc(CONF[j + 1].n)}: ${c}"></i>` : '')).join('')}${un ? `<i class="un" style="flex:${un}" title="не решались: ${un}"></i>` : ''}</div>
      <div class="legend" style="margin-top:6px">${[1, 2, 3, 4, 5].map(v => `<span><i class="dot cf${v}"></i>${n[v - 1]}</span>`).join('')}<span><i class="dot"></i>${un} не решались</span></div>`;
  };
  function overTab() {
    const B = computeStats('book'), E = computeStats('exam'), A = computeStats('all');
    const ex = E.att, timed = ex.filter(a => a.time > 0), scored = ex.filter(a => a.score != null);
    const perMark = timed.length ? timed.reduce((x, a) => x + a.time, 0) / 60 / timed.reduce((x, a) => x + QBY[a.q].marks, 0) : null;
    const scorePct = scored.length ? Math.round(100 * scored.reduce((x, a) => x + a.score, 0) / scored.reduce((x, a) => x + QBY[a.q].marks, 0)) : null;
    const bt = B.att.filter(a => a.time > 0), perBook = bt.length ? bt.reduce((x, a) => x + a.time, 0) / 60 / bt.length : null;
    const exAll = prog(CHS.flatMap(c => c.exItems)), revAll = prog(CHS.flatMap(c => c.revItems));
    const cnt = { boss: 0, gold: 0, red: 0 }; CHS.forEach(ch => { const s = chState(ch).state; if (s !== 'none') cnt.boss++; if (s === 'gold' || s === 'red') cnt.gold++; if (s === 'red') cnt.red++; });
    const nextBoss = CHS.map(ch => ({ ch, st: chState(ch) })).filter(x => x.st.state === 'none' && bossKnown(x.ch)).sort((a, b) => (b.st.exOk / (b.st.ex.length || 1)) - (a.st.exOk / (a.st.ex.length || 1)))[0];
    const big = (done, total, color) => `<div class="spbig">${ring(total ? done / total : 0, 92, color, 3.6)}<div><b><span data-count="${done}">${done}</span><small>/${total}</small></b><span>решено разных задач · ${pct(done, total)}%</span></div></div>`;
    const kv = (l, v) => `<div class="kv"><span>${l}</span><b>${v}</b></div>`;
    const years = YEARS.map(y => { const qs = Q.filter(q => q.year === y), d = qs.filter(q => C[q.id]).length; return { y, d, n: qs.length }; });
    return `<div class="split2">
      <div class="card sp sp-book"><div class="sp-h"><div class="eyebrow">задания учебников</div><h2>Text &amp; Tests 4 · 5</h2></div>
        ${big(B.doneQ, B.totalQ, 'var(--accent)')}
        <div class="kvs">${kv('освоено (4–5)', B.mastered)}${kv('средняя уверенность', B.avgLatest != null ? B.avgLatest.toFixed(2) : '—')}${kv('попыток', B.att.length)}${kv('время', fmtDur(B.totalTime))}${kv('мин на задачу', perBook != null ? perBook.toFixed(1) : '—')}${kv('пора повторить', bookDue().length)}</div>
        <h3>Последняя оценка</h3>${distBar(B.latest, B.totalQ)}
        <div class="sprows">${TT.books.map(b => { const p = prog(b.chapters.flatMap(ch => ch.exItems.concat(ch.revItems))); return `<div class="sprow"><span>${esc(b.title)}</span>${bar(p.p)}<b>${p.done}/${p.total}</b></div>`; }).join('')}
          <div class="sprow"><span>Упражнения</span>${bar(exAll.p)}<b>${exAll.done}/${exAll.total}</b></div><div class="sprow"><span>Повторение глав</span>${bar(revAll.p, 'var(--c2)')}<b>${revAll.done}/${revAll.total}</b></div></div>
      </div>
      <div class="card sp sp-exam"><div class="sp-h"><div class="eyebrow">exam papers</div><h2>Экзамены ${YEARS[0]}–${YEARS[YEARS.length - 1]}</h2></div>
        ${big(E.doneQ, E.totalQ, 'var(--c2)')}
        <div class="kvs">${kv('освоено (4–5)', E.mastered)}${kv('средняя уверенность', E.avgLatest != null ? E.avgLatest.toFixed(2) : '—')}${kv('попыток', ex.length)}${kv('время', fmtDur(E.totalTime))}${kv('мин на балл (экзамен 0.50)', perMark != null ? perMark.toFixed(2) : '—')}${kv('средний % баллов', scorePct != null ? scorePct + '%' : '—')}</div>
        <h3>Последняя оценка</h3>${distBar(E.latest, E.totalQ)}
        <div class="years">${years.map(x => `<div class="yr" title="${x.y}: ${x.d}/${x.n}"><i style="height:${x.n ? Math.max(4, Math.round(100 * x.d / x.n)) : 0}%"></i><span>’${String(x.y).slice(2)}</span></div>`).join('')}</div>
        <div class="tiny muted" style="margin-top:4px">решено по годам экзаменов</div>
      </div></div>
    <div class="grid g3" style="margin-top:14px">
      <div class="card">${topicBar(ALL_TOPICS, { title: 'Изучено тем' })}<div class="kvs" style="margin-top:12px">${kv('готовность к экзамену', `<span data-count="${A.readiness}">${A.readiness}</span>%`)}${kv('серия дней', `${A.streak} · рекорд ${A.bestStreak}`)}</div></div>
      <div class="card"><div class="eyebrow">главы</div><div class="bosscount">${[['boss', '☠', 'боссов'], ['gold', '◆', 'золотых'], ['red', '✶', 'багровых']].map(([k, i, l]) => `<div class="pst ${k}"><span>${i}</span><b>${cnt[k]}<small>/${CHS.length}</small></b><small>${l}</small></div>`).join('')}</div>
        ${nextBoss ? `<div class="tiny muted" style="margin-top:10px">Ближайший босс: <a href="#book/${nextBoss.ch.key}">${esc(BOSS[nextBoss.ch.key].n)}</a> — глава ${nextBoss.ch.n}, HP ${nextBoss.st.hp}/${nextBoss.st.ex.length}</div>` : ''}</div>
      ${rankCard({ size: 64, compact: true })}
    </div>
    <div class="card" style="margin-top:14px"><div class="row"><h2 class="grow" style="margin:0">Календарь занятий</h2><span class="legend"><span><i class="dot" style="background:var(--accent)"></i>учебники</span><span><i class="dot" style="background:var(--c2)"></i>экзамены</span></span></div>${heatmap(A)}</div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><h2>Решено по дням · 30 дней</h2>${kindBars(A.att, 30)}</div>
      <div class="card"><h2>Уверенность по неделям</h2>${weekLines(B.att, E.att)}</div>
    </div>`;
  }
  function topicsTab(st) {
    const src = st.src, showB = src !== 'exam', showE = src !== 'book';
    const sorters = { order: null, prio: (a, b) => b.prio - a.prio, conf: (a, b) => (a.avg ?? 9) - (b.avg ?? 9), cover: (a, b) => (a.done / (a.total || 1)) - (b.done / (b.total || 1)), freq: (a, b) => b.freq - a.freq, topic: (a, b) => a.tm - b.tm };
    let chs = CHAPS.filter(ch => topicBook === 'all' || ch.book === topicBook).map(ch => st.chap[ch.id]);
    if (sorters[topicSort]) chs = chs.slice().sort(sorters[topicSort]);
    const frac = (d, t) => (t ? `<div class="frac"><b>${d}</b>/${t}</div>${bar(d / t)}` : '<span class="muted">—</span>');
    const row = (r, label, cls, stat, extra = '') => `<tr class="${cls}" ${extra}>
      <td>${label}</td><td>${stat}</td>
      <td class="num">${r.freq ? (100 * r.freq / FREQ_TOTAL).toFixed(1) + '%' : '<span class="muted">0</span>'}</td>
      ${showB ? `<td class="cellbar">${frac(r.bkD, r.bkT)}</td>` : ''}${showE ? `<td class="cellbar">${frac(r.exD, r.exT)}</td>` : ''}
      <td>${confCell(r.avg)}</td><td class="num">${r.weak || ''}</td><td class="num">${r.attempts || ''}</td><td class="num">${r.time ? fmtDur(r.time) : ''}</td>
      ${showE ? `<td class="num">${r.score != null ? Math.round(r.score * 100) + '%' : ''}</td>` : ''}
      <td class="num">${r.last ? fmtDay(dayOf(r.last)) : ''}</td>
      <td><div class="bar" title="освоено ${Math.round(r.tm * 100)}%"><i style="width:${Math.round(r.tm * 100)}%;background:var(--c5)"></i></div></td></tr>`;
    let rows = '';
    chs.forEach(r => {
      const ch = CHAP[r.id], open = openChaps.has(ch.id);
      rows += row(r, `${open ? '▾' : '▸'} К${ch.book} · ${ch.n}. ${esc(ch.name)}`, 'chaprow', `<span class="tchip ${r.ttotal && r.tfull === r.ttotal ? 'full' : r.ttotal && r.tdone === r.ttotal ? 'done' : r.tdone + r.tprog ? 'prog' : ''}">${r.tdone}/${r.ttotal}${r.tfull ? ` · ★${r.tfull}` : ''}</span>`, `data-a="toggleChap" data-ch="${ch.id}"`);
      if (open) ch.sections.forEach(s => { const x = st.sec[s.code], t = TOPIC[s.code]; rows += row(x, `${esc(s.n)} ${esc(s.name)} <span class="rowacts">${t ? `<a href="#book/${t.ch.key}" class="small">путь</a>` : ''}${topicExam(s.code).length ? ` <a href="#" data-a="startCode" data-code="${s.code}" class="small">экзамен</a>` : ''}</span>`, 'secrow', topicChip(s.code)); });
    });
    return `<div class="grid g2">
      <div class="card"><h2>Что подтянуть</h2><p class="muted small" style="margin-top:0">Частота темы на экзаменах × (1 − освоенность темы). Освоенность — учебник и экзаменационные вопросы вместе.</p>${prioList(st.prio.slice(0, 8))}</div>
      <div class="card"><h2>Последняя оценка по каждой задаче</h2>${distBar(st.latest, st.totalQ)}<h3 style="margin-top:16px">Главы по освоенности тем</h3>${chapMasteryChart(st)}</div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="row"><h2 class="grow" style="margin:0">Главы и темы</h2>
        <div class="seg">${[['all', 'Обе книги'], ['1', 'Книга 1'], ['2', 'Книга 2']].map(([k, l]) => `<button class="${topicBook === k ? 'on' : ''}" data-a="topicBook" data-v="${k}">${l}</button>`).join('')}</div>
        <select data-f="topicSort">${[['order', 'По порядку книги'], ['prio', 'По приоритету'], ['topic', 'Меньше всего изучено'], ['conf', 'Слабые сначала'], ['cover', 'Меньше всего решено'], ['freq', 'Частые на экзамене']].map(([k, l]) => `<option value="${k}" ${topicSort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn sm ghost" data-a="expandAll">${openChaps.size ? 'Свернуть всё' : 'Развернуть всё'}</button></div>
      <div class="tablewrap" style="margin-top:10px"><table>
        <tr><th>Тема</th><th>Статус</th><th class="num" title="Доля подпунктов экзаменов 2015–2026 по этой теме">На экзамене</th>${showB ? '<th>Учебник</th>' : ''}${showE ? '<th>Экзамены</th>' : ''}<th>Уверенность</th><th class="num" title="Задач с последней оценкой 1–2">Слабых</th><th class="num">Попыток</th><th class="num">Время</th>${showE ? '<th class="num">Баллы</th>' : ''}<th class="num">Последний раз</th><th>Освоено</th></tr>
        ${rows}</table></div>
      <p class="muted tiny">Статус главы — изучено тем из всех. Тема изучена, когда освоены её упражнения: режим изучения пройден или 60% задач на 4–5. Экзаменационные вопросы по теме — по желанию. ★ Пройдена полностью — все задачи темы и все экзаменационные вопросы по ней на 4–5.</p>
    </div>`;
  }
  function chaptersTab() {
    const rows = CHS.map(ch => {
      const st = chState(ch), B = BOSS[ch.key], best = chBest(ch.key), s = bossStateOf(st), known = bossKnown(ch);
      return `<a class="chrow s-${st.state}" href="#book/${ch.key}" style="--bh:${known ? B.h : 240}"><div class="chrow-art">${known ? bossArt(ch, 64, s) : bossSilhouette(64)}</div>
        <div class="chrow-main"><div class="row" style="gap:8px"><b>${esc(TBOOK[ch.book].short)} · ${ch.n}. ${esc(ch.name)}</b>${chBadge(st)}</div><div class="tiny muted">босс: ${esc(bossName(ch))} · HP ${known ? `${st.hp}/${st.ex.length}` : '?'}${best ? ` · испытание ${best.score}% ${starStr(best.stars)}` : ''}</div></div>
        <div class="chrow-bars"><div><span>темы</span><div class="tbar-t">${topicTrack(st.ts)}</div><b>${st.ts.done}/${st.ts.total}${st.ts.full ? ` ★${st.ts.full}` : ''}</b></div>
          <div><span>повторение</span>${bar(st.revN ? st.revOk / st.revN : 0, 'var(--c2)')}<b>${st.revOk}/${st.revN}</b></div>
          <div><span>экзамен</span>${bar(st.ex.length ? st.exOk / st.ex.length : 0, 'var(--c1)')}<b>${st.exOk}/${st.ex.length}</b></div>
          <div><span>вся глава 4–5</span>${bar(st.total ? st.allOk / st.total : 0, '#e0a100')}<b>${st.allOk}/${st.total}</b></div></div></a>`;
    }).join('');
    return `<p class="small muted" style="margin-top:0">Босс главы скрыт, пока не пройден учебник хотя бы одной её темы. ☠ Босс повержен — все темы главы изучены, всё повторение и все вопросы экзаменов по главе на 4–5.${goldKnown() ? ' ◆ Золотая глава — все задачи главы на 4–5.' : ' ◆ ???'}${redKnown() ? ' ✶ Багровая — все на 5.' : ' ✶ ???'}</p>
      <div class="chrows">${rows}</div>${flagsCard()}`;
  }
  function ranksTab() {
    const x = rankInfo(), p = xpParts();
    const parts = [['задачи', p.tasks], ['боссы и главы', p.bosses], ['достижения', p.ach], ['испытания глав', p.chal]];
    return `<div class="card rankhero">${rankCard({ size: 150 })}
        <div><div class="eyebrow">откуда опыт</div>${parts.map(([l, v]) => `<div class="kv"><span>${l}</span><b>${v} XP</b></div>`).join('')}
          <p class="tiny muted">Опыт: каждая решённая задача (больше — за уверенность, экзаменационные и задачи повторения), поверженные боссы (+300), золотые (+500) и багровые (+900) главы, звёзды испытаний и ступени достижений. На выбор задач и интервалы не влияет.</p>
</div></div>
      <div class="section-title"><span class="idx">12 рангов · 32 ступени</span><h2>Лестница</h2></div>${rankLadder()}`;
  }
  function activityTab(st) {
    const td = today(), daysArr = []; for (let d = td - 29; d <= td; d++) daysArr.push(d);
    const byDay = {}; st.att.forEach(a => { const d = dayOf(a.t); (byDay[d] || (byDay[d] = [])).push(a); });
    const stack = daysArr.map(d => ({ label: fmtDay(d), parts: [1, 2, 3, 4, 5].map(v => ({ v: (byDay[d] || []).filter(a => a.conf === v).length, color: `var(--c${v})` })) }));
    const timeBars = daysArr.map(d => ({ label: fmtDay(d), v: Math.round((byDay[d] || []).reduce((x, a) => x + (a.time || 0), 0) / 60), color: 'var(--accent)' }));
    const rep = st.items.map(it => C[it.id]).filter(c => c && c.n >= 2);
    const imp = rep.length ? avg(rep.map(c => c.lastConf - c.hist[0].conf)) : null;
    const exA = st.att.filter(a => QBY[a.q] && a.time);
    const secA = exA.filter(a => QBY[a.q].section === 'A'), secB = exA.filter(a => QBY[a.q].section === 'B');
    const mpm = arr => (arr.length ? (arr.reduce((x, a) => x + a.time, 0) / 60 / arr.reduce((x, a) => x + QBY[a.q].marks, 0)).toFixed(2) : '—');
    const bk = st.att.filter(a => TBY[a.q] && a.time);
    return `<div class="card"><h2>Календарь занятий</h2>${heatmap(st)}</div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><h2>Решено по дням · 30 дней</h2>${stackBars(stack)}<div class="legend" style="margin-top:6px">${[1, 2, 3, 4, 5].map(v => `<span><i class="dot cf${v}"></i>${v} ${esc(CONF[v].n)}</span>`).join('')}</div></div>
      <div class="card"><h2>Минут в день · 30 дней</h2>${vbars(timeBars, ' мин')}</div>
      <div class="card"><h2>Средняя уверенность по неделям</h2>${weekLines(st.att.filter(a => TBY[a.q]), st.att.filter(a => QBY[a.q]))}
        <p class="small muted">${rep.length ? `Повторно решённых задач: ${rep.length}. Средний рост уверенности от первой попытки к последней: <b>${imp >= 0 ? '+' : ''}${imp.toFixed(2)}</b>.` : 'Рост уверенности появится, когда вы повторно решите задачи.'}</p></div>
      <div class="card"><h2>Прогноз повторений · 30 дней</h2>${forecastChart(st.items.map(it => C[it.id]).filter(Boolean), 30)}
        <h3 style="margin-top:14px">Темп</h3>
        <table><tr><th></th><th class="num">значение</th><th class="num">попыток</th></tr>
        ${st.src !== 'exam' ? `<tr><td>Учебники: мин на задачу</td><td class="num">${bk.length ? (bk.reduce((x, a) => x + a.time, 0) / 60 / bk.length).toFixed(1) : '—'}</td><td class="num">${bk.length}</td></tr>` : ''}
        ${st.src !== 'book' ? `<tr><td>Экзамен, Section A: мин на балл</td><td class="num">${mpm(secA)}</td><td class="num">${secA.length}</td></tr><tr><td>Экзамен, Section B: мин на балл</td><td class="num">${mpm(secB)}</td><td class="num">${secB.length}</td></tr><tr><td>Экзаменационный темп</td><td class="num">0.50</td><td class="num"></td></tr>` : ''}</table></div>
    </div>`;
  }
  function mapTab() {
    const cell = (y, p, n) => {
      const q = QBY[`${y}-P${p}-Q${n}`];
      if (!q) return '<td><span class="cell none"></span></td>';
      const c = C[q.id], s = status(q.id);
      const bg = c ? `var(--c${c.lastConf})` : 'var(--cnew)';
      const tip = `${qTitle(q)} — ${c ? CONF[c.lastConf].n + ', попыток ' + c.n : 'не решался'}${s === 'due' ? ', пора повторить' : ''}\n${codesOf(q).map(secLabel).join('\n')}`;
      return `<td><span class="cell ${s === 'due' ? 'due' : ''}" style="background:${bg}" title="${esc(tip)}" data-a="preview" data-id="${q.id}">${n}</span></td>`;
    };
    const head = `<tr><th></th>${[1, 2].map(p => `<th colspan="10">Paper ${p}</th><th></th>`).join('')}</tr>`;
    const rows = YEARS.map(y => {
      const done = Q.filter(q => q.year === y && C[q.id]).length, tot = Q.filter(q => q.year === y).length;
      return `<tr><th>${y}</th>${[1, 2].map(p => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => cell(y, p, n)).join('') + '<td style="width:10px"></td>').join('')}<td class="tiny muted" style="text-align:left;padding-left:6px">${done}/${tot}</td></tr>`;
    }).join('');
    return `<div class="card"><h2>Карта экзаменов</h2>
      <p class="muted small" style="margin-top:0">Каждая клетка — вопрос. Цвет — последняя оценка уверенности, рамка — пора повторить. Q1–Q6 — Section A, дальше Section B. Нажмите на клетку, чтобы открыть вопрос.</p>
      <div class="tablewrap"><table class="emap">${head}${rows}</table></div>
      <div class="legend" style="margin-top:10px"><span><i class="dot"></i>не решался</span>${[1, 2, 3, 4, 5].map(v => `<span><i class="dot cf${v}"></i>${esc(CONF[v].n)}</span>`).join('')}</div></div>`;
  }
  let logAll = false;
  function logTab(st) {
    const list = st.att.slice().sort((a, b) => b.t - a.t);
    const show = logAll ? list : list.slice(0, 60);
    return `<div class="card"><div class="row"><h2 class="grow">Журнал попыток (${list.length})</h2><button class="btn sm" data-a="exportCsv">Скачать CSV</button></div>
      <div class="tablewrap"><table><tr><th>Когда</th><th></th><th>Задача</th><th>Уверенность</th><th>По пунктам</th><th class="num">Баллы</th><th class="num">Время</th><th>Повтор</th><th></th></tr>
      ${show.map(a => { const it = itemOf(a.q); if (!it) return ''; const q = it.q; return `<tr><td class="small">${fmtDate(a.t)}</td><td><span class="kindtag ${it.kind}">${it.kind === 'exam' ? 'экзамен' : 'учебник'}</span></td><td><a href="#" data-a="preview" data-id="${it.id}">${esc(q ? qTitle(q) : shortTitle(it.t))}</a></td><td><span class="confcell">${confDot(a.conf)}${esc(CONF[a.conf].n)}</span></td>
        <td class="small muted">${a.parts ? Object.entries(a.parts).map(([p, v]) => partLabel(p) + ' ' + v).join(', ') : ''}</td>
        <td class="num">${a.score != null && q ? a.score + '/' + q.marks : ''}</td><td class="num">${a.time ? fmtDur(a.time) : ''}</td><td class="small">${esc(ivName(a.iv))}${a.sug != null && a.iv !== a.sug ? ` <span class="muted">(рек. ${a.sug})</span>` : ''}</td>
        <td><button class="btn sm ghost danger" data-a="delAttempt" data-id="${a.id}" title="Удалить попытку">✕</button></td></tr>`; }).join('')}
      </table></div>${!logAll && list.length > 60 ? '<button class="btn sm" data-a="logAll" style="margin-top:8px">Показать все</button>' : ''}</div>`;
  }

  /* ---------- charts (inline SVG) ---------- */
  function hbars(items) {
    const max = Math.max(1, ...items.map(i => i.v)); const total = items.reduce((x, i) => x + i.v, 0) || 1;
    return `<div style="display:flex;flex-direction:column;gap:6px">${items.map(i => `<div style="display:grid;grid-template-columns:120px 1fr 70px;gap:8px;align-items:center" class="small">
      <span>${esc(i.label)}</span><div class="bar" style="height:12px"><i style="width:${100 * i.v / max}%;background:${i.color}"></i></div><span class="muted" style="text-align:right">${i.v} · ${pct(i.v, total)}%</span></div>`).join('')}</div>`;
  }
  function vbars(items, unit = '') {
    const W = 560, H = 160, pad = 18, n = items.length, bw = (W - pad) / n;
    const max = Math.max(1, ...items.map(i => i.v));
    const bars = items.map((it, k) => { const h = (H - 30) * it.v / max; return `<rect class="vb" style="animation-delay:${(k * 0.015).toFixed(3)}s" x="${f2(pad + k * bw + 1.5)}" y="${f2(H - 18 - h)}" width="${f2(Math.max(1, bw - 3))}" height="${f2(h)}" rx="2.5" fill="${it.color}"><title>${esc(it.label)}: ${it.v}${unit}</title></rect>`; }).join('');
    const labels = items.map((it, k) => (k % Math.ceil(n / 8) === 0 ? `<text x="${f2(pad + k * bw + bw / 2)}" y="${H - 4}" text-anchor="middle">${esc(it.label)}</text>` : '')).join('');
    return `<svg class="svgchart" viewBox="0 0 ${W} ${H}"><text x="0" y="12">${max}${unit}</text><line x1="${pad}" x2="${W}" y1="${H - 18}" y2="${H - 18}" stroke="var(--border)"/>${bars}${labels}</svg>`;
  }
  function stackBars(items) {
    const W = 560, H = 160, pad = 18, n = items.length, bw = (W - pad) / n;
    const max = Math.max(1, ...items.map(i => i.parts.reduce((x, p) => x + p.v, 0)));
    let out = '';
    items.forEach((it, k) => {
      let y = H - 18; const tot = it.parts.reduce((x, p) => x + p.v, 0);
      it.parts.forEach(p => { if (!p.v) return; const h = (H - 30) * p.v / max; y -= h; out += `<rect class="vb" style="animation-delay:${(k * 0.015).toFixed(3)}s" x="${f2(pad + k * bw + 1.5)}" y="${f2(y)}" width="${f2(Math.max(1, bw - 3))}" height="${f2(h)}" fill="${p.color}"><title>${esc(it.label)}: ${tot}</title></rect>`; });
      if (k % Math.ceil(n / 8) === 0) out += `<text x="${f2(pad + k * bw + bw / 2)}" y="${H - 4}" text-anchor="middle">${esc(it.label)}</text>`;
    });
    return `<svg class="svgchart" viewBox="0 0 ${W} ${H}"><text x="0" y="12">${max}</text><line x1="${pad}" x2="${W}" y1="${H - 18}" y2="${H - 18}" stroke="var(--border)"/>${out}</svg>`;
  }
  // solved per day, split into textbook and exam questions
  function kindBars(att, n) {
    const td = today(), items = [];
    for (let d = td - n + 1; d <= td; d++) { const a = att.filter(x => dayOf(x.t) === d); items.push({ label: fmtDay(d), parts: [{ v: a.filter(x => TBY[x.q]).length, color: 'var(--accent)' }, { v: a.filter(x => QBY[x.q]).length, color: 'var(--c2)' }] }); }
    if (!items.some(i => i.parts[0].v + i.parts[1].v)) return '<div class="muted small">Пока нет решённых задач за этот период.</div>';
    return stackBars(items) + '<div class="legend" style="margin-top:6px"><span><i class="dot" style="background:var(--accent)"></i>учебники</span><span><i class="dot" style="background:var(--c2)"></i>экзамены</span></div>';
  }
  // weekly average confidence: textbooks vs exam papers
  function weekLines(bookAtt, examAtt) {
    const wk = ts => { const d = dayOf(ts); return d - (dateOfDay(d).getDay() + 6) % 7; };
    const group = att => { const m = {}; att.forEach(a => { const w = wk(a.t); (m[w] || (m[w] = [])).push(a.conf); }); return m; };
    const gb = group(bookAtt), ge = group(examAtt);
    const keys = [...new Set(Object.keys(gb).concat(Object.keys(ge)).map(Number))].sort((a, b) => a - b).slice(-16);
    if (!keys.length) return '<div class="muted small">Недостаточно данных</div>';
    const W = 560, H = 180, l = 22, r = 10, t = 10, b = 22;
    const x = k => (keys.length === 1 ? (l + W - r) / 2 : l + (W - l - r) * k / (keys.length - 1));
    const y = v => t + (H - t - b) * (5 - v) / 4;
    const grid = [1, 2, 3, 4, 5].map(v => `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)" stroke-dasharray="3 3"/><text x="${l - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('');
    const line = (g, col) => {
      const pts = keys.map((w, k) => (g[w] ? { k, v: avg(g[w]), n: g[w].length, w } : null)).filter(Boolean);
      if (!pts.length) return '';
      const d = pts.map((p, j) => `${j ? 'L' : 'M'}${f2(x(p.k))},${f2(y(p.v))}`).join(' ');
      return `<path class="ln" d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" pathLength="1"/>${pts.map(p => `<circle cx="${f2(x(p.k))}" cy="${f2(y(p.v))}" r="3.6" fill="${col}" stroke="var(--panel)" stroke-width="1.5"><title>неделя с ${esc(fmtDay(p.w))}: ${p.v.toFixed(2)} (${p.n})</title></circle>`).join('')}`;
    };
    const labels = keys.map((w, k) => (k % Math.ceil(keys.length / 6) === 0 ? `<text x="${f2(x(k))}" y="${H - 5}" text-anchor="middle">${esc(fmtDay(w))}</text>` : '')).join('');
    return `<svg class="svgchart" viewBox="0 0 ${W} ${H}">${grid}${line(gb, 'var(--accent)')}${line(ge, 'var(--c2)')}${labels}</svg><div class="legend" style="margin-top:6px"><span><i class="dot" style="background:var(--accent)"></i>учебники</span><span><i class="dot" style="background:var(--c2)"></i>экзамены</span></div>`;
  }
  function heatmap(st) {
    const td = today(); const weeks = 26;
    const dow = d => (dateOfDay(d).getDay() + 6) % 7;
    const start = td - dow(td) - (weeks - 1) * 7;
    const cnt = {}, ex = {}; st.att.forEach(a => { const d = dayOf(a.t); cnt[d] = (cnt[d] || 0) + 1; if (QBY[a.q]) ex[d] = (ex[d] || 0) + 1; });
    const max = Math.max(1, ...Object.values(cnt));
    const cs = 13, gap = 3, L = 24, T = 16;
    let out = '';
    (EN() ? ['Mon', '', 'Wed', '', 'Fri', '', ''] : ['Пн', '', 'Ср', '', 'Пт', '', '']).forEach((s, i) => { if (s) out += `<text x="0" y="${T + i * (cs + gap) + 10}">${s}</text>`; });
    for (let w = 0; w < weeks; w++) {
      for (let i = 0; i < 7; i++) {
        const d = start + w * 7 + i; if (d > td) continue;
        const n = cnt[d] || 0, col = (ex[d] || 0) * 2 > n ? 'var(--c2)' : 'var(--accent)';
        out += `<rect x="${L + w * (cs + gap)}" y="${T + i * (cs + gap)}" width="${cs}" height="${cs}" rx="3.5" fill="${n ? col : 'var(--panel2)'}" fill-opacity="${n ? f2(0.28 + 0.72 * n / max) : 1}" stroke="var(--border)" stroke-width="${n ? 0 : 1}"><title>${fmtDay(d)}: ${n} ${plural(n, 'задача', 'задачи', 'задач')}${ex[d] ? ` (экзамен ${ex[d]})` : ''}</title></rect>`;
      }
      const d0 = start + w * 7; if (dateOfDay(d0).getDate() <= 7) out += `<text x="${L + w * (cs + gap)}" y="10">${dateOfDay(d0).toLocaleDateString(LOC(), { month: 'short' })}</text>`;
    }
    const W = L + weeks * (cs + gap), H = T + 7 * (cs + gap);
    return `<div class="tablewrap"><svg class="svgchart hm" style="max-width:${W * 1.7}px" viewBox="0 0 ${W} ${H}">${out}</svg></div>
      <div class="small muted">Дней с занятиями: ${st.days.size} · серия сейчас: ${st.streak} · рекорд: ${st.bestStreak}</div>`;
  }
  function forecastChart(cards, n) {
    const td = today(), live = cards.filter(c => !c.retired), now = live.filter(c => c.due <= td).length, items = [];
    for (let k = 1; k < n; k++) { const d = td + k; items.push({ label: k === 1 ? 'завтра' : fmtDay(d), v: live.filter(c => c.due === d).length, color: 'var(--accent)' }); }
    const head = `<div class="fc-now"><b>${now}</b><span>${now ? 'на сегодня, вместе с просроченными' : 'на сегодня повторять нечего'}</span></div>`;
    return head + (items.some(i => i.v) ? vbars(items) : '<div class="muted small">Дальше повторений по плану нет.</div>');
  }
  function chapMasteryChart(st) {
    const items = CHAPS.map(ch => ({ ch, r: st.chap[ch.id] })).filter(x => x.r.total);
    return `<div style="display:flex;flex-direction:column;gap:4px">${items.map(({ ch, r }) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) 120px 48px;gap:8px;align-items:center" class="tiny">
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(ch.name)}">К${ch.book}·${ch.n} ${esc(ch.name)}</span>
      <div class="tbar-t">${topicTrack({ full: r.tfull, done: r.tdone, prog: r.tprog, total: r.ttotal })}</div><span class="muted" style="text-align:right">${r.tdone}/${r.ttotal}</span></div>`).join('')}</div>`;
  }

  /* ================= SETTINGS ================= */
  const ACCENTS = [['blue', 228, 88, 54, 'Синий'], ['indigo', 248, 80, 60, 'Индиго'], ['violet', 268, 78, 58, 'Фиолетовый'], ['pink', 330, 82, 54, 'Розовый'], ['red', 357, 80, 52, 'Красный'], ['orange', 22, 92, 50, 'Оранжевый'], ['amber', 40, 96, 43, 'Янтарный'], ['lime', 84, 70, 38, 'Лайм'], ['green', 145, 64, 36, 'Зелёный'], ['teal', 172, 74, 34, 'Бирюзовый'], ['cyan', 192, 84, 40, 'Голубой'], ['mono', 0, 0, 11, 'Монохром']];
  VIEWS.settings = () => {
    const s = S.settings;
    const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${s[k] === v ? 'on' : ''}" data-a="setOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const u = ACC && ACC.user;
    return `<div class="pagehead"><div><div class="eyebrow">настройки</div><h1>Настройки</h1></div>
      ${u ? `<div class="row acct"><span class="acct-av">${esc((u.email || '·')[0].toUpperCase())}</span><div><b data-notr>${esc(u.email || '')}</b><div class="tiny muted"><span class="planchip ${myPlan()}">${PLAN_LABEL[myPlan()]}</span></div></div><a class="btn sm ghost" href="../index.html">Сайт</a><button class="btn sm" data-a="logout">Выйти</button></div>` : ''}</div>
    ${u ? accountCard() : ''}
    <div class="grid g2">
    <div class="card"><h2>Оформление</h2>
      <div class="setrow"><span>Тема</span>${seg('theme', [['auto', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']])}</div>
      <div class="setrow"><span>Акцент</span><div class="swatches">${ACCENTS.map(([k, hh, ss, ll, n]) => `<button class="sw ${s.accent === k ? 'on' : ''}" data-a="setOpt" data-k="accent" data-v="${k}" title="${n}" style="background:hsl(${hh} ${ss}% ${ll}%)"></button>`).join('')}</div></div>
      <div class="setrow"><span>Фон</span>${seg('bg', [['grid', 'Сетка'], ['dots', 'Точки'], ['plain', 'Чистый']])}</div>
      <div class="setrow"><span>Анимации</span>${seg('motion', [['full', 'Все'], ['reduced', 'Минимум']])}</div>
      <div class="setrow"><span>Язык</span>${seg('lang', [['ru', 'Русский'], ['en', 'English']])}</div>
      <div class="prevstrip"><button class="btn pri">Кнопка</button><span class="chip on">выбрано</span><span class="tchip prog">в процессе</span><div style="flex:1;min-width:120px">${bar(0.62)}</div>${emblem(rankInfo().r, 46, true)}</div>
      <h2 style="margin-top:22px">Цели</h2>
      <div class="setrow"><span>Вопросов в день</span><input class="num" type="number" min="1" value="${s.goal}" data-f="goal"></div>
      <div class="setrow"><span>«Новые с экзаменов»</span><input class="num" type="number" min="1" value="${s.newPerDay}" data-f="newPerDay"></div>
      <div class="setrow"><span>Дата экзамена</span><input class="txt" type="date" data-f="examDate" value="${(() => { const d = examDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}"><span class="muted small">для страницы «Отсчёт»</span></div>
      <div class="setrow"><span>Начало подготовки</span><input class="txt" type="date" data-f="startDate" value="${isoDay(startDay())}"><span class="muted small">${S.settings.startDate ? 'задано вручную — очистите поле, чтобы считать от первой задачи' : 'по умолчанию — день первой решённой задачи'}. От этой даты считаются темп и прогноз.</span></div>
      <div class="setrow"><span>Ширина картинки</span><input type="range" min="560" max="1100" step="20" value="${s.imgw}" data-f="imgw"><span class="muted">${s.imgw}px</span></div>
    </div>
    <div class="card"><h2>Интервалы повторения по умолчанию</h2>
      <p class="muted small" style="margin-top:0">После оценки уверенности кнопка с этим интервалом подсвечивается как рекомендованная. Если задача подряд решена на 4–5, интервал автоматически растёт (×1.8 или ×2.5). Вы всегда можете выбрать другой.</p>
      ${[1, 2, 3, 4, 5].map(v => `<div class="row" style="margin:6px 0"><span class="dot cf${v}"></span><span style="width:170px">${v} — ${esc(CONF[v].n)}</span><input class="num" type="number" min="0" value="${s.iv[v]}" data-f="iv" data-v="${v}"> <span class="muted">дней</span></div>`).join('')}
      <h2 style="margin-top:22px">Данные</h2>
      <p class="muted small" style="margin-top:0">Весь прогресс (оценки, интервалы, заметки, избранное, изменённые темы) хранится в этом браузере. Если очистить данные браузера или открыть страницу в другом браузере, его не будет — поэтому периодически скачивайте резервную копию.</p>
      <p class="small">Попыток: <b>${S.attempts.length}</b> · заметок: <b>${Object.keys(S.notes).length}</b> · избранных: <b>${Object.keys(S.stars).length}</b> · вопросов с изменёнными темами: <b>${Object.keys(S.tags).length}</b><br>
      Последняя копия: <b>${S.lastExport ? fmtDate(S.lastExport) : 'ещё не делалась'}</b></p>
      <div class="row"><button class="btn pri" data-a="export">Скачать резервную копию (.json)</button>
        <label class="btn">Восстановить из копии…<input type="file" accept=".json,application/json" id="importFile" class="hidden"></label></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-a="exportCsv">Скачать журнал попыток (.csv)</button><button class="btn sm" data-a="openSessions">Сессии: засчитать / удалить</button></div>
      <h2 style="margin-top:22px">Сброс</h2>
      <button class="btn danger" data-a="resetAll">Удалить весь прогресс</button>
      <h2 style="margin-top:22px">О базе</h2>
      <p class="small muted">${TI.length} задач из двух учебников, ${Q.length} вопросов из ${YEARS.length * 2} экзаменационных работ (${YEARS[0]}–${YEARS[YEARS.length - 1]}), решения из marking scheme: ${Q.filter(q => q.ms).length}, решений Claude к задачам на доказательство: ${Object.keys(SOL).length}.</p>
    </div></div>`;
  };
  // ---------- account: plan, subscription, data rights ----------
  let SUBS = null;
  function accountCard() {
    if (SUBS === null && ACC) { SUBS = []; ACC.subscriptions().then(r => { SUBS = r; if (view === 'settings') render(); }); }
    const sub = (SUBS || []).find(x => ['active', 'trialing', 'past_due'].includes(x.status));
    const until = sub && sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const line = sub ? (sub.status === 'past_due' ? L('Платёж не прошёл — обновите карту, иначе доступ закроется.', 'The payment failed — update your card or access will close.')
      : sub.cancel_at_period_end ? L(`Подписка отменена, доступ до ${until}.`, `Cancelled, access until ${until}.`)
      : L(`${sub.billing_interval === 'year' ? 'Годовая' : 'Месячная'} подписка, следующее списание ${until}.`, `${sub.billing_interval === 'year' ? 'Yearly' : 'Monthly'} subscription, next payment on ${until}.`))
      : myPlan() === 'max' && !sub ? L('Полный доступ.', 'Full access.') : L('Бесплатный тариф: обе книги и экзамены 2015–2016. Режим изучения, статистика и ранги — в Pro.', 'Free plan: both books and the 2015–2016 papers. Study mode, statistics and ranks come with Pro.');
    return `<div class="card acctcard" style="margin-bottom:14px"><div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap">
      <div class="grow" style="min-width:240px"><h2 style="margin:0 0 6px">${L('Тариф', 'Plan')} <span class="planchip ${myPlan()}">${PLAN_LABEL[myPlan()]}</span></h2><div class="small muted">${line}</div>
        ${hasPlan('max') && !ACC.demo ? `<div class="small" style="margin-top:8px">${L('Синхронизация между устройствами', 'Sync between devices')}: <b>${SYNC.err ? L('ошибка', 'error') : SYNC.at ? L('включена', 'on') + ' · ' + fmtDate(SYNC.at) : L('включена', 'on')}</b> <button class="btn sm ghost" data-a="syncNow">↻ ${L('Сейчас', 'Now')}</button></div>` : ''}</div>
      <div class="row">${sub ? `<button class="btn" data-a="portal">${L('Управлять подпиской', 'Manage subscription')}</button>` : hasPlan('pro') ? '' : `<a class="btn pri" href="../index.html#pricing">${L('Выбрать тариф', 'Choose a plan')}</a>`}</div></div>
      <div class="row" style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
        <button class="btn sm ghost" data-a="exportAccount">${L('Скачать мои данные (.json)', 'Download my data (.json)')}</button>
        <a class="btn sm ghost" href="../legal/privacy.html" target="_blank">${L('Конфиденциальность', 'Privacy')}</a>
        <span class="grow"></span><button class="btn sm danger" data-a="deleteAccount">${L('Удалить аккаунт', 'Delete account')}</button></div></div>`;
  }
  // Adds another copy of the progress to this one. Attempts are only ever added (deletions are remembered in
  // S.gone), so merging both ways never loses work; this device keeps its own settings and open session.
  function mergeState(data) {
    const gone = Object.assign(S.gone || (S.gone = {}), data.gone || {});
    const ids = new Set(S.attempts.map(a => a.id));
    (data.attempts || []).forEach(a => { if (!ids.has(a.id) && !gone[a.id]) S.attempts.push(a); });
    S.attempts = S.attempts.filter(a => !gone[a.id]);
    ['stars', 'notes', 'tags', 'flags', 'ach'].forEach(k => { S[k] = Object.assign({}, data[k] || {}, S[k] || {}); });
    // sessions carry the context of old attempts (boss fight, study run, topic), so they come along too
    Object.entries(data.sessions || {}).forEach(([id, r]) => { if (!S.sessions[id]) S.sessions[id] = r; });
    Object.entries(data.study || {}).forEach(([g, m]) => { if (!S.study[g]) S.study[g] = m; });
    Object.entries(data.challenges || {}).forEach(([k, list]) => { const cur = S.challenges[k] || (S.challenges[k] = []); (list || []).forEach(r => { if (!cur.some(x => x.sess === r.sess)) cur.push(r); }); });
    if (data.lore && data.lore.v === 2) { const f = loreOf().found; Object.entries(data.lore.found || {}).forEach(([n, t]) => { if (!f[n] || t < f[n]) f[n] = t; }); }
    if (data.final) { const F = finalOf(); Object.assign(F.seals, data.final.seals || {}); if (data.final.opened && (!F.opened || data.final.opened < F.opened)) F.opened = data.final.opened; }
    if (data.events) { const seen = new Set((S.events || []).map(e => e.t + e.k + (e.n || ''))); (S.events || (S.events = [])).push(...data.events.filter(e => !seen.has(e.t + e.k + (e.n || '')))); S.events.sort((a, b) => a.t - b.t); }
    if (data.settings && data.settings.startDate && !S.settings.startDate) S.settings.startDate = data.settings.startDate;
  }

  /* ---------- MAX: progress follows the account between devices ---------- */
  async function syncNow() {
    if (!ACC || !ACC.user || ACC.demo || !hasPlan('max') || SYNC.busy) return;
    SYNC.busy = true;
    try {
      const { data, error } = await ACC.sb.from('progress').select('state, updated_at').eq('user_id', ACC.user.id).maybeSingle();
      if (error) throw error;
      if (data && data.state) { mergeState(data.state); rebuild(); }
      const st = Object.assign({}, S, { session: null });
      const up = await ACC.sb.from('progress').upsert({ user_id: ACC.user.id, state: st, updated_at: new Date().toISOString() });
      if (up.error) throw up.error;
      saveLocal(); SYNC.at = Date.now(); SYNC.err = null;
      render();
    } catch (e) { SYNC.err = String(e.message || e); console.error('sync', e); }
    SYNC.busy = false;
  }
  const syncSoon = () => { if (!ACC || !hasPlan('max')) return; clearTimeout(SYNC.t); SYNC.t = setTimeout(syncNow, 8000); };

  AFTER.settings = () => {
    const f = $('#importFile');
    if (f) f.addEventListener('change', () => {
      const file = f.files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const data = JSON.parse(rd.result);
          if (!data || !Array.isArray(data.attempts)) throw new Error('bad');
          const merge = S.attempts.length && ask('Объединить с текущим прогрессом? (OK — объединить, Отмена — заменить полностью)');
          if (merge) {
            mergeState(data);
          } else {
            if (S.attempts.length && !ask('Текущий прогресс будет заменён копией. Продолжить?')) return;
            const keepSettings = data.settings ? Object.assign({}, DEF_SETTINGS, data.settings) : S.settings;
            S = Object.assign(fresh(), data, { settings: keepSettings, session: null });
          }
          rebuild(); save(); applyTheme(); toast('Прогресс восстановлен'); render();
        } catch (e) { toast('Не удалось прочитать файл'); }
      };
      rd.readAsText(file);
    });
  };

  /* ================= PATH (textbooks + bosses) ================= */
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  const bookCards = () => TI.map(t => C[t.id]).filter(Boolean);
  const bookDue = () => BOOK_ORDER.filter(id => status(id) === 'due').sort((a, b) => C[a].due - C[b].due || C[a].lastConf - C[b].lastConf);
  function prog(ids) {
    let done = 0, mast = 0; const confs = [];
    ids.forEach(id => { const c = C[id]; if (c) { done++; confs.push(c.lastConf); if (c.lastConf >= 4) mast++; } });
    const n = ids.length;
    return { total: n, done, mast, avg: avg(confs), p: n ? done / n : 0, m: n ? mast / n : 0, stars: !n ? 0 : mast / n >= 0.8 ? 3 : done === n ? 2 : done / n >= 0.5 ? 1 : 0 };
  }
  const chList = key => (S.challenges[key] || []).filter(r => !sessOff(r.sess));
  const chBest = key => { const l = chList(key); return l.length ? l.reduce((a, b) => (b.score > a.score ? b : a)) : null; };
  function nextFrom(ids) {
    const lastT = ids.reduce((best, id) => { const c = C[id]; return c && (!best || c.last.t > C[best].last.t) ? id : best; }, null);
    const start = lastT ? ids.indexOf(lastT) + 1 : 0;
    for (let k = 0; k < ids.length; k++) { const id = ids[(start + k) % ids.length]; if (!C[id]) return id; }
    return null;
  }
  function pills(ids) {
    return `<div class="pills">${ids.map(id => { const t = TBY[id], c = C[id], s = status(id);
      return `<button class="pill ${c ? 'cf' + c.lastConf : ''} ${s === 'due' ? 'due' : ''} ${s === 'retired' ? 'ret' : ''}" data-a="preview" data-id="${id}" title="${esc(bookTitle(t))}${c ? ' — ' + CONF[c.lastConf].n : ''}">${t.n}</button>`; }).join('')}</div>`;
  }
  const bar = (p, color) => `<div class="bar"><i style="width:${Math.round(p * 100)}%;${color ? 'background:' + color : ''}"></i></div>`;
  // the next step on the path: the topic after the one worked on last that is not studied yet
  function nextTopic() {
    return memo('nt', () => {
      let start = 0;
      const last = LIVE.slice().reverse().find(a => TBY[a.q] && TG[TBY[a.q].g].sec);
      if (last) start = Math.max(0, TOPICS.findIndex(t => t.code === TG[TBY[last.q].g].sec));
      for (let k = 0; k < TOPICS.length; k++) {
        const t = TOPICS[(start + k) % TOPICS.length], s = topicState(t.code);
        if (s.status === 'done') continue;
        // Pro: the adaptive study run; free: the topic's exercises in order
        if (hasPlan('pro')) {
          const gid = t.groups.find(g => STUDY_IDS.has(g) && !groupMastery(g).done);
          if (gid) return { t, gid, label: `${S.study[gid] ? 'Продолжить' : 'Изучить'}: ${t.s.n} ${t.s.name}` };
        } else {
          const g = t.groups.find(x => !groupMastery(x).done);
          if (g) return { t, g, m: gIds(g).some(id => !C[id]) ? 'cont' : 'weak', label: `Решать: ${t.s.n} ${t.s.name}` };
        }
      }
      return null;
    });
  }
  const ntBtn = (nt, cls = 'btn pri') => nt ? `<button class="${cls}" ${nt.gid ? `data-a="study" data-g="${nt.gid}"` : nt.g ? `data-a="gStart" data-g="${nt.g}" data-m="${nt.m}"` : `data-a="startCode" data-code="${nt.t.code}"`}>▶ ${esc(nt.label)}</button>` : '';
  VIEWS.book = () => {
    if (!TI.length) return '<div class="card empty">Не найден файл book.js с вопросами учебников.</div>';
    if (bookSub === 'final') return finalView();
    const ch = TCH[bookSub];
    return ch ? chapterView(ch) : pathMap();
  };
  function pathMap() {
    const nt = nextTopic(), due = bookDue().length;
    const cnt = { boss: 0, gold: 0, red: 0 };
    CHS.forEach(ch => { const s = chState(ch).state; if (s !== 'none') cnt.boss++; if (s === 'gold' || s === 'red') cnt.gold++; if (s === 'red') cnt.red++; });
    let h = `<div class="pagehead"><div><div class="eyebrow">сюжет</div><h1>Путь</h1><div class="small muted" style="max-width:640px">Две книги — два акта. Каждая глава: темы, повторение и босс — настоящие вопросы экзаменов 2015–2026 по этой главе.</div></div>
      <div class="row">${ntBtn(nt)}<button class="btn" data-a="bookDue" ${due ? '' : 'disabled'}>↻ Повторить (${due})</button>${loreBtn()}</div></div>`;
    h += `<div class="card pathsum"><div class="grow" style="min-width:260px">${topicBar(ALL_TOPICS, { big: true, title: 'Изучено тем' })}</div>
      <div class="pathstats">${[['boss', '☠', 'боссов повержено', true], ['gold', '◆', 'золотых глав', cnt.gold > 0], ['red', '✶', 'багровых глав', cnt.red > 0]].map(([k, i, l, known]) => `<div class="pst ${k} ${known ? '' : 'unknown'}"><span>${known ? i : '?'}</span><b><span data-count="${cnt[k]}">${cnt[k]}</span>/${CHS.length}</b><small>${known ? l : '???'}</small></div>`).join('')}</div></div>`;
    TT.books.forEach((b, bi) => {
      const ids = b.chapters.flatMap(ch => ch.exItems.concat(ch.revItems)), p = prog(ids);
      h += `<div class="section-title"><span class="idx">АКТ ${ROMAN[bi + 1]}</span><h2>${esc(b.title)}</h2><span class="muted small">${esc(b.name)} · задачи ${p.done}/${p.total}</span></div>
        <div class="chapgrid">${b.chapters.map(chapCard).join('')}</div>`;
    });
    h += `<div class="section-title"><span class="idx">${L('ФИНАЛ', 'FINALE')}</span><h2>${L('За последней страницей', 'Behind the last page')}</h2></div>${finalCard()}`;
    return h;
  }
  function chapCard(ch) {
    const st = chState(ch), B = BOSS[ch.key], known = bossKnown(ch), s = bossStateOf(st);
    const tag = { boss: '☠ повержен', gold: '◆ золото', red: '✶ багровая' }[st.state] || '';
    return `<a class="cc s-${st.state} ${known ? '' : 'unknown'}" href="#book/${ch.key}" style="--bh:${known ? B.h : 240}">${st.state === 'gold' || st.state === 'red' ? chFx(14) : ''}
      <div class="cc-bg">${known ? bossArt(ch, st.state === 'none' ? 176 : 330, s) : bossSilhouette(200)}</div>
      <div class="cc-head"><span class="cc-num">${String(ch.n).padStart(2, '0')}</span>${tag ? `<span class="cc-tag">${tag}</span>` : ''}</div>
      <div><div class="cc-title">${esc(ch.name)}</div><div class="cc-bn">${known ? esc(B.n) : '??? · босс скрыт'}</div></div>
      <div class="cc-foot"><div class="cc-stat"><span>темы<b>${st.ts.done}/${st.ts.total}${st.ts.full ? ` <em>★${st.ts.full}</em>` : ''}</b></span><div class="cc-line tl">${topicTrack(st.ts)}</div></div>
        <div class="cc-stat"><span>hp<b>${known ? `${st.hp}/${st.ex.length}` : '?'}</b></span><div class="cc-line hp"><i style="width:${known ? pct(st.hp, st.ex.length) : 100}%"></i></div></div></div>
    </a>`;
  }
  const chFx = n => { let s = ''; for (let j = 0; j < n; j++) s += `<i style="left:${(j * 37 + 11) % 100}%;animation-delay:${((j * 0.73) % 4).toFixed(2)}s;animation-duration:${(3 + (j % 4) * 0.8).toFixed(1)}s"></i>`; return `<div class="chfx" aria-hidden="true">${s}</div>`; };
  function chapterView(ch) {
    const b = TBOOK[ch.book], st = chState(ch), B = BOSS[ch.key];
    const pe = prog(ch.exItems), pr = prog(ch.revItems), best = chBest(ch.key), hist = chList(ch.key).slice(-5).reverse();
    const nextCh = nextFrom(ch.exItems.concat(ch.revItems));
    const nodes = ch.sections.map(sec => {
      const ids = sec.groups.flatMap(gIds), p = prog(ids), ts = topicState(sec.code), ex = topicExam(sec.code);
      const cls = ts.full ? 'full' : ts.status === 'done' ? 'gold' : !p.total ? 'empty' : ts.status === 'prog' ? 'part' : '';
      return `<div class="node"><div class="bubble ${cls}">${ts.full ? '★' : ts.status === 'done' ? '✓' : esc(sec.n)}</div>
        <div class="nbody card ${ts.full ? 'tfull' : ts.status === 'done' ? 'tdone' : ''}">
          <div class="row"><b class="grow">${esc(sec.n)} ${esc(sec.name)}</b>${topicChip(sec.code)}</div>
          <div class="tstep ${ts.bookDone ? 'ok' : ''}"><span class="exstep">${ts.bookDone ? '✓' : '1'}</span><b>Учебник</b><span class="tiny muted grow">${Math.round(ts.book * 100)}% · решено ${p.done}/${p.total} · ${ts.bookDone ? 'тема изучена' : 'освойте упражнения — тема засчитается изученной'}</span></div>
          ${sec.groups.map(gid => { const g = TG[gid], gi = gIds(gid), gp = prog(gi), nx = nextFrom(gi);
            const stu = S.study[gid] ? studySummary(studyState(gid)) : null;
            return `<div class="tiny muted" style="margin-top:8px">${esc(groupTitle(g))}${g.part ? ' (' + esc(g.part) + ')' : ''} · ${gi.length} ${plural(gi.length, 'вопрос', 'вопроса', 'вопросов')} · решено ${gp.done}${gp.avg != null ? ' · уверенность ' + gp.avg.toFixed(1) : ''} ${studyBadge(gid)}</div>
              ${pills(gi)}
              <div class="row" style="margin-top:7px">
                ${!STUDY_IDS.has(gid) ? '' : !hasPlan('pro') ? `<button class="btn sm" data-a="study" data-g="${gid}">🎯 Изучить тему <span class="planchip pro">Pro</span></button>` : `<button class="btn sm pri" data-a="study" data-g="${gid}" ${stu && stu.finished ? 'data-restart="1"' : ''} title="Адаптивно: следующая задача зависит от того, как вы решили предыдущую">🎯 ${stu ? (stu.finished ? 'Изучить заново' : 'Продолжить изучение') : 'Изучить тему'}</button>`}
                ${nx ? `<button class="btn sm" data-a="gStart" data-g="${gid}" data-m="cont">${gp.done ? 'Все подряд: продолжить' : 'Все подряд'}</button>` : `<button class="btn sm" data-a="gStart" data-g="${gid}" data-m="weak">Повторить слабые</button>`}
                <button class="btn sm" data-a="gStart" data-g="${gid}" data-m="rand">Случайные 5</button>
                ${g.ansAll ? `<button class="btn sm ghost" data-a="ansAll" data-g="${gid}">Ответы</button>` : ''}
              </div>`; }).join('')}
          ${ex.length ? `<div class="exblock ${ts.exFull ? 'done' : ''}">
            <div class="row"><span class="exstep">${ts.exFull ? '★' : '2'}</span><div class="grow" style="min-width:0"><b class="exlabel">Экзамены по теме · ${ex.length}</b>
              <div class="tiny muted">${ts.exFull ? 'Все вопросы экзаменов по теме решены на 4–5 в этой теме' : `на 4–5 в этой теме: ${ts.good}/${ex.length} — нужно для «★ пройдена полностью»${ts.exElse ? ` · <span class="else-key"></span> решено в других темах: ${ts.exElse}` : ''}`}</div></div>
              ${ts.exFull ? '<span class="exdone">✓ закрыто</span>' : `<button class="btn sm ${ts.bookDone ? 'pri' : ''}" data-a="startCode" data-code="${sec.code}">Решать</button>`}</div>
            <div class="exsegs">${ex.map(q => { const a = ctxAtt(q, sec.code), v = ctxConf(q, sec.code); return `<i class="${v >= 4 ? 'hit' : a ? 'tried' : C[q.id] ? 'else' : ''}"></i>`; }).join('')}</div>
            ${examPills(ex, sec.code)}</div>` : '<div class="tstep none"><span class="exstep">–</span><span class="tiny muted">На экзаменах 2015–2026 эта тема не встречалась</span></div>'}
        </div></div>`;
    }).join('');
    const tiers = ['A', 'B', 'C'].filter(t => ch.rev[t]).map(t => {
      const gid = ch.rev[t], gi = gIds(gid), gp = prog(gi), nx = nextFrom(gi);
      return `<div class="tier ${gi.length && gp.mast === gi.length ? 'won' : ''}">
        <div class="row"><span class="tierlbl">${t}</span><div class="grow"><b>${TIER[t].n}</b><div class="tiny muted">${esc(TIER[t].ru)} · ${gi.length} ${plural(gi.length, 'вопрос', 'вопроса', 'вопросов')}</div></div><span class="tiny muted">${gp.mast}/${gi.length} на 4–5</span></div>
        ${bar(gi.length ? gp.mast / gi.length : 0, 'var(--c2)')}${pills(gi)}
        <div class="row" style="margin-top:7px">${nx ? `<button class="btn sm pri" data-a="gStart" data-g="${gid}" data-m="cont">${gp.done ? 'Продолжить' : 'Начать'}</button>` : `<button class="btn sm pri" data-a="gStart" data-g="${gid}" data-m="weak">Слабые</button>`}
          <button class="btn sm" data-a="gStart" data-g="${gid}" data-m="all">Все</button>${TG[gid].ansAll ? `<button class="btn sm ghost" data-a="ansAll" data-g="${gid}">Ответы</button>` : ''}</div></div>`;
    }).join('');
    const ready = pe.p >= 0.7;
    return `<div class="crumbs"><a href="#book">Путь</a> › ${esc(b.title)} › Глава ${ch.n}</div>
      <div class="card chaphead s-${st.state}" style="--bh:${bossKnown(ch) ? B.h : 240}">${st.state === 'gold' || st.state === 'red' ? chFx(18) : ''}<div class="ch-bg">${bossKnown(ch) ? bossArt(ch, 340, bossStateOf(st)) : bossSilhouette(340)}</div>
        <div class="row"><span class="chn lg">${ch.n}</span><div class="grow"><h1 class="chtitle">${esc(ch.name)}</h1>
          <div class="small muted">${esc(b.title)} · упражнения ${pe.done}/${pe.total} · повторение ${pr.done}/${pr.total} · экзамен ${st.exTried}/${st.ex.length}</div></div>${chBadge(st)}</div>
        <div class="row" style="margin-top:14px">${nextCh ? `<button class="btn pri" data-a="startOne" data-id="${nextCh}" data-cont="1">▶ Продолжить главу</button>` : ''}
          <button class="btn" data-a="chStart" data-ch="${ch.key}" data-m="weak">Слабые места</button>
          <button class="btn" data-a="chStart" data-ch="${ch.key}" data-m="rand">Случайные 10</button>
          <button class="btn" data-a="scrollTo" data-id="boss-${ch.key}">☠ К боссу: ${esc(bossName(ch))}</button></div>
        <div style="margin-top:16px">${topicBar(st.codes, { title: 'Темы главы' })}</div>
        <div class="grid g3" style="margin-top:12px">
          <div><div class="tiny muted">Упражнения: решено ${pe.done}/${pe.total}</div>${bar(pe.p)}</div>
          <div><div class="tiny muted">Повторение: на 4–5 ${st.revOk}/${st.revN}</div>${bar(st.revN ? st.revOk / st.revN : 0, 'var(--c2)')}</div>
          <div><div class="tiny muted">Вся глава на 4–5: ${st.allOk}/${st.total} · на 5: ${st.all5}</div>${bar(st.total ? st.allOk / st.total : 0, '#e0a100')}</div></div>
      </div>
      <div class="path">${nodes}
        <div class="node"><div class="bubble rev">Σ</div>
          <div class="nbody card">
            <div class="row"><h2 class="grow" style="margin:0">Повторение главы</h2><span class="tiny muted">на 4–5: ${st.revOk}/${st.revN}</span></div>
            <p class="small muted" style="margin:4px 0 10px">Три уровня как в книге. Чтобы победить босса, все вопросы повторения нужно решить на 4–5.</p>
            <div class="tiers">${tiers}</div>
            <div class="challenge">
              <div class="row"><div class="grow"><b>Испытание главы</b>
                <div class="small muted">6 случайных задач из повторения (3 Core, 2 Advanced, 1 Extended), таймер 45 минут. Результат в процентах и звёздах, лучший сохраняется.${ready ? '' : ' Рекомендуем после 70% упражнений главы.'}</div></div>
                <div style="text-align:right"><div class="stars lg">${best ? starStr(best.stars) : '☆☆☆'}</div><div class="tiny muted">${best ? 'рекорд ' + best.score + '%' : 'ещё не проходили'}</div></div></div>
              ${hist.length ? `<div class="tiny muted" style="margin-top:6px">Последние: ${hist.map(r => `${fmtDay(dayOf(r.t))} — ${r.score}% ${starStr(r.stars)}`).join(' · ')}</div>` : ''}
              <button class="btn" style="margin-top:10px" data-a="challenge" data-ch="${ch.key}" ${ch.revItems.length ? '' : 'disabled'}>Начать испытание</button>
            </div></div></div>
        <div class="node bossnode" id="boss-${ch.key}"><div class="bubble bossb">☠</div>${bossBlock(ch)}</div>
      </div>`;
  }
  function bossBlock(ch) {
    const st = chState(ch), B = BOSS[ch.key], s = bossStateOf(st);
    if (!bossKnown(ch)) return `<div class="bosscard unknown" style="--bh:240"><div class="boss-art">${bossSilhouette(250)}</div><div class="boss-info">
      <div class="boss-cap">босс главы ${ch.n} · скрыт</div><div class="boss-name" data-text="???">???</div>
      <div class="boss-title">Кто-то ждёт в конце этой главы. Пройдите учебник хотя бы одной темы — и узнаете, кто.</div>
      <div class="hp"><div class="hp-l"><span>HP</span><b>?</b><span>/ ?</span></div><div class="hp-bar">${'<i></i>'.repeat(14)}</div></div>
      <ul class="boss-req"><li><span>○</span><span class="grow">Пройти учебник одной темы главы, чтобы раскрыть босса</span><b>${bookTopics(ch)}/1</b></li></ul></div></div>`;
    const segs = st.ex.map(q => `<i class="${st.exState(q)}" title="${esc(qTitle(q))}${st.exState(q) === 'else' ? ' — решён в другой главе: реши здесь, чтобы нанести урон' : ''}"></i>`).join('');
    const req = [[st.ts.done === st.ts.total, 'Темы главы изучены', `${st.ts.done}/${st.ts.total}`], [st.revOk === st.revN, 'Повторение главы на 4–5', `${st.revOk}/${st.revN}`], [st.exOk === st.ex.length, 'Экзаменационные вопросы на 4–5', `${st.exOk}/${st.ex.length}`]];
    const cap = { alive: 'босс главы ' + ch.n, dead: 'повержен', gold: 'золотая глава', red: 'багровая глава' }[s];
    return `<div class="bosscard ${s}" style="--bh:${B.h}">
      <div class="boss-art">${bossArt(ch, 250, s)}</div>
      <div class="boss-info">
        <div class="boss-cap">${esc(cap)}</div>
        <div class="boss-name" data-text="${esc(B.n)}">${esc(B.n)}</div>
        <div class="boss-title">${esc(B.t)}</div>
        <div class="hp"><div class="hp-l"><span>HP</span><b>${st.hp}</b><span>/ ${st.ex.length}</span></div><div class="hp-bar">${segs}</div></div>
        <ul class="boss-req">${req.map(([ok, l, v]) => `<li class="${ok ? 'ok' : ''}"><span>${ok ? '✓' : '○'}</span><span class="grow">${l}</span><b>${v}</b></li>`).join('')}</ul>
        <div class="boss-q">${examPills(st.ex, 'ch:' + ch.key)}</div>${st.ex.some(q => st.exState(q) === 'else') ? `<div class="tiny boss-hint" style="margin-top:6px"><span class="else-key"></span> обведены вопросы, решённые в других главах — здесь они урона не наносят, их нужно решить в бою с этим боссом или в темах этой главы</div>` : ''}
        <div class="row" style="margin-top:14px"><button class="btn boss-btn" data-a="bossFight" data-ch="${ch.key}">${st.hp ? '⚔ В бой' : '⚔ Реванш'}</button>
          <span class="tiny boss-hint">${st.hp ? `ещё ${st.hp} ${plural(st.hp, 'вопрос', 'вопроса', 'вопросов')} с экзаменов не взяты на 4–5` : 'Все вопросы взяты — можно повторить для закрепления.'}</span></div>
        <div class="tiny boss-hint" style="margin-top:8px">${s === 'red' ? 'Каждая задача главы решена уверенно. Абсолют.' : s === 'gold' ? (redKnown() ? 'Все задачи главы на 4–5. Осталось сделать их все на 5 — и глава станет багровой.' : 'Все задачи главы на 4–5. Говорят, есть форма выше золота. Её видел только тот, кто не ошибался.') : st.boss ? (goldKnown() ? 'Дальше: все задачи главы на 4–5 — глава станет золотой, все на 5 — багровой.' : 'Говорят, у поверженной главы есть ещё формы. Пройди её до последней задачи — и увидишь.') : 'Победа: все темы главы изучены, всё повторение и все вопросы экзаменов по главе — на 4–5.'}</div>
      </div></div>`;
  }
  function bossPanel(s) {
    const ch = TCH[s.boss]; if (!ch) return '';
    const st = chState(ch), B = BOSS[ch.key];
    const segs = st.ex.map(q => `<i class="${st.exState(q)}"></i>`).join('');
    return `<div class="bossbar ${bossStateOf(st)}" style="--bh:${B.h}">${bossArt(ch, 70, bossStateOf(st))}<div class="grow" style="min-width:0"><div class="boss-cap">бой с боссом · глава ${ch.n}</div><b class="bb-name">${esc(B.n)}</b><div class="hp-bar sm">${segs}</div></div><div class="hpnum"><span>HP</span> ${st.hp}<small>/${st.ex.length}</small></div></div>`;
  }
  const CH_ORD = { none: 0, boss: 1, gold: 2, red: 3 };
  function chUp(ch) { showOverlay(() => chUpNow(ch), chState(ch).state); }
  function chUpNow(ch) {
    const st = chState(ch), s = bossStateOf(st), B = BOSS[ch.key];
    const el = document.createElement('div');
    el.className = 'rankup bossup ' + s;
    el.style.setProperty('--g', s === 'gold' ? '#ffc531' : s === 'red' ? '#ff2a3d' : `hsl(${B.h} 90% 60%)`);
    let sp = ''; for (let j = 0; j < 40; j++) sp += `<i style="--a:${Math.round(Math.random() * 360)}deg;--d:${Math.round(150 + Math.random() * 320)}px;--s:${(0.4 + Math.random()).toFixed(2)};animation-delay:${(Math.random() * 0.35).toFixed(2)}s"></i>`;
    const cap = { dead: 'босс повержен', gold: 'золотая глава', red: 'багровая глава' }[s] || '';
    el.innerHTML = `<div class="ru-rays"></div><div class="ru-sp">${sp}</div><div class="ru-in"><div class="ru-cap">${esc(cap)}</div>${bossArt(ch, 250, s)}<div class="ru-name">${esc(s === 'dead' ? B.n : ch.name)}</div><div class="ru-sub">${s === 'dead' ? `Глава ${ch.n}. ${esc(ch.name)} пройдена. Следующая цель — все задачи главы на 4–5.` : s === 'gold' ? 'Все задачи главы на 4–5. Глава горит золотом.' : 'Каждая задача главы — на «Уверенно». Багровый абсолют.'}</div><button class="btn pri lg">Продолжить</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', () => closeOverlay(el));
  }
  function flagsCard() {
    const ids = BOOK_ORDER.filter(id => S.flags[id]);
    if (!ids.length) return '';
    return `<div class="card" style="margin-top:12px"><h2>Отмечено «нет ответа» (${ids.length})</h2>
      <p class="small muted">Вопросы, где вы отметили, что ответа в книге нет или он не подходит. Скопируйте список и пришлите его Claude — он допишет ответы. (К ${Object.keys(SOL).length} задачам на доказательство решения уже написаны — кнопка «✍ Решение Claude».)</p>
      ${pills(ids)}
      <textarea readonly style="margin-top:8px" onclick="this.select()">${ids.map(id => bookTitle(TBY[id])).join('\n')}</textarea></div>`;
  }
  const flagBtn = id => `<button class="btn sm ghost" data-a="flag" data-id="${id}" title="Отметить, что ответа нет или он неверный">${S.flags[id] ? '⚑ Отмечено: нет ответа' : '⚐ Нет ответа?'}</button>`;
  function previewBook(id) {
    const t = TBY[id], g = TG[t.g], c = C[id];
    const tab = pvTab === 'ms' && t.ans ? 'ms' : pvTab === 'all' && g.ansAll ? 'all' : pvTab === 'cs' && SOLIDS.has(id) ? 'cs' : 'q';
    const img = tab === 'ms' ? imgTag(t.ans, t.ansSize, 'Ответ', BOOK_SCALE) : tab === 'all' ? imgTag(g.ansAll.img, g.ansAll.size, 'Все ответы', BOOK_SCALE) : imgTag(t.img, t.size, bookTitle(t), BOOK_SCALE);
    openModal(`<div class="box">
      <div class="row"><h2 class="grow" style="margin:0">${starBtn(id)} ${esc(bookTitle(t))}</h2>${stBadge(id)}<button class="btn sm ghost" data-a="closeModal">✕</button></div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:16px;margin-top:12px" id="pvgrid">
        <div>
          <div class="seg" style="margin-bottom:8px"><button class="${tab === 'q' ? 'on' : ''}" data-a="pvTab" data-v="q" data-id="${id}">Вопрос</button>${t.ans ? `<button class="${tab === 'ms' ? 'on' : ''}" data-a="pvTab" data-v="ms" data-id="${id}">Ответ</button>` : ''}${g.ansAll ? `<button class="${tab === 'all' ? 'on' : ''}" data-a="pvTab" data-v="all" data-id="${id}">Все ответы упражнения</button>` : ''}${SOLIDS.has(id) ? `<button class="${tab === 'cs' ? 'on' : ''}" data-a="pvTab" data-v="cs" data-id="${id}">✍ Решение Claude</button>` : ''}</div>
          ${tab === 'ms' && t.ansApprox ? `<div class="approx">Точное место ответа на №${t.n} не распознано — показан блок с соседними номерами.</div>` : ''}
          ${tab === 'cs' ? csolBox(id) : `<div class="paper">${img}</div>`}
        </div>
        <div>
          <button class="btn pri" style="width:100%;justify-content:center" data-a="startOne" data-id="${id}">▶ Решить сейчас</button>
          <div class="row" style="margin-top:8px"><a class="btn sm ghost" href="${bookPdf(g.book, t.page)}" target="_blank">Страница в учебнике</a><button class="btn sm ghost" data-a="go" data-v="book/${g.book}-${g.chapter}">К главе ${g.chapter}</button>${flagBtn(id)}</div>
          <div class="field"><label>Тема</label><div class="small">${g.sec ? `${esc(SEC[g.sec].n + ' ' + SEC[g.sec].name)} ${topicChip(g.sec)}` : esc(groupTitle(g))}</div></div>
          <div class="field"><label>Заметка</label><textarea id="pvNote">${esc(S.notes[id] || '')}</textarea></div>
          <div class="field"><label>История ${c ? '(' + c.n + ')' : ''}</label>
            ${c ? `<div class="hist">${c.hist.slice().reverse().map(a => `<div class="row">${confDot(a.conf)}<span>${esc(CONF[a.conf].n)}</span><span class="muted grow">${a.time ? fmtDur(a.time) : ''}</span><span class="muted">${fmtDate(a.t)}</span></div>`).join('')}</div>
              <div class="small muted" style="margin-top:6px">${c.retired ? 'Больше не показывается.' : 'Следующий показ: ' + (c.due <= today() ? 'сейчас' : fmtDay(c.due))}</div>
              <div class="row" style="margin-top:6px">${c.retired || c.due > today() ? `<button class="btn sm" data-a="dueNow" data-id="${id}">Повторить сегодня</button>` : ''}</div>` : '<div class="muted small">Ещё не решался.</div>'}
          </div>
        </div>
      </div></div>`);
    const gEl = $('#pvgrid'); if (gEl && window.innerWidth < 900) gEl.style.gridTemplateColumns = '1fr';
    const nt = $('#pvNote'); if (nt) nt.addEventListener('input', () => { if (nt.value.trim()) S.notes[id] = nt.value; else delete S.notes[id]; save(); });
  }
  function ansAllModal(gid) {
    const g = TG[gid];
    openModal(`<div class="box"><div class="row"><h2 class="grow" style="margin:0">Ответы: ${esc(groupTitle(g))}</h2><button class="btn sm ghost" data-a="closeModal">✕</button></div>
      <p class="tiny muted">${esc(TBOOK[g.book].title)}, раздел Answers.</p><div class="paper">${imgTag(g.ansAll.img, g.ansAll.size, 'Ответы', BOOK_SCALE)}</div></div>`);
  }
  function groupSession(ids, mode, title) {
    let pick;
    if (mode === 'cont') { const k = ids.findIndex(id => !C[id]); pick = (k < 0 ? [] : ids.slice(k).filter(id => !C[id])).slice(0, 10); }
    else if (mode === 'weak') pick = ids.filter(id => C[id] && C[id].lastConf <= 3).sort((a, b) => C[a].lastConf - C[b].lastConf).slice(0, 10);
    else if (mode === 'rand') pick = shuffle(ids.filter(id => status(id) !== 'retired')).slice(0, title.includes('Глава') ? 10 : 5);
    else pick = ids.slice();
    if (!pick.length && mode === 'weak') { toast('Слабых вопросов нет — отлично!'); return; }
    startSession(pick, title);
  }

  /* ================= ADAPTIVE STUDY ================= */
  // Every exercise is split into question types; each question has a difficulty 1–3 (study.js).
  // The run walks the types in book order. Inside a type it starts at the easiest question and moves
  // up after a success, down after a failure, and closes the type once the hardest level is
  // confirmed (two points: a 5 gives 2, a 4 gives 1; after any failure three points are needed).
  // Failed questions come back once at the end. State is replayed from the attempts of the topic's
  // study sessions, so an excluded or deleted session also rolls the topic back.
  const STUDY = window.TT_STUDY || {};
  let paidReady = !CLOUD; // see progressCheck
  // which exercises have a study run is public; their types and difficulties (STUDY) are loaded for Pro
  const STUDY_IDS = new Set(window.TT_STUDY_IDS || Object.keys(STUDY));
  const DOTS = d => '●'.repeat(d) + '○'.repeat(3 - d);
  function studySpec(gid) {
    const raw = STUDY[gid]; if (!raw) return null;
    return raw.map(([name, list]) => ({ name, items: list.map(([n, d]) => ({ id: `${gid}-${n}`, n, d })).filter(x => TBY[x.id]) })).filter(c => c.items.length);
  }
  function studyState(gid) {
    const spec = studySpec(gid); if (!spec) return null;
    const meta = S.study[gid] || null;
    const cls = spec.map(c => { const ds = c.items.map(x => x.d); return { name: c.name, items: c.items, minD: Math.min(...ds), maxD: Math.max(...ds), L: 2, pts: 0, need: c.items.length <= 2 ? 1 : 2, used: [], fails: 0, c3: 0, status: 'open', why: '' }; });
    const st = { gid, cls, meta, failed: {}, reviewed: {}, n: 0, time: 0 };
    if (!meta) return st;
    const pre = {};
    LIVE.forEach(a => { if (a.t < meta.t0 && TBY[a.q] && TBY[a.q].g === gid) pre[a.q] = a.conf; });
    cls.forEach(c => {
      // a new topic always starts from its easiest question of each type and climbs after each success;
      // how well other topics went says nothing about this one
      c.L = c.minD;
      // solved this type confidently before → start straight at its hardest questions
      if (c.items.some(x => pre[x.id] >= 4)) { c.L = c.maxD; if (c.maxD > c.minD) c.why = 'этот тип вы уже решали уверенно — сразу самый сложный уровень'; }
    });
    const sess = new Set(Object.values(S.sessions).filter(r => r.study === gid && !r.off).map(r => r.id));
    LIVE.filter(a => sess.has(a.sess) && a.t >= meta.t0).forEach(a => { st.n++; st.time += a.time || 0; studyApply(st, a.q, a.conf); });
    return st;
  }
  function studyPick(c, skips) {
    const free = c.items.filter(x => !c.used.includes(x.id) && !skips.includes(x.id) && status(x.id) !== 'retired');
    if (!free.length) return null;
    free.sort((a, b) => Math.abs(a.d - c.L) - Math.abs(b.d - c.L) || (a.d > c.L) - (b.d > c.L) || (C[a.id] ? 1 : 0) - (C[b.id] ? 1 : 0) || a.n - b.n);
    return free[0];
  }
  function studyApply(st, id, conf) {
    const c = st.cls.find(k => k.items.some(x => x.id === id));
    if (!c) return;
    if (c.status !== 'open') { if (st.failed[id]) st.reviewed[id] = conf; return; }
    const d = c.items.find(x => x.id === id).d;
    // "top level" = the hardest level still available, so points can be earned after the hardest questions run out
    const rest = c.items.filter(x => x.id !== id && !c.used.includes(x.id) && status(x.id) !== 'retired');
    const top = Math.max(d, ...rest.map(x => x.d));
    c.used.push(id);
    if (conf <= 2) { st.failed[id] = true; c.fails++; c.need = 3; c.pts = 0; c.c3 = 0; c.L = Math.max(c.minD, d - 1); c.why = 'не получилось — шаг назад, к задаче проще'; }
    else if (conf === 3) {
      c.c3++; c.need = Math.max(c.need, 2);
      if (d >= top) st.failed[id] = true; // a shaky answer at the top level comes back at the end
      if (c.c3 >= 2) { c.L = Math.max(c.minD, d - 1); c.c3 = 0; c.why = 'дважды частично — берём задачу проще'; } else { c.L = d; c.why = 'частично — ещё одна задача того же уровня'; }
    } else if (d >= top) { c.c3 = 0; c.pts += conf === 5 ? 2 : 1; c.L = c.maxD; c.why = c.pts >= c.need ? 'одной задачи мало — ещё одна задача этого типа для подтверждения' : 'нужно ещё одно подтверждение на самом сложном уровне'; }
    else { c.c3 = 0; c.L = conf === 5 ? c.maxD : Math.min(c.maxD, d + 1); c.why = conf === 5 ? 'уверенно — сразу к самым сложным задачам этого типа' : 'получилось — ступенью выше'; }
    if (c.pts >= c.need && conf >= 4 && c.used.length >= (c.items.length >= 3 ? 2 : 1)) c.status = 'done';
    else if (!studyPick(c, [])) c.status = c.pts > 0 || conf >= 4 ? 'done' : 'weak';
  }
  function studyNext(st) {
    if (!st || !st.meta) return null;
    const skips = st.meta.skips || [];
    for (let k = 0; k < st.cls.length; k++) {
      const c = st.cls[k];
      if (c.status !== 'open') continue;
      const it = studyPick(c, skips);
      if (it) return { id: it.id, k, c, d: it.d, why: c.used.length || c.why ? c.why : 'первая задача этого типа' };
      c.status = c.pts > 0 ? 'done' : 'weak';
    }
    const rev = Object.keys(st.failed).filter(id => !(id in st.reviewed) && !skips.includes(id));
    if (rev.length) { const k = st.cls.findIndex(c => c.items.some(x => x.id === rev[0])); return { id: rev[0], k, c: st.cls[k], d: st.cls[k].items.find(x => x.id === rev[0]).d, review: true, why: 'вторая попытка задачи, которая раньше не получилась' }; }
    return null;
  }
  function studySummary(st) {
    if (!st) return { total: 0, done: 0, weak: 0, types: 0, stillBad: [], finished: false, perfect: false };
    const total = st.cls.reduce((x, c) => x + c.items.length, 0);
    const done = st.cls.filter(c => c.status === 'done').length, weak = st.cls.filter(c => c.status === 'weak').length;
    const stillBad = Object.keys(st.failed).filter(id => (st.reviewed[id] || 0) < 4);
    const finished = !!st.meta && !studyNext(st);
    return { total, done, weak, types: st.cls.length, stillBad, finished, perfect: finished && !weak && !stillBad.length };
  }
  function studyMasteredCount() { return Object.keys(S.study).filter(g => { const st = studyState(g); return st && studySummary(st).finished; }).length; }
  function avgBookTime() { const t = LIVE.filter(a => TBY[a.q] && a.time > 0); return t.length ? t.reduce((x, a) => x + a.time, 0) / t.length : 180; }
  function studyBadge(gid) {
    const st = S.study[gid] ? studyState(gid) : null;
    if (!st) return '';
    const sm = studySummary(st);
    return sm.finished ? `<span class="chip studychip ${sm.perfect ? 'ok' : 'warn'}" title="Режим изучения">🎯 ${sm.perfect ? 'изучение пройдено' : 'пройдено, есть слабые места'}</span>` : `<span class="chip studychip">🎯 изучение: ${sm.done}/${sm.types} типов</span>`;
  }
  function studyPanel(it) {
    const s = S.session; if (!s || !s.study) return '';
    const st = studyState(s.study), nx = studyNext(st);
    if (!nx || nx.id !== it.id) return '';
    const sm = studySummary(st);
    return `<div class="studybar">
      <div class="row"><b>🎯 Режим изучения</b><span class="muted small">тип ${nx.k + 1} из ${st.cls.length}: <b>${esc(nx.c.name)}</b></span><span class="grow"></span>
        <span class="small" title="сложность задачи внутри типа">сложность ${DOTS(nx.d)}</span>
        <button class="btn sm ghost" data-a="studyHelp">как это работает?</button></div>
      <div class="studytypes">${st.cls.map((c, k) => `<span class="st-t ${c.status} ${k === nx.k ? 'cur' : ''}" title="${esc(c.name)} — ${c.status === 'done' ? 'освоен' : c.status === 'weak' ? 'задачи кончились, тип слабый' : 'в работе'}"></span>`).join('')}</div>
      <div class="tiny muted">${nx.review ? '🔁 ' : ''}${esc(nx.why || '')}${nx.review ? '' : ` · освоено типов: ${sm.done}/${sm.types} · решено ${st.n} из ${sm.total} задач темы`}</div></div>`;
  }
  function studySummaryBox(s) {
    const st = studyState(s.study); if (!st) return '';
    const sm = studySummary(st), g = TG[s.study];
    const saved = Math.max(0, sm.total - st.n);
    const mins = Math.round(saved * avgBookTime() / 60);
    return `<div class="studyres ${sm.finished ? (sm.perfect ? 'ok' : 'warn') : ''}">
      <h3 style="margin:0">${sm.finished ? (sm.perfect ? '🎯 Изучение пройдено' : '🎯 Изучение пройдено, есть слабые места') : '🎯 Изучение темы продолжается'}</h3>
      <div class="small">${esc(groupTitle(g))}: решено ${st.n} из ${sm.total} задач${saved && sm.finished ? ` — сэкономлено ${saved} ${plural(saved, 'задача', 'задачи', 'задач')} (≈${mins} мин)` : ''}.</div>
      <div class="studylist">${st.cls.map(c => `<div class="row small"><span class="st-t ${c.status}"></span><span class="grow">${esc(c.name)}</span><span class="muted">${c.used.length}/${c.items.length} задач${c.fails ? ` · ошибок: ${c.fails}` : ''}</span></div>`).join('')}</div>
      ${g.sec ? (() => { const ts = topicState(g.sec); return `<div class="row small" style="margin-top:8px">${topicChip(g.sec)}<span class="muted">учебник ${Math.round(ts.book * 100)}%${ts.exN ? ` · экзамен ${ts.good}/${ts.exN} на 4–5` : ''}</span>${ts.exN && ts.good < ts.exN ? `<button class="btn sm pri" data-a="startCode" data-code="${g.sec}">Закрепить экзаменом</button>` : ''}</div>`; })() : ''}
      ${sm.stillBad.length ? `<div class="small" style="margin-top:6px">Остались нерешёнными: ${sm.stillBad.map(id => `<a href="#" data-a="preview" data-id="${id}">№${TBY[id].n}</a>`).join(', ')} — они придут в повторение по интервалам.</div>` : ''}
      <div class="row" style="margin-top:8px">${sm.finished ? `<button class="btn sm" data-a="study" data-g="${s.study}" data-restart="1">Пройти тему заново</button>` : `<button class="btn sm pri" data-a="study" data-g="${s.study}">Продолжить изучение</button>`}</div></div>`;
  }
  function studyHelp() {
    openModal(`<div class="box narrow"><div class="row"><h2 class="grow" style="margin:0">Как работает режим изучения</h2><button class="btn sm ghost" data-a="closeModal">✕</button></div>
      <p class="small">Задачи каждого упражнения разбиты на <b>типы</b> (например, «Раскрытие скобок», «Полные квадраты») и внутри типа — на три уровня сложности ●○○ ●●○ ●●●. Похожие задачи одного типа повторяют одно и то же умение, поэтому решать их все не нужно.</p>
      <ul class="small">
        <li>Типы идут по порядку книги. Внутри типа всегда старт с самой простой задачи ●○○, дальше после каждого успеха сложнее. Если этот тип вы уже решали на 4–5 — сразу самый сложный уровень.</li>
        <li><b>5</b> — сразу к самой сложной задаче типа. <b>4</b> — ступенью выше. <b>3</b> — ещё одна задача того же уровня (после двух троек — проще). <b>1–2</b> — ступенью ниже.</li>
        <li>Тип освоен, когда на <b>самом сложном уровне</b> набрано 2 очка (5 = 2 очка, 4 = 1). Если в типе была ошибка — нужно 3 очка, то есть доказать умение ещё раз. Тип из 3+ задач никогда не закрывается одной задачей — минимум две.</li>
        <li>В конце темы задачи, которые не получились, даются ещё раз. Изучение пройдено без слабых мест, если все типы закрыты и ошибки исправлены.</li>
        <li>Пройденное изучение засчитывает тему изученной. <b>★ Пройдена полностью</b> — отдельная ступень: все задачи упражнения и все экзаменационные вопросы темы на 4–5.</li>
        <li>Если задачи типа закончились, а уверенности нет — тип помечается как слабый, его вопросы придут в повторение по интервалам.</li>
      </ul>
      <p class="small muted">Состояние темы пересчитывается из попыток: если сессию изучения не засчитать или удалить, тема откатится назад.</p></div>`);
  }

  /* ================= TOPICS & CHAPTERS ================= */
  // A topic is a textbook section. It counts as studied when its exercises are mastered: the adaptive study
  // run finished, or 60% of its questions last rated 4–5. Its exam questions are optional practice
  // (they still matter for the chapter boss).
  const TOPICS = [], TOPIC = {};
  TT.books.forEach(b => b.chapters.forEach(ch => ch.sections.forEach(s => { const t = { code: s.code, s, ch, book: b.id, groups: s.groups }; TOPICS.push(t); TOPIC[s.code] = t; })));
  const ALL_TOPICS = TOPICS.map(t => t.code);
  const CHS = TT.books.flatMap(b => b.chapters);
  const chTopics = ch => ch.sections.map(s => s.code);
  const topicExam = code => memo('tx', () => { const m = {}; Q.forEach(q => codesOf(q).forEach(c => (m[c] || (m[c] = [])).push(q))); return m; })[code] || [];
  const chExamQs = ch => memo('cx:' + ch.key, () => { const codes = chTopics(ch); return Q.filter(q => codesOf(q).some(c => codes.includes(c))); });
  function groupMastery(gid) {
    return memo('g:' + gid, () => {
      const ids = gIds(gid); if (!ids.length) return { v: 1, done: true, any: false, sm: null };
      const p = prog(ids);
      const st = S.study[gid] && STUDY[gid] ? studyState(gid) : null, sm = st ? studySummary(st) : null;
      let v = Math.min(1, p.m / 0.6);
      if (sm) v = sm.finished ? 1 : Math.max(v, 0.95 * sm.done / Math.max(1, sm.types));
      return { v, done: v >= 1, any: p.done > 0 || !!(st && st.n), sm };
    });
  }
  function topicState(code) {
    return memo('t:' + code, () => {
      const t = TOPIC[code]; if (!t) return null;
      const gs = t.groups.map(groupMastery);
      const book = gs.length ? avg(gs.map(g => g.v)) : 1, bookDone = gs.every(g => g.done);
      const ex = topicExam(code);
      const good = ex.filter(q => ctxConf(q, code) >= 4).length, tried = ex.filter(q => ctxAtt(q, code)).length;
      const exElse = ex.filter(q => elsewhere(q, ctxAtt(q, code))).length;
      // exam questions are optional practice: a topic is studied once its textbook part is mastered
      const need = 0, exam = ex.length ? good / ex.length : 1;
      // how well the topic is known (priorities, «Что подтянуть»): textbook and its exam questions equally
      const m = ex.length ? (book + exam) / 2 : book;
      const any = gs.some(g => g.any) || tried > 0;
      // fully completed: every exercise question of the topic and every exam question on it last rated 4–5
      const items = t.groups.flatMap(gIds);
      const full = bookDone && items.every(id => C[id] && C[id].lastConf >= 4) && good === ex.length;
      return { t, code, book, bookDone, exN: ex.length, good, tried, exElse, exFull: ex.length > 0 && good === ex.length, need, exam, examDone: good >= need, m, full, status: bookDone ? 'done' : any ? 'prog' : 'new' };
    });
  }
  function topicSum(codes) {
    let done = 0, full = 0, pr = 0, m = 0;
    codes.forEach(c => { const s = topicState(c); if (!s) return; if (s.status === 'done') done++; else if (s.status === 'prog') pr++; if (s.full) full++; m += s.m; });
    return { total: codes.length, done, full, prog: pr, m: codes.length ? m / codes.length : 0 };
  }
  // the topic track: gold = completed fully, green = studied, stripes = in progress
  const topicTrack = s => `<i class="f" style="width:${pct(s.full, s.total)}%"></i><i class="d" style="width:${pct(s.done - s.full, s.total)}%"></i><i class="p" style="width:${pct(s.prog, s.total)}%"></i>`;
  const topicTip = s => `изучено ${s.done} (из них полностью ${s.full}), в процессе ${s.prog}, всего ${s.total}`;
  function topicBar(codes, o = {}) {
    const s = topicSum(codes);
    return `<div class="tbar ${o.big ? 'tbig' : ''}">${o.label === false ? '' : `<div class="tbar-l"><span>${o.title || 'Темы'}</span><b><span data-count="${s.done}">${s.done}</span><span class="muted">/${s.total}</span></b><span class="muted">изучено</span>${s.full ? `<span class="tfull-n">★ полностью ${s.full}</span>` : ''}${s.prog ? `<span class="muted">в процессе ${s.prog}</span>` : ''}</div>`}
      <div class="tbar-t" title="${topicTip(s)}">${topicTrack(s)}</div></div>`;
  }
  const TST = { full: 'пройдена полностью', done: 'тема изучена', prog: 'в процессе', new: 'не начата' };
  const topicLevel = s => (s.full ? 'full' : s.status);
  function topicChip(code) {
    const s = topicState(code); if (!s) return '';
    const lv = topicLevel(s);
    return `<span class="tchip ${lv}" title="Учебник ${Math.round(s.book * 100)}%${s.exN ? ` · экзамен ${s.good}/${s.exN} на 4–5` : ''}${lv === 'done' ? ' · полностью: все задачи темы и экзамена на 4–5' : ''}">${lv === 'full' ? '★ ' : lv === 'done' ? '✓ ' : ''}${TST[lv]}</span>`;
  }
  // exam pills of a topic (ctx = its code) or of a chapter boss (ctx = 'ch:<key>'): coloured by the rating in
  // that context; solved only somewhere else = a light outline; a gold dot = passed in every topic it belongs to
  function examPills(qs, ctx) {
    const isCh = String(ctx || '').startsWith('ch:'), key = isCh ? ctx.slice(3) : null;
    return `<div class="pills">${qs.map(q => {
      const a = !ctx ? (C[q.id] || {}).last : isCh ? chAtt(q, key) : ctxAtt(q, ctx);
      const v = !a ? null : !ctx ? a.conf : isCh ? Math.min(...codesOf(q).filter(c => chOfCode(c) === key).map(c => partConf(q, a, c))) : partConf(q, a, ctx);
      const els = ctx && elsewhere(q, a), full = qFull(q), s = status(q.id);
      const tip = `${qTitle(q)}${v ? ' — ' + CONF[Math.round(v)].n : els ? ' — решён в другой теме: реши здесь, чтобы засчиталось' : ''}${full ? ' · ★ пройден во всех темах' : ''}`;
      return `<button class="pill xp ${v ? 'cf' + Math.round(v) : ''} ${els ? 'else' : ''} ${full ? 'qall' : ''} ${s === 'due' ? 'due' : ''}" data-a="preview" data-id="${q.id}" ${ctx ? `data-ctx="${ctx}"` : ''} title="${esc(tip)}">’${String(q.year).slice(2)} P${q.paper}·${q.q}</button>`; }).join('')}</div>`;
  }
  // Chapter = level with a boss at the end. Beat the boss: every topic studied and every revision and exam
  // question of the chapter last rated 4–5. Gold: every question of the chapter (exercises too) rated 4–5.
  // Crimson: every question of the chapter rated 5.
  function chState(ch) {
    return memo('ch:' + ch.key, () => {
      const codes = chTopics(ch), ts = topicSum(codes), ex = chExamQs(ch);
      const lc = id => (C[id] ? C[id].lastConf : 0);
      const exConf = q => { const a = chAtt(q, ch.key); return a ? Math.min(...codesOf(q).filter(c => codes.includes(c)).map(c => partConf(q, a, c))) : 0; };
      const exOk = ex.filter(q => exConf(q) >= 4).length, exTried = ex.filter(q => chAtt(q, ch.key)).length;
      const exState = q => (exConf(q) >= 4 ? 'hit' : chAtt(q, ch.key) ? 'tried' : C[q.id] ? 'else' : '');
      const revOk = ch.revItems.filter(id => lc(id) >= 4).length;
      const all = ch.exItems.concat(ch.revItems), total = all.length + ex.length;
      const allOk = all.filter(id => lc(id) >= 4).length + exOk;
      const all5 = all.filter(id => lc(id) >= 5).length + ex.filter(q => exConf(q) >= 5).length;
      const boss = ts.done === ts.total && revOk === ch.revItems.length && exOk === ex.length;
      const state = total && all5 === total ? 'red' : total && allOk === total ? 'gold' : boss ? 'boss' : 'none';
      return { codes, ts, ex, exOk, exTried, exState, hp: ex.length - exOk, revOk, revN: ch.revItems.length, allOk, all5, total, boss, state, exConf };
    });
  }
  const CH_STATE = { none: '', boss: 'босс повержен', gold: 'золотая глава', red: 'багровая глава' };
  const chBadge = st => (st.state === 'none' ? '' : `<span class="chbadge ${st.state}">${st.state === 'boss' ? '☠ ' : st.state === 'gold' ? '◆ ' : '✶ '}${CH_STATE[st.state]}</span>`);

  /* ================= RANKS ================= */
  // ranks only display experience (XP); they never change which questions are shown
  const RANK_TIERS = [
    { n: 'Графит', c: ['#c3c8cf', '#5c6169'], g: '#8a9099', ink: '#6b7179' },
    { n: 'Бронза', c: ['#f3c09a', '#93481f'], g: '#d0844f', ink: '#b8642f' },
    { n: 'Серебро', c: ['#ffffff', '#8f9aa6'], g: '#c9d2dc', ink: '#7f8b97' },
    { n: 'Золото', c: ['#ffeaa6', '#d49300'], g: '#ffc531', ink: '#c98a00' },
    { n: 'Платина', c: ['#e8fdff', '#4fb0c4'], g: '#7fe3f2', ink: '#2f9db3' },
    { n: 'Изумруд', c: ['#b5f9d6', '#0a8551'], g: '#2ee59d', ink: '#11a866' },
    { n: 'Алмаз', c: ['#f2f9ff', '#4a86ff'], g: '#8fc1ff', ink: '#3b7bff' },
    { n: 'Мастер', c: ['#f3d2ff', '#7417cf'], g: '#c06cff', ink: '#9b3cf0' },
    { n: 'Грандмастер', c: ['#ffbdb0', '#b80f2b'], g: '#ff4d5e', ink: '#e0283e' },
    { n: 'Легенда', c: ['#fff1ad', '#ff5f33'], g: '#ffb340', ink: '#ff7a2e' },
    { n: 'Миф', c: ['#fff7cf', '#a87a07'], g: '#ffd76a', ink: '#c99a16' },
    { n: 'Бесконечность', c: ['#ffffff', '#c9d3ff'], g: '#ffffff', ink: '#8a5cff' },
  ];
  const RANK_XP = [0, 80, 200, 380, 600, 880, 1200, 1600, 2050, 2600, 3200, 3900, 4700, 5600, 6600, 7700, 8900, 10200, 11600, 13100, 14700, 16400, 18200, 20100, 22200, 24500, 27000, 30000, 33000, 36000, 40000, 48000];
  const RANKS = RANK_XP.map((xp, i) => { const tier = i < 30 ? Math.floor(i / 3) : i === 30 ? 10 : 11; return { i, xp, tier, div: i < 30 ? i % 3 + 1 : 0, T: RANK_TIERS[tier] }; });
  const ROMAN = ['', 'I', 'II', 'III'];
  const rankName = r => r.T.n + (r.div ? ' ' + ROMAN[r.div] : '');
  function rankInfo() {
    return memo('rank', () => {
      const xp = xpTotal(); let i = 0;
      while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
      const r = RANKS[i], nx = RANKS[i + 1] || null;
      return { xp, r, nx, p: nx ? (xp - r.xp) / (nx.xp - r.xp) : 1 };
    });
  }
  let EMB = 0;
  const f2 = v => Math.round(v * 100) / 100;
  function starPath(n, R, r, rot = -90, cx = 60, cy = 60) { let d = ''; for (let j = 0; j < 2 * n; j++) { const a = (rot + j * 180 / n) * Math.PI / 180, rr = j % 2 ? r : R; d += (j ? 'L' : 'M') + f2(cx + rr * Math.cos(a)) + ',' + f2(cy + rr * Math.sin(a)); } return d + 'Z'; }
  function polyPath(n, R, rot = -90, cx = 60, cy = 60) { let d = ''; for (let j = 0; j < n; j++) { const a = (rot + j * 360 / n) * Math.PI / 180; d += (j ? 'L' : 'M') + f2(cx + R * Math.cos(a)) + ',' + f2(cy + R * Math.sin(a)); } return d + 'Z'; }
  const radial = (n, r1, r2, col, w, off = 0, op = 1) => { let s = ''; for (let j = 0; j < n; j++) { const a = (off + j * 360 / n) * Math.PI / 180; s += `<line x1="${f2(60 + r1 * Math.cos(a))}" y1="${f2(60 + r1 * Math.sin(a))}" x2="${f2(60 + r2 * Math.cos(a))}" y2="${f2(60 + r2 * Math.sin(a))}"/>`; } return `<g stroke="${col}" stroke-width="${w}" opacity="${op}">${s}</g>`; };
  const orbit = (R, rad, col, dur, rev) => `<g class="sp ${rev ? 'rk-spinr' : 'rk-spin'}" style="animation-duration:${dur}s"><circle cx="60" cy="${60 - R}" r="${rad}" fill="${col}"/></g>`;
  // rank emblem: the higher the tier, the more layers and motion
  function emblem(r, size = 64, mini = false, lock = false) {
    const k = r.tier + 1, T = r.T, id = 'em' + (++EMB), [c0, c1] = T.c, g = T.g;
    const R = k >= 11 ? 25 : 30, ri = R * 0.42;
    let defs = `<linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`;
    let back = '', mid = '', front = '';
    back += `<path d="${polyPath(6, 52)}" fill="none" stroke="${c1}" stroke-width=".9" opacity=".6"/>`;
    if (k >= 2) mid += `<g class="sp rk-spin" style="animation-duration:70s">${radial(36, 44.5, 47.5, c0, .7)}</g>`;
    if (k >= 3) mid += `<circle class="sp rk-spinr" style="animation-duration:45s" cx="60" cy="60" r="55" fill="none" stroke="${c0}" stroke-width=".7" stroke-dasharray="1.5 4"/>`;
    if (k >= 4) back += `<g class="rk-pulse">${radial(8, 33, 58, g, .7, 22.5)}</g>`;
    if (k >= 5) { back += `<path d="${polyPath(8, 50, -67.5)}" fill="none" stroke="${c0}" stroke-width=".6" opacity=".55"/>`; front += orbit(46, 2.3, g, 8); }
    if (k >= 6) { mid += `<path class="sp rk-spin" style="animation-duration:32s" d="${starPath(12, 57, 50)}" fill="none" stroke="${c0}" stroke-width=".6" opacity=".7"/>`; front += orbit(53, 1.6, c0, 11, true); }
    if (k >= 7) {
      back += `<path d="M60 13 L90 60 L60 107 L30 60Z" fill="url(#${id}a)" opacity=".2" stroke="${c0}" stroke-width=".5"/><path d="M60 13 L60 107 M30 60 L90 60" stroke="${c0}" stroke-width=".35" opacity=".5"/>`;
      if (!mini) [[22, 28, 0], [98, 34, .7], [94, 94, 1.4], [26, 90, 2.1]].forEach(([x, y, d]) => { front += `<path class="rk-tw" style="animation-delay:${d}s" d="${starPath(4, 5, 1.2, -90, x, y)}" fill="#fff"/>`; });
    }
    if (k >= 8 && !mini) { back += `<circle class="sp rk-wave" cx="60" cy="60" r="38" fill="none" stroke="${g}" stroke-width=".9"/><circle class="sp rk-wave" style="animation-delay:1.6s" cx="60" cy="60" r="38" fill="none" stroke="${g}" stroke-width=".9"/>`; front += orbit(36, 1.4, '#fff', 5) + orbit(58, 1.9, g, 14, true); }
    if (k >= 9) {
      let lv = ''; [-1, 1].forEach(sd => { for (let j = 0; j < 7; j++) { const a = (sd < 0 ? 104 + j * 21 : 76 - j * 21) * Math.PI / 180, x = 60 + 51 * Math.cos(a), y = 60 + 51 * Math.sin(a), rot = (sd < 0 ? 104 + j * 21 : 76 - j * 21) + 90; lv += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="4.6" ry="1.6" transform="rotate(${f2(rot)} ${f2(x)} ${f2(y)})" fill="${j % 2 ? c0 : c1}"/>`; } });
      back += `<g opacity=".9">${lv}</g>`;
      defs += `<linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${g}"/><stop offset="1" stop-color="${g}" stop-opacity="0"/></linearGradient>`;
      mid += `<circle class="sp rk-spin" style="animation-duration:4.5s" cx="60" cy="60" r="57.5" fill="none" stroke="url(#${id}r)" stroke-width="1.6"/>`;
    }
    if (k >= 10 && !mini) back += `<g class="sp rk-spin" style="animation-duration:55s">${radial(24, 42, 62, g, .45, 0, .8)}</g>`;
    if (k >= 11) {
      back += `<circle cx="60" cy="60" r="28" fill="#0a0a0d" stroke="${c1}" stroke-width="1.1"/>`;
      if (!mini) { let gx = ''; for (let j = 0; j < 30; j++) { const a = j * 0.62, rr = 9 + j * 1.55; gx += `<circle cx="${f2(60 + rr * Math.cos(a))}" cy="${f2(60 + rr * Math.sin(a))}" r="${f2(0.5 + (j % 3) * 0.35)}" fill="${j % 2 ? c0 : g}" opacity="${f2(0.4 + (j % 4) * 0.15)}"/>`; } mid += `<g class="sp rk-spin" style="animation-duration:22s">${gx}</g>`; }
    }
    if (k >= 12 && !mini) {
      defs += `<path id="${id}t" d="M60,60 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" fill="none"/>`;
      mid += `<g class="sp rk-spinr" style="animation-duration:26s"><text font-size="5.6" letter-spacing="2.2" fill="#fff" font-family="Unbounded,sans-serif" opacity=".85"><textPath href="#${id}t">∞ BEDAREV MATH ∞ BEDAREV MATH ∞ BEDAREV MATH ∞</textPath></text></g>`;
      back += [0, 1, 2].map(j => `<circle class="sp rk-wave" style="animation-delay:${j}s" cx="60" cy="60" r="30" fill="none" stroke="#fff" stroke-width="1.2"/>`).join('');
    }
    defs += `<clipPath id="${id}c"><path d="${starPath(5, R, ri)}"/></clipPath><linearGradient id="${id}s" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
    front += `<g class="${k >= 3 ? 'rk-breathe' : ''}"><path d="${starPath(5, R, ri)}" fill="url(#${id}a)" stroke="${k >= 11 ? c0 : 'rgba(255,255,255,.6)'}" stroke-width=".7"/><path d="${starPath(5, R * 0.6, ri * 0.6)}" fill="none" stroke="#fff" stroke-width=".55" opacity=".5"/>${k >= 3 ? `<g clip-path="url(#${id}c)"><g transform="skewX(-20)"><rect class="rk-sweep" x="10" y="20" width="20" height="90" fill="url(#${id}s)"/></g></g>` : ''}</g>`;
    if (r.div) for (let j = 0; j < r.div; j++) { const x = 60 + (j - (r.div - 1) / 2) * 9; front += `<path d="M${f2(x)},101 l3.4,3.4 -3.4,3.4 -3.4,-3.4Z" fill="${c0}" stroke="${c1}" stroke-width=".5"/>`; }
    return `<span class="embw t${k}${mini ? ' mini' : ''}${lock ? ' lock' : ''}" style="--g:${g};width:${size}px;height:${size}px"><svg class="emb" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true"><defs>${defs}</defs>${back}${mid}${front}</svg></span>`;
  }
  const rankStyle = r => `--g:${r.T.g};--ink:${r.T.ink};--c0:${r.T.c[0]};--c1x:${r.T.c[1]}`;
  function rankCard(o = {}) {
    const x = rankInfo();
    return `<a class="rcard t${x.r.tier + 1}${o.compact ? ' compact' : ''}" href="#stats" data-a="statsGo" data-v="ranks" style="${rankStyle(x.r)}">${emblem(x.r, o.size || 104)}
      <div class="grow" style="min-width:0"><div class="eyebrow">ранг</div><div class="rname">${esc(rankName(x.r))}</div>
        <div class="tiny muted"><span data-count="${x.xp}">${x.xp}</span> XP</div>
        ${x.nx ? `<div class="rbar"><i style="width:${Math.round(x.p * 100)}%"></i></div><div class="tiny muted">до «${esc(nextRankName(x))}» — ${x.nx.xp - x.xp} XP</div>` : '<div class="tiny" style="margin-top:8px">Высший ранг. Бесконечность покорена.</div>'}</div></a>`;
  }
  function rankLadder() {
    const x = rankInfo();
    return `<div class="ladder">${RANK_TIERS.map((T, ti) => { const rs = RANKS.filter(r => r.tier === ti), got = x.xp >= rs[0].xp, cur = x.r.tier === ti;
      if (!got) return `<div class="lstep lock unknown">${rankUnknown(84)}<b>???</b><div class="tiny muted">${ti === x.r.tier + 1 ? `откроется на ${rs[0].xp} XP` : 'скрыто'}</div></div>`;
      return `<div class="lstep t${ti + 1} ${got ? 'got' : 'lock'} ${cur ? 'cur' : ''}" style="${rankStyle(rs[0])}">${emblem(cur ? x.r : rs[rs.length - 1], 84, false, !got)}<b>${esc(T.n)}</b><div class="tiny muted">${rs.map(r => `${r.div ? ROMAN[r.div] + ' · ' : ''}${r.xp} XP`).join('<br>')}</div></div>`; }).join('')}</div>`;
  }
  // full-screen celebrations (rank up, boss beaten) are queued so that none is lost
  // Celebrations never interrupt a question: while a session is running they are held back, and once it
  // is finished (or nothing is running) only the most important one is shown — the rest stay in the
  // session summary and in History.
  const OVQ = [], HELD = [];
  const OV_PRI = { final: 8, seal: 7, red: 6, gold: 5, boss: 4, rank: 3, reveal: 2, lore: 1 };
  const busy = () => view === 'practice' && !!S.session && S.session.i < S.session.qids.length;
  function showOverlay(build, kind) { HELD.push({ build, kind }); clearTimeout(showOverlay.h); showOverlay.h = setTimeout(flushOverlays, 450); }
  function flushOverlays() {
    if (busy() || !HELD.length) return;
    const top = HELD.sort((a, b) => (OV_PRI[b.kind] || 0) - (OV_PRI[a.kind] || 0))[0]; HELD.length = 0;
    if (document.querySelector('.rankup')) OVQ.push(top.build); else top.build();
  }
  const closeOverlay = el => { el.classList.add('out'); setTimeout(() => { el.remove(); const nx = OVQ.shift(); if (nx) nx(); }, 400); };
  function rankUp(r) { showOverlay(() => rankUpNow(r), 'rank'); }
  function rankUpNow(r) {
    const el = document.createElement('div');
    el.className = 'rankup'; el.setAttribute('style', rankStyle(r));
    let sp = ''; for (let j = 0; j < 46; j++) sp += `<i style="--a:${Math.round(Math.random() * 360)}deg;--d:${Math.round(150 + Math.random() * 320)}px;--s:${(0.4 + Math.random()).toFixed(2)};animation-delay:${(Math.random() * 0.35).toFixed(2)}s"></i>`;
    const nx = RANKS[r.i + 1];
    el.innerHTML = `<div class="ru-rays"></div><div class="ru-sp">${sp}</div><div class="ru-in"><div class="ru-cap">новый ранг</div>${emblem(r, 230)}<div class="ru-name t${r.tier + 1}">${esc(rankName(r))}</div><div class="ru-sub">${nx ? `Следующий — «${esc(nx.tier > r.tier ? '???' : rankName(nx))}» через ${nx.xp - r.xp} XP` : 'Это вершина. Дальше — только бесконечность.'}</div><button class="btn pri lg">Продолжить</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', () => closeOverlay(el));
  }

  /* ================= BOSSES ================= */
  // one boss per chapter: the chapter's real exam questions are its hit points
  const BOSS = {
    '1-1': { n: 'Полиморф', t: 'Тысячестепенный. Носит все многочлены сразу', h: 352, m: 'poly', gl: 'x³ + x² + x + 1 · (a+b)ⁿ · ' },
    '1-2': { n: 'Дискриминатор', t: 'Судья корней. Решает, кому быть вещественным', h: 280, m: 'disc', gl: 'b² − 4ac · Δ < 0 · ' },
    '1-3': { n: 'Синусоидный Змей', t: 'Свивается в единичную окружность и не отпускает', h: 160, m: 'serpent', gl: 'sin θ · cos θ · 2π · ' },
    '1-4': { n: 'Перпендикуляр', t: 'Рассекает плоскость под прямым углом', h: 200, m: 'blades', gl: 'y − y₁ = m(x − x₁) · ⊥ · ' },
    '1-5': { n: 'Крупье Хаоса', t: 'Раздаёт исходы. Все равновероятны, кроме твоего', h: 330, m: 'dice', gl: 'nCr · nPr · P(A) · ' },
    '1-6': { n: 'Архитектор Углов', t: 'Строит треугольники из твоих сомнений', h: 40, m: 'tri', gl: '∠ABC · ≅ · ∥ · ' },
    '1-7': { n: 'Касательная Бездна', t: 'Предел, к которому ты стремишься и не дойдёшь', h: 12, m: 'tangent', gl: 'dy/dx · lim h→0 · ' },
    '1-8': { n: 'Близнецы Тождеств', t: 'Два лица одного угла', h: 300, m: 'twins', gl: 'sin 2A · cos²A − sin²A · ' },
    '1-9': { n: 'Бесконечный Ряд', t: 'Каждый шаг меньше прошлого. Конца нет', h: 190, m: 'spiral', gl: 'Sₙ · a/(1 − r) · ∞ · ' },
    '1-10': { n: 'Медиана Тьмы', t: 'Пожирает выбросы, оставляет середину', h: 95, m: 'histo', gl: 'x̄ · σ · Q₁ Q₃ · ' },
    '1-11': { n: 'Око Окружности', t: 'Видит каждую касательную', h: 210, m: 'eye', gl: '(x − h)² + (y − k)² = r² · ' },
    '1-12': { n: 'Логарифм-Пожиратель', t: 'Сворачивает показатели. Доказывает по индукции, что ты следующий', h: 140, m: 'log', gl: 'logₐx · aˣ · n → n+1 · ' },
    '2-1': { n: 'Мнимый Король', t: 'Правит осью, которой нет. Корень из минус единицы', h: 265, m: 'king', gl: 'i² = −1 · r cis θ · ' },
    '2-2': { n: 'Увеличитель', t: 'Растёт из центра гомотетии', h: 175, m: 'enlarge', gl: 'k · |OA′| = k|OA| · ' },
    '2-3': { n: 'Жнец Площадей', t: 'Собирает всё под кривой', h: 0, m: 'reaper', gl: '∫ f(x) dx · F(b) − F(a) · ' },
    '2-4': { n: 'Экстремум', t: 'Живёт там, где производная равна нулю', h: 25, m: 'peaks', gl: "f′(x) = 0 · f″(x) < 0 · " },
    '2-5': { n: 'Ростовщик', t: 'Сложный процент. Растёт быстрее, чем ты платишь', h: 48, m: 'usurer', gl: 'F = P(1 + i)ᵗ · APR · ' },
    '2-6': { n: 'Многогранник', t: 'Объём без дна', h: 220, m: 'poly3d', gl: 'V = ⅓πr²h · 4πr² · ' },
    '2-7': { n: 'Биномиальный Жнец', t: 'Каждая ветка дерева — его коготь', h: 120, m: 'tree', gl: 'ⁿCᵣ pʳ qⁿ⁻ʳ · E(X) · ' },
    '2-8': { n: 'Зеркальный', t: 'Отражается в y = x. Обратная функция тебя', h: 300, m: 'mirror', gl: 'f⁻¹(x) · f∘g · y = x · ' },
    '2-9': { n: 'Колокол', t: 'Звонит на 68–95–99.7', h: 230, m: 'bell', gl: 'z = (x − μ)/σ · N(μ, σ²) · ' },
    '2-10': { n: 'Нулевая Гипотеза', t: 'Её нельзя доказать — только отвергнуть', h: 0, m: 'null', gl: 'H₀ · p < 0.05 · ±1.96 · ' },
  };
  // creepy eyes, swaying limbs and floating embers; each chapter draws its own creature
  const bEye = (x, y, w, col, d = 0, slit = true) => `<g class="b-eye" style="animation-delay:${d}s"><path d="M${f2(x - w)},${y} Q${x},${f2(y - w * 0.62)} ${f2(x + w)},${y} Q${x},${f2(y + w * 0.62)} ${f2(x - w)},${y}Z" fill="${col}" stroke="none"/>${slit ? `<ellipse cx="${x}" cy="${y}" rx="${f2(w * 0.13)}" ry="${f2(w * 0.5)}" fill="#050507"/>` : `<circle cx="${x}" cy="${y}" r="${f2(w * 0.3)}" fill="#050507"/>`}<circle cx="${f2(x + w * 0.22)}" cy="${f2(y - w * 0.15)}" r="${f2(w * 0.09)}" fill="#fff" opacity=".8"/></g>`;
  const bSway = (x, y, d, dur = 6, delay = 0) => `<g class="b-sway" style="transform-origin:${x}px ${y}px;animation-duration:${dur}s;animation-delay:${delay}s">${d}</g>`;
  const wave = (x0, y0, x1, y1, amp, n) => { let s = `M${x0},${y0}`; const dx = (x1 - x0) / (n * 2), dy = (y1 - y0) / (n * 2); for (let j = 1; j <= n * 2; j++) s += ` Q${f2(x0 + dx * (j - 0.5) + (j % 2 ? amp : -amp) * (dy ? 1 : 0))},${f2(y0 + dy * (j - 0.5) + (j % 2 ? -amp : amp) * (dx ? 1 : 0))} ${f2(x0 + dx * j)},${f2(y0 + dy * j)}`; return s; };
  const MOTIF = {
    poly: c => `${[[-70, 0], [0, -16], [70, 0]].map(([dx, dy], j) => bSway(120 + dx, 150, `<path d="M${120 + dx * 0.4},170 Q${120 + dx * 0.8},${130 + dy} ${120 + dx},${104 + dy}"/><circle cx="${120 + dx}" cy="${88 + dy}" r="${22 - j % 2 * -4}" fill="#0b0b0e"/>${bEye(120 + dx - 8, 86 + dy, 6, c, j * 0.7)}${bEye(120 + dx + 8, 86 + dy, 6, c, j * 0.7 + 0.2)}<path d="M${120 + dx - 10},${100 + dy} q10,8 20,0" stroke-width="1"/>`, 7, j)).join('')}
      <path d="M58,60 Q30,120 58,180" stroke-width="2.4"/><path d="M182,60 Q210,120 182,180" stroke-width="2.4"/><path d="M60,196 C90,150 150,150 180,196" stroke-width="1.6"/><text x="200" y="66" font-size="14" fill="${c}" stroke="none" font-family="Unbounded">ⁿ</text>`,
    disc: c => `<path d="M60,70 Q120,250 180,70" stroke-width="2.6"/><path d="M74,78 Q120,214 166,78" stroke-width=".8" opacity=".6"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(j => { const x = 82 + j * 11; const y = 128 + Math.pow((x - 120) / 38, 2) * -28 + 34; return `<path d="M${x},${f2(y - 8)} L${x + 4},${f2(y + 6)} L${x + 8},${f2(y - 8)}" fill="#0b0b0e" stroke-width=".9"/>`; }).join('')}
      <path d="M120,26 L146,70 L94,70Z" stroke-width="1.6"/>${bEye(96, 94, 11, c, 0)}${bEye(144, 94, 11, c, 0.3)}<line x1="40" y1="180" x2="200" y2="180" opacity=".5"/><circle cx="76" cy="180" r="3" fill="${c}"/><circle cx="164" cy="180" r="3" fill="${c}"/>`,
    serpent: c => `<circle cx="120" cy="120" r="62" opacity=".35"/><line x1="58" y1="120" x2="182" y2="120" opacity=".3"/><line x1="120" y1="58" x2="120" y2="182" opacity=".3"/>
      ${bSway(120, 120, `<path d="${wave(24, 150, 190, 150, 26, 3)}" stroke-width="7" stroke-linecap="round" opacity=".9"/><path d="${wave(24, 150, 190, 150, 26, 3)}" stroke="#0b0b0e" stroke-width="2.5" stroke-dasharray="2 5"/>`, 5)}
      <path d="M186,150 Q206,128 214,138 Q222,150 200,160 Z" fill="#0b0b0e" stroke-width="1.6"/>${bEye(204, 142, 5, c, 0.4)}<path d="M214,150 l12,4 -10,2 6,6" stroke-width="1"/>`,
    blades: c => `${bSway(120, 120, `<path d="M28,200 L212,40" stroke-width="3"/><path d="M28,200 L212,40" stroke="#0b0b0e" stroke-width="1"/>`, 9)}${bSway(120, 120, `<path d="M28,40 L212,200" stroke-width="3"/>`, 11, 1)}
      ${[0, 1, 2, 3, 4, 5].map(j => `<line x1="${50 + j * 28}" y1="${f2(181 - j * 24.3)}" x2="${f2(56 + j * 28)}" y2="${f2(188 - j * 24.3)}" opacity=".7"/>`).join('')}<rect x="104" y="104" width="32" height="32" transform="rotate(45 120 120)" fill="#0b0b0e" stroke-width="1.8"/>${bEye(120, 120, 11, c, 0)}<path d="M120,96 v-14 M120,144 v14" opacity=".6"/>`,
    dice: c => `<path d="M120,48 L184,84 L184,156 L120,192 L56,156 L56,84Z" fill="#0b0b0e" stroke-width="2"/><path d="M56,84 L120,120 L184,84 M120,120 V192" stroke-width="1.2"/>
      ${bEye(120, 84, 8, c, 0, false)}${bEye(88, 128, 7, c, 0.5, false)}${bEye(96, 160, 7, c, 1, false)}${bEye(150, 130, 7, c, 0.3, false)}${bEye(166, 116, 6, c, 0.8, false)}${bEye(150, 162, 6, c, 1.3, false)}
      ${bSway(56, 120, '<path d="M56,120 C30,110 22,80 30,60 M30,60 l-8,-6 M30,60 l2,-10 M30,60 l8,-6"/>', 6)}${bSway(184, 120, '<path d="M184,120 C210,110 218,80 210,60 M210,60 l-8,-6 M210,60 l2,-10 M210,60 l8,-6"/>', 6, 1)}`,
    tri: c => `<path d="M120,34 L208,186 L32,186Z" stroke-width="2"/><path d="M120,186 L76,110 L164,110Z" stroke-width="1.2"/><path d="M98,148 L142,148 L120,110Z" opacity=".5"/><path d="M76,186 L54,148 L98,148Z" opacity=".4"/><path d="M164,186 L142,148 L186,148Z" opacity=".4"/>
      <path d="M120,74 L104,100 L136,100Z" fill="#0b0b0e"/>${bEye(120, 92, 10, c, 0)}${bSway(120, 34, '<path d="M120,34 L92,8 M120,34 L148,8" stroke-width="1.4"/><circle cx="92" cy="8" r="2" fill="currentColor"/>', 8)}<path d="M40,180 a14,14 0 0,0 10,-14" opacity=".8"/>`,
    tangent: c => `<path d="M24,170 C70,170 90,60 120,90 S170,170 216,70" stroke-width="2.6"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(j => { const x = 36 + j * 21, y = 168 - Math.sin(j / 8 * Math.PI) * 70 - (j > 4 ? (j - 4) * 10 : 0); return bSway(x, y, `<line x1="${x - 18}" y1="${f2(y + 12)}" x2="${x + 18}" y2="${f2(y - 12)}" opacity=".75"/>`, 4 + j % 3, j * 0.3); }).join('')}
      <circle cx="120" cy="92" r="20" fill="#0b0b0e" stroke-width="1.6"/>${bEye(120, 92, 12, c, 0)}<text x="160" y="40" font-size="13" fill="${c}" stroke="none" font-family="Unbounded">ε→0</text>`,
    twins: c => `<path d="M118,40 C70,44 56,96 64,140 C70,176 96,200 118,204 Z" fill="#0b0b0e" stroke-width="1.8"/><path d="M122,40 C170,44 184,96 176,140 C170,176 144,200 122,204 Z" fill="#0b0b0e" stroke-width="1.8"/>
      ${bEye(96, 104, 10, c, 0)}${bEye(144, 104, 10, c, 2.4)}<path d="M84,150 Q100,170 112,150" stroke-width="1.2"/><path d="M128,150 Q140,132 156,150" stroke-width="1.2"/><line x1="120" y1="30" x2="120" y2="214" stroke-dasharray="3 4" opacity=".6"/><path d="M70,70 l-14,-24 M170,70 l14,-24" stroke-width="1.4"/>`,
    spiral: c => { let s = '', x = 120, y = 120, r = 64, a = 0; for (let j = 0; j < 12; j++) { s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" opacity="${f2(1 - j * 0.07)}"/>`; a += 1.05; x += r * 0.35 * Math.cos(a); y += r * 0.35 * Math.sin(a); r *= 0.72; } return `<g class="b-spin">${s}</g>${bEye(120, 120, 13, c, 0)}${[0, 1, 2, 3, 4].map(j => bSway(120, 120, `<path d="M120,120 ${wave(120, 120, 120 + 100 * Math.cos(j * 1.26), 120 + 100 * Math.sin(j * 1.26), 6, 3).slice(9)}" opacity=".45"/>`, 7 + j, j)).join('')}`; },
    histo: c => `<path d="M30,60 Q120,20 210,60 L210,90 L30,90Z" fill="#0b0b0e" stroke-width="1.6"/>${[18, 30, 42, 52, 46, 34, 22].map((h, j) => `<path d="M${42 + j * 23},90 l11.5,${h} l11.5,-${h}" fill="#0b0b0e" stroke-width="1.2"/>`).join('')}
      <path d="M30,200 Q120,220 210,200 L210,170 L30,170Z" fill="#0b0b0e" stroke-width="1.6"/>${[14, 24, 36, 40, 32, 20, 12].map((h, j) => `<path d="M${42 + j * 23},170 l11.5,-${h} l11.5,${h}" fill="#0b0b0e" stroke-width="1.2"/>`).join('')}
      ${bEye(84, 46, 9, c, 0)}${bEye(156, 46, 9, c, 0.4)}<line x1="120" y1="96" x2="120" y2="166" stroke-dasharray="2 3" opacity=".7"/>`,
    eye: c => `${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(j => { const a = j * 30 * Math.PI / 180; return bSway(120 + 60 * Math.cos(a), 120 + 60 * Math.sin(a), `<line x1="${f2(120 + 60 * Math.cos(a) - 40 * Math.sin(a))}" y1="${f2(120 + 60 * Math.sin(a) + 40 * Math.cos(a))}" x2="${f2(120 + 60 * Math.cos(a) + 40 * Math.sin(a))}" y2="${f2(120 + 60 * Math.sin(a) - 40 * Math.cos(a))}" opacity=".55"/>`, 6 + j % 4, j * 0.2); }).join('')}
      <circle cx="120" cy="120" r="60" fill="#0b0b0e" stroke-width="2.4"/>${bEye(120, 120, 44, c, 0)}<circle cx="120" cy="120" r="72" opacity=".4" stroke-dasharray="1 4"/>`,
    log: c => `${[0, 1, 2, 3].map(j => bSway(120, 130, `<path d="M120,130 C${120 + (j - 1.5) * 40},${150 + j * 4} ${120 + (j - 1.5) * 70},${190} ${120 + (j - 1.5) * 50},${226}" stroke-width="2"/>`, 5 + j, j * 0.5)).join('')}
      <path d="M40,190 C44,100 70,70 120,62 C170,70 196,100 200,190" stroke-width="1"/><path d="M76,120 C76,84 164,84 164,120 C164,150 76,150 76,120Z" fill="#0b0b0e" stroke-width="2"/>${bEye(102, 112, 9, c, 0)}${bEye(138, 112, 9, c, 0.6)}
      ${[0, 1, 2, 3, 4, 5].map(j => `<path d="M${92 + j * 10},132 l5,10 l5,-10" fill="#0b0b0e" stroke-width=".8"/>`).join('')}<path d="M206,40 V200 M224,40 V200" opacity=".6"/>${[0, 1, 2, 3, 4, 5, 6].map(j => `<line x1="206" x2="224" y1="${50 + j * 22}" y2="${50 + j * 22}" opacity=".6"/>`).join('')}`,
    king: c => `<path d="M76,74 L84,40 L102,62 L120,30 L138,62 L156,40 L164,74Z" fill="#0b0b0e" stroke-width="1.8"/><circle cx="120" cy="30" r="3" fill="${c}"/><ellipse cx="120" cy="124" rx="48" ry="56" fill="#0b0b0e" stroke-width="1.4" opacity=".85"/>
      <ellipse cx="120" cy="124" rx="48" ry="56" stroke-dasharray="3 6" class="b-spin" opacity=".6"/>${bEye(100, 112, 10, c, 0)}${bEye(140, 112, 10, c, 0.2)}<path d="M96,150 Q120,166 144,150" stroke-width="1.2"/>
      <g class="b-spin">${[0, 1, 2, 3].map(j => `<path d="M${f2(120 + 86 * Math.cos(j * Math.PI / 2))},${f2(124 + 86 * Math.sin(j * Math.PI / 2))} a86,86 0 0,1 ${f2(-86 * Math.cos(j * Math.PI / 2) + 86 * Math.cos((j + 1) * Math.PI / 2))},${f2(-86 * Math.sin(j * Math.PI / 2) + 86 * Math.sin((j + 1) * Math.PI / 2))}" opacity=".5" stroke-dasharray="4 4"/>`).join('')}</g><text x="194" y="60" font-size="18" fill="${c}" stroke="none" font-family="Unbounded" font-style="italic">i</text>`,
    enlarge: c => `${[1, 0.78, 0.56, 0.34].map((k, j) => `<path d="M${f2(120)},${f2(120 - 92 * k)} L${f2(120 + 80 * k)},${f2(120 + 50 * k)} L${f2(120 - 80 * k)},${f2(120 + 50 * k)}Z" opacity="${f2(1 - j * 0.18)}" ${j === 3 ? 'fill="#0b0b0e"' : ''} stroke-width="${f2(2 - j * 0.35)}"/>`).join('')}
      ${[[120, 28], [200, 170], [40, 170]].map(([x, y]) => `<line x1="120" y1="120" x2="${x}" y2="${y}" stroke-dasharray="2 4" opacity=".7"/>`).join('')}${bEye(120, 116, 12, c, 0)}<circle cx="120" cy="120" r="2" fill="${c}"/>`,
    reaper: c => `<path d="M150,30 C110,28 104,70 116,118 C128,166 122,206 84,210" stroke-width="4" stroke-linecap="round"/><path d="M150,30 C176,30 196,48 200,70 C176,54 160,52 150,30" fill="#0b0b0e" stroke-width="1.6"/>
      <path d="M30,190 C70,120 110,170 150,120 L150,190Z" fill="${c}" opacity=".16" stroke="none"/><path d="M30,190 C70,120 110,170 150,120" opacity=".7"/>${[0, 1, 2, 3, 4, 5].map(j => `<line x1="${44 + j * 20}" y1="190" x2="${44 + j * 20}" y2="${f2(170 - Math.sin(j / 5 * Math.PI) * 18 - j * 4)}" opacity=".35"/>`).join('')}
      <circle cx="126" cy="80" r="16" fill="#0b0b0e" stroke-width="1.4"/>${bEye(126, 80, 10, c, 0)}`,
    peaks: c => `<path d="M14,200 L60,90 L92,150 L130,46 L168,140 L196,100 L226,200Z" fill="#0b0b0e" stroke-width="2"/><path d="M60,90 L72,118 M130,46 L146,92 M196,100 L206,128" opacity=".6"/>
      ${bEye(60, 104, 8, c, 0)}${bEye(130, 66, 10, c, 0.5)}${bEye(196, 114, 7, c, 1)}<line x1="40" y1="90" x2="80" y2="90" opacity=".8"/><line x1="110" y1="46" x2="150" y2="46" opacity=".8"/><line x1="72" y1="150" x2="112" y2="150" opacity=".8"/><line x1="148" y1="140" x2="188" y2="140" opacity=".8"/>`,
    usurer: c => { let s = '', a = 0, r = 14; for (let j = 0; j < 9; j++) { const x = 120 + (12 + j * 9) * Math.cos(a), y = 120 + (12 + j * 9) * Math.sin(a); s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#0b0b0e" stroke-width="1.2"/><text x="${f2(x)}" y="${f2(y + r * 0.35)}" font-size="${f2(r)}" text-anchor="middle" fill="${c}" stroke="none" font-family="Unbounded">€</text>`; a += 0.9; r *= 1.12; } return `<g class="b-spin">${s}</g><circle cx="120" cy="120" r="20" fill="#0b0b0e" stroke-width="2"/>${bEye(120, 120, 12, c, 0)}${bSway(120, 40, '<path d="M120,40 V14 M120,40 c-14,0 -14,14 0,14" stroke-width="1.6"/>', 6)}`; },
    poly3d: c => `<g class="b-spin">${polyPath(6, 80, -90, 120, 120).replace(/^/, '<path d="').replace(/$/, '" stroke-width="1.8"/>')}<path d="M120,40 L120,120 L189,160 M120,120 L51,160" stroke-width="1.2"/><path d="M51,80 L120,120 M189,80 L120,120" opacity=".5" stroke-dasharray="3 3"/><path d="${polyPath(3, 46, -90, 120, 120)}" opacity=".6"/></g>
      ${bEye(96, 104, 8, c, 0)}${bEye(144, 104, 8, c, 0.4)}${bEye(120, 150, 8, c, 0.8)}`,
    tree: c => { const br = (x, y, a, l, d) => { if (!d) return bEye(x, y, 4.5, c, d + x % 3 * 0.3); const x1 = x + l * Math.cos(a), y1 = y + l * Math.sin(a), x2 = x + l * Math.cos(a + (d > 1 ? 0.55 : 0.4)), y2 = y + l * Math.sin(a + (d > 1 ? 0.55 : 0.4)); return `<line x1="${f2(x)}" y1="${f2(y)}" x2="${f2(x1)}" y2="${f2(y1)}"/><line x1="${f2(x)}" y1="${f2(y)}" x2="${f2(x2)}" y2="${f2(y2)}"/>${br(x1, y1, a - 0.35, l * 0.7, d - 1)}${br(x2, y2, a + 0.55, l * 0.7, d - 1)}`; };
      return `${bSway(30, 120, `<g stroke-width="1.4">${br(30, 120, -0.55, 62, 3)}</g>`, 8)}<circle cx="30" cy="120" r="14" fill="#0b0b0e" stroke-width="2"/>${bEye(30, 120, 9, c, 0)}<text x="150" y="214" font-size="11" fill="${c}" stroke="none" font-family="Unbounded" opacity=".8">p q p q</text>`; },
    mirror: c => `<line x1="30" y1="210" x2="210" y2="30" stroke-dasharray="4 4" stroke-width="1.2"/><path d="M40,200 C60,120 90,90 200,80" stroke-width="2.4"/><path d="M40,200 C120,190 150,160 160,40" stroke-width="2.4" opacity=".7"/>
      ${bSway(120, 120, '<path d="M120,120 C90,80 60,70 30,74 C60,90 70,110 120,120" fill="#0b0b0e"/><path d="M120,120 C160,150 170,180 166,210 C150,180 130,170 120,120" fill="#0b0b0e"/>', 5)}<circle cx="120" cy="120" r="18" fill="#0b0b0e" stroke-width="1.8"/>${bEye(120, 120, 11, c, 0)}`,
    bell: c => `<path d="M30,196 C80,196 92,48 120,48 C148,48 160,196 210,196" fill="#0b0b0e" stroke-width="2.4"/>${[-2, -1, 0, 1, 2].map(k => `<line x1="${120 + k * 26}" y1="196" x2="${120 + k * 26}" y2="${f2(196 - 148 * Math.exp(-k * k / 2))}" opacity="${k ? 0.45 : 0.8}" stroke-dasharray="2 3"/>`).join('')}
      ${bSway(120, 150, `<line x1="120" y1="150" x2="120" y2="214" stroke-width="1.6"/><circle cx="120" cy="218" r="9" fill="#0b0b0e" stroke-width="1.6"/>${bEye(120, 218, 6, c, 0.6, false)}`, 3.5)}${bEye(106, 100, 8, c, 0)}${bEye(134, 100, 8, c, 0.3)}<path d="M120,48 v-20 M110,28 h20" stroke-width="1.6"/>`,
    null: c => `<path d="M72,40 Q120,22 168,40 Q186,120 168,180 Q120,214 72,180 Q54,120 72,40Z" fill="#0b0b0e" stroke-width="2"/><path d="M50,60 L38,60 L38,180 L50,180 M190,60 L202,60 L202,180 L190,180" stroke-width="2.4"/>
      ${bEye(120, 104, 22, c, 0)}<path d="M92,160 L148,160" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6].map(j => `<line x1="${96 + j * 8}" y1="156" x2="${96 + j * 8}" y2="164"/>`).join('')}<text x="104" y="62" font-size="14" fill="${c}" stroke="none" font-family="Unbounded">H₀</text>`,
  };
  function bossArt(ch, size = 220, state = 'alive') {
    const B = BOSS[ch.key] || BOSS['1-1'], id = 'bs' + (++EMB), h = B.h, mini = size < 100;
    const col = state === 'gold' ? '#ffcf4d' : state === 'red' ? '#ff2a3d' : `hsl(${h} 92% 62%)`, deep = state === 'gold' ? '#6b4a00' : state === 'red' ? '#4a0008' : `hsl(${h} 85% 18%)`;
    let em = ''; if (!mini) for (let j = 0; j < 9; j++) em += `<circle class="b-ember" cx="${30 + (j * 83) % 180}" cy="${200 + (j * 37) % 30}" r="${1 + (j % 3) * 0.6}" fill="${col}" style="animation-delay:${(j * 0.7) % 5}s;animation-duration:${4 + j % 4}s"/>`;
    const glyphs = B.gl.repeat(4);
    return `<svg class="boss-svg ${state}" viewBox="0 0 240 240" width="${size}" height="${size}" aria-hidden="true" style="color:${col}">
      <defs><radialGradient id="${id}h"><stop offset="0" stop-color="${col}" stop-opacity=".42"/><stop offset=".5" stop-color="${deep}" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <path id="${id}c" d="M120,120 m-108,0 a108,108 0 1,1 216,0 a108,108 0 1,1 -216,0"/>
        <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="120" cy="120" r="119" fill="url(#${id}h)" class="b-halo"/>
      <g class="b-ring"><text font-size="8.5" letter-spacing="2.6" fill="${col}" opacity=".5" font-family="Unbounded,monospace"><textPath href="#${id}c">${esc(glyphs)}</textPath></text></g>
      <circle cx="120" cy="120" r="98" fill="none" stroke="${col}" stroke-width=".6" stroke-dasharray="1 5" opacity=".55" class="b-ring2"/>
      <g class="b-body" ${mini ? '' : `filter="url(#${id}g)"`} stroke="${col}" fill="none" stroke-width="1.3" stroke-linejoin="round">${MOTIF[B.m](col)}</g>${em}
      ${state === 'dead' ? '<g class="b-slash"><path d="M40,40 L200,200" stroke="#ff2a3d" stroke-width="5" stroke-linecap="round"/><path d="M200,40 L40,200" stroke="#ff2a3d" stroke-width="5" stroke-linecap="round" opacity=".85"/></g>' : ''}
    </svg>`;
  }
  const bossStateOf = st => (st.state === 'none' ? 'alive' : st.state === 'boss' ? 'dead' : st.state);

  /* ================= UI FX ================= */
  const motionOff = () => S.settings.motion === 'reduced' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function countUp(root) {
    if (motionOff()) return;
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0); if (!(to > 0)) return;
      const t0 = performance.now(), D = 900;
      const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
      el.textContent = (0).toFixed(dec); requestAnimationFrame(step);
    });
  }
  function burst(x, y, n = 16, color) {
    if (motionOff()) return;
    const w = document.createElement('div'); w.className = 'burst'; w.style.left = x + 'px'; w.style.top = y + 'px';
    for (let j = 0; j < n; j++) { const s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); s.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg'); if (color) s.style.background = color; w.appendChild(s); }
    document.body.appendChild(w); setTimeout(() => w.remove(), 950);
  }
  const ring = (p, size = 34, color = 'var(--accent)', w = 3.2) => { const r = 18 - w / 2, L = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 36 36" width="${size}" height="${size}"><circle cx="18" cy="18" r="${f2(r)}" fill="none" stroke="var(--panel2)" stroke-width="${w}"/><circle class="ring-v" cx="18" cy="18" r="${f2(r)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${f2(Math.max(0, Math.min(1, p)) * L)} ${f2(L)}" transform="rotate(-90 18 18)"/></svg>`; };
  function heroDeco() {
    let sine = ''; for (let x = 0; x <= 360; x += 6) sine += (x ? 'L' : 'M') + (20 + x) + ',' + f2(200 - 70 * Math.sin(x / 360 * 4 * Math.PI) * Math.exp(-x / 520));
    let tk = ''; for (let j = 0; j < 72; j++) { const a = j * 5 * Math.PI / 180, r1 = j % 6 ? 128 : 121; tk += `<line x1="${f2(200 + r1 * Math.cos(a))}" y1="${f2(200 + r1 * Math.sin(a))}" x2="${f2(200 + 132 * Math.cos(a))}" y2="${f2(200 + 132 * Math.sin(a))}"/>`; }
    return `<svg class="deco" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".6"><circle class="dk-spin" cx="200" cy="200" r="170" stroke-dasharray="1 7"/><g class="dk-spinr">${tk}</g><circle cx="200" cy="200" r="92" opacity=".7"/><circle cx="200" cy="200" r="52" opacity=".5"/><path d="M10 200H390M200 10V390" opacity=".5"/></g>
      <path class="dk-draw" d="${sine}" fill="none" stroke="var(--accent)" stroke-width="1.6" pathLength="1"/><circle r="3.5" fill="var(--accent)"><animateMotion dur="7s" repeatCount="indefinite" path="${sine}"/></circle><text x="206" y="24" class="dk-t">y</text><text x="378" y="194" class="dk-t">x</text></svg>`;
  }
  const GEAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  const L = (ru, en) => (EN() ? en : ru);
  // secrets: a chapter's boss stays hidden until one of its topics is studied; higher rank tiers and the
  // chapter forms above "boss beaten" stay unnamed until someone reaches them
  // a boss shows itself once the textbook part of any one topic of its chapter is done (exam questions not needed)
  const bookTopics = ch => chTopics(ch).filter(c => topicState(c).bookDone).length;
  const bossKnown = ch => { const st = chState(ch); return st.ts.done > 0 || st.state !== 'none' || bookTopics(ch) > 0; };
  const bossName = ch => (bossKnown(ch) ? BOSS[ch.key].n : '???');
  const goldKnown = () => CHS.some(c => ['gold', 'red'].includes(chState(c).state));
  const redKnown = () => CHS.some(c => chState(c).state === 'red');
  function bossSilhouette(size = 220) {
    const id = 'bq' + (++EMB);
    return `<svg class="boss-svg hidden-boss" viewBox="0 0 240 240" width="${size}" height="${size}" aria-hidden="true">
      <defs><path id="${id}c" d="M120,120 m-104,0 a104,104 0 1,1 208,0 a104,104 0 1,1 -208,0"/></defs>
      <g class="b-ring"><text font-size="9" letter-spacing="5" fill="currentColor" opacity=".35" font-family="Unbounded,monospace"><textPath href="#${id}c">${'? · '.repeat(22)}</textPath></text></g>
      <circle cx="120" cy="120" r="72" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 6" opacity=".45" class="b-ring2"/>
      <text x="120" y="150" text-anchor="middle" font-size="80" font-weight="800" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55" font-family="Unbounded,sans-serif">?</text>
    </svg>`;
  }
  function rankUnknown(size = 64) {
    return `<span class="embw lock unknown" style="width:${size}px;height:${size}px"><svg class="emb" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true"><path d="${polyPath(6, 52)}" fill="#0c0c10" stroke="#3a3a46" stroke-width="1"/><path d="${polyPath(6, 40)}" fill="none" stroke="#2a2a33" stroke-dasharray="2 4"/><text x="60" y="76" text-anchor="middle" font-size="46" font-weight="800" fill="#2a2a33" font-family="Unbounded,sans-serif">?</text></svg></span>`;
  }
  const nextRankName = x => (!x.nx ? '' : x.nx.tier > x.r.tier ? '???' : rankName(x.nx));
  function bossReveal(ch) {
    showOverlay(() => {
      const B = BOSS[ch.key], el = document.createElement('div');
      el.className = 'rankup bossup reveal'; el.style.setProperty('--g', `hsl(${B.h} 90% 60%)`);
      el.innerHTML = `<div class="ru-rays"></div><div class="ru-in"><div class="ru-cap">босс раскрыт · глава ${ch.n}</div>${bossArt(ch, 250, 'alive')}<div class="ru-name">${esc(B.n)}</div><div class="ru-sub">${esc(B.t)}</div><button class="btn boss-btn lg">Принять вызов</button></div>`;
      document.body.appendChild(el); el.addEventListener('click', () => closeOverlay(el));
    }, 'reveal');
  }

  /* ================= PROGRESS LOG ================= */
  // Every render compares the current progress with the last snapshot; anything new becomes a dated
  // event (history page) and, for the big ones, a full-screen celebration. The first run rebuilds the past
  // day by day from the attempts.
  function snapNow() {
    const s = { r: rankInfo().r.i, ch: {}, rv: {}, tp: {}, f: finalOpen() ? 1 : 0 };
    CHS.forEach(ch => { s.ch[ch.key] = CH_ORD[chState(ch).state]; if (bossKnown(ch)) s.rv[ch.key] = 1; });
    TOPICS.forEach(t => { const x = topicState(t.code); if (x.status === 'done') s.tp[t.code] = x.full ? 2 : 1; });
    return s;
  }
  function snapDiff(old, now, t) {
    const ev = [];
    TOPICS.forEach(x => { const a = old.tp[x.code] || 0, b = now.tp[x.code] || 0; if (b && !a) ev.push({ t, k: 'topic', code: x.code }); if (b === 2 && a < 2) ev.push({ t, k: 'tfull', code: x.code }); });
    CHS.forEach(ch => {
      const k = ch.key, a = old.ch[k] || 0, b = now.ch[k] || 0;
      if (now.rv[k] && !old.rv[k]) ev.push({ t, k: 'reveal', ch: k });
      for (let v = a + 1; v <= b; v++) ev.push({ t, k: ['', 'boss', 'gold', 'red'][v], ch: k });
    });
    for (let i = (old.r || 0) + 1; i <= now.r; i++) ev.push({ t, k: 'rank', r: i });
    if (now.f && !old.f) ev.push({ t, k: 'final' });
    return ev;
  }
  function backfillHistory() {
    S.events = (S.events || []).filter(e => e.k === 'lore' || e.k === 'seal');
    const att = S.attempts.filter(a => (QBY[a.q] || TBY[a.q]) && !sessOff(a.sess)).sort((a, b) => a.t - b.t);
    if (!att.length) return;
    let prev = { r: 0, ch: {}, rv: {}, tp: {} };
    [...new Set(att.map(a => dayOf(a.t)))].sort((a, b) => a - b).forEach(d => {
      const end = dateOfDay(d + 1).getTime();
      rebuild(end);
      const now = snapNow(), last = att.filter(a => a.t < end).pop();
      S.events.push(...snapDiff(prev, now, last ? last.t : end - 1));
      prev = now;
    });
    rebuild();
  }
  function progressCheck() {
    // on the site the study data arrives a moment after the page: checking before that would record
    // studied topics as lost and then as newly studied again (with rank-ups)
    if (!paidReady) return;
    if (!S.snap) { backfillHistory(); S.snap = snapNow(); save(); return; }
    const now = snapNow(), old = S.snap;
    if (JSON.stringify(now) === JSON.stringify(old)) return;
    const ev = snapDiff(old, now, Date.now());
    S.events = (S.events || []).concat(ev);
    S.snap = now; save();
    const up = new Set();
    ev.forEach(e => {
      if (e.k === 'reveal') bossReveal(TCH[e.ch]);
      if (['boss', 'gold', 'red'].includes(e.k) && !up.has(e.ch)) { up.add(e.ch); chUp(TCH[e.ch]); }
    });
    if (now.r > old.r && hasPlan('pro')) rankUp(RANKS[now.r]);
    if (ev.some(e => e.k === 'final')) showOverlay(() => finalOverlay('open'), 'final');
  }
  // what a finished session brought: a quiet list on its summary instead of a pile of pop-ups
  function sessEvents(s) {
    const ev = (S.events || []).filter(e => e.t >= s.started && (hasPlan('pro') || !['rank', 'ach'].includes(e.k)));
    if (!ev.length) return '';
    const seen = new Set(), rows = ev.filter(e => { const k = e.k + (e.ch || e.code || e.r || e.n); if (seen.has(k)) return false; seen.add(k); return true; });
    return `<div class="sessev"><div class="sessev-h">за эту сессию</div>${rows.map(evLine).join('')}</div>`;
  }

  /* ================= HISTORY ================= */
  let histMode = 'all';
  const EV_META = { topic: ['✓', 'Тема изучена'], tfull: ['★', 'Тема пройдена полностью'], reveal: ['◉', 'Босс раскрыт'], boss: ['☠', 'Босс повержен'], gold: ['◆', 'Золотая глава'], red: ['✶', 'Багровая глава'], rank: ['★', 'Новый ранг'], ach: ['⬡', 'Достижение'], lore: ['◬', 'Найдена записка'], final: ['✶', 'Финал открыт'], seal: ['⛓', 'Печать'] };
  function histEvents() {
    const ev = (S.events || []).slice();
    Object.entries(S.ach || {}).forEach(([id, rec]) => { if (ACH.some(x => x.id === id) && rec.t) Object.entries(rec.t).forEach(([tier, t]) => ev.push({ k: 'ach', t, a: id, tier: +tier })); });
    return ev;
  }
  function evLine(e) {
    const [ic, lbl] = EV_META[e.k] || ['·', ''];
    let body = '', art = '';
    if (e.k === 'topic' || e.k === 'tfull') { const t = TOPIC[e.code]; body = t ? `${esc(t.s.n)} ${esc(t.s.name)} <span class="muted">· глава ${t.ch.n}</span>` : esc(e.code); }
    else if (['reveal', 'boss', 'gold', 'red'].includes(e.k)) { const ch = TCH[e.ch]; if (ch) { body = e.k === 'reveal' || e.k === 'boss' ? `${esc(BOSS[ch.key].n)} <span class="muted">· глава ${ch.n}. ${esc(ch.name)}</span>` : `${ch.n}. ${esc(ch.name)}`; art = `<span class="ev-art">${bossArt(ch, 46, e.k === 'reveal' ? 'alive' : e.k === 'boss' ? 'dead' : e.k)}</span>`; } }
    else if (e.k === 'rank') { const r = RANKS[e.r]; if (r) { body = esc(rankName(r)); art = `<span class="ev-art rk">${emblem(r, 40, true)}</span>`; } }
    else if (e.k === 'lore') body = `<a href="#archive">${e.n} / 22</a>`;
    else if (e.k === 'final' || e.k === 'seal') { body = `<a href="#book/final" data-notr>${L('Экзаменатор', 'The Examiner')}</a>${e.k === 'seal' ? ` <span class="muted">· ${L('до полуночи', 'until midnight')}</span>` : ''}`; art = `<span class="ev-art">${examinerArt(46, e.k === 'seal' ? 'sealed' : 'awake')}</span>`; }
    else if (e.k === 'ach') { const a = ACH.find(x => x.id === e.a); body = a ? `${a.g} ${esc(a.name)} <span class="muted">· ${TIER_NAMES[e.tier - 1] || ''}</span>` : ''; }
    return `<div class="ev ev-${e.k}">${art || `<span class="ev-ic">${ic}</span>`}<div class="grow" style="min-width:0"><div class="ev-l">${lbl}</div><div class="ev-b">${body}</div></div><span class="ev-t">${new Date(e.t).toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' })}</span></div>`;
  }
  const distMini = at => `<div class="dist mini">${[1, 2, 3, 4, 5].map(v => { const n = at.filter(a => a.conf === v).length; return n ? `<i class="cf${v}" style="flex:${n}" title="${esc(CONF[v].n)}: ${n}"></i>` : ''; }).join('')}</div>`;
  VIEWS.history = () => {
    const ev = histEvents(), byDay = {};
    const slot = d => byDay[d] || (byDay[d] = { at: [], ev: [] });
    LIVE.forEach(a => slot(dayOf(a.t)).at.push(a));
    ev.forEach(e => slot(dayOf(e.t)).ev.push(e));
    let days = Object.keys(byDay).map(Number).sort((a, b) => b - a);
    const practiced = days.filter(d => byDay[d].at.length).length;
    if (histMode === 'mile') days = days.filter(d => byDay[d].ev.length);
    const cnt = k => ev.filter(e => e.k === k).length;
    const head = `<div class="pagehead"><div><div class="eyebrow">хроника</div><h1>История</h1></div><div class="seg">${[['all', 'Все дни'], ['mile', 'Только вехи']].map(([k, l]) => `<button class="${histMode === k ? 'on' : ''}" data-a="histMode" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="hsum">${[[LIVE.length ? dateOfDay(dayOf(LIVE[0].t)).toLocaleDateString(LOC(), { day: 'numeric', month: 'short', year: 'numeric' }) : '—', 'первый день'], [practiced, 'дней с занятиями'], [LIVE.length, 'решений'], [cnt('topic'), 'тем изучено'], [cnt('reveal'), 'боссов раскрыто'], [cnt('boss'), 'боссов повержено'], [cnt('rank'), 'новых рангов']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
    if (!days.length) return head + '<div class="card empty">История пуста. Решите первую задачу — и здесь появится первая запись.</div>';
    let lastMonth = '';
    return head + `<div class="timeline">${days.map(d => {
      const x = byDay[d], at = x.at, bk = at.filter(a => TBY[a.q]).length, exn = at.length - bk, tm = at.reduce((s, a) => s + (a.time || 0), 0), ac = avg(at.map(a => a.conf));
      const sess = [...new Set(at.map(a => a.sess))].map(id => S.sessions[id]).filter(Boolean);
      const dt = dateOfDay(d), mon = dt.toLocaleDateString(LOC(), { month: 'long', year: 'numeric' });
      const sep = mon !== lastMonth ? `<div class="hmonth">${esc(mon)}</div>` : ''; lastMonth = mon;
      return `${sep}<div class="hday ${x.ev.length ? 'has-ev' : ''}"><div class="hdate"><b>${dt.getDate()}</b><small>${esc(dt.toLocaleDateString(LOC(), { weekday: 'short' }))}</small></div>
        <div class="hbody">${at.length ? `<div class="hstat"><b>${at.length}</b> ${plural(at.length, 'задача', 'задачи', 'задач')}<span>учебник ${bk} · экзамены ${exn}${tm ? ' · ' + fmtDur(tm) : ''}${ac != null ? ' · ср. уверенность ' + ac.toFixed(1) : ''}</span></div>${distMini(at)}` : ''}
          ${x.ev.length ? `<div class="evs">${x.ev.sort((a, b) => a.t - b.t).map(evLine).join('')}</div>` : ''}
          ${sess.length ? `<div class="hsess">${sess.map(r => `<span class="chip">${esc(r.title)}</span>`).join('')}</div>` : ''}</div></div>`;
    }).join('')}</div>`;
  };

  /* ================= COUNTDOWN ================= */
  function examDate() {
    const v = S.settings.examDate;
    if (v) { const d = new Date(v + 'T09:00:00'); if (!isNaN(d)) return d; }
    const n = new Date(), y = n.getMonth() >= 6 ? n.getFullYear() + 1 : n.getFullYear();
    return new Date(y, 5, 1, 9, 0, 0);
  }
  // the day preparation started: set in Settings, otherwise the first day anything was solved (or today)
  function startDay() {
    const v = S.settings.startDate;
    if (v) { const d = new Date(v + 'T12:00:00'); if (!isNaN(d)) return Math.min(dayOf(d.getTime()), today()); }
    return LIVE.length ? Math.min(dayOf(LIVE[0].t), today()) : today();
  }
  const isoDay = d => { const x = dateOfDay(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const clockText = ms => { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return `<b>${d}</b><small>${L('д', 'd')}</small><b>${String(h).padStart(2, '0')}</b><small>:</small><b>${String(m).padStart(2, '0')}</b><small>:</small><b>${String(x).padStart(2, '0')}</b>`; };
  VIEWS.doom = () => {
    // pace is measured from the day preparation started, not from 1 September; the calendar still shows the school year
    const ex = examDate(), st0 = new Date(ex.getFullYear() - 1, 8, 1);
    const dS = startDay(), dE = dayOf(ex.getTime()), td = today();
    const total = Math.max(1, dE - dS), passed = Math.max(0, Math.min(total, td - dS)), left = Math.max(0, dE - td);
    const active = new Set(LIVE.map(a => dayOf(a.t)).filter(d => d >= dS && d <= td));
    const wasted = Math.max(0, passed - [...active].filter(d => d < td).length);
    const ts = topicSum(ALL_TOPICS), remainT = ts.total - ts.done;
    const span = td - dS + 1; // days of preparation so far, today included
    const rate = ts.done / span, need = left ? remainT / left : Infinity;
    const proj = Math.min(ts.total, Math.floor(ts.done + rate * left));
    const finish = rate > 0 ? new Date(Date.now() + Math.ceil(remainT / rate) * DAY) : null;
    const bk = prog(BOOK_ORDER), exDone = Q.filter(q => C[q.id]).length;
    const remainTasks = (bk.total - bk.done) + (Q.length - exDone);
    const timed = LIVE.filter(a => a.time > 0), avgMin = timed.length ? timed.reduce((x, a) => x + a.time, 0) / 60 / timed.length : 3;
    const hours = remainTasks * 0.55 * avgMin / 60;
    const todayN = LIVE.filter(a => dayOf(a.t) === td).length;
    const lost = Math.round(wasted * ts.total / total);
    const fmtD = dt => dt.toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' });
    // full sentences per language: the phrase dictionary would give clumsy English word order here
    const verdict = !ts.done ? L(`Ни одной изученной темы за ${span} ${plural(span, 'день', 'дня', 'дней')} подготовки. При таком темпе к экзамену будет 0 из ${ts.total}.`, `Not a single topic studied in ${span} days of preparation. At this pace you will walk into the exam with 0 of ${ts.total}.`)
      : proj < ts.total ? L(`При текущем темпе к ${fmtD(ex)} будет изучено ${proj} из ${ts.total} тем (${pct(proj, ts.total)}%). ${ts.total - proj} ${plural(ts.total - proj, 'тему', 'темы', 'тем')} ты увидишь впервые прямо на экзамене.`, `At this pace, by ${fmtD(ex)} you will have studied ${proj} of ${ts.total} topics (${pct(proj, ts.total)}%). ${ts.total - proj} topics you will see for the first time in the exam itself.`)
      : L(`При текущем темпе финиш ≈ ${fmtD(finish)} — успеваешь, но только если не остановишься.`, `At this pace you finish ≈ ${fmtD(finish)} — you'll make it, but only if you don't stop.`);
    let cal = '';
    for (let m = 0; m < 10; m++) {
      const md = new Date(st0.getFullYear(), 8 + m, 1), dim = new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate();
      let cells = '';
      for (let k = 1; k <= 31; k++) {
        if (k > dim) { cells += '<i class="na"></i>'; continue; }
        const d = dayOf(new Date(md.getFullYear(), md.getMonth(), k, 12).getTime());
        const cls = d > dE ? 'na' : d === td ? (active.has(d) ? 'now ok' : 'now') : d > td ? 'f' : d < dS ? 'pre' : active.has(d) ? 'ok' : 'x';
        cells += `<i class="${cls}" title="${fmtDay(d)}"></i>`;
      }
      cal += `<div class="dc-row"><span>${esc(md.toLocaleDateString(LOC(), { month: 'short' }))}</span><div class="dc-cells">${cells}</div></div>`;
    }
    const weeks = []; for (let w = dS; w <= dE; w += 7) weeks.push(w > td ? -1 : LIVE.filter(a => { const d = dayOf(a.t); return d >= w && d < w + 7; }).length);
    const needWeek = left ? Math.round(remainTasks * 0.55 / (left / 7)) : 0, wmax = Math.max(needWeek, ...weeks, 1);
    const cell = (cls, label, big, sub) => `<div class="dcell ${cls}"><div class="dl">${label}</div><div class="db">${big}</div><div class="ds">${sub}</div></div>`;
    return `<div class="doom">
      <div class="doom-head"><div class="eyebrow">отсчёт</div><div class="doom-title" data-text="До экзамена">До экзамена</div>
        <div class="doom-clock" id="doomClock">${clockText(ex - Date.now())}</div>
        <div class="doom-sub">${esc(fmtD(ex))} · Leaving Certificate · Mathematics Higher Level</div>
        <div class="dy"><div class="dy-bar"><i style="width:${pct(passed, total)}%"></i></div><div class="dy-l"><span>${esc(fmtDay(dS))} · старт</span><b>прошло ${pct(passed, total)}% подготовки</b><span>${esc(ex.toLocaleDateString(LOC(), { day: 'numeric', month: 'short' }))}</span></div></div></div>
      <div class="dgrid">
        ${cell('red', 'дней впустую', `<span data-count="${wasted}">${wasted}</span>`, `из ${passed} прошедших — ${pct(wasted, passed)}%. Это ≈${lost} ${plural(lost, 'тема', 'темы', 'тем')}, которые уже могли быть изучены.`)}
        ${cell('', 'осталось дней', `<span data-count="${left}">${left}</span>`, `≈ ${Math.round(left / 7)} ${plural(Math.round(left / 7), 'неделя', 'недели', 'недель')}. Каждый день — ${(100 / total).toFixed(2)}% подготовки.`)}
        ${cell('', 'изучено тем', `${ts.done}<small>/${ts.total}</small>`, `${ts.full ? `★ полностью ${ts.full} · ` : ''}нужно ${isFinite(need) ? need.toFixed(2) : '∞'} темы в день, чтобы успеть`)}
        ${cell(rate >= need ? 'ok' : 'red', 'твой темп', rate.toFixed(2), `тем в день с ${esc(fmtDay(dS))}${rate < need ? ` — ${rate ? (need / rate).toFixed(1) : '∞'}× медленнее, чем нужно` : ''}`)}
        ${cell(proj < ts.total ? 'red' : 'ok', 'прогноз к экзамену', `${proj}<small>/${ts.total}</small>`, proj < ts.total ? `${ts.total - proj} ${plural(ts.total - proj, 'тема', 'темы', 'тем')} останутся неизученными` : 'успеваешь')}
        ${cell(todayN ? '' : 'red', 'сегодня', `<span>${todayN}</span>`, todayN ? `${plural(todayN, 'задача', 'задачи', 'задач')}. Мало не бывает.` : 'Ноль. Часы идут.')}
        ${cell('', 'осталось работы', `≈${Math.round(hours)}<small>ч</small>`, `≈ ${left ? (hours / left).toFixed(1) : '∞'} ч в день · ${remainTasks} задач не тронуто`)}
        ${cell('', 'экзаменационные вопросы', `${exDone}<small>/${Q.length}</small>`, `${Q.length - exDone} настоящих вопросов с экзаменов ты ещё не видел`)}
      </div>
      <div class="dverdict">${verdict}</div>
      <div class="dcal"><div class="dc-h"><b>Учебный год</b><span><i class="pre"></i>до старта <i class="ok"></i>занимался <i class="x"></i>пусто <i class="f"></i>впереди</span></div>${cal}</div>
      <div class="dweeks"><div class="dc-h"><b>Задачи по неделям</b><span>пунктир — сколько нужно в неделю, чтобы успеть: ${needWeek}</span></div>
        <div class="dw">${weeks.map((n, j) => (n < 0 ? '<i class="fu"></i>' : `<i style="height:${Math.max(2, Math.round(100 * n / wmax))}%" class="${n >= needWeek ? 'ok' : ''}" title="неделя ${j + 1}: ${n}"></i>`)).join('')}<span class="dw-need" style="bottom:${Math.round(100 * needWeek / wmax)}%"></span></div></div>
      <div class="dcta"><div class="dq">${['Экзамен не перенесут.', 'Пустой день остаётся пустым навсегда.', 'Тебя никто не спасёт, кроме тебя.', 'Завтра ты будешь жалеть, что не начал сегодня.'][td % 4]}</div>
        <button class="btn boss-btn lg" data-a="doomGo">Хватит. Начать сейчас</button></div>
    </div>`;
  };
  setInterval(() => { if (view === 'doom') { const c = $('#doomClock'); if (c) c.innerHTML = clockText(examDate() - Date.now()); } }, 1000);

  /* ================= LORE ================= */
  // 22 notes, read in order. They only start once a few bosses are beaten, and each one needs a total
  // (bosses beaten, gold chapters, crimson chapters, seals) — never a particular chapter — so the order of
  // study does not matter. At most one note per finished session; nothing is random. The story leads to the
  // final boss. The archive is the «Лор» button on the Path.
  const LORE_START = 3;
  // when each note turns up (the texts are MAX content: app/lore.js locally, Supabase lore_notes on the site)
  const LORE = [
    { n: 1, w: 'b', k: 3 },
    { n: 2, w: 'b', k: 4 },
    { n: 3, w: 'b', k: 5 },
    { n: 4, w: 'b', k: 6 },
    { n: 5, w: 'b', k: 8 },
    { n: 6, w: 'b', k: 10 },
    { n: 7, w: 'b', k: 11 },
    { n: 8, w: 'b', k: 13 },
    { n: 9, w: 'b', k: 15 },
    { n: 10, w: 'b', k: 17 },
    { n: 11, w: 'b', k: 20 },
    { n: 12, w: 'b', k: 22 },
    { n: 13, w: 'g', k: 1 },
    { n: 14, w: 'g', k: 5 },
    { n: 15, w: 'g', k: 11 },
    { n: 16, w: 'g', k: 22 },
    { n: 17, w: 'r', k: 1 },
    { n: 18, w: 'r', k: 4 },
    { n: 19, w: 'r', k: 8 },
    { n: 20, w: 'r', k: 14 },
    { n: 21, w: 'r', k: 22 },
    { n: 22, w: 'seals', k: 1 },
  ];
  // what each note waits for, said plainly (no names of forms the player has not reached yet)
  const loreNeedText = (z, x) => {
    const { k, w } = z, have = x[w];
    return {
      b: L(`после ${k} ${plural(k, 'поверженного босса', 'поверженных боссов', 'поверженных боссов')} · сейчас ${have}`, `after ${k} defeated ${k === 1 ? 'boss' : 'bosses'} · now ${have}`),
      g: L(`когда ${k} ${plural(k, 'глава', 'главы', 'глав')} целиком на 4–5 · сейчас ${have}`, `when ${k} ${k === 1 ? 'chapter is' : 'chapters are'} entirely at 4–5 · now ${have}`),
      r: L(`когда ${k} ${plural(k, 'глава', 'главы', 'глав')} целиком на 5 · сейчас ${have}`, `when ${k} ${k === 1 ? 'chapter is' : 'chapters are'} entirely at 5 · now ${have}`),
      seals: L('после первой печати финального босса', 'after the first seal of the final boss'),
    }[w];
  };
  function loreStats() {
    const sts = CHS.map(chState);
    return { b: sts.filter(x => x.state !== 'none').length, g: sts.filter(x => x.state === 'gold' || x.state === 'red').length, r: sts.filter(x => x.state === 'red').length, seals: finalSeals().length };
  }
  // v2: the notes were rewritten; notes found under the old rules are dropped
  const loreOf = () => {
    if (!S.lore || S.lore.v !== 2) { S.lore = { v: 2, found: {} }; S.events = (S.events || []).filter(e => e.k !== 'lore'); }
    return S.lore;
  };
  const loreCount = () => Object.keys(loreOf().found).length;
  const loreNext = () => LORE.find(x => !loreOf().found[x.n]) || null;
  function loreFound(n) {
    const L0 = loreOf(); if (L0.found[n]) return false;
    const t = Date.now(); L0.found[n] = t;
    (S.events || (S.events = [])).push({ t, k: 'lore', n }); save();
    showOverlay(() => {
      const note = LORE.find(x => x.n === n), el = document.createElement('div');
      el.className = 'rankup lorebox'; el.setAttribute('data-notr', '');
      el.innerHTML = `<div class="lore-in"><div class="lore-cap">◬ ${L('записка', 'note')} ${n} / 22</div><div class="lore-paper">${(loreText(n) || '…').split('\n').map((l, i) => `<p style="animation-delay:${(0.3 + i * 0.32).toFixed(2)}s">${esc(l) || '&nbsp;'}</p>`).join('')}</div><div class="lore-foot">${L('все записки — кнопка «Лор» на Пути', 'all notes — the «Lore» button on the Path')}</div></div>`;
      document.body.appendChild(el); el.addEventListener('click', () => closeOverlay(el));
    }, 'lore');
    return true;
  }
  // once per finished, counted session: the next note in order, if its milestone is reached
  function loreCheck(s) {
    if (!hasPlan('max') || !S.attempts.some(a => a.sess === s.id) || sessOff(s.id)) return false;
    const nx = loreNext(); if (!nx) return false;
    const x = loreStats();
    return x.b >= LORE_START && x[nx.w] >= nx.k ? loreFound(nx.n) : false;
  }
  const LORE_DB = {};
  const loreText = n => { const t = (window.LORE_TEXT || {})[n] || LORE_DB[n]; return t ? (EN() ? t.en : t.ru) : null; };
  const loreBtn = () => `<a class="btn ghost lorebtn" href="#archive" data-notr>◬ ${L('Лор', 'Lore')} <span class="muted">${loreCount()}/22</span></a>`;
  VIEWS.archive = () => {
    const f = loreOf().found, n = loreCount(), x = loreStats(), nx = loreNext();
    const head = `<div class="crumbs"><a href="#book">${L('Путь', 'Path')}</a> › ${L('Лор', 'Lore')}</div><div class="pagehead"><div><div class="eyebrow">◬ ${L('лор', 'lore')}</div><h1>${L('Записки', 'Notes')}</h1>
      <div class="small muted" style="max-width:640px">${L(`Найдено ${n} из 22. Записки идут по порядку: каждая появляется в конце сессии, когда достигнута её веха. Неважно, в каком порядке вы проходите главы. Некоторые зашифрованы.`, `${n} of 22 found. The notes come in order: each one turns up at the end of a session once its milestone is reached. The order of chapters does not matter. Some are enciphered.`)}</div></div></div>`;
    const ready = nx && x.b >= LORE_START && x[nx.w] >= nx.k;
    const next = nx ? `<div class="card lore-next ${ready ? 'ready' : ''}"><b>${L('Следующая', 'Next')} · ${nx.n}/22</b><span class="muted small">${ready ? L('Веха уже достигнута — записка появится в конце следующей сессии.', 'Milestone reached — the note turns up at the end of your next session.') : x.b < LORE_START ? L(`Записки начнутся после ${LORE_START} поверженных боссов · сейчас ${x.b}`, `Notes begin after ${LORE_START} defeated bosses · now ${x.b}`) : esc(loreNeedText(nx, x))}</span></div>` : '';
    const got = LORE.filter(z => f[z.n]), rest = LORE.filter(z => !f[z.n]);
    if (!hasPlan('max')) return `<div class="archive" data-notr>${head}${lockBox('max', L('Записки лора', 'The lore notes'))}</div>`;
    return `<div class="archive" data-notr>${head}${next}
      ${got.length ? `<div class="notes">${got.map(z => `<div class="note"><div class="note-h"><b>${z.n}</b><span>${fmtDate(f[z.n])}</span></div><div class="note-t">${(loreText(z.n) || L('Загрузка…', 'Loading…')).split('\n').map(l => `<p>${esc(l) || '&nbsp;'}</p>`).join('')}</div></div>`).join('')}</div>` : ''}
      ${rest.length ? `<div class="nlocked"><div class="eyebrow">${L('ещё не найдены', 'not found yet')} · ${rest.length}</div><div class="nl-tiles">${rest.map(z => `<span class="nl ${nx && z.n === nx.n ? 'next' : ''}" title="${L('записка', 'note')} ${z.n}">${z.n}</span>`).join('')}</div></div>` : ''}</div>`;
  };

  /* ================= FINAL BOSS ================= */
  // Opens once every chapter is crimson. He cannot be beaten, only sealed until midnight: a fight of 3 real
  // exam questions and 5 of the hardest textbook questions (difficulty ●●● or Extended revision) seals him if
  // at least 6 of the 8 are rated 4–5. The next day he is awake again. The day's set follows from the date,
  // so reloading never rerolls it; only a new fight after a lost one gets a new set.
  const FIN = { ex: 3, bk: 5, need: 6 };
  const finalOf = () => S.final || (S.final = { seals: {}, tries: {} });
  // once open, it stays open: the fights themselves bring chapters back below crimson
  const finalOpen = () => { const F = finalOf(); if (!F.opened && memo('fo', () => CHS.every(ch => chState(ch).state === 'red'))) F.opened = Date.now(); return !!F.opened; };
  const finalSeals = () => Object.keys(finalOf().seals).map(Number).sort((a, b) => a - b);
  const finalSealed = () => !!finalOf().seals[today()];
  const finalState = () => (!finalOpen() ? 'locked' : finalSealed() ? 'sealed' : 'awake');
  function finalStreak() { const s = new Set(finalSeals()); let d = s.has(today()) ? today() : today() - 1, n = 0; while (s.has(d)) { n++; d--; } return n; }
  function finalBest() { let best = 0, run = 0, prev = null; finalSeals().forEach(d => { run = prev != null && d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }); return best; }
  const msToMidnight = () => Math.max(0, dateOfDay(today() + 1).getTime() - Date.now());
  const redCount = () => CHS.filter(ch => chState(ch).state === 'red').length;
  const hardPool = () => memo('hard', () => {
    const ids = new Set();
    Object.keys(STUDY).forEach(gid => STUDY[gid].forEach(([, list]) => list.forEach(([n, d]) => { if (d === 3 && TBY[`${gid}-${n}`]) ids.add(`${gid}-${n}`); })));
    CHS.forEach(ch => { if (ch.rev.C) gIds(ch.rev.C).forEach(id => ids.add(id)); });
    return [...ids];
  });
  // small seeded generator (mulberry32): the same day and try always give the same fight
  const seeded = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pickN = (arr, n, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  function finalSet() {
    const d = today(), r = seeded(d * 7919 + (finalOf().tries[d] || 0) * 104729 + 13);
    const ex = pickN(Q.map(q => q.id), FIN.ex, r), bk = pickN(hardPool(), FIN.bk, r);
    return [bk[0], ex[0], bk[1], bk[2], ex[1], bk[3], ex[2], bk[4]].filter(Boolean);
  }
  function finalHits(s) { const last = {}; S.attempts.filter(a => a.sess === s.id).forEach(a => { last[a.q] = a.conf; }); return Object.values(last).filter(v => v >= 4).length; }
  // after a finished fight: seal him for today if it went well enough
  function finalCheck(s) {
    if (!s.final || s.finalDone) return; s.finalDone = 1; s.finalHits = finalHits(s);
    const F = finalOf();
    if (s.finalHits >= FIN.need && !F.seals[today()] && !sessOff(s.id)) {
      const t = Date.now(); F.seals[today()] = t; s.sealedNow = 1;
      (S.events || (S.events = [])).push({ t, k: 'seal' });
      showOverlay(() => finalOverlay('sealed'), 'seal');
    }
    save();
  }

  // The Examiner: a clock-eyed colossus with twelve exam papers for wings (2015–2026), a ring of the
  // 22 chapters he keeps in chains, and his table of red and green days for a mouth.
  function examinerArt(size = 420, state = 'awake') {
    const id = 'fx' + (++EMB), c = 200, lock = state === 'locked', seal = state === 'sealed';
    const col = lock ? '#5a5a66' : seal ? '#ffcf4d' : '#ff2a3d', hot = lock ? '#6c6c7a' : seal ? '#fff3c4' : '#ffd0d5';
    const P = (a, r) => [f2(c + r * Math.cos(a * Math.PI / 180)), f2(c + r * Math.sin(a * Math.PI / 180))];
    // wings: one blade per exam year, fanned above the eye
    // (outside the rings, so they reach past the frame; small icons skip them)
    let wings = '', robe = '';
    if (size >= 140) {
      for (let j = 0; j < 12; j++) {
        const a = 188 + j * (164 / 11), long = 236 + (j === 5 || j === 6 ? 22 : j % 2 ? 0 : 10), [x0, y0] = P(a - 4.2, 150), [x1, y1] = P(a, long), [x2, y2] = P(a + 4.2, 150), [xm, ym] = P(a, 204);
        wings += `<path d="M${x0},${y0} L${x1},${y1} L${x2},${y2} Z" fill="url(#${id}w)" stroke="${col}" stroke-width="1" opacity="${f2(0.7 + (j % 3) * 0.1)}"/>`;
        if (!lock) wings += `<text x="${xm}" y="${ym}" font-size="8" fill="${hot}" opacity=".85" text-anchor="middle" font-family="Unbounded,monospace" transform="rotate(${f2(a + 90)} ${xm} ${ym})">${2015 + j}</text>`;
      }
      // lower fan: shorter, darker blades like a torn robe
      for (let j = 0; j < 9; j++) { const a = 38 + j * 13, [x0, y0] = P(a - 4, 150), [x1, y1] = P(a, 200 + (j % 3) * 16), [x2, y2] = P(a + 4, 150); robe += `<path d="M${x0},${y0} L${x1},${y1} L${x2},${y2} Z" fill="#0a0204" stroke="${col}" stroke-width=".8" opacity=".8"/>`; }
    }
    let ticks = '';
    for (let j = 0; j < 60; j++) { const a = j * 6, big = j % 5 === 0, [x0, y0] = P(a, big ? 146 : 151), [x1, y1] = P(a, 158); ticks += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="${big ? 1.6 : 0.7}" opacity="${big ? 0.9 : 0.5}"/>`; }
    // the 22 chapters, chained to him
    let sig = '';
    for (let j = 0; j < 22; j++) {
      const a = (j + 0.5) * (360 / 22) - 90, [x, y] = P(a, 128), [xi, yi] = P(a, 74);
      sig += `<line x1="${xi}" y1="${yi}" x2="${x}" y2="${y}" stroke="${col}" stroke-width=".7" stroke-dasharray="2 3" opacity=".45"/><circle cx="${x}" cy="${y}" r="7.5" fill="#0b0204" stroke="${seal ? '#ffcf4d' : col}" stroke-width="1"/>${lock || size < 140 ? '' : `<text x="${x}" y="${f2(+y + 2.6)}" font-size="7" text-anchor="middle" fill="${hot}" font-family="Unbounded">${j < 12 ? j + 1 : j - 11}</text>`}`;
    }
    // his table: the days, red and green, as a mouth
    let table = '';
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) { const on = (r * 5 + k * 3) % 7 < 3; table += `<rect x="${163 + k * 8.4}" y="${262 + r * 8.4}" width="6.4" height="6.4" rx="1" fill="${lock ? '#2a2a33' : on ? '#2bd47d' : col}" opacity="${lock ? 0.6 : on ? 0.75 : 0.85}"/>`; }
    let embers = '';
    if (!lock) for (let j = 0; j < 16; j++) embers += `<circle class="f-ember" cx="${60 + (j * 97) % 280}" cy="${330 + (j * 41) % 50}" r="${f2(1 + (j % 3) * 0.7)}" fill="${seal ? '#ffcf4d' : '#ff5a68'}" style="animation-delay:${f2((j * 0.61) % 6)}s;animation-duration:${f2(5 + j % 5)}s"/>`;
    const glyphs = '2015 · 2016 · 2017 · 2018 · 2019 · 2020 · 2021 · 2022 · 2023 · 2024 · 2025 · 2026 · PAPER 1 · PAPER 2 · MARKING SCHEME · ';
    const eye = seal || lock
      ? `<path d="M118,200 Q200,236 282,200" fill="none" stroke="${col}" stroke-width="2.6"/>${[0, 1, 2, 3, 4, 5, 6].map(k => { const x = 140 + k * 20, y = 200 + Math.sin((k + 0.5) / 7 * Math.PI) * 17; return `<line x1="${x}" y1="${f2(y)}" x2="${x + (k - 3) * 2}" y2="${f2(y + 11)}" stroke="${col}" stroke-width="1.2" opacity=".8"/>`; }).join('')}`
      : `<g class="f-eye"><path d="M112,200 Q200,128 288,200 Q200,272 112,200Z" fill="#050103" stroke="${col}" stroke-width="2.6"/>
          <circle cx="200" cy="200" r="44" fill="url(#${id}i)"/>
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => { const [x0, y0] = P(k * 30, 36), [x1, y1] = P(k * 30, 42); return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#fff" stroke-width="${k % 3 ? 0.8 : 1.8}" opacity=".85"/>`; }).join('')}
          <ellipse cx="200" cy="200" rx="7" ry="30" fill="#050103"/>
          <line x1="200" y1="200" x2="200" y2="176" stroke="#fff" stroke-width="2.2" stroke-linecap="round" transform="rotate(150 200 200)"/>
          <g class="f-sec"><line x1="200" y1="206" x2="200" y2="160" stroke="#fff" stroke-width="1" stroke-linecap="round"/><circle cx="200" cy="200" r="2.4" fill="#fff"/></g>
          <circle cx="215" cy="184" r="4" fill="#fff" opacity=".85"/></g>`;
    const lashes = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => { const t = (k + 0.5) / 9, x = 112 + t * 176, y = 200 - Math.sin(t * Math.PI) * 36; return `<line x1="${f2(x)}" y1="${f2(y)}" x2="${f2(x + (t - 0.5) * 30)}" y2="${f2(y - 16 - Math.sin(t * Math.PI) * 10)}" stroke="${col}" stroke-width="1.4" opacity=".85"/>`; }).join('');
    // crown: score bars rising to 100
    const crown = [14, 26, 40, 58, 40, 26, 14].map((h, k) => `<rect x="${170 + k * 9}" y="${f2(140 - h)}" width="4.5" height="${h}" fill="${col}" opacity="${f2(0.45 + h / 120)}"/>`).join('') + `<text x="200" y="${lock ? 76 : 74}" font-size="9" text-anchor="middle" fill="${hot}" font-family="Unbounded" letter-spacing="3">${lock ? '???' : '100'}</text>`;
    const sealMark = seal ? `<g class="f-seal"><circle cx="200" cy="200" r="104" fill="none" stroke="#ffcf4d" stroke-width="2"/><circle cx="200" cy="200" r="96" fill="none" stroke="#ffcf4d" stroke-width=".7" stroke-dasharray="1 4"/><path d="${starPath(11, 96, 46, -90, 200, 200)}" fill="none" stroke="#ffcf4d" stroke-width="1.1" opacity=".8"/>
        <path d="M70,70 L330,330 M330,70 L70,330" stroke="#ffcf4d" stroke-width="5" stroke-dasharray="14 6" opacity=".8"/></g>` : '';
    return `<svg class="ex-svg ${state}" viewBox="0 0 400 400" width="${size}" height="${size}" aria-hidden="true">
      <defs><radialGradient id="${id}h"><stop offset="0" stop-color="${col}" stop-opacity="${lock ? 0.12 : 0.5}"/><stop offset=".45" stop-color="${lock ? '#1a1a20' : seal ? '#4a3300' : '#3a0009'}" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}w" cx="200" cy="200" r="250" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="${col}" stop-opacity=".5"/><stop offset="1" stop-color="${col}" stop-opacity=".04"/></radialGradient>
        <radialGradient id="${id}i"><stop offset="0" stop-color="${hot}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="#2a0006"/></radialGradient>
        <path id="${id}c" d="M200,200 m-176,0 a176,176 0 1,1 352,0 a176,176 0 1,1 -352,0"/>
        <filter id="${id}g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="200" cy="200" r="199" fill="url(#${id}h)" class="f-halo"/>
      <g class="f-wings">${wings}</g><g class="f-robe">${robe}</g>
      ${lock || size < 140 ? '' : `<g class="f-r1"><text font-size="9" letter-spacing="3" fill="${col}" opacity=".6" font-family="Unbounded,monospace"><textPath href="#${id}c">${glyphs}</textPath></text></g>`}
      <g class="f-ticks">${ticks}</g>
      <circle cx="200" cy="200" r="166" fill="none" stroke="${col}" stroke-width=".6" stroke-dasharray="1 6" opacity=".6" class="f-r2"/>
      <g class="f-sig">${sig}</g>
      <circle cx="200" cy="200" r="74" fill="#050103" stroke="${col}" stroke-width="1.2" opacity=".9"/>
      <g class="f-body" ${lock || size < 140 ? '' : `filter="url(#${id}g)"`}>${crown}${lashes}${table}</g>${eye}
      ${lock ? `<text x="200" y="226" font-size="84" font-weight="800" text-anchor="middle" fill="none" stroke="${col}" stroke-width="1.4" opacity=".6" font-family="Unbounded,sans-serif">?</text>` : ''}
      ${sealMark}${embers}
    </svg>`;
  }
  function finalStats() {
    const seals = finalSeals();
    return `<div class="fstats">${[[seals.length, L('печатей', 'seals')], [finalStreak(), L('дней подряд', 'days in a row')], [finalBest(), L('лучшая серия', 'best streak')]].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
  }
  const midnightChip = () => `<span class="fchip" data-notr>${L('до полуночи', 'until midnight')} <b data-midnight>${fmtClock(msToMidnight())}</b></span>`;
  // the card at the end of the Path, after both books
  function finalCard() {
    const st = finalState(), red = redCount();
    if (st === 'locked') return `<a class="fcard locked" href="#book/final"><div class="fc-art">${examinerArt(380, 'locked')}</div>
      <div class="fc-in"><div class="fc-cap">${L('финал · за последней страницей', 'finale · behind the last page')}</div><div class="fc-name">???</div>
        <div class="fc-sub">${L('Откроется, когда все задачи всех 22 глав будут на 5.', 'Opens when every question of all 22 chapters is at 5.')}</div>
        <div class="fc-prog"><span>${L('глав целиком на 5', 'chapters entirely at 5')}<b>${red}/${CHS.length}</b></span><div class="cc-line"><i style="width:${pct(red, CHS.length)}%"></i></div></div></div></a>`;
    return `<a class="fcard ${st}" href="#book/final">${st === 'awake' ? '<div class="fc-scan"></div>' : ''}<div class="fc-art">${examinerArt(520, st)}</div>
      <div class="fc-in"><div class="fc-cap">${st === 'sealed' ? L('финал · запечатан', 'finale · sealed') : L('финал · пробуждён', 'finale · awake')}</div>
        <div class="fc-name" data-text="${esc(L('Экзаменатор', 'The Examiner'))}" data-notr>${L('Экзаменатор', 'The Examiner')}</div>
        <div class="fc-sub">${st === 'sealed' ? L('Печать держится до полуночи. Завтра он проснётся снова.', 'The seal holds until midnight. Tomorrow he wakes again.') : L('Его нельзя победить. Можно только запечатать — до полуночи.', 'He cannot be defeated. Only sealed — until midnight.')}</div>
        ${finalStats()}
        <div class="row" style="margin-top:14px">${st === 'awake' ? `<button class="btn boss-btn final-btn" data-a="finalFight">⛓ ${L('Запечатать', 'Seal him')}</button>` : ''}${midnightChip()}</div></div></a>`;
  }
  function finalView() {
    const st = finalState(), red = redCount();
    const crumbs = `<div class="crumbs"><a href="#book">Путь</a> › ${L('Финал', 'Finale')}</div>`;
    if (st === 'locked') return crumbs + finalCard() + `<div class="card" style="margin-top:14px"><h2>${L('Что нужно, чтобы открыть', 'What it takes to open')}</h2>
      <p class="small muted">${L('Каждая глава: все упражнения, всё повторение и все экзаменационные вопросы главы — на 5. Порядок не важен.', 'Every chapter: all exercises, all revision and all exam questions of the chapter at 5. Order does not matter.')}</p>
      ${TT.books.map(b => `<div class="fchs-b"><div class="tiny muted">${esc(b.title)} · ${esc(b.name)}</div><div class="fchs">${b.chapters.map(ch => { const s = chState(ch); return `<a class="fch ${s.state === 'red' ? 'ok' : ''}" href="#book/${ch.key}" title="${esc(ch.name)}"><b>${ch.n}</b><span>${s.all5}/${s.total}</span></a>`; }).join('')}</div></div>`).join('')}</div>`;
    const seals = new Set(finalSeals()), td = today();
    let days = ''; for (let d = td - 27; d <= td; d++) days += `<i class="${seals.has(d) ? 'ok' : d === td ? 'now' : ''}" title="${fmtDay(d)}"></i>`;
    const fights = Object.values(S.sessions).filter(r => r.final).sort((a, b) => b.started - a.started).slice(0, 8);
    return crumbs + finalCard() + `<div class="grid g2" style="margin-top:14px">
      <div class="card"><h2>${L('Правила', 'Rules')}</h2><ul class="frules">
        <li><b>${FIN.ex + FIN.bk}</b><span>${L(`задач за бой: ${FIN.ex} настоящих вопроса экзаменов 2015–2026 и ${FIN.bk} самых сложных задач учебников (●●● и Extended)`, `questions per fight: ${FIN.ex} real exam questions 2015–2026 and ${FIN.bk} of the hardest textbook questions (●●● and Extended)`)}</span></li>
        <li><b>${FIN.need}</b><span>${L(`ударов нужно для печати — задачи, решённые на 4–5`, `hits needed for the seal — questions rated 4–5`)}</span></li>
        <li><b>24:00</b><span>${L('печать трескается в полночь. Победить его нельзя — только запечатывать каждый день', 'the seal cracks at midnight. He cannot be defeated — only sealed, every day')}</span></li>
        <li><b>1</b><span>${L('набор задач на день постоянный; после проигранного боя — новый', 'the day\'s set stays the same; a lost fight brings a new one')}</span></li></ul></div>
      <div class="card"><h2>${L('Печати за 4 недели', 'Seals over 4 weeks')}</h2><div class="fdays">${days}</div>
        ${fights.length ? `<div class="tablewrap" style="margin-top:12px"><table>${fights.map(r => { const at = S.attempts.filter(a => a.sess === r.id), h = finalHits({ id: r.id }); return `<tr><td>${fmtDate(r.started)}</td><td class="num">${h}/${r.n}</td><td>${at.length ? (h >= FIN.need ? `<span class="fok">⛓ ${L('печать', 'sealed')}</span>` : `<span class="muted">${L('не удержал', 'did not hold')}</span>`) : '<span class="muted">—</span>'}</td></tr>`; }).join('')}</table></div>` : `<p class="small muted">${L('Боёв ещё не было.', 'No fights yet.')}</p>`}</div></div>`;
  }
  function finalPanel(s) {
    const last = {}; S.attempts.filter(a => a.sess === s.id).forEach(a => { last[a.q] = a.conf; });
    const hits = Object.values(last).filter(v => v >= 4).length;
    const segs = s.qids.map(id => `<i class="${last[id] == null ? '' : last[id] >= 4 ? 'hit' : 'miss'}"></i>`).join('');
    return `<div class="fbar">${examinerArt(70, 'awake')}<div class="grow" style="min-width:0"><div class="boss-cap" style="color:#ff8a95">${L('финал · печать', 'finale · the seal')}</div><b class="bb-name" data-notr>${L('Экзаменатор', 'The Examiner')}</b><div class="fsegs">${segs}</div></div><div class="hpnum"><span>${L('удары', 'hits')}</span> ${hits}<small>/${FIN.need}</small></div></div>`;
  }
  function finalResult(s) {
    const hits = s.finalHits != null ? s.finalHits : finalHits(s), ok = hits >= FIN.need;
    return `<div class="fres ${ok ? 'sealed' : ''}">${examinerArt(130, ok || finalSealed() ? 'sealed' : 'awake')}<div class="grow"><div class="boss-cap" style="color:${ok ? '#ffcf4d' : '#ff8a95'}">${ok ? L('запечатан', 'sealed') : L('печать не удержалась', 'the seal did not hold')}</div><div class="mb-name" data-notr>${L('Экзаменатор', 'The Examiner')}</div>
      <div class="small" style="margin-top:6px">${L('Ударов', 'Hits')}: <b>${hits}/${s.qids.length}</b> · ${L('нужно', 'needed')} ${FIN.need}</div>
      <div class="tiny boss-hint" style="margin-top:6px">${ok ? L('До полуночи он молчит. Завтра — снова.', 'He is silent until midnight. Tomorrow — again.') : L('Можно сразиться ещё раз — будет новый набор задач.', 'You can fight again — with a new set of questions.')}</div></div></div>`;
  }
  function finalOverlay(kind) {
    const open = kind === 'open', el = document.createElement('div');
    el.className = 'rankup finalup ' + kind; el.setAttribute('data-notr', '');
    let sp = ''; for (let j = 0; j < 48; j++) sp += `<i style="--a:${f2((j * 137.5) % 360)}deg;--d:${200 + (j * 53) % 380}px;--s:${f2(0.5 + (j % 5) * 0.22)};animation-delay:${f2(0.5 + (j % 9) * 0.05)}s"></i>`;
    const name = L('Экзаменатор', 'The Examiner');
    el.innerHTML = `<div class="fu-flash"></div><div class="ru-rays"></div><div class="ru-sp">${sp}</div><div class="fu-bars"></div>
      <div class="ru-in"><div class="ru-cap">${open ? L('финал открыт', 'the finale is open') : L('запечатан до полуночи', 'sealed until midnight')}</div>
        <div class="fu-art">${examinerArt(open ? 400 : 340, open ? 'awake' : 'sealed')}</div>
        <div class="fu-name" data-text="${esc(name)}">${esc(name)}</div>
        <div class="ru-sub">${open ? L('Все 22 главы — багровые. За последней страницей проснулся тот, кого нельзя победить. Его можно только запечатать — на один день.', 'All 22 chapters are crimson. Behind the last page wakes the one who cannot be defeated. He can only be sealed — for one day.')
          : L(`Печать держится до полуночи. Завтра он проснётся снова. Печатей: ${finalSeals().length} · дней подряд: ${finalStreak()}`, `The seal holds until midnight. Tomorrow he wakes again. Seals: ${finalSeals().length} · days in a row: ${finalStreak()}`)}</div>
        <button class="btn ${open ? 'boss-btn' : 'gold-btn'} lg">${open ? L('Посмотреть ему в глаза', 'Look him in the eye') : L('Продолжить', 'Continue')}</button></div>`;
    document.body.appendChild(el); el.addEventListener('click', () => closeOverlay(el));
  }
  setInterval(() => {
    if (finalOf().day !== today()) { const was = finalOf().day; finalOf().day = today(); if (was != null && view === 'book') render(); }
    document.querySelectorAll('[data-midnight]').forEach(e => { e.textContent = fmtClock(msToMidnight()); });
  }, 1000);

  /* ================= SESSIONS ================= */
  // every session that left at least one attempt, newest first
  function sessionRows() {
    const by = {};
    S.attempts.forEach(a => { if (a.sess) (by[a.sess] || (by[a.sess] = [])).push(a); });
    return Object.keys(by).map(id => {
      const at = by[id].sort((x, y) => x.t - y.t);
      const rec = S.sessions[id] || {};
      const kinds = new Set(at.map(a => (QBY[a.q] ? 'exam' : 'book')));
      const kind = rec.final ? 'final' : rec.boss ? 'boss' : rec.challenge ? 'challenge' : rec.study ? 'study' : rec.exam ? 'paper' : kinds.size > 1 ? 'mixed' : [...kinds][0];
      return { id, rec, at, title: rec.title || 'Сессия', start: rec.started || at[0].t, end: at[at.length - 1].t, kind, off: !!rec.off,
        time: at.reduce((x, a) => x + (a.time || 0), 0), avg: avg(at.map(a => a.conf)) };
    }).sort((a, b) => b.start - a.start);
  }
  const KIND = { exam: 'Экзамены', book: 'Учебник', mixed: 'Смешанная', challenge: 'Испытание главы', paper: 'Пробный экзамен', study: 'Изучение темы', boss: 'Бой с боссом', final: 'Финальный босс' };
  const isBookKind = k => ['book', 'challenge', 'study'].includes(k);
  let sessFilter = 'all';
  const sessOpen = new Set();
  function sessionsTab() {
    const all = sessionRows();
    const rows = all.filter(r => sessFilter === 'all' || (sessFilter === 'off' ? r.off : sessFilter === 'book' ? isBookKind(r.kind) : !isBookKind(r.kind)));
    const short = all.filter(r => !r.off && r.at.length <= 2).length;
    const offN = all.filter(r => r.off).length;
    const flt = [['all', `Все (${all.length})`], ['exam', 'Экзамены'], ['book', 'Учебник'], ['off', `Не засчитанные (${offN})`]];
    return `<div class="card">
      <div class="row"><h2 class="grow" style="margin:0">Сессии</h2>
        <div class="seg">${flt.map(([k, l]) => `<button class="${sessFilter === k ? 'on' : ''}" data-a="sessFilter" data-v="${k}">${l}</button>`).join('')}</div></div>
      <p class="small muted">«Не засчитывать» — сессия перестаёт влиять на статистику, прогресс, достижения и интервалы повторения, как будто её не было; её можно вернуть в любой момент. «Удалить» стирает её попытки навсегда.</p>
      <div class="row" style="margin-bottom:8px">
        <button class="btn sm" data-a="sessShort" ${short ? '' : 'disabled'}>Не засчитывать короткие (1–2 задачи): ${short}</button>
        <button class="btn sm danger" data-a="sessDelOff" ${offN ? '' : 'disabled'}>Удалить все не засчитанные</button>
      </div>
      ${rows.length ? `<div class="tablewrap"><table class="sesstable"><tr><th>Начало</th><th>Сессия</th><th>Тип</th><th class="num">Задач</th><th class="num">Время</th><th>Уверенность</th><th>Учёт</th><th></th></tr>
      ${rows.map(r => `<tr class="${r.off ? 'offrow' : ''}">
        <td class="small">${fmtDate(r.start)}</td>
        <td><a href="#" data-a="sessOpen" data-id="${r.id}">${sessOpen.has(r.id) ? '▾' : '▸'} ${esc(r.title)}</a> <button class="btn sm ghost" data-a="sessRename" data-id="${r.id}" title="Переименовать">✏️</button></td>
        <td><span class="chip">${KIND[r.kind] || 'Сессия'}</span></td>
        <td class="num">${r.at.length}</td><td class="num">${fmtDur(r.time)}</td>
        <td>${r.avg != null ? `<span class="confcell">${confDot(r.avg)}${r.avg.toFixed(1)}</span>` : ''}</td>
        <td>${r.off ? '<span class="st st-retired" style="text-decoration:none">не засчитана</span>' : '<span class="st st-sched">засчитана</span>'}</td>
        <td class="row" style="flex-wrap:nowrap"><button class="btn sm" data-a="sessToggle" data-id="${r.id}">${r.off ? 'Засчитать' : 'Не засчитывать'}</button><button class="btn sm ghost danger" data-a="sessDel" data-id="${r.id}" title="Удалить сессию и её попытки">✕</button></td></tr>
        ${sessOpen.has(r.id) ? `<tr class="sessdetail"><td colspan="8"><div class="hist">${r.at.map(a => { const it = itemOf(a.q); return it ? `<div class="row">${confDot(a.conf)}<a href="#" data-a="preview" data-id="${it.id}">${esc(it.title)}</a><span class="muted grow">${esc(CONF[a.conf].n)} · ${a.time ? fmtDur(a.time) : '—'} · ${fmtDate(a.t)}</span><button class="btn sm ghost danger" data-a="delAttempt" data-id="${a.id}" title="Удалить только эту попытку">✕</button></div>` : ''; }).join('')}</div></td></tr>` : ''}`).join('')}
      </table></div>` : '<div class="empty">Сессий пока нет. Здесь появится каждая начатая сессия: можно будет не засчитать её, переименовать или удалить.</div>'}
    </div>`;
  }
  function sessDelete(id) {
    S.attempts.forEach(a => { if (a.sess === id) (S.gone || (S.gone = {}))[a.id] = 1; });
    S.attempts = S.attempts.filter(a => a.sess !== id);
    delete S.sessions[id];
    Object.keys(S.challenges).forEach(k => { S.challenges[k] = S.challenges[k].filter(r => r.sess !== id); });
    if (S.session && S.session.id === id) { S.session = null; R = null; }
  }

  /* ================= ACHIEVEMENTS ================= */
  const TIER_NAMES = ['Бронза', 'Серебро', 'Золото', 'Платина', 'Алмаз', 'Легенда', 'Миф'];
  const ACH_COL = [['#b8642f', '#f3c09a'], ['#8f9aa6', '#f4f6f9'], ['#d49300', '#ffeaa6'], ['#3a9fb5', '#e8fdff'], ['#3b7bff', '#e6f1ff'], ['#ff5f33', '#fff1ad'], ['#c2185b', '#ffd6ea']];
  function awardStats() {
    return memo('aw', () => {
      const L = LIVE;
      const uniq = new Set(L.map(a => a.q));
      let uniqExam = 0, uniqBook = 0;
      uniq.forEach(id => { if (QBY[id]) uniqExam++; else uniqBook++; });
      const dayCount = {}, dayTime = {};
      L.forEach(a => { const d = dayOf(a.t); dayCount[d] = (dayCount[d] || 0) + 1; dayTime[d] = (dayTime[d] || 0) + (a.time || 0); });
      const days = Object.keys(dayCount).map(Number).sort((a, b) => a - b);
      let best = 0, run = 0, prev = null;
      days.forEach(d => { run = prev != null && d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
      let cur = 0; { let d = dayCount[today()] ? today() : today() - 1; while (dayCount[d]) { cur++; d--; } }
      let bestRun = 0, r = 0;
      L.forEach(a => { r = a.conf >= 4 ? r + 1 : 0; bestRun = Math.max(bestRun, r); });
      const bySess = {};
      L.forEach(a => { if (a.sess) (bySess[a.sess] || (bySess[a.sess] = [])).push(a); });
      const sessArr = Object.entries(bySess);
      const clean = sessArr.filter(([, at]) => at.length >= 5 && at.every(a => a.conf >= 4)).length;
      const papers = sessArr.filter(([id, at]) => S.sessions[id] && S.sessions[id].exam && at.length >= 6).length;
      let comeback = 0, reviews = 0;
      Object.values(C).forEach(c => {
        let low = false;
        for (const a of c.hist) { if (a.conf <= 2) low = true; else if (low && a.conf >= 4) { comeback++; break; } }
        for (let k = 1; k < c.hist.length; k++) { const p = c.hist[k - 1]; if (p.iv != null && p.iv > 0) { const due = dayOf(p.t) + p.iv, d = dayOf(c.hist[k].t); if (d >= due && d - due <= 3) reviews++; } }
      });
      const hour = a => new Date(a.t).getHours();
      const week0 = (() => { const d = today(); return d - (dateOfDay(d).getDay() + 6) % 7; })();
      const wk = (from, to) => { const a = L.filter(x => dayOf(x.t) >= from && dayOf(x.t) < to); return { n: a.length, min: Math.round(a.reduce((x, y) => x + (y.time || 0), 0) / 60), avg: avg(a.map(x => x.conf)) }; };
      const bestDayD = days.reduce((b, d) => (dayCount[d] > (dayCount[b] || 0) ? d : b), null);
      const maxSess = sessArr.reduce((b, [id, at]) => (at.length > b.n ? { n: at.length, id } : b), { n: 0 });
      const goalDays = days.filter(d => dayCount[d] >= (+S.settings.goal || 5)).length;
      const chs = CHS.map(chState);
      return {
        total: L.length, uniq: uniq.size, uniqExam, uniqBook, days: days.length, streak: cur, bestStreak: best, bestRun, clean, papers, comeback, reviews,
        hours: L.reduce((x, a) => x + (a.time || 0), 0) / 3600, bestDayMin: Math.max(0, ...Object.values(dayTime)) / 60,
        bestDay: bestDayD != null ? { d: bestDayD, n: dayCount[bestDayD] } : null, maxSess, goalDays,
        early: L.filter(a => hour(a) < 8).length, night: L.filter(a => hour(a) >= 23).length,
        speed: L.filter(a => QBY[a.q] && a.conf >= 4 && a.time > 0 && a.time <= QBY[a.q].marks * 30).length,
        weekend: days.filter(d => [0, 6].includes(dateOfDay(d).getDay())).length,
        years: new Set(L.filter(a => QBY[a.q]).map(a => QBY[a.q].year)).size,
        chapters: new Set(L.filter(a => TBY[a.q]).map(a => chKeyOf(TG[TBY[a.q].g]))).size,
        bosses: chs.filter(s => s.state !== 'none').length, gold: chs.filter(s => s.state === 'gold' || s.state === 'red').length, red: chs.filter(s => s.state === 'red').length,
        topicsDone: topicSum(ALL_TOPICS).done,
        stars: CHS.reduce((x, ch) => x + ((chBest(ch.key) || {}).stars || 0), 0),
        bestChal: Math.max(0, ...CHS.map(ch => (chBest(ch.key) || {}).score || 0)),
        topics: studyMasteredCount(),
        thisWeek: wk(week0, week0 + 7), lastWeek: wk(week0 - 7, week0),
      };
    });
  }
  const ACH = [
    { id: 'uniq', g: '∑', name: 'Решатель', d: 'разных задач решено', t: [10, 50, 200, 500, 1000, 2000, 3000], v: s => s.uniq },
    { id: 'exam', g: '§', name: 'Знаток экзаменов', d: 'разных экзаменационных вопросов', t: [5, 25, 75, 150, 228], v: s => s.uniqExam },
    { id: 'book', g: '¶', name: 'Книжный червь', d: 'разных задач из учебников', t: [25, 100, 400, 1000, 2000, 3009], v: s => s.uniqBook },
    { id: 'bosses', g: '☠', name: 'Охотник на боссов', d: 'боссов повержено', t: [1, 3, 8, 15, 22], v: s => s.bosses },
    { id: 'gold', g: '◆', name: 'Золотой стандарт', d: 'золотых глав (все задачи на 4–5)', t: [1, 3, 8, 15, 22], v: s => s.gold },
    { id: 'red', g: '✶', name: 'Багровый абсолют', d: 'багровых глав (все задачи на 5)', t: [1, 3, 8, 22], v: s => s.red },
    { id: 'tdone', g: '✓', name: 'Картограф', d: 'тем изучено', t: [5, 20, 50, 100, 152], v: s => s.topicsDone },
    { id: 'topics', g: '◎', name: 'Без лишних задач', d: 'упражнений пройдено в режиме изучения', t: [1, 10, 40, 100, 154], v: s => s.topics },
    { id: 'streak', g: '↯', name: 'Серия', d: 'дней подряд с занятиями (рекорд)', t: [3, 7, 14, 30, 60, 100], v: s => s.bestStreak },
    { id: 'days', g: '∴', name: 'Постоянство', d: 'дней с занятиями всего', t: [5, 20, 50, 100, 200], v: s => s.days },
    { id: 'goal', g: '⊙', name: 'Цель дня', d: 'дней, когда выполнена дневная цель', t: [1, 7, 30, 100], v: s => s.goalDays },
    { id: 'hours', g: '⧗', name: 'Часы практики', d: 'часов решения задач', t: [1, 5, 20, 50, 100, 200], v: s => Math.floor(s.hours) },
    { id: 'marathon', g: '∞', name: 'Марафон', d: 'минут решения за один день (рекорд)', t: [30, 60, 120, 180, 240], v: s => Math.floor(s.bestDayMin) },
    { id: 'sniper', g: '⌖', name: 'Снайпер', d: 'решений подряд на 4–5 (рекорд)', t: [5, 10, 25, 50, 100], v: s => s.bestRun },
    { id: 'clean', g: '✧', name: 'Чистая сессия', d: 'сессий от 5 задач без оценок ниже 4', t: [1, 5, 20, 50], v: s => s.clean },
    { id: 'comeback', g: '↻', name: 'Работа над ошибками', d: 'задач, поднятых с 1–2 до 4–5', t: [1, 10, 50, 150], v: s => s.comeback },
    { id: 'reviews', g: 'Δ', name: 'Повторение — мать учения', d: 'повторений, сделанных вовремя', t: [10, 50, 200, 500], v: s => s.reviews },
    { id: 'stars', g: '★', name: 'Звездочёт', d: 'звёзд за испытания глав (лучшие)', t: [3, 15, 30, 66], v: s => s.stars },
    { id: 'papers', g: '⧉', name: 'Полный экзамен', d: 'пробных экзаменов (от 6 вопросов)', t: [1, 3, 6, 12, 24], v: s => s.papers },
    { id: 'speed', g: '»', name: 'Быстрее экзамена', d: 'экзаменационных вопросов на 4–5 быстрее экзаменационного темпа', t: [1, 10, 50, 150], v: s => s.speed },
    { id: 'years', g: '⟲', name: 'Путешественник во времени', d: 'годов экзаменов, из которых решён вопрос', t: [3, 6, 12], v: s => s.years },
    { id: 'chapters', g: '⌬', name: 'Исследователь', d: 'глав учебников, где решена задача', t: [5, 11, 22], v: s => s.chapters },
    { id: 'early', g: '☼', name: 'Ранняя пташка', d: 'задач, решённых до 8:00', t: [1, 10, 50], v: s => s.early },
    { id: 'night', g: '☾', name: 'Ночная сова', d: 'задач, решённых после 23:00', t: [1, 10, 50], v: s => s.night },
    { id: 'weekend', g: '⊕', name: 'Выходные не отдыхают', d: 'выходных дней с занятиями', t: [2, 10, 30], v: s => s.weekend },
  ];
  function achState(st) {
    let dirty = false;
    const out = ACH.map(a => {
      const v = a.v(st), tier = a.t.filter(x => v >= x).length, rec = S.ach[a.id] || {};
      if (tier > (rec.tier || 0)) { rec.tier = tier; rec.t = rec.t || {}; for (let k = (rec.prev || 0) + 1; k <= tier; k++) rec.t[k] = rec.t[k] || Date.now(); rec.prev = tier; S.ach[a.id] = rec; dirty = true; }
      return { a, v, tier, next: a.t[tier], prev: tier ? a.t[tier - 1] : 0, when: rec.t && rec.t[tier] };
    });
    if (dirty) save();
    return out;
  }
  // XP is display-only: tasks, bosses and chapter states, achievement steps, chapter challenge stars
  function xpParts() {
    return memo('xp', () => {
      const seen = new Set(); let tasks = 0;
      LIVE.forEach(a => {
        const base = [0, 2, 4, 6, 9, 12][a.conf] + (seen.has(a.q) ? 0 : 3);
        let mult = 1;
        if (TBY[a.q]) { const g = TG[TBY[a.q].g]; mult = g.kind === 'rev' ? 1 + TIER[g.tier].w / 2 : 1; } else if (QBY[a.q]) mult = QBY[a.q].marks / 20;
        tasks += Math.round(base * mult); seen.add(a.q);
      });
      let chal = 0; Object.values(S.challenges).forEach(l => l.forEach(r => { if (!sessOff(r.sess)) chal += 15 * r.stars; }));
      let bosses = 0; CHS.forEach(ch => { const s = chState(ch).state; if (s !== 'none') bosses += 300; if (s === 'gold' || s === 'red') bosses += 500; if (s === 'red') bosses += 900; });
      const ast = awardStats(); let ach = 0;
      ACH.forEach(a => { const v = a.v(ast); ach += 25 * a.t.filter(x => v >= x).length; });
      return { tasks, chal, bosses, ach, total: tasks + chal + bosses + ach };
    });
  }
  const xpTotal = () => xpParts().total;
  function achBadge(r, size = 66) {
    const t = r.tier, col = t ? ACH_COL[t - 1] : ['#9aa0a8', '#e3e5e9'], id = 'ab' + (++EMB);
    const p = r.next != null ? Math.min(1, (r.v - r.prev) / (r.next - r.prev)) : 1, L = 2 * Math.PI * 30;
    return `<svg class="achb t${t}" viewBox="0 0 68 68" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient></defs>
      <circle cx="34" cy="34" r="30" fill="none" stroke="var(--border)" stroke-width="2"/>
      <circle class="achring" cx="34" cy="34" r="30" fill="none" stroke="${col[0]}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${f2(p * L)} ${f2(L)}" transform="rotate(-90 34 34)"/>
      <path d="${polyPath(6, 23, -90, 34, 34)}" fill="${t ? `url(#${id})` : 'var(--panel2)'}" stroke="${col[0]}" stroke-width="1.1"/>
      <path d="${polyPath(6, 18, -90, 34, 34)}" fill="none" stroke="${t ? 'rgba(255,255,255,.6)' : 'var(--border)'}" stroke-width=".7"/>
      <text x="34" y="40" text-anchor="middle" font-size="16" fill="${t ? '#1d1404' : 'var(--muted)'}" font-family="'Cambria Math','Segoe UI Symbol','Segoe UI',serif">${r.a.g}</text></svg>`;
  }
  function achTab() {
    const st = awardStats(), list = achState(st);
    const got = list.reduce((s, r) => s + r.tier, 0), all = list.reduce((s, r) => s + r.a.t.length, 0);
    const byTier = TIER_NAMES.map((n, k) => list.filter(r => r.tier > k).length);
    const w1 = st.thisWeek, w0 = st.lastWeek;
    const delta = (a, b, unit = '') => { if (b == null || a == null) return ''; const d = a - b; return d === 0 ? '<span class="muted">=</span>' : `<span style="color:${d > 0 ? 'var(--c5)' : 'var(--c1)'}">${d > 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 10) / 10)}${unit}</span>`; };
    const recent = list.filter(r => r.when).sort((a, b) => b.when - a.when).slice(0, 6);
    const secret = r => !r.tier && !r.v;
    const sorted = list.slice().sort((a, b) => (secret(a) ? 1 : 0) - (secret(b) ? 1 : 0) || (b.tier ? 1 : 0) - (a.tier ? 1 : 0) || ((b.next != null ? (b.v - b.prev) / (b.next - b.prev) : 1) - (a.next != null ? (a.v - a.prev) / (a.next - a.prev) : 1)));
    const nSecret = list.filter(secret).length;
    return `<div class="achtop card">
        <div class="achsum"><div class="eyebrow">ступени достижений</div><b class="achbig"><span data-count="${got}">${got}</span><small>/${all}</small></b>${bar(got / all, 'var(--accent)')}</div>
        <div class="achtiers">${TIER_NAMES.map((n, k) => `<div class="att" style="--a:${ACH_COL[k][0]};--b:${ACH_COL[k][1]}"><i></i><b>${byTier[k]}</b><span>${n}</span></div>`).join('')}</div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h2>Эта неделя</h2>
          <table><tr><th></th><th class="num">эта</th><th class="num">прошлая</th><th></th></tr>
          <tr><td>Задач решено</td><td class="num">${w1.n}</td><td class="num">${w0.n}</td><td>${delta(w1.n, w0.n)}</td></tr>
          <tr><td>Минут решения</td><td class="num">${w1.min}</td><td class="num">${w0.min}</td><td>${delta(w1.min, w0.min)}</td></tr>
          <tr><td>Средняя уверенность</td><td class="num">${w1.avg != null ? w1.avg.toFixed(2) : '—'}</td><td class="num">${w0.avg != null ? w0.avg.toFixed(2) : '—'}</td><td>${delta(w1.avg, w0.avg)}</td></tr></table></div>
        <div class="card"><h2>Личные рекорды</h2><div class="recs">
          ${[['задач за день', st.bestDay ? `${st.bestDay.n} <small>${fmtDay(st.bestDay.d)}</small>` : '—'], ['серия дней', st.bestStreak], ['подряд на 4–5', st.bestRun], ['самая большая сессия', st.maxSess.n || '—'], ['минут за день', Math.round(st.bestDayMin)], ['лучшее испытание', st.bestChal ? st.bestChal + '%' : '—'], ['часов всего', st.hours.toFixed(1)], ['боссов', st.bosses]].map(([l, v]) => `<div class="rec"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
          ${recent.length ? `<h3 style="margin-top:14px">Последние награды</h3><div class="recent">${recent.map(r => `<span class="chip">${r.a.g} ${esc(r.a.name)} · ${TIER_NAMES[r.tier - 1]} <span class="muted">${fmtDay(dayOf(r.when))}</span></span>`).join('')}</div>` : ''}</div>
      </div>
      <div class="section-title"><span class="idx">${ACH.length}</span><h2>Достижения</h2><span class="muted small">открытые — сначала, дальше — ближайшие к следующей ступени${nSecret ? ` · секретных: ${nSecret}` : ''}</span></div>
      <div class="achgrid">${sorted.map(r => {
        if (secret(r)) return `<div class="achv secret"><svg class="achb" viewBox="0 0 68 68" width="66" height="66" aria-hidden="true"><circle cx="34" cy="34" r="30" fill="none" stroke="var(--border)" stroke-width="2" stroke-dasharray="2 5"/><path d="${polyPath(6, 23, -90, 34, 34)}" fill="var(--panel2)" stroke="var(--border)"/><text x="34" y="41" text-anchor="middle" font-size="20" font-weight="800" fill="var(--muted)" font-family="Unbounded,sans-serif">?</text></svg>
          <div class="grow"><b>???</b><div class="tiny muted">Секретное достижение. Откроется, когда вы сделаете первый шаг к нему.</div><div class="achsteps">${r.a.t.map(() => '<i></i>').join('')}</div></div></div>`;
        const p = r.next != null ? Math.min(1, (r.v - r.prev) / (r.next - r.prev)) : 1;
        return `<div class="achv ${r.tier ? 't' + r.tier : 'locked'}" style="${r.tier ? `--a:${ACH_COL[r.tier - 1][0]};--b:${ACH_COL[r.tier - 1][1]}` : ''}">
          ${achBadge(r)}
          <div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b>${esc(r.a.name)}</b>${r.tier ? `<span class="achtier">${TIER_NAMES[r.tier - 1]}</span>` : ''}</div>
            <div class="tiny muted">${esc(r.a.d)}</div>
            <div class="achnum"><b>${r.v}</b>${r.next != null ? `<span>/ ${r.next}</span><em>${Math.round(p * 100)}%</em>` : '<span>все ступени взяты</span>'}</div>
            <div class="achsteps">${r.a.t.map((x, k) => `<i class="${k < r.tier ? 'on' : ''}" title="${TIER_NAMES[k] || ''}: ${x}" style="${k < r.tier ? `background:${ACH_COL[k][0]}` : ''}"></i>`).join('')}</div>
          </div></div>`; }).join('')}</div>`;
  }

  /* ================= PREVIEW MODAL ================= */
  let pvTab = 'q', pvCtx = null, pvFull = false;
  function preview(id) {
    const q = QBY[id]; if (!q) return;
    const c = C[id];
    const cs = codesOf(q);
    const overridden = !!S.tags[id];
    const opts = CHAPS.map(ch => `<optgroup label="К${ch.book} · ${ch.n}. ${esc(ch.name)}">${ch.sections.map(s => `<option value="${s.code}">${esc(s.n)} ${esc(s.name)}</option>`).join('')}</optgroup>`).join('');
    openModal(`<div class="box">
      <div class="row"><h2 class="grow" style="margin:0">${starBtn(id)} ${esc(qTitle(q))}</h2>
        <span class="chip">Section ${q.section}</span><span class="chip">${q.marks} баллов</span>${stBadge(id)}
        <button class="btn sm ghost" data-a="closeModal">✕</button></div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:16px;margin-top:12px" id="pvgrid">
        <div>
          <div class="seg" style="margin-bottom:8px"><button class="${pvTab === 'q' ? 'on' : ''}" data-a="pvTab" data-v="q" data-id="${id}">Вопрос</button>${q.ms ? `<button class="${pvTab === 'ms' ? 'on' : ''}" data-a="pvTab" data-v="ms" data-id="${id}">Решение</button>` : ''}</div>
          ${(() => { const cut = pvTab === 'ms' ? null : cutFor(q, pvCtx);
            return (cut ? cutBar(cut, pvFull, 'pvCut', id) : '') + `<div class="paper">${pvTab === 'ms' && q.ms ? imgTag(q.ms, q.msSize, 'Marking scheme') : cut && !pvFull ? givenSheet(cut) + imgTag(cut.img, cut.size, qTitle(q)) : imgTag(q.img, q.size, qTitle(q))}</div>`; })()}
        </div>
        <div>
          ${(() => { const ctx = pvCtx || (qTopics(q).length === 1 ? qTopics(q)[0] : null), lbl = !ctx ? '' : ctx.startsWith('ch:') ? ` · бой с боссом главы ${TCH[ctx.slice(3)] ? TCH[ctx.slice(3)].n : ''}` : ` · в теме ${SEC[ctx] ? SEC[ctx].n : ctx}`;
            return `<button class="btn pri" style="width:100%;justify-content:center" data-a="startOne" data-id="${id}" ${ctx ? `data-ctx="${ctx}"` : ''}>▶ Решить сейчас${lbl}</button>`; })()}
          <div class="row" style="margin-top:8px"><a class="btn sm ghost" href="${pdfLink(q)}" target="_blank">PDF вопроса</a>${q.ms ? `<a class="btn sm ghost" href="${pdfLink(q, true)}" target="_blank">PDF решения</a>` : ''}</div>
          <div class="field"><label>Темы ${overridden ? '<span style="text-transform:none;font-weight:400">(изменены вами)</span>' : ''}</label>
            <div class="chips">${cs.map(code => `<span class="chip" title="${esc(secLabel(code))}">${esc(secShort(code))} ${esc((SEC[code] || {}).name || '')} <a href="#" data-a="tagDel" data-id="${id}" data-code="${code}" title="убрать">✕</a></span>`).join('')}</div>
            <div class="row" style="margin-top:6px"><select id="tagAdd" style="max-width:220px"><option value="">+ добавить тему…</option>${opts}</select>${overridden ? `<button class="btn sm ghost" data-a="tagReset" data-id="${id}">вернуть исходные</button>` : ''}</div>
            ${!overridden && q.parts.length > 1 ? `<div class="tiny muted" style="margin-top:6px">${q.parts.map(p => `${esc(partLabel(p.p))}: ${p.codes.map(secShort).join(', ')}`).join(' · ')}</div>` : ''}
          </div>
          ${(() => { const ts = qTopics(q), ok = ts.filter(c => ctxConf(q, c) >= 4).length;
            return `<div class="field"><label>Пройден в темах: ${ok}/${ts.length}${ts.length && ok === ts.length ? ' · <span class="tfull-n">★ во всех</span>' : ''}</label><div class="hist">${ts.map(c => { const t = TOPIC[c], a = ctxAtt(q, c), v = ctxConf(q, c);
              return `<div class="row"><a href="#" data-a="go" data-v="book/${t.ch.key}" class="grow" style="min-width:0">${esc(secShort(c))} ${esc(t.s.name)}</a>${v ? `${confDot(Math.round(v))}<span class="small">${esc(CONF[Math.round(v)].n)}</span>` : a ? '' : C[q.id] ? '<span class="tiny muted"><span class="else-key"></span> решён в другой теме</span>' : '<span class="tiny muted">не решён</span>'}${v >= 4 ? '' : `<button class="btn sm ghost" data-a="startOne" data-id="${id}" data-ctx="${c}">Решить здесь</button>`}</div>`; }).join('') || '<span class="muted small">—</span>'}</div>
              <div class="tiny muted" style="margin-top:6px">Вопрос засчитывается теме, только если решён в ней: через «Решать» в теме, в изучении темы или в бою с боссом главы.</div></div>`; })()}
          <div class="field"><label>Заметка</label><textarea id="pvNote" data-id="${id}">${esc(S.notes[id] || '')}</textarea></div>
          <div class="field"><label>История ${c ? '(' + c.n + ')' : ''}</label>
            ${c ? `<div class="hist">${c.hist.slice().reverse().map(a => `<div class="row">${confDot(a.conf)}<span>${esc(CONF[a.conf].n)}</span><span class="muted grow">${a.score != null ? a.score + '/' + q.marks : ''} ${a.time ? fmtDur(a.time) : ''}</span><span class="muted">${fmtDate(a.t)}</span></div>`).join('')}</div>
              <div class="small muted" style="margin-top:6px">${c.retired ? 'Больше не показывается.' : 'Следующий показ: ' + (c.due <= today() ? 'сейчас' : fmtDay(c.due))}</div>
              <div class="row" style="margin-top:6px">${c.retired || c.due > today() ? `<button class="btn sm" data-a="dueNow" data-id="${id}">Повторить сегодня</button>` : ''}</div>` : '<div class="muted small">Ещё не решался.</div>'}
          </div>
        </div>
      </div></div>`);
    const g = $('#pvgrid'); if (g && window.innerWidth < 900) g.style.gridTemplateColumns = '1fr';
    const ta = $('#tagAdd'); if (ta) ta.addEventListener('change', () => { if (!ta.value) return; const cur = codesOf(q).slice(); if (!cur.includes(ta.value)) cur.push(ta.value); S.tags[id] = cur; save(); preview(id); });
    const nt = $('#pvNote'); if (nt) nt.addEventListener('input', () => { if (nt.value.trim()) S.notes[id] = nt.value; else delete S.notes[id]; save(); });
  }
  function openModal(html) { const m = $('#modal'); clearTimeout(closeModal.h); m.classList.remove('closing'); m.innerHTML = html; m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  // closing plays the opening animation in reverse before the modal is removed
  function closeModal() {
    const m = $('#modal'); if (m.classList.contains('hidden') || m.classList.contains('closing')) return;
    const done = () => { m.classList.remove('closing'); m.classList.add('hidden'); m.innerHTML = ''; document.body.style.overflow = ''; if (view !== 'practice') render(); };
    if (motionOff()) { done(); return; }
    m.classList.add('closing'); closeModal.h = setTimeout(done, 190);
  }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  /* ---------- exam picker ---------- */
  function examPick() {
    if (!hasPlan('max')) { upsell('max', L('Пробный экзамен', 'The mock exam')); return; }
    openModal(`<div class="box narrow"><h2>Пробный экзамен</h2>
      <p class="muted small">Все вопросы одной работы по порядку, общий таймер 2 ч 30 мин. После каждого вопроса — оценка, как обычно. Лишние вопросы пропускайте кнопкой «Пропустить».</p>
      <div class="row"><select id="ex-year">${YEARS.slice().reverse().map(y => `<option>${y}</option>`).join('')}</select>
        <select id="ex-paper"><option value="1">Paper 1</option><option value="2">Paper 2</option></select></div>
      <div class="small muted" id="ex-info" style="margin-top:8px"></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn" data-a="closeModal">Отмена</button><button class="btn pri" data-a="examGo">Начать экзамен</button></div></div>`);
    const upd = () => { const y = +$('#ex-year').value, p = +$('#ex-paper').value; const qs = Q.filter(q => q.year === y && q.paper === p); const rule = y <= 2020 ? 'отвечать на все вопросы' : y <= 2022 ? 'Section A — любые 4 из 6, Section B — любые 2 из 4' : 'Section A — любые 5 из 6, Section B — любые 3 из 4'; $('#ex-info').textContent = `${qs.length} вопросов, решалось раньше: ${qs.filter(q => C[q.id]).length}. Правило ${y} года: ${rule}.`; };
    $('#ex-year').addEventListener('change', upd); $('#ex-paper').addEventListener('change', upd); upd();
  }

  /* ---------- export ---------- */
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  /* ================= ACTIONS ================= */
  const ACT = {
    go: el => { closeModalSilently(); go(el.dataset.v); },
    star: (el, e) => { e.stopPropagation(); const id = el.dataset.id; if (S.stars[id]) delete S.stars[id]; else S.stars[id] = 1; save(); document.querySelectorAll(`.starbtn[data-id="${id}"]`).forEach(b => b.classList.toggle('on', !!S.stars[id])); },
    preview: (el, e) => { e.preventDefault(); pvTab = 'q'; pvFull = false; pvCtx = el.dataset.ctx || null; (TBY[el.dataset.id] ? previewBook : preview)(el.dataset.id); },
    pvCut: el => { pvFull = !pvFull; preview(el.dataset.id); },
    cutToggle: () => { R.fullQ = !R.fullQ; render(); },
    pvTab: el => { pvTab = el.dataset.v; (TBY[el.dataset.id] ? previewBook : preview)(el.dataset.id); },
    ansAll: el => ansAllModal(el.dataset.g),
    gStart: el => { const g = TG[el.dataset.g]; groupSession(gIds(g.id), el.dataset.m, groupTitle(g)); },
    chStart: el => { const ch = TCH[el.dataset.ch]; groupSession(ch.exItems.concat(ch.revItems), el.dataset.m, `Глава ${ch.n}. ${ch.name}`); },
    bookDue: () => { startSession(bookDue().slice(0, 30), 'Повторение учебника'); },
    challenge: el => {
      const ch = TCH[el.dataset.ch];
      const pick = (gid, k) => shuffle(gIds(gid).filter(id => status(id) !== 'retired')).sort((a, b) => ((C[a] || {}).lastConf || 0) >= 4 ? 1 : ((C[b] || {}).lastConf || 0) >= 4 ? -1 : 0).slice(0, k);
      const ids = shuffle([].concat(ch.rev.A ? pick(ch.rev.A, 3) : [], ch.rev.B ? pick(ch.rev.B, 2) : [])).concat(ch.rev.C ? pick(ch.rev.C, 1) : []);
      if (!ids.length) { toast('В этой главе нет задач повторения'); return; }
      startSession(ids, `Испытание главы ${ch.n}. ${ch.name}`, { limit: 45, challenge: ch.key });
    },
    closeModal: () => closeModal(),
    bf: el => { const f = el.dataset.field; let v = el.dataset.v; if (['years', 'papers', 'conf'].includes(f)) v = +v; const a = BF[f]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); saveBF(); render(); },
    bfStar: () => { BF.star = !BF.star; saveBF(); render(); },
    bfReset: () => { const open = BF.open; BF = Object.assign({}, JSON.parse(JSON.stringify(BF_DEF)), { open }); saveBF(); render(); },
    builder: () => builderModal(),
    startNew: () => { const n = +S.settings.newPerDay || 5; startSession(shuffle(Q.filter(q => !C[q.id]).map(q => q.id)).slice(0, n), 'Новые вопросы'); },
    startCode: (el, e) => {
      e.preventDefault(); e.stopPropagation();
      const code = el.dataset.code;
      // questions not yet at 4–5 in this topic first: never tried here, then the weakest here
      const qs = Q.filter(q => codesOf(q).includes(code));
      const open = qs.filter(q => ctxConf(q, code) < 4);
      const ids = (open.length ? shuffle(open.filter(q => !ctxAtt(q, code))).concat(open.filter(q => ctxAtt(q, code)).sort((a, b) => ctxConf(a, code) - ctxConf(b, code))) : shuffle(qs.slice())).map(q => q.id).slice(0, 8);
      startSession(ids, secShort(code) + ' ' + SEC[code].name, { ctx: code });
    },
    startOne: el => {
      const id = el.dataset.id;
      if (el.dataset.cont && TBY[id]) {
        const k = BOOK_ORDER.indexOf(id);
        const ids = BOOK_ORDER.slice(k).filter(x => !C[x]).slice(0, 10);
        startSession(ids, 'Продолжение: ' + groupTitle(TG[TBY[id].g]));
        return;
      }
      startSession([id], itemOf(id).title, { ctx: el.dataset.ctx || null });
    },
    examPick: () => examPick(),
    examGo: () => { const y = +$('#ex-year').value, p = +$('#ex-paper').value; startSession(Q.filter(q => q.year === y && q.paper === p).sort((a, b) => a.q - b.q).map(q => q.id), `Экзамен ${y} Paper ${p}`, { exam: true }); },
    pconf: el => { const p = el.dataset.p, v = +el.dataset.v; if (R.parts[p] === v) delete R.parts[p]; else R.parts[p] = v; const vals = Object.values(R.parts); if (vals.length && !R.confManual) { R.conf = Math.max(1, Math.min(5, Math.round(avg(vals)))); R.iv = undefined; } render(); },
    partsToggle: (el, e) => { e.preventDefault(); R.partsOpen = !R.partsOpen; render(); },
    iv: el => { const v = el.dataset.v; R.iv = v === 'null' ? null : +v; if (!R.conf) { toast('Сначала отметьте уверенность'); return; } render(); },
    toggleCs: () => { R.showCs = !R.showCs; render(); if (R.showCs) setTimeout(() => { const m = $('#cs'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); },
    toggleMs: () => { R.showMs = !R.showMs; render(); if (R.showMs) setTimeout(() => { const m = $('#ms'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); },
    pause: () => { if (R.since) { R.elapsed += Date.now() - R.since; R.since = null; R.paused = true; } else { R.since = Date.now(); R.paused = false; } render(); },
    saveNext: () => saveAttempt(),
    skip: () => {
      const s = S.session;
      if (s.study) { const m = S.study[s.study]; if (m) { m.skips = m.skips || []; m.skips.push(s.qids[s.i]); } }
      s.i++; R = null;
      if (s.study && s.i >= s.qids.length) { const nx = studyNext(studyState(s.study)); if (nx) s.qids.push(nx.id); else examFinale(s); }
      save(); render();
    },
    studyHelp: () => studyHelp(),
    endSession: () => { if (!S.session) return; if (S.session.i < S.session.qids.length) { if (S.session.challenge) S.session.i = S.session.qids.length; else S.session.qids = S.session.qids.slice(0, S.session.i); } save(); R = null; go('practice'); },
    closeSession: el => { const s = S.session; if (s && !S.attempts.some(a => a.sess === s.id)) delete S.sessions[s.id]; S.session = null; save(); go(el.dataset.v); },
    sessFilter: el => { sessFilter = el.dataset.v; render(); },
    sessOpen: (el, e) => { e.preventDefault(); const id = el.dataset.id; if (sessOpen.has(id)) sessOpen.delete(id); else sessOpen.add(id); render(); },
    sessRename: el => { const id = el.dataset.id; const rec = S.sessions[id] || (S.sessions[id] = { id, title: 'Сессия' }); const t = prompt(tr('Название сессии'), rec.title || ''); if (t != null && t.trim()) { rec.title = t.trim(); save(); render(); } },
    sessToggle: el => { const id = el.dataset.id; const rec = S.sessions[id] || (S.sessions[id] = { id, title: 'Сессия' }); rec.off = !rec.off; rebuild(); save(); render(); toast(rec.off ? 'Сессия не засчитана' : 'Сессия снова засчитана'); },
    sessDel: el => { const id = el.dataset.id; const n = S.attempts.filter(a => a.sess === id).length; if (!ask(`Удалить сессию и ${n} ${plural(n, 'попытку', 'попытки', 'попыток')} в ней? Это нельзя отменить.`)) return; const wasCur = S.session && S.session.id === id; sessDelete(id); rebuild(); save(); if (wasCur) go(location.hash.includes('book') ? 'book' : 'home'); else render(); toast('Сессия удалена'); },
    sessShort: () => { const rows = sessionRows().filter(r => !r.off && r.at.length <= 2); if (!rows.length || !ask(`Не засчитывать ${rows.length} коротких сессий (1–2 задачи)?`)) return; rows.forEach(r => { const rec = S.sessions[r.id] || (S.sessions[r.id] = { id: r.id, title: r.title }); rec.off = true; }); rebuild(); save(); render(); },
    sessDelOff: () => { const rows = sessionRows().filter(r => r.off); if (!rows.length || !ask(`Удалить навсегда ${rows.length} не засчитанных сессий?`)) return; rows.forEach(r => sessDelete(r.id)); rebuild(); save(); render(); },
    openSessions: el => { statsTab = 'sessions'; sessFilter = el.dataset.v || 'all'; closeModalSilently(); go('stats'); },
    flag: el => { const id = el.dataset.id; if (S.flags[id]) delete S.flags[id]; else S.flags[id] = Date.now(); save(); if (!$('#modal').classList.contains('hidden')) previewBook(id); else render(); },
    redoWeak: el => { startSession(el.dataset.ids.split(','), 'Ещё раз: слабые', { ctx: el.dataset.ctx || null }); },
    statsTab: el => { statsTab = el.dataset.v; render(); },
    topicBook: el => { topicBook = el.dataset.v; render(); },
    toggleChap: el => { const id = el.dataset.ch; if (openChaps.has(id)) openChaps.delete(id); else openChaps.add(id); render(); },
    expandAll: () => { if (openChaps.size) openChaps.clear(); else CHAPS.forEach(c => openChaps.add(c.id)); render(); },
    logAll: () => { logAll = true; render(); },
    delAttempt: el => { if (!ask('Удалить эту попытку из статистики?')) return; (S.gone || (S.gone = {}))[el.dataset.id] = 1; S.attempts = S.attempts.filter(a => a.id !== el.dataset.id); rebuild(); save(); render(); },
    tagDel: (el, e) => { e.preventDefault(); const id = el.dataset.id; const q = QBY[id]; S.tags[id] = codesOf(q).filter(c => c !== el.dataset.code); save(); preview(id); },
    tagReset: el => { delete S.tags[el.dataset.id]; save(); preview(el.dataset.id); },
    dueNow: el => { const id = el.dataset.id; const c = C[id]; if (!c) return; c.last.iv = Math.max(0, today() - dayOf(c.last.t)); rebuild(); save(); (TBY[id] ? previewBook : preview)(id); toast('Добавлено в повторение на сегодня'); },
    export: () => { S.lastExport = Date.now(); save(); download(`bedarev-math-progress-${stamp()}.json`, JSON.stringify(S, null, 1), 'application/json'); render(); },
    exportCsv: () => {
      const rows = [['date', 'question', 'year', 'paper', 'q', 'section', 'marks', 'confidence', 'parts', 'score', 'time_sec', 'interval_days', 'topics']];
      S.attempts.slice().sort((a, b) => a.t - b.t).forEach(a => { const q = QBY[a.q]; if (!q) { const t = TBY[a.q]; if (t) { const g = TG[t.g]; rows.push([new Date(a.t).toISOString(), t.id, TBOOK[g.book].title, '', t.n, g.key, '', a.conf, '', '', a.time || '', a.iv ?? 'never', g.sec || '']); } return; } rows.push([new Date(a.t).toISOString(), q.id, q.year, q.paper, q.q, q.section, q.marks, a.conf, a.parts ? Object.entries(a.parts).map(([p, v]) => p + ':' + v).join(' ') : '', a.score ?? '', a.time || '', a.iv ?? 'never', codesOf(q).join(' ')]); });
      download(`bedarev-math-attempts-${stamp()}.csv`, rows.map(r => r.map(x => /[",;\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(',')).join('\n'), 'text/csv');
    },
    logout: async () => { try { await ACC.signOut(); } catch (e) { /* offline: the session is dropped locally anyway */ } location.href = '../index.html'; },
    portal: el => { el.disabled = true; ACC.portal().catch(e => { el.disabled = false; toast(L('Не удалось открыть управление подпиской: ', 'Could not open the subscription page: ') + e.message); }); },
    syncNow: () => { syncNow().then(() => toast(SYNC.err ? L('Синхронизация не удалась', 'Sync failed') : L('Синхронизировано', 'Synced'))); },
    exportAccount: async () => {
      const acc = ACC ? await ACC.accountData() : null;
      download(`bedarev-math-my-data-${stamp()}.json`, JSON.stringify({ exported: new Date().toISOString(), account: acc, progress: S }, null, 1), 'application/json');
    },
    deleteAccount: async () => {
      if (!ask(L('Удалить аккаунт? Подписка будет отменена сразу, без возврата за оставшийся период. Это нельзя отменить.', 'Delete the account? The subscription is cancelled at once, with no refund for the rest of the period. This cannot be undone.'))) return;
      if (!ask(L('Точно удалить аккаунт навсегда?', 'Delete the account for good?'))) return;
      try { await ACC.deleteAccount(); } catch (e) { toast(L('Не удалось удалить аккаунт: ', 'Could not delete the account: ') + e.message); return; }
      if (ask(L('Аккаунт удалён. Стереть и прогресс в этом браузере?', 'The account is deleted. Erase the progress in this browser too?'))) { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
      location.href = '../index.html';
    },
    resetAll: () => { if (!ask('Удалить весь прогресс? Это нельзя отменить (если нет резервной копии).')) return; if (!ask('Точно удалить?')) return; S = fresh(); rebuild(); save(); applyTheme(); render(); toast('Прогресс удалён'); if (hasPlan('max')) ACC.sb.from('progress').delete().eq('user_id', ACC.user.id).then(() => { }); },
  };
  const BOOK_IDX = {}; BOOK_ORDER.forEach((id, i) => { BOOK_IDX[id] = i; });
  function orderList(ids, order) {
    if (order === 'random') return shuffle(ids.slice());
    if (order === 'chrono') return ids.slice().sort((a, b) => { const qa = QBY[a], qb = QBY[b]; if (qa && qb) return qa.year - qb.year || qa.paper - qb.paper || qa.q - qb.q; return (BOOK_IDX[a] ?? 0) - (BOOK_IDX[b] ?? 0); });
    if (order === 'weak') return shuffle(ids.slice()).sort((a, b) => ((C[a] || {}).lastConf || 0) - ((C[b] || {}).lastConf || 0));
    if (order === 'old') return shuffle(ids.slice()).sort((a, b) => ((C[a] || {}).last || { t: 0 }).t - ((C[b] || {}).last || { t: 0 }).t);
    return ids;
  }
  // after the textbook part of a study run, the topic's real exam questions finish it
  function examFinale(s) {
    if (s.examFinal) return; s.examFinal = true;
    const g = TG[s.study]; if (!g || !g.sec) return;
    const ts = topicState(g.sec), n = Math.max(0, ts.need - ts.good); if (!n) return;
    const qs = topicExam(g.sec).filter(q => ctxConf(q, g.sec) < 4);
    shuffle(qs.filter(q => !C[q.id])).concat(qs.filter(q => C[q.id]).sort((a, b) => C[a.id].lastConf - C[b.id].lastConf)).slice(0, n).forEach(q => s.qids.push(q.id));
  }
  function examFinalPanel(it) {
    const g = TG[S.session.study], ts = g && g.sec ? topicState(g.sec) : null, t = g && g.sec ? TOPIC[g.sec] : null;
    return `<div class="studybar exam"><div class="row"><b>Экзаменационный финал темы</b><span class="muted small">${esc(qTitle(it.q))} — настоящий вопрос с экзамена</span></div>
      <div class="tiny muted">${ts && t ? `Чтобы тема «${esc(t.s.n + ' ' + t.s.name)}» засчиталась изученной, нужно ${ts.need} ${plural(ts.need, 'экзаменационный вопрос', 'экзаменационных вопроса', 'экзаменационных вопросов')} по ней на 4–5. Сейчас: ${ts.good}. ` : ''}Можно оценить пункты отдельно — для темы считается оценка её пунктов.</div></div>`;
  }
  function bossResult(s) {
    const ch = TCH[s.boss]; if (!ch) return '';
    const st = chState(ch), B = BOSS[ch.key], sv = bossStateOf(st), dmg = Math.max(0, (s.bossHp0 != null ? s.bossHp0 : st.hp) - st.hp);
    return `<div class="bossres ${sv}" style="--bh:${B.h}">${bossArt(ch, 130, sv)}<div class="grow"><div class="boss-cap">${sv === 'alive' ? 'бой окончен' : CH_STATE[st.state]}</div><div class="mb-name">${esc(B.n)}</div>
      <div class="small" style="margin-top:6px">Урон за бой: <b>−${dmg} HP</b> · осталось ${st.hp}/${st.ex.length}</div>
      ${sv === 'alive' ? `<div class="tiny boss-hint" style="margin-top:6px">${st.hp ? `Для победы: все экзаменационные вопросы главы на 4–5${st.ts.done < st.ts.total ? `, темы главы ${st.ts.done}/${st.ts.total}` : ''}${st.revOk < st.revN ? `, повторение ${st.revOk}/${st.revN}` : ''}.` : `HP на нуле. Осталось: ${st.ts.done < st.ts.total ? `темы главы ${st.ts.done}/${st.ts.total}` : ''}${st.ts.done < st.ts.total && st.revOk < st.revN ? ', ' : ''}${st.revOk < st.revN ? `повторение на 4–5 ${st.revOk}/${st.revN}` : ''}.`}</div>` : ''}</div></div>`;
  }
  let hdrRank = -1;
  function headerRight() {
    const ts = topicSum(ALL_TOPICS), tt = $('#topTopics');
    if (tt) tt.innerHTML = `<a class="ttop" href="#book" title="Изучено тем: ${ts.done} из ${ts.total}, в процессе ${ts.prog}"><span>темы</span><b>${ts.done}/${ts.total}</b><span class="tbar-t">${topicTrack(ts)}</span></a>`;
    const ri = rankInfo(), tr_ = $('#topRank');
    // ranks are Pro: a free account sees the way to the plans instead
    if (tr_ && !hasPlan('pro')) { if (hdrRank !== 'up' + EN()) { hdrRank = 'up' + EN(); tr_.innerHTML = `<a class="upchip" href="../index.html#pricing">★ ${L('Перейти на Pro', 'Go Pro')}</a>`; } }
    else if (tr_ && hdrRank !== ri.r.i) { hdrRank = ri.r.i; tr_.innerHTML = `<a class="rchip" href="#stats" data-a="statsGo" data-v="ranks" title="${ri.xp} XP">${emblem(ri.r, 28, true)}<span>${esc(rankName(ri.r))}</span></a>`; }
    const lb = $('#langBtn'); if (lb) lb.innerHTML = `<b class="${EN() ? '' : 'on'}">RU</b><i></i><b class="${EN() ? 'on' : ''}">EN</b>`;
  }
  Object.assign(ACT, {
    vaultTab: el => { vaultTab = el.dataset.v; vaultLimit = 300; try { localStorage.setItem('lcm_vault_tab', vaultTab); } catch (e) { /* ignore */ } render(); },
    vf: el => { const f = el.dataset.field; let v = el.dataset.v; if (f === 'conf') v = +v; const a = VF[f]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); vaultLimit = 300; saveVF(); render(); },
    vfFlag: el => { const k = el.dataset.v; VF[k] = !VF[k]; vaultLimit = 300; saveVF(); render(); },
    vfReset: () => { const open = VF.open; VF = Object.assign({}, JSON.parse(JSON.stringify(VF_DEF)), { open }); vaultLimit = 300; saveVF(); render(); },
    vaultMore: () => { vaultLimit += 300; render(); },
    histMode: el => { histMode = el.dataset.v; render(); },
    filtToggle: () => { filtOpen = !filtOpen; render(); },
    doomGo: () => { const nt = nextTopic(); if (!nt) { go('book'); return; } if (nt.gid) ACT.study({ dataset: { g: nt.gid } }); else ACT.startCode({ dataset: { code: nt.t.code } }, { preventDefault() { }, stopPropagation() { } }); },
    builderGo: () => {
      const mode = $('#b-mode').value, order = $('#b-order').value, limit = Math.max(1, parseInt($('#b-limit').value, 10) || 10);
      const book = vaultTab === 'book';
      let ids = vaultIds();
      if (mode === 'all') ids = ids.filter(id => status(id) !== 'retired');
      if (mode === 'newdue') ids = ids.filter(id => ['new', 'due'].includes(status(id)));
      if (mode === 'new') ids = ids.filter(id => !C[id]);
      if (mode === 'due') ids = ids.filter(id => status(id) === 'due');
      if (mode === 'weak') ids = ids.filter(id => C[id] && C[id].lastConf <= 3);
      const names = { all: 'Подборка', newdue: 'Новые и повторение', new: 'Новые', due: 'Повторение', weak: 'Слабые', any: 'Подборка' };
      let t = '';
      if (book) { const n = VF.codes.length + VF.rev.length; t = VF.codes.length === 1 && !VF.rev.length ? ': ' + SEC[VF.codes[0]].n + ' ' + SEC[VF.codes[0]].name : n ? `: ${n} ${plural(n, 'раздел', 'раздела', 'разделов')}` : ' · учебники'; }
      else t = BF.codes.length === 1 ? ': ' + secShort(BF.codes[0]) + ' ' + SEC[BF.codes[0]].name : BF.codes.length ? `: ${BF.codes.length} ${plural(BF.codes.length, 'тема', 'темы', 'тем')}` : ' · экзамены';
      startSession(orderList(ids, order).slice(0, limit), names[mode] + t);
    },
    statsSrc: el => { statsSrc = el.dataset.v; render(); },
    statsGo: el => { statsTab = el.dataset.v || 'over'; closeModalSilently(); go('stats'); },
    setOpt: el => { const k = el.dataset.k, v = el.dataset.v; if (S.settings[k] === v) return; S.settings[k] = v; save(); if (k === 'lang') { location.reload(); return; } applyTheme(); render(); },
    lang: () => { S.settings.lang = EN() ? 'ru' : 'en'; save(); location.reload(); },
    startDueAll: () => { startSession(dueAll().slice(0, 40), 'Повторение: учебник и экзамены'); },
    startWeak: () => {
      const st = computeStats('all');
      const weak = st.items.filter(it => C[it.id] && C[it.id].lastConf <= 2 && status(it.id) !== 'retired').map(it => it.id);
      const topCodes = st.prio.slice(0, 3).map(p => p.code);
      const extra = shuffle(Q.filter(q => !weak.includes(q.id) && status(q.id) !== 'retired' && codesOf(q).some(c => topCodes.includes(c)) && (!C[q.id] || C[q.id].lastConf <= 3)).map(q => q.id));
      startSession(shuffle(weak).concat(extra).slice(0, 10), 'Слабые места');
    },
    bossFight: el => {
      const ch = TCH[el.dataset.ch]; if (!ch) return;
      if (!bossKnown(ch)) { toast('Босс ещё скрыт — пройдите учебник одной темы главы'); return; }
      const st = chState(ch), B = BOSS[ch.key];
      const open = st.ex.filter(q => st.exConf(q) < 4);
      const pick = open.length ? shuffle(open.filter(q => !chAtt(q, ch.key))).concat(open.filter(q => chAtt(q, ch.key)).sort((a, b) => st.exConf(a) - st.exConf(b))) : shuffle(st.ex.slice());
      startSession(pick.slice(0, 8).map(q => q.id), `☠ ${B.n} · глава ${ch.n}`, { boss: ch.key });
    },
    finalFight: (el, e) => {
      if (e) e.preventDefault();
      if (!finalOpen()) { toast('Финал ещё закрыт'); return; }
      if (!hasPlan('max')) { upsell('max', L('Бой с Экзаменатором', 'The fight with the Examiner')); return; }
      const F = finalOf(), d = today();
      if (F.seals[d] && !ask('Экзаменатор уже запечатан сегодня. Сразиться ещё раз — для тренировки?')) return;
      const ids = finalSet(); F.tries[d] = (F.tries[d] || 0) + 1;
      startSession(ids, `⛓ ${L('Экзаменатор', 'The Examiner')} · ${fmtDay(d)}`, { final: true });
    },
    scrollTo: el => { const t = document.getElementById(el.dataset.id); if (t) t.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'start' }); },
    conf: el => { R.conf = +el.dataset.v; R.confManual = true; R.iv = undefined; if (R.conf === 5) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); } render(); },
    study: el => {
      const gid = el.dataset.g;
      if (!hasPlan('pro')) { upsell('pro', L('Адаптивный режим изучения', 'The adaptive study mode')); return; }
      if (!STUDY[gid]) { toast(L('Загружаем режим изучения…', 'Loading the study mode…')); loadPaid().then(() => { if (STUDY[gid]) ACT.study(el); }); return; }
      if (el.dataset.restart || !S.study[gid]) {
        if (el.dataset.restart && !ask('Начать изучение темы заново? Прошлые попытки останутся в статистике.')) return;
        S.study[gid] = { t0: Date.now(), skips: [] };
        MEMO = {};
      }
      const g = TG[gid], sec = g.sec ? SEC[g.sec] : null;
      const nx = studyNext(studyState(gid));
      if (!nx) {
        save();
        const s0 = { study: gid, qids: [] }; examFinale(s0);
        if (s0.qids.length && sec) { startSession(s0.qids, `Экзамен по теме: ${sec.n} ${sec.name}`); return; }
        toast('Тема уже пройдена — её можно пройти заново'); render(); return;
      }
      startSession([nx.id], `Изучение: ${sec ? sec.n + ' ' + sec.name : groupTitle(g)}${g.part ? ' (' + g.part + ')' : ''}`, { study: gid });
    },
  });

  function closeModalSilently() { const m = $('#modal'); clearTimeout(closeModal.h); m.classList.remove('closing'); m.classList.add('hidden'); m.innerHTML = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.a];
    if (fn) { if (el.tagName === 'A') e.preventDefault(); fn(el, e); }
  });
  // form controls
  document.addEventListener('change', e => {
    const el = e.target; const f = el.dataset && el.dataset.f; if (!f) return;
    if (f === 'code') { const v = el.value; BF.codes = BF.codes.filter(x => x !== v); if (el.checked) BF.codes.push(v); saveBF(); render(); }
    if (f === 'chap') { const ch = CHAP[el.dataset.ch]; const codes = ch.sections.map(s => s.code); BF.codes = BF.codes.filter(x => !codes.includes(x)); if (el.checked) BF.codes.push(...codes.filter(c => Q.some(q => codesOf(q).includes(c)))); saveBF(); render(); }
    if (f === 'vcode' || f === 'vrev') { const k = f === 'vcode' ? 'codes' : 'rev', v = el.value; VF[k] = VF[k].filter(x => x !== v); if (el.checked) VF[k].push(v); vaultLimit = 300; saveVF(); render(); }
    if (f === 'vchap') { const ch = TCH[el.dataset.ch], codes = chTopics(ch); VF.codes = VF.codes.filter(x => !codes.includes(x)); VF.rev = VF.rev.filter(x => x !== ch.key); if (el.checked) { VF.codes.push(...codes); VF.rev.push(ch.key); } vaultLimit = 300; saveVF(); render(); }
    if (f === 'examDate') { S.settings.examDate = el.value; save(); }
    if (f === 'startDate') { S.settings.startDate = el.value; save(); render(); }
    if (f === 'topicSort') { topicSort = el.value; render(); }
    if (f === 'iv') { S.settings.iv[el.dataset.v] = Math.max(0, parseInt(el.value, 10) || 0); save(); }
    if (f === 'goal' || f === 'newPerDay') { S.settings[f] = Math.max(1, parseInt(el.value, 10) || 1); save(); }
    if (f === 'theme') { S.settings.theme = el.value; save(); applyTheme(); }
    if (f === 'imgw') { S.settings.imgw = +el.value; save(); render(); }
  });
  document.addEventListener('click', e => { if (e.target.matches && e.target.matches('summary input[type=checkbox]')) e.stopPropagation(); }, true);
  let textTimer;
  document.addEventListener('input', e => {
    const el = e.target, f = el.dataset && el.dataset.f;
    if (f === 'text' || f === 'vtext') {
      if (f === 'text') { BF.text = el.value; saveBF(); } else { VF.text = el.value; vaultLimit = 300; saveVF(); }
      clearTimeout(textTimer);
      textTimer = setTimeout(() => { const pos = el.selectionStart; render(); const n = $(`input[data-f="${f}"]`); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 250);
    }
  });
  // keyboard shortcuts in practice
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) { closeModal(); return; }
    if (view !== 'practice' || !R || !curQ() || !$('#modal').classList.contains('hidden')) return;
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-5]$/.test(e.key)) { R.conf = +e.key; R.confManual = true; R.iv = undefined; if (R.conf === 5) { const b = $('.confbtn[data-v="5"]'); if (b) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); } } render(); }
    else if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') { const it = curQ(); (!it.sol && it.csol ? ACT.toggleCs : ACT.toggleMs)(); }
    else if (e.key === 'Enter' && R.conf) { e.preventDefault(); saveAttempt(); }
  });
  window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); rebuild(); render(); } });
  // paid texts that live in Supabase: solutions (Pro) and lore (MAX), loaded once the plan allows
  async function loadPaid() {
    if (!ACC || !CLOUD) return;
    if (!hasPlan('pro')) { try { localStorage.removeItem('bm_study_cache'); } catch (e) { /* ignore */ } Object.keys(STUDY).forEach(k => delete STUDY[k]); }
    if (hasPlan('pro') && !Object.keys(STUDY).length) {
      const { data } = await ACC.sb.from('study_specs').select('gid, spec');
      (data || []).forEach(r => { STUDY[r.gid] = r.spec; });
      if (data && data.length) {
        MEMO = {}; render();
        try { localStorage.setItem('bm_study_cache', JSON.stringify({ uid: ACC.uidHint, data: STUDY })); } catch (e) { /* storage full */ }
      }
    }
    if (ACC.planKnown && !paidReady) { paidReady = true; MEMO = {}; render(); }
    if (hasPlan('pro') && !Object.keys(SOL).length) {
      const { data } = await ACC.sb.from('solutions').select('id, body');
      (data || []).forEach(r => { SOL[r.id] = r.body; });
      if (data && data.length) { render(); const cs = $('#modal #cs'); if (cs) { const b = $('#modal [data-a="pvTab"][data-v="cs"]'); if (b) previewBook(b.dataset.id); } }
    }
    if (hasPlan('max') && !Object.keys(LORE_DB).length) {
      const { data } = await ACC.sb.from('lore_notes').select('n, ru, en');
      (data || []).forEach(r => { LORE_DB[r.n] = { ru: r.ru, en: r.en }; });
      if (data && data.length && view === 'archive') render();
    }
  }
  if (ACC) {
    document.documentElement.classList.toggle('cloud', CLOUD);
    // a subscriber's study data from the last visit, so the page is right from the first paint
    if (CLOUD && hasPlan('pro')) { try { const c = JSON.parse(localStorage.getItem('bm_study_cache')); if (c && c.uid && c.uid === ACC.uidHint) Object.assign(STUDY, c.data); } catch (e) { /* none */ } }
    ACC.on(ev => {
      if (ev === 'SIGNED_OUT') { location.replace('../index.html#login'); return; }
      if (ev === 'plan' || ev === 'INITIAL_SESSION') { SUBS = null; MEMO = {}; hdrRank = -1; loadPaid(); syncNow(); render(); }
    });
    ACC.ready.then(sess => { if (!sess) location.replace('../index.html#login'); });
    ACC.afterCheckout((st, plan) => { SUBS = null; render(); toast(st === 'success' ? L(`Оплата прошла — тариф ${PLAN_LABEL[plan]} активен.`, `Payment done — ${PLAN_LABEL[plan]} is active.`) : L('Оплата отменена — ничего не списано.', 'Checkout cancelled — nothing was charged.')); });
    addEventListener('visibilitychange', () => { if (document.hidden && SYNC.t) { clearTimeout(SYNC.t); SYNC.t = null; syncNow(); } });
  }

  /* ================= ENGLISH MODE ================= */
  // The interface is written in Russian. In English mode every Russian phrase that reaches the page is replaced
  // from the dictionary in i18n.js (longest phrase first, whole words only). Textareas, inputs and the Russian
  // worked solutions ([data-notr]) are left untouched.
  const I18N = window.I18N_EN || {};
  const CYR = /[А-Яа-яЁё]/, isCyr = c => c >= 'А' && c <= 'я' || c === 'Ё' || c === 'ё', isLat = c => /[A-Za-z]/.test(c);
  const TRI = new Map();
  Object.keys(I18N).forEach(k => { const w = k.match(/^[А-Яа-яЁё]+/); if (!w) return; const a = TRI.get(w[0]) || []; a.push(k); TRI.set(w[0], a); });
  TRI.forEach(a => a.sort((x, y) => y.length - x.length));
  function tr(s) {
    if (!EN() || !s || !CYR.test(s)) return s;
    let out = '', i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (isCyr(ch) && (i === 0 || !isCyr(s[i - 1]))) {
        let j = i; while (j < s.length && isCyr(s[j])) j++;
        const cand = TRI.get(s.slice(i, j)); let hit = null;
        if (cand) for (const k of cand) { if (s.startsWith(k, i)) { const nx = s[i + k.length], last = k[k.length - 1]; if (!nx || !((isCyr(last) && isCyr(nx)) || (isLat(last) && isLat(nx)))) { hit = k; break; } } }
        if (hit) { out += I18N[hit]; i += hit.length; } else { out += s.slice(i, j); i = j; }
        continue;
      }
      out += ch; i++;
    }
    return out;
  }
  const ask = m => window.confirm(tr(m));
  const TR_SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
  function trText(n) { const p = n.parentNode; if (!p || TR_SKIP.has(p.nodeName) || (p.closest && p.closest('[data-notr]'))) return; const v = n.nodeValue; if (!CYR.test(v)) return; const o = tr(v); if (o !== v) n.nodeValue = o; }
  function trAttrs(el) { ['title', 'placeholder', 'aria-label', 'data-text'].forEach(a => { const v = el.getAttribute && el.getAttribute(a); if (v && CYR.test(v)) { const o = tr(v); if (o !== v) el.setAttribute(a, o); } }); }
  function trNode(root) {
    if (root.nodeType === 3) { trText(root); return; }
    // form fields keep what the user typed, but their placeholders and titles are translated
    const field = n => n.nodeName === 'INPUT' || n.nodeName === 'TEXTAREA';
    if (root.nodeType === 1 && field(root)) { trAttrs(root); return; }
    if (root.nodeType !== 1 || TR_SKIP.has(root.nodeName) || (root.closest && root.closest('[data-notr]'))) return;
    trAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => { if (n.nodeType !== 1) return NodeFilter.FILTER_ACCEPT; if (field(n)) trAttrs(n); return TR_SKIP.has(n.nodeName) || n.hasAttribute('data-notr') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) trText(n); else trAttrs(n); }
  }
  if (EN()) {
    document.documentElement.lang = 'en';
    new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') trText(m.target); else if (m.type === 'attributes') trAttrs(m.target); else m.addedNodes.forEach(trNode); }))
      .observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label', 'data-text'] });
    trNode(document.body);
  }
  // soft spotlight that follows the pointer over cards
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.card,.kpi,.big,.chapcard'); if (!c) return;
    const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  route();
})();
