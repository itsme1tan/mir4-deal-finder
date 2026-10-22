"""Hourly WEMIX/USD history for the 1h price tag (display only; not used by model)."""
import json,time,urllib.request,os
F='data/wemix_price.json';now=int(time.time())
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'mir4-deal-finder'}),timeout=20))
try:h=json.load(open(F))
except Exception:h={'source':'CoinGecko','points':[]}
P=h['points']
if not P:  # one-time seed: CoinGecko 7-day chart is hourly
    try:P+=[[int(t/1000),round(p,6)] for t,p in get('https://api.coingecko.com/api/v3/coins/wemix-token/market_chart?vs_currency=usd&days=7')['prices']]
    except Exception as e:print('seed failed',e)
if not P or now-P[-1][0]>=55*60:
    try:
        p=get('https://api.coingecko.com/api/v3/simple/price?ids=wemix-token&vs_currencies=usd')['wemix-token']['usd']
        if p>0:P.append([now,round(p,6)])
    except Exception as e:print('wemix fetch failed',e)
h['points']=[x for x in P if x[0]>=now-7*86400];h['source']='CoinGecko'
json.dump(h,open(F,'w'),separators=(',',':'))
print(len(h['points']),h['points'][-1] if h['points'] else None)
