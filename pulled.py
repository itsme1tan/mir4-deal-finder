"""Characters that left the market (sold or pulled), with Top 20 strongest rank at that moment.
Writes data/pulled.json for Feed 36h. Times PT. Uses relist_history obs + data/snaps records."""
import json,os
ROOT=os.path.dirname(os.path.abspath(__file__)); DD=os.path.join(ROOT,'data')
TANK={'Taoist','Warrior','Lionheart'}
WA=[('atk',.35),('skill_dmg',.2),('pvp_dmg',.2),('def',.1),('pvp_red',.05),('ps',.1)]
WT=[('def',.25),('eva',.2),('pvp_red',.2),('atk',.1),('skill_dmg',.05),('pvp_dmg',.1),('ps',.1)]
def t20(A):
    """Same as strength.js: in-class percentile blend over all listings A, ranked among usd<=25k with build score."""
    def pool(x):
        c=[y for y in A if y['cls']==x['cls']]; return c if len(c)>=3 else A
    def pr(x,k):
        v=[y[k] for y in pool(x) if y.get(k) is not None]
        return 0 if x.get(k) is None or not v else sum(n<=x[k] for n in v)/len(v)*100
    L=[x for x in A if (x.get('usd') or 9e9)<=25000 and x.get('build_score') is not None]
    for x in L: x['_s']=sum(w*pr(x,k) for k,w in (WT if x['cls'] in TANK else WA))
    L.sort(key=lambda x:(-x['_s'],-(x.get('ps') or 0)))
    return {x['id']:i+1 for i,x in enumerate(L)}
def snap(i,c={}):
    if i not in c:
        try: c[i]=json.load(open(os.path.join(DD,'snaps',f'{i}.json')))
        except Exception: c[i]=None
    return c[i]
def main(days=7):
    CH=json.load(open(os.path.join(DD,'char_history.json')))
    H=json.load(open(os.path.join(DD,'relist_history.json')))
    snaps=sorted(H['snapshots']); last=snaps[-1]
    import datetime as dt
    cut=(dt.datetime.strptime(last,'%Y-%m-%d %H:%M')-dt.timedelta(days=days)).strftime('%Y-%m-%d %H:%M')
    alive={}
    for k,o in H['chars'].items():
        for ob in o['obs']: alive.setdefault(ob['t'],[]).append(ob['id'])
    ranks={}; out=[]
    for k,v in CH['chars'].items():
        e=v['events'][-1]
        if e['type'] not in('delisted','sold') or e['t']<cut: continue
        obs=H['chars'].get(k,{}).get('obs') or []
        if not obs: continue
        lo=obs[-1]; s=snap(lo['id']) or {}
        if lo['t'] not in ranks:
            A=[r for r in (snap(i) for i in alive.get(lo['t'],[])) if r]
            ranks[lo['t']]=(t20([dict(r) for r in A]),len(A),len(alive.get(lo['t'],[])))
        R,n,m=ranks[lo['t']]
        name,server,cls=k.split('|')
        px=[x for x in v['events'] if x.get('wemix')]
        out.append({'name':name,'server':server,'cls':cls,'id':lo['id'],'ps':s.get('ps'),
            'wemix':e.get('wemix') or lo['wemix'],'usd':(px[-1].get('usd') if px else None) or s.get('usd'),
            't':e['t'],'type':'sold' if e['type']=='sold' else 'pulled','seen':lo['t'],
            'rank':R.get(lo['id']),'rank_ok':n==m})
    out.sort(key=lambda x:x['t'],reverse=True)
    json.dump({'updated':CH['updated'],'items':out},open(os.path.join(DD,'pulled.json'),'w'),ensure_ascii=False,separators=(',',':'))
    return out
if __name__=='__main__':
    for x in main(): print(x)
