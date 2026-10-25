/* Share links (?c=listing id), Deal of the day spotlight, and per-character price history chart. Display only. */
(function(){
const BASE='https://itsme1tan.github.io/mir4-deal-finder/';
const fm=n=>n==null?'–':Number(n).toLocaleString(undefined,{maximumFractionDigits:0});
const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;
const IC=n=>`<i class="ico" style="--i:url(icons/ui/${n}.svg)"></i>`;
const ready=f=>{const t=setInterval(()=>{if(typeof D!='undefined'&&D&&D.listings&&document.getElementById('t20')){clearInterval(t);f()}},150)};
document.head.insertAdjacentHTML('beforeend',`<style>
.shb{display:inline-flex;align-items:center;justify-content:center;width:26px;height:24px;margin-left:6px;padding:0;border:1px solid #c9a7ff;border-radius:999px;background:rgba(201,167,255,.10);color:#d9c4ff;cursor:pointer;vertical-align:middle;flex:none}
.shb .ico{width:13px;height:13px;background:#d9c4ff}
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
function pick(){const day=ptDay(Date.now());let s={};try{s=JSON.parse(localStorage.mir4dotd||'{}')}catch(e){}
 let x=s.day==day&&D.listings.find(y=>y.id==s.id);
 if(!x){const L=D.listings.filter(y=>y.usd<25000&&y.discount!=null&&y.build_score!=null).sort((a,b)=>(b.build_score+1.5*b.discount)-(a.build_score+1.5*a.discount));x=L[0];if(x)localStorage.mir4dotd=JSON.stringify({day,id:x.id})}
 return x}
function left(){const n=Date.now(),p=new Date(new Date(n).toLocaleString('en-US',{timeZone:'America/Los_Angeles'})),s=86400-(p.getHours()*3600+p.getMinutes()*60+p.getSeconds()),q=v=>String(v).padStart(2,'0');return Math.floor(s/3600)+':'+q(Math.floor(s%3600/60))+':'+q(s%60)}
function dotd(){const x=pick();let o=document.getElementById('dotd');if(!x){o&&o.remove();return}
 if(!o){o=document.createElement('div');o.id='dotd';document.getElementById('t20').before(o)}
 const W=JSON.parse(localStorage.mir4watch||'{}'),w=W[key(x)],st=document.querySelector('.hwk .strong');
 o.innerHTML=`<div class="dh"><span>🏆 Deal of the day</span><small>New pick in <span id="dotdc">${left()}</span></small></div>
<div class="db" data-id="${x.id}"><img src="icons/class/${x.cls.toLowerCase()}.webp" alt="${x.cls}" width="48" height="48"><div class="dm"><div class="dn">${x.name}</div><div class="ds"><span>${x.cls}</span><span>${IC('server')} ${x.server}</span><span>⚡ ${fm(x.ps/1000)}k</span><span>${IC('swords')} ${fm(x.atk/1000)}k</span><span>${IC('gauge')} ${x.build_score}</span></div></div>
<div class="dp"><b>$${fm(x.usd)}</b><small>${fm(x.wemix)} W</small><small class="${x.discount>0?'u':''}" style="${x.discount>0?'':'color:#f87171'}">${x.discount>0?'▼ '+x.discount+'% under':'▲ '+(-x.discount)+'% over'}</small></div></div>
<div class="df">${x.strong&&st?st.outerHTML:''}<button class="wst ${w?'on':''}" data-w="${encodeURIComponent(key(x))}" title="${w?'Watching. Tap to stop':'Watch this character'}">${w?'★':'☆'}</button>${btn(x.id)}</div>`;
 o.querySelector('.db').onclick=()=>T20.solo(x.id,D.listings);
 o.querySelector('.wst').addEventListener('click',()=>setTimeout(dotd,50))}
setInterval(()=>{const c=document.getElementById('dotdc');if(!c)return;const v=left();if(v=='24:00:00'||/^0:00:0[01]$/.test(v))dotd();c.textContent=v},1000);
// ---------- price history chart ----------
let RH=null,WD=null;
function chart(){const s=document.getElementById('solo');if(!s||!s.classList.contains('on'))return;const c=s.querySelector('.bd .card[data-id]');if(!c||s.querySelector('.phc'))return;
 const x=D.listings.find(y=>y.id==c.dataset.id);if(!x)return;
 if(!RH){RH=1;Promise.all([fetch('data/relist_history.json?'+Date.now()).then(r=>r.json()),fetch('data/wemix_daily.json?'+Date.now()).then(r=>r.json()),fetch('data/sold_archive.json?'+Date.now()).then(r=>r.json())]).then(([a,b,z])=>{RH=a;WD=b;RH.sold=z;chart()});return}
 if(RH===1)return;
 const box=document.createElement('div');box.className='phc';s.querySelector('.bd').prepend(box);
 const ob=(RH.chars[key(x)]||{}).obs||[],pts=[];
 const T=t=>Date.parse(t.replace(' ','T')+':00-07:00'),usd=(w,t)=>{const d=new Date(t).toISOString().slice(0,10);let r=null;for(let i=0;i<6&&!r;i++)r=WD[new Date(t-i*864e5).toISOString().slice(0,10)];return w*(r||D.wemix_usd)};
 if(x.on_since&&ob.length&&T(x.on_since)<T(ob[0].t)-36e5)pts.push({t:T(x.on_since),w:ob[0].wemix,k:'first'});
 ob.forEach((o,i)=>{const p=ob[i-1];if(!p){if(!pts.length)pts.push({t:T(o.t),w:o.wemix,k:'first'});return}if(o.id!=p.id||o.wemix!=p.wemix)pts.push({t:T(o.t),w:o.wemix,k:'re',old:p.wemix})});
 const sold=(RH.sold||[]).filter(y=>key(y)==key(x)&&y.sold).map(y=>({t:Date.parse(y.sold.replace(' ','T')+':00+08:00'),w:y.wemix,k:'sold'}));
 const now=Date.now();pts.push({t:now,w:x.wemix,k:'now'});
 const all=[...sold,...pts].sort((a,b)=>a.t-b.t);all.forEach(p=>p.u=p.k=='now'?x.usd:usd(p.w,p.t));
 const kf=v=>'$'+(v>=1e4?(v/1e3).toFixed(1)+'k':(v/1e3).toFixed(2)+'k');
 const steps=pts.filter((p,i)=>i==0||p.k=='now'||p.w!=pts[i-1].w||p.k=='re');
 const S=[...sold,...steps].sort((a,b)=>a.t-b.t);S.forEach(p=>p.u=p.w*D.wemix_usd);
 const f0=pts[0],chg=x.usd-f0.w*D.wemix_usd,pc=Math.round(chg/(f0.w*D.wemix_usd)*1000)/10,cuts=pts.filter(p=>p.k=='re'&&p.w<p.old).length;
 const head=`<div class="phh"><b>Now $${fm(x.usd)}</b> <small>${fm(x.wemix)} W</small><div class="${chg<0?'dn':'up'}">${Math.abs(chg)<1?'Same price since first listed':(chg<0?'▼ down':'▲ up')+` $${fm(Math.abs(chg))} (${Math.abs(pc)}%) since first listed`}</div></div>`;
 if(S.length<2){box.innerHTML='<h4>📈 Price history</h4>'+head+'<div class="phn">No price changes yet. We have tracked this character since '+(x.on_since||'Oct 20')+' PT.</div>';return}
 const n=S.length,W0=340,L=14,R=14,TT=30,B=34,H0=190,u=S.map(p=>p.u),lo=Math.min(...u),hi=Math.max(...u),pad=(hi-lo||hi*.05)*.18;
 const X=i=>L+(n==1?0:i/(n-1))*(W0-L-R),Y=v=>TT+(hi+pad-v)/((hi-lo)+2*pad||1)*(H0-TT-B);
 const pd=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric'});
 const line=S.map((p,i)=>(i?'H'+X(i).toFixed(1)+' V':'M'+X(i).toFixed(1)+' ')+Y(p.u).toFixed(1)).join(' ');
 const every=Math.ceil(n/6);let g='',m='',lb='',dl='',lastD='',lastLX=-99;
 S.forEach((p,i)=>{const cx=X(i),cy=Y(p.u),ti=`${pd.format(p.t)}: ${fm(p.w)} W (~$${fm(p.u)} today)`,up=i%2==0||n<=6;
  const ds=p.k=='now'?'Now':pd.format(p.t);if((i==0||i==n-1||i%every==0)&&ds!=lastD&&(lastD=ds))dl+=`<text x="${cx}" y="${H0-10}" text-anchor="${i==0?'start':i==n-1?'end':'middle'}" fill="#b9a3bd" font-size="11">${p.k=='now'?'Now':pd.format(p.t)}</text>`;
  const chgd=i==0||Math.round(p.u)!=Math.round(S[i-1].u);if(chgd&&p.k!='now'&&cx-lastLX>34&&(lastLX=cx))lb+=`<text x="${i==0?cx-4:cx+2}" y="${cy-14}" text-anchor="start" fill="${p.k=='now'?'#e8c872':'#e3d3e6'}" font-size="${p.k=='now'?12:11}" font-weight="${p.k=='now'?700:500}">${kf(p.u)}</text>`;
  const hit=`<circle cx="${cx}" cy="${cy}" r="14" fill="transparent"/>`;
  if(p.k=='first')m+=`<g><title>First listed ${ti}</title>${hit}<circle cx="${cx}" cy="${cy}" r="8" fill="#2a1030" stroke="#e8c872"/><g transform="translate(${cx-5.5} ${cy-5.5}) scale(.46)" fill="none" stroke="#e8c872" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 21.4 2.6 13.4a2 2 0 0 1 0-2.8L10.6 2.6A2 2 0 0 1 12 2h6a2 2 0 0 1 2 2v2.5"/><circle cx="16.5" cy="16.5" r="5.5"/><path d="M16.5 14v2.6l1.7 1.1"/></g></g>`;
  else if(p.k=='re')m+=`<g><title>${p.w<p.old?'Price cut':'Relisted'} ${ti}, was ${fm(p.old)} W</title>${hit}<circle cx="${cx}" cy="${cy}" r="7.5" fill="#2a0f2e" stroke="#be185d"/><text x="${cx}" y="${cy+3.5}" text-anchor="middle" fill="#f9a8d4" font-size="10" font-weight="700">↻</text></g>`;
  else if(p.k=='sold')m+=`<g><title>Sold ${ti}</title>${hit}<rect x="${cx-6}" y="${cy-6}" width="12" height="12" rx="2" fill="#e8c872"/></g>`;
  else m+=`<g><title>Now ${ti}</title>${hit}<circle cx="${cx}" cy="${cy}" r="10" fill="rgba(232,200,114,.25)"/><circle cx="${cx}" cy="${cy}" r="5" fill="#e8c872"/></g>`});
 box.innerHTML=`<h4>📈 Price history</h4>${head}<svg viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Price history chart"><line x1="${L}" x2="${W0-R}" y1="${H0-B+6}" y2="${H0-B+6}" stroke="#3a2040"/><path d="${line}" fill="none" stroke="#e8c872" stroke-width="2.5" stroke-linejoin="round"/>${m}${lb}${dl}</svg>
<div class="phl"><span>${IC('listed')} First listed</span><span><span class="phrl">↻</span> Price cut or relist</span>${sold.length?'<span>🏷️ Sold</span>':''}<span><b style="color:#e8c872">●</b> Now</span></div>
<div class="phn">Each step is one price change, evenly spaced (not to time scale). ${cuts?`${cuts} price cut${cuts>1?'s':''}. `:''}$ uses today's WEMIX price so only the seller's changes show. Tap or hold a marker for the date.</div>`}
ready(()=>{dotd();inject();openShared()});
})();
