/* bedarev math — landing page behaviour: language, reveal-on-scroll, the live countdown, the interactive demos
   (chapter tiers, bosses, the study engine, ranks, the product tour), pricing and the demo sign-in. */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const A = window.BM_ART, APP_EN = window.I18N_EN || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }, del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* ignore */ } } };

  /* ================= LANGUAGE ================= */
  // Russian is written in the page; English lives here. Keys are the elements' data-t.
  const EN = {
    nav_how: 'How it works', nav_path: 'The Path', nav_bosses: 'Bosses', nav_pricing: 'Pricing', nav_faq: 'FAQ', nav_login: 'Sign in', nav_start: 'Start', nav_app: 'Open the app',
    nav_how2: 'How it works', mm_login: 'Sign in', mm_start: 'Start', nav_path2: 'The Path', nav_bosses2: 'Bosses', nav_pricing2: 'Pricing',
    um_app: 'Open the app', um_plans: 'Choose a plan', um_logout: 'Sign out',
    hero_beta: 'Closed beta · Leaving Cert 2027', hero_h1: 'Leaving Cert maths.', hero_h2: 'As a game.',
    hero_lead: 'Every Higher Level paper from 2015–2026 and both Text&nbsp;&amp;&nbsp;Tests books — on one path of 22&nbsp;chapters. A boss waits at the end of each one, and its health is made of real exam questions.',
    hero_cta: 'Start for free', hero_cta2: 'See how it works', hero_until: 'until Paper 1', hero_t1: 'exam questions', hero_t2: 'textbook questions', hero_t3: 'topics',
    hf_boss: 'chapter 3 boss · revealed', hf_boss_n: 'Sine Serpent', hf_rank: 'new rank', hf_rank_n: 'Infinity', hf_full: 'Topic completed fully', hf_rep: 'review in 2 weeks',
    n1: 'exam questions, 2015–2026', n2: 'questions from Text &amp; Tests 4 and 5', n3: 'topics, each with its own progress', n4: 'chapters and 22 bosses', n5: 'ranks — from Graphite to Infinity', n6: 'final boss you cannot defeat',
    how_k: 'how it works', how_h: 'Three steps. Every day.', how_p: 'No more “read the chapter and hope”. Every topic goes the same way: learn it, prove it on a real exam, win.',
    s1_h: 'Learn the topic', s1_p: 'Study mode starts with the easiest question of each type and only gets harder after you succeed. Miss one — a step back. A topic is studied once its exercises are mastered.',
    s2_h: 'Prove it on the exam', s2_p: 'Real Paper 1 and Paper 2 questions on that topic, with the marking scheme. Rate your confidence from 1 to 5 — the app schedules the reviews.',
    s3_h: 'Beat the boss', s3_p: 'A chapter boss’s health is its exam questions. Every one solved at 4–5 deals damage. Zero HP and every topic studied — the boss falls.',
    path_k: 'the path', path_h: '22 chapters.<br>Five states each.', path_p: 'A chapter card grows with you: grey and locked at first, then in colour, then with its defeated boss in the background. Gold and crimson are for those who solve everything.',
    tt0: 'Hidden', tt1: 'Revealed', tt2: 'Defeated', tt3: 'Gold', tt4: 'Crimson',
    b_k: 'bosses', b_h: '22 bosses. Each with a story.', b_p: 'Polymorph wears every polynomial at once. The Null Hypothesis cannot be proven — only rejected. Who waits at the end of the hidden chapters you will find out after studying one topic. <b>Tap a “?”</b>.',
    d_k: 'try it right here', d_h: 'You answer honestly.<br>The app does the rest.', d_p: 'Rate how confidently you solved the question. Your answer decides what the next question is and when this one comes back for review.',
    d_l1: 'Difficulty only rises after a success', d_l2: 'Mistakes come back at the end of the topic', d_l3: 'Review intervals grow while you remember',
    dc_chip: 'Study · 1.5 Binomial expansions', dc_ask: 'How confidently did you solve it?', c1: 'Not solved', c2: 'With solution', c3: 'Partly', c4: 'Solved', c5: 'Confident', dc_hint: 'Pick an answer — see what happens next.',
    f_k: 'inside', f_h: 'Everything you need until June. Nothing you don’t.',
    f1_h: 'Spaced repetition', f1_p: 'Every question comes back exactly when you start to forget it.',
    f2_h: 'Adaptive study', f2_p: 'Question types in book order, difficulty from your answers.',
    f3_h: 'Marking schemes', f3_p: 'The official marking scheme next to every exam question.',
    f4_h: 'Worked proofs', f4_p: 'Step-by-step solutions to the “prove that” questions the book leaves out.',
    f5_h: 'Statistics', f5_p: 'Practice calendar, confidence by week, weak topics, exam readiness.',
    f6_h: 'Countdown', f6_p: 'Your pace since the first day of preparation and an honest forecast.',
    f7_h: 'History', f7_p: 'Every topic studied, every boss and rank — in a day-by-day chronicle.',
    f8_h: 'Lore', f8_p: '22 notes that open as you progress. Some are enciphered.',
    r_k: 'ranks', r_h: '32 ranks.<br>Each one wilder.', r_p: 'XP comes from every question solved, topic studied, boss defeated and achievement. The emblem changes with you — from a simple star to Infinity.',
    t_k: 'tour', t_h: 'See what it looks like.', t_p: 'Real screens of the app with demo progress.',
    tour1: 'Home', tour2: 'Path', tour3: 'Practice', tour4: 'Statistics', tour5: 'Countdown', tour6: 'Finale',
    c_k: 'countdown', c_h: 'Time left until the exam', c_p: 'Every day the countdown honestly shows whether you will make it: your pace since the first day of preparation, wasted days and a forecast of how many topics you will meet for the first time in the exam itself.',
    dt1: 'days wasted', dt2: 'topics a day needed', dt3: 'your pace', c_note: 'numbers from a demo profile',
    fb_k: 'finale · behind the last page', fb_h: 'The Examiner', fb_p: 'Turn all 22 chapters crimson — and he wakes up. He cannot be defeated. Only sealed, until midnight. Every day, all the way to June.',
    fb_c1: '3 exam questions', fb_c2: '5 of the hardest ●●●', fb_c3: '6 hits — the seal',
    lore_cap: 'note 3 / 22', lore_1: 'I wrote down what they whisper when they fall —', lore_2: 'so that only someone who steps back three paces can read it.', lore_3: 'WKHB DUH QRW PRQVWHUV. WKHB DUH VWXGHQWV.', lore_sig: '— N.', dc_diff: 'difficulty',
    lr_k: 'lore', lr_h: '22 notes.<br>One story.', lr_p: 'Someone walked this path before you and left notes behind. They turn up one by one — after defeated bosses. Some are enciphered. Can you read this one?',
    p_k: 'pricing', p_h: 'Start free. Grow when you want.', p_m: 'Monthly', p_y: 'Yearly',
    pf_s: 'to get started', per_forever: 'forever', pf1: 'Both books — all 22 chapters with answers', pf2: 'Exam papers 2015–2016 with marking schemes', pf3: 'Practice and spaced repetition', pf4: 'The chapter path and boss fights', pf5: 'Study mode, statistics and ranks', pf_b: 'Start for free', pf_in: 'Open the app', p_cur: 'Your plan', p_cur2: 'Your plan',
    pp_badge: 'most popular', pp_s: 'everything for the exam', pp_y: '€49 a year — save 32%', pp1: 'Adaptive study of every topic', pp2: 'All statistics, the forecast and the Countdown', pp3: 'Ranks, achievements and history', pp4: 'All 228 questions 2015–2026 + marking schemes', pp5: 'Worked solutions to 252 proof questions', pp6: 'Victory over all 22 bosses', pp_b: 'Choose Pro',
    pm_s: 'for those who go all the way', pm_y: '€99 a year — save 31%', pm1: 'Everything in Pro', pm2: 'The final boss — the Examiner', pm3: 'All 22 lore notes', pm4: 'Sync between devices', pm5: 'Timed mock exams', pm6: 'Early access to new features', pm_b: 'Choose Max',
    p_fine: 'Payments by Stripe. The subscription renews automatically and can be cancelled any time in your account — access stays until the end of the paid period.', p_test: 'Test mode: no money is taken. To try it, use the card 4242 4242 4242 4242, any future date and any CVC.',
    q_k: 'questions', q_h: 'FAQ',
    q1: 'What is bedarev math?', a1: 'A trainer for Leaving Certificate Higher Level Maths. Every paper from 2015–2026 and the questions from Text &amp; Tests 4 and 5 are gathered into one path by topic — with reviews, statistics and a game system that keeps you going.',
    q2: 'Where do the questions come from?', a2: 'From the official Paper 1 and Paper 2 exams of 2015–2026 with their marking schemes, and from the exercises and chapter revision of Text &amp; Tests 4 and 5. Every question is tagged by topic.',
    q3: 'When is a topic studied?', a3: 'When its exercises are mastered: the study run is finished or 60% of the questions are at 4–5. Solve every question of the topic and every exam question on it at 4–5 as well — and it is “★ completed fully”.',
    q4: 'Where is my progress stored?', a4: 'Your practice progress lives in your browser; with Max it also syncs between devices. Your account (email and subscription) is stored by Supabase in London. You can download or delete all of it in the app settings.',
    q5: 'Is this an official SEC product?', a5: 'No. bedarev math is an independent project and is not affiliated with the State Examinations Commission or the textbook publishers.',
    q6: 'Is it in English?', a6: 'Yes. Both the site and the app switch between English and Russian with one button.',
    q7: 'How do I cancel?', a7: 'Any time: Settings → “Manage subscription”. Access stays until the end of the paid period and nothing more is charged. Within 14 days of the first payment you can get your money back — just write to us.',
    z_h: 'An empty day stays empty forever.', z_p: 'The exam is in', z_p2: 'Start today.', z_b: 'Start for free',
    ft_p: 'Leaving Cert Higher Level Maths — as a game. Made by a student, for students.', ft_c1: 'Product', ft_l1: 'How it works', ft_l2: 'The Path', ft_l3: 'Pricing', ft_c2: 'Account', ft_l4: 'Sign in', ft_l5: 'Sign up', ft_l6: 'The app',
    lg1: 'Privacy', lg2: 'Terms of use', lg3: 'Cookies', lg4: 'Disclaimer', lg5: 'Not affiliated with the State Examinations Commission or textbook publishers. Exam material © State Examinations Commission.',
    m_login: 'Sign in', m_reg: 'Sign up', m_lsub: 'Sign in to continue your path.', m_email1: 'Email', m_pass: 'Password', m_forgot: 'Forgot password?', m_go: 'Sign in',
    m_rsub: 'The account is free: both books and the 2015–2016 papers open right away.', m_email: 'Email', m_pass2: 'Password — 8 characters or more', m_age: 'I am 16 or older', m_xsub: 'We will email you a link to set a new password.', m_email2: 'Email', m_xgo: 'Send the link', m_back: '← Back to sign in', m_nsub: 'Choose a new password for your account.', m_pass3: 'New password — 8 characters or more', m_ngo: 'Save the password',
    m_agree: 'I accept the <a href="legal/terms.html" target="_blank">terms</a> and the <a href="legal/privacy.html" target="_blank">privacy policy</a>', m_rgo: 'Create the account', m_welcome: 'Welcome back',
    ck_p: 'No advertising or analytics cookies — only what is needed: your sign-in and your progress in the browser.', ck_more: 'Details', ck_ok: 'Got it',
  };
  const RU0 = {};
  $$('[data-t]').forEach(el => { RU0[el.dataset.t] = el.innerHTML; });
  let LANG = store.get('bm_lang') || (() => { try { const s = JSON.parse(localStorage.getItem('lcm_state_v1')); if (s && s.settings && s.settings.lang) return s.settings.lang; } catch (e) { /* none */ } return 'en'; })(); // English unless the visitor chose Russian
  const T = (ru, en) => (LANG === 'en' ? en : ru);
  const appEn = s => (LANG === 'en' && APP_EN[s]) || s;
  const plural = (n, a, b, c) => { if (LANG === 'en') return n === 1 ? a : c; const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
  const fmtN = n => n.toLocaleString(LANG === 'en' ? 'en-US' : 'ru-RU');
  function applyLang(l) {
    LANG = l; store.set('bm_lang', l);
    document.documentElement.lang = l; document.documentElement.dataset.lang = l;
    $$('[data-t]').forEach(el => { const k = el.dataset.t; el.innerHTML = l === 'en' && EN[k] != null ? EN[k] : RU0[k]; });
    $('.glitch').dataset.text = T('Экзаменатор', 'The Examiner');
    document.title = T('bedarev math — Leaving Cert Maths как игра', 'bedarev math — Leaving Cert maths as a game');
    $$('.bcard.hid').forEach(c => { c.dataset.tap = T('нажми', 'tap'); });
    // keep the app in the same language
    try { const s = JSON.parse(localStorage.getItem('lcm_state_v1')); if (s && s.settings && s.settings.lang !== l) { s.settings.lang = l; localStorage.setItem('lcm_state_v1', JSON.stringify(s)); } } catch (e) { /* none */ }
    renderDynamic();
  }
  $('#langBtn').addEventListener('click', () => applyLang(LANG === 'en' ? 'ru' : 'en'));

  /* ================= SMALL UI ================= */
  let toastT;
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); };
  const nav = $('#nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 8);
    const h = document.documentElement.scrollHeight - innerHeight;
    $('#scrollbar').style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('#burger').addEventListener('click', () => nav.classList.toggle('menu'));
  $$('.mobmenu a,.links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('menu')));
  // the cursor spotlight and the hero's parallax
  let mx = 0, my = 0, raf = 0;
  const stage = $('#heroStage');
  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      document.documentElement.style.setProperty('--mx', mx + 'px'); document.documentElement.style.setProperty('--my', my + 'px');
      if (reduced || !stage) return;
      const r = stage.getBoundingClientRect(); if (r.bottom < 0) return;
      const dx = (mx - r.left - r.width / 2) / r.width, dy = (my - r.top - r.height / 2) / r.height;
      stage.querySelectorAll('[data-par]').forEach(el => { const k = +el.dataset.par; el.style.setProperty('--px', (dx * k).toFixed(1) + 'px'); el.style.setProperty('--py', (dy * k).toFixed(1) + 'px'); });
    });
  }, { passive: true });

  /* ================= REVEAL, COUNTERS, IDLE ================= */
  const counted = new WeakSet();
  function countUp(el) {
    if (counted.has(el)) return; counted.add(el);
    const to = +el.dataset.count, t0 = performance.now(), dur = reduced ? 1 : 1400;
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmtN(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    e.target.querySelectorAll('[data-count]').forEach(countUp);
  }), { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));
  // heavy sections pause their animations while off screen
  const idle = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('idle', !e.isIntersecting)), { rootMargin: '120px 0px' });
  $$('section,.marquee').forEach(s => idle.observe(s));

  /* ================= COUNTDOWN ================= */
  function examDate() {
    try { const s = JSON.parse(localStorage.getItem('lcm_state_v1')); const v = s && s.settings && s.settings.examDate; if (v) { const d = new Date(v + 'T09:00:00'); if (!isNaN(d)) return d; } } catch (e) { /* none */ }
    const n = new Date(), y = n.getMonth() >= 6 ? n.getFullYear() + 1 : n.getFullYear();
    return new Date(y, 5, 1, 9, 0, 0);
  }
  const EX = examDate();
  function tick() {
    const ms = Math.max(0, EX - Date.now()), s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p2 = v => String(v).padStart(2, '0');
    $$('[data-cd="short"]').forEach(el => { el.textContent = `${d} ${T('д', 'd')} ${p2(h)}:${p2(m)}:${p2(x)}`; });
    $$('[data-cd="long"]').forEach(el => { el.innerHTML = `${d}<small>${T('д', 'd')}</small>${p2(h)}<small>:</small>${p2(m)}<small>:</small>${p2(x)}`; });
    $$('[data-cd="days"]').forEach(el => { el.textContent = `${fmtN(d)} ${plural(d, T('день', 'day'), T('дня', 'days'), T('дней', 'days'))}`; });
  }
  tick(); setInterval(tick, 1000);

  /* ================= MARQUEE ================= */
  const years = []; for (let y = 2015; y <= 2026; y++) years.push(`<b>${y}</b> <em>Paper 1</em>`, `<b>${y}</b> <em>Paper 2</em>`);
  const topics = ['Algebra', 'Polynomials', 'Trigonometry', 'Coordinate Geometry', 'Probability', 'Geometry', 'Differential Calculus', 'Sequences & Series', 'Statistics', 'The Circle', 'Logarithms', 'Induction', 'Complex Numbers', 'Enlargements', 'Integration', 'Optimisation', 'Financial Maths', 'Area & Volume', 'Binomial Distribution', 'Functions & Graphs', 'Normal Distribution', 'Inferential Statistics'];
  $('#mqYears').innerHTML = (years.join(' · ') + ' · ').repeat(2);
  $('#mqTopics').innerHTML = (topics.join(' ✦ ') + ' ✦ ').repeat(2);

  /* ================= HERO ART ================= */
  $('#heroBoss').innerHTML = A.bossArt({ key: '1-3' }, 99, 'alive').replace(/width="99" height="99"/, 'width="72" height="72"');
  $('#heroRank').innerHTML = A.emblem(A.RANKS[31], 56);
  $('#finalArt').innerHTML = A.examinerArt(560, 'awake');

  /* ================= SCREENSHOTS ================= */
  const shot = name => `landing/shots/${LANG}/${name}.jpg`;
  function setShots() { $$('img[data-shot]').forEach(img => { if (img.id !== 'tourImg') img.src = shot(img.dataset.shot); }); }

  /* ================= CHAPTER TIERS ================= */
  const TIERS = [
    { ru: 'Пока ни одна тема главы не изучена, босс скрыт. Серая карточка, «???» вместо имени — и знак вопроса там, где он ждёт.', en: 'Until one topic of the chapter is studied, its boss stays hidden. A grey card, “???” instead of a name — and a question mark where it waits.' },
    { ru: 'Изучил учебник одной темы — босс раскрыт. Карточка оживает в его цвете, видно имя и здоровье: 29 HP = 29 вопросов с экзаменов.', en: 'Finish the textbook part of one topic — the boss is revealed. The card comes alive in its colour, with its name and health: 29 HP = 29 exam questions.' },
    { ru: 'Все темы изучены, повторение и экзаменационные вопросы на 4–5 — босс повержен и уходит на фон карточки.', en: 'Every topic studied, revision and exam questions at 4–5 — the boss is defeated and fades into the background of the card.' },
    { ru: 'Каждая задача главы на 4–5 — глава горит золотом. Такое видно издалека.', en: 'Every question in the chapter at 4–5 — the chapter burns gold. You can see it from across the room.' },
    { ru: 'Каждая задача главы на 5. Ни одной ошибки. Багровый — высшая форма.', en: 'Every question in the chapter at 5. Not one slip. Crimson is the highest form.' },
  ];
  let tier = 0, tierAuto = true, tierT;
  function renderTier() {
    const B = A.BOSS['1-2'], name = appEn(B.n), el = $('#ccDemo');
    const st = ['alive', 'alive', 'dead', 'gold', 'red'][tier];
    const art = tier === 0 ? A.bossSilhouette(250) : A.bossArt({ key: '1-2' }, tier === 1 ? 240 : 440, st);
    const tag = ['', '', T('☠ повержен', '☠ defeated'), T('◆ золото', '◆ gold'), T('✶ багровая', '✶ crimson')][tier];
    const topicsN = [0, 1, 10, 10, 10][tier], hp = ['?', '29/29', '0/29', '0/29', '0/29'][tier];
    let fx = ''; for (let j = 0; j < 16; j++) fx += `<i style="left:${(j * 37 + 11) % 100}%;animation-delay:${((j * 0.73) % 4).toFixed(2)}s;animation-duration:${(3 + (j % 4) * 0.8).toFixed(1)}s"></i>`;
    el.className = 'cc-demo t' + tier;
    el.innerHTML = `<div class="fx">${fx}</div><div class="cc-bg">${art}</div>
      <div><span class="cc-num">02</span>${tag ? `<span class="cc-tag">${tag}</span>` : ''}</div>
      <div><div class="cc-title">Algebra 2</div><div class="cc-bn">${tier === 0 ? T('??? · босс скрыт', '??? · boss hidden') : name}</div>
      <div class="cc-foot"><div class="cc-stat"><span>${T('темы', 'topics')}<b>${topicsN}/10</b></span><div class="cc-line"><i style="width:${topicsN * 10}%;background:${tier >= 3 ? 'linear-gradient(90deg,#d49300,#ffcf4d)' : 'linear-gradient(90deg,#2bd47d,#8ff0c0)'}"></i></div></div>
      <div class="cc-stat"><span>hp<b>${hp}</b></span><div class="cc-line"><i style="width:${tier === 1 ? 100 : tier === 0 ? 100 : 0}%;background:${tier === 0 ? 'rgba(255,255,255,.12)' : 'linear-gradient(90deg,#ff2a3d,#ff7a59)'}"></i></div></div></div></div>`;
    $$('#tierTabs button').forEach(b => b.classList.toggle('on', +b.dataset.tier === tier));
    $('#tierDesc').textContent = T(TIERS[tier].ru, TIERS[tier].en);
  }
  $$('#tierTabs button').forEach(b => b.addEventListener('click', () => { tierAuto = false; tier = +b.dataset.tier; renderTier(); }));
  const tierLoop = () => { clearTimeout(tierT); tierT = setTimeout(() => { if (tierAuto && !$('#path').classList.contains('idle')) { tier = (tier + 1) % 5; renderTier(); } tierLoop(); }, 2800); };
  tierLoop();

  /* ================= BOSS STRIP ================= */
  const KEYS = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10', '1-11', '1-12', '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9', '2-10'];
  const hidden = new Set(['1-8', '2-2', '2-5', '2-8', '1-11']);
  const bossCard = k => {
    const B = A.BOSS[k];
    if (hidden.has(k)) return `<div class="bcard hid" data-k="${k}" data-tap="${T('нажми', 'tap')}"><div class="ba">${A.bossSilhouette(150)}</div><b>???</b><small>${T('глава', 'chapter')} ${k.replace('-', '·')}</small></div>`;
    return `<div class="bcard" data-k="${k}" style="--h:${B.h}"><div class="ba">${A.bossArt({ key: k }, 99, 'alive').replace(/width="99" height="99"/, 'width="150" height="150"')}</div><b>${appEn(B.n)}</b><small>${appEn(B.t)}</small></div>`;
  };
  function renderStrip() {
    const r1 = KEYS.slice(0, 11).map(bossCard).join(''), r2 = KEYS.slice(11).map(bossCard).join('');
    $('#bossStrip').innerHTML = `<div class="bs-row">${r1}${r1}</div><div class="bs-row r2">${r2}${r2}</div>`;
  }
  $('#bossStrip').addEventListener('click', e => {
    const c = e.target.closest('.bcard.hid'); if (!c) return;
    hidden.delete(c.dataset.k);
    $$(`.bcard[data-k="${c.dataset.k}"]`).forEach(x => { x.outerHTML = bossCard(c.dataset.k); });
    $$(`.bcard[data-k="${c.dataset.k}"]`).forEach(x => x.classList.add('reveal'));
    toast(T(`Босс раскрыт: ${A.BOSS[c.dataset.k].n}`, `Boss revealed: ${appEn(A.BOSS[c.dataset.k].n)}`));
  });

  /* ================= STUDY DEMO ================= */
  const QS = { 1: 'Expand <b>(x + 2)³</b>.', 2: 'Find the coefficient of <b>x³</b> in the expansion of <b>(2x − 1)⁵</b>.', 3: 'Find the term independent of <b>x</b> in the expansion of <b>(x² − 2/x)⁶</b>.' };
  const IV = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
  let lvl = 1, busy = false;
  const dots = l => '●'.repeat(l) + '○'.repeat(3 - l);
  const ivName = d => (d === 1 ? T('завтра', 'tomorrow') : d === 7 ? T('через неделю', 'in a week') : d === 14 ? T('через 2 недели', 'in 2 weeks') : T(`через ${d} ${plural(d, 'день', 'дня', 'дней')}`, `in ${d} days`));
  function renderDemo() { $('#dQ').innerHTML = QS[lvl]; $('#dDiff').textContent = dots(lvl); }
  $('#dBtns').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || busy) return;
    busy = true;
    const c = +b.dataset.c;
    $$('#dBtns button').forEach(x => x.classList.toggle('on', x === b));
    const next = c >= 4 ? Math.min(3, lvl + 1) : c <= 2 ? Math.max(1, lvl - 1) : lvl;
    const move = c >= 4 ? (lvl === 3 ? `<span class="up">✓ ${T('Самый сложный уровень подтверждён — тип закрыт', 'Hardest level confirmed — this type is closed')}</span>` : `<span class="up">↑ ${T('Следующая задача сложнее', 'The next question is harder')}: ${dots(next)}</span>`)
      : c <= 2 ? `<span class="dn">↓ ${T('Шаг назад — задача попроще', 'A step back — an easier question')}: ${dots(next)}. ${T('Эта вернётся в конце темы.', 'This one comes back at the end of the topic.')}</span>`
      : `<span>→ ${T('Ещё одна задача того же уровня', 'One more question at the same level')}: ${dots(next)}</span>`;
    $('#dOut').classList.add('on');
    $('#dOut').innerHTML = `<div class="row">${move}<span>↻ ${T('Повтор', 'Review')}: <b>${ivName(IV[c])}</b></span></div>`;
    setTimeout(() => {
      $('#dQ').classList.add('swap');
      setTimeout(() => { lvl = c >= 4 && lvl === 3 ? 1 : next; renderDemo(); $('#dQ').classList.remove('swap'); $$('#dBtns button').forEach(x => x.classList.remove('on')); busy = false; }, 300);
    }, 1400);
  });

  /* ================= RANKS ================= */
  const rankOf = t => A.RANKS[t < 10 ? t * 3 + 2 : t === 10 ? 30 : 31];
  let rk = 0, rkAuto = true;
  function renderRank() {
    const r = rankOf(rk), Tt = r.T;
    $('#rkEmb').innerHTML = A.emblem(r, 260);
    $('#rkName').textContent = appEn(Tt.n);
    $('#rkName').style.color = Tt.c[0] === '#ffffff' && rk === 11 ? '#fff' : Tt.c[0];
    $('#rkName').style.textShadow = `0 0 40px ${Tt.g}`;
    $('#rkGlow').style.setProperty('--g', rk === 11 ? '#8a5cff' : Tt.g);
    $('#rkXp').textContent = `${fmtN(r.xp)} XP`;
    $('#rkRange').value = rk;
    $('#rkDots').innerHTML = A.RANK_TIERS.map((x, j) => `<i style="${j <= rk ? `background:${x.g};box-shadow:0 0 10px ${x.g}` : ''}"></i>`).join('');
  }
  $('#rkRange').addEventListener('input', e => { rkAuto = false; rk = +e.target.value; renderRank(); });
  setInterval(() => { if (rkAuto && !$('#ranks').classList.contains('idle')) { rk = (rk + 1) % 12; renderRank(); } }, 1700);

  /* ================= TOUR ================= */
  let tourIdx = 0, tourAuto = true;
  const tabs = $$('#tourTabs button');
  function showTour(i) {
    tourIdx = i; tabs.forEach((b, j) => b.classList.toggle('on', j === i));
    const img = $('#tourImg'), scr = $('#tourScreen');
    img.classList.add('out'); scr.classList.remove('pan');
    setTimeout(() => {
      img.onload = () => { img.classList.remove('out'); if (img.naturalHeight / img.naturalWidth > 0.7) setTimeout(() => scr.classList.add('pan'), 700); };
      img.src = shot(tabs[i].dataset.shot);
    }, 260);
  }
  tabs.forEach((b, i) => b.addEventListener('click', () => { tourAuto = false; showTour(i); }));
  setInterval(() => { if (tourAuto && !$('#tour').classList.contains('idle')) showTour((tourIdx + 1) % tabs.length); }, 6500);

  /* ================= PRICING ================= */
  let yearly = false;
  function renderPrices() {
    $('.plans').classList.toggle('yearly', yearly);
    $$('[data-price]').forEach(el => { const [m, y] = el.dataset.price.split('|'); el.textContent = '€' + (yearly ? y : m); });
    $$('[data-per]').forEach(el => { el.textContent = yearly ? T('/год', '/year') : T('/мес', '/month'); });
  }
  $$('#billing button').forEach(b => b.addEventListener('click', () => { yearly = b.dataset.b === 'y'; $$('#billing button').forEach(x => x.classList.toggle('on', x === b)); renderPrices(); }));
  $('.fine').classList.toggle('test', BM.test);

  /* ================= ACCOUNT (Supabase Auth) and PLANS (Stripe Checkout) ================= */
  const PLAN_NAME = { free: 'Free', pro: 'Pro', max: 'Max', none: '' };
  const authErr = e => {
    const m = String((e && e.message) || e || '');
    if (/invalid login credentials/i.test(m)) return T('Неверная почта или пароль.', 'Wrong email or password.');
    if (/email not confirmed/i.test(m)) return T('Сначала подтверди почту — ссылка в письме.', 'Confirm your email first — the link is in the message.');
    if (/already registered|already been registered/i.test(m)) return T('Такой аккаунт уже есть — войди.', 'This account already exists — sign in.');
    if (/rate limit|security purposes|too many/i.test(m)) return T('Слишком много попыток. Попробуй через минуту.', 'Too many attempts. Try again in a minute.');
    if (/password/i.test(m) && /least|short|weak/i.test(m)) return T('Пароль слишком простой: нужно от 8 символов.', 'The password is too weak: use 8 characters or more.');
    return m || T('Что-то пошло не так. Попробуй ещё раз.', 'Something went wrong. Try again.');
  };
  const pending = {
    get: () => { try { return JSON.parse(store.get('bm_pending')); } catch (e) { return null; } },
    set: v => store.set('bm_pending', JSON.stringify(v)),
    del: () => store.del('bm_pending'),
  };
  function syncAuth() {
    const u = BM.user; document.body.classList.toggle('authed', !!u);
    if (u) {
      const name = u.email || '';
      $('#umName').textContent = name; $('#avatar').title = name;
      $$('.avatar span').forEach(s => { s.textContent = (name[0] || '·').toUpperCase(); });
      $('#umPlan').textContent = PLAN_NAME[BM.plan] || 'Free';
      $('#umBilling').textContent = BM.has('pro') ? T('Управлять подпиской', 'Manage subscription') : T('Выбрать тариф', 'Choose a plan');
    }
    $$('[data-plan]').forEach(b => {
      const cur = !!u && b.dataset.plan !== 'free' && b.dataset.plan === BM.plan;
      b.classList.toggle('current', cur); b.disabled = cur;
    });
  }
  async function goCheckout(plan, interval, btn) {
    if (btn) btn.classList.add('busy');
    try { await BM.checkout(plan, interval); } catch (e) {
      if (btn) btn.classList.remove('busy');
      toast(T('Не удалось открыть оплату: ', 'Could not open the checkout: ') + e.message);
    }
  }
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => {
    const plan = b.dataset.plan, interval = yearly ? 'year' : 'month';
    if (plan === 'free') { if (BM.user) location.href = 'app/index.html'; else openAuth('register'); return; }
    if (!BM.user) {
      pending.set({ plan, interval });
      openAuth('register');
      toast(T(`Сначала аккаунт — потом сразу оплата ${PLAN_NAME[plan]}.`, `Account first — then straight to ${PLAN_NAME[plan]} checkout.`));
      return;
    }
    goCheckout(plan, interval, b);
  }));
  $('#umBilling').addEventListener('click', e => {
    if (!BM.has('pro')) return; // a plain link to the pricing section
    e.preventDefault(); $('#usermenu').classList.remove('open');
    BM.portal().catch(err => toast(T('Не удалось открыть управление подпиской: ', 'Could not open the subscription page: ') + err.message));
  });

  const modal = $('#auth');
  function openAuth(tab) {
    modal.classList.remove('closing'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    setTab(tab || 'login');
    setTimeout(() => { const f = modal.querySelector('.m-pane.on input'); if (f) f.focus(); }, 80);
  }
  function closeAuth() {
    if (!modal.classList.contains('open')) return;
    modal.classList.add('closing');
    setTimeout(() => { modal.classList.remove('open', 'closing'); modal.setAttribute('aria-hidden', 'true'); $('#mSuccess').classList.remove('on'); }, 280);
    if (/^#(login|register)$/.test(location.hash)) history.replaceState(null, '', location.pathname);
  }
  function setTab(t) {
    $$('.m-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    $('.m-tabs').classList.toggle('reg', t === 'register');
    modal.querySelector('.m-box').classList.toggle('solo', t === 'reset' || t === 'newpass');
    $$('.m-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === t));
    $$('.m-err,.m-ok').forEach(x => { x.textContent = ''; x.classList.remove('on'); });
  }
  const shake = () => { const box = modal.querySelector('.m-box'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); };
  const working = (f, on) => { const b = f.querySelector('[type=submit]'); b.disabled = on; b.classList.toggle('busy', on); };
  // signed in: straight to the checkout that was chosen before, or into the app with the wipe animation
  function enter(from) {
    const p = pending.get();
    if (p) { pending.del(); closeAuth(); toast(T('Открываем оплату…', 'Opening the checkout…')); goCheckout(p.plan, p.interval); return; }
    $('#msUser').textContent = BM.user ? BM.user.email : ''; $('#mSuccess').classList.add('on');
    const w = $('#wipe'), r = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    w.style.setProperty('--wx', (r.left + r.width / 2) + 'px'); w.style.setProperty('--wy', (r.top + r.height / 2) + 'px');
    setTimeout(() => w.classList.add('on'), 650);
    setTimeout(() => { location.href = 'app/index.html'; }, 1400);
  }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); nav.classList.remove('menu'); if (BM.user && o.dataset.open === 'register') { location.href = 'app/index.html'; return; } openAuth(o.dataset.open); return; }
    if (e.target.closest('[data-close]')) closeAuth();
    const tb = e.target.closest('.m-tabs button'); if (tb) setTab(tb.dataset.tab);
    const tg = e.target.closest('[data-tab-go]'); if (tg) { e.preventDefault(); setTab(tg.dataset.tabGo); }
    const eye = e.target.closest('.eye'); if (eye) { const i = eye.closest('.pw').querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; }
    if (!e.target.closest('#avatar') && !e.target.closest('#usermenu')) $('#usermenu').classList.remove('open');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeAuth(); });
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target; working(f, true); $('#loginErr').textContent = '';
    const { error } = await BM.signIn(f.email.value.trim(), f.pass.value);
    working(f, false);
    if (error) { $('#loginErr').textContent = authErr(error); shake(); return; }
    enter(f.querySelector('[type=submit]'));
  });
  $('#regForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target; working(f, true); $('#regErr').textContent = '';
    const email = f.email.value.trim();
    const { data, error } = await BM.signUp(email, f.pass.value, { age16: true, terms: true, lang: LANG });
    working(f, false);
    if (error) { $('#regErr').textContent = authErr(error); shake(); return; }
    if (data && data.session) { enter(f.querySelector('[type=submit]')); return; }
    const ok = $('#regOk');
    ok.textContent = T(`Готово! Мы отправили письмо на ${email}. Открой ссылку в нём, чтобы подтвердить почту — и сразу попадёшь внутрь.`, `Done! We sent a message to ${email}. Open the link in it to confirm your email — and you are in.`);
    ok.classList.add('on'); f.reset();
  });
  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target; working(f, true); $('#resetErr').textContent = '';
    const { error } = await BM.resetPassword(f.email.value.trim());
    working(f, false);
    if (error) { $('#resetErr').textContent = authErr(error); return; }
    const ok = $('#resetOk'); ok.textContent = T('Если такой аккаунт есть, письмо со ссылкой уже в пути.', 'If the account exists, the email with the link is on its way.'); ok.classList.add('on');
  });
  $('#newpassForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target; working(f, true); $('#newErr').textContent = '';
    const { error } = await BM.updatePassword(f.pass.value);
    working(f, false);
    if (error) { $('#newErr').textContent = authErr(error); shake(); return; }
    toast(T('Пароль обновлён.', 'Password updated.')); enter(f.querySelector('[type=submit]'));
  });
  $('#avatar').addEventListener('click', () => $('#usermenu').classList.toggle('open'));
  $('#logout').addEventListener('click', async () => { await BM.signOut(); syncAuth(); $('#usermenu').classList.remove('open'); toast(T('Вы вышли из аккаунта.', 'You are signed out.')); });
  BM.on(ev => {
    syncAuth();
    if (ev === 'PASSWORD_RECOVERY') openAuth('newpass');
    // back from the confirmation email: continue to the chosen checkout, or into the app
    if (ev === 'SIGNED_IN' && /[?&]welcome=1/.test(location.search)) { history.replaceState(null, '', location.pathname); enter(); }
  });
  BM.ready.then(syncAuth);
  BM.afterCheckout((st, plan) => {
    syncAuth();
    toast(st === 'success' ? T(`Оплата прошла. Тариф ${PLAN_NAME[plan] || ''} активен — открывай приложение.`, `Payment done. ${PLAN_NAME[plan] || ''} is active — open the app.`) : T('Оплата отменена — ничего не списано.', 'Checkout cancelled — nothing was charged.'));
  });

  /* ================= COOKIE NOTICE ================= */
  if (!store.get('bm_cookie')) setTimeout(() => $('#cookie').classList.add('on'), 1500);
  $('#cookieOk').addEventListener('click', () => { store.set('bm_cookie', '1'); $('#cookie').classList.remove('on'); });

  /* ================= BOOT ================= */
  function renderDynamic() { setShots(); renderTier(); renderStrip(); renderDemo(); renderRank(); renderPrices(); showTour(tourIdx); tick(); syncAuth(); }
  applyLang(LANG);
  syncAuth();
  if (/^#(login|register)$/.test(location.hash)) openAuth(location.hash.slice(1));
})();
