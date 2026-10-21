"""Relisting and price-change tracker + daily market summary. Read-only analysis of data.json snapshots.
Character key = name|server|class (stable across relists; the Hofgamer listing id changes on relist).
Writes data/relist_history.json (persisted observations) and data/relist.json, data/summary.json."""
import json, os, subprocess, statistics as st, datetime as dt
ROOT=os.path.dirname(os.path.abspath(__file__)); DD=os.path.join(ROOT,'data'); HP=os.path.join(DD,'relist_history.json')
def key(x): return f"{x['name']}|{x.get('server','')}|{x['cls']}"
def norm(t):
    # Action runs stamp UTC as 2026-10-21T00:39; local runs stamp PT as 2026-10-21 00:39. Store all in PT (UTC-7 in Oct).
    if 'T' in t: return (dt.datetime.strptime(t,'%Y-%m-%dT%H:%M')-dt.timedelta(hours=7)).strftime('%Y-%m-%d %H:%M')
    return t
def observe(H,D,src):
    t=norm(D['updated'])
    if t in H['snapshots']: return
    H['snapshots'].append(t)
    for x in D['listings']:
        o=H['chars'].setdefault(key(x),{'name':x['name'],'server':x.get('server'),'cls':x['cls'],'obs':[]})
        o['obs'].append({'t':t,'id':x['id'],'wemix':x['wemix']})
def backfill(H):
    try: revs=subprocess.run(['git','-C',ROOT,'log','--reverse','--format=%h','--','data.json'],capture_output=True,text=True,check=True).stdout.split()
    except Exception: return
    for r in revs:
        try: observe(H,json.loads(subprocess.run(['git','-C',ROOT,'show',f'{r}:data.json'],capture_output=True,text=True,check=True).stdout),'git')
        except Exception: pass
def analyze(H,D,usd):
    snaps=sorted(H['snapshots']); out={}
    for k,o in H['chars'].items():
        obs=sorted(o['obs'],key=lambda z:z['t']); ev=[]
        for a,b in zip(obs,obs[1:]):
            if b['id']!=a['id']:  # new Hofgamer listing id for the same character = delisted and listed again
                ev.append({'t':b['t'],'type':'relist','from':a['wemix'],'to':b['wemix']})
            elif b['wemix']!=a['wemix']: ev.append({'t':b['t'],'type':'price','from':a['wemix'],'to':b['wemix']})
        if ev: out[k]={'events':ev,'first_seen':obs[0]['t'],'first_wemix':obs[0]['wemix']}
    by_id={}
    for x in D['listings']:
        r=out.get(key(x))
        if not r: continue
        f=r['first_wemix']; chg=round((x['wemix']/f-1)*100,1) if f else None
        if chg is not None and abs(chg)<0.05: chg=0.0
        rel=sum(e['type']=='relist' for e in r['events'])
        by_id[x['id']]={'relists':rel,'changes':len(r['events']),'from':f,'to':x['wemix'],'pct':chg,'since':r['first_seen'],
                        'usd_from':round(f*usd),'usd_to':round(x['wemix']*usd)}
    return by_id
def summary(D,H,R,usd):
    L=D['listings']; snaps=sorted(H['snapshots']); now=dt.datetime.strptime(norm(D['updated']),'%Y-%m-%d %H:%M')
    def ago(s): return (now-dt.datetime.strptime(s,'%Y-%m-%d %H:%M')).total_seconds()/3600
    # Hofgamer listed time is UTC+8, data.updated is box PT; compare in UTC
    nowu=now+dt.timedelta(hours=7)
    new24=sum(1 for x in L if x.get('listed') and 0<=(nowu-(dt.datetime.strptime(x['listed'],'%Y-%m-%d %H:%M')-dt.timedelta(hours=8))).total_seconds()<86400)
    sold24=sum(1 for s in D['sales'] if s.get('sold') and (nowu-(dt.datetime.strptime(s['sold'],'%Y-%m-%d %H:%M')-dt.timedelta(hours=8))).total_seconds()<86400)
    parts=[f"{len(L)} live listings", f"{new24} new in the last 24h", f"{sold24} sold in the last 24h"]
    # median ask vs the snapshot closest to 24h ago (needs >=18h of history)
    old=[s for s in snaps if ago(s)>=18]
    if old:
        s0=max(old); prev=[o['wemix'] for c in H['chars'].values() for o in c['obs'] if o['t']==s0]
        m0,m1=st.median(prev),st.median(x['wemix'] for x in L)
        parts.append(f"median ask {m1:,.0f} WEMIX, {(m1/m0-1)*100:+.1f}% vs yesterday")
    else: parts.append(f"median ask {st.median(x['wemix'] for x in L):,.0f} WEMIX (no day-ago snapshot yet to compare)")
    W=json.load(open(os.path.join(DD,'wemix_daily.json'))); d=sorted(W)
    p1=usd; p0=W[d[-2]] if len(d)>1 else None
    parts.append(f"WEMIX ${p1:.4f}"+(f", {(p1/p0-1)*100:+.1f}% in 24h" if p0 else ""))
    nc=sum(1 for v in R.values() if v['pct'] is not None and v['pct']<0); nr=sum(1 for v in R.values() if v['relists'])
    span=ago(snaps[0])/24 if snaps else 0
    parts.append(f"{nr} relisted and {nc} with a price cut" + (f" since tracking started {dt.datetime.strptime(snaps[0][:10],'%Y-%m-%d'):%b %-d}" if snaps and snaps[0][:10]!=norm(D['updated'])[:10] else " (tracking started today)"))
    return parts
def main():
    D=json.load(open(os.path.join(ROOT,'data.json'))); usd=D['wemix_usd']
    H=json.load(open(HP)) if os.path.exists(HP) else None
    if H is None: H={'snapshots':[],'chars':{}}; backfill(H)
    observe(H,D,'run'); json.dump(H,open(HP,'w'),ensure_ascii=False,separators=(',',':'))
    R=analyze(H,D,usd); json.dump({'updated':D['updated'],'by_id':R},open(os.path.join(DD,'relist.json'),'w'),ensure_ascii=False)
    json.dump({'updated':D['updated'],'parts':summary(D,H,R,usd)},open(os.path.join(DD,'summary.json'),'w'),ensure_ascii=False)
    return D,H,R,usd
if __name__=='__main__': main()
