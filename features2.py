"""Extra value features from a Hofgamer character page (public, read-only): transference gear, spirit transcend,
skills, inner force, Cosmic Harmony (Heaven), Divine Dragon Descent (Dragon), conquest buildings, potential split,
codex permanent vs time-limited, tradable assets."""
import re, html as H
RN={'I':1,'II':2,'III':3,'IV':4,'V':5}
def lines(h):
    h=re.sub(r'<(script|style)[^>]*>.*?</\1>','',h,flags=re.S); h=re.sub(r'<br\s*/?>|</p>|</li>|</div>|</span>','\n',h)
    return [l.strip() for l in H.unescape(re.sub(r'<[^>]+>','\n',h)).split('\n') if l.strip()]
def sec(L,start,stops):
    i=next((k for k,l in enumerate(L) if l.startswith(start)),None)
    if i is None: return None
    j=next((k for k in range(i+1,len(L)) if any(L[k].startswith(s) for s in stops)),len(L)); return L[i+1:j]
STOPS=['⚔ ','🌀 ','📖 ','🏋 ','📿 ','☯ ','🐉 ','🏰 ','✨ ','Assets','Bag Items','💎','🔮','Skills (']
def num(s):
    m=re.match(r'([\d.]+)\s*([KMB]?)',s.replace(',',''));
    return float(m[1])*{'':1,'K':1e3,'M':1e6,'B':1e9}[m[2]] if m else None
def parse(h,tr=lambda n:n):
    L=lines(h); o={}
    s=sec(L,'🌀 Succession Equipment',STOPS)
    if s is not None:
        te=[(int(s[i][1:]),s[i+2]) for i in range(len(s)-2) if re.fullmatch(r'\+\d+',s[i]) and s[i+2] in('Legendary','Mythical','Epic','Rare')]
        o.update(te_n=len(te),te_enh=sum(e for e,_ in te),te_8=sum(e>=8 for e,_ in te))
    s=sec(L,'⚔ Equipped Spirit',[x for x in STOPS if x!='🔮'])
    if s is not None:
        sp=[];i=0
        while i<len(s)-2 and len(sp)<10:
            if s[i] in RN and s[i+2] in('Mythical','Legendary','Heroic','Epic','Rare'): sp.append((RN[s[i]],tr(s[i+1]),s[i+2])); i+=3
            else: i+=1
        o.update(sp_myth_tr=sum(t for t,_,g in sp if g=='Mythical'),sp_leg_tr=sum(t for t,_,g in sp if g=='Legendary'),
                 sp_names=[[n,g,t] for t,n,g in sp],sp_white_tiger=any('White Tiger' in n or '白虎' in n for _,n,_ in sp))
    s=sec(L,'🏋 Training',STOPS)
    if s: o['inner_force']=sum(int(x[3:]) for x in s if x.startswith('Lv.'))
    s=sec(L,'☯ Heaven',STOPS)
    if s: o['heaven']=sum(int(x) for x in s if x.isdigit())
    s=sec(L,'🐉 Dragon',STOPS)
    if s:
        g=[int(x.split()[1]) for x in s if x.startswith('Grade ')]; c=[int(x.split()[1]) for x in s if x.startswith('Count:')]
        o['dragon_pts']=sum(a*b for a,b in zip(g,c)); o['dragon_n']=sum(c)
    s=sec(L,'🏰 Succession',STOPS)
    if s: o['conquest_lv']=sum(int(x[3:]) for x in s if x.startswith('Lv.'))
    i=next((k for k,l in enumerate(L) if l=='Total Potential'),None)
    if i is not None:
        d={L[k]:L[k+1] for k in range(i,i+16) if k+1<len(L)}
        for a,b in (('Hunting','pot_hunt'),('PvP','pot_pvp'),('Secondary','pot_sec')):
            if d.get(a,'').isdigit(): o[b]=int(d[a])
    s=sec(L,'📖 Codex',STOPS)
    if s:
        lim=[s[k+1] for k in range(len(s)-1) if s[k]=='限时']
        if lim and '/' in lim[0]: o['codex_limited']=int(lim[0].split('/')[0])
    i=next((k for k,l in enumerate(L) if l.startswith('Skills (')),None)
    if i is not None:
        t=[int(x.split()[1]) for x in L[i:i+120] if re.fullmatch(r'Tier \d+',x)][:13]
        if t: o.update(skill_sum=sum(t),skill_11=sum(x>=11 for x in t))
    s=sec(L,'Assets',['Bag Items'])
    if s:
        d={s[k]:s[k+1] for k in range(len(s)-1)}
        for a,b in (('Energy','energy'),('Speed-ups','speedups'),('Dragonsteel','dragonsteel'),('Dragon Jade','dragon_jade')):
            if a in d: o[b]=num(d[a])
    return o
