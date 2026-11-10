/* Tap the header WEMIX price to open a live price history chart.
   CoinGecko market_chart in the browser; falls back to our recorded files. Display only. */
(function(){
const ID='wxhist', CG='https://api.coingecko.com/api/v3/coins/wemix-token/market_chart?vs_currency=usd&days=';
const RANGES=[['1','24h'],['7','7d'],['30','30d'],['max','All']];
let range='1', cache={}, open=0;
const st=document.createElement('style');
st.textContent=`#wxp,#w1hdr{cursor:pointer;-webkit-tap-highlight-color:transparent}#wxp:active,#w1hdr:active{opacity:.85}
#wxp .wxl{text-decoration:underline dotted rgba(232,200,114,.55);text-underline-offset:2px}
#${ID}{display:none;position:fixed;inset:0;z-index:1100;background:#120a14;color:#f2e8f2;overflow:auto;box-sizing:border-box}
#${ID}.on{display:block}
#${ID} .top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1c1020;border-bottom:1px solid #3a2040}
#${ID} .top button{background:#3a2040;color:#fff;border:0;border-radius:9px;padding:8px 12px;font-weight:700;font:inherit}
#${ID} .top b{font-size:16px;color:#e8c872;min-width:0}
#${ID} .body{padding:14px 14px 40px;max-width:640px;margin:0 auto;box-sizing:border-box}
#${ID} .price{font-size:28px;font-weight:800;color:#ffe08a;letter-spacing:.01em}
#${ID} .chg{font-size:15px;font-weight:700;margin-left:8px}
#${ID} .chg.up{color:#e8c872}#${ID} .chg.dn{color:#f472b6}
#${ID} .sub{color:#b9a3bd;font-size:12px;margin-top:4px}
#${ID} .tabs{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 10px}
#${ID} .tabs button{font:inherit;font-size:13px;font-weight:600;padding:7px 12px;border-radius:999px;border:1px solid #5a3a5e;background:#1c1020;color:#b9a3bd}
#${ID} .tabs button.on{background:#e8c872;color:#2a1030;border-color:#e8c872}
#${ID} .chart{background:#1a0f1e;border:1px solid #3a2040;border-radius:12px;padding:10px 8px 6px;overflow:hidden}
#${ID} .chart svg{width:100%;height:auto;display:block}
#${ID} .err,#${ID} .load{color:#b9a3bd;font-size:13px;padding:18px 4px;text-align:center}
#${ID} .foot{font-size:11px;color:#b9a3bd;margin-top:10px;line-height:1.45}`;
document.head.appendChild(st);

function panel(){let el=document.getElementById(ID);if(el)return el;
 el=document.createElement('div');el.id=ID;
 el.innerHTML=`<div class="top"><button type="button" data-x>← Back</button><b>WEMIX price</b></div>
 <div class="body"><div class="load">Loading…</div></div>`;
 document.body.appendChild(el);
 el.addEventListener('click',e=>{if(e.target.closest('[data-x]'))close()});
 return el}

function close(){const el=document.getElementById(ID);if(!el)return;el.classList.remove('on');open=0;
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
 // fallback to recorded files
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
 const fmt=n=>'$'+Number(n).toFixed(4);
 return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
  <path d="${fill}" fill="${fillC}"/>
  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="${pad}" y="12" fill="#b9a3bd" font-size="10">${fmt(hi)}</text>
  <text x="${pad}" y="${H-2}" fill="#b9a3bd" font-size="10">${fmt(lo)}</text>
 </svg>
 <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#b9a3bd;margin-top:4px;padding:0 4px">
  <span>Start<br><b style="color:#f2e8f2">${fmt(a)}</b></span>
  <span style="text-align:right">Now<br><b style="color:#ffe08a">${fmt(b)}</b></span>
 </div>`}

async function render(){
 const el=panel(), body=el.querySelector('.body');
 body.innerHTML='<div class="load">Loading…</div>';
 const data=await prices(range);
 if(!data){body.innerHTML='<div class="err">Could not load WEMIX history right now. Try again in a minute.</div>';return}
 const pts=data.pts, first=pts[0][1], last=pts[pts.length-1][1];
 const live=(window.WEMIX_LIVE>0?window.WEMIX_LIVE:last);
 const chg=((live-first)/first)*100, up=chg>=0;
 const tabs=RANGES.map(([v,l])=>`<button type="button" data-r="${v}" class="${v===range?'on':''}">${l}</button>`).join('');
 body.innerHTML=`<div class="price">$${Number(live).toFixed(4)}<span class="chg ${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs(chg).toFixed(2)}%</span></div>
  <div class="sub">${RANGES.find(r=>r[0]===range)[1]} change vs start of range</div>
  <div class="tabs">${tabs}</div>
  <div class="chart">${chart(pts,up)}</div>
  <div class="foot">Source: ${data.src}. Live price updates in the header every minute. Listing dollar amounts still use our last data refresh so every figure on a character matches.</div>`;
 body.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{range=b.dataset.r;render()});
}

document.addEventListener('click',e=>{
 const t=e.target.closest('#wxp, #w1hdr');
 if(!t)return;
 e.preventDefault();e.stopPropagation();show();
},true);
addEventListener('popstate',()=>{if(open){const el=document.getElementById(ID);if(el)el.classList.remove('on');open=0}});
})();
