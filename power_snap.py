"""Daily power snapshot (read-only, public): global top 1000 from forum.mir4global.com/rank?ranktype=1, about 1 request per second.
Also the top 100 of every live server -> data/power_history/servers/<YYYY-MM-DD>.json.
Writes data/power_history/<YYYY-MM-DD>.json ([rank,name,server,classicon,power,clan]) and rebuilds data/power_history/series.json:
power over time per character (name|server) from ranking snapshots plus our XDRACO records (sales, listings, saved pages, chain metadata).
Clan name and class icon come from the official ranking HTML (already in each row) and are stored as series.json "clan" and "cls" maps, latest snapshot wins.
Older 5-field snapshots without clan still load. Usage: python3 power_snap.py [--no-fetch]"""
import json,os,re,sys,time,html,glob,datetime,urllib.request,hashlib
from zoneinfo import ZoneInfo
ROOT=os.path.dirname(os.path.abspath(__file__));PH=os.path.join(ROOT,'data','power_history');LA=ZoneInfo('America/Los_Angeles')
UA={'User-Agent':'Mozilla/5.0 (mir4-deal-finder; read-only)'}
SCAN=os.environ.get('SEQSCAN','/tmp/seqscan.jsonl')  # box-side XDRACO listing scan, optional
MIN_SERVERS=15  # blank/closed worlds are skipped; only live servers must clear this floor
# Official ranking row: rank, class icon, name, then server (global pages only), clan, power.
RE_GLOBAL=re.compile(r'<span class="num">(\d+)</span>.*?char_(\d+)\.png.*?<span class="user_name">(.*?)</span>.*?<td>\s*<span>(.*?)</span>\s*</td>\s*<td>\s*<span>(.*?)</span>\s*</td>\s*<td class="text_right">\s*<span>([\d,]+)</span>',re.S)
# Per-server pages omit the server column; clan sits just before power.
RE_SERVER=re.compile(r'<span class="num">(\d+)</span>.*?char_(\d+)\.png.*?<span class="user_name">(.*?)</span>.*?<td>\s*<span>(.*?)</span>\s*</td>\s*<td class="text_right">\s*<span>([\d,]+)</span>',re.S)
def _bust(): return str(int(time.time()*1000))
def _clan(s): return html.unescape(s or '').strip()
def fetch():
    out=[];seen=set();p=1;empty=0
    while p<40 and len(out)<1000:
        u=f'https://forum.mir4global.com/rank?ranktype=1&worldgroupid=0&worldid=0&classtype=&searchname=&loaded=1&liststyle=ol&page={p}&_={_bust()}'
        h=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read().decode('utf8','ignore')
        rows=RE_GLOBAL.findall(h)
        new=0
        for r,ci,n,sv,cl,pw in rows:
            if int(r) in seen: continue
            seen.add(int(r));new+=1;out.append([int(r),html.unescape(n).strip(),sv.strip(),ci,int(pw.replace(',','')),_clan(cl)])
        if new:
            empty=0;p+=1;time.sleep(1)
        else:
            # Rank pages sometimes repeat page 1; retry the same page once before giving up.
            empty+=1
            if empty>=2: break
            time.sleep(2)
    return sorted(out)[:1000]
def fetch_servers():
    """Top 100 of every live server (one page each). Blank bodies mean closed/merged worlds and are skipped."""
    h=urllib.request.urlopen(urllib.request.Request(f'https://forum.mir4global.com/rank?ranktype=1&_={_bust()}',headers=UA),timeout=30).read().decode('utf8','ignore')
    W=sorted(set(re.findall(r"set_world\('(\d+)', '[^']*', '(\d+)', '([^']*)'\)",h)));out=[];empty=[];errors=[]
    for g,w,name in W:
        if g=='0' or w=='999': continue
        u=f'https://forum.mir4global.com/rank?ranktype=1&worldgroupid={g}&worldid={w}&classtype=&searchname=&loaded=1&liststyle=ol&page=1&_={_bust()}'
        t='';raw=b''
        for attempt in range(3):
            try:
                raw=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read()
                t=raw.decode('utf8','ignore')
                # blank/whitespace body = closed or merged world; skip without burning retries
                if len(raw.strip())==0:
                    break
                if len(raw.strip())>=100: break
                time.sleep(2)
            except Exception as e:
                errors.append((name,str(e)[:60]));t='';raw=b'';time.sleep(2)
        rows=RE_SERVER.findall(t)
        if not rows:
            empty.append(name);time.sleep(1);continue
        for r,ci,n,cl,pw in rows[:100]: out.append([int(r),html.unescape(n).strip(),name,ci,int(pw.replace(',','')),_clan(cl)])
        time.sleep(1)
    print('server ok',len({r[2] for r in out}),'empty',len(empty),'errors',len(errors))
    if empty: print('server empty (closed/skipped)',','.join(empty[:40])+('...' if len(empty)>40 else ''))
    if errors: print('server errors',';'.join(f'{n}:{e}' for n,e in errors[:10]))
    return out
def _server_stale(V, R, d=None):
    """True if this server snapshot looks frozen (byte-identical to previous day) or disagrees badly with today's global fetch."""
    prevs=[f for f in sorted(glob.glob(os.path.join(PH,'servers','20*.json'))) if d is None or os.path.basename(f)[:10]!=d]
    raw=json.dumps(V,ensure_ascii=False,separators=(',',':')).encode()
    if prevs and open(prevs[-1],'rb').read()==raw:
        print('server stale: identical to',os.path.basename(prevs[-1]));return True
    S={(r[1],r[2]):r[4] for r in V}
    match=sum(1 for r in R if (r[1],r[2]) in S and S[(r[1],r[2])]==r[4])
    mism=sum(1 for r in R if (r[1],r[2]) in S and S[(r[1],r[2])]!=r[4])
    print('server vs global overlap match',match,'mismatch',mism)
    if match+mism>=50 and mism>match:
        print('server stale: mismatches global');return True
    return False
def _row(r):
    """Unpack a snapshot row. Older files are 5 fields (no clan)."""
    r=list(r)
    clan=r[5] if len(r)>5 else ''
    return r[0],r[1],r[2],str(r[3]),r[4],clan or ''
def series():
    S={};add=lambda n,sv,t,p,src:(n and sv and p) and S.setdefault(f'{n}|{sv}',{}).setdefault(t[:10],[int(p),src])
    CLAN={};CLS={}
    def note(n,sv,ci,cl):
        if not n or not sv: return
        k=f'{n}|{sv}'
        if ci: CLS[k]=str(ci)
        if cl: CLAN[k]=cl
    for f in sorted(glob.glob(os.path.join(PH,'20*.json'))):
        d=os.path.basename(f)[:10]
        for row in json.load(open(f)):
            r,n,sv,ci,pw,cl=_row(row);add(n,sv,d,pw,'r');note(n,sv,ci,cl)
    for f in sorted(glob.glob(os.path.join(PH,'servers','20*.json'))):
        d=os.path.basename(f)[:10]
        for row in json.load(open(f)):
            r,n,sv,ci,pw,cl=_row(row);add(n,sv,d,pw,'r');note(n,sv,ci,cl)
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
                # deck swaps (EXP spirit and magic stone setups) cause sudden dips: measure from the running peak so dips and bounce backs never count
                r=[p for p in pts if p[2]=='r'];pk=[];m=-1
                for p in r: m=max(m,p[1]);pk.append(m)
                i=next((j for j,p in enumerate(r) if p[0]>=cut),None)
                if i is not None and i<len(r)-1 and r[-1][0]==last and pk[-1]>pk[i]: L.append([k,pk[-1]-pk[i],r[i][0],pk[-1]])
            G[str(w)]=sorted(L,key=lambda x:-x[1])[:50]
    json.dump({'days':days,'growth':G,'s':S,'clan':CLAN,'cls':CLS},open(os.path.join(PH,'series.json'),'w'),ensure_ascii=False,separators=(',',':'))
    return S,days,CLAN,CLS
if __name__=='__main__':
    os.makedirs(PH,exist_ok=True)
    if '--no-fetch' not in sys.argv:
        R=fetch();d=datetime.datetime.now(LA).strftime('%Y-%m-%d')
        if len(R)>=500: json.dump(R,open(os.path.join(PH,d+'.json'),'w'),ensure_ascii=False,separators=(',',':'))
        print('ranking rows',len(R),'with clan',sum(1 for r in R if r[5]))
        V=fetch_servers();os.makedirs(os.path.join(PH,'servers'),exist_ok=True)
        nserv=len({r[2] for r in V})
        if len(V)>=1000 and nserv>=MIN_SERVERS and not _server_stale(V,R,d):
            json.dump(V,open(os.path.join(PH,'servers',d+'.json'),'w'),ensure_ascii=False,separators=(',',':'))
        else:
            print('server snapshot not written (rows',len(V),'servers',nserv,')')
        print('server rows',len(V),'servers',nserv,'with clan',sum(1 for r in V if r[5]))
    S,days,CLAN,CLS=series();print('characters',len(S),'with 2+ points',sum(1 for v in S.values() if len(v)>=2),'ranking days',days,'clans',len(set(CLAN.values())),'with clan',len(CLAN))
