/* Power progression: power score over time per character (name + server), from data/power_history/series.json (built by power_snap.py).
   Sources: daily global top 1000 ranking, our XDRACO sales, listings and saved pages, and the public NFT record. Display only. */
(function(){
const E=t=>String(t??'').replace(/[<>&"]/g,''),fm=n=>Math.round(n).toLocaleString('en-US');
const SRC={r:'Ranking',s:'Sold',l:'Listed',c:'NFT record',x:'XDRACO listing (date estimated)'},COL={r:'#e8c872',s:'#d63384',l:'#c084fc',c:'#f2e8f2',x:'#b9a3bd'};
let P=null;const PW=window.PW={load(){return P||(P=fetch('data/power_history/series.json?'+Math.floor(Date.now()/36e5)).then(r=>r.ok?r.json():null).catch(()=>null))}};
const dy=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
PW.chart=function(pts){if(!pts||!pts.length)return '';const W=340,H=110,t=pts.map(p=>Date.parse(p[0])),lo=Math.min(...pts.map(p=>p[1])),hi=Math.max(...pts.map(p=>p[1])),t0=Math.min(...t),t1=Math.max(...t);
 const X=i=>12+(t1>t0?(t[i]-t0)/(t1-t0):.5)*(W-24),Y=v=>hi==lo?H/2:10+(hi-v)/(hi-lo)*(H-20);
 const d=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
 const used=[...new Set(pts.map(p=>p[2]))];const a=pts[0],b=pts[pts.length-1],g=b[1]-a[1];
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;margin:6px 0">${pts.length>1?`<path d="${d}" fill="none" stroke="#e8c87288" stroke-width="2" stroke-linejoin="round"/>`:''}${pts.map((p,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.5" fill="${COL[p[2]]||'#e8c872'}"><title>${dy(p[0])}: ${fm(p[1])} (${SRC[p[2]]})</title></circle>`).join('')}</svg>
 <div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#b9a3bd"><span>${dy(a[0])}<br><b style="color:#f2e8f2">⚡ ${fm(a[1])}</b></span><span style="text-align:center;align-self:center">${pts.length>1?`<b style="color:#e8c872">${g>=0?'+':''}${fm(g)}</b>`:''}</span><span style="text-align:right">${dy(b[0])}<br><b style="color:#f2e8f2">⚡ ${fm(b[1])}</b></span></div>
 <div style="font-size:11px;color:#b9a3bd;margin-top:4px;line-height:1.8">${used.map(s=>`<span style="white-space:nowrap"><b style="color:${COL[s]}">●</b> ${SRC[s]}</span>`).join(' · ')}</div>`};
const pts=(J,k)=>J&&J.s[k];
// On a character page, below Past names / Owners
PW.box=function(x,bd){PW.load().then(J=>{if(!J)return;const p=bd.parentNode;if(!p)return;let k=x.name+'|'+(x.server||''),L=pts(J,k);
 const w=window.FH&&FH.who&&FH.who(x);if(w&&w.now&&w.now.server){const L2=pts(J,w.now.name+'|'+w.now.server);if(L2&&(!L||L2.length>L.length))L=L2}
 if(!L||L.length<2)return;p.querySelectorAll('.ppw').forEach(e=>e.remove());const el=document.createElement('div');el.className='ppw';
 el.style.cssText='margin:8px 0;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px;max-width:100%;box-sizing:border-box';
 el.innerHTML='<div style="font-weight:700;color:#e8c872;font-size:14px">⚡ Power progression <small style="font-weight:400;color:#b9a3bd">('+L.length+' points)</small></div>'+PW.chart(L);
 const a=p.querySelector('.pown')||p.querySelector('.pnames')||bd;a.insertAdjacentElement('afterend',el)})};
// Tools > Power: search any character, and Fastest growing
const sq=t=>String(t??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
PW.tool=function(){const q=document.getElementById('pwq'),L=document.getElementById('pwl'),R=document.getElementById('pwr'),G=document.getElementById('pwg');if(!q||PW._t)return;PW._t=1;let win='7',K=null;
 const show=k=>PW.load().then(J=>{const[n,s]=k.split('|');R.innerHTML=`<div style="margin:8px 0;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px;max-width:100%;box-sizing:border-box"><b style="color:#e8c872;overflow-wrap:anywhere">${E(n)}</b> <small style="color:#b9a3bd">${E(s)}</small>${PW.chart(J.s[k])}</div>`;L.innerHTML=''});
 const run=()=>PW.load().then(J=>{if(!J){L.innerHTML='<div style="font-size:12px;color:#b9a3bd">Power data not available yet.</div>';return}if(!K)K=Object.keys(J.s).map(k=>[k,sq(k.split('|')[0])]);const v=sq(q.value);R.innerHTML='';
  if(v.length<2){L.innerHTML='<div style="font-size:12px;color:#b9a3bd;margin-top:6px">Search a character name, at least 2 letters or digits.</div>';return}
  const H=K.filter(r=>r[1].includes(v)).sort((a,b)=>(a[1]==v?-1:0)-(b[1]==v?-1:0)||J.s[b[0]].length-J.s[a[0]].length).slice(0,20);
  L.innerHTML=H.length?H.map(([k])=>{const[n,s]=k.split('|'),p=J.s[k],b=p[p.length-1];return `<button data-k="${E(k)}" style="display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #3a2040;color:#f2e8f2;padding:9px 2px;font-size:14px"><span style="min-width:0;overflow-wrap:anywhere">${E(n)} <small style="color:#b9a3bd">${E(s)}</small></span><span style="color:#b9a3bd;font-size:12px;white-space:nowrap;text-align:right"><b style="color:#e8c872">⚡ ${fm(b[1])}</b><br>${p.length} point${p.length>1?'s':''}</span></button>`}).join(''):'<div style="font-size:12px;color:#b9a3bd;margin-top:6px">No character found with that name.</div>';
  L.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>show(b.dataset.k))});
 const grow=()=>PW.load().then(J=>{if(!J)return;const g=J.growth||{},rows=g[win]||[];
  const tabs=['7','30'].map(w=>`<button data-w="${w}" style="font:inherit;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;border:1px solid #5a3a5e;background:${w==win?'#e8c872':'#1c1020'};color:${w==win?'#2a1030':'#b9a3bd'}">Last ${w} days</button>`).join(' ');
  G.innerHTML='<div style="font-weight:700;color:#e8c872;font-size:14px;margin:14px 0 4px">🚀 Fastest growing</div><div style="display:flex;gap:6px;margin-bottom:6px">'+tabs+'</div>'+((J.days||[]).length<2?`<div style="font-size:13px;color:#b9a3bd;padding:8px 0">Collecting data. We save the global top 1000 once a day; this list starts after the second day (${(J.days||[]).length} of 2 so far).</div>`:rows.length?rows.slice(0,20).map((r,i)=>{const[n,s]=r[0].split('|');return `<button data-k="${E(r[0])}" style="display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #3a2040;color:#f2e8f2;padding:8px 2px;font-size:13px"><span style="min-width:0;overflow-wrap:anywhere">#${i+1} ${E(n)} <small style="color:#b9a3bd">${E(s)}</small></span><span style="white-space:nowrap;text-align:right"><b style="color:#e8c872">+${fm(r[1])}</b><br><small style="color:#b9a3bd">⚡ ${fm(r[3])}</small></span></button>`}).join(''):'<div style="font-size:13px;color:#b9a3bd;padding:8px 0">Not enough days in this window yet.</div>')+'<div style="font-size:11px;color:#b9a3bd;margin-top:4px">Power gained in the global top 1000 ranking. Characters that drop out of the top 1000 are not measured.</div>';
  G.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{win=b.dataset.w;grow()});G.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{show(b.dataset.k);R.scrollIntoView({block:'start'})})});
 q.addEventListener('input',run);run();grow()};
const ti=()=>{if(document.getElementById('pwq'))PW.tool();else setTimeout(ti,500)};ti();
})();
