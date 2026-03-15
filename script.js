const plansLink=document.getElementById('plans-link');
let isHovering=false;

plansLink.addEventListener('mouseenter',()=>isHovering=true);
plansLink.addEventListener('mouseleave',()=>isHovering=false);

plansLink.addEventListener('mousemove',(e)=>{

if(!isHovering) return;

const particle=document.createElement('span');

particle.innerText='?';
particle.className='question-particle';

if(document.querySelector('.navbar').classList.contains('inverted')){
particle.classList.add('inverted');
}

particle.style.left=e.pageX+'px';
particle.style.top=e.pageY+'px';

const x=(Math.random()-0.5)*100;
const y=(Math.random()-0.5)*100;

particle.style.setProperty('--x',x+'px');
particle.style.setProperty('--y',y+'px');

document.body.appendChild(particle);

setTimeout(()=>particle.remove(),1000);

});


/* NAVBAR INVERSION */

const navbar=document.querySelector('.navbar');
const logo=document.querySelector('.logo-nav');
const section=document.querySelector('.contactme');

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.intersectionRatio>=0.95){

navbar.classList.add('inverted');
logo.src="logo-small-black.png";

}else{

navbar.classList.remove('inverted');
logo.src="logo-small.png";

}

});

},{
threshold:[0.95]
});

observer.observe(section);