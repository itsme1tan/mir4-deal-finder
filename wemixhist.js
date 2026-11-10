/* Tap the header WEMIX price to open a live price history chart.
   CoinGecko market_chart in the browser; falls back to our recorded files. Display only.
   Press and hold then swipe to scrub like Apple Stocks (pointer + touch). */
(function(){
const ID='wxhist', CG='https://api.coingecko.com/api/v3/coins/wemix-token/market_chart?vs_currency=usd&days=';
const RANGES=[['1','24h'],['7','7d'],['30','30d'],['max','All']];
const TZ='America/Los_Angeles';
let range='1', cache={}, open=0, scrubPts=null, scrubBase=null;
const st=document.createElement('style');
st.textContent=`#wxp,#w1hdr{cursor:pointer;-webkit-tap-highlight-color:transparent}#wxp:active,#w1hdr:active{opacity:.85}
#${ID}{display:none;position:fixed;inset:0;z-index:1100;background:#120a14;color:#f2e8f2;overflow:auto;box-sizing:border-box;-webkit-overflow-scrolling:touch}
#${ID}.on{display:block}
#${ID} .top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1c1020;border-bottom:1px solid #3a2040}
#${ID} .top button{background:#3a2040;color:#fff;border:0;border-radius:9px;padding:8px 12px;font-weight:700;font:inherit}
#${ID} .top b{font-size:16px;color:#e8c872;min-width:0}
#${ID} .body{padding:14px 14px 40px;max-width:640px;margin:0 auto;box-sizing:border-box;width:100%}
#${ID} .price{font-size:28px;font-weight:800;color:#ffe08a;letter-spacing:.01em}
#${ID} .chg{font-size:15px;font-weight:700;margin-left:8px}
#${ID} .chg.up{color:#e8c872}#${ID} .chg.dn{color:#f472b6}
#${ID} .sub{color:#b9a3bd;font-size:12px;margin-top:4px}
#${ID} .tabs{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 10px}
#${ID} .tabs button{font:inherit;font-size:13px;font-weight:600;padding:7px 12px;border-radius:999px;border:1px solid #5a3a5e;background:#1c1020;color:#b9a3bd}
#${ID} .tabs button.on{background:#e8c872;color:#2a1030;border-color:#e8c872}
#${ID} .chart{position:relative;background:#1a0f1e;border:1px solid #3a2040;border-radius:12px;padding:10px 8px 6px;overflow:hidden;touch-action:pan-y;user-select:none;-webkit-user-select:none}
#${ID} .chart svg{width:100%;height:auto;display:block;pointer-events:none}
#${ID} .scrub{display:none;position:absolute;left:0;top:10px;bottom:28px;width:100%;pointer-events:none;z-index:3}
#${ID} .scrub.on{display:block}
#${ID} .scrub .vline{position:absolute;top:0;bottom:0;width:1px;background:rgba(232,200,114,.9);transform:translateX(-0.5px)}
#${ID} .scrub .dot{position:absolute;width:10px;height:10px;border-radius:50%;background:#ffe08a;border:2px solid #f472b6;box-shadow:0 0 8px rgba(244,114,182,.55);transform:translate(-50%,-50%)}
#${ID} .scrub .tip{position:absolute;transform:translate(-50%,-100%);margin-top:-10px;background:rgba(28,16,32,.94);border:1px solid rgba(232,200,114,.55);border-radius:8px;padding:5px 8px;white-space:nowrap;text-align:center;pointer-events:none;max-width:92vw;box-sizing:border-box}
#${ID} .scrub .tip .d{display:block;font-size:11px;color:#b9a3bd;line-height:1.2}
#${ID} .scrub .tip .p{display:block;font-size:13px;font-weight:800;color:#ffe08a;margin-top:2px}
#${ID} .err,#${ID} .load{color:#b9a3bd;font-size:13px;padding:18px 4px;text-align:center}
#${ID} .foot{font-size:11px;color:#b9a3bd;margin-top:10px;line-height:1.45}`;
st.textContent+=`.spico{flex:none;width:30px;height:30px;object-fit:contain;background:transparent;border:0;border-radius:0;box-shadow:none;vertical-align:-8px;margin-right:6px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55)) drop-shadow(0 0 4px rgba(244,114,182,.28))}.spico.lg{width:42px;height:42px;vertical-align:-11px}`;document.head.appendChild(st);

const fmt$=n=>'$'+Number(n).toFixed(4);
function fmtPT(ms, days){
  const d=new Date(ms);
  const opt=days==='1'||days==='7'
    ? {timeZone:TZ, month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}
    : {timeZone:TZ, month:'short', day:'numeric', year:'numeric'};
  return new Intl.DateTimeFormat('en-US', opt).format(d)+' PT';
}

function panel(){let el=document.getElementById(ID);if(el)return el;
 el=document.createElement('div');el.id=ID;
 el.innerHTML=`<div class="top"><button type="button" data-x>← Back</button><b><img class="spico lg" src="icons/spirit-head-hydra.png?v=5" alt="" width="42" height="42" decoding="async" loading="lazy"> WEMIX price</b></div>
 <div class="body"><div class="load">Loading…</div></div>`;
 document.body.appendChild(el);
 el.addEventListener('click',e=>{if(e.target.closest('[data-x]'))close()});
 return el}

function close(){const el=document.getElementById(ID);if(!el)return;el.classList.remove('on');open=0;endScrub();
 if(history.state&&history.state.wxhist)history.back();else try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}

function show(){const el=panel();el.classList.add('on');open=1;
 try{if(!(history.state&&history.state.wxhist))history.pushState({wxhist:1},'')}catch(e){}
 render()}

async function prices(days){
 if(cache[days])return cache[days];
 try{
  const r=await fetch(CG+days,{cache:'no-store'});
  if(r.ok){const j=await r.json();if(j.prices&&j.prices.length>1){cache[days]={src:'CoinGecko',pts:j.prices.map(([t,p])=>[t,p])};return cache[days]}}
 }catch(e){}
 try{
  if(days==='1'||days==='7'){
   const h=await fetch('data/wemix_price.json?'+Date.now()).then(r=>r.ok?r.json():null);
   if(h&&h.points&&h.points.length>2){
    const cut=Date.now()/1000-(days==='1'?86400:7*86400);
    const pts=h.points.filter(p=>p[0]>=cut).map(p=>[p[0]*1000,p[1]]);
    if(pts.length>1){cache[days]={src:'Our hourly record (CoinGecko)',pts};return cache[days]}
   }
  }
  const d=await fetch('data/wemix_daily.json?'+Date.now()).then(r=>r.ok?r.json():null);
  if(d){let pairs=Object.keys(d).sort().map(k=>[Date.parse(k+'T12:00:00Z'),d[k]]).filter(p=>p[1]>0);
   if(days==='30')pairs=pairs.slice(-30);
   else if(days==='7')pairs=pairs.slice(-7);
   if(pairs.length>1){cache[days]={src:'Our daily record (CoinGecko)',pts:pairs};return cache[days]}
  }
 }catch(e){}
 return null}

function chart(pts,up){
 const W=340,H=160,pad=10;
 const ys=pts.map(p=>p[1]), xs=pts.map(p=>p[0]);
 const lo=Math.min(...ys), hi=Math.max(...ys), x0=xs[0], x1=xs[xs.length-1]||x0+1;
 const X=t=>pad+(x1>x0?(t-x0)/(x1-x0):.5)*(W-2*pad);
 const Y=v=>hi===lo?H/2:pad+(hi-v)/(hi-lo||1)*(H-2*pad);
 const d=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
 const fill=d+` L${X(pts[pts.length-1][0]).toFixed(1)} ${H-pad} L${X(pts[0][0]).toFixed(1)} ${H-pad} Z`;
 const stroke=up?'#e8c872':'#f472b6', fillC=up?'rgba(232,200,114,.16)':'rgba(244,114,182,.14)';
 const a=pts[0][1], b=pts[pts.length-1][1];
 return `<div class="scrub" aria-hidden="true"><div class="vline"></div><div class="dot"></div><div class="tip"><span class="d"></span><span class="p"></span></div></div>
 <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" data-w="${W}" data-h="${H}" data-pad="${pad}" data-lo="${lo}" data-hi="${hi}" data-x0="${x0}" data-x1="${x1}">
  <path d="${fill}" fill="${fillC}"/>
  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="${pad}" y="12" fill="#b9a3bd" font-size="10">${fmt$(hi)}</text>
  <text x="${pad}" y="${H-2}" fill="#b9a3bd" font-size="10">${fmt$(lo)}</text>
 </svg>
 <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#b9a3bd;margin-top:4px;padding:0 4px">
  <span>Start<br><b style="color:#f2e8f2">${fmt$(a)}</b></span>
  <span style="text-align:right">Now<br><b style="color:#ffe08a">${fmt$(b)}</b></span>
 </div>`}

function setHead(price, first){
 const el=panel(), p=el.querySelector('.price');
 if(!p)return;
 const chg=((price-first)/first)*100, up=chg>=0;
 p.innerHTML=`${fmt$(price)}<span class="chg ${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs(chg).toFixed(2)}%</span>`;
}

function endScrub(){
 const el=document.getElementById(ID);
 if(el){const s=el.querySelector('.scrub'); if(s) s.classList.remove('on')}
 if(scrubBase){setHead(scrubBase.live, scrubBase.first); scrubBase=null}
 scrubPts=null;
}

function nearest(pts, t){
 let best=0, bd=Infinity;
 for(let i=0;i<pts.length;i++){const d=Math.abs(pts[i][0]-t); if(d<bd){bd=d;best=i}}
 return best;
}

function scrubAt(chartEl, clientX){
 if(!scrubPts||!scrubPts.length||!scrubBase)return;
 const svg=chartEl.querySelector('svg'); if(!svg)return;
 const rect=svg.getBoundingClientRect();
 const W=+svg.dataset.w, H=+svg.dataset.h, pad=+svg.dataset.pad;
 const lo=+svg.dataset.lo, hi=+svg.dataset.hi, x0=+svg.dataset.x0, x1=+svg.dataset.x1;
 const xPct=Math.max(0, Math.min(1, (clientX-rect.left)/Math.max(1,rect.width)));
 const svgX=pad+xPct*(W-2*pad);
 const t=x1>x0 ? x0+((svgX-pad)/(W-2*pad))*(x1-x0) : x0;
 const i=nearest(scrubPts, t);
 const [ts, price]=scrubPts[i];
 const X=pad+(x1>x0?(ts-x0)/(x1-x0):.5)*(W-2*pad);
 const Y=hi===lo?H/2:pad+(hi-price)/(hi-lo||1)*(H-2*pad);
 const leftPct=(X/W)*100, topPct=(Y/H)*100;
 const scrub=chartEl.querySelector('.scrub');
 scrub.classList.add('on');
 scrub.querySelector('.vline').style.left=leftPct+'%';
 const dot=scrub.querySelector('.dot');
 dot.style.left=leftPct+'%';
 dot.style.top=topPct+'%';
 const tip=scrub.querySelector('.tip');
 tip.style.left=leftPct+'%';
 tip.style.top=Math.max(12, topPct)+'%';
 tip.querySelector('.d').textContent=fmtPT(ts, range);
 tip.querySelector('.p').textContent=fmt$(price);
 // keep tip on screen
 const tipR=tip.getBoundingClientRect(), box=scrub.getBoundingClientRect();
 if(tipR.left<box.left+4) tip.style.transform='translate(0,-100%)';
 else if(tipR.right>box.right-4) tip.style.transform='translate(-100%,-100%)';
 else tip.style.transform='translate(-50%,-100%)';
 setHead(price, scrubBase.first);
}

function bindScrub(chartEl, pts, first, live){
 scrubPts=pts;
 let active=0, pid=null;
 const start=e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  active=1; pid=e.pointerId;
  scrubBase={first, live};
  try{chartEl.setPointerCapture(pid)}catch(err){}
  scrubAt(chartEl, e.clientX);
  e.preventDefault();
 };
 const move=e=>{
  if(!active||(pid!=null&&e.pointerId!==pid))return;
  scrubAt(chartEl, e.clientX);
  e.preventDefault();
 };
 const end=e=>{
  if(!active||(pid!=null&&e.pointerId!==pid))return;
  active=0; pid=null;
  try{chartEl.releasePointerCapture(e.pointerId)}catch(err){}
  endScrub();
 };
 chartEl.addEventListener('pointerdown', start);
 chartEl.addEventListener('pointermove', move);
 chartEl.addEventListener('pointerup', end);
 chartEl.addEventListener('pointercancel', end);
 chartEl.addEventListener('lostpointercapture', ()=>{if(active){active=0;pid=null;endScrub()}});
}

async function render(){
 const el=panel(), body=el.querySelector('.body');
 endScrub();
 body.innerHTML='<div class="load">Loading…</div>';
 const data=await prices(range);
 if(!data){body.innerHTML='<div class="err">Could not load WEMIX history right now. Try again in a minute.</div>';return}
 const pts=data.pts, first=pts[0][1], last=pts[pts.length-1][1];
 const live=(window.WEMIX_LIVE>0?window.WEMIX_LIVE:last);
 const chg=((live-first)/first)*100, up=chg>=0;
 const tabs=RANGES.map(([v,l])=>`<button type="button" data-r="${v}" class="${v===range?'on':''}">${l}</button>`).join('');
 body.innerHTML=`<div class="price">${fmt$(live)}<span class="chg ${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs(chg).toFixed(2)}%</span></div>
  <div class="sub">${RANGES.find(r=>r[0]===range)[1]} change vs start of range · hold chart to scrub</div>
  <div class="tabs">${tabs}</div>
  <div class="chart">${chart(pts,up)}</div>
  <div class="foot">Source: ${data.src}. Live price updates in the header every minute. Listing dollar amounts still use our last data refresh so every figure on a character matches. Press and hold the chart, then swipe to see the price at that time.</div>`;
 body.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{range=b.dataset.r;render()});
 const ch=body.querySelector('.chart');
 if(ch) bindScrub(ch, pts, first, live);
}

document.addEventListener('click',e=>{
 const t=e.target.closest('#wxp, #w1hdr');
 if(!t)return;
 e.preventDefault();e.stopPropagation();show();
},true);
addEventListener('popstate',()=>{if(open){const el=document.getElementById(ID);if(el)el.classList.remove('on');open=0;endScrub()}});
})();
