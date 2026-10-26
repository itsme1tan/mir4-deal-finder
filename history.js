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

FH.load();
