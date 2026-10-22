"""Extra per-character data from XDRACO's public read-only character API (the same calls its public character page makes).
Sealed NFT characters do not change while listed, so results are cached forever per listing seq."""
import json, os, time, urllib.request
ROOT=os.path.dirname(os.path.abspath(__file__)); CP=os.path.join(ROOT,'cache','xdetail.json'); API='https://webapi.mir4global.com/nft'
def _get(path):
    for i in range(3):
        try:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(API+path,headers={'User-Agent':'Mozilla/5.0 (mir4-tool read-only)'}),timeout=40).read())
            if d.get('code')==200: return d['data']
            return None
        except Exception: time.sleep(5*(i+1))
    return None
SHORT={'Tower of Conquest':'conquest_tower','Forge':'forge','Mine':'mine','Millennial Tree':'tree','Training Sanctum':'sanctum','Tower of Quintessence':'quint','Tower of Victory':'victory','Holy Shrine':'shrine','Portal':'portal','Sanctuary of Hydra':'hydra'}
DRAGON_SUB={3:'Scale',4:'Leather',5:'Horn',6:'Claw',7:'Eye',8:'Sphere',10:'Heart'}
def cat_icons(inv):
    # one real XDRACO item image per bag category (highest grade example), for the visual bag grid
    g=lambda i:int(i.get('grade') or 0)
    C={'skill_tomes':lambda i:i['mainType']==12,'arcane_tomes':lambda i:i['mainType']==13 and i['subType']==5,
       'leg_mats':lambda i:i['mainType']==9 and g(i)>=5,'leg_enh_stones':lambda i:i['mainType']==5 and g(i)>=5 and 'Enhancement Stone' in i['itemName'],
       'spare_leg_gear':lambda i:i['mainType'] in (2,3,4,20) and g(i)>=5,'spare_leg_ms':lambda i:i['mainType']==8 and g(i)>=5,
       'summon_tickets':lambda i:i['mainType']==18 and i['subType']==2}
    for k,n in DRAGON_SUB.items(): C['dm_'+n]=(lambda k:lambda i:i['mainType']==9 and i['subType']==k and g(i)>=4)(k)
    out={}
    for k,f in C.items():
        m=[i for i in inv if f(i) and i.get('itemPath')]
        if m: out[k]=max(m,key=g)['itemPath']
    return out
def summarize(seq):
    s=_get(f'/character/summary?seq={seq}&languageCode=en')
    if not s: return None
    t=s['character']['transportID']; c=s['character']['class']; q=f'transportID={t}&class={c}&languageCode=en'
    out={'x_seq':seq}
    b=_get('/character/building?'+q) or {}
    out['bld']={SHORT.get(v['buildingName'],v['buildingName']):int(v['buildingLevel']) for k,v in b.items() if isinstance(v,dict) and 'buildingLevel' in v}
    tr=_get('/character/training?'+q) or {}
    out['train']={v['forceName']:int(v['forceLevel']) for k,v in tr.items() if isinstance(v,dict) and 'forceLevel' in v}
    if 'consitutionLevel' in tr: out['constitution']=int(tr['consitutionLevel'])
    inv=_get('/character/inven?'+q) or []
    g=lambda i:int(i.get('grade') or 0); st=lambda i:int(i.get('stack') or 0) or 1
    tomes=[i for i in inv if i['mainType']==12]
    out['inv']={
      'n':len(inv),
      'skill_tomes':sum(st(i) for i in tomes),'skill_tomes_leg':sum(st(i) for i in tomes if g(i)>=5),'skill_tomes_epic':sum(st(i) for i in tomes if g(i)==4),
      'arcane_tomes':sum(st(i) for i in inv if i['mainType']==13 and i['subType']==5),
      'dragon_mats_epic':sum(st(i) for i in inv if i['mainType']==9 and i['subType'] in DRAGON_SUB and g(i)==4),
      'dragon_mats_leg':sum(st(i) for i in inv if i['mainType']==9 and i['subType'] in DRAGON_SUB and g(i)>=5),
      'dragon_mats':{n:sum(st(i) for i in inv if i['mainType']==9 and i['subType']==k and g(i)>=4) for k,n in DRAGON_SUB.items()},
      'leg_mats':sum(st(i) for i in inv if i['mainType']==9 and g(i)>=5),
      'leg_enh_stones':sum(st(i) for i in inv if i['mainType']==5 and g(i)>=5 and 'Enhancement Stone' in i['itemName']),
      'spare_leg_gear':sum(1 for i in inv if i['mainType'] in (2,3,4,20) and g(i)>=5),
      'spare_leg_ms':sum(1 for i in inv if i['mainType']==8 and g(i)>=5),
      'summon_tickets':sum(st(i) for i in inv if i['mainType']==18 and i['subType']==2),
      'top':sorted([[i['itemName'],st(i),g(i),i.get('itemPath') or ''] for i in inv if g(i)>=5 and i['mainType'] not in (8,21,17)],key=lambda r:-r[1])[:25]}
    out['inv']['img']=cat_icons(inv)
    hs=_get('/character/holystuff?'+q) or {}
    out['mystique']={v['HolyStuffName'].replace(' Mystique',''):int(v['Grade']) for v in hs.values() if isinstance(v,dict)}
    return out
def backfill_imgs(cache,pause=1.0):
    # older cache rows were saved before item images were kept; refetch only their bag once
    for k,r in cache.items():
        I=r.get('inv') or {}
        if 'img' in I: continue
        try:
            s=_get(f'/character/summary?seq={k}&languageCode=en')
            if not s: continue
            c=s['character']; inv=_get(f"/character/inven?transportID={c['transportID']}&class={c['class']}&languageCode=en")
            if inv is None: continue
            p={i['itemName']:i.get('itemPath') or '' for i in inv}
            I['top']=[t[:3]+[p.get(t[0],'')] for t in I.get('top',[])]; I['img']=cat_icons(inv)
        except Exception as e: print('img backfill failed',k,e)
        time.sleep(pause)
def save_icon_index(cache):
    # cache/icons.json: item image URLs seen (value = local copy if one exists, else the URL itself)
    IP=os.path.join(ROOT,'cache','icons.json'); ix=json.load(open(IP)) if os.path.exists(IP) else {}
    for r in cache.values():
        I=r.get('inv') or {}
        for u in list((I.get('img') or {}).values())+[t[3] for t in I.get('top',[]) if len(t)>3 and t[3]]:
            ix.setdefault(u,u)
    json.dump(ix,open(IP,'w'),indent=0,ensure_ascii=False)
def enrich(listings,pause=1.0):
    cache=json.load(open(CP)) if os.path.exists(CP) else {}
    backfill_imgs(cache,pause)
    for c in listings:
        k=str(c['id'])
        if k not in cache:
            try:
                r=summarize(c['id'])
                if r: cache[k]=r
            except Exception as e: print('xdetail failed',k,e)
            time.sleep(pause)
        if k in cache: c.update({kk:v for kk,v in cache[k].items() if kk!='x_seq'})
    live={str(c['id']) for c in listings}
    # keep cache small: listings only (sold ones are not shown with these fields)
    json.dump({k:v for k,v in cache.items() if k in live},open(CP,'w'),ensure_ascii=False,separators=(',',':'))
    try: save_icon_index(cache)
    except Exception as e: print('icon index failed',e)
