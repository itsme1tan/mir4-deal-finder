"""Daily power snapshot (read-only, public): global top 1000 from forum.mir4global.com/rank?ranktype=1, about 1 request per second.
Writes data/power_history/<YYYY-MM-DD>.json ([rank,name,server,classicon,power]) and rebuilds data/power_history/series.json:
power over time per character (name|server) from ranking snapshots plus our XDRACO records (sales, listings, saved pages, chain metadata).
Usage: python3 power_snap.py [--no-fetch]"""
import json,os,re,sys,time,html,glob,datetime,urllib.request
from zoneinfo import ZoneInfo
ROOT=os.path.dirname(os.path.abspath(__file__));PH=os.path.join(ROOT,'data','power_history');LA=ZoneInfo('America/Los_Angeles')
UA={'User-Agent':'Mozilla/5.0 (mir4-deal-finder; read-only)'}
SCAN=os.environ.get('SEQSCAN','/tmp/seqscan.jsonl')  # box-side XDRACO listing scan, optional
def fetch():
    out=[];seen=set()
    for p in range(1,40):
        u=f'https://forum.mir4global.com/rank?ranktype=1&worldgroupid=0&worldid=0&classtype=&searchname=&loaded=1&liststyle=ol&page={p}'
        h=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read().decode('utf8','ignore')
        rows=re.findall(r'<span class="num">(\d+)</span>.*?char_(\d+)\.png.*?<span class="user_name">(.*?)</span>.*?<td>\s*<span>(.*?)</span>.*?<td class="text_right">\s*<span>([\d,]+)</span>',h,re.S)
        new=0
        for r,ci,n,sv,pw in rows:
            if int(r) in seen: continue
            seen.add(int(r));new+=1;out.append([int(r),html.unescape(n).strip(),sv.strip(),ci,int(pw.replace(',',''))])
        if not new or len(out)>=1000: break
        time.sleep(1)
    return sorted(out)[:1000]
def series():
    S={};add=lambda n,sv,t,p,src:(n and sv and p) and S.setdefault(f'{n}|{sv}',{}).setdefault(t[:10],[int(p),src])
    for f in sorted(glob.glob(os.path.join(PH,'20*.json'))):
        d=os.path.basename(f)[:10]
        for r,n,sv,ci,pw in json.load(open(f)): add(n,sv,d,pw,'r')
    H8=lambda s:datetime.datetime.strptime(s,'%Y-%m-%d %H:%M').replace(tzinfo=ZoneInfo('Asia/Shanghai')).astimezone(LA).strftime('%Y-%m-%d')
    try: SA=json.load(open(os.path.join(ROOT,'data','sold_archive.json')))
    except Exception: SA=[]
    for x in SA:
        if x.get('sold') and x.get('ps'): add(x['name'],x.get('server'),H8(x['sold']),x['ps'],'s')
    for f in glob.glob(os.path.join(ROOT,'data','snaps','*.json')):
        try: x=json.load(open(f))
        except Exception: continue
        if x.get('snap_src')=='late': continue  # fetched later; its power is from today, not the sale day
        t=x.get('listed') or x.get('sold')
        if t and x.get('ps'): add(x['name'],x.get('server'),H8(t),x['ps'],'l')
    try: D=json.load(open(os.path.join(ROOT,'data.json')))
    except Exception: D={}
    for x in D.get('listings',[]):
        if x.get('listed') and x.get('ps'): add(x['name'],x.get('server'),H8(x['listed']),x['ps'],'l')
    try: NC=json.load(open(os.path.join(ROOT,'data','chain_history.json')))
    except Exception: NC={}
    for r in NC.values():
        n=r.get('now') or {}
        if n.get('server') and n.get('ps'): add(n['name'],n['server'],n['t'],n['ps'],'c')
    # XDRACO listing records from the box scan; listing day estimated from the listing number using our dated sales
    pts=sorted((x['id'],H8(x['listed'])) for x in SA if x.get('listed'))
    if os.path.exists(SCAN) and len(pts)>1:
        import bisect;ids=[p[0] for p in pts];D0=lambda s:datetime.date.fromisoformat(s)
        def est(q):
            i=bisect.bisect_left(ids,q);a,b=(pts[0],pts[-1]) if i<=0 or i>=len(pts) else (pts[i-1],pts[i])
            if a[0]==b[0]: return a[1]
            return (D0(a[1])+(D0(b[1])-D0(a[1]))*((q-a[0])/(b[0]-a[0]))).isoformat()
        for l in open(SCAN):
            try: r=json.loads(l)
            except Exception: continue
            if r.get('code')==200 and r.get('ps') and r.get('server'): add(r['name'],r['server'],est(r['seq']),r['ps'],'x')
    S={k:sorted([d,v[0],v[1]] for d,v in s.items()) for k,s in S.items()}
    # fastest growing: ranking snapshots only, so every character is measured the same way
    days=sorted(os.path.basename(f)[:10] for f in glob.glob(os.path.join(PH,'20*.json')))
    G={}
    if len(days)>=2:
        last=days[-1]
        for w in (7,30):
            cut=(datetime.date.fromisoformat(last)-datetime.timedelta(days=w)).isoformat();L=[]
            for k,pts in S.items():
                r=[p for p in pts if p[2]=='r'];a=[p for p in r if p[0]>=cut]
                if len(a)>=2 and a[-1][0]==last: L.append([k,a[-1][1]-a[0][1],a[0][0],a[-1][1]])
            G[str(w)]=sorted(L,key=lambda x:-x[1])[:50]
    json.dump({'days':days,'growth':G,'s':S},open(os.path.join(PH,'series.json'),'w'),ensure_ascii=False,separators=(',',':'))
    return S,days
if __name__=='__main__':
    os.makedirs(PH,exist_ok=True)
    if '--no-fetch' not in sys.argv:
        R=fetch();d=datetime.datetime.now(LA).strftime('%Y-%m-%d')
        if len(R)>=500: json.dump(R,open(os.path.join(PH,d+'.json'),'w'),ensure_ascii=False,separators=(',',':'))
        print('ranking rows',len(R))
    S,days=series();print('characters',len(S),'with 2+ points',sum(1 for v in S.values() if len(v)>=2),'ranking days',days)
