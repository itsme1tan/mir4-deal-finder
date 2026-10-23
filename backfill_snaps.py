"""One-off/occasional: rebuild detail snapshots for archived sold characters from the public Hofgamer page + XDRACO read-only API. Read-only, rate-limited."""
import json,os,sys,time
import scrape,xdetail
from snapshots import save,D
lim=int(sys.argv[1]) if len(sys.argv)>1 else 1000
A=json.load(open(os.environ.get('SA','data/sold_archive.json'))); n=0
for s in A:
    if n>=lim: break
    if os.path.exists(f"{D}/{s['id']}.json"): continue
    c=dict(s)
    try:
        scrape.detail(c)
        try:
            x=xdetail.summarize(s['id'])
            if x: c.update({k:v for k,v in x.items() if k!='x_seq'})
        except Exception as e: print('xdetail',s['id'],e)
        save(c,'backfill'); n+=1; print('ok',s['id'],s['name'],flush=True)
    except Exception as e: print('fail',s['id'],e,flush=True)
    time.sleep(2)
print('backfilled',n)
