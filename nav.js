/* Tidy nav: bottom tab bar + sheets (preview) */
(function(){
const IC={
home:'<path d="M2 9.5 12 4l10 5.5"/><path d="M4.5 9.5c0 0 1 1.2 0 2.2M19.5 9.5c0 0-1 1.2 0 2.2"/><path d="M6 11v9h12v-9"/><path d="M10 20v-5h4v5"/>',
tools:'<path d="M5 3h11a3 3 0 0 1 3 3v12"/><path d="M5 3a2 2 0 0 0-2 2v1h4V5a2 2 0 0 0-2-2z"/><path d="M7 6v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1H11v1a2 2 0 0 1-2 2"/><path d="M10 9h6M10 13h6"/>',
more:'<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r="1"/><circle cx="12" cy="16.5" r="1"/>',
browse:'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
ctl:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
ptimer:'<path d="M7 3h10M7 21h10"/><path d="M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
padv:'<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
pal:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/><path d="M12 2v3"/>',
pwl:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
ppr:'<circle cx="12" cy="12" r="9"/><rect x="9.5" y="9.5" width="5" height="5"/>',
pfeed:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
cls:'<path d="M7 3h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8M9 21l1-4h4l1 4"/>',
news:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
how:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6"/>',
cmp:'<path d="M12 3v18M7 21h10M4 7h16"/><path d="M4 7l-2.5 6a2.5 2.5 0 0 0 5 0zM20 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>'};
const sv=k=>`<svg class="nvi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${IC[k]||IC.browse}</svg>`;
const NVI='E'; /* tab icon style: A line, B solid, C duotone, D eastern, E minimal+dot */
const NV=(new URLSearchParams(location.search).get('nvi')||NVI).toUpperCase();
const G='#e8c872',M='#7a2a6a';
const TS={
B:{home:'<path fill="currentColor" stroke="none" d="M12 3 1.5 9.2l1 1.6L4 10v10h6v-5h4v5h6V10l1.5.8 1-1.6z"/>',
 tools:'<path fill="currentColor" stroke="none" d="M6 3h11a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zm3 6v1.6h7V9zm0 4v1.6h7V13z"/>',
 more:'<circle fill="currentColor" stroke="none" cx="5" cy="12" r="2.4"/><circle fill="currentColor" stroke="none" cx="12" cy="12" r="2.4"/><circle fill="currentColor" stroke="none" cx="19" cy="12" r="2.4"/>'},
C:{home:'<path fill="'+M+'" stroke="none" d="M5 10.5 12 6l7 4.5V20H5z"/><path d="M2 10 12 4l10 6"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
 tools:'<rect x="4" y="3" width="16" height="18" rx="3" fill="'+M+'" stroke="none"/><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
 more:'<circle cx="12" cy="12" r="9" fill="'+M+'" stroke="none"/><circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.6"/>'},
D:{home:'<path d="M3 7c3 0 5-1.5 9-4 4 2.5 6 4 9 4"/><path d="M5 7v2h14V7"/><path d="M4 13c3 0 5-1 8-3 3 2 5 3 8 3"/><path d="M6 13v8h12v-8"/><path d="M10 21v-4h4v4"/>',
 tools:'<path d="M19 3 9 13"/><path d="M7 11l6 6"/><path d="M8.5 15.5 4 20"/><circle cx="3.5" cy="20.5" r="1"/><path d="M15 3h4v4"/>',
 more:'<path d="M12 2v2"/><path d="M8 4h8"/><path d="M7 7c0-1.5 2-3 5-3s5 1.5 5 3v8c0 1.5-2 3-5 3s-5-1.5-5-3z"/><path d="M7 11h10"/><path d="M12 18v3M10 21h4"/>'},
E:{home:'<path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/>',
 tools:'<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
 more:'<path d="M5 8h14M5 12h14M5 16h14"/>'}};
const tsv=k=>{const set=TS[NV];if(!set)return sv(k);return `<svg class="nvi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${NV=='E'?1.8:1.6}" stroke-linecap="round" stroke-linejoin="round">${set[k]}</svg>`};
const clean=t=>t.replace(/^[^A-Za-z0-9]+/,'').trim();

const css=`#tnav{position:fixed;left:0;right:0;bottom:0;z-index:1100;display:flex;background:rgba(20,8,22,.96);border-top:1px solid #5a2550;padding:4px 6px calc(4px + var(--sab));backdrop-filter:blur(6px)}
#tnav button{flex:1;background:none;border:0!important;box-shadow:none!important;outline:none;color:#b9a3bd;font-size:11px;padding:5px 0;display:flex;flex-direction:column;align-items:center;gap:1px;border-radius:10px}
#tnav .nvi{width:22px;height:22px}#tnav[data-s=B] button.on .nvi,#tnav[data-s=C] button.on .nvi{filter:drop-shadow(0 0 3px rgba(200,80,170,.6))}#tnav[data-s=E] button{position:relative}#tnav[data-s=E] button.on{background:none}#tnav[data-s=E] button.on:after{content:'';position:absolute;bottom:0;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#e8c872}#tnav[data-s=E] button.on .nvi{filter:none}#tnav button.on .nvi{filter:drop-shadow(0 0 4px rgba(200,80,170,.7))}#tsh .it .nvi{width:20px;height:20px;color:#e8c872;flex:none}
#tnav button.on{color:#ffdf8e;background:rgba(107,42,90,.35)}
:root{--sab:env(safe-area-inset-bottom,0px)}body{padding-bottom:calc(64px + var(--sab))}
#cbar{bottom:calc(56px + var(--sab))!important;border-radius:14px 14px 0 0}
#bycls,#mbtn,#back20,.ctl .qs,#ninfo,#ninfo+span{display:none!important}
#tsh{position:fixed;inset:0;z-index:1200;display:none}#tsh.show{display:block}
#tsh .bg{position:absolute;inset:0;background:rgba(8,3,10,.55);transition:opacity .25s}#tsh .pn{transition:transform .25s ease;touch-action:pan-y}#tsh.drag .pn,#tsh.drag .bg{transition:none}#tsh .gr{width:40px;height:5px;padding:0}
#tsh .pn{position:absolute;left:0;right:0;bottom:0;background:#1c0b20;border-top:1px solid #e8c87255;border-radius:16px 16px 0 0;padding:8px 16px calc(18px + var(--sab));max-height:70vh;overflow:auto;box-shadow:0 -6px 24px rgba(0,0,0,.5)}
#tsh .gr{width:36px;height:4px;background:#5a2550;border-radius:4px;margin:2px auto 10px}
#tsh h4{margin:12px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#b9a3bd;font-weight:600}
#tsh .row{display:flex;flex-wrap:wrap;gap:6px}
#tsh .ch{background:#26142b;color:#f2e8f2;border:1px solid #4a2348;border-radius:999px;padding:7px 12px;font-size:13px;text-decoration:none}
#tsh .ch.on{border-color:#e8c872;color:#e8c872;background:#3a1640}
#tsh .it{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-bottom:1px solid #3a1a3c;color:#f2e8f2;padding:12px 2px;font-size:14px;text-align:left;text-decoration:none}
#tsh .it small{display:block;color:#b9a3bd;font-size:11px;margin-top:2px}
#tsh .it:last-child{border-bottom:0!important}
details.pro,.ctl{display:none!important}
body[data-nv=ctl] .ctl{display:flex!important}body[data-nv=ctl] #padv{display:block!important}
#nvx{position:fixed;right:12px;top:10px;z-index:1050;display:none;background:#2a1030;color:#e8c872;border:1px solid #e8c87266;border-radius:999px;padding:7px 14px;font-size:12px;box-shadow:0 2px 10px rgba(0,0,0,.5)}
body[data-nv] #nvx{display:block}body[data-nv=ctl] #nvx{display:none}.nva>*:not(.nva):not(.nvp):not(#tnav):not(#tsh):not(#nvx):not(script):not(style){display:none!important}body.nva{padding-top:44px}body[data-nv]:not([data-nv=ctl]) #xnav{display:none!important}
#tsh .fl .it{padding:10px 2px}#tsh .it span{flex:1;text-align:left}#tsh .fl .it i{font-style:normal;color:#b9a3bd}#tsh .it{border:0!important;border-bottom:1px solid #3a1a3c!important;border-radius:0!important;box-shadow:none!important;outline:none;margin:0}#tsh .it>b{width:24px;text-align:center;font-weight:400;font-size:16px;color:#e8c872;flex:none}`;
{const q=new URLSearchParams(location.search).get('sab');if(q)document.documentElement.style.setProperty('--sab',(+q)+'px')}
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const nav=document.createElement('nav');nav.id='tnav';
nav.innerHTML='<button data-t="top" class="on">'+tsv('home')+'Home</button><button data-t="browse">'+tsv('tools')+'Tools</button><button data-t="more">'+tsv('more')+'More</button>';
document.body.appendChild(nav);nav.dataset.s=NV;
const sh=document.createElement('div');sh.id='tsh';sh.innerHTML='<div class="bg"></div><div class="pn"></div>';document.body.appendChild(sh);
const pn=sh.querySelector('.pn');
const vs=document.createElement('style');document.head.appendChild(vs);
const nx=document.createElement('button');nx.id='nvx';nx.textContent='✕ Close';document.body.appendChild(nx);
function closeOv(){const so=document.getElementById('solo');if(so&&so.classList.contains('on')){const b=document.getElementById('sback');if(b)b.click();so.classList.remove('on')}
 const cv=document.getElementById('cmpv');if(cv&&cv.classList.contains('show')){const x=document.getElementById('cx');if(x)x.click();cv.classList.remove('show')}}
const IDX=!!document.querySelector('.ctl');
function goHome(){if(!IDX){location.href='index.html';return}closeOv();unmark();delete document.body.dataset.nv;vs.textContent='';sh.classList.remove('show');const n=document.querySelector('.note');if(n)n.classList.remove('show');document.body.classList.add('simple');scrollTo({top:0,behavior:'instant'});setTimeout(()=>scrollTo({top:0,behavior:'instant'}),80);mark('top')}
document.addEventListener('click',e=>{if(e.target.closest('#sback,#cx'))setTimeout(goHome,0)});
function unmark(){document.querySelectorAll('.nva,.nvp').forEach(e=>e.classList.remove('nva','nvp'))}
function shut(){unmark();delete document.body.dataset.nv;vs.textContent='';scrollTo(0,0)}
nx.onclick=()=>goHome();
function openF(id){closeOv();document.body.classList.remove('simple');document.body.dataset.nv=id;
 if(id=='ctl'){unmark();vs.textContent='';var el=document.querySelector('.ctl')}else{vs.textContent='#'+id+'{display:block!important}';var el=document.getElementById(id);if(el){el.open=true;unmark();el.classList.add('nvp');for(let a=el.parentElement;a;a=a.parentElement){a.classList.add('nva');if(a==document.body)break}}}
 close();setTimeout(()=>{if(id!='ctl')scrollTo(0,0);else if(el)scrollTo(0,el.getBoundingClientRect().top+scrollY-16)},150)}
const XF=[['ptimer','Timer'],['pal','Alerts (page open only)'],['pwl','Watchlist'],['ppr','Sold prices'],['pfeed','Feed 36h']];
function feats(){if(!IDX)return `<div class="gr"></div><h4>Tools</h4><div class="fl"><a class="it" href="index.html#nv=ctl">${sv('browse')}<span>Browse<small>Full list, sort, class, filters and Filters+</small></span><i>›</i></a>${XF.map(([k,l])=>`<a class="it" href="index.html#nv=${k}">${sv(k)}<span>${l}</span><i>›</i></a>`).join('')}<a class="it" href="classes.html">${sv('cls')}<span>Top by class</span><i>›</i></a></div>`;
 const fs=[...document.querySelectorAll('details.pro[id]')].filter(d=>d.id!='padv').map(d=>{const t=(d.querySelector('summary')||{}).textContent||d.id;return `<button class="it" data-f="${d.id}">${sv(d.id)}<span>${clean(t)}</span><i>›</i></button>`}).join('');
 return `<div class="gr"></div><h4>Tools</h4><div class="fl"><button class="it" data-b="1">${sv('browse')}<span>Browse<small>Full list, sort, class, filters and Filters+</small></span><i>›</i></button>${fs}<a class="it" href="classes.html">${sv('cls')}<span>Top by class</span><i>›</i></a></div>`}
function close(){sh.classList.remove('show');pn.style.transform='';sh.querySelector('.bg').style.opacity='';mark(document.body.classList.contains('simple')?'top':'browse')}
sh.querySelector('.bg').onclick=close;
(function(){let y0=0,dy=0,t0=0,on=false,dec=false,ly=0,lt=0,v=0;const bg=sh.querySelector('.bg');
pn.addEventListener('touchstart',e=>{const r=pn.getBoundingClientRect(),ty=e.touches[0].clientY;
 on=(ty-r.top<44)||pn.scrollTop<=0;dec=false;y0=ty;dy=0;t0=e.timeStamp;ly=ty;lt=t0;v=0},{passive:true});
pn.addEventListener('touchmove',e=>{if(!on)return;dy=e.touches[0].clientY-y0;
 if(!dec){if(Math.abs(dy)<6)return;dec=true;if(dy<0||pn.scrollTop>0){on=false;return}sh.classList.add('drag')}
 if(e.cancelable)e.preventDefault();{const n=e.timeStamp,cy=e.touches[0].clientY;if(n>lt)v=(cy-ly)/(n-lt);ly=cy;lt=n}const d=Math.max(0,dy);pn.style.transform='translateY('+d+'px)';bg.style.opacity=Math.max(0,1-d/(pn.offsetHeight||400))},{passive:false});
pn.addEventListener('touchend',()=>{if(!on||!dec){on=false;return}on=false;sh.classList.remove('drag');
  if(dy>80||(v>0.5&&dy>20)){pn.style.transform='translateY(100%)';bg.style.opacity=0;setTimeout(close,240)}else{pn.style.transform='';bg.style.opacity=''}});
})();
function mark(t){nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t==t))}
function browse(){closeOv();unmark();document.body.classList.remove('simple');document.body.dataset.nv='ctl';vs.textContent='';
 const cur=(document.getElementById('fsort')||{}).value, fc=document.getElementById('fcls');
 const sorts=[...document.querySelectorAll('.ctl .qs [data-s]')].map(b=>`<button class="ch${b.dataset.s==cur?' on':''}" data-s="${b.dataset.s}">${b.textContent}</button>`).join('');
 const cls=fc?[...fc.options].map(o=>`<button class="ch${o.value==fc.value?' on':''}" data-c="${o.value}">${o.value?o.text:'All classes'}</button>`).join(''):'';
 pn.innerHTML=`<div class="gr"></div><h4>Sort</h4><div class="row">${sorts}</div><h4>Class</h4><div class="row">${cls}</div>`;
 pn.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>openF(b.dataset.f));
 pn.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{document.querySelector('.ctl .qs [data-s="'+b.dataset.s+'"]').click();close();scrollTo(0,0)});
 pn.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{fc.value=b.dataset.c;fc.dispatchEvent(new Event('change',{bubbles:true}));fc.dispatchEvent(new Event('input',{bubbles:true}));close();scrollTo(0,0)});
 sh.classList.add('show');mark('browse')}
function tools(){pn.innerHTML=feats();
 const db=pn.querySelector('[data-b]');if(db)db.onclick=browse;
 pn.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>openF(b.dataset.f));
 sh.classList.add('show');mark('browse')}
function more(){pn.innerHTML=`<div class="gr"></div>
<a class="it" href="changelog.html">${sv('news')}<span>What's new<small>Latest site updates</small></span></a>
<button class="it" id="thow">${sv('how')}<span>How this works<small>Fair value, build score and badges</small></span></button>`;
 pn.querySelector('#thow').onclick=()=>{if(!IDX){location.href='index.html#nv=how';return}closeOv();unmark();document.body.classList.remove('simple');document.body.dataset.nv='how';const n=document.querySelector('.note');n.classList.add('show');close();setTimeout(()=>scrollTo({top:n.getBoundingClientRect().top+scrollY-((document.getElementById('xnav')||{}).offsetHeight||0)-12,behavior:'smooth'}),60)};
 sh.classList.add('show');mark('more')}
if(IDX){const m=location.hash.match(/nv=([a-z]+)/);if(m){const k=m[1];history.replaceState(null,'',location.pathname+location.search);let n=0;const tm=setInterval(()=>{n++;const ready=document.querySelector('#t20 .tr20')&&(k=='ctl'||k=='how'||document.getElementById(k));if(ready||n>60){clearInterval(tm);if(!ready)return;
 if(k=='ctl'){closeOv();unmark();document.body.classList.remove('simple');document.body.dataset.nv='ctl';mark('browse');scrollTo(0,0)}
 else if(k=='how'){more();pn.querySelector('#thow').click()}else openF(k)}},150)}}
else mark(/classes/.test(location.pathname)?'browse':'');
nav.onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.t;
 if(t=='top')goHome()
 else if(t=='browse')tools();else more()};
})();
