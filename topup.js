(()=>{fetch('data/topup_events.json?t='+Date.now()).then(r=>r.json()).then(d=>{
const el=document.createElement('div');el.id='tuhdr';el.style.cssText='font-size:12px;margin:2px 0;cursor:pointer;color:#f5c518';
const tip=document.createElement('div');tip.style.cssText='display:none;font-size:11px;color:#9aa3b8';tip.textContent='💡 '+(d.tip||'');
const tick=()=>{const now=Date.now();const cur=d.events.find(e=>e.status=='announced'&&e.end&&new Date(e.end)>now&&(!e.start||new Date(e.start)<=now));
 if(cur){let s=Math.floor((new Date(cur.end)-now)/1e3),dd=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);
  el.textContent='🎁 Recharge ends in '+(dd?dd+'d '+h+'h':h+'h '+m+'m');
  el.title=cur.name+' ends '+new Date(cur.end).toLocaleString('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' PT';}
 else{const nx=d.events.find(e=>e.status=='expected'||(e.start&&new Date(e.start)>now));
  el.textContent=nx?'🎁 Next recharge: '+(nx.window||new Date(nx.start).toLocaleDateString('en-US',{timeZone:'America/Los_Angeles'}))+(nx.status=='expected'?' (not announced)':''):'';el.title=nx?nx.name:''}};
tick();setInterval(tick,60000);el.onclick=()=>{tip.style.display=tip.style.display=='none'?'block':'none'};
const place=()=>{const a=document.getElementById('w1hdr')||document.getElementById('meta');if(!a)return setTimeout(place,500);a.after(el);el.after(tip)};place();}).catch(()=>{})})();
