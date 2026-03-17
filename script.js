// 1. Глобальный перевод (кроме navbar)
const portfolioTitle = document.getElementById('portfolio-title');
const portfolioText = document.getElementById('portfolio-text');
const langItems = document.querySelectorAll('.dropdown-item');
const mobileLangPills = document.querySelectorAll('.mobile-lang-pill');

const appTranslations = {
    en: {
        'hero.portfolio': 'Portfolio',
        'about.title': 'About Me',
        'about.body': 'My name is Myron Bedarev, a 16-year-old student currently based at Newtown School in Waterford, Ireland. Of Russian and Ukrainian descent, I have grown up navigating four languages—Russian, Ukrainian, English, and German—which has given me a unique global perspective and a natural ability to adapt to diverse environments. My academic focus is currently driven by a clear ambition: to study Management Science and Information Systems Studies (MSISS) at Trinity College Dublin. I am fascinated by the intersection of data, technology, and strategic decision-making, and I aim to leverage my multicultural background and analytical mindset to solve complex challenges in the world of modern business and systems.',
        'about.foot': 'Scroll to the end to return',
        'contact.title': 'Contact',
        'contact.noForms': 'No forms',
        'contact.directLinks': 'Direct links',
        'contact.copy': 'Copy available',
        'contact.bottom': 'Click links to open. Use Copy to grab text.',
        'languages.title': 'Languages',
        'education.title': 'Education',
        'education.kicker': 'Newtown School · Waterford',
        'education.year': 'Year 5',
        'education.sub': 'Academic focus',
        'education.desc': 'Higher Math — proof, rigor, structure.'
    },
    ru: {
        'hero.portfolio': 'Портфолио',
        'about.title': 'Обо мне',
        'about.body': 'Меня зовут Майрон Бедарев, мне 16 лет, сейчас я учусь в Newtown School в Уотерфорде, Ирландия. По происхождению я наполовину русский, наполовину украинец и вырос на четырёх языках — русском, украинском, английском и немецком. Это дало мне необычную перспективу и привычку быстро адаптироваться к разным средам. Сейчас мой академический фокус связан с одной чёткой целью: поступить на Management Science and Information Systems Studies (MSISS) в Trinity College Dublin. Меня интересует пересечение данных, технологий и управленческих решений; я хочу использовать свой мультикультурный бэкграунд и аналитическое мышление, чтобы решать сложные задачи в современном мире бизнеса и систем.',
        'about.foot': 'Прокрути до конца, чтобы вернуть Portfolio',
        'contact.title': 'Контакты',
        'contact.noForms': 'Без форм',
        'contact.directLinks': 'Прямые ссылки',
        'contact.copy': 'Копирование доступно',
        'contact.bottom': 'Жми по ссылкам или используй Copy, чтобы скопировать.',
        'languages.title': 'Языки',
        'education.title': 'Образование',
        'education.kicker': 'Newtown School · Уотерфорд',
        'education.year': '5 класс (Year 5)',
        'education.sub': 'Академический фокус',
        'education.desc': 'Higher Math — доказательства, строгость, структура.'
    },
    uk: {
        'hero.portfolio': 'Портфоліо',
        'about.title': 'Про мене',
        'about.body': 'Мене звати Майрон Бедарєв, мені 16 років, зараз я навчаюся в Newtown School у Вотерфорді, Ірландія. Походжу з російсько‑української родини і з дитинства живу в чотирьох мовах — українській, російській, англійській та німецькій. Це дало мені глобальний погляд і вміння швидко адаптуватися до різних середовищ. Мій навчальний фокус зараз пов’язаний з чіткою метою: вступити на Management Science and Information Systems Studies (MSISS) в Trinity College Dublin. Мене цікавить перетин даних, технологій та управлінських рішень, і я хочу використати свій мультикультурний досвід та аналітичне мислення, щоб розв’язувати складні задачі сучасних систем.',
        'about.foot': 'Прокрути до кінця, щоб повернутися до Portfolio',
        'contact.title': 'Контакти',
        'contact.noForms': 'Без форм',
        'contact.directLinks': 'Прямі посилання',
        'contact.copy': 'Копіювання доступне',
        'contact.bottom': 'Натискай на посилання або використовуй Copy, щоб скопіювати.',
        'languages.title': 'Мови',
        'education.title': 'Освіта',
        'education.kicker': 'Newtown School · Waterford',
        'education.year': 'Year 5',
        'education.sub': 'Академічний фокус',
        'education.desc': 'Higher Math — доведення, строгість, структура.'
    },
    de: {
        'hero.portfolio': 'Portfolio',
        'about.title': 'Über mich',
        'about.body': 'Ich heiße Myron Bedarev, bin 16 Jahre alt und besuche derzeit die Newtown School in Waterford, Irland. Mit russisch‑ukrainischen Wurzeln bin ich mit vier Sprachen aufgewachsen – Russisch, Ukrainisch, Englisch und Deutsch. Das gibt mir eine globale Perspektive und die Fähigkeit, mich schnell an unterschiedliche Umgebungen anzupassen. Mein aktueller akademischer Fokus ist klar: Management Science and Information Systems Studies (MSISS) am Trinity College Dublin zu studieren. Mich fasziniert die Schnittstelle von Daten, Technologie und strategischen Entscheidungen, und ich möchte meinen multikulturellen Hintergrund und meine analytische Denkweise nutzen, um komplexe Probleme in modernen Systemen zu lösen.',
        'about.foot': 'Scrolle bis zum Ende, um zu Portfolio zurückzukehren',
        'contact.title': 'Kontakt',
        'contact.noForms': 'Keine Formulare',
        'contact.directLinks': 'Direkte Links',
        'contact.copy': 'Kopieren möglich',
        'contact.bottom': 'Links anklicken oder Copy verwenden, um zu kopieren.',
        'languages.title': 'Sprachen',
        'education.title': 'Ausbildung',
        'education.kicker': 'Newtown School · Waterford',
        'education.year': 'Year 5',
        'education.sub': 'Akademischer Fokus',
        'education.desc': 'Higher Math — Beweise, Strenge, Struktur.'
    },
    jp: {
        'hero.portfolio': 'ポートフォリオ',
        'about.title': '自己紹介',
        'about.body': '私の名前は Myron Bedarev、16 歳で、現在アイルランド・ウォーターフォードの Newtown School に在学しています。ロシアとウクライナのルーツを持ち、幼い頃からロシア語、ウクライナ語、英語、ドイツ語の四言語の中で育ってきました。その経験のおかげで、多様な環境に適応しながら物事を多方面から見る視点を身につけました。現在の明確な目標は、Trinity College Dublin の Management Science and Information Systems Studies (MSISS) に進学することです。データとテクノロジー、そして意思決定の交差点に強い興味があり、このバックグラウンドと分析的思考を生かして、現代のビジネスとシステムにおける複雑な課題に取り組みたいと考えています。',
        'about.foot': '最後までスクロールすると Portfolio に戻れます',
        'contact.title': '連絡先',
        'contact.noForms': 'フォームなし',
        'contact.directLinks': 'ダイレクトリンク',
        'contact.copy': 'コピーが可能',
        'contact.bottom': 'リンクをクリック、または Copy でテキストをコピーしてください。',
        'languages.title': '言語',
        'education.title': '学歴',
        'education.kicker': 'Newtown School · Waterford',
        'education.year': 'Year 5',
        'education.sub': '学習フォーカス',
        'education.desc': 'Higher Math — 証明・厳密さ・構造。'
    }
};

function applyLanguage(lang) {
    const dict = appTranslations[lang] || appTranslations.en;
    document.documentElement.dataset.lang = lang;
    localStorage.setItem('app-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = dict[key] || appTranslations.en[key];
        if (!value) return;
        if (el === portfolioText && portfolioTitle) {
            portfolioTitle.classList.add('text-changing');
            setTimeout(() => {
                el.textContent = value;
                portfolioTitle.classList.remove('text-changing');
            }, 300);
        } else {
            el.textContent = value;
        }
    });

    // sync desktop dropdown
    langItems.forEach(item => {
        const active = item.getAttribute('data-lang') === lang;
        item.classList.toggle('active', active);
    });
    // sync mobile pills
    mobileLangPills.forEach(btn => {
        const active = btn.getAttribute('data-lang') === lang;
        btn.classList.toggle('active', active);
    });
}

const storedLang = localStorage.getItem('app-lang') || 'en';
applyLanguage(storedLang);

langItems.forEach(item => {
    item.addEventListener('click', () => {
        const lang = item.getAttribute('data-lang');
        if (!lang) return;
        applyLanguage(lang);
    });
});

mobileLangPills.forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (!lang) return;
        applyLanguage(lang);
    });
});

// 1b. Hero: Portfolio -> About Me toggle
const heroSection = document.getElementById('hero');
const aboutPanel = document.getElementById('about-panel');

function setAboutMode(on) {
    if (!heroSection || !portfolioTitle || !aboutPanel) return;
    heroSection.classList.toggle('about-mode', on);
    portfolioTitle.setAttribute('aria-expanded', on ? 'true' : 'false');
    aboutPanel.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) {
        aboutPanel.scrollTop = 0;
        if (typeof aboutPanel.focus === 'function') aboutPanel.focus();
    }
}

function toggleAboutMode() {
    if (!heroSection) return;
    setAboutMode(!heroSection.classList.contains('about-mode'));
}

if (portfolioTitle) {
    portfolioTitle.addEventListener('click', toggleAboutMode);
    portfolioTitle.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggleAboutMode();
    });
}

if (aboutPanel) {
    // No auto-close on scroll: close only when user actually leaves the Hero section intentfully.
}

// About scroll uses native scrolling (no wheel interception).

// 2. Бургер-меню
const burger = document.getElementById('burger-menu');
const overlay = document.getElementById('mobile-overlay');
const navbar = document.querySelector('.navbar');
const logo = document.querySelector('.logo-nav');

function setMobileMenu(open) {
    burger.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
}

burger.addEventListener('click', () => {
    const open = !overlay.classList.contains('active');
    setMobileMenu(open);
});

// 3. Плавный скролл
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        setMobileMenu(false);
        document.body.style.overflow = 'auto';
        window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    });
});

// Redirect to 404 if hash target doesn't exist
function validateHashTarget() {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace('#', '');
    if (!id) return;
    const target = document.getElementById(id);
    if (target) return;
    const from = encodeURIComponent(window.location.href);
    window.location.replace(`404.html?from=${from}`);
}
window.addEventListener('hashchange', validateHashTarget);
window.addEventListener('DOMContentLoaded', validateHashTarget);

// 4. ИСПРАВЛЕННАЯ ИНВЕРСИЯ НАВБАРА
const sections = document.querySelectorAll('section');
const observerOptions = {
    // threshold 0.6 означает, что секция должна занимать 60% экрана для срабатывания
    threshold: 0.91
};

const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    if (!visible.length) return;
    visible.sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
    const id = visible[0].target.id;
    const isDark = ['contact', 'education'].includes(id);

    if (isDark) {
        navbar.classList.add('inverted');
        logo.src = 'logo-small-black.png';
    } else {
        navbar.classList.remove('inverted');
        logo.src = 'logo-small.png';
    }
}, observerOptions);

sections.forEach(s => observer.observe(s));

// Sidenav: choose section by viewport center (prevents early color flips)
const sidenav = document.querySelector('.sidenav');
const sidenavItems = document.querySelectorAll('.sidenav-item[data-sidenav]');
const sectionList = Array.from(sections);

function setSidenavActive(id) {
    sidenavItems.forEach((item) => {
        const active = item.getAttribute('data-sidenav') === id;
        item.classList.toggle('active', active);
    });
}

function setSidenavInverted(inverted) {
    if (!sidenav) return;
    sidenav.classList.toggle('inverted', inverted);
}

function getSectionAtCenter() {
    const centerY = window.innerHeight * 0.50;
    for (const s of sectionList) {
        const r = s.getBoundingClientRect();
        if (r.top <= centerY && r.bottom >= centerY) return s;
    }
    // fallback: nearest by distance to center
    let best = null;
    let bestDist = Infinity;
    for (const s of sectionList) {
        const r = s.getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        const d = Math.abs(mid - centerY);
        if (d < bestDist) {
            bestDist = d;
            best = s;
        }
    }
    return best;
}

let sidenavRaf = null;
function updateSidenavState() {
    sidenavRaf = null;
    const s = getSectionAtCenter();
    if (!s) return;
    const id = s.id;
    const isDark = ['contact', 'education'].includes(id);

    if (sidenav) {
        setSidenavActive(id);
        setSidenavInverted(isDark);
    }

    // Keep navbar inversion in sync with actual center section (fixes back-scroll bug)
    if (isDark) {
        navbar.classList.add('inverted');
        logo.src = 'logo-small-black.png';
    } else {
        navbar.classList.remove('inverted');
        logo.src = 'logo-small.png';
    }
}

function scheduleSidenavUpdate() {
    if (sidenavRaf) return;
    sidenavRaf = requestAnimationFrame(updateSidenavState);
}

window.addEventListener('scroll', scheduleSidenavUpdate, { passive: true });
window.addEventListener('resize', scheduleSidenavUpdate);
scheduleSidenavUpdate();

// 5. Частицы для раздела Plans
const plansLink = document.querySelector('.plans');
plansLink.addEventListener('mousemove', (e) => {
    createParticles(e.pageX, e.pageY);
});

function createParticles(xPos, yPos) {
    const count = 3; // Ограничим количество за одно движение для производительности
    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.innerText = '?';
        p.className = 'question-particle';
        if (navbar.classList.contains('inverted')) p.classList.add('inverted');
        
        p.style.left = xPos + 'px';
        p.style.top = yPos + 'px';
        
        const xDir = (Math.random() - 0.5) * 150;
        const yDir = (Math.random() - 0.5) * 150;
        
        p.style.setProperty('--x', xDir + 'px');
        p.style.setProperty('--y', yDir + 'px');
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
}

// 6. Copy-to-clipboard for Contact section
const contactToast = document.querySelector('.contact-toast');
let contactToastTimer = null;

function showContactToast(text) {
    if (!contactToast) return;
    contactToast.textContent = text;
    contactToast.classList.add('show');
    if (contactToastTimer) clearTimeout(contactToastTimer);
    contactToastTimer = setTimeout(() => {
        contactToast.classList.remove('show');
    }, 1300);
}

async function copyTextToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {}
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    } catch (_) {
        return false;
    }
}

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.contact-copy');
    if (!btn) return;
    const text = btn.getAttribute('data-copy') || '';
    if (!text) return;
    const ok = await copyTextToClipboard(text);
    showContactToast(ok ? `Copied: ${text}` : 'Copy failed');
});

// 7b. Education: focus selector (Higher / Applied / Physics)
const eduDesc = document.getElementById('edu-desc');
const eduOrbs = document.querySelectorAll('.edu-focus-btn[data-edu]');

function setEduFocus(code) {
    eduOrbs.forEach((b) => {
        const active = b.getAttribute('data-edu') === code;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const activeBtn = Array.from(eduOrbs).find(b => b.getAttribute('data-edu') === code);
    const desc = activeBtn?.getAttribute('data-desc');
    if (eduDesc && desc) eduDesc.textContent = desc;
}

eduOrbs.forEach((b) => {
    b.addEventListener('click', () => {
        const code = b.getAttribute('data-edu');
        if (!code) return;
        setEduFocus(code);
    });
});

// 7. Plans: dossier tilt + access log + hold-to-reveal intel
const dossier = document.getElementById('dossier');
const intel = document.querySelector('.intel');
const accessCountEl = document.getElementById('access-count');

function setAccessCount() {
    if (!accessCountEl) return;
    const key = 'bedarev_access_count';
    const current = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(current));
    accessCountEl.textContent = String(current).padStart(4, '0');
}
setAccessCount();

if (dossier) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    dossier.addEventListener('mousemove', (e) => {
        const rect = dossier.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const ry = clamp((x - 0.5) * 10, -6, 6);
        const rx = clamp((0.5 - y) * 10, -6, 6);
        dossier.style.setProperty('--rx', `${rx}deg`);
        dossier.style.setProperty('--ry', `${ry}deg`);
    });
    dossier.addEventListener('mouseleave', () => {
        dossier.style.setProperty('--rx', `0deg`);
        dossier.style.setProperty('--ry', `0deg`);
    });
}

if (intel) {
    let holding = false;
    const reveal = () => {
        intel.classList.add('reveal');
    };
    const hide = () => {
        intel.classList.remove('reveal');
    };

    const startHold = (e) => {
        holding = true;
        reveal();
        if (e && e.preventDefault) e.preventDefault();
    };
    const endHold = () => {
        if (!holding) return;
        holding = false;
        hide();
    };

    intel.addEventListener('pointerdown', startHold);
    intel.addEventListener('pointerup', endHold);
    intel.addEventListener('pointercancel', endHold);
    intel.addEventListener('pointerleave', endHold);
}

// 8. Languages: interactive switcher + classified Japanese reveal
const langButtons = document.querySelectorAll('.lang-btn[data-lang]');
const langCards = document.querySelectorAll('.lang-card[data-lang-card]');

function setActiveLanguage(code) {
    langButtons.forEach((b) => {
        const active = b.getAttribute('data-lang') === code;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    langCards.forEach((c) => {
        const active = c.getAttribute('data-lang-card') === code;
        c.classList.toggle('active', active);
    });
}

langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-lang');
        if (!code) return;
        setActiveLanguage(code);
    });
    btn.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const code = btn.getAttribute('data-lang');
        if (!code) return;
        setActiveLanguage(code);
    });
});

const jpCard = document.getElementById('lang-jp');
if (jpCard) {
    let holding = false;
    const reveal = () => jpCard.classList.add('reveal');
    const hide = () => jpCard.classList.remove('reveal');
    const startHold = (e) => {
        holding = true;
        reveal();
        if (e && e.preventDefault) e.preventDefault();
    };
    const endHold = () => {
        if (!holding) return;
        holding = false;
        hide();
    };
    jpCard.addEventListener('pointerdown', startHold);
    jpCard.addEventListener('pointerup', endHold);
    jpCard.addEventListener('pointercancel', endHold);
    jpCard.addEventListener('pointerleave', endHold);
}

// 9. Aesthetic cursor (desktop only)
const aestheticCursor = document.getElementById('aesthetic-cursor');
const cursorLabel = aestheticCursor ? aestheticCursor.querySelector('.ac-label') : null;

const canUseAestheticCursor = () =>
    window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function setCursorLabel(text) {
    if (!cursorLabel) return;
    cursorLabel.textContent = text;
}

if (aestheticCursor && canUseAestheticCursor()) {
    let raf = null;
    let targetX = 0;
    let targetY = 0;
    let lastX = 0;
    let lastY = 0;

    const tick = () => {
        lastX += (targetX - lastX) * 0.22;
        lastY += (targetY - lastY) * 0.22;
        aestheticCursor.style.transform = `translate3d(${lastX}px, ${lastY}px, 0)`;
        raf = requestAnimationFrame(tick);
    };

    const updateInversion = (el) => {
        const inDark = !!el && !!el.closest && (
            el.closest('#contact, #education') ||
            el.closest('.navbar') ||
            el.closest('.mobile-overlay')
        );
        aestheticCursor.classList.toggle('inverted', inDark);
    };

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;

        if (!aestheticCursor.classList.contains('active')) {
            aestheticCursor.classList.add('active');
            if (!raf) raf = requestAnimationFrame(tick);
        }

        const hoverEl = document.elementFromPoint(e.clientX, e.clientY);
        const interactive = hoverEl && hoverEl.closest && hoverEl.closest('a, button, [role="button"], .lang-btn, .contact-copy');
        aestheticCursor.classList.toggle('is-hover', !!interactive);
        setCursorLabel(interactive ? 'OPEN' : 'VIEW');
        updateInversion(hoverEl);
    }, { passive: true });

    document.addEventListener('mousedown', () => {
        aestheticCursor.classList.add('is-down');
    });
    document.addEventListener('mouseup', () => {
        aestheticCursor.classList.remove('is-down');
    });

    document.addEventListener('mouseleave', () => {
        aestheticCursor.classList.remove('active', 'is-hover', 'is-down');
        if (raf) cancelAnimationFrame(raf);
        raf = null;
    });
}