/* One full history per character, shared by the details History box and the Price history chart so they always agree.
   Sources: our tracker snapshots (data/relist_history.json, since Oct 20 2026), tracked events (data/char_history.json: sold, delisted),
   the marketplace's own listing time for the current listing, the first listing date worked out from its listing number (market.py on_since),
   and sold records (data/sold_archive.json + recent sales). $ uses the WEMIX price of that day (data/wemix_daily.json). Display only. */
(function(){
const PT=t=>Date.parse(t.replace(' ','T')+':00-07:00'),H8=t=>Date.parse(t.replace(' ','T')+':00+08:00');
const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;
let P=null;
window.FH={
 load(){return P||(P=Promise.all(['data/relist_history.json','data/char_history.json','data/sold_archive.json','data/wemix_daily.json','data/chain_history.json','data/past_names.json'].map(u=>fetch(u+'?'+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}))))
  .then(([rh,ch,sa,wd,nc,pn])=>{const S={PN:(pn&&pn.tokens)||{},RH:rh.chars||{},CH:ch.chars||{},SA:Array.isArray(sa)?sa:[],WD:wd||{},NC:nc||{},TK:{}};
   for(const k in S.NC){const r=S.NC[k];if(r.token&&!r.bad&&!r.nomatch)(S.TK[r.token]=S.TK[r.token]||[]).push(k)}
   window.FHS=S;document.dispatchEvent(new Event('fh-ready'));return S}))},
 // Same token = same character, even after a rename or a server move. Records whose class does not match the token are left out (bad match).
 who(x,S){S=S||window.FHS;if(!S)return null;const r=S.NC[key(x)];if(!r||r.bad||r.nomatch||!r.token)return null;const ks=S.TK[r.token]||[key(x)];
  let now=null;const nm=[];ks.forEach(k=>{const q=S.NC[k];if(q.now&&(!now||q.now.t>now.t))now=q.now;nm.push(k.split('|')[0]);(q.names||[]).forEach(n=>nm.push(n.name))});
  const all=[...new Set(nm)];return {token:r.token,now,keys:ks,names:all,formerly:all.filter(n=>n!=x.name&&(!now||n!=now.name))}},
 fold(t){return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[øØ]/g,'o').toLowerCase()},
 alias(x){const w=FH.who(x);if(!w)return '';const n=w.names.concat(w.now?[w.now.name]:[]).join(' ');return ' '+n+' '+FH.fold(n)},
 rate(S,t){for(let i=0;i<7;i++){const r=S.WD[new Date(t-i*864e5).toISOString().slice(0,10)];if(r)return r}return typeof D!='undefined'?D.wemix_usd:null},
 chain(x,S){const k=key(x);let c=S.NC[k];if(!c||!c.events||c.bad||c.nomatch)return null;(S.TK[c.token]||[]).forEach(z=>{const q=S.NC[z];if(q.events&&(q.blk||0)>(c.blk||0))c=q});const E=[];
  const G=new Set(['0x7a53f80e849efda468f322f5401bdf71d5a5d1e5']);let own=null,hops=0;// custody wallet: moves out and back, not owner changes
  c.events.forEach(e=>{const t=PT(e.t),p=E[E.length-1];
   if(e.type=='minted'){own=e.to}else if(e.type=='transfer'){if(G.has(e.to)||e.to==own){hops++;return}own=e.to}else if(e.type=='sold')own=e.to;
   if(e.type=='listed'&&p&&p.type=='delisted'&&t-p.t<=9e5){E.pop();E.push({t,type:'relisted',w:e.wemix,from:p.w,ch:1})}
   else E.push({t,type:e.type,w:e.wemix||null,ch:1,to:e.to})});
  // the current owner's run starts after the last sale or transfer; older rows are "past"
  let cut=-1;E.forEach((e,i)=>{if(e.type=='sold'||e.type=='transfer'||e.type=='minted')cut=i});E.forEach((e,i)=>{if(i<=cut)e.past=1});
  const st=E.find(e=>!e.past&&e.type=='listed');
  E.forEach(e=>{const r=FH.rate(S,e.t);e.usd=e.w&&r?Math.round(e.w*r):null});
  return {events:E,est:false,chain:1,hops,token:c.token,first:st?st.t:null,tracked:st?st.t:null}},
 build(x,S){const C=FH.chain(x,S);if(C)return C;const k=key(x),ob=((S.RH[k]||{}).obs||[]).slice().sort((a,b)=>PT(a.t)-PT(b.t)),E=[];
  const mt=x.listed?H8(x.listed):null;// marketplace time of the current listing
  if(ob.length){const f=ob[0],est=x.on_since&&PT(x.on_since)<PT(f.t)-36e5;
   if(est)E.push({t:PT(x.on_since),type:'listed',est:1,id:f.id,w:null});
   E.push({t:est?PT(f.t):(x.on_since&&PT(x.on_since)<=PT(f.t)?PT(x.on_since):PT(f.t)),type:est?'seen':'listed',id:f.id,w:f.wemix});
   ob.forEach((o,i)=>{const p=ob[i-1];if(!p)return;if(o.id!=p.id)E.push({t:o.id==x.id&&mt&&mt<=PT(o.t)+36e5?mt:PT(o.t),type:'relisted',id:o.id,w:o.wemix,from:p.wemix});else if(o.wemix!=p.wemix)E.push({t:PT(o.t),type:'price',id:o.id,w:o.wemix,from:p.wemix})})}
  else if(x.on_since)E.push({t:PT(x.on_since),type:'listed',id:x.id,w:x.wemix});
  ((S.CH[k]||{}).events||[]).forEach(e=>{if(e.type=='sold'||e.type=='delisted')E.push({t:PT(e.t),type:e.type,w:e.wemix||null})});
  const seen=new Set();[...S.SA,...((typeof D!='undefined'&&D.sales)||[])].forEach(s=>{if(key(s)!=k||!s.sold||seen.has(s.id))return;seen.add(s.id);
   if(s.listed)E.push({t:H8(s.listed),type:'listed',id:s.id,w:s.wemix,past:1});E.push({t:H8(s.sold),type:'sold',id:s.id,w:s.wemix})});
  E.sort((a,b)=>a.t-b.t);E.forEach(e=>{const r=FH.rate(S,e.t);e.usd=e.w&&r?Math.round(e.w*r):null});
  return {events:E,est:E.some(e=>e.est),tracked:ob.length?PT(ob[0].t):null}}
};
})();

// Tools > Price history: search any character we track (current or old name) and show its full record here.
FH.tool=function(){if(FH._t)return;FH._t=1;const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;let q,L,R;const g=()=>{q=document.getElementById('phq');L=document.getElementById('phl');R=document.getElementById('phres');return q};
 const E=t=>String(t??'').replace(/[<>&"]/g,''),fmn=n=>Math.round(n).toLocaleString('en-US');
 // Search key: lower case, accents and decorations removed (丨, ツ, dots, spaces), ø as o; letters and digits of any script kept.
 const sq=t=>String(t??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[øØ]/g,'o').replace(/ß/g,'ss').replace(/[łŁ]/g,'l').replace(/[đĐ]/g,'d').toLowerCase().replace(/ツ|シ/g,'').replace(/[^\p{L}\p{N}]/gu,'');
 const lev=(a,b)=>{if(Math.abs(a.length-b.length)>3)return 99;let p=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]==b[j-1]?0:1));p=c}return p[b.length]};
 let PL=null;
 const pool=S=>{if(PL)return PL;const m=new Map(),add=(k,it)=>{if(!m.has(k))m.set(k,it)},pk=k=>{const[a,b,c]=k.split('|');return{name:a,server:b||'',cls:c}};
  ((typeof D!='undefined'&&D.listings)||[]).forEach(x=>add(key(x),{x,live:1}));
  [...((typeof D!='undefined'&&D.sales)||[]),...S.SA].forEach(s=>{if(s.sold)add(key(s),{x:s,live:0})});
  for(const k in S.NC)if(!S.NC[k].bad)add(k,{x:pk(k),live:0,tr:1});
  for(const k of [...Object.keys(S.RH),...Object.keys(S.CH)])if(k.split('|').length==3)add(k,{x:pk(k),live:0,tr:1});
  PL=[...m.values()];PL.forEach(it=>{const w=FH.who(it.x,S),ns=[it.x.name,...((w&&w.names)||[]).map(n=>n.name||n),...(w&&w.now?[w.now.name]:[])];it.ns=[...new Set(ns.map(sq).filter(Boolean))];it.hay=it.ns.join(' ')+' '+sq(it.x.server)});return PL};
 const spark=H=>{const p=H.events.filter(e=>e.w&&(e.type=='listed'||e.type=='relisted'||e.type=='price'||e.type=='sold'||e.type=='seen'));if(p.length<2)return '';
  const W=340,Hh=70,lo=Math.min(...p.map(e=>e.w)),hi=Math.max(...p.map(e=>e.w)),X=i=>8+i/(p.length-1)*(W-16),Y=v=>8+(hi-v)/((hi-lo)||1)*(Hh-16);
  const d=p.map((e,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(e.w).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${Hh}" style="width:100%;height:auto;display:block;margin:6px 0"><path d="${d}" fill="none" stroke="#e8c872" stroke-width="2" stroke-linejoin="round"/>${p.map((e,i)=>e.type=='sold'?`<circle cx="${X(i)}" cy="${Y(e.w)}" r="4" fill="#d63384"/>`:'').join('')}</svg><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 8px;font-size:11px;color:#b9a3bd;max-width:100%"><span style="min-width:0">${fmn(p[0].w)} W</span><span style="min-width:0;text-align:center;flex:1 1 auto"><b style="color:#d63384">●</b> Sold · line = asking price</span><span style="min-width:0">${fmn(p[p.length-1].w)} W</span></div>`};
 const show=(it,S)=>{const x=it.x,w=FH.who(x,S),H=FH.build(x,S);
  R.innerHTML=`<button id="phback" type="button" style="display:inline-flex;align-items:center;gap:4px;margin:8px 0 2px;background:none;border:0;color:#e8c872;font-size:13px;padding:4px 0;cursor:pointer">← Back to search</button><div style="margin:6px 0;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px;max-width:100%;overflow-x:hidden;box-sizing:border-box"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b style="color:#e8c872;overflow-wrap:anywhere">${E(w&&w.now&&w.now.name||x.name)}${w&&w.now&&w.now.name&&w.now.name!=x.name?` <small style="font-weight:400;color:#b9a3bd">formerly ${E(x.name)}</small>`:''}</b><span style="font-size:12px;color:#b9a3bd;white-space:nowrap">${it.live?'For sale':it.tr?'Tracked':'Sold'}</span></div><div style="font-size:12px;color:#b9a3bd">${E(x.cls)} · ${E(x.server||'?')}${x.wemix?' · '+fmn(x.wemix)+' W':''}</div>${spark(H)}<button id="phopen" style="margin-top:6px;width:100%;background:#26142b;color:#f2e8f2;border:1px solid #e8c87266;border-radius:999px;padding:9px;font-size:14px">Open full details</button></div><div id="phh"></div>`;
  window.hist20&&hist20(x,R.querySelector('#phh'));
  const bb=R.querySelector('#phback');if(bb)bb.onclick=()=>{q.value='';R.innerHTML='';run()};
  // Only offer saved details when they exist; otherwise link to XDRACO, or show nothing.
  const bt=R.querySelector('#phopen'),xd=x.id?'https://www.xdraco.com/nft/trade/'+x.id:'';
  const toX=()=>{if(!xd){bt.remove();return}const a=document.createElement('a');a.id='phopen';a.href=xd;a.target='_blank';a.rel='noopener';a.textContent='Open on XDRACO ↗';a.style.cssText=bt.style.cssText+';visibility:visible;display:block;text-align:center;text-decoration:none;box-sizing:border-box';bt.replaceWith(a)};
  const go=()=>{FH._phd=1;history.pushState({phd:1},'');if(it.live)solo20(x.id);else soloSold(x.id,x.name)};
  if(it.live&&window.solo20&&x.id&&typeof D!='undefined'&&D.listings.some(y=>y.id==x.id))bt.onclick=go;
  else if(x.id&&window.soloSold){bt.style.visibility='hidden';fetch('data/snaps/'+x.id+'.json',{method:'HEAD'}).then(r=>{if(r.ok){bt.style.visibility='';bt.onclick=go}else toX()}).catch(toX)}
  else toX()};
 const ico=c=>`<span title="${E(c)}" style="flex:none;display:inline-flex;width:26px;height:26px;border-radius:50%;background:#26142b;border:1px solid #e8c87255;align-items:center;justify-content:center;color:#e8c872">${typeof ci=='function'?ci(c):''}</span>`;
 const lastW=(it,S)=>{const x=it.x;if(x.wemix)return x.wemix;const r=S.NC[key(x)];if(r&&r.price)return r.price;const ev=FH.build(x,S).events.filter(e=>e.w);return ev.length?ev[ev.length-1].w:0};
 // Sold times are stored in UTC+8; shown in PT.
 const ptd=t=>{const m=String(t||'').match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);if(!m)return null;return new Date(Date.UTC(+m[1],m[2]-1,+m[3],+m[4]-8,+m[5]))};
 const top3=(S,hits,row)=>{const m=new Map();[...S.SA,...((typeof D!='undefined'&&D.sales)||[])].forEach(s=>{if(!s.sold||!s.ps)return;const k=key(s),o=m.get(k);if(!o||s.ps>o.ps)m.set(k,s)});
  const T=[...m.values()].sort((a,b)=>b.ps-a.ps).slice(0,3);if(!T.length)return '';
  return '<div style="margin-top:14px;padding:10px 12px;background:#1a0f1e;border:1px solid #5a2550;border-radius:10px"><div style="font-weight:700;color:#e8c872;font-size:14px">🏆 Top 3 strongest sold</div><div style="font-size:11px;color:#b9a3bd;margin:2px 0 4px">All time, by power score at sale. Gold circle = class. Tap a name for its history.</div>'+T.map((s,j)=>{const d=ptd(s.sold),ds=d?d.toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric'}):'?',dk=d?d.toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'}):'',r=S.WD[dk],usd=r?' · $'+fmn(s.wemix*r):'';
   const i=hits.length;hits.push({x:s,live:0});return row(hits[i],i,`<br><small style="color:#b9a3bd">#${j+1} · ${E(s.cls)} · ${E(s.server)} · ⚡ ${fmn(s.ps)}</small><br><small style="color:#b9a3bd">${fmn(s.wemix)} W${usd} · ${ds}</small>`)}).join('')+'</div>'};
 let seq=0;const run=()=>{const my=++seq;return FH.load().then(S=>{if(my!=seq||!g())return;R.innerHTML='';
  const row=(it,i,ex)=>{const w=FH.who(it.x,S),rn=w&&w.now&&w.now.name&&w.now.name!=it.x.name,nn=rn?` <small style="color:#b9a3bd">formerly ${E(it.x.name)}</small>`:'',lp=ex?0:lastW(it,S);return `<button data-i="${i}" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #3a2040;color:#f2e8f2;padding:9px 2px;font-size:14px">${ico(it.x.cls)}<span style="flex:1;min-width:0;overflow-wrap:anywhere">${E(rn?w.now.name:it.x.name)}${nn}${ex||''}</span><span style="color:#b9a3bd;font-size:12px;white-space:nowrap;text-align:right">${lp?`<b style="color:#e8c872">${fmn(lp)} W</b><br>`:''}${it.live?'for sale':it.tr?'tracked':'sold'}</span></button>`};
  const qs=sq(q.value);let hits=[];if(qs.length<2){L.innerHTML='<div style="font-size:12px;color:#b9a3bd;margin-top:6px">Search by current or old name, at least 2 letters or digits.</div>'+top3(S,hits,row);bind(hits,S);return}
  const P=pool(S);hits=P.filter(it=>it.hay.includes(qs)).sort((a,b)=>(b.live-a.live)||(!!a.tr-!!b.tr)).slice(0,20),dym=0;
  if(!hits.length){dym=1;hits=P.map(it=>[it,Math.min(...it.ns.map(n=>Math.min(lev(qs,n)+(n.length==qs.length?0:0),n.length>qs.length?Math.min(...[...Array(n.length-qs.length+1).keys()].map(i=>lev(qs,n.slice(i,i+qs.length))))+0.5:99,Math.abs(n.length-qs.length)>3?Math.abs(n.length-qs.length)+qs.length:99)))]).sort((a,b)=>a[1]-b[1]||(b[0].live-a[0].live)).slice(0,3).map(r=>r[0])}
  L.innerHTML=(hits.length?(dym?'<div style="font-size:13px;color:#e8c872;margin-top:8px">No exact match. Did you mean:</div>':'')+hits.map((it,i)=>row(it,i)).join(''):'')+(dym?top3(S,hits,row):'');
  bind(hits,S)})};
 const bind=(hits,S)=>L.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{show(hits[+b.dataset.i],S);L.innerHTML=''});
 FH.reset=()=>{if(!g())return;q.value='';R.innerHTML='';L.innerHTML='';run()};
 document.addEventListener('input',e=>{if(e.target&&e.target.id=='phq')run()},true);run()};
// Back from a detail opened in Price history: return to the tool with the selection kept.
document.addEventListener('click',e=>{if(FH._phd&&e.target.closest('#sback')){e.stopPropagation();e.preventDefault();history.back()}},true);
addEventListener('popstate',()=>{if(!FH._phd)return;FH._phd=0;const o=document.getElementById('solo'),b=document.getElementById('sback');if(o&&o.classList.contains('on')){if(b&&b.onclick)b.onclick();o.classList.remove('on')}
 document.body.dataset.nv='phist';const d=document.getElementById('phist');if(d){d.open=true;(document.getElementById('phres')||d).scrollIntoView({block:'start',inline:'nearest'});try{document.documentElement.scrollLeft=document.body.scrollLeft=0}catch(e){}}});

// After leaving to XDRACO (or any tab) and coming back: unlock scroll and clear a stuck Tools sheet so Close works.
function phUnlock(){try{document.documentElement.scrollLeft=document.body.scrollLeft=0;window.scrollTo(window.scrollX||0,window.scrollY||0)}catch(e){}
 const sh=document.getElementById('tsh');if(sh){sh.classList.remove('show','drag');const pn=sh.querySelector('.pn'),bg=sh.querySelector('.bg');if(pn)pn.style.transform='';if(bg)bg.style.opacity=''}
 if(document.body.dataset.nv==='phist'){const d=document.getElementById('phist');if(d)d.open=true}}
addEventListener('pageshow',phUnlock);addEventListener('visibilitychange',()=>{if(!document.hidden)phUnlock()});
const _ti=()=>{if(document.getElementById('phq'))FH.tool();else setTimeout(_ti,500)};_ti();
FH.load();

// Past names on a character page: every name we know for this character (same NFT token), newest first. Hidden when only one name is known.
FH.past=function(x,S){const w=FH.who(x,S);if(!w)return [];const PT=t=>Date.parse(t.replace(' ','T')+':00-07:00'),H8=t=>Date.parse(t.replace(' ','T')+':00+08:00'),R={};
 const put=(n,t,ty,wm,src)=>{if(!n)return;const o=R[n];if(!o||t>o.t)R[n]={name:n,t,ty,w:wm,src}};const ks=new Set(w.keys),key=y=>y.name+'|'+(y.server||'')+'|'+y.cls;
 [...S.SA,...((typeof D!='undefined'&&D.sales)||[])].forEach(s=>{if(s.sold&&ks.has(key(s)))put(s.name,H8(s.sold),'sold',s.wemix)});
 ((typeof D!='undefined'&&D.listings)||[]).forEach(l=>{if(ks.has(key(l))&&l.listed)put(l.name,H8(l.listed),'listed',null)});
 w.keys.forEach(k=>{const n=k.split('|')[0];((S.RH[k]||{}).obs||[]).forEach(o=>{if(!R[n])put(n,PT(o.t),'listed',null)});(S.NC[k].names||[]).forEach(q=>{if(!R[q.name])put(q.name,PT(q.seen),'seen',null)})});
 (S.PN[w.token]||[]).forEach(q=>{if(!R[q.name])put(q.name,Date.parse(q.t),'seen',q.w||null,q.src)});
 if(w.now&&!R[w.now.name])put(w.now.name,PT(w.now.t),'seen',null);
 const L=Object.values(R).sort((a,b)=>b.t-a.t);L.forEach(r=>r.cur=w.now&&r.name==w.now.name);return L};
FH.pastBox=function(x,bd,S){const p=bd.parentNode;if(!p)return;p.querySelectorAll('.pnames').forEach(e=>e.remove());const L=FH.past(x,S);if(L.length<2)return;
 const E=t=>String(t??'').replace(/[<>&"]/g,''),fm=n=>Math.round(n).toLocaleString('en-US'),dy=ms=>new Date(ms).toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric'});
 const lab={sold:'Sold',listed:'Listed',seen:'Seen'},el=document.createElement('div');el.className='pnames';
 el.style.cssText='margin:8px 0;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere';
 el.innerHTML='<div style="font-weight:700;color:#e8c872;font-size:14px">🏷️ Past names <small style="font-weight:400;color:#b9a3bd">('+L.length+')</small></div>'+L.map(r=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #2a1730;font-size:13px"><span style="min-width:0">${E(r.name)}${r.cur?' <span style="font-size:10px;font-weight:800;background:#e8c872;color:#2a1030;border-radius:999px;padding:2px 6px;vertical-align:1px">Current</span>':''}</span><span style="color:#b9a3bd;font-size:12px;text-align:right;white-space:nowrap">${lab[r.ty]} ${dy(r.t)}${r.ty=='sold'&&r.w?`<br><b style="color:#e8c872">${fm(r.w)} W</b>`:''}</span></div>`).join('')+'<div style="font-size:11px;color:#b9a3bd;margin-top:6px">Same character on the WEMIX chain (same NFT token). Dates are when that name was listed, sold or first seen by us.</div>';
 bd.insertAdjacentElement('afterend',el)};
// Owners on a character page: wallets that held this character (public WEMIX chain transfers). "usually" is a guess from character names, not an identity.
FH.owners=()=>FH._ow||(FH._ow=fetch('data/owners.json?'+Date.now()).then(r=>r.ok?r.json():null).catch(()=>null));
FH.ownersBox=function(x,bd,S){const w=FH.who(x,S);if(!w)return;FH.owners().then(O=>{if(!O)return;const runs=O.tokens[w.token];if(!runs||!runs.length)return;const p=bd.parentNode;if(!p)return;p.querySelectorAll('.pown').forEach(e=>e.remove());
 const E=t=>String(t??'').replace(/[<>&"]/g,''),fm=n=>Math.round(n).toLocaleString('en-US'),sh=a=>a.slice(0,4)+'…'+a.slice(-3),dy=t=>t?new Date(Date.parse(t.replace(' ','T')+':00-07:00')).toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric'}):'now';
 const how={minted:'Became an NFT',bought:'Bought','moved in':'Moved in','first seen':'First seen'};
 const el=document.createElement('div');el.className='pown';el.style.cssText='margin:8px 0;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere';
 const row=r=>{const W=O.wallets[r.w]||{},n=W.tokens?W.tokens.length:1,fl=n>1?` <span style="font-size:10px;font-weight:800;background:#c2185b;color:#fff0f6;border-radius:999px;padding:2px 6px">${n} characters</span>`:'';
  return `<div style="padding:7px 0;border-bottom:1px solid #2a1730;font-size:13px"><div style="display:flex;justify-content:space-between;gap:8px"><button class="pw" data-w="${r.w}" style="background:none;border:0;padding:0;color:#e8c872;font:inherit;font-family:monospace;text-decoration:underline dotted;cursor:pointer">${sh(r.w)}</button><span style="color:#b9a3bd;font-size:12px;text-align:right">${!r.to?'<b style="color:#e8c872">Current owner</b>':dy(r.from)+' to '+dy(r.to)}</span></div><div style="font-size:12px;color:#b9a3bd">${W.usually?'usually '+E(W.usually)+' · ':''}${how[r.in]||''}${r.in_w?' for '+fm(r.in_w)+' W':''}${r.out=='sold'?' · sold'+(r.out_w?' for '+fm(r.out_w)+' W':''):r.out=='moved'?' · moved out':''}${fl}</div><div class="pwl" hidden></div></div>`};
 el.innerHTML='<div style="font-weight:700;color:#e8c872;font-size:14px">👛 Owners <small style="font-weight:400;color:#b9a3bd">('+runs.length+')</small></div>'+runs.slice().reverse().map(row).join('')+'<div style="font-size:11px;color:#b9a3bd;margin-top:6px">Wallets from public WEMIX chain transfers, newest first. "usually" is our guess from the character names used while that wallet held it, not who owns it. Tap a wallet to see every character it held.</div>';
 el.querySelectorAll('.pw').forEach(b=>b.onclick=ev=>{ev.stopPropagation();const box=b.closest('div').parentNode.querySelector('.pwl');if(!box.hidden){box.hidden=true;return}const W=O.wallets[b.dataset.w]||{tokens:[]};
  box.innerHTML='<div style="margin:6px 0 2px;padding:8px;background:#26142b;border-radius:8px;font-size:12px"><b style="color:#e8c872">Wallet '+sh(b.dataset.w)+'</b> · '+W.tokens.length+' characters · bought '+(W.buys||0)+' · sold '+(W.sells||0)+(W.names&&Object.keys(W.names).length?'<br><span style="color:#b9a3bd">Names used: '+Object.keys(W.names).map(E).join(', ')+'</span>':'')+W.tokens.map(t=>{const rs=(O.tokens[t]||[]).filter(r=>r.w==b.dataset.w),r=rs[rs.length-1]||{};return `<div style="padding:4px 0;border-top:1px solid #3a2040">${E(O.tn[t]||'?')} <span style="color:#b9a3bd">· ${dy(r.from)} to ${dy(r.to)}${r.out=='sold'&&r.out_w?' · sold '+fm(r.out_w)+' W':''}</span></div>`}).join('')+'</div>';box.hidden=false});
 const pn=p.querySelector('.pnames');(pn||bd).insertAdjacentElement('afterend',el)})};
