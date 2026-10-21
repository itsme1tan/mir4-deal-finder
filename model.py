"""Full-build fair value: ridge regression on log(WEMIX price) of recent sales, with class as a factor."""
import numpy as np, math, statistics
NUM=[('logps','log power'),('lv','level'),('refined','dragon-refined piece'),('enhance','gear enhance total'),
     ('myth_spirits','Mythical spirit'),('leg_spirits','Legendary spirit'),('potential','potential'),
     ('ldark','log Darksteel'),('lanc','log Ancient Coins')]
LABEL={'refined':'refined gear','enhance':'gear enhance','myth_spirits':'Mythical spirits','leg_spirits':'Legendary spirits',
       'potential':'potential','ldark':'Darksteel','lanc':'Ancient Coins','lv':'level'}
def row(c):
    if any(c.get(k) is None for k in ('refined','enhance','myth_spirits','leg_spirits','potential','darksteel','ancient')): return None
    return dict(logps=math.log(c['ps']),lv=c['lv'],refined=c['refined'],enhance=c['enhance'],myth_spirits=c['myth_spirits'],
                leg_spirits=c['leg_spirits'],potential=c['potential'],ldark=math.log1p(c['darksteel']),lanc=math.log1p(c['ancient']))
class Ridge:
    def fit(s,R,classes,y,lam=1.0):
        s.cls=sorted(set(classes)); s.mu={k:np.mean([r[k] for r in R]) for k,_ in NUM}; s.sd={k:(np.std([r[k] for r in R]) or 1) for k,_ in NUM}
        X=s.X(R,classes); s.ym=y.mean(); P=np.eye(X.shape[1])*lam
        s.w=np.linalg.solve(X.T@X+P,X.T@(y-s.ym)); return s
    def X(s,R,classes):
        return np.array([[ (r[k]-s.mu[k])/s.sd[k] for k,_ in NUM]+[1.0*(c==k) for k in s.cls] for r,c in zip(R,classes)])
    def pred(s,R,classes): return s.X(R,classes)@s.w+s.ym
    def drivers(s,r):
        out=[]
        for i,(k,_) in enumerate(NUM):
            if k=='logps': continue
            pct=(math.exp(0.5*s.w[i]*(r[k]-s.mu[k])/s.sd[k])-1)*100  # half weight: full = geometric blend with power-only
            out.append((LABEL[k],round(pct,1)))
        return sorted(out,key=lambda t:-abs(t[1]))[:3]
def power_only(train,c):
    for f in (lambda s:s['cls']==c['cls'] and abs(s['ps']-c['ps'])<=0.05*c['ps'],lambda s:abs(s['ps']-c['ps'])<=0.05*c['ps'],lambda s:abs(s['ps']-c['ps'])<=0.10*c['ps']):
        comps=[s for s in train if f(s)]
        if len(comps)>=3: break
    return statistics.median(s['wemix']/s['ps'] for s in comps)*c['ps'] if comps else None
def apply(sold,lst,k=10):
    D=[(s,row(s)) for s in sold if s.get('wemix')]; D=[(s,r) for s,r in D if r]
    if len(D)<40: return {'use_full':False,'summary':f'too few sales with details ({len(D)})','n':len(D)}
    e_full=[];e_pow=[]
    D=sorted(D,key=lambda t:t[0]['id'])
    for seed in range(5):
      idx=np.random.default_rng(seed).permutation(len(D))
      for f in np.array_split(idx,k):
        fs=set(f); tr=[D[i] for i in idx if i not in fs]; m=Ridge().fit([r for _,r in tr],[s['cls'] for s,_ in tr],np.log([s['wemix'] for s,_ in tr]))
        for i in f:
          s,r=D[i]; p=math.exp(m.pred([r],[s['cls']])[0]); pp=power_only([t for t,_ in tr],s)
          if pp: e_pow.append(abs(pp-s['wemix'])/s['wemix']); e_full.append(abs(math.sqrt(p*pp)-s['wemix'])/s['wemix'])
    mf,mp=float(np.median(e_full))*100,float(np.median(e_pow))*100; af,ap=float(np.mean(e_full))*100,float(np.mean(e_pow))*100
    m=Ridge().fit([r for _,r in D],[s['cls'] for s,_ in D],np.log([s['wemix'] for s,_ in D]))
    use=mf<mp and af<ap
    rng_ps=(min(s['ps'] for s,_ in D),max(s['ps'] for s,_ in D))
    for c in lst:
        r=row(c)
        if not r: c['fair_full']=None; continue
        pr=math.exp(m.pred([r],[c['cls']])[0]); pp=power_only([t for t,_ in D],c)
        c['fair_model']=round(pr); c['fair_full']=round(math.sqrt(pr*pp)) if pp else round(pr)
        c['drivers']=m.drivers(r)
        n_near=sum(1 for s,_ in D if abs(s['ps']-c['ps'])<=0.08*c['ps'])
        c['full_conf']='ok' if c['cls'] in m.cls and n_near>=5 and c['ps']<=rng_ps[1]*1.05 else 'low'
    coefs={LABEL.get(k,k):round((math.exp(m.w[i]/m.sd[k])-1)*100,2) for i,(k,_) in enumerate(NUM) if k!='logps'}
    elast=round(m.w[0]/m.sd['logps'],2)
    return {'use_full':use,'n':len(D),'cv_mape_full':round(mf,1),'cv_mape_power':round(mp,1),'cv_mean_full':round(af,1),'cv_mean_power':round(ap,1),'n_pow':len(e_pow),
            'pct_per_unit':coefs,'power_elasticity':float(elast),
            'summary':f'{len(D)} sales, CV abs error median {mf:.1f}% / mean {af:.1f}% (full build) vs {mp:.1f}% / {ap:.1f}% (power only)'}
