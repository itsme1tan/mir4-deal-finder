"""One-off/rare: pull the full public Hofgamer sold archive (sold_days=0) for 510k+ power and cache details. Read-only, 1.5s between pages."""
import json,time,os,scrape
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import re,html as H
out={}
for page in range(1,40):
    h=scrape.get(f'{scrape.B}/?status=sold&sold_days=0&ps_min=510000&sort=ps&limit=240&page={page}')
    cs=re.findall(r'<a class="nft-card[^"]*" href="/mir4/nft/(\d+)" title="([^"]*)">(.*?)</a>\s*(?=<a class="nft-card|</div>)',h,re.S); new=0
    for id,name,c in cs:
        if id in out: continue
        f=lambda p:(re.search(p,c,re.S) or [None,None])[1]
        out[id]=dict(id=int(id),name=H.unescape(name),cls=f(r'class-badge">([^<]+)'),lv=int(f(r'Lv\.(\d+)') or 0),ps=int(scrape.num(f(r'([\d,]+) PS'))),server=f(r'nft-server">([^<]+)'),
                     listed=f(r'Listed</span> <b>([^<]+)'),sold=f(r'Sold</span> <b>([^<]+)'),wemix=scrape.num(f(r'wemix\.webp"[^>]*>\s*<span>([\d,.]+)'))); new+=1
    if len(cs)<240 or new==0: break
    time.sleep(1.5)
L=[s for s in out.values() if s['sold'] and s['wemix']]
cache=scrape.load_cache(); n=0
for s in L:
    k=str(s['id'])
    if k in cache and 'codex_done' in cache[k] and 'te_enh' in cache[k]: continue
    try: scrape.detail(s); cache[k]={f:s.get(f) for f in scrape.FEATS}; n+=1
    except Exception as e: print('fail',k,e)
    time.sleep(1.5)
    if n%20==0: json.dump(cache,open('cache/features.json','w'))
json.dump(cache,open('cache/features.json','w'))
json.dump([{k:v for k,v in s.items() if k in('id','name','cls','lv','ps','server','listed','sold','wemix')} for s in L],open('data/sold_archive.json','w'),ensure_ascii=False)
print('archive',len(L),'new details',n)
