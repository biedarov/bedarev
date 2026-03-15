const contactSection = document.getElementById('contact-section');
const plansLink = document.getElementById('plans-link');

// 1. ЛОГИКА ИНВЕРСИИ
window.addEventListener('scroll', () => {
    // Получаем расстояние от верха до черной секции
    const sectionTop = contactSection.getBoundingClientRect().top;
    
    // Если верх черной секции дошел до верха экрана (0 или меньше)
    if (sectionTop <= 0) {
        document.body.classList.add('inverted');
    } else {
        document.body.classList.remove('inverted');
    }
});

// 2. ЧАСТИЦЫ ДЛЯ PLANS
let isHovering = false;
plansLink.addEventListener('mouseenter', () => isHovering = true);
plansLink.addEventListener('mouseleave', () => isHovering = false);

plansLink.addEventListener('mousemove', (e) => {
    if (!isHovering) return;
    const particle = document.createElement('span');
    particle.innerText = '?';
    particle.className = 'question-particle';
    particle.style.left = e.pageX + 'px';
    particle.style.top = e.pageY + 'px';
    const x = (Math.random() - 0.5) * 120;
    const y = (Math.random() - 0.5) * 120;
    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
});