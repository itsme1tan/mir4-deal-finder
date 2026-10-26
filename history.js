/* One full history per character, shared by the details History box and the Price history chart so they always agree.
   Sources: our tracker snapshots (data/relist_history.json, since Oct 20 2026), tracked events (data/char_history.json: sold, delisted),
   the marketplace's own listing time for the current listing, the first listing date worked out from its listing number (market.py on_since),
   and sold records (data/sold_archive.json + recent sales). $ uses the WEMIX price of that day (data/wemix_daily.json). Display only. */
(function(){
const PT=t=>Date.parse(t.replace(' ','T')+':00-07:00'),H8=t=>Date.parse(t.replace(' ','T')+':00+08:00');
const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;
let P=null;
window.FH={
 load(){return P||(P=Promise.all(['data/relist_history.json','data/char_history.json','data/sold_archive.json','data/wemix_daily.json','data/chain_history.json'].map(u=>fetch(u+'?'+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}))))
  .then(([rh,ch,sa,wd,nc])=>{const S={RH:rh.chars||{},CH:ch.chars||{},SA:Array.isArray(sa)?sa:[],WD:wd||{},NC:nc||{},TK:{}};
   for(const k in S.NC){const r=S.NC[k];if(r.token&&!r.bad)(S.TK[r.token]=S.TK[r.token]||[]).push(k)}
   window.FHS=S;document.dispatchEvent(new Event('fh-ready'));return S}))},
 // Same token = same character, even after a rename or a server move. Records whose class does not match the token are left out (bad match).
 who(x,S){S=S||window.FHS;if(!S)return null;const r=S.NC[key(x)];if(!r||r.bad||!r.token)return null;const ks=S.TK[r.token]||[key(x)];
  let now=null;const nm=[];ks.forEach(k=>{const q=S.NC[k];if(q.now&&(!now||q.now.t>now.t))now=q.now;nm.push(k.split('|')[0]);(q.names||[]).forEach(n=>nm.push(n.name))});
  const all=[...new Set(nm)];return {token:r.token,now,keys:ks,names:all,formerly:all.filter(n=>n!=x.name&&(!now||n!=now.name))}},
 fold(t){return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[øØ]/g,'o').toLowerCase()},
 alias(x){const w=FH.who(x);if(!w)return '';const n=w.names.concat(w.now?[w.now.name]:[]).join(' ');return ' '+n+' '+FH.fold(n)},
 rate(S,t){for(let i=0;i<7;i++){const r=S.WD[new Date(t-i*864e5).toISOString().slice(0,10)];if(r)return r}return typeof D!='undefined'?D.wemix_usd:null},
 chain(x,S){const k=key(x);let c=S.NC[k];if(!c||!c.events||c.bad)return null;(S.TK[c.token]||[]).forEach(z=>{const q=S.NC[z];if(q.events&&(q.blk||0)>(c.blk||0))c=q});const E=[];
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
  return `<svg viewBox="0 0 ${W} ${Hh}" style="width:100%;height:auto;display:block;margin:6px 0"><path d="${d}" fill="none" stroke="#e8c872" stroke-width="2" stroke-linejoin="round"/>${p.map((e,i)=>e.type=='sold'?`<circle cx="${X(i)}" cy="${Y(e.w)}" r="4" fill="#d63384"/>`:'').join('')}</svg><div style="display:flex;justify-content:space-between;font-size:11px;color:#b9a3bd"><span>${fmn(p[0].w)} W</span><span><b style="color:#d63384">●</b> Sold · line = asking price</span><span>${fmn(p[p.length-1].w)} W</span></div>`};
 const show=(it,S)=>{const x=it.x,w=FH.who(x,S),H=FH.build(x,S);
  R.innerHTML=`<div style="margin:10px 0 6px;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b style="color:#e8c872;overflow-wrap:anywhere">${E(x.name)}</b><span style="font-size:12px;color:#b9a3bd;white-space:nowrap">${it.live?'For sale':it.tr?'Tracked':'Sold'}</span></div><div style="font-size:12px;color:#b9a3bd">${E(x.cls)} · ${E(x.server||'?')}${x.wemix?' · '+fmn(x.wemix)+' W':''}</div>${spark(H)}<button id="phopen" style="margin-top:6px;width:100%;background:#26142b;color:#f2e8f2;border:1px solid #e8c87266;border-radius:999px;padding:9px;font-size:14px">Open full details</button></div><div id="phh"></div>`;
  window.hist20&&hist20(x,R.querySelector('#phh'));
  if(!x.id)R.querySelector('#phopen').remove();else R.querySelector('#phopen').onclick=()=>{if(it.live&&window.solo20)solo20(x.id);else if(window.soloSold)soloSold(x.id,x.name)}};
 const ico=c=>`<span title="${E(c)}" style="flex:none;display:inline-flex;width:26px;height:26px;border-radius:50%;background:#26142b;border:1px solid #e8c87255;align-items:center;justify-content:center;color:#e8c872">${typeof ci=='function'?ci(c):''}</span>`;
 const lastW=(it,S)=>{const x=it.x;if(x.wemix)return x.wemix;const r=S.NC[key(x)];if(r&&r.price)return r.price;const ev=FH.build(x,S).events.filter(e=>e.w);return ev.length?ev[ev.length-1].w:0};
 // Sold times are stored in UTC+8; shown in PT.
 const ptd=t=>{const m=String(t||'').match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);if(!m)return null;return new Date(Date.UTC(+m[1],m[2]-1,+m[3],+m[4]-8,+m[5]))};
 const top3=(S,hits,row)=>{const m=new Map();[...S.SA,...((typeof D!='undefined'&&D.sales)||[])].forEach(s=>{if(!s.sold||!s.ps)return;const k=key(s),o=m.get(k);if(!o||s.ps>o.ps)m.set(k,s)});
  const T=[...m.values()].sort((a,b)=>b.ps-a.ps).slice(0,3);if(!T.length)return '';
  return '<div style="margin-top:14px;padding:10px 12px;background:#1a0f1e;border:1px solid #5a2550;border-radius:10px"><div style="font-weight:700;color:#e8c872;font-size:14px">🏆 Top 3 strongest sold</div><div style="font-size:11px;color:#b9a3bd;margin:2px 0 4px">All time, by power score at sale. Gold circle = class. Tap a name for its history.</div>'+T.map((s,j)=>{const d=ptd(s.sold),ds=d?d.toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric'}):'?',dk=d?d.toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'}):'',r=S.WD[dk],usd=r?' · $'+fmn(s.wemix*r):'';
   const i=hits.length;hits.push({x:s,live:0});return row(hits[i],i,`<br><small style="color:#b9a3bd">#${j+1} · ${E(s.cls)} · ${E(s.server)} · ⚡ ${fmn(s.ps)}</small><br><small style="color:#b9a3bd">${fmn(s.wemix)} W${usd} · ${ds}</small>`)}).join('')+'</div>'};
 let seq=0;const run=()=>{const my=++seq;return FH.load().then(S=>{if(my!=seq||!g())return;R.innerHTML='';
  const row=(it,i,ex)=>{const w=FH.who(it.x,S),nn=w&&w.now&&w.now.name!=it.x.name?` <small style="color:#b9a3bd">now ${E(w.now.name)}</small>`:'',lp=ex?0:lastW(it,S);return `<button data-i="${i}" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #3a2040;color:#f2e8f2;padding:9px 2px;font-size:14px">${ico(it.x.cls)}<span style="flex:1;min-width:0;overflow-wrap:anywhere">${E(it.x.name)}${nn}${ex||''}</span><span style="color:#b9a3bd;font-size:12px;white-space:nowrap;text-align:right">${lp?`<b style="color:#e8c872">${fmn(lp)} W</b><br>`:''}${it.live?'for sale':it.tr?'tracked':'sold'}</span></button>`};
  const qs=sq(q.value);let hits=[];if(qs.length<2){L.innerHTML='<div style="font-size:12px;color:#b9a3bd;margin-top:6px">Search by current or old name, at least 2 letters or digits.</div>'+top3(S,hits,row);bind(hits,S);return}
  const P=pool(S);hits=P.filter(it=>it.hay.includes(qs)).sort((a,b)=>(b.live-a.live)||(!!a.tr-!!b.tr)).slice(0,20),dym=0;
  if(!hits.length){dym=1;hits=P.map(it=>[it,Math.min(...it.ns.map(n=>Math.min(lev(qs,n)+(n.length==qs.length?0:0),n.length>qs.length?Math.min(...[...Array(n.length-qs.length+1).keys()].map(i=>lev(qs,n.slice(i,i+qs.length))))+0.5:99,Math.abs(n.length-qs.length)>3?Math.abs(n.length-qs.length)+qs.length:99)))]).sort((a,b)=>a[1]-b[1]||(b[0].live-a[0].live)).slice(0,3).map(r=>r[0])}
  L.innerHTML=(hits.length?(dym?'<div style="font-size:13px;color:#e8c872;margin-top:8px">No exact match. Did you mean:</div>':'')+hits.map((it,i)=>row(it,i)).join(''):'')+(dym?top3(S,hits,row):'');
  bind(hits,S)})};
 const bind=(hits,S)=>L.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{show(hits[+b.dataset.i],S);L.innerHTML=''});
 document.addEventListener('input',e=>{if(e.target&&e.target.id=='phq')run()},true);run()};
const _ti=()=>{if(document.getElementById('phq'))FH.tool();else setTimeout(_ti,500)};_ti();
FH.load();
