/* QUESTION PARTICLES */

const plansLink = document.getElementById('plans-link');
let isHovering = false;

plansLink.addEventListener('mouseenter', () => isHovering = true);
plansLink.addEventListener('mouseleave', () => isHovering = false);

plansLink.addEventListener('mousemove', (e) => {

if(!isHovering) return;

const particle = document.createElement('span');
particle.innerText='?';
particle.className='question-particle';

if(document.querySelector('.navbar').classList.contains('inverted')){
particle.classList.add('inverted');
}

particle.style.left = e.pageX + 'px';
particle.style.top = e.pageY + 'px';

const x = (Math.random() - 0.5) * 100;
const y = (Math.random() - 0.5) * 100;

particle.style.setProperty('--x', x + 'px');
particle.style.setProperty('--y', y + 'px');

document.body.appendChild(particle);

setTimeout(()=>particle.remove(),1000);

});


/* NAVBAR INVERSION */

const navbar = document.querySelector('.navbar');
const logo = document.querySelector('.logo-nav');

const heroSection = document.querySelector('.hero');
const contactSection = document.querySelector('.contactme-section');
const languagesSection = document.querySelector('.languages-section');
const educationSection = document.querySelector('.education-section');
const plansSection = document.querySelector('.plans-section');

const observer = new IntersectionObserver((entries)=>{

entries.forEach(entry=>{

if(entry.intersectionRatio >= 0.9){

if(entry.target === heroSection){
invertNavbar(false);
}

if(entry.target === contactSection){
invertNavbar(true);
}

if(entry.target === languagesSection){
invertNavbar(false);
}

if(entry.target === educationSection){
invertNavbar(true);
}

if(entry.target === plansSection){
invertNavbar(false);
}

}

});

},{
threshold:[0.9]
});

observer.observe(heroSection);
observer.observe(contactSection);
observer.observe(languagesSection);
observer.observe(educationSection);
observer.observe(plansSection);


function invertNavbar(state){

if(state){
navbar.classList.add('inverted');
logo.src="logo-small-black.png";
}else{
navbar.classList.remove('inverted');
logo.src="logo-small.png";
}

}


/* ULTRA SMOOTH SCROLL */

function smoothScroll(target,duration=900){

const start=window.pageYOffset;
const end=target.getBoundingClientRect().top+start;
const distance=end-start;
let startTime=null;

function easeInOutCubic(t){
return t<0.5
?4*t*t*t
:1-Math.pow(-2*t+2,3)/2;
}

function animation(currentTime){

if(startTime===null) startTime=currentTime;

const timeElapsed=currentTime-startTime;
const progress=Math.min(timeElapsed/duration,1);

const eased=easeInOutCubic(progress);

window.scrollTo(0,start+distance*eased);

if(timeElapsed<duration){
requestAnimationFrame(animation);
}

}

requestAnimationFrame(animation);

}


/* NAVBAR CLICK SCROLL */

document.querySelectorAll('.nav-item').forEach(link=>{

link.addEventListener('click',function(e){

e.preventDefault();

const id=this.getAttribute('href');
const target=document.querySelector(id);

smoothScroll(target);

});

});


/* LOGO SCROLL */

document.querySelector('.logo-link').addEventListener('click',function(e){

e.preventDefault();

smoothScroll(document.querySelector('#hero'));

});