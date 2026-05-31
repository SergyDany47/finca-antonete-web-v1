/* ============================================================
   CIA — interacciones de la landing
   ============================================================ */
(function(){
  /* ---- Nav scroll state ---- */
  const nav = document.querySelector('.nav');
  const onScroll = ()=>{ if(window.scrollY>40) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---- Mobile menu ---- */
  const burger = document.querySelector('.nav-burger');
  const mobile = document.querySelector('.mobile-menu');
  if(burger&&mobile){
    burger.addEventListener('click',()=>{
      const open = mobile.classList.toggle('open');
      burger.classList.toggle('x',open);
      document.body.style.overflow = open?'hidden':'';
    });
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      mobile.classList.remove('open');burger.classList.remove('x');document.body.style.overflow='';
    }));
  }

  /* ---- Reveal on scroll ---- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:0.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* ---- Reto progress line ---- */
  const retoTrack = document.querySelector('.reto-track');
  if(retoTrack){
    const prog = retoTrack.querySelector('.reto-line .prog');
    const rio = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ prog.style.width='100%'; rio.disconnect(); } });
    },{threshold:0.4});
    rio.observe(retoTrack);
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click',()=>{
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o=>{ if(o!==item){o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;} });
      if(open){ item.classList.remove('open'); a.style.maxHeight=null; }
      else { item.classList.add('open'); a.style.maxHeight = a.scrollHeight+'px'; }
    });
  });

  /* ---- Form submit ---- */
  const form = document.querySelector('#form form');
  if(form){
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const card = form.closest('.form-card');
      form.style.display='none';
      card.querySelector('.form-sent').classList.add('show');
    });
  }

  /* ---- Instrumented field + hero signal canvases ---- */
  const sigCtls = [];
  let signalEnabled = true;
  const fieldCanvas = document.querySelector('#campo-canvas');
  if(fieldCanvas && window.CIASignal){
    const fieldCtl = window.CIASignal.makeField(fieldCanvas,{labels:true,maxR:0.26});
    sigCtls.push(fieldCtl);
    const cio = new IntersectionObserver((ents)=>{
      ents.forEach(en=> { if(signalEnabled) fieldCtl.setRunning(en.isIntersecting); });
    },{threshold:0.05});
    cio.observe(document.querySelector('.instru'));
  }
  const heroCanvas = document.querySelector('#hero-canvas');
  if(heroCanvas && window.CIASignal){
    const heroCtl = window.CIASignal.makeField(heroCanvas,{
      labels:false, maxR:0.5,
      sensors:[
        {x:.10,y:.46,label:null,val:'',phase:0},
        {x:.30,y:.74,label:null,val:'',phase:1.4},
        {x:.20,y:.30,label:null,val:'',phase:2.6},
      ]
    });
    sigCtls.push(heroCtl);
  }

  /* ---- Year ---- */
  const y = document.querySelector('#year'); if(y) y.textContent=new Date().getFullYear();

  /* ---- Carrusel ---- */
  const carCtls = [];
  let carAutoplay = true;
  document.querySelectorAll('.carousel').forEach(car=>{
    const slides=[...car.querySelectorAll('.car-slide')];
    const dotsWrap=car.querySelector('.car-dots');
    const cur=car.querySelector('.car-count .cur');
    const tot=car.querySelector('.car-count .tot');
    const prog=car.querySelector('.car-progress');
    const n=slides.length;
    let i=slides.findIndex(s=>s.classList.contains('is-active')); if(i<0)i=0;
    const delay=parseInt(car.dataset.autoplay||'5000',10);
    let raf=null, start=0, paused=false, inview=true;
    if(tot) tot.textContent=String(n).padStart(2,'0');
    slides.forEach((_,k)=>{
      const b=document.createElement('button');
      b.setAttribute('role','tab'); b.setAttribute('aria-label','Imagen '+(k+1));
      b.addEventListener('click',()=>{go(k);restart();});
      dotsWrap.appendChild(b);
    });
    const dots=[...dotsWrap.children];
    function go(k){
      slides[i].classList.remove('is-active'); dots[i]&&dots[i].classList.remove('on');
      i=(k+n)%n;
      slides[i].classList.add('is-active'); dots[i]&&dots[i].classList.add('on');
      if(cur) cur.textContent=String(i+1).padStart(2,'0');
    }
    function active(){ return carAutoplay && !paused && inview; }
    function tick(now){
      if(!active()){ start=now-0; raf=requestAnimationFrame(tick); if(prog&&!carAutoplay)prog.style.width='0%'; return; }
      if(!start) start=now;
      const p=Math.min((now-start)/delay,1);
      if(prog) prog.style.width=(p*100)+'%';
      if(p>=1){ go(i+1); start=now; if(prog) prog.style.width='0%'; }
      raf=requestAnimationFrame(tick);
    }
    function restart(){ start=0; if(prog) prog.style.width='0%'; }
    go(i);
    car.querySelector('.car-next').addEventListener('click',()=>{go(i+1);restart();});
    car.querySelector('.car-prev').addEventListener('click',()=>{go(i-1);restart();});
    car.addEventListener('mouseenter',()=>paused=true);
    car.addEventListener('mouseleave',()=>{paused=false;start=0;});
    let sx=0;
    car.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});
    car.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40){go(i+(dx<0?1:-1));restart();}});
    const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const vio=new IntersectionObserver(es=>es.forEach(e=>{ inview=e.isIntersecting; }),{threshold:0.2});
    vio.observe(car);
    if(!reduce){ raf=requestAnimationFrame(tick); } else { if(prog) prog.style.display='none'; }
    carCtls.push({restart});
  });

  /* ---- API para el panel de Tweaks ---- */
  window.CIA = {
    setAccent(hex){
      document.documentElement.style.setProperty('--esmeralda', hex);
      if(window.CIASignal) window.CIASignal.setAccent(hex);
      sigCtls.forEach(c=>{ if(c._isReduced) c.redraw(); });
    },
    setSignal(on){
      signalEnabled = on;
      sigCtls.forEach(c=>c.setRunning(on));
      const hero=document.querySelector('#hero-canvas'); if(hero) hero.style.opacity = on?'1':'0';
      const fc=document.querySelector('#campo-canvas'); if(fc) fc.style.opacity = on?'1':'0';
    },
    setCarousel(on){ carAutoplay = on; },
    setReveal(on){
      document.body.classList.toggle('no-reveal', !on);
      if(!on) document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
    },
    setFont(role, stack){
      document.documentElement.style.setProperty(role==='serif'?'--serif':'--sans', stack);
    }
  };
})();
