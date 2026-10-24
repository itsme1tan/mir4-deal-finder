/* Boss timers (MS = Magic Square; Frenzy 02/08/14/20 per RaidHours, Leader III 3h cycle per GameWith): next spawn countdowns in PT. Times are regional server time (official MIR4 forum + community intel). */
(function(){
const OFF={ASIA:8,INMENA:6,EU:2,SA:-3,NA:-4};// server region UTC offsets (official forum post 43)
// [name, icon, days (0=Sun..6=Sat, null=daily), hours (server time), note]
const B=[
 ['World boss','skull',{1:[22,'Krukan'],2:[23,'Nerkan'],4:[23,'Turkan'],5:[22,'Utukan']}],
 ['Valley War','swords',{3:[22,'Hidden Valley']}],
 ['Castle Siege','castle',{0:[22,'Bicheon']},null,[Date.UTC(2026,9,25),28]],
 ['Bicheon Heist','castle',{5:[22,'1 hour']}],
 ['Living Wraiths','ghost',{4:[22,'chance boss']}],
 ['Labyrinth boss','skull',null,[10,20]],
 ['Hidden Valley boss','skull',null,[12,22]],
 ['MS Frenzy Chamber','flame',null,[2,8,14,20]],
 ['MS boss · Leader III','crown',null,[0,3,6,9,12,15,18,21]]];
const css=document.createElement('style');css.textContent=`#boss{margin:0 12px 10px;background:#161c28;border:1px solid #9f916c;border-radius:10px;padding:8px 10px;font-size:12px;color:#d6dae3}#boss .bh{display:flex;justify-content:space-between;align-items:center;color:#e8c872;font-weight:700;margin-bottom:4px}#boss .bh select{background:#202838;color:#e8c872;border:1px solid #333c4d;border-radius:6px;font-size:11px;padding:2px 4px}#boss .br{display:grid;grid-template-columns:18px 1fr auto;gap:6px;align-items:center;padding:3px 0}#boss .ico{background:#e8c872}#boss b.cd{color:#86efac;font-variant-numeric:tabular-nums}#boss small{display:block;color:#9aa3b8;font-size:11px}`;document.head.append(css);
const reg=()=>{const v=localStorage.mir4breg||(localStorage.mir4dreg||'').replace(/^IN$/,'INMENA').replace(/^AS$/,'ASIA');return OFF[v]!=null?v:'NA'};
function next(b,now,o){// returns [ms, label]
 let best=null;for(let d=0;d<36;d++){const s=new Date(now+o*36e5+d*864e5),Y=s.getUTCFullYear(),M=s.getUTCMonth(),D=s.getUTCDate(),wd=s.getUTCDay();
  const cyc=!b[4]||Math.round((Date.UTC(Y,M,D)-b[4][0])/864e5)%b[4][1]==0;const hs=!cyc?[]:b[2]?(b[2][wd]?[[b[2][wd][0],b[2][wd][1]]]:[]):b[3].map(h=>[h,'']);
  for(const [h,n] of hs){const t=Date.UTC(Y,M,D,h)-o*36e5;if(t>now-6e4&&(!best||t<best[0]))best=[t,n]}if(best)break}return best}
const z={timeZone:'America/Los_Angeles'},dk=t=>new Intl.DateTimeFormat('en-CA',z).format(t),hm=t=>new Intl.DateTimeFormat('en-US',{...z,hour:'numeric',minute:'2-digit'}).format(t),wk=t=>new Intl.DateTimeFormat('en-US',{...z,weekday:'short'}).format(t);
const when=t=>{const n=Date.now(),d=dk(t);return (d==dk(n)?'Today':d==dk(n+864e5)?'Tomorrow':wk(t))+' at '+hm(t)+' PT'};
const cd=ms=>{if(ms<=0)return 'Now';const s=ms/1e3|0;if(s>=86400)return (s/86400|0)+'d '+((s%86400)/3600|0)+'h';const h=s/3600|0,m=(s%3600)/60|0,x=s%60;return (h?h+'h ':'')+String(m).padStart(h?2:1,'0')+'m '+String(x).padStart(2,'0')+'s'};
const el=document.createElement('div');el.id='boss';
function render(){const r=reg(),o=OFF[r],n=Date.now();
 el.innerHTML=`<div class="bh"><span><i class="ico" style="--i:url(icons/ui/calendar-clock.svg)"></i> Timer</span><select id="bsel" title="Your server region">${Object.keys(OFF).map(k=>`<option${k==r?' selected':''}>${k}</option>`).join('')}</select></div>`+
 B.map((b,i)=>[b,i,next(b,n,o)]).sort((a,c)=>(a[2][0]-c[2][0])||(a[1]-c[1])).filter((r,_,A)=>r[2][0]==A[0][2][0]).map(([b,,[t,nm]])=>{return `<div class="br"><i class="ico" style="--i:url(icons/ui/${b[1]}.svg)"></i><div>${b[0]}${nm?' · '+nm:''}<small>${when(t)}</small></div><b class="cd" data-t="${t}">${cd(t-n)}</b></div>`}).join('')+
 `<small style="margin-top:3px">Server time ${r} (UTC${o>=0?'+':''}${o}). Magic Square, Labyrinth and Valley boss times may have changed, check in game.</small>`;
 bsel.onchange=()=>{localStorage.mir4breg=bsel.value;render()}}
const tick=()=>{let re=0;el.querySelectorAll('b.cd').forEach(b=>{const ms=+b.dataset.t-Date.now();if(ms<-6e4)re=1;b.textContent=cd(ms)});if(re)render()};
const t=setInterval(()=>{const a=document.getElementById('t20');if(!a)return;clearInterval(t);a.before(el);render();setInterval(tick,1000)},200);
})();
