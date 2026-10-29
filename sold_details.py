"""Fetch full details for archived sales that have no snapshot (sold before snapshots began, or sold between refreshes).
Read-only: Hofgamer page + XDRACO public API. Saved to data/snaps/<id>.json with snap_src='late' so the page labels them
as fetched later (they show the character as it is now, which may differ from when it sold).
Usage: python3 sold_details.py [max]   (refresh workflow runs it with a small cap)"""
import json,os,sys,time,signal,socket,datetime as dt,scrape,stones
socket.setdefaulttimeout(60)  # some page/icon fetches have no timeout of their own
from snapshots import D,DROP
KEEP=('id','name','cls','lv','ps','server','listed','sold','wemix')
def missing():
    a=json.load(open('data/sold_archive.json'))
    return [s for s in a if s.get('sold') and s.get('id') and not os.path.exists(f"{D}/{s['id']}.json")]
def _alarm(*a): raise TimeoutError('took over 180s')
signal.signal(signal.SIGALRM,_alarm)
def one(s):
    signal.alarm(180)
    try: return _one(s)
    finally: signal.alarm(0)
def _one(s):
    c=scrape.detail(dict(s))
    if not (c.get('build') or {}).get('gear'): return 0
    try: c['build']['stones']=stones.for_id(s['id'])
    except Exception as e: print('stones fail',s['id'],str(e)[:60],flush=True)
    x={k:v for k,v in c.items() if k not in DROP}; x.update({k:s[k] for k in KEEP if k in s})
    x['snap_src']='late'; x['snap_ts']=dt.datetime.now(dt.timezone(dt.timedelta(hours=-7))).strftime('%Y-%m-%d')
    open(f"{D}/{s['id']}.json",'w').write(json.dumps(x,ensure_ascii=False,separators=(',',':'))); return 1
if __name__=='__main__':
    lim=int(sys.argv[1]) if len(sys.argv)>1 else 10**6; ok=bad=0; fails=[]
    for s in missing()[:lim]:
        try: r=one(s)
        except Exception as e: r=0; print('fail',s['id'],str(e)[:80],flush=True)
        if r: ok+=1
        else: bad+=1; fails.append(s['id'])
        time.sleep(1)
    print(f'sold details: {ok} saved, {bad} not fetchable',fails[:50],flush=True)
