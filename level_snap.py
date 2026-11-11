"""Marketplace level ranking snapshot (read-only, public data).

Official web ranks (https://cs.mir4global.com/rank and
https://forum.mir4global.com/rank) only expose ranktype 1 (Power score),
1000 (Class power), and 4 (Clan). Probes of other ranktypes and of
webapi.mir4global.com ranking-style paths did not return a Level list.
Official post 45 (https://cs.mir4global.com/post/45) describes an in-game
Level ranking (top 100, reset 00:00 UTC+8), but that list is not published
on the official rank pages, so it is not scraped here.

This job ranks unique characters (name + server) by the latest level we
have from public marketplace records we already scrape: live Hofgamer /
XDRACO listings, sales in data.json, saved snapshots in data/snaps/, and
data/sold_archive.json. It is not the official in-game Level ranking.
Levels for characters no longer listed are from the last time we saw them.
When two characters share a level, we rank by power at last sighting;
official in-game ties use accumulated EXP, which is not published.

If Wemade publishes a Level ranktype on the official rank pages, fetch it
here (same pattern as power_snap.py) and keep the marketplace list as a
for-sale overlay only.

Usage: python3 level_snap.py
Writes data/level_history/<YYYY-MM-DD>.json (America/Los_Angeles date) and
data/level_history/latest.json for the Level tool.
"""
import json, os, glob, datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'data', 'level_history')
LA = ZoneInfo('America/Los_Angeles')

def _when(x):
    vals = [v for v in (x.get('sold'), x.get('listed')) if v]
    return max(vals) if vals else ''

def _int(v):
    try:
        if v is None or v == '':
            return None
        return int(v)
    except (TypeError, ValueError):
        return None

def _add(best, x, src):
    name = (x.get('name') or '').strip()
    server = (x.get('server') or '').strip()
    lv = _int(x.get('lv'))
    if not name or not server or lv is None:
        return
    rec = {
        'name': name,
        'server': server,
        'cls': (x.get('cls') or '').strip(),
        'lv': lv,
        'ps': _int(x.get('ps')),
        'id': x.get('id'),
        'src': src,
        'seen': _when(x),
        'listed_now': src == 'listed',
        'has_snap': False,
        'usd': None,
    }
    if src == 'listed' and x.get('usd') is not None:
        try:
            rec['usd'] = float(x.get('usd'))
        except (TypeError, ValueError):
            rec['usd'] = None
    if rec['id']:
        rec['has_snap'] = os.path.isfile(os.path.join(ROOT, 'data', 'snaps', str(rec['id']) + '.json'))
    k = name + '|' + server
    old = best.get(k)
    if old is None:
        best[k] = rec
        return
    if rec['listed_now'] and not old['listed_now']:
        best[k] = rec
        return
    if old['listed_now'] and not rec['listed_now']:
        return
    if rec['seen'] != old['seen']:
        if rec['seen'] > old['seen']:
            best[k] = rec
        return
    if rec['lv'] != old['lv']:
        if rec['lv'] > old['lv']:
            best[k] = rec
        return
    if (rec['ps'] or 0) > (old['ps'] or 0):
        best[k] = rec

def build():
    best = {}
    dpath = os.path.join(ROOT, 'data.json')
    D = json.loads(open(dpath, encoding='utf-8').read()) if os.path.isfile(dpath) else {}
    updated = D.get('updated') or datetime.datetime.now(LA).strftime('%Y-%m-%d %H:%M')
    for x in D.get('listings') or []:
        _add(best, x, 'listed')
    for x in D.get('sales') or []:
        _add(best, x, 'sold')
    for f in glob.glob(os.path.join(ROOT, 'data', 'snaps', '*.json')):
        try:
            x = json.loads(open(f, encoding='utf-8').read())
        except (OSError, ValueError):
            continue
        _add(best, x, 'snap')
    ap = os.path.join(ROOT, 'data', 'sold_archive.json')
    if os.path.isfile(ap):
        try:
            A = json.loads(open(ap, encoding='utf-8').read())
        except (OSError, ValueError):
            A = []
        if isinstance(A, list):
            for x in A:
                _add(best, x, 'archive')
    rows = []
    for rec in best.values():
        rec = dict(rec)
        rec.pop('listed_now', None)
        rows.append(rec)
    rows.sort(key=lambda r: (-r['lv'], -(r['ps'] or 0), r['name'], r['server']))
    day = datetime.datetime.now(LA).strftime('%Y-%m-%d')
    out = {
        'updated': updated,
        'date': day,
        'n': len(rows),
        'source': 'marketplace',
        'note': 'Highest level among characters seen on the public marketplace (Hofgamer and XDRACO listings, sales, and saved snapshots). Not the official in-game Level ranking. Official rank pages only publish Power, Class, and Clan lists.',
        'rows': rows,
    }
    os.makedirs(OUT, exist_ok=True)
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    for name in (day + '.json', 'latest.json'):
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            f.write(text)
            f.write('\n')
    print('level_snap: %s characters, updated %s, wrote data/level_history/%s.json and latest.json' % (len(rows), updated, day))
    return out

if __name__ == '__main__':
    build()
