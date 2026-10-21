// Leaderboards, Trends, Upgrade-vs-buy views. Read-only display of public market data.
(function(){
const $=s=>document.querySelector(s),fm=n=>n==null?'–':Number(n).toLocaleString(undefined,{maximumFractionDigits:0}),usd=n=>n==null?'–':'$'+fm(n);
const st=document.createElement('style');st.textContent=`
#xnav{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 12px 0;position:sticky;top:0;z-index:5;background:#0f1218}
#xnav button{background:#202838;color:#cbd3e1;border:1px solid #333c4d;border-radius:999px;padding:11px 0;font-size:13px;font-weight:600}
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
const nav=document.createElement('div');nav.id='xnav';nav.innerHTML=['deals:Deals','ev:Events','lead:Leaders','trend:Trends','up:Upgrade','guide:Guide'].map(s=>{const[k,l]=s.split(':');return `<button data-v="${k}">${l}</button>`}).join('');
$('header').after(nav);const xv=document.createElement('div');xv.id='xv';nav.after(xv);
let E,cls,upId;
fetch('data/extras.json?'+Date.now()).then(r=>r.json()).then(e=>{E=e;show(new URLSearchParams(location.search).get('view')||'deals')});
nav.onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.v)};
function show(v){nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==v));document.body.classList.toggle('hide-main',v!='deals');
 const u=new URL(location);if(v=='deals')u.searchParams.delete('view');else u.searchParams.set('view',v);history.replaceState(null,'',u);
 xv.hidden=v=='deals';if(!E||v=='deals')return;if(v=='ev'){evShow();return}if(v=='guide'){xv.innerHTML=guide();return}xv.innerHTML=v=='lead'?lead():v=='trend'?trend():up();bind(v)}
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

let EV,evT;const PT=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function evMs(t,e,off){const[d,h]=t.split('T');const[y,m,dd]=d.split('-').map(Number),[hh,mm]=h.split(':').map(Number);return Date.UTC(y,m-1,dd,hh,mm)-off*3600e3+(t.endsWith('23:59')?59e3:0)}
function dur(ms){const s=Math.max(0,ms/1e3|0),d=s/86400|0,h=(s%86400)/3600|0,m=(s%3600)/60|0,x=s%60;return (d?d+'d ':'')+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(x).padStart(2,'0')+'s'}
function evShow(){if(!EV){fetch('data/events.json?'+Date.now()).then(r=>r.json()).then(e=>{EV=e;evShow()});xv.innerHTML='loading…';return}
 const rg=localStorage.mir4rg||'NA';
 xv.innerHTML=`<h2>Events countdown</h2><label>Your server region<select id="evrg">${Object.entries(EV.regions).map(([k,o])=>`<option ${k==rg?'selected':''}>${k}</option>`).join('')}</select></label><div class="mt">All times in Pacific (PT). Siege and daily reset follow your region's server clock. Ended events hide automatically. Updated ${EV.updated}.</div><div id="evl"></div>`;
 xv.querySelector('#evrg').onchange=e=>{localStorage.mir4rg=e.target.value;evShow()};clearInterval(evT);evTick();evT=setInterval(()=>{if(xv.querySelector('#evl'))evTick();else clearInterval(evT)},1000)}
function evTick(){const rg=localStorage.mir4rg||'NA',ro=EV.regions[rg],now=Date.now();const L=EV.events.map(e=>{const off=e.tz=='server'?ro:e.off;return {...e,s:evMs(e.start,0,off),e2:e.end?evMs(e.end,0,off):(e.end_date?evMs(e.end_date+'T23:59',0,off):null)}}).filter(e=>e.e2==null||e.e2>now).sort((a,b)=>(a.s>now?a.s:a.e2||9e15)-(b.s>now?b.s:b.e2||9e15));
 const card=(n,lab,ms,sub,src,cls)=>`<div class="xc" style="${cls}"><div style="display:flex;justify-content:space-between;gap:8px"><b>${n}</b></div><div class="big" style="font-size:20px">${lab} ${ms}</div><div class="mt">${sub} · <a href="${src}" target="_blank">source</a></div></div>`;
 const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 function nextOcc(R){const off=R.tz=='server'?ro:R.off;let best=null;for(let d=-1;d<=8;d++){const sv=new Date(now+off*3600e3+d*864e5);if(R.days&&!R.days.includes(sv.getUTCDay()))continue;for(const t of R.times){const[hh,mm]=t.split(':').map(Number);const st=Date.UTC(sv.getUTCFullYear(),sv.getUTCMonth(),sv.getUTCDate(),hh,mm)-off*3600e3,en=st+(R.dur||0)*6e4;if(en>now&&(R.dur?true:st>now)&&(!best||st<best.st))best={st,en}}}return best}
 const groups={};for(const R of EV.recurring){const n=nextOcc(R);if(!n)continue;(groups[R.cat]=groups[R.cat]||[]).push({R,n})}
 let o=`<div class="vd" style="margin-top:8px"><b>Daylight saving</b><p>${EV.dst_note}</p></div><h3>Recurring</h3>`;
 for(const [g,L2] of Object.entries(groups)){o+=`<div class="mt" style="margin-top:10px;font-weight:700;color:#ffe08a">${g}</div>`;L2.sort((a,b)=>a.n.st-b.n.st).forEach(({R,n})=>{const live=n.st<=now;const sched=(R.days?R.days.map(d=>WD[d]).join('/')+' ':'Daily ')+R.times.join(', ')+(R.tz=='server'?` ${rg} server time`:` UTC+${R.off}`);
  o+=`<div class="xc" style="${live?'border-color:#1f7a3a;background:#14251a':''}"><b>${R.name}</b> ${R.official?'<span class="bs" style="background:#1d4ed8">Official</span>':'<span class="bs" style="background:#7f1d1d">Community, unverified</span>'}<div class="big" style="font-size:19px">${live?'LIVE, ends in '+dur(n.en-now):'Next in '+dur(n.st-now)}</div><div class="mt">${PT.format(n.st)} PT · ${sched}${R.note?'<br>'+R.note:''} · <a href="${R.src}" target="_blank">source</a></div></div>`})}
 o+=`<h3>Dated events</h3>`;
 o+=L.map(e=>{const up=e.s>now;const sub=(up?'Starts '+PT.format(e.s):'Started '+PT.format(e.s))+' PT · '+(e.end?'ends '+PT.format(e.e2)+' PT':'ends '+e.end_text)+(e.detail?'<br>'+e.detail:'')+(e.projected?' <b style="color:#f5c518">Projected</b>':'');
  const bd=e.kind=='siege'?'border-color:#a16207;background:#2a2410':up?'border-color:#2b6cb0':'';
  if(e.date_only)return card(e.name,'On',e.end_date,e.end_text,e.src,'border-color:#7c3aed');return card(e.name,up?'Starts in':e.end?'Ends in':'Ends',up?dur(e.s-now):e.end?dur(e.e2-now):'date TBA',sub,e.src,bd)}).join('');
 o+=`<h3>No timer (not announced or random)</h3><div class="xc mt">${(EV.not_scheduled||[]).map(x=>'• '+x).join('<br>')}</div>`;xv.querySelector('#evl').innerHTML=o}

})();

function guide(){const F='https://forum.mir4global.com/post/',src=(id,t)=>`<a href="${F}${id}" target="_blank">${t||'source'}</a>`;
 const tip=(t,b)=>`<div class="xc"><b>${t}</b><div class="mt" style="color:#cbd3e1;font-size:13px;margin-top:4px">${b}</div></div>`;
 return `<h2>Buyer guide</h2><div class="mt">Short tips from the official MIR4 Game Encyclopedia and NFT rules. Full notes: knowledge/mir4_official.md in the repo.</div>
 <h3>Before you buy</h3>
 ${tip('Server is locked','You can only load the character on the server it was sealed in, and you need 1 empty character slot there. Check the server on the card. '+src(527))}
 ${tip('Auction rules','WEMIX PLAY Marketplace runs an English auction: once you bid you cannot cancel. The winning bid wins if no one outbids within the window (default 3 hours). Seller pays 5% commission; every transaction needs WEMIX gas. '+src(1869))}
 ${tip('Prices are in WEMIX','USD price moves with the WEMIX token. Our Trends tab shows the link.')}
 <h3>What to look for</h3>
 ${tip('Dragon Forge (blue numeral on gear)','7 stages with 60%, 45%, 30%, 15%, 10% success for the first five, each try 10M Darksteel + 200 Dragonsteel + dragon materials. Expensive to redo, so forged gear is real value. '+src(34))}
 ${tip('Mythic gear','Legendary Tier IV at +15 can awaken to Mythic: max enhance +20 and a unique effect (only 1.5% roll Advanced grade). Mythic gear cannot be traded alone but stays on the character. '+src(2028))}
 ${tip('Spirit slots and spirits','Slot 9 needs level 175, slot 10 needs level 195 plus Spirit\'s Powder. Count Legendary and Mythic spirits; Legendary can transcend to IV. '+src(36))}
 ${tip('Magic stones and orbs','Epic+ magic stones special-enhance to Lv 7 (can break on Great Failure). Magical Soul Orb slots: 6 at levels 100 to 165. Yellow dots on gear icons are stone holes. '+src(34,'forge')+' '+src(1450,'orbs'))}
 ${tip('Transference Equipment','10 slots, enhance to +12, hidden stats at +3/6/9/12 and passive at +8; it breaks on failure from +2, so +8 or higher is costly. '+src(1524))}
 <h3>Red flags</h3>
 ${tip('Time-limited codex','Server, Reputation and Time-Limited Codex merge with your account, and expired time-limited codex gives nothing. A high codex % may not last. '+src(527))}
 ${tip('Power from consumables','Gold is not sealed with the character. Event buffs and time-limited items do not count after loading.')}
 ${tip('Many relists or price cuts','Check the History tab: repeated relists can mean the ask is too high, or that a hidden issue keeps buyers away.')}
 ${tip('Over fair price','Use the price vs fair badge. Our model is typically about 12% off, so treat a small gap as noise.')}
 <h3>Classes (official descriptions)</h3>
 ${tip('Warrior','Greatsword melee and front-line tank. Look for high DEF and HP with solid ATK; PvP DMG reduction matters in sieges.')}
 ${tip('Sorcerer','Elemental burst caster, strongest when protected. Prioritize ATK and Skill ATK boost.')}
 ${tip('Taoist','Sword and spells with divine healing (support). Clans value survivability: DEF and EVA, not only ATK.')}
 ${tip('Lancer','Spear user that attacks and defends at once. Balanced ATK and DEF; PvP ATK for wars.')}
 ${tip('Arbalist','Fast-firing ranged hunter with tracking and escape. ATK, EVA and PvP ATK.')}
 ${tip('Darkist','Ranged poison and curses. Skill ATK boost and ATK.')}
 ${tip('Spirit Summoner','8th class, added Aug 18, 2026: ranged spell class with MP control and buffs. Not seen in our NFT listings yet. '+src(2598))}
 <div class="mt">The official site has no class tier list. Class tips on what to prioritize are our reading of each class's official role, not official rankings. Class Change (from level 50) lets a character switch classes and keep most growth, but gear and skills belong to each class. ${src(316)}</div>`}
