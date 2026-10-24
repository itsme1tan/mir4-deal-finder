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
 ['ds','Darksteel (millions)',x=>x.darksteel/1e6],
 ['b_conquest_tower','Building: Tower of Conquest',x=>x.bld?x.bld.conquest_tower:null],
 ['b_forge','Building: Forge',x=>x.bld?x.bld.forge:null],
 ['b_mine','Building: Mine',x=>x.bld?x.bld.mine:null],
 ['b_tree','Building: Millennial Tree',x=>x.bld?x.bld.tree:null],
 ['b_sanctum','Building: Training Sanctum',x=>x.bld?x.bld.sanctum:null],
 ['b_quint','Building: Tower of Quintessence',x=>x.bld?x.bld.quint:null],
 ['b_victory','Building: Tower of Victory',x=>x.bld?x.bld.victory:null],
 ['b_shrine','Building: Holy Shrine',x=>x.bld?x.bld.shrine:null],
 ['b_portal','Building: Portal',x=>x.bld?x.bld.portal:null],
 ['b_hydra','Building: Sanctuary of Hydra',x=>x.bld?x.bld.hydra:null],
 ['const','Constitution level',x=>x.constitution],['train','Training manuals, total levels',x=>x.train?Object.values(x.train).reduce((a,b)=>a+b,0):null],
 ['tomes','Skill tomes in bag',x=>x.inv?x.inv.skill_tomes:null],['tomes_l','Legendary skill tomes',x=>x.inv?x.inv.skill_tomes_leg:null],
 ['dm_e','Epic+ dragon materials',x=>x.inv?x.inv.dragon_mats_epic+x.inv.dragon_mats_leg:null],['lmats','Legendary crafting materials',x=>x.inv?x.inv.leg_mats:null],
 ['lenh','Legendary enhancement stones',x=>x.inv?x.inv.leg_enh_stones:null],['sgear','Spare Legendary gear in bag',x=>x.inv?x.inv.spare_leg_gear:null],
 ['sms','Spare Legendary magic stones',x=>x.inv?x.inv.spare_leg_ms:null],['tix','Summon tickets',x=>x.inv?x.inv.summon_tickets:null]];
const farmer=x=>!!(x.bld&&x.bld.mine>=x.bld.conquest_tower&&(x.build_score??0)<40);
const LS=JSON.parse(localStorage.mir4adv||'{}');let W=JSON.parse(localStorage.mir4watch||'{}');
const key=x=>x.name+'|'+(x.server||'')+'|'+x.cls;
const css=document.createElement('style');css.textContent=`.pro{margin:0 12px 10px;background:#171c26;border:1px solid #2a3140;border-radius:12px}.pro>summary{padding:12px;font-weight:700;cursor:pointer;color:#ffe08a}.pro .g{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 12px}.pro .g input{width:100%;box-sizing:border-box}.pro .in{padding:0 12px 12px;font-size:13px;color:#cbd3e1}.pro table{width:100%;border-collapse:collapse;font-size:12px}.pro td,.pro th{padding:5px 4px;border-bottom:1px solid #232a37;text-align:right;white-space:nowrap}.pro td:first-child,.pro th:first-child{text-align:left}.wst{background:none;border:1px solid #f5c518;color:#f5c518;border-radius:999px;padding:3px 10px;font-size:12px}.wst.on{background:#f5c518;color:#111}`;document.head.appendChild(css);
const ctl=document.querySelector('.ctl');const box=document.createElement('div');ctl.after(box);
const on=Object.keys(LS).filter(k=>LS[k]!==''&&LS[k]!=null).length;
box.innerHTML=`<details class="pro" id="padv"><summary>🎛 Filters+ <span id="pacnt" class="mt">${on?'('+on+' on)':''}</span></summary><div class="in">Minimum values. Leave blank to ignore. Saved on this phone. <b id="pmatch" style="color:#ffe08a"></b></div><div class="g">${F.map(([k,l])=>`<label>${l}<input type="number" data-adv="${k}" value="${LS[k]??''}" inputmode="decimal"></label>`).join('')}<label>Farmer profile<select id="ffarm"><option value="">Show all</option><option value="hide">Hide farmers</option><option value="only">Farmers only</option></select></label><label><span>&nbsp;</span><span><input type="checkbox" id="fwatch"> Watchlist only</span></label><button id="pclr" style="background:#334155">Clear advanced filters</button></div></details>
<details class="pro" id="pal"><summary>🔔 Alerts <span class="mt">(page open only)</span></summary><div class="in">Not instant push. The data refreshes about every 30 minutes on GitHub. While this page is open, it checks every 5 minutes and plays a sound and shows a browser notification when a watched character changes price, relists or sells, or a new strong deal appears. Nothing arrives when the page is closed. <div style="margin-top:8px"><button id="alon">Turn on alerts</button> <button id="altest" style="background:#334155">Test sound</button> <span id="alst" class="mt"></span></div></div></details>
<details class="pro" id="pwl"><summary>⭐ Watchlist (<span id="wcnt">0</span>)</summary><div class="in" id="wlist"></div></details>
<details class="pro" id="ppr"><summary>💰 Sold prices</summary><div class="in" id="plist"></div></details>
<details class="pro" id="pfeed"><summary>📰 Feed 48h</summary><div class="in" id="flist"></div></details>`;
const sv=()=>{localStorage.mir4adv=JSON.stringify(LS);localStorage.mir4watch=JSON.stringify(W)};
box.querySelectorAll('[data-adv]').forEach(i=>i.oninput=()=>{LS[i.dataset.adv]=i.value;sv();pacnt.textContent=Object.values(LS).filter(v=>v!=='').length?'('+Object.values(LS).filter(v=>v!=='').length+' on)':'';draw()});
fwatch.oninput=()=>draw();ffarm.value=LS.farm||'';ffarm.oninput=()=>{LS.farm=ffarm.value;sv();draw()};pclr.onclick=()=>{for(const k in LS)LS[k]='';box.querySelectorAll('[data-adv]').forEach(i=>i.value='');sv();pacnt.textContent='';draw()};
const _rows=rows;rows=function(){return _rows().filter(x=>F.every(([k,,g])=>{if(k=='farm')return true;const v=parseFloat(String(LS[k]??'').replace(/,/g,''));if(!isFinite(v))return true;const y=g(x);return y!=null&&y>=v})&&(!fwatch.checked||W[key(x)])&&(!LS.farm||(LS.farm=='only')==farmer(x)))};
if(!document.getElementById('advcss')){const st=document.createElement('style');st.id='advcss';st.textContent='body.simple.advon #cards{display:block!important;padding:0 12px 12px}#advhd{display:none;margin:0 12px 6px;font-size:18px;font-weight:700;color:#ffe08a}body.simple.advon #advhd{display:block}';document.head.append(st)}
const cardsHome=document.getElementById('cards').parentNode,cardsNext=document.getElementById('cards').nextSibling,advhd=document.createElement('div');advhd.id='advhd';
const advOn=()=>F.some(([k])=>isFinite(parseFloat(String(LS[k]??'').replace(/,/g,''))))||!!LS.farm||fwatch.checked;
const placeCards=()=>{const c=document.getElementById('cards'),on=advOn()&&document.body.classList.contains('simple');document.body.classList.toggle('advon',advOn());
 if(on){const pa=document.getElementById('padv');if(advhd.previousSibling!==pa)pa.after(advhd);if(advhd.nextSibling!==c)advhd.after(c);advhd.textContent='🎯 Matches ('+rows().length+')'}
 else if(c.parentNode!==cardsHome||c.nextSibling!==cardsNext){cardsHome.insertBefore(c,cardsNext);advhd.remove()}};
new MutationObserver(()=>{if(window.D&&D.listings)placeCards()}).observe(document.body,{attributes:true,attributeFilter:['class']});
const _dr=draw;draw=function(){_dr();placeCards();const el=document.getElementById('pmatch');if(!el)return;const n=rows().length,ex=[];
 if(fcls.value)ex.push('Class '+fcls.value);if(freg.value)ex.push('Region '+freg.value);if(+fps.value)ex.push('Min power');if(fusd.value)ex.push('Max price');if(fq.value)ex.push('Search text');
 ['fdeal','fcut','fnoflip','fstrong','fflip'].forEach(i=>{const e=document.getElementById(i);if(e&&e.checked&&i!='fflip')ex.push(e.closest('label')?e.closest('label').textContent.trim():i)});if(fwatch.checked)ex.push('Watchlist only');if(LS.farm)ex.push('Farmer profile');
 const adv=F.filter(([k])=>isFinite(parseFloat(String(LS[k]??'').replace(/,/g,'')))).map(([,l])=>l);
 el.innerHTML=` ${n} match${n==1?'':'es'}${n?' (cards below)':''}.`+(!n&&(ex.length||adv.length)?` <span style="color:#fca5a5">Also on: ${[...ex,...adv].join(', ')}.</span>`:'')};
['fsort','fcls','freg','fps','fusd','fq','fdeal','fcut','fnoflip','fstrong','fflip'].forEach(i=>{const e=document.getElementById(i);if(e)e.addEventListener('input',()=>setTimeout(()=>draw(),0))});
const _hc=histChips;histChips=function(x){const w=W[key(x)];let o=`<button class="wst ${w?'on':''}" title="${w?'Watching. Tap to stop':'Watch this character'}" data-w="${encodeURIComponent(key(x))}">${w?'★':'☆'}</button>`;
 if(w&&w.wemix!==x.wemix){const p=Math.round((x.wemix/w.wemix-1)*1000)/10;o+=`<span class="hc" style="border-color:${p<0?'#16a34a':'#b91c1c'}" title="Since you started watching: ${f(w.wemix)} to ${f(x.wemix)} WEMIX">⭐ ${p>0?'+':''}${p}%</span>`}
 return o+_hc(x)+more(x)};
const BN={conquest_tower:'Tower of Conquest',forge:'Forge',mine:'Mine',tree:'Millennial Tree',sanctum:'Training Sanctum',quint:'Quintessence',victory:'Victory',shrine:'Holy Shrine',portal:'Portal',hydra:'Hydra'};
const BS={conquest_tower:['Conquest','castle'],forge:['Forge','hammer'],mine:['Mine','pickaxe'],tree:['Tree','tree-pine'],sanctum:['Sanctum','dumbbell'],quint:['Quint.','sparkles'],victory:['Victory','trophy'],shrine:['Shrine','flag'],portal:['Portal','repeat'],hydra:['Hydra','ghost']};
const TS={'Muscle Strength Manual':'Muscle','Nine Yin Manual':'Yin','Nine Yang Manual':'Yang','Violet Mist Art':'Violet','Northern Profound Art':'North','Toad Stance':'Toad'};
const MS={'Unicorn Lion':'Lion','Vermilion Bird':'Bird','Black Tortoise':'Tortoise','White Tiger':'Tiger','Blue Dragon':'Dragon'};
if(!document.getElementById('vbcss')){const st=document.createElement('style');st.id='vbcss';st.textContent=`.vb h5{margin:8px 0 4px;font-size:11px;font-weight:600;color:#9aa3b8;display:flex;align-items:center;gap:4px}.vg{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:5px}.vt{position:relative;aspect-ratio:1;border-radius:8px;background:#141b2b;border:1.5px solid #334155;display:flex;align-items:center;justify-content:center;overflow:hidden}.vt.g5{border-color:#f5c518;background:radial-gradient(circle,#3b2f0b,#141b2b 70%)}.vt.g4{border-color:#c084fc;background:radial-gradient(circle,#2e1a47,#141b2b 70%)}.vt img{width:82%;height:82%;object-fit:contain}.vt .ico{width:22px;height:22px;color:#cbd3e1;margin-top:-8px}.vt b{position:absolute;right:2px;bottom:1px;font-size:10px;line-height:1;color:#fff;text-shadow:0 0 3px #000,0 0 2px #000;font-weight:700}.vt s{position:absolute;left:0;right:0;bottom:12px;text-decoration:none;font-size:8.5px;color:#9aa3b8;text-align:center;white-space:nowrap;overflow:hidden}`;document.head.appendChild(st)}
const kf=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':n>=1e4?Math.round(n/1e3)+'k':n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'k':String(n);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const vt=(o)=>`<div class="vt${o.g>=5?' g5':o.g==4?' g4':''}" title="${esc(o.t)}">${o.img?`<img loading="lazy" decoding="async" src="${esc(o.img)}" alt="${esc(o.t)}" onerror="this.outerHTML='<i class=&quot;ico&quot; style=&quot;--i:url(icons/ui/package.svg)&quot;></i>'">`:`<i class="ico" style="--i:url(icons/ui/${o.ic||'package'}.svg)"></i><s>${esc(o.s||'')}</s>`}${o.b!=null?`<b>${esc(o.b)}</b>`:''}</div>`;
const vh=(ic,t)=>`<h5><i class="ico" style="--i:url(icons/ui/${ic}.svg)"></i>${t}</h5>`;
function more(x){if(!x.bld&&!x.inv)return '';const I=x.inv||{},G=I.img||{};
 const bl=x.bld?Object.entries(x.bld).map(([k,v])=>vt({t:`${BN[k]||k} ${v}`,s:(BS[k]||[k])[0],ic:(BS[k]||[0,'building-2'])[1],b:v})).join(''):'';
 const tr=x.train?Object.entries(x.train).map(([k,v])=>vt({t:`${k} ${v}`,s:TS[k]||k.split(' ')[0],ic:'book-marked',b:v})).join('')+(x.constitution!=null?vt({t:`Constitution ${x.constitution}`,s:'Const.',ic:'heart-pulse',b:x.constitution}):''):'';
 const my=x.mystique?Object.entries(x.mystique).map(([k,v])=>vt({t:`${k} Mystique ${v}`,s:MS[k]||k,ic:'gem',b:v})).join(''):'';
 const bag=x.inv?[['skill_tomes','Skill tomes','scroll',5],['arcane_tomes','Arcane tomes','book-open',4],['leg_mats','Legendary materials','mountain',5],['leg_enh_stones','Legendary enhancement stones','sparkles',5],['spare_leg_gear','Spare Legendary gear','sword',5],['spare_leg_ms','Spare Legendary magic stones','gem',5],['summon_tickets','Summon tickets','ticket',0]].filter(([k])=>I[k]).map(([k,t,ic,g])=>vt({t:`${t}: ${f(I[k])}${k=='skill_tomes'?` (${f(I.skill_tomes_leg)} Legendary, ${f(I.skill_tomes_epic)} Epic)`:''}`,img:G[k],ic,s:t.split(' ')[0],g,b:kf(I[k])})).join('')
   +Object.entries(I.dragon_mats||{}).filter(([,v])=>v).map(([k,v])=>vt({t:`Epic+ dragon ${k}: ${v}`,img:G['dm_'+k],ic:'dna',s:k,g:4,b:kf(v)})).join(''):'';
 const top=(I.top||[]).slice(0,12).map(r=>vt({t:`${r[0]} x${f(r[1])}`,img:r[3],ic:'package',s:r[0].replace(/^\[L\]\s*/,'').split(' ')[0],g:r[2]||5,b:kf(r[1])})).join('');
 return `<details class="xd" style="width:100%;margin-top:6px;font-size:12px;color:#cbd3e1"><summary style="cursor:pointer;color:#ffe08a">🏰 Conquest · 🥋 Training · 🎒 Bag${farmer(x)?' · <b style="color:#fca5a5">Farmer profile</b>':''}</summary>
 <div class="vb" style="padding:2px 0 6px">${bl?vh('castle','Conquest')+`<div class="vg">${bl}</div>`:''}${tr?vh('dumbbell','Training')+`<div class="vg">${tr}</div>`:''}${my?vh('gem','Mystique')+`<div class="vg">${my}</div>`:''}${bag?vh('backpack',`Bag · ${f(I.n)} stacks`)+`<div class="vg">${bag}</div>`:''}${top?vh('crown','Top Legendary stacks')+`<div class="vg">${top}</div>`:''}
 <div class="mt" style="margin-top:6px;font-size:11px">Source: XDRACO. Farmer = Mine ≥ Conquest and build &lt; 40.</div></div></details>
 <details class="xd ask" data-id="${x.id}" style="width:100%;margin-top:4px;font-size:12px"><summary style="cursor:pointer;color:#93c5fd">💬 Ask</summary><div style="display:flex;flex-wrap:wrap;gap:6px;padding:6px 0">${Object.keys(QA).map(q=>`<button class="aq" data-q="${q}" style="background:#1e293b;font-size:12px">${q}</button>`).join('')}</div><div class="ans" style="color:#e2e8f0;line-height:1.5"></div></details>`}
const pctTxt=d=>d==null?'unknown':d>=0?d+'% under fair':(-d)+'% over fair';
const QA={
 'Is the price fair?':x=>`Asking ${f(x.wemix)} WEMIX ($${f(x.usd)}). Our fair value is about ${f(x.fair_head)} WEMIX ($${f(x.fair_head*D.wemix_usd)}), so it is ${pctTxt(x.discount)}. Basis: ${x.fair_basis}${x.full_conf=='low'?', low confidence':''}. ${x.comps_n?`${x.comps_n} comparable sales (${x.comps_basis}).`:'No close comparable sales.'} Our model is typically about 11% off, so gaps under 10% are noise.`,
 'How strong is it?':x=>`Build score ${x.build_score??'n/a'}/100 in ${x.cls} (in-class ranks). ATK top ${100-(x.atk_pct??0)}%, Skill ATK top ${100-(x.skd_pct??0)}%, PvP ATK top ${100-(x.pvp_dmg_pct??0)}%, DEF top ${100-(x.def_pct??0)}%, EVA top ${100-(x.eva_pct??0)}%. ${x.strong?'It counts as a strong build.':'Not in the top 25% of its class on build score.'}`,
 'What adds value?':x=>x.value_bd?`Starting from ${f(x.value_bd.base)} WEMIX for its power and class: `+x.value_bd.items.map(r=>`${r[0]} ${r[1]>=0?'+':''}${f(r[1])}`).join(', ')+'.':'No value breakdown for this one.',
 'Weak spots?':x=>{const w=[];[['ATK','atk_pct'],['Skill ATK','skd_pct'],['PvP ATK','pvp_dmg_pct'],['DEF','def_pct'],['EVA','eva_pct'],['PvP DMG reduction','pvp_red_pct']].forEach(([n,k])=>{if(x[k]!=null&&x[k]<40)w.push(`${n} (bottom ${x[k]}%)`)});
   if(x.bld&&x.bld.hydra!=null&&x.bld.hydra<15)w.push(`Sanctuary of Hydra only ${x.bld.hydra}`);if((x.codex_limited||0)>0)w.push('some codex is time-limited');if(x.full_conf=='low')w.push('fair value is low confidence');
   return w.length?'Below class average on: '+w.join(', ')+'.':'No stat is in the bottom 40% of its class.'},
 'Price history?':x=>{const r=x.rl;return (r?`Since ${r.since} PT our tracker saw ${r.relists} relist(s); ask moved from ${f(r.from)} to ${f(r.to)} WEMIX (${r.pct>0?'+':''}${r.pct}%). `:'No relists or price changes seen by our tracker. ')+(x.relists?`Hofgamer shows ${x.relists} earlier delist(s). `:'')},
 'Can I play it?':x=>`It is sealed on server ${x.server}. You can only load it on that server and need a free character slot there. Bids on WEMIX PLAY cannot be cancelled.`,
 'Farmer or fighter?':x=>x.bld?(farmer(x)?`Looks like a farmer: Mine ${x.bld.mine} vs Tower of Conquest ${x.bld.conquest_tower}, build score ${x.build_score}.`:`Not a farmer by our rule: Mine ${x.bld.mine}, Tower of Conquest ${x.bld.conquest_tower}, build score ${x.build_score}.`)+` Darksteel on hand: ${f(x.darksteel/1e6,1)}M.`:'Building data not loaded yet.'};
document.addEventListener('click',e=>{const q=e.target.closest('.aq');if(!q)return;e.stopPropagation();e.preventDefault();const box=q.closest('.ask'),x=D.listings.find(z=>z.id==box.dataset.id);box.querySelector('.ans').textContent=QA[q.dataset.q](x)},true);
document.addEventListener('click',e=>{if(e.target.closest('details.xd'))e.stopPropagation()},true);
document.addEventListener('click',e=>{const b=e.target.closest('.wst');if(!b)return;e.stopPropagation();e.preventDefault();const k=decodeURIComponent(b.dataset.w);
 if(W[k])delete W[k];else{const x=D.listings.find(z=>key(z)==k);W[k]={wemix:x.wemix,usd:Math.round(x.usd),t:new Date().toISOString().slice(0,10),id:x.id}}sv();draw();wl()},true);
const sms=s=>Date.parse(s.replace(' ','T')+':00+08:00');// Hofgamer times are UTC+8
const dPT=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}).format(t);
const relPT=t=>{const d=dPT(t),n=Date.now(),hm=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'}).format(t),md=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric'}).format(t);return (d==dPT(n)?'Today':d==dPT(n-864e5)?'Yesterday':md)+' at '+hm};
const PT=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const ci=c=>`<img src="icons/class/${(c||'').toLowerCase()}.webp" alt="${c}" title="${c}" style="width:28px;height:28px;vertical-align:-9px;margin-right:5px;border-radius:4px" onerror="this.replaceWith(document.createTextNode('${c} '))">`;
function wl(){const ks=Object.keys(W);wcnt.textContent=ks.length;if(!ks.length){wlist.innerHTML='Tap ☆ Watch on any card. You will see price changes, relists and sales here after each refresh, about every 30 minutes (not real time).';return}
 wlist.innerHTML=ks.map(k=>{const w=W[k],[n,sv2,c]=k.split('|');const x=D.listings.find(z=>key(z)==k);
  if(x){const p=Math.round((x.wemix/w.wemix-1)*1000)/10;return `<div class="xc"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span>${ci(c)}<b><a class="fn" data-l="${x.id}">${n}</a></b> · ${sv2}</span><span style="text-align:right;white-space:nowrap"><small class="mt">Listed now</small><br><b>${f(x.wemix)} W</b> ($${f(x.usd)})</span></div>${p?`${p>0?'Up':'Down'} ${Math.abs(p)}% since ${w.t}.`:'No price change since '+w.t+'.'}${x.id!=w.id?' Relisted under a new listing.':''}</div>`}
  const s=D.sales.find(z=>z.name==n&&z.cls==c&&(!z.server||z.server==sv2));
  return `<div class="xc">${ci(c)}<b>${s&&s.id?`<span class="fs" data-s="${s.id}">${n}</span>`:n}</b> · ${sv2}<br>${s?`Sold for ${f(s.wemix)} WEMIX on ${PT.format(sms(s.sold))} PT.`:'Not listed right now (delisted or sold outside our sales sample).'} <button class="wst on" data-w="${encodeURIComponent(k)}">Remove</button></div>`}).join('');lk(wlist)}
const med=a=>{a=[...a].sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2},q=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(p*a.length))]};
function prices(){const now=Date.parse(D.updated.replace(' ','T')+':00-07:00'),S=D.sales.filter(s=>s.wemix&&s.sold),u=D.wemix_usd;
 const cls=[...new Set(S.map(s=>s.cls))].sort();
 const ch=(L,d)=>{const a=L.filter(s=>now-sms(s.sold)<d*864e5).map(s=>s.wemix/s.ps*1000),b=L.filter(s=>{const t=now-sms(s.sold);return t>=d*864e5&&t<2*d*864e5}).map(s=>s.wemix/s.ps*1000);return a.length>=5&&b.length>=5?((med(a)/med(b)-1)*100).toFixed(0)+'%':'not enough'};
 plist.innerHTML=`Real sales we track (mostly 400k+ power), in WEMIX. Typical range = middle half of sales. Change compares price per 1k power with the period before, shown only with 5+ sales in each. Swipe the table sideways.<div style="overflow-x:auto"><table><tr style="font-weight:700;color:#9aa3b8"><td>Class</td><td>Sales</td><td>Median</td><td>Typical range</td><td>Floor now</td><td>7d</td><td>30d</td></tr>${cls.map(c=>{const L=S.filter(s=>s.cls==c),p=L.map(s=>s.wemix),li=D.listings.filter(x=>x.cls==c);
  return `<tr><td>${c}</td><td>${L.length}</td><td>${f(med(p))}<br><span class="mt">$${f(med(p)*u)}</span></td><td>${f(q(p,.25))} to ${f(q(p,.75))}</td><td>${li.length?f(Math.min(...li.map(x=>x.wemix)))+' ('+li.length+')':'none'}</td><td>${ch(L,7)}</td><td>${ch(L,30)}</td></tr>`}).join('')}</table></div>`}
function lk(el){if(!document.getElementById('fnst')){const y=document.createElement('style');y.id='fnst';y.textContent='#flist a.fn,#flist .fs.on,#wlist a.fn,#wlist .fs.on{color:#e8c872;text-decoration:underline dotted rgba(232,200,114,.5);text-underline-offset:3px;cursor:pointer}';document.head.appendChild(y)}
 el.querySelectorAll('a.fn').forEach(a=>a.onclick=()=>window.solo20&&solo20(a.dataset.l));
 el.querySelectorAll('.fs').forEach(a=>{const id=a.dataset.s;if(!id)return;fetch('data/snaps/'+id+'.json',{method:'HEAD'}).then(r=>{if(!r.ok)return;a.classList.add('on');a.onclick=()=>window.soloSold&&soloSold(id,a.textContent)}).catch(()=>{})})}
function feed(){const now=Date.parse(D.updated.replace(' ','T')+':00-07:00');const ev=[];
 D.listings.forEach(x=>{if(x.listed&&x.ps>=650000){const t=sms(x.listed);if(now-t<2*864e5)ev.push({t,h:`<b style="color:#60a5fa">Listed</b> <a class="fn" data-l="${x.id}">${x.name}</a> · ${x.cls} Lv ${x.lv} · ${f(x.ps)} power · ${f(x.wemix)} WEMIX ($${f(x.usd)})`})}});
 D.sales.forEach(s=>{if(s.sold&&s.wemix&&s.ps>=650000){const t=sms(s.sold);if(now-t<2*864e5)ev.push({t,h:`<b style="color:#4ade80">Sold</b> <span class="fs" data-s="${s.id||''}">${s.name}</span> · ${s.cls} Lv ${s.lv} · ${f(s.ps)} power · ${f(s.wemix)} WEMIX ($${f(s.wemix*D.wemix_usd)})`})}});
 ev.sort((a,b)=>b.t-a.t);flist.innerHTML=(ev.length?ev.map(e=>`<div style="padding:6px 0;border-bottom:1px solid #232a37"><span class="mt">${relPT(e.t)} PT</span><br>${e.h}</div>`).join(''):'Nothing in the last 48h.')+'<div class="mt" style="margin-top:6px">Built from the 30 minute refresh, so it can be about 30 minutes behind. Listings and sales shown are 650k+ power.</div>';
 lk(flist)}
if(new URLSearchParams(location.search).get('pro'))box.querySelectorAll('details').forEach(d=>d.open=true);
let AC=null;const actx=()=>{try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C()}if(AC.state!='running')AC.resume().catch(()=>{});return AC};
const unlock=()=>{const a=actx();if(!a)return;try{const b=a.createBuffer(1,1,22050),s=a.createBufferSource();s.buffer=b;s.connect(a.destination);s.start(0)}catch(e){}};
['touchend','click'].forEach(ev=>document.addEventListener(ev,unlock,{once:true,capture:true}));
const beep=()=>{try{const a=actx();if(!a)return;const t0=a.currentTime+.05;[880,1320].forEach((h,i)=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=h;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.0001,t0+i*.25);g.gain.exponentialRampToValueAtTime(.35,t0+i*.25+.02);g.gain.exponentialRampToValueAtTime(.001,t0+i*.25+.22);o.start(t0+i*.25);o.stop(t0+i*.25+.23)})}catch(e){}};
let SWR=null;if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./'}).then(r=>SWR=r).catch(()=>{});
const banner=(t,b)=>{try{if(!window.Notification||Notification.permission!='granted')return false;const o={body:b,icon:'icons/app-192.png',tag:'mir4-'+Date.now()};
 if(SWR&&SWR.showNotification){SWR.showNotification(t,o);return true}if(navigator.serviceWorker&&navigator.serviceWorker.ready)navigator.serviceWorker.ready.then(r=>r.showNotification(t,o)).catch(()=>{try{new Notification(t,o)}catch(e){}});else new Notification(t,o);return true}catch(e){return false}};
const askPerm=()=>{try{if(window.Notification&&Notification.permission=='default')return Notification.requestPermission()}catch(e){}return Promise.resolve(window.Notification?Notification.permission:'unsupported')};
const notify=(t,b)=>{beep();banner(t,b);alst.textContent=t+': '+b};
const snap=(d,nd)=>({deals:(nd.deals||[]).map(z=>z.id),w:Object.fromEntries(Object.keys(W).map(k=>{const x=d.listings.find(z=>key(z)==k);return [k,x?x.id+':'+x.wemix:'gone']}))});
let last=null,alT=null;
function check(){Promise.all([fetch('data.json?'+Date.now()).then(r=>r.json()),fetch('data/new_deals.json?'+Date.now()).then(r=>r.json())]).then(([d,nd])=>{const s2=snap(d,nd);
 if(last){s2.deals.filter(i=>!last.deals.includes(i)).forEach(i=>{const z=nd.deals.find(q=>q.id==i);notify('New strong deal',`${z.name}, ${z.cls}, $${f(z.usd)}, ${z.pct_under}% under fair`)});
  for(const k in s2.w)if(last.w[k]!==undefined&&last.w[k]!==s2.w[k])notify('Watchlist change',`${k.split('|')[0]}: ${s2.w[k]=='gone'?'no longer listed (sold or delisted)':'now '+f(+s2.w[k].split(':')[1])+' WEMIX'}`)}
 last=s2;alst.textContent='Last checked '+new Date().toLocaleTimeString()+', data from '+d.updated.replace('T',' ')})}
alon.onclick=()=>{if(alT){clearInterval(alT);alT=null;alon.textContent='Turn on alerts';alst.textContent='Off';return}
 unlock();askPerm();beep();check();alT=setInterval(check,3e5);alon.textContent='Turn off alerts'};
altest.onclick=()=>{unlock();beep();const b=banner('Test alert','MIR4 Deal Finder alerts are working');setTimeout(()=>{const snd=AC&&AC.state=='running'?'Played a test sound. No sound? Check the ringer switch and volume.':'Sound blocked by the browser. Tap Test sound again.';
 const p=!window.Notification?' Banners need the Home Screen app (iOS 16.4+).':Notification.permission=='granted'?(b?' Test banner sent.':''):Notification.permission=='denied'?' Banners are blocked: Settings, Notifications, MIR4 Deals.':' Tap Turn on alerts to allow banners.';alst.textContent=snd+p},400)};
const t=setInterval(()=>{if(typeof D!='undefined'&&D&&D.listings){clearInterval(t);wl();prices();feed();draw();if(new URLSearchParams(location.search).get('ask')){const c=document.querySelector('#cards details.xd');if(c){c.open=true;const a=c.nextElementSibling;a.open=true;a.querySelector('.aq').click()}}}},200);
})();
