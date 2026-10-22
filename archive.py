"""Append newly seen sales from data.json into data/sold_archive.json (dedupe by id). Display only: read by pricehist.js, never by the fair-price model."""
import json,os
K=('id','name','cls','lv','ps','server','listed','sold','wemix')
P='data/sold_archive.json'
A=json.load(open(P)) if os.path.exists(P) else []
seen={s['id'] for s in A}
new=[{k:s.get(k) for k in K} for s in json.load(open('data.json')).get('sales',[])
     if s.get('id') not in seen and s.get('sold') and s.get('wemix') and (s.get('ps') or 0)>=510000]
if new:
    A+=new; A.sort(key=lambda s:s['sold'],reverse=True)
    json.dump(A,open(P+'.tmp','w'),ensure_ascii=False,separators=(',',':')); os.replace(P+'.tmp',P)
print(f'sold archive: +{len(new)} new, {len(A)} total')
