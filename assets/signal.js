/* ============================================================
   CIA — "Señal": anillos de sensor concéntricos sobre el campo
   El símbolo de marca convertido en telemetría viva.
   ============================================================ */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  let ACCENT = {r:94,g:200,b:156};
  function hexToRgb(hex){
    const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:ACCENT;
  }
  function setAccent(hex){ ACCENT = hexToRgb(hex); }
  // init from CSS var
  try{ const v=getComputedStyle(document.documentElement).getPropertyValue('--esmeralda'); if(v) setAccent(v); }catch(e){}

  function makeField(canvas, opts){
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2);
    const sensors = opts.sensors || [
      {x:.18,y:.42,label:'HUMEDAD',val:'32%',phase:0},
      {x:.50,y:.66,label:'RIEGO',val:'ON',phase:1.1},
      {x:.78,y:.34,label:'DRON',val:'14:20',phase:2.2},
      {x:.66,y:.80,label:'NDVI',val:'0.74',phase:0.6},
      {x:.36,y:.20,label:'SENSOR',val:'A-07',phase:1.7},
    ];
    const showLabels = opts.labels !== false;
    let t0 = performance.now();
    let running = true;
    function C(a){return `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${a})`;}
    function CS(){return `rgb(${ACCENT.r},${ACCENT.g},${ACCENT.b})`;}

    function resize(){
      const r = canvas.getBoundingClientRect();
      W=r.width; H=r.height;
      canvas.width = Math.max(1,W*DPR); canvas.height=Math.max(1,H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    resize();
    window.addEventListener('resize', resize);
    function px(s){return {x:s.x*W, y:s.y*H};}
    function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}

    function draw(now){
      if(!running){return;}
      const t = (now - t0)/1000;
      ctx.clearRect(0,0,W,H);
      ctx.lineWidth = 1;
      for(let i=0;i<sensors.length;i++){
        for(let j=i+1;j<sensors.length;j++){
          const a=px(sensors[i]), b=px(sensors[j]);
          const d=Math.hypot(a.x-b.x,a.y-b.y);
          if(d > Math.min(W,H)*0.52) continue;
          const pulse = 0.04 + 0.05*(0.5+0.5*Math.sin(t*0.7 + i+j));
          ctx.strokeStyle = C(pulse);
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
      const period = 3.2;
      sensors.forEach((s,si)=>{
        const p = px(s);
        const local = ((t + s.phase) % period)/period;
        const maxR = Math.min(W,H) * (opts.maxR || 0.30);
        for(let k=0;k<2;k++){
          let prog = local - k*0.5; if(prog<0) prog+=1;
          const r = prog*maxR;
          const alpha = (1-prog)*0.5;
          if(alpha<=0) continue;
          ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
          ctx.strokeStyle = C(alpha);ctx.lineWidth = 1.5;ctx.stroke();
        }
        [4,9].forEach(rr=>{ ctx.beginPath();ctx.arc(p.x,p.y,rr,0,Math.PI*2);ctx.strokeStyle=C(0.55);ctx.lineWidth=1.2;ctx.stroke(); });
        const dp = 2.6 + 1.2*(0.5+0.5*Math.sin(t*2.4 + si));
        ctx.beginPath();ctx.arc(p.x,p.y,dp,0,Math.PI*2);ctx.fillStyle=CS();ctx.fill();
        ctx.beginPath();ctx.arc(p.x,p.y,dp+3,0,Math.PI*2);ctx.fillStyle=C(0.18);ctx.fill();
        if(showLabels && s.label){
          const lx=p.x+16, ly=p.y-10;
          ctx.font='600 11px "Space Mono", monospace';
          const txt = s.label+' '+s.val;
          const w = ctx.measureText(txt).width;
          ctx.fillStyle='rgba(13,29,22,0.62)';
          roundRect(ctx,lx-7,ly-13,w+14,21,5);ctx.fill();
          ctx.fillStyle=CS();ctx.textBaseline='middle';
          ctx.fillText(s.label, lx, ly-1.5);
          ctx.fillStyle='#f4f1e9';
          ctx.fillText(' '.repeat(s.label.length+1)+s.val, lx, ly-1.5);
          ctx.strokeStyle=C(0.5);ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(lx-7,ly+8);ctx.stroke();
        }
      });
      requestAnimationFrame(draw);
    }

    function renderStatic(){ running=true; draw(performance.now()); running=false; }
    if(reduce){ renderStatic(); }
    else { requestAnimationFrame(draw); }
    return {
      setRunning(v){ if(reduce){return;} if(v&&!running){running=true;requestAnimationFrame(draw);} else {running=v;} },
      redraw(){ renderStatic(); },
      resize, _isReduced:reduce
    };
  }

  window.CIASignal = { makeField, setAccent };
})();
