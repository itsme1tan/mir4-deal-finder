/* Pro tools: advanced filters, watchlist, sold prices by class, market feed. Own implementation on our public data. */
(function(){
const F=[ // id, label, getter
 ['leg_t4','Legendary Tier 4 gear pieces',x=>(x.build&&x.build.gear||[]).filter(g=>g.g>=5&&g.t>=4).length],
 ['refined','Dragon Forge (refined) pieces',x=>x.refined],
 ['enh','Total gear enhance',x=>x.enhance],
 ['sk10','Skills at tier 10 or higher',x=>(x.build&&x.build.skills||[]).filter(s=>s.t>=10).length],
 ['sk11','Skills at tier 11',x=>(x.build&&x.build.skills||[]).filter(s=>s.t>=11).length],
 ['myth_sp','Mythic spirits',x=>x.myth_spirits],['leg_sp','Legendary spirits',x=>x.leg_spirits],
 ['ms_leg','Legendary or better magic stones',x=>(x.ms_leg||0)+(x.ms_myth||0)],
 ['te8','Transference pieces at +8 or more',x=>x.te_8],
 ['conq','Conquest total level',x=>x.conquest_lv],['inner','Inner Force level',x=>x.inner_force],['heaven','Cosmic Harmony (Heaven)',x=>x.heaven],
 ['codex','Codex %',x=>x.codex_pct],['lv','Level',x=>x.lv],
 ['atk','ATK',x=>x.atk],['skd','Skill ATK boost %',x=>x.skill_dmg],['pvp','PvP ATK boost',x=>x.pvp_dmg],['pvpr','PvP DMG reduction',x=>x.pvp_red],
 ['def','DEF (phys + spell)',x=>x.def],['eva','EVA',x=>x.eva],['acc','Accuracy',x=>x.acc],['crit','Crit',x=>x.crit],
 ['ds','Darksteel (millions)',x=>x.darksteel/1e6]];
const LS=JSON.parse(localStorage.mir4adv||'{}');let W=JSON.parse(localStorage.mir4watch||'{}');
const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;
const css=document.createElement('style');css.textContent=`.pro{margin:0 12px 10px;background:#171c26;border:1px solid #2a3140;border-radius:12px}.pro>summary{padding:12px;font-weight:700;cursor:pointer;color:#ffe08a}.pro .g{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 12px}.pro .g input{width:100%;box-sizing:border-box}.pro .in{padding:0 12px 12px;font-size:13px;color:#cbd3e1}.pro table{width:100%;border-collapse:collapse;font-size:12px}.pro td,.pro th{padding:5px 4px;border-bottom:1px solid #232a37;text-align:right;white-space:nowrap}.pro td:first-child,.pro th:first-child{text-align:left}.wst{background:none;border:1px solid #f5c518;color:#f5c518;border-radius:999px;padding:3px 10px;font-size:12px}.wst.on{background:#f5c518;color:#111}`;document.head.appendChild(css);
const ctl=document.querySelector('.ctl');const box=document.createElement('div');ctl.after(box);
const on=Object.keys(LS).filter(k=>LS[k]!=='').length;
box.innerHTML=`<details class="pro" id="padv"><summary>Advanced filters <span id="pacnt" class="mt">${on?'('+on+' on)':''}</span></summary><div class="in">Minimum values. Leave blank to ignore. Saved on this phone.</div><div class="g">${F.map(([k,l])=>`<label>${l}<input type="number" data-adv="${k}" value="${LS[k]??''}" inputmode="decimal"></label>`).join('')}<label><span>&nbsp;</span><span><input type="checkbox" id="fwatch"> Watchlist only</span></label><button id="pclr" style="background:#334155">Clear advanced filters</button></div></details>
<details class="pro" id="pwl"><summary>Watchlist (<span id="wcnt">0</span>)</summary><div class="in" id="wlist"></div></details>
<details class="pro" id="ppr"><summary>Sold prices by class</summary><div class="in" id="plist"></div></details>
<details class="pro" id="pfeed"><summary>Market feed (last 48h)</summary><div class="in" id="flist"></div></details>`;
const sv=()=>{localStorage.mir4adv=JSON.stringify(LS);localStorage.mir4watch=JSON.stringify(W)};
box.querySelectorAll('[data-adv]').forEach(i=>i.oninput=()=>{LS[i.dataset.adv]=i.value;sv();pacnt.textContent=Object.values(LS).filter(v=>v!=='').length?'('+Object.values(LS).filter(v=>v!=='').length+' on)':'';draw()});
fwatch.oninput=()=>draw();pclr.onclick=()=>{for(const k in LS)LS[k]='';box.querySelectorAll('[data-adv]').forEach(i=>i.value='');sv();pacnt.textContent='';draw()};
const _rows=rows;rows=function(){return _rows().filter(x=>F.every(([k,,g])=>{const v=LS[k];if(v===''||v==null)return true;const y=g(x);return y!=null&&y>=+v})&&(!fwatch.checked||W[key(x)]))};
const _hc=histChips;histChips=function(x){const w=W[key(x)];let o=`<button class="wst ${w?'on':''}" data-w="${encodeURIComponent(key(x))}">${w?'★ Watching':'☆ Watch'}</button>`;
 if(w&&w.wemix!==x.wemix){const p=Math.round((x.wemix/w.wemix-1)*1000)/10;o+=`<span class="hc" style="border-color:${p<0?'#16a34a':'#b91c1c'}">Since you started watching: ${p>0?'+':''}${p}% (${f(w.wemix)} to ${f(x.wemix)} WEMIX)</span>`}
 return o+_hc(x)};
document.addEventListener('click',e=>{const b=e.target.closest('.wst');if(!b)return;e.stopPropagation();e.preventDefault();const k=decodeURIComponent(b.dataset.w);
 if(W[k])delete W[k];else{const x=D.listings.find(z=>key(z)==k);W[k]={wemix:x.wemix,usd:Math.round(x.usd),t:new Date().toISOString().slice(0,10),id:x.id}}sv();draw();wl()},true);
const sms=s=>Date.parse(s.replace(' ','T')+':00+08:00');// Hofgamer times are UTC+8
const PT=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function wl(){const ks=Object.keys(W);wcnt.textContent=ks.length;if(!ks.length){wlist.innerHTML='Tap ☆ Watch on any card. You will see price changes, relists and sales here after each daily refresh (not real time).';return}
 wlist.innerHTML=ks.map(k=>{const w=W[k],[n,sv2,c]=k.split('|');const x=D.listings.find(z=>key(z)==k);
  if(x){const p=Math.round((x.wemix/w.wemix-1)*1000)/10;return `<div class="xc"><b>${n}</b> · ${c} · ${sv2}<br>Listed now ${f(x.wemix)} WEMIX ($${f(x.usd)}). ${p?`${p>0?'Up':'Down'} ${Math.abs(p)}% since ${w.t}.`:'No price change since '+w.t+'.'}${x.id!=w.id?' Relisted under a new listing.':''}</div>`}
  const s=D.sales.find(z=>z.name==n&&z.cls==c&&(!z.server||z.server==sv2));
  return `<div class="xc"><b>${n}</b> · ${c} · ${sv2}<br>${s?`Sold for ${f(s.wemix)} WEMIX on ${PT.format(sms(s.sold))} PT.`:'Not listed right now (delisted or sold outside our sales sample).'} <button class="wst on" data-w="${encodeURIComponent(k)}">Remove</button></div>`}).join('')}
const med=a=>{a=[...a].sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2},q=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(p*a.length))]};
function prices(){const now=Date.parse(D.updated.replace(' ','T')+':00-07:00'),S=D.sales.filter(s=>s.wemix&&s.sold),u=D.wemix_usd;
 const cls=[...new Set(S.map(s=>s.cls))].sort();
 const ch=(L,d)=>{const a=L.filter(s=>now-sms(s.sold)<d*864e5).map(s=>s.wemix/s.ps*1000),b=L.filter(s=>{const t=now-sms(s.sold);return t>=d*864e5&&t<2*d*864e5}).map(s=>s.wemix/s.ps*1000);return a.length>=5&&b.length>=5?((med(a)/med(b)-1)*100).toFixed(0)+'%':'not enough'};
 plist.innerHTML=`Real sales we track (mostly 400k+ power), in WEMIX. Typical range = middle half of sales. Change compares price per 1k power with the period before, shown only with 5+ sales in each. Swipe the table sideways.<div style="overflow-x:auto"><table><tr style="font-weight:700;color:#9aa3b8"><td>Class</td><td>Sales</td><td>Median</td><td>Typical range</td><td>Floor now</td><td>7d</td><td>30d</td></tr>${cls.map(c=>{const L=S.filter(s=>s.cls==c),p=L.map(s=>s.wemix),li=D.listings.filter(x=>x.cls==c);
  return `<tr><td>${c}</td><td>${L.length}</td><td>${f(med(p))}<br><span class="mt">$${f(med(p)*u)}</span></td><td>${f(q(p,.25))} to ${f(q(p,.75))}</td><td>${li.length?f(Math.min(...li.map(x=>x.wemix)))+' ('+li.length+')':'none'}</td><td>${ch(L,7)}</td><td>${ch(L,30)}</td></tr>`}).join('')}</table></div>`}
function feed(){const now=Date.parse(D.updated.replace(' ','T')+':00-07:00');const ev=[];
 D.listings.forEach(x=>{if(x.listed){const t=sms(x.listed);if(now-t<2*864e5)ev.push({t,h:`<b style="color:#60a5fa">Listed</b> ${x.name} · ${x.cls} Lv ${x.lv} · ${f(x.ps)} power · ${f(x.wemix)} WEMIX ($${f(x.usd)})`})}});
 D.sales.forEach(s=>{if(s.sold&&s.wemix){const t=sms(s.sold);if(now-t<2*864e5)ev.push({t,h:`<b style="color:#4ade80">Sold</b> ${s.name} · ${s.cls} Lv ${s.lv} · ${f(s.ps)} power · ${f(s.wemix)} WEMIX ($${f(s.wemix*D.wemix_usd)})`})}});
 ev.sort((a,b)=>b.t-a.t);flist.innerHTML=(ev.length?ev.map(e=>`<div style="padding:6px 0;border-bottom:1px solid #232a37"><span class="mt">${PT.format(e.t)} PT</span><br>${e.h}</div>`).join(''):'Nothing in the last 48h.')+'<div class="mt" style="margin-top:6px">Built from the daily refresh, so it can be up to a day behind. Listings are 600k+ power; sales are the sample we track.</div>'}
if(new URLSearchParams(location.search).get('pro'))box.querySelectorAll('details').forEach(d=>d.open=true);
const t=setInterval(()=>{if(typeof D!='undefined'&&D&&D.listings){clearInterval(t);wl();prices();feed();draw()}},200);
})();
