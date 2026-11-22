(function(){
  /* ---------- scroll reveal ---------- */
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:.12});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }

  /* ---------- living evolution tree ---------- */
  var cv=document.getElementById('tree'); if(!cv) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS={growth:'#87BFA7',memory:'#D6C09B',mutation:'#9D97CC',canvas:'#E9E7D7'};
  var W=800,H=600,dpr=1;
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    var r=cv.getBoundingClientRect(); W=r.width||800; H=W*0.75;
    cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize(); window.addEventListener('resize',function(){resize(); draw(performance.now());});

  var nodes=[],edges=[],stats={branch:0,mut:0,gen:0},lastSpawn=0,phase=0,phaseStart=0,fade=0;
  var sB=document.getElementById('s-branch'),sM=document.getElementById('s-mut'),sG=document.getElementById('s-gen');

  function reset(t){
    nodes=[];edges=[];
    var ox=W/2,oy=H-28;
    nodes.push({x:ox,y:oy,c:COLORS.canvas,r:7,born:t,depth:0,kids:0,mut:false});
    stats={branch:0,mut:0,gen:0}; lastSpawn=t; phase=0; phaseStart=t; updateStats();
  }
  function updateStats(){ sB.textContent=stats.branch; sM.textContent=stats.mut; sG.textContent=stats.gen; }
  function pick(){
    var pool=nodes.filter(function(n){return n.kids<3 && n.y>50;});
    if(!pool.length) return null;
    if(Math.random()<0.18){ pool.sort(function(a,b){return a.born-b.born;}); return pool[Math.floor(Math.random()*Math.min(4,pool.length))]; }
    pool.sort(function(a,b){return b.born-a.born;});
    return pool[Math.floor(Math.pow(Math.random(),1.8)*Math.min(8,pool.length))];
  }
  function spawn(t){
    var p=pick(); if(!p) return;
    var mut=Math.random()<0.28;
    var spread=p.depth===0?0.9:1.25;
    var ang=-Math.PI/2+(Math.random()-0.5)*spread;
    var len=42+Math.random()*48;
    var nx=p.x+Math.cos(ang)*len, ny=p.y+Math.sin(ang)*len;
    if(nx<24||nx>W-24||ny<30) return;
    var col=mut?COLORS.mutation:(Math.random()<0.45?COLORS.memory:COLORS.growth);
    var n={x:nx,y:ny,c:col,r:mut?5.5:5,born:t,depth:p.depth+1,kids:0,mut:mut,parent:p};
    p.kids++; nodes.push(n); edges.push({a:p,b:n,born:t,c:col});
    if(p.kids>1) stats.branch++; if(mut) stats.mut++; stats.gen=Math.max(stats.gen,n.depth); updateStats();
  }
  function ease(x){return 1-Math.pow(1-x,3);}
  function draw(t){
    ctx.clearRect(0,0,W,H);
    edges.forEach(function(e){
      var k=ease(Math.min(1,(t-e.born)/700));
      ctx.strokeStyle=e.c; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.globalAlpha=(1-fade)*0.85;
      ctx.beginPath(); ctx.moveTo(e.a.x,e.a.y); ctx.lineTo(e.a.x+(e.b.x-e.a.x)*k,e.a.y+(e.b.y-e.a.y)*k); ctx.stroke();
    });
    nodes.forEach(function(n,i){
      var age=t-n.born, k=ease(Math.min(1,age/500));
      var pulse=i===nodes.length-1?1+0.25*Math.sin(t/180):1;
      ctx.globalAlpha=(1-fade);
      if(n.mut){ ctx.beginPath(); ctx.arc(n.x,n.y,n.r*k*2.6,0,Math.PI*2); ctx.fillStyle='rgba(157,151,204,.14)'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r*k*pulse,0,Math.PI*2); ctx.fillStyle=n.c; ctx.fill();
    });
    if(nodes[0]){ ctx.globalAlpha=(1-fade)*0.5; ctx.strokeStyle=COLORS.canvas; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(nodes[0].x,nodes[0].y,12,0,Math.PI*2); ctx.stroke(); }
    ctx.globalAlpha=1;
  }
  function loop(t){
    if(window.__arterriumArchiveLoaded) return; // the real lineage tree has replaced the demo
    if(phase===0){
      if(t-lastSpawn>(nodes.length<6?520:900+Math.random()*500)){ spawn(t); lastSpawn=t; }
      if(nodes.length>=46){ phase=1; phaseStart=t; }
    } else if(phase===1){
      if(t-phaseStart>2600){ fade=Math.min(1,(t-phaseStart-2600)/1200); if(fade>=1){ reset(t); fade=0; } }
    }
    draw(t); requestAnimationFrame(loop);
  }
  reset(performance.now());
  if(reduce){ var t0=performance.now()-5000; for(var i=0;i<34;i++) spawn(t0); draw(performance.now()); }
  else { requestAnimationFrame(loop); }
})();

/* ---------- remember an explicit language choice ---------- */
(function(){
  var links=document.querySelectorAll('[data-set-lang]');
  for(var i=0;i<links.length;i++){
    links[i].addEventListener('click',function(){
      try{localStorage.setItem('arterrium-lang',this.getAttribute('data-set-lang'));}catch(e){}
    });
  }
})();
