/* Share links (?c=listing id), Top deal right now spotlight, and per-character price history chart. Display only. */
(function(){
const BASE='https://itsme1tan.github.io/mir4-deal-finder/';
const fm=n=>n==null?'–':Number(n).toLocaleString(undefined,{maximumFractionDigits:0});
const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;
const IC=n=>`<i class="ico" style="--i:url(icons/ui/${n}.svg)"></i>`;
const ready=f=>{const t=setInterval(()=>{if(typeof D!='undefined'&&D&&D.listings&&document.getElementById('t20')){clearInterval(t);f()}},150)};
document.head.insertAdjacentHTML('beforeend',`<style>
.shb{position:relative;display:inline-flex;align-items:center;justify-content:center;width:20px;height:18px;margin-left:6px;align-self:center;padding:0;border:1px solid #c9a7ff;border-radius:999px;background:rgba(201,167,255,.10);color:#d9c4ff;cursor:pointer;vertical-align:middle;flex:none}
.shb .ico{width:10px;height:10px;background:#d9c4ff}.shb::before{content:'';position:absolute;inset:-5px}
.shtip{position:fixed;z-index:100001;transform:translate(-50%,-100%);background:#2a1030;color:#e8c872;border:1px solid #e8c872;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.5);pointer-events:none}
.shglow{animation:shg 2.2s ease-out 1}@keyframes shg{0%,60%{box-shadow:0 0 0 2px #e8c872,0 0 18px 4px rgba(232,200,114,.7)}100%{box-shadow:none}}
#shbar{position:sticky;top:0;z-index:9000;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 14px;background:#2a1030;border-bottom:1px solid #e8c872;color:#f2e8f2;font-size:13px}
#shbar button{font:inherit;font-size:12px;font-weight:700;border:1px solid #e8c872;background:none;color:#e8c872;border-radius:999px;padding:3px 10px;cursor:pointer}
#shmsg{margin:10px 12px 0;padding:10px 12px;border:1px dashed #6b2a5a;border-radius:10px;background:#1c1020;color:#e8c872;font-size:13px;line-height:1.4}
#dotd{margin:10px 12px 10px;padding:10px 12px;background:linear-gradient(180deg,#2a1030,#1c1020);border:1px solid #e8c872;border-radius:12px;box-shadow:0 0 14px rgba(232,200,114,.18)}
#dotd .dh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:14px;font-weight:700;color:#e8c872}
#dotd .dh small{font-weight:400;font-size:12px;color:#d9c6dc;font-variant-numeric:tabular-nums}
#dotd .db{display:flex;gap:10px;align-items:center;cursor:pointer}#dotd .db img{width:48px;height:48px;flex:none;border-radius:10px}
#dotd .dm{min-width:0;flex:1}#dotd .dn{font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dotd .ds{font-size:12px;color:#d9c6dc;display:flex;flex-wrap:wrap;gap:3px 9px;margin-top:2px}
#dotd .dp{text-align:right;flex:none}#dotd .dp b{display:block;font-size:17px;color:#fff}#dotd .dp small{display:block;font-size:12px;color:#b9a3bd}#dotd .dp .u{color:#e8c872;font-weight:700}
#dotd .df{display:flex;align-items:center;gap:6px;margin-top:8px}#dotd .wst{padding:2px 9px}
.phc{margin:6px 0 12px;padding:10px;background:#1c1020;border:1px solid #3a2040;border-radius:12px}.phc h4{margin:0 0 6px;color:#e8c872;font-size:13px}
.phc svg{display:block;width:100%;height:auto}.phl{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:#d9c6dc;margin-top:6px}.phl span{display:inline-flex;align-items:center;gap:4px}.phl .ico{width:12px;height:12px;background:#e8c872}
.phrl{display:inline-block;font-size:9px;font-weight:600;line-height:1;padding:1px 4px;border-radius:999px;border:1px solid #6b2a5a;color:#f9a8d4;background:rgba(42,15,46,.7)}
.phh{margin:0 0 6px;font-size:13px;color:#d9c6dc}.phh b{color:#e8c872;font-size:16px}.phh small{color:#b9a3bd}.phh .dn{color:#e8c872;font-size:12px;margin-top:2px}.phh .up{color:#f87171;font-size:12px;margin-top:2px}.phl{font-size:12px!important}.phn{font-size:12px;color:#b9a3bd;margin-top:4px}
</style>`);
// ---------- share ----------
const btn=id=>`<button class="shb" data-sh="${id}" title="Share this character" aria-label="Share this character">${IC('share')}</button>`;
window.SHB=btn;
function tip(el,txt){const r=el.getBoundingClientRect(),t=document.createElement('div');t.className='shtip';t.textContent=txt;t.style.left=Math.min(innerWidth-50,Math.max(50,r.left+r.width/2))+'px';t.style.top=(r.top-6)+'px';document.body.appendChild(t);setTimeout(()=>t.remove(),2000)}
function copy(s){if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(s);const a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();try{document.execCommand('copy')}finally{a.remove()}return Promise.resolve()}
document.addEventListener('click',e=>{const b=e.target.closest('.shb');if(!b)return;e.stopPropagation();e.preventDefault();
 const id=b.dataset.sh,x=D.listings.find(y=>y.id==id),url=BASE+'?c='+id;
 if(navigator.share&&matchMedia('(pointer:coarse)').matches){navigator.share({title:x?x.name+' · MIR4 Deal Finder':'MIR4 Deal Finder',text:x?`${x.name} · ${x.cls} · ${fm(x.ps/1000)}k power · $${fm(x.usd)}`:'',url}).catch(()=>{})}
 else copy(url).then(()=>tip(b,'Link copied'),()=>tip(b,url))},true);
function inject(){
 document.querySelectorAll('.card[data-id]:not([data-shd])').forEach(c=>{c.dataset.shd=1;const w=c.querySelector('.wst');if(w)w.insertAdjacentHTML('afterend',btn(c.dataset.id))});
 document.querySelectorAll('.tr20[data-id]:not([data-shd])').forEach(r=>{r.dataset.shd=1;const n=r.querySelector('.rw .n');if(n){n.style.display='flex';n.style.alignItems='center';n.insertAdjacentHTML('beforeend',btn(r.dataset.id))}});
 document.querySelectorAll('#flist a.fn[data-l]:not([data-shd])').forEach(a=>{a.dataset.shd=1;a.insertAdjacentHTML('afterend',btn(a.dataset.l))})}
new MutationObserver(()=>{clearTimeout(inject.t);inject.t=setTimeout(()=>{inject();chart()},60)}).observe(document.body,{childList:true,subtree:true});
// ---------- open ?c= ----------
const C=new URLSearchParams(location.search).get('c');
function bar(){if(document.getElementById('shbar'))return;const b=document.createElement('div');b.id='shbar';b.innerHTML='<span>🔗 Shared character</span><button>See all deals</button>';document.body.prepend(b);
 b.querySelector('button').onclick=()=>{history.replaceState(null,'',location.pathname);b.remove();document.getElementById('shmsg')?.remove();const s=document.getElementById('sback');if(s&&document.getElementById('solo')?.classList.contains('on'))s.click();scrollTo(0,0)}}
function glow(el){if(!el)return;el.scrollIntoView({block:'center'});el.classList.remove('shglow');void el.offsetWidth;el.classList.add('shglow')}
function openShared(){if(!C)return;bar();const x=D.listings.find(y=>y.id==C);
 if(x){const r=document.querySelector(`.tr20[data-id="${C}"]`);if(r){glow(r);return}T20.solo(C,D.listings);setTimeout(()=>{const c=document.querySelector('#solo .card');c&&c.classList.add('shglow')},100);return}
 const s=(D.sales||[]).find(y=>y.id==C),m=document.createElement('div');m.id='shmsg';
 m.innerHTML=s?`🏷️ <b>${s.name}</b> (${s.cls}, ${fm(s.ps/1000)}k power) sold for ${fm(s.wemix)} WEMIX (~$${fm(s.wemix*D.wemix_usd)}). Here are today's best deals.`:'This character is no longer listed. Here are today\'s best deals.';
 document.getElementById('dotd')?document.getElementById('dotd').before(m):document.getElementById('t20').before(m)}
// ---------- deal of the day ----------
const ptDay=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}).format(t);
const bb=y=>y.build_score+1.5*y.discount;
const slot=t=>{const d=new Date(t),f=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).format(d);return f};
function pick(){const h=slot(Date.now());let s={};try{s=JSON.parse(localStorage.mir4dotd||'{}')}catch(e){}
 const L=D.listings.filter(y=>y.usd<25000&&y.discount!=null&&y.build_score!=null).sort((a,b)=>bb(b)-bb(a)),best=L[0];
 let x=L.find(y=>y.id==s.id);
 if(!x||(s.h!=h&&best&&bb(best)>bb(x)))x=best;
 if(x)localStorage.mir4dotd=JSON.stringify({h,id:x.id});
 return x}
function left(){const n=new Date(),s=3600-(n.getMinutes()*60+n.getSeconds()),q=v=>String(v).padStart(2,'0');return q(Math.floor(s/60))+':'+q(s%60)}
function dotd(){const x=pick();let o=document.getElementById('dotd');if(!x){o&&o.remove();return}
 if(!o){o=document.createElement('div');o.id='dotd';document.getElementById('t20').before(o)}
 const W=JSON.parse(localStorage.mir4watch||'{}'),w=W[key(x)],st=document.querySelector('.hwk .strong');
 o.innerHTML=`<div class="dh"><span>🏆 Top deal right now</span><small title="Every hour we check for a better deal. The pick only changes if one is found, or if this character sells or is delisted.">Rechecks in <span id="dotdc">${left()}</span></small></div>
<div class="db" data-id="${x.id}"><img src="icons/class/${x.cls.toLowerCase()}.webp" alt="${x.cls}" width="48" height="48"><div class="dm"><div class="dn">${x.name}</div><div class="ds"><span>${x.cls}</span><span>${IC('server')} ${x.server}</span><span>⚡ ${fm(x.ps/1000)}k</span><span>${IC('swords')} ${fm(x.atk/1000)}k</span><span>${IC('gauge')} ${x.build_score}</span></div></div>
<div class="dp"><b>$${fm(x.usd)}</b><small>${fm(x.wemix)} W</small><small class="${x.discount>0?'u':''}" style="${x.discount>0?'':'color:#f87171'}">${x.discount>0?'▼ '+x.discount+'% under':'▲ '+(-x.discount)+'% over'}</small></div></div>
<div class="df">${x.strong&&st?st.outerHTML:''}<button class="wst ${w?'on':''}" data-w="${encodeURIComponent(key(x))}" title="${w?'Watching. Tap to stop':'Watch this character'}">${w?'★':'☆'}</button>${btn(x.id)}</div>`;
 o.querySelector('.db').onclick=()=>T20.solo(x.id,D.listings);
 o.querySelector('.wst').addEventListener('click',()=>setTimeout(dotd,50))}
setInterval(()=>{const c=document.getElementById('dotdc');if(!c)return;const v=left();if(v=='60:00'||v=='00:00')dotd();c.textContent=v},1000);
// ---------- price history chart ----------
let RH=null,WD=null;
function chart(){const s=document.getElementById('solo');if(!s||!s.classList.contains('on'))return;const c=s.querySelector('.bd .card[data-id]');if(!c||s.querySelector('.phc'))return;
 const x=D.listings.find(y=>y.id==c.dataset.id);if(!x)return;
 if(!RH){RH=1;FH.load().then(z=>{RH=z;WD=z.WD;chart()});return}
 if(RH===1)return;
 const box=document.createElement('div');box.className='phc';const htp=s.querySelector('.bd .tp[data-p=hist]');if(htp)htp.prepend(box);else s.querySelector('.bd').prepend(box);
 const FE=FH.build(x,RH),pts=[];const ob=[{t:FE.tracked?new Date(FE.tracked).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,16):''}];
 const T=t=>Date.parse(t.replace(' ','T')+':00-07:00'),EST=FE.est;
 FE.events.forEach(e=>{if(e.past||!e.w||e.type=='sold'||e.type=='delisted')return;if(FE.chain){pts.push(pts.length?{t:e.t,w:e.w,k:'re',old:e.from||pts[pts.length-1].w}:{t:e.t,w:e.w,k:'first'});return}if(e.est)pts.push({t:e.t,w:(FE.events.find(z=>z.type=='seen')||{}).w,k:'first',est:1});else if(e.type=='seen')pts.push({t:e.t,w:e.w,k:'seen'});else if(e.type=='listed')pts.push({t:e.t,w:e.w,k:'first'});else pts.push({t:e.t,w:e.w,k:'re',old:e.from})});
 const sold=FE.events.filter(e=>e.type=='sold').map(e=>({t:e.t,w:e.w,k:'sold'}));
 const now=Date.now();pts.push({t:now,w:x.wemix,k:'now'});
 const all=[...sold,...pts].sort((a,b)=>a.t-b.t);all.forEach(p=>p.u=p.k=="now"?x.usd:p.w*(FH.rate(RH,p.t)||D.wemix_usd));
 const kf=v=>'$'+(v>=1e4?(v/1e3).toFixed(1)+'k':(v/1e3).toFixed(2)+'k');
 const steps=pts.filter((p,i)=>i==0||p.k=='now'||p.k=='seen'||p.w!=pts[i-1].w||p.k=='re');
 const S=[...sold,...steps].sort((a,b)=>a.t-b.t);S.forEach(p=>p.u=p.w*D.wemix_usd);
 const f0=pts[0],chg=x.usd-f0.w*D.wemix_usd,pc=Math.round(chg/(f0.w*D.wemix_usd)*1000)/10,cuts=pts.filter(p=>p.k=='re'&&p.w<p.old).length;
 const pd0=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric'});const head=`<div class="phh"><b>Now $${fm(x.usd)}</b> <small>${fm(x.wemix)} W</small><div class="${chg<0?'dn':'up'}">${Math.abs(chg)<1?'Same price since first listed':(chg<0?'▼ down':'▲ up')+` $${fm(Math.abs(chg))} (${Math.abs(pc)}%) since ${EST?'first seen '+pd0.format(T(ob[0].t)):'first listed'}`}</div></div>`;
 if(S.length<2){box.innerHTML='<h4>📈 Price history</h4>'+head+'<div class="phn">No price changes yet. We have tracked this character since '+(x.on_since||'Oct 20')+' PT.</div>';return}
 const n=S.length,W0=340,L=14,R=14,TT=30,B=34,H0=190,u=S.map(p=>p.u),lo=Math.min(...u),hi=Math.max(...u),pad=(hi-lo||hi*.05)*.18;
 const X=i=>L+(n==1?0:i/(n-1))*(W0-L-R),Y=v=>TT+(hi+pad-v)/((hi-lo)+2*pad||1)*(H0-TT-B);
 const pd=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric'});
 const i0=S[0].est?1:0,line=S.slice(i0).map((p,j)=>{const i=j+i0;return (j?'H'+X(i).toFixed(1)+' V':'M'+X(i).toFixed(1)+' ')+Y(p.u).toFixed(1)}).join(' ')+(i0?`" fill="none" stroke="#e8c872" stroke-width="2.5" stroke-linejoin="round"/><path d="M${X(0).toFixed(1)} ${Y(S[0].u).toFixed(1)} H${X(1).toFixed(1)}" stroke-dasharray="4 4" stroke-width="1.6" opacity=".7`:'');
 const every=Math.ceil(n/6);let g='',m='',lb='',dl='',lastD='',lastLX=-99;
 S.forEach((p,i)=>{const cx=X(i),cy=Y(p.u),ti=`${pd.format(p.t)}: ${fm(p.w)} W (~$${fm(p.u)} today)`,up=i%2==0||n<=6;
  const ds=p.k=='now'?'Now':(p.est?'~':'')+pd.format(p.t);if((i==0||i==n-1||(i%every==0&&cx<X(n-1)-44))&&ds!=lastD&&(lastD=ds))dl+=`<text x="${cx}" y="${H0-10}" text-anchor="${i==0?'start':i==n-1?'end':'middle'}" fill="#b9a3bd" font-size="11">${p.k=='now'?'Now':pd.format(p.t)}</text>`;
  const chgd=i==0||Math.round(p.u)!=Math.round(S[i-1].u);if(p.est)lb+=`<text x="${cx-4}" y="${cy-14}" text-anchor="start" fill="#b9a3bd" font-size="11">price not tracked</text>`,lastLX=cx+60;else if((chgd||p.k=='seen')&&p.k!='now'&&cx-lastLX>34&&(lastLX=cx))lb+=`<text x="${i==0?cx-4:cx+2}" y="${cy-14}" text-anchor="start" fill="${p.k=='now'?'#e8c872':'#e3d3e6'}" font-size="${p.k=='now'?12:11}" font-weight="${p.k=='now'?700:500}">${kf(p.u)}</text>`;
  const hit=`<circle cx="${cx}" cy="${cy}" r="14" fill="transparent"/>`;
  if(p.k=='seen')m+=`<g><title>First seen by our tracker ${ti}</title>${hit}<circle cx="${cx}" cy="${cy}" r="4.5" fill="#2a1030" stroke="#e8c872" stroke-width="2"/></g>`;else if(p.k=='first')m+=`<g><title>${p.est?`First listed about ${pd.format(p.t)} (worked out from its listing number). Its price before we started tracking is not known.`:'First listed '+ti}</title>${hit}<circle cx="${cx}" cy="${cy}" r="8" fill="#2a1030" stroke="#e8c872"/><g transform="translate(${cx-5.5} ${cy-5.5}) scale(.46)" fill="none" stroke="#e8c872" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 21.4 2.6 13.4a2 2 0 0 1 0-2.8L10.6 2.6A2 2 0 0 1 12 2h6a2 2 0 0 1 2 2v2.5"/><circle cx="16.5" cy="16.5" r="5.5"/><path d="M16.5 14v2.6l1.7 1.1"/></g></g>`;
  else if(p.k=='re')m+=`<g><title>${p.w<p.old?'Price cut':'Relisted'} ${ti}, was ${fm(p.old)} W</title>${hit}<circle cx="${cx}" cy="${cy}" r="7.5" fill="#2a0f2e" stroke="#be185d"/><text x="${cx}" y="${cy+3.5}" text-anchor="middle" fill="#f9a8d4" font-size="10" font-weight="700">↻</text></g>`;
  else if(p.k=='sold')m+=`<g><title>Sold ${ti}</title>${hit}<rect x="${cx-6}" y="${cy-6}" width="12" height="12" rx="2" fill="#e8c872"/></g>`;
  else m+=`<g><title>Now ${ti}</title>${hit}<circle cx="${cx}" cy="${cy}" r="10" fill="rgba(232,200,114,.25)"/><circle cx="${cx}" cy="${cy}" r="5" fill="#e8c872"/></g>`});
 box.innerHTML=`<h4>📈 Price history</h4>${head}<svg viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Price history chart"><line x1="${L}" x2="${W0-R}" y1="${H0-B+6}" y2="${H0-B+6}" stroke="#3a2040"/><path d="${line}" fill="none" stroke="#e8c872" stroke-width="2.5" stroke-linejoin="round"/>${m}${lb}${dl}</svg>
<div class="phl"><span>${IC('listed')} First listed</span><span><span class="phrl">↻</span> Price cut or relist</span>${sold.length?'<span>🏷️ Sold</span>':''}${EST?'<span><b style="color:#e8c872">○</b> First seen</span>':''}<span><b style="color:#e8c872">●</b> Now</span></div>
<div class="phn">Each step is one price change, evenly spaced (not to time scale). ${cuts?`${cuts} price cut${cuts>1?'s':''}. `:''}${EST?`First listed about ${pd.format(T(x.on_since))}, worked out from its listing number; we started tracking it ${pd.format(T(ob[0].t))}. `:''}$ here uses today's WEMIX price so only the seller's changes show; History below shows $ at each day's WEMIX price. Tap or hold a marker for the date.</div>`}
ready(()=>{dotd();inject();openShared()});
})();
