"""Magic stones (best deck) with main stat and substats, read-only from public Hofgamer pages + item-detail API.
Substats: raw Hofgamer values / 40 for stage II stones, / 20 for stage I (same as Hofgamer's page; verified on 2371297). Fields: [name, value, fmt, raw, trance bonus]."""
import re,json,time,os
import scrape
C='cache/stones.json'
def _cache():
    try: return json.load(open(C))
    except Exception: return {}
XD='https://webapi.mir4global.com/nft/character'
def _xj(u):
    import urllib.request
    try: return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read()).get('data') or {}
    except Exception: return {}
def active(seq):
    """XDRACO: the deck the character has equipped now, with slot order, tier and trance step."""
    c=(_xj(f"{XD}/summary?seq={seq}&languageCode=en").get('character') or {})
    if not c.get('transportID'): return None,{}
    m=_xj(f"{XD}/magicstone?transportID={c['transportID']}&class={c['class']}&languageCode=en")
    dk=str(m.get('activeDeck') or ''); return dk,(m.get('equipItem') or {}).get(dk,{})
def ids(h,deck=None):
    ms=scrape.panel(h,'magicstone'); best=None
    for dk,d in re.findall(r'id="msDeck-(\d+)"(.*?)(?=id="msDeck-|\Z)',ms,re.S):
        it=[]
        for blk in re.findall(r'<div class="inven-item grade-bg-\d[^>]*>',d):
            a=dict(re.findall(r'data-([a-z]+)="([^"]*)"',blk))
            if a.get('name'): it.append(a)
        if deck and dk==deck: return it
        sc=lambda L:sum(3**(int(a.get('grade',4))-4)+int(a.get('enhance',0)) for a in L)
        if it and (best is None or sc(it)>sc(best)): best=it
    return best or []
def item(a,tier=None):
    # XDRACO item detail first (English names), Hofgamer proxy as fallback.
    d=_xj(f"{XD}/itemdetail?transportID={a['transport']}&class={a.get('class','0')}&itemUID={a['uid']}&languageCode=en")
    if not d.get('options') and not d.get('addOptions'):
        import urllib.request
        try: d=(json.loads(urllib.request.urlopen(urllib.request.Request(f"{scrape.B}/api/item-detail/{a['transport']}/{a['uid']}?class={a.get('class','0')}",headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read()).get('data') or {})
        except Exception: d={}
    t=int(d.get('tier') or tier or (2 if a['name'].endswith('Ⅱ') or a['name'].endswith(' II') else 1)); dv=40 if t==2 else 20
    r=lambda v:round(float(v),2)
    return dict(n=scrape.tr(d.get('itemName') or a['name']),g=int(a.get('grade',0)),e=int(a.get('enhance',0)),t=t,ps=d.get('powerScore'),
      img=scrape.icon(a['icon']) if a.get('icon') else '',
      main=[[scrape.tr(o.get('optionName','')),r(o.get('optionValue',0)),o.get('optionFormat',''),o.get('tranceValue') or 0] for o in d.get('options',[])],
      ok=bool(d),subs=[[scrape.tr(o.get('optionName','')),r(float(o.get('optionValue',0))/dv),o.get('optionAddFormat',''),o.get('optionValue'),r(float(o.get('optionTranceStep') or 0)/dv)] for o in d.get('addOptions',[])])
def for_id(i,h=None):
    """Equipped deck (XDRACO activeDeck), each stone's stats from its own item detail, in game slot order."""
    h=h or scrape.get(f"{scrape.B}/nft/{i}")
    dk,XS=active(i); xs=[XS[k] for k in sorted(XS,key=int)]
    out=[]
    for a in ids(h,dk):
        if not a.get('uid'): continue
        s=item(a); s['deck']=dk; out.append(s); time.sleep(0.3)
    if xs:  # slot order and trance step as XDRACO shows them
        pool=list(out); res=[]
        for x in xs:
            j=next((n for n,m in enumerate(pool) if m['n']==x['itemName'] and m['e']==int(x['tranceStep'])),None)
            if j is None: j=next((n for n,m in enumerate(pool) if m['n']==x['itemName']),None)
            if j is not None: res.append(pool.pop(j))
        out=res+pool
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
