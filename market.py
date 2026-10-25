"""Post-pricing step, run on data.json after each scrape (idempotent).
1) Market factor: median(sold / model fair) over the last 14 days of sales, fair predicted by a model fitted only on older sales
   (out of sample). Headline fair values are scaled by it, so % under/over reflects what similar characters sell for now.
2) Listing age: Hofgamer gives each listing's 'listed' time (UTC+8), but a relist gets a new listing and a new time.
   So age = earliest of that time and our tracker's first sighting of the same character (name|server|class, tracked since 2026-10-20).
Rules from the sold history (488 sales, Mar-Oct 2026): median sale 7h after listing, 75% within 1.1 days, 90% within 5.3 days,
only 7% after 7+ days. Stale = on market 7+ days. Fresh = under 24h and already 10%+ under adjusted fair."""
import json, os, math, statistics as st, datetime as dt
import numpy as np, model
ROOT=os.path.dirname(os.path.abspath(__file__)); P=lambda t:dt.datetime.strptime(t[:16],'%Y-%m-%d %H:%M')
STALE_D=7; FRESH_H=24; FRESH_DISC=10; WIN=14
def factor(sales):
    """Recent sales vs the same model the live fair values use (fit on all 90-day sales), power comps leave-one-out."""
    D=[(s,model.row(s)) for s in sales if s.get('wemix') and s.get('ps') and s.get('sold')]; D=[(s,r) for s,r in D if r]
    if len(D)<40: return 1.0,0
    A={k:(k,l) for k,l in model.BASE+model.STAT}; model.NUM=[A[k] for k in model.KEEP]
    m=model.Ridge().fit([r for _,r in D],[s['cls'] for s,_ in D],np.log([s['wemix'] for s,_ in D]))
    end=max(P(s['sold']) for s,_ in D); out=[]
    for s,r in D:
        if (end-P(s['sold'])).total_seconds()>=WIN*86400: continue
        pp=model.power_only([t for t,_ in D if t is not s],s)
        if pp: out.append(s['wemix']/math.sqrt(math.exp(m.pred([r],[s['cls']])[0])*pp))
    return (float(np.median(out)) if len(out)>=8 else 1.0),len(out)
def main():
    fp=os.path.join(ROOT,'data.json'); D=json.load(open(fp))
    f,n=factor(D['sales']); f=min(1.15,max(0.85,f))
    D['market']={'factor':round(f,3),'n':n,'days':WIN,'note':f"market {(f-1)*100:+.0f}% vs model" if abs(f-1)>=0.01 else 'market in line with model'}
    for c in D['listings']:
        if c.get('fair_head_model') is None: c['fair_head_model']=c.get('fair_head')
        fv=c['fair_head_model']
        if not fv: continue
        fv=round(fv*f); c['fair_head']=fv
        c['discount_model']=round((c['fair_head_model']-c['wemix'])/c['fair_head_model']*100,1)
        c['discount']=round((fv-c['wemix'])/fv*100,1); c['flip_margin']=round((fv*0.95-c['wemix'])/c['wemix']*100,1)
        c['deal']=bool(c['discount']>=15 and (c.get('fair_basis')=='full build' or c.get('comps_n',0)>=3))
    try: CH=json.load(open(os.path.join(ROOT,'data','char_history.json')))['chars']
    except Exception: CH={}
    now=P(D['updated'])  # PT
    global TRACK0
    try: TRACK0=P(min(json.load(open(os.path.join(ROOT,'data','relist_history.json')))['snapshots']))
    except Exception: TRACK0=None
    # Listing ids are sequential, so a listing's real start time can be read off nearby ids with a known 'listed' time.
    try: RH=json.load(open(os.path.join(ROOT,'data','relist_history.json'))).get('chars',{})
    except Exception: RH={}
    try: AR=json.load(open(os.path.join(ROOT,'data','sold_archive.json')))
    except Exception: AR=[]
    PAIRS=sorted({(int(x['id']),x['listed']) for x in AR+D.get('sales',[])+D['listings'] if x.get('id') and x.get('listed')})
    def id_time(i):
        import bisect
        ids=[p[0] for p in PAIRS]; k=bisect.bisect_left(ids,i)
        if k<len(ids) and ids[k]==i: return P(PAIRS[k][1])-dt.timedelta(hours=15),0
        if k==0 or k==len(ids): return None,None
        (i0,t0),(i1,t1)=PAIRS[k-1],PAIRS[k]; t0,t1=P(t0),P(t1)
        if t1<t0: return None,None
        return t0+(t1-t0)*((i-i0)/(i1-i0))-dt.timedelta(hours=15),(t1-t0).total_seconds()/3600
    for c in D['listings']:
        k=f"{c['name']}|{c.get('server','')}|{c['cls']}"; h=CH.get(k)
        t=[P(c['listed'])-dt.timedelta(hours=15)] if c.get('listed') else []  # UTC+8 -> PT
        H0=TRACK0
        if h: t.append(P(h['first_seen']))
        if not t: continue
        lt=t[0] if c.get('listed') else None; first=min(t); c['age_plus']=bool(H0 and h and P(h['first_seen'])<=H0 and (lt is None or lt>H0))  # seen at the tracker's first snapshot: real age may be longer
        c.pop('age_est',None)
        if c['age_plus']:
            ob=(RH.get(k) or {}).get('obs') or []
            fid=min([o['id'] for o in ob if o.get('id')] or [0])
            if fid:
                et,span=id_time(int(fid))
                if et and span is not None and span<=24:
                    first=min(first,et); c['age_plus']=False; c['age_est']=round(span,1)  # estimated from the listing number; span = hours between the two known neighbours
        c['age_d']=round(max(0,(now-first).total_seconds()/86400),1); c['on_since']=first.strftime('%Y-%m-%d %H:%M')
        ev=h['events'] if h else []
        cuts=[e for e in ev if e['type'] in('price','relisted') and e.get('from') and e.get('wemix') and e['wemix']<e['from']]
        c['cut_n']=len(cuts); c['cut_pct']=round((c['wemix']/cuts[0]['from']-1)*100,1) if cuts else 0
        c['stale']=c['age_d']>=STALE_D; c['fresh']=c['age_d']*24<FRESH_H and (c.get('discount') or -99)>=FRESH_DISC
    H=json.load(open(os.path.join(ROOT,'data','relist_history.json'))) if os.path.exists(os.path.join(ROOT,'data','relist_history.json')) else {'snapshots':[]}
    D['age']={'tracking_since':min(H['snapshots']) if H['snapshots'] else None,'stale_d':STALE_D,'fresh_h':FRESH_H,'fresh_disc':FRESH_DISC}
    json.dump(D,open(fp+'.tmp','w'),ensure_ascii=False); os.replace(fp+'.tmp',fp)
    print('market factor',f,'n',n)
if __name__=='__main__': main()
