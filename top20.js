/* Simple home: Top 10 strongest right now. Display only; uses existing fair price, build score and power. */
(function(){
const st=document.createElement('style');st.textContent=`
#t20{padding:8px 10px 20px;max-width:640px;margin:0 auto}
#t20 .hd{display:flex;justify-content:space-between;align-items:center;margin:4px 2px 6px}#t20 .hd b{font-size:18px}
#t20 .ft{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 2px 10px}#t20 .ft span{display:flex;align-items:center;gap:6px;background:#1a0f1e;border:1px solid #3a2040;border-radius:8px;padding:5px 8px;font-size:12px;color:#e8dcea}#t20 .ft .hot{grid-column:1/-1;border-color:#9f916c;color:#e8c872;font-weight:700}#t20 .ft .ico{background:#e8c872;flex:none}#t20 .nl{margin:0 2px 10px}#t20 .nlh{font-size:12px;color:#e8c872;font-weight:700;margin:0 0 5px}#t20 .nlh .ico{background:#e8c872}#t20 .nlg{display:grid;grid-template-columns:1fr 1fr;gap:6px}#t20 .nb{display:flex;gap:7px;align-items:center;background:#1a0f1e;border:1px solid #9f916c;border-radius:8px;padding:6px 8px}#t20 .nb img{width:30px;height:30px;flex:none}#t20 .nb a.fn{display:block;color:#e8c872;font-weight:700;font-size:13px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:underline dotted rgba(232,200,114,.5);text-underline-offset:3px}#t20 .nb small{display:block;color:#b9a3bd;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#t20 .nb .nt{color:#ffe08a}#t20 .ex{color:#b9a3bd;font-size:12px;margin:0 2px 10px}
#solo{position:fixed;inset:0;z-index:999;background:#0f131b;overflow:auto;display:none}#solo.on{display:block}#solo .sb{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;padding:10px;background:#141925;border-bottom:1px solid #3a2040}#solo .sb button{background:#3a2040;color:#fff;border:0;border-radius:9px;padding:7px 12px;font-weight:700}#solo .sh{display:flex;gap:12px;align-items:center;padding:12px}#solo .sh img{width:64px;height:64px}#solo .sh b{font-size:18px}#solo .sh div small{display:block;color:#b9a3bd;text-transform:capitalize}#solo .bd{padding:0 10px 30px}.tr20 .n{cursor:pointer}
.ck{width:46px;text-align:center}.ck img{width:44px;height:44px;display:block;margin:0 auto}.ck small{display:block;font-size:9.5px;color:#b9a3bd;margin-top:-2px;text-transform:capitalize}
.tr20{background:#1c1020;border:1px solid #3a2040;border-radius:12px;margin:0 0 8px;overflow:hidden}.tr20.u{border-color:#8a6410}
.tr20 .rw{display:grid;grid-template-columns:46px 1fr auto;gap:8px;align-items:center;padding:10px;cursor:pointer}
.tr20 .rk{width:28px;height:28px;line-height:28px;border-radius:50%;background:#3a2040;text-align:center;font-weight:800;font-size:13px}.tr20 .rk.g{background:#f5c518;color:#1a1300}
.tr20 .n{font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr20 .m{color:#b9a3bd;font-size:12px;margin-top:3px;display:flex;gap:8px;flex-wrap:wrap}
.tr20 .p{text-align:right;white-space:nowrap}.tr20 .p b{font-size:16px}.tr20 .p small{display:block;color:#b9a3bd;font-size:11px}
.tr20 .d{font-size:11px;font-weight:600;opacity:.85}.tr20 .dt{display:block;width:100%;border:0;border-top:1px solid #3a2040;border-radius:0;background:#221327;color:#f48fb1;padding:8px;font-size:13px}
.tr20 .slot .card{margin:0;border:0;border-radius:0}
#mbtn{background:#26142b;border:1px solid #45284c;border-radius:999px;color:#e3d3e6;padding:7px 12px;font-size:13px}
body.simple .ctl,body.simple .wrap,body.simple #cards,body.simple #xnav,body.simple #xv,body.simple .note,body.simple #msum,body.simple #ninfo,body.simple #ninfo+span,body.simple #cmp{display:none!important}
body:not(.simple) #t20{display:none}
#back20{display:none;margin:8px 12px 0;background:#f5c518;color:#1a1300;border-radius:999px;padding:9px 14px;font-weight:700}body:not(.simple) #back20{display:inline-block}`;
document.head.appendChild(st);
const P=new URLSearchParams(location.search);
const full=P.get('q')||P.get('sort')||P.get('region')||P.get('view')||location.hash.startsWith('#open1');
document.body.classList.toggle('simple',!full);
const hdr=document.querySelector('header'),box=document.createElement('div');box.id='t20';hdr.after(box);
const back=document.createElement('button');back.id='back20';back.textContent='🏆 Top 20';hdr.after(back);
back.onclick=()=>{document.body.classList.add('simple');scrollTo(0,0)};
const fm=n=>n==null?'–':Number(n).toLocaleString(undefined,{maximumFractionDigits:0});
const TANK=['Taoist','Warrior','Lionheart'];
function score(L){return T20S.score(D.listings,L).slice(0,10)}
const tp=p=>'top '+Math.max(1,Math.round(100-p))+'%';
function cb(c){const k=(c||'').toLowerCase();return `<div class="ck"><img src="icons/class/${k}.webp" alt="${c}" loading="lazy"><small>${k}</small></div>`}
function keys(x){const t=TANK.includes(x.cls),p=x.t20p;return t?`<span title="DEF ${fm(x.def)}, ${tp(p.def)} in class">${I('shield')} ${fm(x.def/1000)}k</span><span title="EVA ${fm(x.eva)}, ${tp(p.eva)} in class">${I('footprints')} ${fm(x.eva)}</span>`:`<span title="ATK ${fm(x.atk)}, ${tp(p.atk)} in class">${I('swords')} ${fm(x.atk/1000)}k</span><span title="PvP ATK ${x.pvp_dmg}%, ${tp(p.pvp_dmg)} in class">${I('flame')} ${x.pvp_dmg??'–'}%</span>`}
const s8=t=>Date.parse(t.replace(' ','T')+':00+08:00');
const when=ms=>{const z={timeZone:'America/Los_Angeles'},d=x=>new Intl.DateTimeFormat('en-CA',z).format(x),n=Date.now();return (d(ms)==d(n)?'Today':d(ms)==d(n-864e5)?'Yesterday':new Intl.DateTimeFormat('en-US',Object.assign({month:'short',day:'numeric'},z)).format(ms))+' at '+new Intl.DateTimeFormat('en-US',Object.assign({hour:'numeric',minute:'2-digit'},z)).format(ms)+' PT'};
function latest2(){const L=D.listings.filter(x=>x.listed&&x.ps>=650000).sort((a,b)=>s8(b.listed)-s8(a.listed)).slice(0,2);if(!L.length)return '';
 return `<div class="nl"><div class="nlh">${I('sparkles')} Newly listed 650k+</div><div class="nlg">${L.map(x=>`<div class="nb"><img src="icons/class/${x.cls.toLowerCase()}.webp" alt="${x.cls}" title="${x.cls}"><div style="min-width:0"><a class="fn" data-l="${x.id}">${x.name}</a><small>⚡ ${fm(x.ps/1000)}k · $${fm(x.usd)}</small><small class="nt">${when(s8(x.listed))}</small></div></div>`).join('')}</div></div>`}
function render(){const L=score(T20S.pick(D.listings));
 box.innerHTML=`<div class="hd"><b>🏆 Top 10 strongest</b><span style="display:flex;gap:8px;align-items:center"><a href="classes.html" id="bycls" style="color:#e8c872;font-weight:700;font-size:13px;text-decoration:none">Top by class →</a><button id="mbtn">☰ More</button></span></div>${latest2()}`+
 L.map((x,i)=>`<div class="tr20${x.discount>0?' u':''}" data-id="${x.id}"><div class="rw">${cb(x.cls)}<div style="min-width:0"><div class="n">${x.name}</div><div class="m">${keys(x)}<span>⚡ ${fm(x.ps/1000)}k</span><span>${I('gauge')} ${x.build_score}</span>${x.full_conf=='low'?'<span title="few similar sales">⚠</span>':''}</div></div><div class="p"><b>$${fm(x.usd)}</b><small>${fm(x.wemix)} W</small><small class="w1h" data-w="${x.wemix}"></small><span class="d ${x.discount>0?'pos':'neg'}">${x.discount==null?'':x.discount>0?'▼ '+x.discount+'% under':'▲ '+(-x.discount)+'% over'}</span></div></div></div>`).join('');
 mbtn.onclick=()=>{document.body.classList.remove('simple');scrollTo(0,0)};
 box.querySelectorAll('.nb a.fn').forEach(a=>a.onclick=e=>{e.stopPropagation();solo(a.dataset.l,D.listings)});
 box.querySelectorAll('.tr20').forEach(r=>{r.querySelector('.rw').onclick=()=>solo(r.dataset.id,L)});
 const cid=P.get('char');if(cid&&!window._c20){window._c20=1;const u=new URL(location);u.searchParams.delete('char');history.replaceState(null,'',u.pathname+u.search+u.hash);if(D.listings.some(y=>y.id==cid))solo(cid,D.listings)}}
let SV=null;function solo(id,L){const x=L.find(y=>y.id==id);let o=document.getElementById('solo');if(!o){o=document.createElement('div');o.id='solo';document.body.appendChild(o)}
 draw();let c=cards.querySelector(`.card[data-id="${id}"]`),tmp=0;
 if(!c&&D.listings.some(y=>y.id==id)){const _r=rows;rows=()=>D.listings.filter(y=>y.id==id);try{drawCards()}finally{rows=_r}c=cards.querySelector(`.card[data-id="${id}"]`);tmp=1}
 o.innerHTML=`<div class="sb"><button id="sback">← Back</button><b>${x.name}</b></div><div class="sh"><img src="icons/class/${x.cls.toLowerCase()}.webp" alt="${x.cls}"><div><b>$${fm(x.usd)}</b><small>${x.cls} · ${fm(x.wemix)} W · ⚡ ${fm(x.ps/1000)}k</small></div></div><div class="bd"></div>`;
 if(c){SV=[c,c.parentNode,c.nextSibling];o.querySelector('.bd').appendChild(c);const h=c.querySelector('.ch');if(h&&!c.classList.contains('open'))h.click()}else o.querySelector('.bd').innerHTML='<div class="cl">Details not available.</div>';
 SV&&(SV.y=scrollY);hist20(x,o.querySelector('.bd'));o.classList.add('on');box.style.display='none';o.scrollTop=0;
 sback.onclick=()=>{o.classList.remove('on');box.style.display='';if(SV){SV[1].insertBefore(SV[0],SV[2]);scrollTo(0,SV.y||0);SV=null}if(tmp)draw()}}
let CH=null;const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pt=t=>{const m=t.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);const ms=Date.UTC(+m[1],m[2]-1,+m[3],+m[4]+7,+m[5]);const f=o=>new Intl.DateTimeFormat(o[0],Object.assign({timeZone:'America/Los_Angeles'},o[1])).format;const d=x=>f(['en-CA',{}])(x),n=Date.now();
 return (d(ms)==d(n)?'Today':d(ms)==d(n-864e5)?'Yesterday':f(['en-US',{month:'short',day:'numeric'}])(ms))+' at '+f(['en-US',{hour:'numeric',minute:'2-digit'}])(ms)};
const ptOld=t=>{const m=t.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);let h=+m[4];const ap=h<12?'AM':'PM';h=h%12||12;return `${MO[m[2]-1]} ${+m[3]} ${h}:${m[5]} ${ap}`};
function hist20(x,bd){const go=c=>{const r=c&&c[`${x.name}|${x.server||''}|${x.cls}`];if(!r)return;const L={listed:'Listed',relisted:'Relisted',price:'Price change',delisted:'Delisted',sold:'Sold'};
 const ln=r.events.slice().reverse().map(e=>{const p=e.from&&e.wemix&&e.from!=e.wemix?` <span class="${e.wemix<e.from?'dn':'up'}">(${e.wemix>e.from?'+':''}${((e.wemix/e.from-1)*100).toFixed(1)}%)</span>`:'';
  const v=e.wemix?(e.from&&e.from!=e.wemix?`${fm(e.from)} → ${fm(e.wemix)} W`:`${fm(e.wemix)} W`)+(e.usd?` <small>$${fm(e.usd)}</small>`:'')+p:'';
  return `<div class="hl"><span class="ht">${pt(e.t)}</span><b>${L[e.type]||e.type}</b><span>${v}</span></div>`}).join('');
 const d=document.createElement('div');d.className='h20';d.innerHTML=`<div class="hh">🕘 History <small>First seen ${pt(r.first_seen).replace(/ at .*/,'')}</small></div>${ln}`;bd.prepend(d)};
 if(CH)go(CH);else fetch('data/char_history.json?'+Date.now()).then(r=>r.ok?r.json():{}).then(j=>{CH=j.chars||{};go(CH)}).catch(()=>{})}
const hs=document.createElement('style');hs.textContent=`.h20{margin:4px 0 12px;padding:10px 12px;background:#1a0f1e;border:1px solid #3a2040;border-radius:10px;font-size:13px}.h20 .hh{font-weight:700;margin-bottom:6px}.h20 .hh small{color:#b9a3bd;font-weight:400;margin-left:6px}.h20 .hl{display:grid;grid-template-columns:132px 74px 1fr;gap:6px;padding:4px 0;border-top:1px solid #2a1730}.h20 .ht{color:#b9a3bd}.h20 small{color:#b9a3bd}.h20 .dn{color:#ffc94d}.h20 .up{color:#f87171}`;document.head.appendChild(hs);
window.solo20=id=>solo(id,D.listings);
const w=setInterval(()=>{if(typeof D!='undefined'&&D&&D.listings){clearInterval(w);render()}},100);
})();
