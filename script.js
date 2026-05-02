// 1. Глобальный перевод (кроме navbar)
const portfolioTitle = document.getElementById('portfolio-title');
const portfolioText = document.getElementById('portfolio-text');
const langItems = document.querySelectorAll('.dropdown-item');
const mobileLangPills = document.querySelectorAll('.mobile-lang-pill');
const navContact = document.getElementById('nav-contact');
const navLanguages = document.getElementById('nav-languages');
const navEducation = document.getElementById('nav-education');
const mobileNavContact = document.getElementById('m-nav-contact');
const mobileNavLanguages = document.getElementById('m-nav-languages');
const mobileNavEducation = document.getElementById('m-nav-education');
const sidenavLabels = {
    hero: document.querySelector('.sidenav-item[data-sidenav="hero"] .sidenav-label'),
    contact: document.querySelector('.sidenav-item[data-sidenav="contact"] .sidenav-label'),
    languages: document.querySelector('.sidenav-item[data-sidenav="languages"] .sidenav-label'),
    education: document.querySelector('.sidenav-item[data-sidenav="education"] .sidenav-label'),
    plans: document.querySelector('.sidenav-item[data-sidenav="plans"] .sidenav-label')
};

const appTranslations = {
    en: {
        'nav.contact': 'Contact Me',
        'nav.languages': 'Languages',
        'nav.education': 'Education',
        'nav.portfolio': 'Portfolio',
        'nav.contactShort': 'Contact',
        'hero.portfolio': 'Portfolio',
        'about.title': 'About Me',
        'about.body': 'My name is Myron Bedarev, a 16-year-old student currently based at Newtown School in Waterford, Ireland. Of Ukrainian descent, I have grown up navigating four languages\u2014Russian, Ukrainian, English, and German\u2014which has given me a unique global perspective and a natural ability to adapt to diverse environments. My academic focus is currently driven by a clear ambition: to study Management Science and Information Systems Studies (MSISS) at Trinity College Dublin. I am fascinated by the intersection of data, technology, and strategic decision-making, and I aim to leverage my multicultural background and analytical mindset to solve complex challenges in the world of modern business and systems.',
        'about.foot': 'Scroll to the end to return',
        'contact.title': 'Contact',
        'contact.noForms': 'No forms',
        'contact.directLinks': 'Direct links',
        'contact.copy': 'Copy available',
        'contact.bottom': 'Click links to open. Use Copy to grab text.',
        'contact.channel': 'Channel',
        'contact.email': 'Email',
        'contact.phone': 'Phone',
        'contact.primary': 'Primary',
        'contact.secondary': 'Secondary',
        'contact.call': 'Call',
        'contact.sms': 'SMS',
        'languages.title': 'Languages',
        'lang.chipFocus': 'Click to focus',
        'lang.chipHold': 'Hold to reveal "future"',
        'lang.chipScale': 'CEFR scale',
        'lang.bottom': 'Fast scan. Clear levels. No fluff.',
        'education.title': 'Education',
        'education.kicker': 'Institution',
        'education.year': 'Year 5 \u2014 Active',
        'education.sub': 'Academic Focus',
        'edu.chipYear': 'Year 5',
        'edu.chipLevel': 'Higher Level',
        'edu.chipInteractive': 'Interactive',
        'edu.school': 'School',
        'edu.subjects': 'Subjects',
        'edu.footerLeft': 'Structured layout. Clear hierarchy. Subject-led focus.',
        'plans.objective': 'Primary objective',
        'plans.progress': 'Mission progress',
        'plans.intel': 'Additional intel'
    },
    ru: {
        'nav.contact': '\u0421\u0432\u044f\u0437\u044c',
        'nav.languages': '\u042f\u0437\u044b\u043a\u0438',
        'nav.education': '\u041e\u0431\u0443\u0447\u0435\u043d\u0438\u0435',
        'nav.portfolio': '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e',
        'nav.contactShort': '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b',
        'hero.portfolio': '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e',
        'about.title': '\u041e\u0431\u043e \u043c\u043d\u0435',
        'about.body': '\u041c\u0435\u043d\u044f \u0437\u043e\u0432\u0443\u0442 \u041c\u0438\u0440\u043e\u043d \u0411\u0435\u0434\u0430\u0440\u0435\u0432, \u043c\u043d\u0435 16 \u043b\u0435\u0442, \u0441\u0435\u0439\u0447\u0430\u0441 \u044f \u0443\u0447\u0443\u0441\u044c \u0432 Newtown School \u0432 \u0423\u043e\u0442\u0435\u0440\u0444\u043e\u0440\u0434\u0435, \u0418\u0440\u043b\u0430\u043d\u0434\u0438\u044f. \u041f\u043e \u043f\u0440\u043e\u0438\u0441\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044e \u044f \u0443\u043a\u0440\u0430\u0438\u043d\u0435\u0446 \u0438 \u0432\u044b\u0440\u043e\u0441 \u043d\u0430 \u0447\u0435\u0442\u044b\u0440\u0451\u0445 \u044f\u0437\u044b\u043a\u0430\u0445 \u2014 \u0440\u0443\u0441\u0441\u043a\u043e\u043c, \u0443\u043a\u0440\u0430\u0438\u043d\u0441\u043a\u043e\u043c, \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c \u0438 \u043d\u0435\u043c\u0435\u0446\u043a\u043e\u043c. \u042d\u0442\u043e \u0434\u0430\u043b\u043e \u043c\u043d\u0435 \u043d\u0435\u043e\u0431\u044b\u0447\u043d\u0443\u044e \u043f\u0435\u0440\u0441\u043f\u0435\u043a\u0442\u0438\u0432\u0443 \u0438 \u043f\u0440\u0438\u0432\u044b\u0447\u043a\u0443 \u0431\u044b\u0441\u0442\u0440\u043e \u0430\u0434\u0430\u043f\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u043a \u0440\u0430\u0437\u043d\u044b\u043c \u0441\u0440\u0435\u0434\u0430\u043c. \u0421\u0435\u0439\u0447\u0430\u0441 \u043c\u043e\u0439 \u0430\u043a\u0430\u0434\u0435\u043c\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0444\u043e\u043a\u0443\u0441 \u0441\u0432\u044f\u0437\u0430\u043d \u0441 \u043e\u0434\u043d\u043e\u0439 \u0447\u0451\u0442\u043a\u043e\u0439 \u0446\u0435\u043b\u044c\u044e: \u043f\u043e\u0441\u0442\u0443\u043f\u0438\u0442\u044c \u043d\u0430 Management Science and Information Systems Studies (MSISS) \u0432 Trinity College Dublin. \u041c\u0435\u043d\u044f \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0443\u0435\u0442 \u043f\u0435\u0440\u0435\u0441\u0435\u0447\u0435\u043d\u0438\u0435 \u0434\u0430\u043d\u043d\u044b\u0445, \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0439 \u0438 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0447\u0435\u0441\u043a\u0438\u0445 \u0440\u0435\u0448\u0435\u043d\u0438\u0439; \u044f \u0445\u043e\u0447\u0443 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0441\u0432\u043e\u0439 \u043c\u0443\u043b\u044c\u0442\u0438\u043a\u0443\u043b\u044c\u0442\u0443\u0440\u043d\u044b\u0439 \u0431\u044d\u043a\u0433\u0440\u0430\u0443\u043d\u0434 \u0438 \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043c\u044b\u0448\u043b\u0435\u043d\u0438\u0435, \u0447\u0442\u043e\u0431\u044b \u0440\u0435\u0448\u0430\u0442\u044c \u0441\u043b\u043e\u0436\u043d\u044b\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u0432 \u0441\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e\u043c \u043c\u0438\u0440\u0435 \u0431\u0438\u0437\u043d\u0435\u0441\u0430 \u0438 \u0441\u0438\u0441\u0442\u0435\u043c.',
        'about.foot': '\u041f\u0440\u043e\u043a\u0440\u0443\u0442\u0438 \u0434\u043e \u043a\u043e\u043d\u0446\u0430, \u0447\u0442\u043e\u0431\u044b \u0432\u0435\u0440\u043d\u0443\u0442\u044c Portfolio',
        'contact.title': '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b',
        'contact.noForms': '\u0411\u0435\u0437 \u0444\u043e\u0440\u043c',
        'contact.directLinks': '\u041f\u0440\u044f\u043c\u044b\u0435 \u0441\u0441\u044b\u043b\u043a\u0438',
        'contact.copy': '\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e',
        'contact.bottom': '\u0416\u043c\u0438 \u043f\u043e \u0441\u0441\u044b\u043b\u043a\u0430\u043c \u0438\u043b\u0438 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439 Copy, \u0447\u0442\u043e\u0431\u044b \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c.',
        'contact.channel': '\u041a\u0430\u043d\u0430\u043b',
        'contact.email': '\u042d\u043b. \u043f\u043e\u0447\u0442\u0430',
        'contact.phone': '\u0422\u0435\u043b\u0435\u0444\u043e\u043d',
        'contact.primary': '\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439',
        'contact.secondary': '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439',
        'contact.call': '\u0417\u0432\u043e\u043d\u043e\u043a',
        'contact.sms': 'SMS',
        'languages.title': '\u042f\u0437\u044b\u043a\u0438',
        'lang.chipFocus': '\u041d\u0430\u0436\u043c\u0438 \u0434\u043b\u044f \u0444\u043e\u043a\u0443\u0441\u0430',
        'lang.chipHold': '\u0423\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439 \u0434\u043b\u044f "\u0431\u0443\u0434\u0443\u0449\u0435\u0433\u043e"',
        'lang.chipScale': '\u0428\u043a\u0430\u043b\u0430 CEFR',
        'lang.bottom': '\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u043e\u0431\u0437\u043e\u0440. \u0427\u0451\u0442\u043a\u0438\u0435 \u0443\u0440\u043e\u0432\u043d\u0438. \u0411\u0435\u0437 \u0432\u043e\u0434\u044b.',
        'education.title': '\u041e\u0431\u0440\u0430\u0437\u043e\u0432\u0430\u043d\u0438\u0435',
        'education.kicker': '\u0423\u0447\u0435\u0431\u043d\u043e\u0435 \u0437\u0430\u0432\u0435\u0434\u0435\u043d\u0438\u0435',
        'education.year': 'Year 5 \u2014 \u0410\u043a\u0442\u0438\u0432\u0435\u043d',
        'education.sub': '\u0410\u043a\u0430\u0434\u0435\u043c\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0444\u043e\u043a\u0443\u0441',
        'edu.chipYear': 'Year 5',
        'edu.chipLevel': '\u0412\u044b\u0441\u0448\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c',
        'edu.chipInteractive': '\u0418\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432',
        'edu.school': '\u0428\u043a\u043e\u043b\u0430',
        'edu.subjects': '\u041f\u0440\u0435\u0434\u043c\u0435\u0442\u044b',
        'edu.footerLeft': '\u0421\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430. \u0418\u0435\u0440\u0430\u0440\u0445\u0438\u044f. \u0424\u043e\u043a\u0443\u0441 \u043d\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430\u0445.',
        'plans.objective': '\u0413\u043b\u0430\u0432\u043d\u0430\u044f \u0446\u0435\u043b\u044c',
        'plans.progress': '\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u043c\u0438\u0441\u0441\u0438\u0438',
        'plans.intel': '\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435'
    },
    uk: {
        'nav.contact': "\u0417\u0432'\u044f\u0437\u043e\u043a",
        'nav.languages': '\u041c\u043e\u0432\u0438',
        'nav.education': '\u041e\u0441\u0432\u0456\u0442\u0430',
        'nav.portfolio': '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0456\u043e',
        'nav.contactShort': '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438',
        'hero.portfolio': '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0456\u043e',
        'about.title': '\u041f\u0440\u043e \u043c\u0435\u043d\u0435',
        'about.body': "\u041c\u0435\u043d\u0435 \u0437\u0432\u0430\u0442\u0438 \u041c\u0430\u0439\u0440\u043e\u043d \u0411\u0435\u0434\u0430\u0440\u0454\u0432, \u043c\u0435\u043d\u0456 16 \u0440\u043e\u043a\u0456\u0432, \u0437\u0430\u0440\u0430\u0437 \u044f \u043d\u0430\u0432\u0447\u0430\u044e\u0441\u044f \u0432 Newtown School \u0443 \u0412\u043e\u0442\u0435\u0440\u0444\u043e\u0440\u0434\u0456, \u0406\u0440\u043b\u0430\u043d\u0434\u0456\u044f. \u041f\u043e\u0445\u043e\u0434\u0436\u0443 \u0437 \u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u043e\u0457 \u0440\u043e\u0434\u0438\u043d\u0438 \u0456 \u0437 \u0434\u0438\u0442\u0438\u043d\u0441\u0442\u0432\u0430 \u0436\u0438\u0432\u0443 \u0432 \u0447\u043e\u0442\u0438\u0440\u044c\u043e\u0445 \u043c\u043e\u0432\u0430\u0445 \u2014 \u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0456\u0439, \u0440\u043e\u0441\u0456\u0439\u0441\u044c\u043a\u0456\u0439, \u0430\u043d\u0433\u043b\u0456\u0439\u0441\u044c\u043a\u0456\u0439 \u0442\u0430 \u043d\u0456\u043c\u0435\u0446\u044c\u043a\u0456\u0439. \u0426\u0435 \u0434\u0430\u043b\u043e \u043c\u0435\u043d\u0456 \u0433\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u043e\u0433\u043b\u044f\u0434 \u0456 \u0432\u043c\u0456\u043d\u043d\u044f \u0448\u0432\u0438\u0434\u043a\u043e \u0430\u0434\u0430\u043f\u0442\u0443\u0432\u0430\u0442\u0438\u0441\u044f \u0434\u043e \u0440\u0456\u0437\u043d\u0438\u0445 \u0441\u0435\u0440\u0435\u0434\u043e\u0432\u0438\u0449. \u041c\u0456\u0439 \u043d\u0430\u0432\u0447\u0430\u043b\u044c\u043d\u0438\u0439 \u0444\u043e\u043a\u0443\u0441 \u0437\u0430\u0440\u0430\u0437 \u043f\u043e\u0432'\u044f\u0437\u0430\u043d\u0438\u0439 \u0437 \u0447\u0456\u0442\u043a\u043e\u044e \u043c\u0435\u0442\u043e\u044e: \u0432\u0441\u0442\u0443\u043f\u0438\u0442\u0438 \u043d\u0430 Management Science and Information Systems Studies (MSISS) \u0432 Trinity College Dublin. \u041c\u0435\u043d\u0435 \u0446\u0456\u043a\u0430\u0432\u0438\u0442\u044c \u043f\u0435\u0440\u0435\u0442\u0438\u043d \u0434\u0430\u043d\u0438\u0445, \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0456\u0439 \u0442\u0430 \u0443\u043f\u0440\u0430\u0432\u043b\u0456\u043d\u0441\u044c\u043a\u0438\u0445 \u0440\u0456\u0448\u0435\u043d\u044c, \u0456 \u044f \u0445\u043e\u0447\u0443 \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u0430\u0442\u0438 \u0441\u0432\u0456\u0439 \u043c\u0443\u043b\u044c\u0442\u0438\u043a\u0443\u043b\u044c\u0442\u0443\u0440\u043d\u0438\u0439 \u0434\u043e\u0441\u0432\u0456\u0434 \u0442\u0430 \u0430\u043d\u0430\u043b\u0456\u0442\u0438\u0447\u043d\u0435 \u043c\u0438\u0441\u043b\u0435\u043d\u043d\u044f, \u0449\u043e\u0431 \u0440\u043e\u0437\u0432'\u044f\u0437\u0443\u0432\u0430\u0442\u0438 \u0441\u043a\u043b\u0430\u0434\u043d\u0456 \u0437\u0430\u0434\u0430\u0447\u0456 \u0441\u0443\u0447\u0430\u0441\u043d\u0438\u0445 \u0441\u0438\u0441\u0442\u0435\u043c.",
        'about.foot': '\u041f\u0440\u043e\u043a\u0440\u0443\u0442\u0438 \u0434\u043e \u043a\u0456\u043d\u0446\u044f, \u0449\u043e\u0431 \u043f\u043e\u0432\u0435\u0440\u043d\u0443\u0442\u0438\u0441\u044f \u0434\u043e Portfolio',
        'contact.title': '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438',
        'contact.noForms': '\u0411\u0435\u0437 \u0444\u043e\u0440\u043c',
        'contact.directLinks': '\u041f\u0440\u044f\u043c\u0456 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f',
        'contact.copy': '\u041a\u043e\u043f\u0456\u044e\u0432\u0430\u043d\u043d\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0435',
        'contact.bottom': '\u041d\u0430\u0442\u0438\u0441\u043a\u0430\u0439 \u043d\u0430 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0430\u0431\u043e \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0439 Copy, \u0449\u043e\u0431 \u0441\u043a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438.',
        'contact.channel': '\u041a\u0430\u043d\u0430\u043b',
        'contact.email': '\u0415\u043b. \u043f\u043e\u0448\u0442\u0430',
        'contact.phone': '\u0422\u0435\u043b\u0435\u0444\u043e\u043d',
        'contact.primary': '\u041e\u0441\u043d\u043e\u0432\u043d\u0438\u0439',
        'contact.secondary': '\u0414\u043e\u0434\u0430\u0442\u043a\u043e\u0432\u0438\u0439',
        'contact.call': '\u0414\u0437\u0432\u0456\u043d\u043e\u043a',
        'contact.sms': 'SMS',
        'languages.title': '\u041c\u043e\u0432\u0438',
        'lang.chipFocus': '\u041d\u0430\u0442\u0438\u0441\u043d\u0438 \u0434\u043b\u044f \u0444\u043e\u043a\u0443\u0441\u0443',
        'lang.chipHold': '\u0423\u0442\u0440\u0438\u043c\u0443\u0439 \u0434\u043b\u044f "\u043c\u0430\u0439\u0431\u0443\u0442\u043d\u044c\u043e\u0433\u043e"',
        'lang.chipScale': '\u0428\u043a\u0430\u043b\u0430 CEFR',
        'lang.bottom': '\u0428\u0432\u0438\u0434\u043a\u0438\u0439 \u043e\u0433\u043b\u044f\u0434. \u0427\u0456\u0442\u043a\u0456 \u0440\u0456\u0432\u043d\u0456. \u0411\u0435\u0437 \u0437\u0430\u0439\u0432\u043e\u0433\u043e.',
        'education.title': '\u041e\u0441\u0432\u0456\u0442\u0430',
        'education.kicker': '\u041d\u0430\u0432\u0447\u0430\u043b\u044c\u043d\u0438\u0439 \u0437\u0430\u043a\u043b\u0430\u0434',
        'education.year': 'Year 5 \u2014 \u0410\u043a\u0442\u0438\u0432\u043d\u0438\u0439',
        'education.sub': '\u0410\u043a\u0430\u0434\u0435\u043c\u0456\u0447\u043d\u0438\u0439 \u0444\u043e\u043a\u0443\u0441',
        'edu.chipYear': 'Year 5',
        'edu.chipLevel': '\u0412\u0438\u0449\u0438\u0439 \u0440\u0456\u0432\u0435\u043d\u044c',
        'edu.chipInteractive': '\u0406\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432',
        'edu.school': '\u0428\u043a\u043e\u043b\u0430',
        'edu.subjects': '\u041f\u0440\u0435\u0434\u043c\u0435\u0442\u0438',
        'edu.footerLeft': '\u0421\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430. \u0406\u0454\u0440\u0430\u0440\u0445\u0456\u044f. \u0424\u043e\u043a\u0443\u0441 \u043d\u0430 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430\u0445.',
        'plans.objective': '\u0413\u043e\u043b\u043e\u0432\u043d\u0430 \u043c\u0435\u0442\u0430',
        'plans.progress': '\u041f\u0440\u043e\u0433\u0440\u0435\u0441 \u043c\u0456\u0441\u0456\u0457',
        'plans.intel': '\u0414\u043e\u0434\u0430\u0442\u043a\u043e\u0432\u0456 \u0434\u0430\u043d\u0456'
    },
    de: {
        'nav.contact': 'Kontakt',
        'nav.languages': 'Sprachen',
        'nav.education': 'Bildung',
        'nav.portfolio': 'Portfolio',
        'nav.contactShort': 'Kontakt',
        'hero.portfolio': 'Portfolio',
        'about.title': '\u00dcber mich',
        'about.body': 'Ich hei\u00dfe Myron Bedarev, bin 16 Jahre alt und besuche derzeit die Newtown School in Waterford, Irland. Mit ukrainischen Wurzeln bin ich mit vier Sprachen aufgewachsen \u2013 Russisch, Ukrainisch, Englisch und Deutsch. Das gibt mir eine globale Perspektive und die F\u00e4higkeit, mich schnell an unterschiedliche Umgebungen anzupassen. Mein aktueller akademischer Fokus ist klar: Management Science and Information Systems Studies (MSISS) am Trinity College Dublin zu studieren. Mich fasziniert die Schnittstelle von Daten, Technologie und strategischen Entscheidungen, und ich m\u00f6chte meinen multikulturellen Hintergrund und meine analytische Denkweise nutzen, um komplexe Probleme in modernen Systemen zu l\u00f6sen.',
        'about.foot': 'Scrolle bis zum Ende, um zu Portfolio zur\u00fcckzukehren',
        'contact.title': 'Kontakt',
        'contact.noForms': 'Keine Formulare',
        'contact.directLinks': 'Direkte Links',
        'contact.copy': 'Kopieren m\u00f6glich',
        'contact.bottom': 'Links anklicken oder Copy verwenden, um zu kopieren.',
        'contact.channel': 'Kanal',
        'contact.email': 'E-Mail',
        'contact.phone': 'Telefon',
        'contact.primary': 'Prim\u00e4r',
        'contact.secondary': 'Sekund\u00e4r',
        'contact.call': 'Anruf',
        'contact.sms': 'SMS',
        'languages.title': 'Sprachen',
        'lang.chipFocus': 'Klick zum Fokussieren',
        'lang.chipHold': 'Halten f\u00fcr "Zukunft"',
        'lang.chipScale': 'CEFR-Skala',
        'lang.bottom': 'Schneller Scan. Klare Stufen. Kein Ballast.',
        'education.title': 'Bildung',
        'education.kicker': 'Einrichtung',
        'education.year': 'Year 5 \u2014 Aktiv',
        'education.sub': 'Akademischer Fokus',
        'edu.chipYear': 'Year 5',
        'edu.chipLevel': 'H\u00f6heres Niveau',
        'edu.chipInteractive': 'Interaktiv',
        'edu.school': 'Schule',
        'edu.subjects': 'F\u00e4cher',
        'edu.footerLeft': 'Struktur. Hierarchie. Fachlicher Fokus.',
        'plans.objective': 'Hauptziel',
        'plans.progress': 'Missionsfortschritt',
        'plans.intel': 'Zus\u00e4tzliche Daten'
    },
    jp: {
        'nav.contact': '\u9023\u7d61',
        'nav.languages': '\u8a00\u8a9e',
        'nav.education': '\u5b66\u6b74',
        'nav.portfolio': '\u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa',
        'nav.contactShort': '\u9023\u7d61\u5148',
        'hero.portfolio': '\u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa',
        'about.title': '\u81ea\u5df1\u7d39\u4ecb',
        'about.body': '\u79c1\u306e\u540d\u524d\u306f Myron Bedarev\u300116 \u6b73\u3067\u3001\u73fe\u5728\u30a2\u30a4\u30eb\u30e9\u30f3\u30c9\u30fb\u30a6\u30a9\u30fc\u30bf\u30fc\u30d5\u30a9\u30fc\u30c9\u306e Newtown School \u306b\u5728\u5b66\u3057\u3066\u3044\u307e\u3059\u3002\u30ed\u30b7\u30a2\u3068\u30a6\u30af\u30e9\u30a4\u30ca\u306e\u30eb\u30fc\u30c4\u3092\u6301\u3061\u3001\u5e7c\u3044\u9803\u304b\u3089\u30ed\u30b7\u30a2\u8a9e\u3001\u30a6\u30af\u30e9\u30a4\u30ca\u8a9e\u3001\u82f1\u8a9e\u3001\u30c9\u30a4\u30c4\u8a9e\u306e\u56db\u8a00\u8a9e\u306e\u4e2d\u3067\u80b2\u3063\u3066\u304d\u307e\u3057\u305f\u3002\u305d\u306e\u7d4c\u9a13\u306e\u304a\u304b\u3052\u3067\u3001\u591a\u69d8\u306a\u74b0\u5883\u306b\u9069\u5fdc\u3057\u306a\u304c\u3089\u7269\u4e8b\u3092\u591a\u65b9\u9762\u304b\u3089\u898b\u308b\u8996\u70b9\u3092\u8eab\u306b\u3064\u3051\u307e\u3057\u305f\u3002\u73fe\u5728\u306e\u660e\u78ba\u306a\u76ee\u6a19\u306f\u3001Trinity College Dublin \u306e Management Science and Information Systems Studies (MSISS) \u306b\u9032\u5b66\u3059\u308b\u3053\u3068\u3067\u3059\u3002\u30c7\u30fc\u30bf\u3068\u30c6\u30af\u30ce\u30ed\u30b8\u30fc\u3001\u305d\u3057\u3066\u610f\u601d\u6c7a\u5b9a\u306e\u4ea4\u5dee\u70b9\u306b\u5f37\u3044\u8208\u5473\u304c\u3042\u308a\u3001\u3053\u306e\u30d0\u30c3\u30af\u30b0\u30e9\u30a6\u30f3\u30c9\u3068\u5206\u6790\u7684\u601d\u8003\u3092\u751f\u304b\u3057\u3066\u3001\u73fe\u4ee3\u306e\u30d3\u30b8\u30cd\u30b9\u3068\u30b7\u30b9\u30c6\u30e0\u306b\u304a\u3051\u308b\u8907\u96d1\u306a\u8ab2\u984c\u306b\u53d6\u308a\u7d44\u307f\u305f\u3044\u3068\u8003\u3048\u3066\u3044\u307e\u3059\u3002',
        'about.foot': '\u6700\u5f8c\u307e\u3067\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u3068 Portfolio \u306b\u623b\u308c\u307e\u3059',
        'contact.title': '\u9023\u7d61\u5148',
        'contact.noForms': '\u30d5\u30a9\u30fc\u30e0\u306a\u3057',
        'contact.directLinks': '\u30c0\u30a4\u30ec\u30af\u30c8\u30ea\u30f3\u30af',
        'contact.copy': '\u30b3\u30d4\u30fc\u304c\u53ef\u80fd',
        'contact.bottom': '\u30ea\u30f3\u30af\u3092\u30af\u30ea\u30c3\u30af\u3001\u307e\u305f\u306f Copy \u3067\u30c6\u30ad\u30b9\u30c8\u3092\u30b3\u30d4\u30fc\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
        'contact.channel': '\u30c1\u30e3\u30cd\u30eb',
        'contact.email': '\u30e1\u30fc\u30eb',
        'contact.phone': '\u96fb\u8a71',
        'contact.primary': '\u30e1\u30a4\u30f3',
        'contact.secondary': '\u30b5\u30d6',
        'contact.call': '\u901a\u8a71',
        'contact.sms': 'SMS',
        'languages.title': '\u8a00\u8a9e',
        'lang.chipFocus': '\u30af\u30ea\u30c3\u30af\u3067\u30d5\u30a9\u30fc\u30ab\u30b9',
        'lang.chipHold': '\u9577\u62bc\u3057\u3067\u201c\u672a\u6765\u201d\u3092\u8868\u793a',
        'lang.chipScale': 'CEFR\u30b9\u30b1\u30fc\u30eb',
        'lang.bottom': '\u7d20\u65e9\u3044\u30b9\u30ad\u30e3\u30f3\u3002\u660e\u78ba\u306a\u30ec\u30d9\u30eb\u3002\u7121\u99c4\u306a\u3057\u3002',
        'education.title': '\u5b66\u6b74',
        'education.kicker': '\u6559\u80b2\u6a5f\u95a2',
        'education.year': 'Year 5 \u2014 \u5728\u5b66\u4e2d',
        'education.sub': '\u5b66\u7fd2\u30d5\u30a9\u30fc\u30ab\u30b9',
        'edu.chipYear': 'Year 5',
        'edu.chipLevel': '\u4e0a\u7d1a\u30ec\u30d9\u30eb',
        'edu.chipInteractive': '\u30a4\u30f3\u30bf\u30e9\u30af\u30c6\u30a3\u30d6',
        'edu.school': '\u5b66\u6821',
        'edu.subjects': '\u79d1\u76ee',
        'edu.footerLeft': '\u69cb\u9020\u7684\u306a\u30ec\u30a4\u30a2\u30a6\u30c8\u3002\u660e\u78ba\u306a\u968e\u5c64\u3002\u79d1\u76ee\u4e3b\u5c0e\u3002',
        'plans.objective': '\u4e3b\u76ee\u6a19',
        'plans.progress': '\u30df\u30c3\u30b7\u30e7\u30f3\u9032\u6357',
        'plans.intel': '\u8ffd\u52a0\u60c5\u5831'
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

    if (navContact) navContact.textContent = dict['nav.contact'] || appTranslations.en['nav.contact'];
    if (navLanguages) navLanguages.textContent = dict['nav.languages'] || appTranslations.en['nav.languages'];
    if (navEducation) navEducation.textContent = dict['nav.education'] || appTranslations.en['nav.education'];

    if (mobileNavContact) mobileNavContact.textContent = dict['nav.contact'] || appTranslations.en['nav.contact'];
    if (mobileNavLanguages) mobileNavLanguages.textContent = dict['nav.languages'] || appTranslations.en['nav.languages'];
    if (mobileNavEducation) mobileNavEducation.textContent = dict['nav.education'] || appTranslations.en['nav.education'];

    if (sidenavLabels.hero) sidenavLabels.hero.textContent = dict['nav.portfolio'] || appTranslations.en['nav.portfolio'];
    if (sidenavLabels.contact) sidenavLabels.contact.textContent = dict['nav.contactShort'] || appTranslations.en['nav.contactShort'];
    if (sidenavLabels.languages) sidenavLabels.languages.textContent = dict['nav.languages'] || appTranslations.en['nav.languages'];
    if (sidenavLabels.education) sidenavLabels.education.textContent = dict['nav.education'] || appTranslations.en['nav.education'];
    if (sidenavLabels.plans) sidenavLabels.plans.textContent = 'Plans';

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

// Mobile Pull-to-Refresh (custom)
(() => {
    const ptr = document.getElementById('ptr');
    const ptrText = document.getElementById('ptr-text');
    const ptrSub = document.getElementById('ptr-sub');
    const ptrProgress = document.getElementById('ptr-progress');
    const ptrRatio = document.getElementById('ptr-ratio');
    if (!ptr || !ptrText || !ptrSub || !ptrProgress || !ptrRatio) return;

    const isMobile = () =>
        window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    let startY = 0;
    let pulling = false;
    let progress = 0;
    let refreshing = false;

    const threshold = 84;
    const maxPull = 140;

    function setProgressUI(y) {
        const clamped = Math.min(maxPull, Math.max(0, y));
        const pct = Math.min(100, Math.round((clamped / threshold) * 100));
        ptrProgress.style.width = `${pct}%`;
        ptrRatio.textContent = `${String(pct).padStart(2, '0')}%`;
        ptr.style.setProperty('--ptr-progress', String(pct / 100));
    }

    function setPtrState(state) {
        ptr.classList.toggle('ready', state === 'ready');
        ptr.classList.toggle('refreshing', state === 'refreshing');
        ptr.classList.toggle('pulling', state === 'pull');
        if (state === 'pull') {
            ptrText.textContent = 'PULL';
            ptrSub.textContent = 'TO REVEAL REFRESH';
        } else if (state === 'ready') {
            ptrText.textContent = 'RELEASE';
            ptrSub.textContent = 'TO EXECUTE RESET';
        } else if (state === 'refreshing') {
            ptrText.textContent = 'REFRESH';
            ptrSub.textContent = 'RELOADING SYSTEM';
        }
    }

    function render() {
        const y = Math.min(maxPull, Math.max(0, progress));
        ptr.classList.add('show');
        ptr.style.transform = `translateX(-50%) translateY(${y - maxPull}px)`;
        ptr.style.opacity = String(Math.min(1, y / 28));
        setProgressUI(y);
        if (!refreshing) {
            setPtrState(y >= threshold ? 'ready' : 'pull');
        }
    }

    function reset() {
        ptr.classList.remove('show', 'ready', 'refreshing', 'pulling');
        ptr.style.transform = 'translateX(-50%) translateY(-132px)';
        ptr.style.opacity = '0';
        progress = 0;
        pulling = false;
        refreshing = false;
        setProgressUI(0);
        setPtrState('pull');
    }

    function canStart(e) {
        if (!isMobile()) return false;
        if (refreshing) return false;
        if (window.scrollY > 0) return false;
        // only if gesture starts near top
        const y = e.touches?.[0]?.clientY ?? 0;
        return y < 120;
    }

    window.addEventListener('touchstart', (e) => {
        if (!canStart(e)) return;
        startY = e.touches[0].clientY;
        pulling = true;
        progress = 0;
        render();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const y = e.touches[0].clientY;
        const dy = y - startY;
        if (dy <= 0) {
            progress = 0;
            render();
            return;
        }
        // resist
        progress = Math.pow(Math.min(maxPull, dy), 0.92);
        render();
        if (progress > 8) e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (!pulling) return;
        const y = Math.min(maxPull, Math.max(0, progress));
        if (y >= threshold) {
            refreshing = true;
            setPtrState('refreshing');
            setProgressUI(threshold);
            ptr.style.transform = `translateX(-50%) translateY(${threshold - maxPull}px)`;
            ptr.style.opacity = '1';
            setTimeout(() => window.location.reload(), 420);
            return;
        }
        reset();
    }, { passive: true });

    window.addEventListener('touchcancel', reset, { passive: true });
})();

// 1b. Hero: Portfolio -> About Me toggle
const heroSection = document.getElementById('hero');
const aboutPanel = document.getElementById('about-panel');
const aboutEndButton = document.getElementById('about-end');

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

if (aboutEndButton) {
    aboutEndButton.addEventListener('click', () => {
        setAboutMode(false);
        if (typeof portfolioTitle?.focus === 'function') portfolioTitle.focus();
        window.scrollTo({ top: heroSection?.offsetTop || 0, behavior: 'smooth' });
    });
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
    if (open) {
        navbar.classList.remove('inverted');
        if (logo) logo.src = 'logo-small.png';
    } else {
        scheduleSidenavUpdate();
    }
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
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;
        window.scrollTo({ top: target.offsetTop - navHeight, behavior: 'smooth' });
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
    if (ok) {
        btn.classList.add('copied');
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = 'Copy';
        }, 1400);
    }
});

// 7b. Education: focus selector (Higher Math / Applied Math / Physics)
const eduOrbs = document.querySelectorAll('.edu-focus-btn[data-edu]');
const eduCards = document.querySelectorAll('.edu-detail-card[data-edu-card]');

function setEduFocus(code) {
    eduOrbs.forEach((b) => {
        const active = b.getAttribute('data-edu') === code;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    eduCards.forEach((c) => {
        const active = c.getAttribute('data-edu-card') === code;
        c.classList.toggle('active', active);
    });
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
        const overDarkSection = !!el && !!el.closest && !!el.closest('#contact, #education');
        const overNavbar = !!el && !!el.closest && !!el.closest('.navbar');
        const overMobileOverlay = !!el && !!el.closest && !!el.closest('.mobile-overlay');
        const overDarkNavbar = overNavbar && !navbar.classList.contains('inverted');
        const inDark = overDarkSection || overDarkNavbar || overMobileOverlay;
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

// 10. Scroll-triggered reveal animations
(() => {
    const scrollEls = document.querySelectorAll('[data-scroll]');
    const staggerEls = document.querySelectorAll('[data-scroll-stagger]');
    console.log('Found scroll elements:', scrollEls.length, 'stagger elements:', staggerEls.length);
    if (!scrollEls.length && !staggerEls.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        scrollEls.forEach(el => el.classList.add('in-view'));
        staggerEls.forEach(el => el.classList.add('in-view'));
        return;
    }

    // Hero elements start visible (already in viewport on load)
    const heroSection = document.getElementById('hero');
    const isNearViewport = (el) => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        return rect.bottom >= 0 && rect.top <= vh;
    };
    const revealElement = (el) => {
        el.classList.add('in-view');
        cleanupAfterReveal(el);
    };
    
    // Reveal hero elements immediately
    if (heroSection) {
        requestAnimationFrame(() => {
            heroSection.querySelectorAll('[data-scroll]').forEach(el => {
                revealElement(el);
            });
            heroSection.querySelectorAll('[data-scroll-stagger]').forEach(el => {
                revealElement(el);
            });
        });
    }
    
    // Force check all elements that are already visible on load
    requestAnimationFrame(() => {
        let visibleCount = 0;
        scrollEls.forEach(el => {
            if (heroSection && heroSection.contains(el)) return;
            if (isNearViewport(el)) {
                console.log('Revealing element on load:', el);
                revealElement(el);
                visibleCount++;
            }
        });
        staggerEls.forEach(el => {
            if (heroSection && heroSection.contains(el)) return;
            if (isNearViewport(el)) {
                console.log('Revealing stagger element on load:', el);
                revealElement(el);
                visibleCount++;
            }
        });
        console.log('Total elements revealed on load:', visibleCount);
    });

    // After reveal animation finishes, clean up data-scroll so hover transitions work normally
    function cleanupAfterReveal(el) {
        const delay = parseInt(el.getAttribute('data-scroll-delay') || '0', 10);
        const speed = el.getAttribute('data-scroll-speed');
        const dur = speed === 'fast' ? 500 : speed === 'slow' ? 1200 : 800;
        setTimeout(() => {
            el.style.willChange = 'auto';
        }, delay + dur + 100);
    }

    const observerCallback = (entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            console.log('Observer triggered for:', el, 'isIntersecting:', entry.isIntersecting);
            // Skip hero elements (already revealed)
            if (heroSection && heroSection.contains(el)) return;
            revealElement(el);
            obs.unobserve(el); // one-shot: animate once
        });
    };

    const observerOpts = {
        threshold: 0,
        rootMargin: '0px'
    };

    const scrollObs = new IntersectionObserver(observerCallback, observerOpts);

    // Delay observer setup slightly to ensure it catches already-visible elements
    setTimeout(() => {
        scrollEls.forEach(el => {
            // Don't observe hero children (they animate on load)
            if (heroSection && heroSection.contains(el)) return;
            console.log('Observing element:', el);
            scrollObs.observe(el);
        });
        staggerEls.forEach(el => {
            if (heroSection && heroSection.contains(el)) return;
            console.log('Observing stagger element:', el);
            scrollObs.observe(el);
        });
    }, 100);
})();
