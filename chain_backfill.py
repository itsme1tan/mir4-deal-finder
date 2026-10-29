"""Full public record of each character NFT, read-only from the public WEMIX chain endpoint (api.wemix.com). No sign-in, no wallet.
The token id comes from the public hofgamer detail page. Writes data/chain_history.json: per character, every listing (with price),
delist, relist, sale and wallet move back to the day it became an NFT. Times are America/Los_Angeles. Incremental: only new blocks are read."""
import json,os,re,time,datetime,urllib.request
from zoneinfo import ZoneInfo
from concurrent.futures import ThreadPoolExecutor
ROOT=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(ROOT,'data','chain_history.json')
RPC='https://api.wemix.com';NFT='0x1dbf9b33e59972ed753cae1423f4f23deec70cc9';ESC={'0x2f5bfde1b109ff7f610d88886178b04a893f6f53','0xcd1fddfd1aa3828ad4fba6d8e10ba4bf5d544976'}  # marketplace escrow since Apr 28 2026, and the one before it (May 2025 to Apr 2026)
TR='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';Z='0x'+'0'*40;LA=ZoneInfo('America/Los_Angeles')
UA={'User-Agent':'Mozilla/5.0 (mir4-deal-finder; read-only)'};T0=time.time();BUDGET=float(os.environ.get('CHAIN_BUDGET_S','600'))
def rpc(m,p,tries=3):
    for i in range(tries):
        try:
            r=urllib.request.Request(RPC,json.dumps(dict(jsonrpc='2.0',id=1,method=m,params=p)).encode(),{'content-type':'application/json'})
            return json.loads(urllib.request.urlopen(r,timeout=60).read())['result']
        except Exception as e: err=e;time.sleep(3*(i+1))
    raise err
BT={}
def ts(n):
    if n not in BT: BT[n]=int(rpc('eth_getBlockByNumber',[n,False])['timestamp'],16)
    return datetime.datetime.fromtimestamp(BT[n],LA).strftime('%Y-%m-%d %H:%M')
def token(i):
    h=urllib.request.urlopen(urllib.request.Request(f'https://nft.hofgamer.com/mir4/nft/{i}',headers=UA),timeout=60).read().decode('utf8','ignore')
    m=re.search(r'marketplace/detail/(0x[0-9a-fA-F]{40})/(\d+)',h);return int(m.group(2)) if m and m.group(1).lower()==NFT else None
def update(r):
    """Append new transfers since r['blk'] (the last block read) to r['events']."""
    fb=hex(r.get('blk',-1)+1);ev=r.setdefault('events',[])
    owner=r.get('owner');price=r.get('price')
    logs=rpc('eth_getLogs',[dict(fromBlock=fb,toBlock='latest',address=NFT,topics=[TR,None,None,'0x%064x'%r['token']])])
    for l in logs:
        f='0x'+l['topics'][1][-40:];to='0x'+l['topics'][2][-40:];t=ts(l['blockNumber'])
        if f==Z: ev.append(dict(t=t,type='minted',to=to));owner=to
        elif to in ESC:
            w=rpc('eth_getTransactionByHash',[l['transactionHash']])['input'][10:];p=None
            try:p=round(int(w[64*14:64*15],16)/1e18)
            except Exception:pass
            ev.append(dict(t=t,type='listed',wemix=p,by=f));price=p;owner=f
        elif f in ESC:
            if to==owner: ev.append(dict(t=t,type='delisted',wemix=price))
            else: ev.append(dict(t=t,type='sold',wemix=price,to=to));owner=to
        else: ev.append(dict(t=t,type='transfer',to=to));owner=to
        r['blk']=int(l['blockNumber'],16)
    r['owner']=owner;r['price']=price
META_H=float(os.environ.get('CHAIN_META_H','20'))  # reread each token's public metadata about once a day
def meta(k,r):
    """Current name/server/class/level/PS from the token's own metadata (tokenURI -> webapi.mir4global.com/wemix/nft/meta). Keeps past names."""
    n=r.get('now') or {}
    if n.get('t') and (datetime.datetime.now(LA)-datetime.datetime.strptime(n['t'],'%Y-%m-%d %H:%M').replace(tzinfo=LA)).total_seconds()<META_H*3600: return
    h=rpc('eth_call',[dict(to=NFT,data='0xc87b56dd'+'%064x'%r['token']),'latest']);u=bytes.fromhex(h[130:130+2*int(h[66:130],16)]).decode()
    if not u.startswith('https://webapi.mir4global.com/'): return
    m=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read())
    a={x.get('trait_type'):x.get('value') for x in m.get('attributes',[])}
    t=datetime.datetime.now(LA).strftime('%Y-%m-%d %H:%M');nm=a.get('Character Name') or m.get('name')
    if not nm: return
    try: ps=int(str(a.get('Power Score','')).replace(',',''))
    except Exception: ps=None
    cls=a.get('Class');kc=k.split('|')[2]
    if cls and cls!=kc: r['bad']=f'class {kc} on our record but {cls} on the token'  # class never changes, so this token was matched wrongly
    else: r.pop('bad',None)
    nn=dict(t=t,name=nm,server=a.get('Server') or None,cls=cls,lv=a.get('Level'),ps=ps)
    names=r.setdefault('names',[])
    if not names or names[-1]['name']!=nm: names.append(dict(name=nm,seen=t))
    r['now']=nn
def verify(O,SA):
    """A sold-archive record joins a token only if that sale is on the token's own chain record (same price, within 2 days). Otherwise mark nomatch."""
    key=lambda x:f"{x['name']}|{x.get('server') or ''}|{x['cls']}";EV={}
    for r in O.values():
        if r.get('token') and len(r.get('events') or [])>len(EV.get(r['token'],[])): EV[r['token']]=r['events']
    n=0
    for x in SA:
        r=O.get(key(x))
        if not r or not r.get('token') or not x.get('sold'): continue
        ev=EV.get(r['token'])
        if not ev: continue
        st=datetime.datetime.strptime(x['sold'],'%Y-%m-%d %H:%M').replace(tzinfo=ZoneInfo('Asia/Shanghai')).astimezone(LA).replace(tzinfo=None)
        ok=any(e['type']=='sold' and abs((datetime.datetime.strptime(e['t'],'%Y-%m-%d %H:%M')-st).total_seconds())<2*86400 and (not e.get('wemix') or not x.get('wemix') or abs(e['wemix']-x['wemix'])<=1) for e in ev)
        if ok: r.pop('nomatch',None)
        else: r['nomatch']=f"sale {x['id']} is not on token {r['token']}'s record";n+=1
    return n
def main():
    D=json.load(open(os.path.join(ROOT,'data.json')))
    try: O=json.load(open(OUT))
    except Exception: O={}
    key=lambda x:f"{x['name']}|{x.get('server') or ''}|{x['cls']}"
    todo={}
    try: SA=json.load(open(os.path.join(ROOT,'data','sold_archive.json')))
    except Exception: SA=[]
    for x in D['listings']+D.get('sales',[])+SA: todo.setdefault(key(x),x)  # sold archive too, so renamed sold characters show their current name
    head=int(rpc('eth_blockNumber',[]),16)
    def one(k):
        if time.time()-T0>BUDGET: return
        x=todo[k];r=O.get(k) or {}
        try:
            if not r.get('token'):
                tid=token(x['id'])
                if not tid: return
                r={'token':tid}
            try: meta(k,r)
            except Exception as e: print('meta skip',k,str(e)[:60])
            O[k]=r
            if r.get('blk',-1)>=head: return
            update(r);r['checked']=datetime.datetime.now(LA).strftime('%Y-%m-%d %H:%M');O[k]=r
            if len(O)%25==0: json.dump(O,open(OUT+'.part','w'),ensure_ascii=False)
        except Exception as e: print('chain skip',k,str(e)[:60])
    with ThreadPoolExecutor(8) as ex: list(ex.map(one,list(todo)))
    print('nomatch:',verify(O,SA))
    tmp=OUT+'.tmp';json.dump(O,open(tmp,'w'),ensure_ascii=False);os.replace(tmp,OUT)
    import market;market.chain_age(D);json.dump(D,open(os.path.join(ROOT,'data.json'),'w'),ensure_ascii=False)
    print('chain_history:',len(O),'characters')
if __name__=='__main__': main()
