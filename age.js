// Listing age + market note helpers (data from market.py). Shared by index, Top 10 and Top by class.
const AGE={
 txt:x=>{if(x.age_d==null)return '?';const d=x.age_d,s=d<1?Math.max(1,Math.round(d*24))+'h':Math.floor(d)+'d';return s+(x.age_plus?'+':'')},
 tip:x=>x.age_d==null?'Listing time unknown':`On the market since ${x.on_since} PT`+(x.age_plus?' or earlier (our tracker started '+((typeof D!='undefined'&&D.age&&D.age.tracking_since)||'Oct 20')+' and the seller relisted since)':'')+(x.cut_n?`, price cut ${x.cut_n}x`:''),
 chip:x=>x.age_d==null?'':`<span class="agec" title="${AGE.tip(x)}">🕰 Listed ${AGE.txt(x)}</span>`,
 badges:x=>{let o='';
  if(x.fresh)o+=`<span class="ageb fr" title="Listed under 24h ago and already ${x.discount}% under fair. Most good deals sell within hours (median sale is about 7h after listing).">⚡ FRESH</span>`;
  if(x.stale)o+=`<span class="ageb st" title="On the market ${AGE.txt(x)}. Only about 7% of characters take 7+ days to sell, so the ask is likely above what buyers pay. The seller may cut the price or take an offer.">🕰 STALE${x.cut_n?' · cut '+x.cut_n+'x':''}</span>`;
  else if(x.cut_n>=2&&x.age_d>=3)o+=`<span class="ageb ct" title="Price cut ${x.cut_n} times in ${AGE.txt(x)} (${x.cut_pct}% overall). This seller is motivated and may go lower.">✂️ CUTTING</span>`;
  return o},
 note:d=>d&&d.market?`<span class="mkt" title="Median of the last ${d.market.days} days of sales (${d.market.n}) vs our model's fair value. Fair values and % under/over are scaled by this, so they match what similar characters sell for now.">📉 ${d.market.note}</span>`:''
};
document.head.insertAdjacentHTML('beforeend',`<style>.agec{font-size:11px;color:#e8c872;white-space:nowrap}.ageb{display:inline-block;width:fit-content;max-width:max-content;justify-self:start;align-self:start;flex:0 0 auto;font-size:9px;font-weight:700;line-height:1.3;padding:1px 5px;border-radius:999px;margin:2px 4px 2px 0;white-space:nowrap}.ageb.fr{background:linear-gradient(90deg,#db2777,#f472b6);color:#fff;box-shadow:0 0 8px rgba(236,72,153,.6)}.ageb.st{background:#3a2440;color:#e8c872;border:1px solid #c99a1e}.ageb.ct{background:#2a1530;color:#f9a8d4;border:1px solid #be185d}.mkt{display:inline-block;font-size:11px;color:#e8c872;background:rgba(42,15,46,.7);border:1px solid #8a2d6b;border-radius:999px;padding:1px 8px;margin-left:4px}</style>`);
