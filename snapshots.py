"""Save a full snapshot of every live listing to data/snaps/<id>.json so its details (gear, spirits, stats, skills, codex) stay viewable after it sells.
Read by soldsearch.js. Snapshots are rewritten while the listing is live, then frozen once it is gone."""
import json,os,sys
D='data/snaps'; os.makedirs(D,exist_ok=True)
DROP=('comp_ids','history','past_sales')  # bulky or time-varying, not needed for the details view
def save(x,src='live'):
    s={k:v for k,v in x.items() if k not in DROP}; s['snap_src']=src
    p=f"{D}/{x['id']}.json"; b=json.dumps(s,ensure_ascii=False,separators=(',',':'))
    if not os.path.exists(p) or open(p).read()!=b: open(p,'w').write(b); return 1
    return 0
if __name__=='__main__':
    n=sum(save(x) for x in json.load(open('data.json')).get('listings',[]) if x.get('id'))
    print(f'snapshots: {n} written, {len(os.listdir(D))} total')
