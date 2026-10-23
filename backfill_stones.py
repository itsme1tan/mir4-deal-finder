"""Add magic stone stats to existing sold snapshots where Hofgamer still has the page. Read-only, rate-limited."""
import json,os,glob,time,sys,stones
from snapshots import D
lim=int(sys.argv[1]) if len(sys.argv)>1 else 10000; got=miss=skip=0
for p in sorted(glob.glob(f'{D}/*.json')):
    x=json.load(open(p))
    if (x.get('build') or {}).get('stones') is not None: skip+=1; continue
    if got+miss>=lim: break
    try: s=stones.for_id(x['id'])
    except Exception as e: s=[]; print('fail',x['id'],e,flush=True)
    x.setdefault('build',{})['stones']=s; open(p,'w').write(json.dumps(x,ensure_ascii=False,separators=(',',':')))
    if any(z.get('ok') for z in s):
        got+=1; print('stats',x['id'],len(s),flush=True)
    else: miss+=1; print('nostats',x['id'],len(s),flush=True)
    time.sleep(1)
print('stones backfill: with stats',got,'list only/none',miss,'already',skip)
