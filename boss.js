/* Boss timers (MS = Magic Square; Frenzy 02/08/14/20 per RaidHours, Leader III 3h cycle per GameWith): next spawn countdowns in PT. Times are regional server time (official MIR4 forum + community intel). */
(function(){
const OFF={ASIA:8,INMENA:6,EU:2,SA:-3,NA:-4};// server region UTC offsets (official forum post 43)
// [name, icon, days (0=Sun..6=Sat, null=daily), hours (server time), note]
const B=[
 ['World boss','skull',{1:[22,'Krukan'],2:[23,'Nerkan'],3:[23,'Helbar'],4:[23,'Turkan'],5:[22,'Utukan']}],
 ['Valley War','swords',{3:[22,'Hidden Valley']}],
 ['Castle Siege','castle',{0:[22,'Bicheon']},null,[Date.UTC(2026,9,25),28]],
 ['Bicheon Heist','castle',{5:[22,'']}],
 ['Living Wraiths','ghost',{4:[22,'chance boss']}],
 ['Labyrinth boss','skull',null,[10,20]],
 ['Hidden Valley boss','skull',null,[12,22]],
 ['Rallying of Void','skull',{4:[23,'world boss']}],
 ['Redmoon Purgatory','skull',null,[0,6,12,18]],
 ['MS Fury Chamber','flame',null,[5,11,17,23]],
 ['MS Frenzy Chamber','flame',null,[2,8,14,20]],
 ['Expedition','swords',null,[21]],
 ['Domination','swords',null,[9,15,21]],
 ['Clan Challenge','castle',{0:[0,'']}],
 ['Server Reset','calendar-clock',null,[16],null,1],
 ['MS boss · Leader III','crown',null,[0,3,6,9,12,15,18,21]]];
// minutes each event stays up (mirkit schedule data: duration, or grace 30 for bosses); Castle Siege default 60
const DUR={'World boss':30,'Valley War':60,'Castle Siege':60,'Bicheon Heist':60,'Living Wraiths':60,'Labyrinth boss':30,'Hidden Valley boss':30,'MS boss · Leader III':30,'Rallying of Void':60,'Redmoon Purgatory':5,'MS Fury Chamber':60,'MS Frenzy Chamber':60,'Expedition':240,'Domination':240,'Clan Challenge':1440};
const BOSS=new Set(['World boss','Labyrinth boss','Hidden Valley boss','MS boss · Leader III','Redmoon Purgatory','Living Wraiths','Rallying of Void']);
const css=document.createElement('style');css.textContent=`#boss{margin:0;padding:0 12px 12px;font-size:12px;color:#d6dae3}#boss .bh{display:flex;justify-content:space-between;align-items:center;color:#e8c872;font-weight:700;margin-bottom:4px}#boss .bh select{background:#202838;color:#e8c872;border:1px solid #333c4d;border-radius:6px;font-size:11px;padding:2px 4px}#boss .br{display:grid;grid-template-columns:18px 1fr auto;gap:6px;align-items:center;padding:3px 0}#boss .ico{background:#e8c872}#boss b.cd{color:#86efac;font-variant-numeric:tabular-nums}#boss .th{margin:6px 0 2px;padding-top:5px;border-top:1px solid #2a3140;color:#9aa3b8;font-size:11px;font-weight:600}#boss .lvh{color:#4ade80;border-top:0;padding-top:0}#boss b.lv{color:#4ade80}#boss b.sp{color:#d4bc2c}#boss .bdg{display:inline-flex;align-items:center;gap:3px;font-size:9px;font-weight:700;padding:1px 6px;border-radius:9px;vertical-align:1px;text-transform:uppercase;letter-spacing:.3px}#boss .bdg:before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor}#boss .bdg.lv{background:#35803f;color:#f0faf1}#boss .bdg.lv:before{animation:bp 2s ease-in-out infinite}#boss .bdg.sp{background:#8f7412;color:#fdf8e3}@keyframes bp{50%{opacity:.3}}#boss .dm{opacity:.6;font-size:11px}#boss .dm b.cd{color:#9aa3b8}#boss small{display:block;color:#9aa3b8;font-size:11px}`;document.head.append(css);
const reg=()=>{const v=localStorage.mir4breg||(localStorage.mir4dreg||'').replace(/^IN$/,'INMENA').replace(/^AS$/,'ASIA');return OFF[v]!=null?v:'NA'};
function next(b,now,o){if(b[5])o=0;// returns [ms, label]
 let best=null;for(let d=0;d<36;d++){const s=new Date(now+o*36e5+d*864e5),Y=s.getUTCFullYear(),M=s.getUTCMonth(),D=s.getUTCDate(),wd=s.getUTCDay();
  const cyc=!b[4]||Math.round((Date.UTC(Y,M,D)-b[4][0])/864e5)%b[4][1]==0;const hs=!cyc?[]:b[2]?(b[2][wd]?[[b[2][wd][0],b[2][wd][1]]]:[]):b[3].map(h=>[h,'']);
  for(const [h,n] of hs){const t=Date.UTC(Y,M,D,h)-o*36e5;if(t>now-6e4&&(!best||t<best[0]))best=[t,n]}if(best)break}return best}
const z={timeZone:'America/Los_Angeles'},dk=t=>new Intl.DateTimeFormat('en-CA',z).format(t),hm=t=>new Intl.DateTimeFormat('en-US',{...z,hour:'numeric',minute:'2-digit'}).format(t),wk=t=>new Intl.DateTimeFormat('en-US',{...z,weekday:'short'}).format(t);
const when=t=>{const n=Date.now(),d=dk(t);return (d==dk(n)?'Today':d==dk(n+864e5)?'Tomorrow':wk(t))+' at '+hm(t)+' PT'};
const cd=ms=>{if(ms<=0)return 'Now';const s=ms/1e3|0;if(s>=86400)return (s/86400|0)+'d '+((s%86400)/3600|0)+'h';const h=s/3600|0,m=(s%3600)/60|0,x=s%60;return (h?h+'h ':'')+String(m).padStart(h?2:1,'0')+'m '+String(x).padStart(2,'0')+'s'};
const el=document.createElement('div');el.id='boss';
function render(){const r=reg(),o=OFF[r],n=Date.now();
 el.innerHTML=`<div class="bh"><span class="mt">Server region</span><select id="bsel" title="Your server region">${Object.keys(OFF).map(k=>`<option${k==r?' selected':''}>${k}</option>`).join('')}</select></div>`+
 (()=>{const row=(b,t,nm,dim)=>`<div class="br${dim?' dm':''}"><i class="ico" style="--i:url(icons/ui/${b[1]}.svg)"></i><div>${b[0]}${nm?' · '+nm:''}<small>${when(t)}</small></div><b class="cd" data-t="${t}">${cd(t-n)}</b></div>`;
 const A=B.map((b,i)=>[b,i,next(b,n,o)]),t0=Math.min(...A.map(r=>r[2][0])),g1=A.filter(r=>r[2][0]==t0);
 const A2=B.map((b,i)=>[b,i,next(b,t0+6e4+1,o)]).filter(r=>r[2]&&r[2][0]>t0),t1=Math.min(...A2.map(r=>r[2][0])),g2=A2.filter(r=>r[2][0]==t1);
 const L=B.filter(b=>DUR[b[0]]).map(b=>{const d=DUR[b[0]]*6e4,x=next(b,n-d,o);return x&&x[0]<=n&&x[0]+d>n?[b,x[0]+d,x[1]]:null}).filter(Boolean).sort((a,b)=>a[1]-b[1]);
 const lr=([b,e,nm])=>{const sp=BOSS.has(b[0]),st=e-DUR[b[0]]*6e4;return `<div class="br"><i class="ico" style="--i:url(icons/ui/${b[1]}.svg)"></i><div>${b[0]}${nm?' · '+nm:''} <span class="bdg ${sp?'sp':'lv'}">${sp?'Spawned':'Live'}</span><small>Ends ${when(e).replace(/^Today at /,'at ')}</small></div>`+(sp?`<b class="cd sp" data-t="${st}" data-u="1">${cd(n-st)} ago</b>`:`<b class="cd lv" data-t="${e}" data-p="ends in ">ends in ${cd(e-n)}</b>`)+'</div>'};
 return (L.length?'<div class="th lvh">● Live now</div>'+L.map(lr).join('')+'<div class="th">Next</div>':'')+g1.map(([b,,[t,nm]])=>row(b,t,nm)).join('')+(g2.length?'<div class="th">Then</div>'+g2.map(([b,,[t,nm]])=>row(b,t,nm,1)).join(''):'')})()+
 '';
 bsel.onchange=()=>{localStorage.mir4breg=bsel.value;render()}}
const tick=()=>{let re=0;el.querySelectorAll('b.cd').forEach(b=>{if(b.dataset.u){b.textContent=cd(Date.now()-b.dataset.t)+' ago';return}const ms=+b.dataset.t-Date.now();if(ms<-6e4)re=1;b.textContent=(b.dataset.p||'')+cd(ms)});if(re)render()};
const t=setInterval(()=>{const a=document.getElementById('padv');if(!a)return;clearInterval(t);
 const d=document.createElement('details');d.className='pro';d.id='ptimer';d.open=localStorage.mir4timer=='1';d.innerHTML='<summary>⏰ Timer</summary>';d.append(el);a.before(d);
 d.ontoggle=()=>{localStorage.mir4timer=d.open?'1':'0';if(d.open)render()};render();setInterval(()=>{if(d.open)tick()},1000)},200);
})();
