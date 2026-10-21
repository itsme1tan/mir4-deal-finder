"""Print new MIR4 deals from data/new_deals.json as plain text. Usage: python3 alerts.py"""
import json, os
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'data','new_deals.json')
d=json.load(open(p)); L=d['deals']
if not L: print(f"No new deals as of {d['updated']} PT ({d['rule']})."); raise SystemExit
print(f"{len(L)} new MIR4 deal{'s' if len(L)>1 else ''} as of {d['updated']} PT"+(" (first run, so every match counts as new)" if d.get('first_run') else ""))
for i,x in enumerate(L,1):
    print(f"{i}. {x['name']}, {x['cls']}, power {x['ps']:,}, build score {x['build_score']}")
    print(f"   ${x['usd']:,} vs fair ${x['fair_usd']:,}: {x['pct_under']}% under (${x['usd_under']:,})")
    print(f"   {x['link']}")
