"""Leaderboards, market trends, upgrade-vs-buy estimates and new-deal alerts. Reads data.json, writes data/*.json.
Read-only analysis of public market data. Run after scrape.py: python3 extras.py"""
import json, math, statistics as st, datetime as dt, csv, os
import numpy as np
BUDGET=25000; ROOT=os.path.dirname(os.path.abspath(__file__)); DD=os.path.join(ROOT,'data')
TS=os.path.join(ROOT,'..','mir4-top-sales')
import buildscore
BANDS=[(0,450000,'under 450k'),(450000,550000,'450k-550k'),(550000,650000,'550k-650k'),(650000,10**9,'650k+')]
def pr(v,pool): return 100*sum(1 for p in pool if p<=v)/len(pool) if pool else None
def score_pool(chars):
    by={}
    for c in chars: by.setdefault(c['cls'],[]).append(c)
    for cls,L in by.items():
        for c in L:
            s=0;ok=True
            for k,w in buildscore.weights(cls).items():
                pool=[x[k] for x in L if x.get(k) is not None]
                if c.get(k) is None: ok=False;break
                s+=w*pr(c[k],pool)
            c['_bs']=round(s) if ok else None
def leaderboards(D,usd):
    L=D['listings']; S=[dict(s) for s in D['sales'] if s.get('wemix')]
    score_pool(S)
    out={}
    for cls in sorted({x['cls'] for x in L}|{s['cls'] for s in S}):
        li=[x for x in L if x['cls']==cls and x.get('build_score') is not None]
        li.sort(key=lambda x:(-x['build_score'],x['usd']))
        so=[s for s in S if s['cls']==cls and s.get('_bs') is not None]
        so.sort(key=lambda s:(-s['_bs'],-s['ps']))
        out[cls]={'listed':[{'id':x['id'],'name':x['name'],'ps':x['ps'],'lv':x['lv'],'bs':x['build_score'],'usd':round(x['usd']),
                   'fair_usd':round((x.get('fair_head') or x['fair_full'])*usd) if x.get('fair_full') else None,'disc':x.get('discount'),
                   'in_budget':x['usd']<=BUDGET} for x in li[:10]],
                  'sold':[{'id':s['id'],'name':s['name'],'ps':s['ps'],'lv':s['lv'],'bs':s['_bs'],'usd':round(s['wemix']*usd),'date':s['sold'][:10]} for s in so[:10]]}
    # all-time top sold by power from the research files (Hofgamer since ~Mar 2026 + XDRACO last 30d)
    top={}
    try:
        for r in csv.DictReader(open(os.path.join(TS,'top_sales.csv'))):
            if not r['usd'] or not r['power']: continue
            top.setdefault(r['cls'],{})[r['id']]={'name':r['name'],'ps':int(float(r['power'])),'usd':round(float(r['usd'])),'date':r['sold_date'],'src':'Hofgamer','url':r['url']}
        for r in csv.DictReader(open(os.path.join(TS,'xdraco_top_trades.csv'))):
            if not r['usd'] or not r['power']: continue
            top.setdefault(r['cls'],{}).setdefault(r['seq'],{'name':r['name'],'ps':int(float(r['power'])),'usd':round(float(r['usd'])),'date':r['trade_time_pt'][:10],'src':'XDRACO','url':r['url']})
    except FileNotFoundError: pass
    for cls,m in top.items():
        out.setdefault(cls,{'listed':[],'sold':[]})['top_ever']=sorted(m.values(),key=lambda r:-r['ps'])[:8]
    return out
def trends(D,usd):
    S=[s for s in D['sales'] if s.get('wemix') and s.get('sold')]
    rows=[]
    for s in S: rows.append((dt.datetime.strptime(s['sold'],'%Y-%m-%d %H:%M'),s['ps'],s['wemix']*usd,s['wemix']/s['ps']*1000))
    wk={}
    for t,ps,u,per in rows:
        b=next(l for lo,hi,l in BANDS if lo<=ps<hi); w=(t-dt.timedelta(days=t.weekday())).strftime('%Y-%m-%d')
        wk.setdefault(b,{}).setdefault(w,[]).append(per)
    series={b:[{'week':w,'med_wemix_per_1k':round(st.median(v),1),'n':len(v)} for w,v in sorted(m.items())] for b,m in wk.items()}
    dow=[[] for _ in range(7)]; hr=[[] for _ in range(24)]
    for t,ps,u,per in rows: dow[t.weekday()].append(per); hr[t.hour].append(per)
    allmed=st.median(r[3] for r in rows)
    dowo=[{'d':'Mon Tue Wed Thu Fri Sat Sun'.split()[i],'n':len(v),'rel':round((st.median(v)/allmed-1)*100,1) if len(v)>=8 else None} for i,v in enumerate(dow)]
    blocks=[(0,6),(6,12),(12,18),(18,24)]
    hro=[{'h':f'{a:02d}-{b:02d}','n':sum(len(hr[h]) for h in range(a,b)),'rel':(lambda v:round((st.median(v)/allmed-1)*100,1) if len(v)>=15 else None)([p for h in range(a,b) for p in hr[h]])} for a,b in blocks]
    # overall drift: slope of log(price per 1k power) vs days, controlling for nothing else
    t0=min(r[0] for r in rows); x=np.array([(r[0]-t0).days for r in rows]); y=np.log([r[3] for r in rows])
    slope=np.polyfit(x,y,1)[0]; per30=(math.exp(slope*30)-1)*100
    # bootstrap uncertainty
    rng=np.random.default_rng(0); bs=[]
    for _ in range(400):
        i=rng.integers(0,len(x),len(x)); bs.append((math.exp(np.polyfit(x[i],y[i],1)[0]*30)-1)*100)
    lo,hi=np.percentile(bs,[10,90])
    vd=[]
    if lo>0: vd.append(f'Prices per power point have been rising, about {per30:+.0f}% per 30 days (range {lo:+.0f}% to {hi:+.0f}%). Waiting has tended to cost more, so buying a good deal sooner is reasonable.')
    elif hi<0: vd.append(f'Prices per power point have been falling, about {per30:+.0f}% per 30 days (range {lo:+.0f}% to {hi:+.0f}%). There is no rush; waiting has tended to get a lower price.')
    else: vd.append(f'No clear price trend: about {per30:+.0f}% per 30 days, but the range ({lo:+.0f}% to {hi:+.0f}%) includes zero. Timing the market will not matter much; the price vs fair value of each character matters more.')
    good=[d for d in dowo if d['rel'] is not None]
    if good:
        c=min(good,key=lambda d:d['rel']); e=max(good,key=lambda d:d['rel'])
        if e['rel']-c['rel']>=15: vd.append(f'Sales on {c["d"]} went about {abs(c["rel"]):.0f}% {"below" if c["rel"]<0 else "above"} the typical price, and on {e["d"]} about {abs(e["rel"]):.0f}% {"above" if e["rel"]>0 else "below"}. With only {c["n"]} and {e["n"]} sales, treat this as a weak hint, not a rule.')
        else: vd.append('Day of week shows no meaningful pattern (gaps under 15%, small samples).')
    vd.append(f'Based on {len(rows)} detailed sales from {t0:%b %d} to {max(r[0] for r in rows):%b %d}, mostly 400k+ power. Thin data: read this as a rough signal.')
    return {'series':series,'bands':[b[2] for b in BANDS],'dow':dowo,'hours':hro,'per30':round(per30,1),'per30_range':[round(lo,1),round(hi,1)],'n':len(rows),'verdict':vd,
            'tz_note':'Times are Hofgamer site time (an Asia time zone, not Pacific).'}
def upgrade(D,usd):
    """Market-implied cost of power: fit log(price) = a + b*log(power) per class on sales; extra power costs curve(P_target)-curve(P_now)."""
    S=[s for s in D['sales'] if s.get('wemix')]; L=D['listings']
    x=np.log([s['ps'] for s in S]); y=np.log([s['wemix'] for s in S]); cls=sorted({s['cls'] for s in S})
    X=np.column_stack([x]+[[1.0*(s['cls']==c) for s in S] for c in cls]); w=np.linalg.lstsq(X,y,rcond=None)[0]
    b=float(w[0]); ce={c:float(w[1+i]) for i,c in enumerate(cls)}
    def curve(c,ps): return math.exp(ce.get(c,np.mean(list(ce.values())))+b*math.log(ps))*usd
    res=np.array(y-X@w); spread=float(np.median(np.abs(np.exp(res)-1))*100)
    out=[]
    for c in L:
        if not c.get('fair_full'): continue
        targets=[]
        for mult in (1.1,1.2):
            tp=round(c['ps']*mult,-3)
            pay=curve(c['cls'],tp)-curve(c['cls'],c['ps'])
            built=[z for z in L if z['cls']==c['cls'] and z['ps']>=tp]
            ch=min(built,key=lambda z:z['usd']) if built else None
            near=[s['wemix']*usd for s in S if s['cls']==c['cls'] and abs(s['ps']-tp)<=0.06*tp]
            targets.append({'ps':tp,'step_usd':round(pay),'path_usd':round(c['usd']+pay),
                            'built_ask':{'id':ch['id'],'name':ch['name'],'ps':ch['ps'],'usd':round(ch['usd'])} if ch else None,
                            'built_sold_med':round(st.median(near)) if len(near)>=3 else None,'built_sold_n':len(near)})
        out.append({'id':c['id'],'targets':targets})
    return {'by_id':{o['id']:o['targets'] for o in out},'elasticity':round(b,2),'fit_err':round(spread),
            'method':f'Fit on {len(S)} real sales: price grows with power to the power {b:.2f} (each class has its own level). The cost to go from your power to a target power is the price gap between the two on that curve, i.e. what the market charges for the extra power. Typical error of the curve is about {spread:.0f}%. In-game material costs (Darksteel, crafting mats, spirit pulls, gacha) are not available as data, so this does NOT tell you what grinding or buying materials would cost. It is a market-value estimate only.'}
def deals(D,usd):
    L=D['listings']; prev_p=os.path.join(DD,'prev_listings.json')
    prev=set(json.load(open(prev_p))['ids']) if os.path.exists(prev_p) else None
    by={}
    for x in L:
        if x.get('build_score') is not None: by.setdefault(x['cls'],[]).append(x['build_score'])
    out=[]
    for x in L:
        if x.get('build_score') is None or not x.get('fair_full'): continue
        cut=np.percentile(by[x['cls']],80)
        fair=(x.get('fair_head') or x['fair_full'])*usd
        if x['build_score']>=cut and x['usd']<=fair and x['usd']<=BUDGET and (prev is None or x['id'] not in prev):
            out.append({'id':x['id'],'name':x['name'],'cls':x['cls'],'ps':x['ps'],'build_score':x['build_score'],'usd':round(x['usd']),'fair_usd':round(fair),
                        'pct_under':round((1-x['usd']/fair)*100,1),'usd_under':round(fair-x['usd']),'link':f'https://nft.hofgamer.com/mir4/nft/{x["id"]}'})
    out.sort(key=lambda d:(-d['build_score'],d['usd']))
    json.dump({'updated':D['updated'],'first_run':prev is None,'budget_usd':BUDGET,'rule':'new since last run, build score in top 20%% of class, price at or under fair, at most $%d'%BUDGET,'deals':out},open(os.path.join(DD,'new_deals.json'),'w'),indent=1,ensure_ascii=False)
    json.dump({'updated':D['updated'],'ids':[x['id'] for x in L]},open(prev_p,'w'))
    return len(out)
def main():
    os.makedirs(DD,exist_ok=True); D=json.load(open(os.path.join(ROOT,'data.json'))); usd=D['wemix_usd']
    E={'updated':D['updated'],'budget':BUDGET,'leaderboards':leaderboards(D,usd),'trends':trends(D,usd),'upgrade':upgrade(D,usd)}
    json.dump(E,open(os.path.join(DD,'extras.json'),'w'),ensure_ascii=False,separators=(',',':'))
    print('extras ok, new deals:',deals(D,usd))

def wemix_hist():
    """Daily WEMIX/USD from CoinGecko, merged into data/wemix_daily.json so history survives API gaps."""
    p=os.path.join(DD,'wemix_daily.json'); cache=json.load(open(p)) if os.path.exists(p) else {}
    try:
        import urllib.request
        r=urllib.request.urlopen(urllib.request.Request('https://api.coingecko.com/api/v3/coins/wemix-token/market_chart?vs_currency=usd&days=365&interval=daily',headers={'User-Agent':'mir4-deal-finder'}),timeout=30)
        for ms,v in json.load(r)['prices']: cache[dt.datetime.fromtimestamp(ms/1000,dt.timezone.utc).strftime('%Y-%m-%d')]=round(v,5)
        json.dump(dict(sorted(cache.items())),open(p,'w'),indent=0)
    except Exception as e: print('wemix history fetch failed, using cache:',e)
    return cache
def corr_p(a,b,rng):
    a=np.array(a,float);b=np.array(b,float)
    if len(a)<8 or a.std()==0 or b.std()==0: return None,None
    r=float(np.corrcoef(a,b)[0,1]); perm=[abs(np.corrcoef(a,rng.permutation(b))[0,1]) for _ in range(2000)]
    return round(r,2),round(float(np.mean(np.array(perm)>=abs(r))),3)
def wemix_study(D):
    px=wemix_hist(); S=[s for s in D['sales'] if s.get('wemix') and s.get('sold')]
    days=sorted({s['sold'][:10] for s in S}); d0,d1=days[0],days[-1]
    allday=[(dt.date.fromisoformat(d0)+dt.timedelta(i)).isoformat() for i in range((dt.date.fromisoformat(d1)-dt.date.fromisoformat(d0)).days+1)]
    cnt={d:0 for d in allday}; per={d:[] for d in allday}; usdp={d:[] for d in allday}
    for s in S:
        d=s['sold'][:10]; cnt[d]+=1; per[d].append(s['wemix']/s['ps']*1000)
        if px.get(d): usdp[d].append(s['wemix']*px[d]/s['ps']*1000)
    pr_=[px.get(d) for d in allday]
    rng=np.random.default_rng(1); res=[]
    def chg(i): 
        a,b=pr_[i-1] if i>0 else None,pr_[i]
        return (b/a-1)*100 if a and b else None
    for lag in range(8):  # WEMIX on day t vs sales on day t+lag
        A=[];B=[];C=[];Dd=[];U=[];Ub=[]
        for i,d in enumerate(allday):
            j=i+lag
            if j>=len(allday) or pr_[i] is None: continue
            A.append(pr_[i]);B.append(cnt[allday[j]])
            c=chg(i)
            if c is not None: C.append(c);Dd.append(cnt[allday[j]])
            if usdp[allday[j]]: U.append(pr_[i]);Ub.append(st.median(usdp[allday[j]]))
        r1,p1=corr_p(A,B,rng);r2,p2=corr_p(C,Dd,rng);r3,p3=corr_p(U,Ub,rng)
        res.append({'lag':lag,'price_vs_count':[r1,p1],'change_vs_count':[r2,p2],'price_vs_usd_per1k':[r3,p3],'n':len(A)})
    # weekly overlay
    wk={}
    for d in allday:
        w=(dt.date.fromisoformat(d)-dt.timedelta(days=dt.date.fromisoformat(d).weekday())).isoformat()
        e=wk.setdefault(w,{'n':0,'per':[],'px':[]}); e['n']+=cnt[d]; e['per']+=per[d]
        if px.get(d): e['px'].append(px[d])
    weekly=[{'week':w,'sales':e['n'],'med_per1k':round(st.median(e['per']),1) if e['per'] else None,'wemix':round(st.mean(e['px']),4) if e['px'] else None} for w,e in sorted(wk.items())]
    daily=[{'d':d,'wemix':px.get(d),'sales':cnt[d]} for d in allday]
    sig=[(k,r['lag'],r[k]) for r in res for k in ('price_vs_count','change_vs_count') if r[k][1] is not None and r[k][1]<0.05]
    pv=[r['price_vs_count'][0] for r in res if r['price_vs_count'][0] is not None]; cv=[r['change_vs_count'][0] for r in res if r['change_vs_count'][0] is not None]
    w=[x['wemix'] for x in daily if x['wemix']]; lo,hi=min(w),max(w)
    vd=[f'WEMIX moved between ${lo:.3f} and ${hi:.3f} ({(hi/lo-1)*100:.0f}% range) from {d0} to {d1}, across {len(S)} sales over {len(allday)} days (about {len(S)/len(allday):.1f} sales a day).']
    expect=0.4  # 16 tests: about 0.8 "significant" by luck at p<0.05
    if not sig: vd.append(f'No real link found: WEMIX price vs number of sales ranged r={min(pv):+.2f} to {max(pv):+.2f} and daily % change vs sales r={min(cv):+.2f} to {max(cv):+.2f} across lags of 0 to 7 days, none statistically meaningful. "More characters sell when WEMIX dips" is not supported by this data.')
    else: vd.append('Possible link at '+', '.join(f'{"price" if k=="price_vs_count" else "daily change"} lag {l}d (r={v[0]:+.2f}, p={v[1]})' for k,l,v in sig)+f'. With 16 tests, about 1 false hit is expected by chance, so treat this as weak unless it repeats with more data.')
    r0=res[0]['price_vs_usd_per1k']
    vd.append(f'Listings are priced in WEMIX, so USD prices move with the token: same-day WEMIX price vs median USD per 1k power r={r0[0]:+.2f}. If WEMIX dips and sellers do not raise their WEMIX asks, the same character costs fewer dollars.')
    vd.append('Note: the sales list is the detailed comparable sales the site tracks (about 400k+ power), not every MIR4 trade, so the count is a sample.')
    return {'weekly':weekly,'daily':daily,'lags':res,'verdict':vd,'source':'CoinGecko daily close (UTC), cached in data/wemix_daily.json'}
_main=main
def main():
    _main()
    p=os.path.join(DD,'extras.json'); E=json.load(open(p)); E['wemix']=wemix_study(json.load(open(os.path.join(ROOT,'data.json'))))
    json.dump(E,open(p,'w'),ensure_ascii=False,separators=(',',':'))
    import relist; relist.main()  # relist/price-change history + daily summary line
if __name__=='__main__': main()
