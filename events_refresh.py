"""Add newly announced MIR4 Global events to data/events.json from the official forum (read-only public pages).
Only adds an event when the post states an explicit end date/time in UTC+8. Usage: python3 events_refresh.py"""
import re, json, os, html, urllib.request, datetime as dt
ROOT=os.path.dirname(os.path.abspath(__file__)); P=os.path.join(ROOT,'data','events.json')
BOARDS=['board/newevent?category_id=1','board/newevent?category_id=2','board/notice']
MON={m:i+1 for i,m in enumerate('January February March April May June July August September October November December'.split())}
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode('utf8','ignore')
def text(s):
    s=re.sub(r'<(script|style)[^>]*>.*?</\1>','',s,flags=re.S); s=re.sub(r'<br\s*/?>|</p>|</li>|</div>','\n',s)
    return [l.strip() for l in html.unescape(re.sub(r'<[^>]+>','',s)).split('\n') if l.strip()]
D=r'(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})'
def iso(m,t): return f'{m[2]}-{MON[m[0]]:02d}-{int(m[1]):02d}T{t}'
def main():
    E=json.load(open(P)); known={e['src'].rstrip('/').split('/')[-1] for e in E['events']}|{e.get('src2','').split('/')[-1] for e in E['events']}
    added=[]
    for b in BOARDS:
        try: s=get(f'https://forum.mir4global.com/{b}&lang=en' if '?' in b else f'https://forum.mir4global.com/{b}?lang=en')
        except Exception as e: print('fetch failed',b,e); continue
        for pid,title in re.findall(r'post/(\d+)"[^>]*class="article_subject">(.*?)</a>',s,re.S):
            if pid in known or int(pid)<2600: continue
            known.add(pid); title=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',title))).strip()
            if "Round-up" in title: continue
            title=re.sub(r"^(Event|Notice|Patch Note)( \[BW\])?\s*","",title)
            try: L=text(get(f'https://forum.mir4global.com/post/{pid}?lang=en'))
            except Exception: continue
            for i,l in enumerate(L):
                if 'Event Period' not in l: continue
                line=' '.join(L[i:i+2])
                m=re.search(D+r'(?: (\d\d:\d\d))?[^~]*~\s*'+D+r' (\d\d:\d\d) \(UTC\+8\)',line)
                if not m: continue
                g=m.groups(); start=iso(g[0:3],g[3] or '09:30'); end=iso(g[4:7],g[7])
                if dt.datetime.fromisoformat(end)<dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)+dt.timedelta(hours=8): break
                ev={'name':title[:80],'kind':'event','tz':'fixed','off':8,'start':start,'end':end,'src':f'https://forum.mir4global.com/post/{pid}','auto':True}
                if not g[3]: ev['detail']='Starts at update maintenance; start time approximate.'
                E['events'].append(ev); added.append(ev['name']); break
    if added: E['updated']=dt.date.today().isoformat(); json.dump(E,open(P,'w'),indent=1,ensure_ascii=False)
    print('events added:',added or 'none')
if __name__=='__main__': main()
