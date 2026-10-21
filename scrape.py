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
      refined=len(re.findall(r'meta-tag refine">Dragon Refine',h)),enhance=sum(int(x) for x in re.findall(r'meta-tag trance">Enhance\+(\d+)',h)[:10]),myth_spirits=sp('6'),leg_spirits=sp('5'),
      potential=int(pot[0]) if pot else None,relists=delist,past_sales=sales[:5])
    c.update(extras(h)); c['history']=history(rows)
    c['build']=build(h,c['id']); c['stats']=stats(h); c['sheet']=sheet(h)
    ls=sales[0] if sales else None
    c['flip']=bool(ls and c['wemix'] and ls['date']>=(dt.date.today()-dt.timedelta(days=240)).isoformat() and c['wemix']>1.4*ls['wemix'])
    return c
import hashlib, os, io
_DICT=None
def tr(n):
    global _DICT
    if _DICT is None:
        try: _DICT=json.loads(get('https://nft.hofgamer.com/mir4/api/dict/en'))
        except Exception: _DICT={}
    return _DICT.get(n) or n
ICON_MAP='cache/icons.json'
def icon(url):
    """Download once, shrink to 64px webp in icons/, return repo-relative path (falls back to remote URL)."""
    try: m=json.load(open(ICON_MAP))
    except Exception: m={}
    if url in m and (m[url]=='' or os.path.exists(m[url])): return m[url]
    try:
        from PIL import Image
        raw=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30).read()
        p='icons/'+hashlib.md5(url.encode()).hexdigest()[:12]+'.webp'; os.makedirs('icons',exist_ok=True)
        Image.open(io.BytesIO(raw)).convert('RGBA').resize((64,64),Image.LANCZOS).save(p,'WEBP',quality=80)
        m[url]=p; json.dump(m,open(ICON_MAP,'w'),indent=0); return p
    except Exception as e:
        print('icon failed',url,e)
        if '404' in str(e): m[url]=''; json.dump(m,open(ICON_MAP,'w'),indent=0)
        return ''
def panel(h,p):
    i=h.find(f'id="panel-{p}"')
    if i<0: return ''
    s=h[i:]; j=s.find('id="panel-',20); return s[:j] if j>0 else s
SLOTS={1:'Weapon',2:'Necklace',3:'Bracelet',4:'Ring',5:'Top',6:'Pants',7:'Gloves',8:'Shoes',9:'Sub-weapon',10:'Earrings',7011:'Medallion',7012:'Charm',7013:'Belt',7014:'Seal'}
XORDER=[6,1,7,9,8,5,7013,10,2,7011,3,7012,4,7014]  # XDRACO layout: left column then right column
def xgear(seq):
    """Equipped gear from XDRACO's public read-only summary API (same call its character page makes)."""
    d=json.loads(get(f'https://webapi.mir4global.com/nft/character/summary?seq={seq}&languageCode=en',tries=2))
    e=(d.get('data') or {}).get('equipItem') or {}
    out=[]
    for k in XORDER:
        v=e.get(str(k))
        if not v: continue
        out.append(dict(slot=SLOTS[k],n=v['itemName'],g=int(v['grade']),t=int(v['tier']),e=int(v['enhance']),r=int(v['refineStep']),h=int(v['holeCount']),img=icon(v['itemPath'])))
    return out
def extras(h):
    """Codex, magic stones (best deck), magic orbs (deck 1), gear stone holes from the Hofgamer page."""
    out={}
    cx=panel(h,'codex')
    cp=re.findall(r'stat-name"[^>]*>([^<]+)</span>\s*<div[^>]*>\s*<div[^>]*>\s*<div[^>]*></div>\s*</div>\s*<span class="stat-value"[^>]*>(\d+)/(\d+)',cx)[:5]
    if cp:
        out['codex_done']=sum(int(a) for _,a,_ in cp); out['codex_pct']=round(100*out['codex_done']/max(1,sum(int(b) for *_,b in cp)),1)
        CXN={'服务器':'Server','角色':'Character','魔灵珠':'Magic Orb','声望':'Reputation','限时':'Time-limited'}
        out['codex_parts']=[[CXN.get(n.strip(),tr(n.strip())),int(a),int(b)] for n,a,b in cp]
    rel=re.findall(r'(\d+) Tier',re.sub('<[^>]+>',' ',cx)); out['relic_tiers']=sum(map(int,rel[:5])) if rel else None
    ms=panel(h,'magicstone'); parts=re.split(r'id="msDeck-\d+"',ms)[1:]; best=None
    for d in parts:
        it=[(int(g),tr(n),int(e)) for g,n,e in re.findall(r'<div class="inven-item grade-bg-(\d)[^>]*data-name="([^"]*)"[^>]*data-enhance="(\d+)"',d)]
        if it and (best is None or sum(3**(g-4)+e for g,_,e in it)>sum(3**(g-4)+e for g,_,e in best)): best=it
    if best is not None:
        out['ms_myth']=sum(g==6 for g,_,_ in best); out['ms_leg']=sum(g==5 for g,_,_ in best); out['ms_enh']=sum(e for _,_,e in best)
        out['ms_list']=[[n,g,e] for g,n,e in best]
    else: out.update(ms_myth=0,ms_leg=0,ms_enh=0) if 'Magic Stone' in ms else None
    ob=panel(h,'magicorb'); i=ob.find('id="normalOrb-1"'); j=ob.find('id="normalOrb-2"')
    orbs=re.findall(r'equip-card grade-bg-(\d)" title="[^"]*Lv\.(\d+)"',ob[i:j if j>0 else None]) if i>=0 else []
    out['orb_lv']=sum(int(l) for _,l in orbs) if orbs else (0 if ob else None); out['orb_leg']=sum(g>='5' for g,_ in orbs)
    eq=panel(h,'equip'); out['holes']=sum(len(x) for x in re.findall(r'equip-hole">(◆*)<',eq)) if eq else None
    return out
def history(rows):
    ev=[]
    for r in rows:
        m=re.match(r'#(\d+) (.*?) (Sold) .*? ([\d,]+\.\d+) WEMIX (\d{4}-\d\d-\d\d)',r) or re.match(r'#(\d+) (.*?) (For Sale|Delisted|Listed|Cancel\w*) — ([\d,]+(?:\.\d+)?) .*?(\d{4}-\d\d-\d\d)',r)
        if m: ev.append(dict(id=int(m[1]),name=m[2],ev=m[3],wemix=num(m[4]),date=m[5]))
    return ev[:20]
def build(h,seq=None):
    g=[dict(n=tr(H.unescape(n)),g=int(gr),img=icon(img),e=int(e or 0),r=int((re.findall(r'Dragon Refine(\d)',rest) or [0])[0]))
       for gr,n,img,e,rest in re.findall(r'<div class="equip-card grade-bg-(\d)[^"]*wear-card" title="([^"]*)">\s*<div class="equip-icon[^>]*>\s*<img src="([^"]+)".*?<span class="equip-enhance">\+?(\d*)</span>(.*?)</div>\s*</div>\s*</div>',panel(h,'equip'),re.S)]
    sk=[dict(n=tr(H.unescape(n)),x=-int(x)//128,y=-int(y)//128,t=int(t))
        for x,y,n,t in re.findall(r'background-position:\s*(-?\d+)px\s+(-?\d+)px;"\s*title="([^"]*)".*?Tier (\d+)',panel(h,'skills'),re.S)]
    sp=panel(h,'spirit'); i=sp.find('id="spiritEquip-1"'); j=sp.find('id="spiritEquip-',i+10); sp=sp[i:j if j>0 else None] if i>=0 else ''
    pets=[dict(n=tr(H.unescape(n)),g=int(gr),t=int(t),img=icon(img)) for gr,n,t,img in
          re.findall(r'equip-card grade-bg-(\d)" title="([^"|]*?) \| [^|]*\| 超越(\d+)">\s*<div[^>]*>\s*<img src="([^"]+)"',sp)]
    if seq:
        try:
            xg=xgear(seq)
            if xg: g=xg
        except Exception as ex: print('xdraco gear failed',seq,ex)
    return dict(gear=g,skills=sk,spirits=pets)
STATMAP={'ADDPhysicalDamage':'patk','ADDMagicDamage':'satk','ADDMagicDamagePer':'skill_dmg','AddSmiteSkillDamage':'smite_dmg',
 'ADDAllDamagePer':'all_dmg','Critical':'crit','CriticalOutcome':'crit_dmg','Accuracy':'acc','ADDPVPDamagePer':'pvp_dmg','ADDBossDamagePer':'boss_dmg',
 'Dodge':'eva','DefensePhysical':'pdef','DefenseMagic':'sdef','FallPVPDamagePer':'pvp_red','AtkNormalMonDamagePer':'pve_dmg'}
def stats(h):
    out={}
    for icon,v in re.findall(r'Ico_Status_(\w+)\.png"[^>]*>\s*<span class="stat-name-text"[^>]*>[^<]+</span>\s*</span>\s*</td>\s*<td class="col-num[^"]*">\s*([\d,.]+)',h):
        k=STATMAP.get(icon)
        if k and k not in out: out[k]=num(v)
    if 'patk' in out or 'satk' in out: out['atk']=max(out.get('patk') or 0,out.get('satk') or 0)
    if 'pdef' in out or 'sdef' in out: out['def']=(out.get('pdef') or 0)+(out.get('sdef') or 0)
    return out
EN={'Hp':'HP','HPRecovery':'HP Regen (10s)','SP':'MP','AddRegenerationMana':'MP Regen (10s)','ADDPhysicalDamage':'PHYS ATK','ADDMagicDamage':'SPELL ATK',
 'DefensePhysical':'PHYS DEF','DefenseMagic':'SPELL DEF','Accuracy':'Accuracy','Dodge':'EVA','Critical':'Crit','AvoidCritical':'Crit EVA',
 'CriticalOutcome':'Crit DMG Boost','AddDefCriticalOutcome':'Crit DMG Reduction','AddSmiteSkillDamage':'Smite DMG Boost','AddDefSmiteSkillDamage':'Smite DMG Reduction',
 'AddAtkDemonsDamage':'Demon Slayer','ADDPVPDamagePer':'PvP ATK Boost','FallPVPDamagePer':'PvP DMG Reduction','AtkNormalMonDamagePer':'PvE (Monster) ATK Boost',
 'ADDBossDamagePer':'Boss ATK Boost','AddDefNormalMonDamage':'Monster DMG Reduction','FallBossDamagePer':'Boss DMG Reduction','ADDMagicDamagePer':'Skill ATK Boost',
 'AddDefSkillDamage':'Skill DMG Reduction','ADDAllDamagePer':'All ATK Boost','FallAllDamagePer':'All DMG Reduction','AddStunPer':'Stun Chance','AddDefStunPer':'Stun Resist',
 'AddDeBuffPer':'Debuff Chance','AddDefDeBuffPer':'Debuff Resist','AddCursePer':'Silence Chance','AddDefCursePer':'Silence Resist','AddKnockDownPer':'Knockdown Chance',
 'AddDefKnockDownPer':'Knockdown Resist','ReduceSkillCoolTime':'Skill Cooldown Reduction','SPCostPer':'MP Cost Reduction','AddNormalAtkDamage':'Basic ATK DMG Boost',
 'AddNormalAtkDefense':'Basic ATK DMG Reduction','AddSkillHPHealBooster':'Skill HP Heal Boost','AddItemHPHealBooster':'HP Potion Boost','AddItemMPHealBooster':'MP Potion Boost',
 'HuntExpPer':'Hunting EXP','HuntGoldPer':'Hunting Copper','RatioGetSpirit':'Energy Gain','BlackIronEarning_Increase':'Darksteel Gain','RatioRewardDrop':'Drop Rate',
 'LuckDrop':'Lucky Drop','MiningTime_Decrease':'Gathering Speed','RatioFallMeditationTime':'Energy Gathering Speed','FoaagingTime_Decrease':'Mining Speed',
 'AddNormalMonAccuracy':'Monster Accuracy','AddNormalMonDodge':'Monster EVA','AddMaxVigorRecharge':'Max Vigor','AddMagicOrbGrowExp':'Magic Orb EXP',
 'DecreaseDivineWaterCoolTime':'Holy Water Cooldown','DecreaseBoxCastingTime':'Box Opening Speed','AddClosedTrainingPer':'Closed Training Success'}
GROUP={'Basic':['Hp','SP','ADDPhysicalDamage','ADDMagicDamage','DefensePhysical','DefenseMagic','Accuracy','Dodge','Critical','AvoidCritical','HPRecovery','AddRegenerationMana'],
 'Damage':['CriticalOutcome','AddDefCriticalOutcome','AddSmiteSkillDamage','AddDefSmiteSkillDamage','ADDMagicDamagePer','AddDefSkillDamage','ADDAllDamagePer','FallAllDamagePer',
   'ADDPVPDamagePer','FallPVPDamagePer','AtkNormalMonDamagePer','AddDefNormalMonDamage','ADDBossDamagePer','FallBossDamagePer','AddAtkDemonsDamage','AddNormalAtkDamage','AddNormalAtkDefense'],
 'Status effects':['AddStunPer','AddDefStunPer','AddDeBuffPer','AddDefDeBuffPer','AddCursePer','AddDefCursePer','AddKnockDownPer','AddDefKnockDownPer'],
 'Skill & recovery':['ReduceSkillCoolTime','SPCostPer','AddSkillHPHealBooster','AddItemHPHealBooster','AddItemMPHealBooster']}
def sheet(h):
    raw={}
    for icon,cn,v in re.findall(r'Ico_Status_(\w+)\.png"[^>]*>\s*<span class="stat-name-text"[^>]*>([^<]+)</span>\s*</span>\s*</td>\s*<td class="col-num[^"]*">\s*([^<]+?)\s*<',h):
        if icon not in raw: raw[icon]=(EN.get(icon) or tr(cn.strip()),v.strip())
    out=[[g,[[k]+list(raw.pop(k)) for k in ks if k in raw]] for g,ks in GROUP.items()]
    if raw: out.append(['Other',[[k]+list(v) for k,v in raw.items()]])
    return [g for g in out if g[1]]
FEATS=['lv','darksteel','ancient','copper','refined','enhance','myth_spirits','leg_spirits','potential','stats','codex_done','codex_pct','relic_tiers','ms_myth','ms_leg','ms_enh','orb_lv','orb_leg','holes']
def load_cache():
    try: return json.load(open('cache/features.json'))
    except Exception: return {}
def rank_builds(lst,sold):
    """Percentile of main ATK and skill dmg boost within class (pool = listings + recent sales); build score = their mean."""
    for c in lst+sold:
        st=c.get('stats') or {}; c['atk']=st.get('atk'); c['skill_dmg']=st.get('skill_dmg'); c['crit_dmg']=st.get('crit_dmg')
        for k in ('pvp_dmg','def','eva','pvp_red','pdef','sdef','acc','crit'): c[k]=st.get(k)
        for k,v in st.items(): c['_'+k]=v
    for cls in set(c['cls'] for c in lst):
        pool=[c for c in lst+sold if c['cls']==cls and c.get('atk') and c.get('skill_dmg') is not None]
        pr=lambda k,v:100*sum((p.get(k) or 0)<v for p in pool)/max(1,len(pool)-1)
        for c in lst:
            if c['cls']==cls and c.get('atk') and c.get('skill_dmg') is not None:
                c['atk_pct']=round(pr('atk',c['atk'])); c['skd_pct']=round(pr('skill_dmg',c['skill_dmg']))
                for k in ('pvp_dmg','def','eva'):
                    if c.get(k) is not None: c[k+'_pct']=round(pr(k,c[k]))
                c['sheet_rank']={ic:round(pr('_'+k,c['stats'][k])) for ic,k in STATMAP.items() if c['stats'].get(k) is not None}
                c['build_score']=round(0.4*c['atk_pct']+0.2*c['skd_pct']+0.2*c.get('pvp_dmg_pct',0)+0.2*c.get('def_pct',0)); c['class_pool']=len(pool)
    for c in lst:
        same=[x['build_score'] for x in lst if x['cls']==c['cls'] and x.get('build_score') is not None]
        c['strong']=bool(c.get('build_score') is not None and sum(v<c['build_score'] for v in same)>=0.75*len(same) if len(same)>=4 else (c.get('build_score') or 0)>=75)
def main(ps_min=600000, max_new=400):
    usd=json.loads(get('https://api.coingecko.com/api/v3/simple/price?ids=wemix-token&vs_currencies=usd'))['wemix-token']['usd']
    lst=cards('sale',ps_min); sold=cards('sold',int(ps_min*0.85))
    cut=(dt.date.today()-dt.timedelta(days=90)).isoformat()
    sold=[s for s in sold if s['sold'] and s['sold'][:10]>=cut and s['wemix']]
    cache=load_cache()
    for c in lst:
        try: detail(c); cache[str(c['id'])]={k:c.get(k) for k in FEATS}
        except Exception as e: print('detail failed',c['id'],e)
        time.sleep(1.5)
    new=0
    for s in sold:
        k=str(s['id'])
        if (k not in cache or 'codex_done' not in cache[k]) and new<max_new:
            try: detail(s); cache[k]={f:s.get(f) for f in FEATS}; new+=1
            except Exception as e: print('sold detail failed',k,e)
            time.sleep(1.5)
            if new%25==0: json.dump(cache,open('cache/features.json','w'))
        if k in cache: s.update(cache[k])
        for f in ('past_sales','relists','flip','history','ms_list','codex_parts','build','sheet'): s.pop(f,None)
    json.dump(cache,open('cache/features.json','w'))
    print('fetched',new,'new sold details; cache',len(cache))
    for c in lst:
        comps=[s for s in sold if s['cls']==c['cls'] and abs(s['ps']-c['ps'])<=0.05*c['ps']]; basis='same class, PS ±5%'
        if len(comps)<3: comps=[s for s in sold if abs(s['ps']-c['ps'])<=0.05*c['ps']]; basis='any class, PS ±5%'
        if len(comps)<3: comps=[s for s in sold if abs(s['ps']-c['ps'])<=0.10*c['ps']]; basis='any class, PS ±10%'
        if comps:
            fv=statistics.median(s['wemix']/s['ps'] for s in comps)*c['ps']
            c.update(fair_wemix=round(fv),comps_n=len(comps),comps_basis=basis,comp_ids=[s['id'] for s in sorted(comps,key=lambda s:s['sold'],reverse=True)[:8]])
        else: c.update(fair_wemix=None,comps_n=0)
        c['usd']=round(c['wemix']*usd,2)
    import model; info=model.apply(sold,lst)
    for c in lst:
        use_full=c.get('fair_full') is not None and info['use_full'] and c.get('full_conf')=='ok'
        fv=c['fair_full'] if use_full else c['fair_wemix']; c['fair_basis']='full build' if use_full else 'power'
        c['discount']=round((fv-c['wemix'])/fv*100,1) if fv else None
        c['flip_margin']=round((fv*0.95-c['wemix'])/c['wemix']*100,1) if fv else None
        c['deal']=bool(fv and c['discount']>=15 and (use_full or c['comps_n']>=3))
    rank_builds(lst,sold)
    try:
        mc=json.loads(get('https://api.coingecko.com/api/v3/coins/wemix-token/market_chart?vs_currency=usd&days=365&interval=daily',tries=2))['prices']
        day={dt.datetime.utcfromtimestamp(t/1000).strftime('%Y-%m-%d'):p for t,p in mc}
    except Exception as e: print('history usd failed',e); day={}
    for c in lst:
        for ev in c.get('history') or []:
            p=day.get(ev['date']); ev['usd']=round(ev['wemix']*p) if p else None
    for c in lst+sold:
        for k in [k for k in c if k.startswith('_')]: c.pop(k)
    json.dump({'updated':dt.datetime.now(__import__('zoneinfo').ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d %H:%M'),'wemix_usd':usd,'model':info,'listings':lst,
      'sales':sorted(sold,key=lambda s:s['sold'],reverse=True)},open('data.json.tmp','w'),ensure_ascii=False)
    import os; os.replace('data.json.tmp','data.json')
    print(f"{len(lst)} listings, {len(sold)} sales (90d), WEMIX ${usd}; model {info.get('summary')}")
    import extras as mir4_extras; mir4_extras.main()  # leaderboards, trends, upgrade, data/new_deals.json
if __name__=='__main__': main()
