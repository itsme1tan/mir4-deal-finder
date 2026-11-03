/* Live WEMIX price for the header: fetched in the browser on load and every 60s while the tab is visible.
   CoinGecko first, CoinPaprika as backup; if both fail the data file price stays. Display only:
   listing USD values and the fair value model keep the data file price so every dollar figure matches. */
(function(){const S=[['https://api.coingecko.com/api/v3/simple/price?ids=wemix-token&vs_currencies=usd',j=>j['wemix-token'].usd,'CoinGecko'],
 ['https://api.coinpaprika.com/v1/tickers/wemix-wemix-token',j=>j.quotes.USD.price,'CoinPaprika']];
let last=0;
async function get(){for(const[u,f,n]of S){try{const r=await fetch(u,{cache:'no-store'});if(!r.ok)continue;const v=+f(await r.json());if(v>0&&isFinite(v))return[v,n]}catch(e){}}return null}
async function tick(){if(document.hidden)return;const g=await get();if(!g)return;const[v,n]=g;last=Date.now();window.WEMIX_LIVE=v;
 document.querySelectorAll('.wxl').forEach(e=>e.textContent=v.toFixed(4));
 const c=document.getElementById('wxp');if(c){const t=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'}).format(new Date());
  c.title=`WEMIX price in USD, live from ${n} (${t} PT). Updates every minute. Listing prices in dollars use the price from our last data update.`}}
tick();setInterval(tick,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>60000)tick()});
})();
