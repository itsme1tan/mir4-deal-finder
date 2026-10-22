/* Simple home: Top 20 deals right now. Display only; uses existing fair price, build score and power. */
(function(){
const st=document.createElement('style');st.textContent=`
#t20{padding:8px 10px 20px;max-width:640px;margin:0 auto}
#t20 .hd{display:flex;justify-content:space-between;align-items:center;margin:4px 2px 6px}#t20 .hd b{font-size:18px}
#t20 .ex{color:#9aa3b8;font-size:12px;margin:0 2px 10px}
.tr20{background:#171c26;border:1px solid #2a3140;border-radius:12px;margin:0 0 8px;overflow:hidden}.tr20.u{border-color:#1f7a3a}
.tr20 .rw{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;padding:10px;cursor:pointer}
.tr20 .rk{width:28px;height:28px;line-height:28px;border-radius:50%;background:#2a3140;text-align:center;font-weight:800;font-size:13px}.tr20 .rk.g{background:#f5c518;color:#1a1300}
.tr20 .n{font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr20 .m{color:#9aa3b8;font-size:12px;margin-top:3px;display:flex;gap:8px;flex-wrap:wrap}
.tr20 .p{text-align:right;white-space:nowrap}.tr20 .p b{font-size:16px}.tr20 .p small{display:block;color:#9aa3b8;font-size:11px}
.tr20 .d{font-size:11px;font-weight:600;opacity:.85}.tr20 .dt{display:block;width:100%;border:0;border-top:1px solid #2a3140;border-radius:0;background:#1d2330;color:#93c5fd;padding:8px;font-size:13px}
.tr20 .slot .card{margin:0;border:0;border-radius:0}
#mbtn{background:#202838;border:1px solid #333c4d;border-radius:999px;color:#cbd3e1;padding:7px 12px;font-size:13px}
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
const WA=[['atk',.35],['skill_dmg',.2],['pvp_dmg',.2],['def',.1],['pvp_red',.05],['ps',.1]],WT=[['def',.25],['eva',.2],['pvp_red',.2],['atk',.1],['skill_dmg',.05],['pvp_dmg',.1],['ps',.1]];
function score(L){const A=D.listings;
 const pool=x=>{const c=A.filter(y=>y.cls==x.cls);return c.length>=3?c:A};
 const pr=(x,k)=>{const v=pool(x).map(y=>y[k]).filter(n=>n!=null);if(x[k]==null||!v.length)return 0;return v.filter(n=>n<=x[k]).length/v.length*100};
 L.forEach(x=>{const W=TANK.includes(x.cls)?WT:WA;x.t20p={};W.forEach(([k])=>x.t20p[k]=pr(x,k));x.t20=W.reduce((s,[k,w])=>s+w*x.t20p[k],0)});
 return L.sort((a,b)=>b.t20-a.t20||b.ps-a.ps).slice(0,20)}
const tp=p=>'top '+Math.max(1,Math.round(100-p))+'%';
function keys(x){const t=TANK.includes(x.cls),p=x.t20p;return t?`<span title="DEF ${fm(x.def)}, ${tp(p.def)} in class">${I('shield')} ${fm(x.def/1000)}k</span><span title="EVA ${fm(x.eva)}, ${tp(p.eva)} in class">${I('footprints')} ${fm(x.eva)}</span>`:`<span title="ATK ${fm(x.atk)}, ${tp(p.atk)} in class">${I('swords')} ${fm(x.atk/1000)}k</span><span title="PvP ATK ${x.pvp_dmg}%, ${tp(p.pvp_dmg)} in class">${I('flame')} ${x.pvp_dmg??'–'}%</span>`}
function render(){const L=score(D.listings.filter(x=>x.usd<=25000&&x.build_score!=null));
 box.innerHTML=`<div class="hd"><b>🏆 Top 20 deals</b><button id="mbtn">☰ More</button></div><div class="ex">Ranked by class role: ⚔ attackers by ATK, Skill and PvP ATK; 🛡 Taoist/Warrior by DEF, EVA and PvP reduction, vs their own class. Price shown for info. Under $25k, any class.</div>`+
 L.map((x,i)=>`<div class="tr20${x.discount>0?' u':''}" data-id="${x.id}"><div class="rw"><div class="rk${i<3?' g':''}">${i+1}</div><div style="min-width:0"><div class="n">${ci(x.cls)} ${x.name} <small title="${TANK.includes(x.cls)?'Tank/support':'Attacker'}">${TANK.includes(x.cls)?'🛡':'⚔'}</small></div><div class="m">${keys(x)}<span>⚡ ${fm(x.ps/1000)}k</span><span>${I('gauge')} ${x.build_score}</span>${x.full_conf=='low'?'<span title="few similar sales">⚠</span>':''}</div></div><div class="p"><b>$${fm(x.usd)}</b><small>${fm(x.wemix)} W</small><span class="d ${x.discount>0?'pos':'neg'}">${x.discount==null?'':x.discount>0?'▼ '+x.discount+'% under':'▲ '+(-x.discount)+'% over'}</span></div></div><button class="dt">▸ Details</button><div class="slot"></div></div>`).join('');
 mbtn.onclick=()=>{document.body.classList.remove('simple');scrollTo(0,0)};
 box.querySelectorAll('.tr20').forEach(r=>{const tg=()=>{const s=r.querySelector('.slot'),b=r.querySelector('.dt');
  if(s.innerHTML){s.innerHTML='';b.textContent='▸ Details';return}
  draw();const c=cards.querySelector(`.card[data-id="${r.dataset.id}"]`);if(!c){s.innerHTML='<div class="cl" style="padding:10px">Details not available.</div>';return}
  s.appendChild(c);c.querySelector('.ch').click();b.textContent='▾ Hide'};
  r.querySelector('.rw').onclick=tg;r.querySelector('.dt').onclick=tg})}
const w=setInterval(()=>{if(typeof D!='undefined'&&D&&D.listings){clearInterval(w);render()}},100);
})();
