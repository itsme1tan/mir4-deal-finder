"""Recompute displayed stone substats from raw Hofgamer values (stage II /40, stage I /20)."""
import json,glob,os
def fix(L):
    n=0
    for m in L or []:
        dv=40 if m.get('t')==2 else 20
        for o in m.get('subs',[]):
            if len(o)>=4 and o[3] is not None: o[1]=round(float(o[3])/dv,2); n+=1
    return n
tot=0
for p in glob.glob('data/snaps/*.json'):
    x=json.load(open(p)); k=fix((x.get('build') or {}).get('stones'))
    if k: open(p,'w').write(json.dumps(x,ensure_ascii=False,separators=(',',':'))); tot+=1
if os.path.exists('cache/stones.json'):
    c=json.load(open('cache/stones.json'));[fix(e.get('s')) for e in c.values()];json.dump(c,open('cache/stones.json','w'),ensure_ascii=False,separators=(',',':'))
print('recomputed snapshots',tot)
