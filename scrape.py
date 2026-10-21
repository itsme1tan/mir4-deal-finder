#!/usr/bin/env python3
"""Read-only scraper: Hofgamer public pages -> data.json. Never signs in or transacts."""
import re, json, time, statistics, datetime as dt, urllib.request, html as H
from concurrent.futures import ThreadPoolExecutor
B='https://nft.hofgamer.com/mir4'
UA={'User-Agent':'Mozilla/5.0 (mir4-tool read-only)'}
def get(u,tries=4):
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read().decode('utf-8','ignore')
        except Exception as e: err=e; time.sleep(10*(i+1))
    raise err
num=lambda s: float(s.replace(',','')) if s else None
def cards(status,ps_min):
    out={};page=1
    while True:
        h=get(f'{B}/?status={status}&ps_min={ps_min}&limit=300&page={page}')
        cs=re.findall(r'<a class="nft-card[^"]*" href="/mir4/nft/(\d+)" title="([^"]*)">(.*?)</a>\s*(?=<a class="nft-card|</div>)',h,re.S)
        new=0
        for id,name,c in cs:
            if id in out: continue
            f=lambda p: (re.search(p,c,re.S) or [None,None])[1]
            out[id]=dict(id=int(id),name=H.unescape(name),cls=f(r'class-badge">([^<]+)'),lv=int(f(r'Lv\.(\d+)') or 0),
              ps=int(num(f(r'([\d,]+) PS'))),server=f(r'nft-server">([^<]+)'),listed=f(r'Listed</span> <b>([^<]+)'),
              sold=f(r'Sold</span> <b>([^<]+)'),wemix=num(f(r'wemix\.webp"[^>]*>\s*<span>([\d,.]+)')))
            new+=1
        if new==0 or len(cs)<300 or page>=10: break
        page+=1
    return list(out.values())
def asset(v):
    if not v: return None
    m=re.match(r'([\d.]+)\s*([KMB]?)',v.strip()); return float(m[1])*{'':1,'K':1e3,'M':1e6,'B':1e9}[m[2]] if m else None
def detail(c):
    h=get(f"{B}/nft/{c['id']}")
    a=dict(re.findall(r'asset-label">([^<]+)</div>\s*<div class="asset-value"[^>]*>\s*([^<]+?)\s*<',h))
    sp=lambda g:len(set(re.findall(r'data-i18n-key="([^"]+)"[^>]*>[^<]*</div>\s*<div class="equip-meta">\s*<span class="grade-tag grade-'+g+r'">\w+</span>\s*<span class="meta-tag"[^>]*data-i18n>[^<]*精灵',h)))
    pot=re.findall(r'Total Potential\s*</span>\s*<span class="stat-value"[^>]*>(\d+)',h)
    i=h.find('id="panel-trades"');p=h[i:i+100000] if i>0 else ''
    rows=[re.sub(r'\s+',' ',H.unescape(re.sub('<[^>]+>',' ',r))).strip() for r in re.findall(r'<tr[^>]*>(.*?)</tr>',p,re.S)]
    delist=sum(' Delisted ' in r for r in rows); sales=[]
    for r in rows:
        m=re.search(r' Sold .*?([\d,]+\.\d+) WEMIX (\d{4}-\d\d-\d\d)',r)
        if m: sales.append({'wemix':num(m[1]),'date':m[2]})
    sales.sort(key=lambda s:s['date'],reverse=True)
    c.update(darksteel=asset(a.get('Darksteel')),ancient=asset(a.get('Ancient Coin')),copper=asset(a.get('Copper')),
      refined=len(re.findall(r'meta-tag refine">Dragon Refine',h)),myth_spirits=sp('6'),leg_spirits=sp('5'),
      potential=int(pot[0]) if pot else None,relists=delist,past_sales=sales[:5])
    ls=sales[0] if sales else None
    c['flip']=bool(ls and c['wemix'] and ls['date']>=(dt.date.today()-dt.timedelta(days=240)).isoformat() and c['wemix']>1.4*ls['wemix'])
    return c
def main(ps_min=600000):
    usd=json.loads(get('https://api.coingecko.com/api/v3/simple/price?ids=wemix-token&vs_currencies=usd'))['wemix-token']['usd']
    lst=cards('sale',ps_min); sold=cards('sold',int(ps_min*0.85))
    cut=(dt.date.today()-dt.timedelta(days=90)).isoformat()
    sold=[s for s in sold if s['sold'] and s['sold'][:10]>=cut and s['wemix']]
    for c in lst:
        try: detail(c)
        except Exception as e: print('detail failed',c['id'],e)
        time.sleep(1.5)
    for c in lst:
        comps=[s for s in sold if s['cls']==c['cls'] and abs(s['ps']-c['ps'])<=0.05*c['ps']]; basis='same class, PS ±5%'
        if len(comps)<3: comps=[s for s in sold if abs(s['ps']-c['ps'])<=0.05*c['ps']]; basis='any class, PS ±5%'
        if len(comps)<3: comps=[s for s in sold if abs(s['ps']-c['ps'])<=0.10*c['ps']]; basis='any class, PS ±10%'
        if comps:
            fv=statistics.median(s['wemix']/s['ps'] for s in comps)*c['ps']
            c.update(fair_wemix=round(fv),comps_n=len(comps),comps_basis=basis,comp_ids=[s['id'] for s in sorted(comps,key=lambda s:s['sold'],reverse=True)[:8]],
              discount=round((fv-c['wemix'])/fv*100,1),flip_margin=round((fv*0.95-c['wemix'])/c['wemix']*100,1))
        else: c.update(fair_wemix=None,comps_n=0,discount=None,flip_margin=None)
        c['deal']=c['discount'] is not None and c['discount']>=15 and c['comps_n']>=3
        c['usd']=round(c['wemix']*usd,2)
    json.dump({'updated':dt.datetime.now(__import__('zoneinfo').ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d %H:%M'),'wemix_usd':usd,'listings':lst,
      'sales':sorted(sold,key=lambda s:s['sold'],reverse=True)},open('data.json.tmp','w'),ensure_ascii=False)
    import os; os.replace('data.json.tmp','data.json')
    print(f'{len(lst)} listings, {len(sold)} sales (90d), WEMIX ${usd}')
if __name__=='__main__': main()
