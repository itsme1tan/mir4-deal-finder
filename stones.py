"""Magic stones (best deck) with main stat and substats, read-only from public Hofgamer pages + item-detail API.
Substats: Hofgamer stores them ~100x the in-game value, so we divide by 100. Raw value kept as the 4th field."""
import re,json,time,os
import scrape
C='cache/stones.json'
def _cache():
    try: return json.load(open(C))
    except Exception: return {}
def ids(h):
    ms=scrape.panel(h,'magicstone'); best=None
    for d in re.split(r'id="msDeck-\d+"',ms)[1:]:
        it=[]
        for blk in re.findall(r'<div class="inven-item grade-bg-\d[^>]*>',d):
            a=dict(re.findall(r'data-([a-z]+)="([^"]*)"',blk))
            if a.get('name'): it.append(a)
        sc=lambda L:sum(3**(int(a.get('grade',4))-4)+int(a.get('enhance',0)) for a in L)
        if it and (best is None or sc(it)>sc(best)): best=it
    return best or []
def item(a):
    u=f"{scrape.B}/api/item-detail/{a['transport']}/{a['uid']}?class={a.get('class','0')}"
    import urllib.request
    try: j=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read())
    except Exception as e: j={'ok':False,'error':str(e)}
    d=j.get('data') or {}
    t=d.get('tier') or 1; dv=100
    r=lambda v:round(float(v),2)
    return dict(n=scrape.tr(a['name']),g=int(a.get('grade',0)),e=int(a.get('enhance',0)),t=t,ps=d.get('powerScore'),
      img=scrape.icon(a['icon']) if a.get('icon') else '',
      main=[[scrape.tr(o.get('optionName','')),r(o.get('optionValue',0)),o.get('optionFormat','')] for o in d.get('options',[])],
      ok=bool(d),subs=[[scrape.tr(o.get('optionName','')),r(float(o.get('optionValue',0))/dv),o.get('optionAddFormat',''),o.get('optionValue')] for o in d.get('addOptions',[])])
def for_id(i,h=None):
    h=h or scrape.get(f"{scrape.B}/nft/{i}")
    out=[];dead=False
    for a in ids(h):
        if dead: out.append(dict(n=scrape.tr(a['name']),g=int(a.get('grade',0)),e=int(a.get('enhance',0)),t=2 if a['name'].endswith('Ⅱ') else 1,img=scrape.icon(a['icon']) if a.get('icon') else '',ok=False,main=[],subs=[])); continue
        if not a.get('uid'): continue
        s=item(a); out.append(s)
        if not s['ok'] and len(out)==1: dead=True
        time.sleep(0.3)
    return out
def attach(x,max_age=12*3600,budget=[int(os.environ.get('STONE_BUDGET','40'))]):
    """Add x['build']['stones'] from cache; refresh from Hofgamer if stale and budget left."""
    c=_cache(); k=str(x['id']); e=c.get(k)
    if (not e or time.time()-e['t']>max_age) and budget[0]>0:
        budget[0]-=1
        try: s=for_id(x['id']); c[k]=e={'t':time.time(),'s':s}; json.dump(c,open(C,'w'),ensure_ascii=False,separators=(',',':'))
        except Exception as er: print('stones',k,er)
    if e and e['s']: x.setdefault('build',{})['stones']=e['s']
    return x
