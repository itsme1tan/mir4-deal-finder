/* Monthly sold price history by power band, from data/sold_archive.json (Hofgamer public archive) plus recent sales. Display only; not used by the fair-price model. */
(function(){
let A=null,W=null,cls='',cur='usd';
const BANDS=[['510-600k',510e3,600e3,'#60a5fa'],['600-650k',600e3,650e3,'#4ade80'],['650-700k',650e3,700e3,'#f5c518'],['700k+',700e3,1e9,'#f87171']];
const med=a=>{a=[...a].sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
const fm=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:0});
const px=d=>{for(let i=0;i<6;i++){const k=new Date(Date.parse(d)-i*864e5).toISOString().slice(0,10);if(W[k])return W[k]}return null};
window.drawPH=function(){const el=document.getElementById('phist');if(!el)return;
 if(!A){Promise.all([fetch('data/sold_archive.json?'+Date.now()).then(r=>r.json()),fetch('data/wemix_daily.json?'+Date.now()).then(r=>r.json())]).then(([a,w])=>{W=w;const m={};a.forEach(s=>m[s.id]=s);((typeof D!='undefined'&&D&&D.sales)||[]).forEach(s=>m[s.id]=m[s.id]||s);A=Object.values(m).filter(s=>s.sold&&s.wemix&&s.ps>=510000);drawPH()});el.innerHTML='loading…';return}
 const S=A.filter(s=>!cls||s.cls==cls);const months=[...new Set(A.map(s=>s.sold.slice(0,7)))].sort().filter(m=>m>='2026-03');
 const cell={};BANDS.forEach(([b,lo,hi])=>months.forEach(m=>{const L=S.filter(s=>s.sold.slice(0,7)==m&&s.ps>=lo&&s.ps<hi);cell[b+m]={n:L.length,w:L.length?med(L.map(s=>s.wemix)):null,u:L.length?med(L.map(s=>s.wemix*(px(s.sold.slice(0,10))||0))):null}}));
 const tok=months.map(m=>{const v=Object.entries(W).filter(([k])=>k.slice(0,7)==m).map(([,v])=>v);return v.length?med(v):null});
 const val=c=>cur=='usd'?c.u:c.w;const all=BANDS.flatMap(([b])=>months.map(m=>cell[b+m])).filter(c=>c.n>=3).map(val);const ymax=Math.max(1,...all)*1.1,tmax=Math.max(...tok.filter(Boolean))*1.15;
 const Wd=340,H=190,P=34,x=i=>P+i*(Wd-P-30)/Math.max(1,months.length-1),y=v=>H-22-(v/ymax)*(H-40),yt=v=>H-22-(v/tmax)*(H-40);
 let g=`<svg viewBox="0 0 ${Wd} ${H}" style="width:100%;background:#0f1218;border-radius:10px">`;
 for(let k=0;k<=4;k++){const v=ymax*k/4;g+=`<line x1="${P}" x2="${Wd-30}" y1="${y(v)}" y2="${y(v)}" stroke="#232a37"/><text x="${P-3}" y="${y(v)+3}" fill="#9aa3b8" font-size="8" text-anchor="end">${cur=='usd'?'$':''}${v>=1000?fm(v/1000)+'k':fm(v)}</text>`}
 months.forEach((m,i)=>g+=`<text x="${x(i)}" y="${H-8}" fill="#9aa3b8" font-size="8" text-anchor="middle">${new Date(m+'-15').toLocaleString('en-US',{month:'short'})}</text>`);
 g+=`<polyline fill="none" stroke="#a78bfa" stroke-dasharray="4 3" stroke-width="1.5" points="${tok.map((v,i)=>v?`${x(i)},${yt(v)}`:'').join(' ')}"/>`;
 tok.forEach((v,i)=>{if(v&&(i==0||i==tok.length-1))g+=`<text x="${x(i)+(i?4:-4)}" y="${yt(v)-4}" fill="#a78bfa" font-size="8" text-anchor="${i?'start':'end'}">$${v.toFixed(2)}</text>`});
 BANDS.forEach(([b,,,c])=>{let seg=[],pts='';months.forEach((m,i)=>{const z=cell[b+m];if(z.n>=3){pts+=`${x(i)},${y(val(z))} `;g+=`<circle cx="${x(i)}" cy="${y(val(z))}" r="2.5" fill="${c}"><title>${b} ${m}: ${cur=='usd'?'$':''}${fm(val(z))}${cur=='usd'?'':' WEMIX'}, ${z.n} sales</title></circle>`}else{if(pts)seg.push(pts);pts=''}});if(pts)seg.push(pts);seg.forEach(p=>g+=`<polyline fill="none" stroke="${c}" stroke-width="2" points="${p}"/>`)});
 g+='</svg>';
 const C=[...new Set(A.map(s=>s.cls))].sort();
 const tbl=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px"><tr style="color:#9aa3b8"><td>🧾</td>${months.map(m=>`<td style="text-align:right">${new Date(m+'-15').toLocaleString('en-US',{month:'short'})}</td>`).join('')}</tr>`+
  BANDS.map(([b,,,c])=>`<tr><td style="color:${c};white-space:nowrap">● ${b}</td>${months.map(m=>{const z=cell[b+m];return `<td style="text-align:right;${z.n<3?'color:#4b5563':''}" title="${z.n} sales${z.n?', median '+fm(z.w)+' WEMIX, $'+fm(z.u):''}">${z.n?(cur=='usd'?'$'+(z.u/1000).toFixed(1)+'k':fm(z.w/1000)+'k'):'·'}<br><small>${z.n}</small></td>`}).join('')}</tr>`).join('')+
  `<tr><td style="color:#a78bfa">┄ WEMIX</td>${tok.map(v=>`<td style="text-align:right;color:#a78bfa">${v?'$'+v.toFixed(2):'·'}</td>`).join('')}</tr></table></div>`;
 el.innerHTML=`<h2>📉 Sold price by month</h2><div class="xs"><button data-u="usd" class="${cur=='usd'?'on':''}">💵 USD</button><button data-u="wemix" class="${cur=='wemix'?'on':''}">🪙 WEMIX</button>
  <select id="phc" style="margin-left:auto"><option value="">🧙 All classes</option>${C.map(c=>`<option ${c==cls?'selected':''}>${c}</option>`).join('')}</select></div>${g}
  <div class="mt">● median sold price per power band · ┄ WEMIX token (right scale) · small number = sales · grey = under 3 sales, not plotted</div>${tbl}
  <div class="vd" style="margin-top:8px">📌 Same power and class: about -13% a month in USD since March. About half is the WEMIX token falling, the rest is lower WEMIX asks (about -6.6% a month).</div>
  <div class="mt">Source: Hofgamer public sold archive (510k+ power, since Mar 2026) plus our recent sales. Prices in USD use the WEMIX close on the sale day. Not used for fair value.</div>`;
 el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{cur=b.dataset.u;drawPH()});el.querySelector('#phc').onchange=e=>{cls=e.target.value;drawPH()}};
})();
