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
        portfolioTitle.classList.add('text-changing');
        setTimeout(() => {
            portfolioTitle.textContent = titles[lang];
            portfolioTitle.classList.remove('text-changing');
        }, 300);
    });
});

const burger = document.getElementById('burger-menu');
const overlay = document.getElementById('mobile-overlay');
const navbar = document.querySelector('.navbar');
const logo = document.querySelector('.logo-nav');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : 'auto';
});

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

const sections = document.querySelectorAll('section');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const isDark = ['contact', 'education'].includes(entry.target.id);
            if (isDark) {
                navbar.classList.add('inverted');
                logo.src = 'logo-small-black.png';
            } else {
                navbar.classList.remove('inverted');
                logo.src = 'logo-small.png';
            }
        }
    });
}, { threshold: 0.5 });
sections.forEach(s => observer.observe(s));

const plansLink = document.querySelector('.plans');
plansLink.addEventListener('mousemove', (e) => {
    const p = document.createElement('span');
    p.innerText = '?';
    p.className = 'question-particle';
    if (navbar.classList.contains('inverted')) p.classList.add('inverted');
    p.style.left = e.pageX + 'px';
    p.style.top = e.pageY + 'px';
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    p.style.setProperty('--x', x + 'px');
    p.style.setProperty('--y', y + 'px');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
});

// В функции, где ты создаешь частицы (например, по клику или наведению):
const count = 8; // Уменьши это число на 20% от твоего текущего (было 10 — стало 8)

for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'question-particle';
    if (navbar.classList.contains('inverted')) particle.classList.add('inverted');
    particle.textContent = '?';

    // Генерируем случайное направление (сила разлета теперь до 250px вместо 100)
    const angleRad = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 150; 
    const x = Math.cos(angleRad) * dist;
    const y = Math.sin(angleRad) * dist;

    // Вычисляем угол поворота в градусах, чтобы знак "смотрел" наружу
    // + 90 градусов, чтобы верхушка "?" указывала направление
    const rotation = (angleRad * 180 / Math.PI) + 90;

    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    particle.style.setProperty('--angle', `${rotation}deg`);

    // Добавляем на страницу и удаляем после анимации
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1200);
}