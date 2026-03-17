// 1. Смена языка в заголовке
const portfolioTitle = document.getElementById('portfolio-title');
const langItems = document.querySelectorAll('.dropdown-item');

const titles = {
    en: "Portfolio",
    ru: "Портфолио",
    jp: "ポートフォリオ"
};

langItems.forEach(item => {
    item.addEventListener('click', () => {
        const lang = item.getAttribute('data-lang');
        if (!portfolioTitle) return;
        portfolioTitle.classList.add('text-changing');
        setTimeout(() => {
            portfolioTitle.textContent = titles[lang];
            portfolioTitle.classList.remove('text-changing');
        }, 300);
    });
});

// 2. Бургер-меню
const burger = document.getElementById('burger-menu');
const overlay = document.getElementById('mobile-overlay');
const navbar = document.querySelector('.navbar');
const logo = document.querySelector('.logo-nav');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : 'auto';
});

// 3. Плавный скролл
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        burger.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    });
});

// 4. ИСПРАВЛЕННАЯ ИНВЕРСИЯ НАВБАРА
const sections = document.querySelectorAll('section');
const observerOptions = {
    // threshold 0.6 означает, что секция должна занимать 60% экрана для срабатывания
    threshold: 0.91
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            const isDark = ['contact', 'education'].includes(id);
            
            if (isDark) {
                navbar.classList.add('inverted');
                logo.src = 'logo-small-black.png';
            } else {
                navbar.classList.remove('inverted');
                logo.src = 'logo-small.png';
            }
        }
    });
}, observerOptions);

sections.forEach(s => observer.observe(s));

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