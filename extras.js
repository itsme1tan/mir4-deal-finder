// Leaderboards, Trends, Upgrade-vs-buy views. Read-only display of public market data.
(function(){
const $=s=>document.querySelector(s),fm=n=>n==null?'–':Number(n).toLocaleString(undefined,{maximumFractionDigits:0}),usd=n=>n==null?'–':'$'+fm(n);
const st=document.createElement('style');st.textContent=`
#xnav{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 12px 0;position:sticky;top:0;z-index:5;background:#0f1218}
#xnav button{background:#202838;color:#cbd3e1;border:1px solid #333c4d;border-radius:999px;padding:11px 0;font-size:14px;font-weight:600}
#xnav button.on{background:#f5c518;color:#1a1300;border-color:#f5c518}
#xv{padding:10px 12px 40px;max-width:900px;margin:0 auto}#xv h2{font-size:17px;margin:16px 0 6px}#xv h3{font-size:15px;margin:14px 0 6px;color:#ffe08a}
.xc{background:#171c26;border:1px solid #2a3140;border-radius:12px;padding:10px 12px;margin:8px 0}
.xr{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #232a37;font-size:14px;align-items:center}.xr:last-child{border:0}
.xr .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.xr small{color:#9aa3b8;display:block;font-size:12px}
.rk{display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:50%;background:#2a3140;font-size:12px;font-weight:700;margin-right:6px}
.rk.g{background:#f5c518;color:#1a1300}.bs{background:#a16207;color:#fff;border-radius:6px;padding:2px 7px;font-weight:700;font-size:13px}
.xs{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px}.xs button{white-space:nowrap;background:#202838;border:1px solid #333c4d;border-radius:999px;padding:8px 12px;font-size:14px;color:#cbd3e1}.xs button.on{background:#2b6cb0;color:#fff}
.vd{background:#14251a;border:1px solid #1f7a3a;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.45}.vd p{margin:6px 0}
.mt{color:#9aa3b8;font-size:12px;line-height:1.45}.bar{height:10px;border-radius:5px;background:#2b6cb0;display:inline-block;vertical-align:middle}
.big{font-size:22px;font-weight:800;color:#ffe08a}.cmp2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cmp2>div{background:#0f1218;border:1px solid #2a3140;border-radius:10px;padding:8px}
.hide-main .ctl,.hide-main .wrap,.hide-main #cards,.hide-main .note,.hide-main #cmp{display:none!important}`;document.head.appendChild(st);
const nav=document.createElement('div');nav.id='xnav';nav.innerHTML=['deals:Deals','lead:Leaders','trend:Trends','up:Upgrade'].map(s=>{const[k,l]=s.split(':');return `<button data-v="${k}">${l}</button>`}).join('');
$('header').after(nav);const xv=document.createElement('div');xv.id='xv';nav.after(xv);
let E,cls,upId;
fetch('data/extras.json?'+Date.now()).then(r=>r.json()).then(e=>{E=e;show(new URLSearchParams(location.search).get('view')||'deals')});
nav.onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.v)};
function show(v){nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==v));document.body.classList.toggle('hide-main',v!='deals');
 const u=new URL(location);if(v=='deals')u.searchParams.delete('view');else u.searchParams.set('view',v);history.replaceState(null,'',u);
 xv.hidden=v=='deals';if(!E||v=='deals')return;xv.innerHTML=v=='lead'?lead():v=='trend'?trend():up();bind(v)}
function bind(v){xv.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cls=b.dataset.c;show('lead')});
 const s=xv.querySelector('#upsel');if(s)s.onchange=()=>{upId=s.value;show('up')}}
const H=id=>`https://nft.hofgamer.com/mir4/nft/${id}`;
function lead(){const C=Object.keys(E.leaderboards).filter(c=>E.leaderboards[c].listed.length||E.leaderboards[c].sold.length).sort();cls=cls&&C.includes(cls)?cls:C[0];const B=E.leaderboards[cls];
 let o=`<h2>Strongest per class</h2><div class="mt">Build score = in-class percentile of ATK 40%, Skill ATK boost 20%, PvP ATK 20%, DEF 20%. 100 = best in pool.</div><div class="xs">${C.map(c=>`<button data-c="${c}" class="${c==cls?'on':''}">${c}</button>`).join('')}</div>`;
 o+=`<h3>Listed now</h3><div class="xc">`+(B.listed.length?B.listed.map((x,i)=>{const g=x.disc;return `<div class="xr"><span class="rk ${i<3?'g':''}">${i+1}</span><a class="n" href="${H(x.id)}" target="_blank">${x.name}<small>${fm(x.ps)} power · Lv ${x.lv}${x.in_budget?'':' · over $'+fm(E.budget)}</small></a><span style="text-align:right"><span class="bs">${x.bs}</span><small>${usd(x.usd)} · ${g==null?'no fair':g>=0?`<b class="pos">${g}% under (${usd(x.fair_usd-x.usd)})</b>`:`<span class="neg">${-g}% over (${usd(x.usd-x.fair_usd)})</span>`}</small></span></div>`}).join(''):'<div class="mt">None listed with full stats.</div>')+'</div>';
 o+=`<h3>Strongest sold (last ~60 days, detailed)</h3><div class="mt">Scored against other sold ${cls}s.</div><div class="xc">`+(B.sold.length?B.sold.map((x,i)=>`<div class="xr"><span class="rk">${i+1}</span><a class="n" href="${H(x.id)}" target="_blank">${x.name}<small>${fm(x.ps)} power · sold ${x.date}</small></a><span style="text-align:right"><span class="bs">${x.bs}</span><small>${usd(x.usd)}</small></span></div>`).join(''):'<div class="mt">No detailed sales.</div>')+'</div>';
 if(B.top_ever&&B.top_ever.length)o+=`<h3>Highest power ever sold</h3><div class="mt">Hofgamer (since about Mar 2026) + XDRACO top trades (last 30 days). Ranked by power, no build stats.</div><div class="xc">`+B.top_ever.map((x,i)=>`<div class="xr"><span class="rk">${i+1}</span><a class="n" href="${x.url}" target="_blank">${x.name}<small>${fm(x.ps)} power · ${x.date} · ${x.src}</small></a><b>${usd(x.usd)}</b></div>`).join('')+'</div>';
 return o}
function chart(T){const W=340,Hh=170,P=28,cols=['#60a5fa','#4ade80','#f5c518','#f87171'];const all=Object.values(T.series).flat();const ws=[...new Set(all.map(r=>r.week))].sort();
 const ym=Math.max(...all.filter(r=>r.n>=3).map(r=>r.med_wemix_per_1k)),X=i=>P+i*(W-P-6)/Math.max(1,ws.length-1),Y=v=>Hh-20-(v/ym)*(Hh-30);
 let s=`<svg viewBox="0 0 ${W} ${Hh}" width="100%"><line x1="${P}" y1="${Hh-20}" x2="${W}" y2="${Hh-20}" stroke="#333c4d"/>`;
 [0,.5,1].forEach(f=>s+=`<text x="2" y="${Y(ym*f)+4}" fill="#9aa3b8" font-size="10">${Math.round(ym*f)}</text>`);
 ws.forEach((w,i)=>{if(i%2==0)s+=`<text x="${X(i)-12}" y="${Hh-6}" fill="#9aa3b8" font-size="9">${w.slice(5)}</text>`});
 T.bands.forEach((b,j)=>{const R=(T.series[b]||[]).filter(r=>r.n>=3);if(R.length<2)return;s+=`<polyline fill="none" stroke="${cols[j]}" stroke-width="2.5" points="${R.map(r=>X(ws.indexOf(r.week))+','+Y(r.med_wemix_per_1k)).join(' ')}"/>`+R.map(r=>`<circle cx="${X(ws.indexOf(r.week))}" cy="${Y(r.med_wemix_per_1k)}" r="${1.5+Math.min(4,r.n/4)}" fill="${cols[j]}"/>`).join('')});
 return s+`</svg><div class="mt">${T.bands.map((b,j)=>`<span style="color:${cols[j]}">●</span> ${b} power`).join(' &nbsp; ')}<br>Median WEMIX per 1,000 power, by week (weeks with 3+ sales; bigger dot = more sales).</div>`}
function bars(L,k,lab){return L.map(d=>`<div class="xr"><span style="width:56px">${d[k]}</span><span style="flex:1">${d.rel==null?'<span class="mt">too few</span>':`<span class="bar" style="width:${Math.min(100,Math.abs(d.rel)*3)}px;background:${d.rel<0?'#4ade80':'#f87171'}"></span> ${d.rel>0?'+':''}${d.rel}%`}</span><small>${d.n} sales</small></div>`).join('')}

function wchart(Wk){const W=340,Hh=190,P=30,R=W-30;const n=Wk.length,X=i=>P+i*(R-P)/Math.max(1,n-1),bw=(R-P)/n*0.6;
 const sm=Math.max(...Wk.map(w=>w.sales)),px=Wk.filter(w=>w.wemix).map(w=>w.wemix),p0=Math.min(...px)*0.98,p1=Math.max(...px)*1.02,mm=Math.max(...Wk.filter(w=>w.med_per1k).map(w=>w.med_per1k));
 const yb=v=>Hh-20-(v/sm)*(Hh-40),yp=v=>Hh-20-((v-p0)/(p1-p0))*(Hh-40),ym=v=>Hh-20-(v/mm)*(Hh-40);
 let s=`<svg viewBox="0 0 ${W} ${Hh}" width="100%"><line x1="${P}" y1="${Hh-20}" x2="${R}" y2="${Hh-20}" stroke="#333c4d"/>`;
 Wk.forEach((w,i)=>{s+=`<rect x="${X(i)-bw/2}" y="${yb(w.sales)}" width="${bw}" height="${Hh-20-yb(w.sales)}" fill="#334155"/><text x="${X(i)}" y="${yb(w.sales)-3}" fill="#9aa3b8" font-size="9" text-anchor="middle">${w.sales}</text>`;if(i%2==0)s+=`<text x="${X(i)}" y="${Hh-6}" fill="#9aa3b8" font-size="9" text-anchor="middle">${w.week.slice(5)}</text>`});
 const line=(f,c)=>{const Q=Wk.map((w,i)=>[i,f(w)]).filter(q=>q[1]!=null);return `<polyline fill="none" stroke="${c}" stroke-width="2.5" points="${Q.map(([i,v])=>X(i)+','+v).join(' ')}"/>`+Q.map(([i,v])=>`<circle cx="${X(i)}" cy="${v}" r="3" fill="${c}"/>`).join('')};
 s+=line(w=>w.wemix?yp(w.wemix):null,'#f5c518')+line(w=>w.med_per1k?ym(w.med_per1k):null,'#4ade80');
 s+=`<text x="2" y="${yp(p1)+10}" fill="#f5c518" font-size="10">$${p1.toFixed(3)}</text><text x="2" y="${yp(p0)}" fill="#f5c518" font-size="10">$${p0.toFixed(3)}</text>`;
 return s+`</svg><div class="mt"><span style="color:#64748b">■</span> sales per week &nbsp; <span style="color:#f5c518">●</span> WEMIX USD (weekly avg) &nbsp; <span style="color:#4ade80">●</span> median WEMIX per 1k power. First and last weeks are partial.</div>`}
function wemixHtml(){const M=E.wemix;if(!M)return '';const c=v=>v[0]==null?'–':`${v[0]>0?'+':''}${v[0]}<br><small>p=${v[1]}</small>`;
 return `<h2>WEMIX price vs sales</h2><div class="vd"><b>Did more characters sell when WEMIX dipped?</b>${M.verdict.map(v=>`<p>${v}</p>`).join('')}</div>
 <h3>Weekly overlay</h3><div class="xc">${wchart(M.weekly)}</div>
 <h3>Correlations by lag</h3><div class="xc"><table class="ct"><tr><th>WEMIX day → sales</th><th>Price vs # sold</th><th>Daily % chg vs # sold</th><th>Price vs USD/1k</th></tr>${M.lags.map(r=>`<tr><td>${r.lag?r.lag+' day'+(r.lag>1?'s':'')+' later':'same day'}</td><td>${c(r.price_vs_count)}</td><td>${c(r.change_vs_count)}</td><td>${c(r.price_vs_usd_per1k)}</td></tr>`).join('')}</table>
 <div class="mt">r = correlation (−1 to +1; near 0 = no link). p = chance of a link this strong from pure luck (permutation test); under 0.05 would be notable. A dip-buying effect would show as a negative r in "Price vs # sold". Source: ${M.source}.</div></div>`}

function trend(){const T=E.trends;return `<h2>Market trends</h2><div class="vd"><b>Verdict</b>${T.verdict.map(v=>`<p>${v}</p>`).join('')}</div>
 <h3>Price per power over time</h3><div class="xc">${chart(T)}</div>
 <h3>Day of week</h3><div class="xc">${bars(T.dow,'d')}<div class="mt">vs typical price per power point. Green = cheaper. ${T.tz_note}</div></div>
 <h3>Time of day</h3><div class="xc">${bars(T.hours,'h')}<div class="mt">${T.tz_note}</div></div>`+wemixHtml()}
function up(){const L=D.listings.filter(x=>E.upgrade.by_id[x.id]).sort((a,b)=>a.ps-b.ps);upId=upId&&E.upgrade.by_id[upId]?upId:String((L.find(x=>x.usd<=E.budget&&E.upgrade.by_id[x.id].some(t=>t.built_ask))||L[0]).id);const x=L.find(z=>z.id==upId),T=E.upgrade.by_id[upId];
 let o=`<h2>Upgrade vs buy built</h2><label>Start from this listing<select id="upsel">${L.map(z=>`<option value="${z.id}"${z.id==upId?' selected':''}>${z.name} · ${z.cls} · ${fm(z.ps)} · ${usd(z.usd)}</option>`).join('')}</select></label>
 <div class="xc"><b>${x.name}</b> ${x.cls}, ${fm(x.ps)} power, build score ${x.build_score??'–'}, asking <b>${usd(x.usd)}</b></div>`;
 T.forEach(t=>{const b=t.built_ask;o+=`<h3>Target ${fm(t.ps)} power (+${Math.round((t.ps/x.ps-1)*100)}%)</h3><div class="xc cmp2">
  <div><div class="mt">Buy this + grow (estimate)</div><div class="big">${usd(t.path_usd)}</div><div class="mt">${usd(x.usd)} price + about ${usd(t.step_usd)} market value of the extra power</div></div>
  <div><div class="mt">Buy one already built</div>${b?`<div class="big">${usd(b.usd)}</div><div class="mt">cheapest listed ${x.cls} at ${fm(b.ps)}: <a href="${H(b.id)}" target="_blank">${b.name}</a></div>`:`<div class="big">–</div><div class="mt">No ${x.cls} listed at this power right now.</div>`}${t.built_sold_med?`<div class="mt">Sold median near this power: ${usd(t.built_sold_med)} (${t.built_sold_n} sales)</div>`:''}</div></div>`;
  if(b)o+=`<div class="mt">${b.usd<t.path_usd?`Buying built looks cheaper by about ${usd(t.path_usd-b.usd)}.`:`Growing looks cheaper by about ${usd(b.usd-t.path_usd)} on market value, but you pay in time and materials.`}</div>`});
 return o+`<h3>How this is estimated</h3><div class="mt">${E.upgrade.method}</div>`}
window.addEventListener('load',()=>{});
})();
