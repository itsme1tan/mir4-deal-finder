/* Level ranking: highest level among characters seen on the public marketplace.
   Source: data/level_history/latest.json, built by level_snap.py from Hofgamer/XDRACO
   listings, sales, and saved snapshots. Not the official in-game Level ranking.
   Official rank pages only publish Power, Class, and Clan lists. Display only. */
(function(){
const E=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const fm=n=>Math.round(n).toLocaleString('en-US');
let P=null;
const LV=window.LV={load(){return P||(P=fetch('data/level_history/latest.json?'+Math.floor(Date.now()/36e5)).then(r=>r.ok?r.json():null).catch(()=>null))}};
const SP='icons/spirit-head-dragon.png?v=6';
function liveMap(){
  const byId={},byK={},L=(window.D&&D.listings)||[];
  for(const x of L){
    if(x&&x.id)byId[x.id]=x;
    if(x&&x.name&&x.server)byK[x.name+'|'+x.server]=x;
  }
  return {byId,byK};
}
function merge(rows){
  const {byId,byK}=liveMap();
  return (rows||[]).map(r=>{
    const x=(r.id&&byId[r.id])||byK[(r.name||'')+'|'+(r.server||'')];
    if(!x)return Object.assign({},r,{live:false});
    return Object.assign({},r,{
      live:true,src:'listed',lv:x.lv??r.lv,ps:x.ps??r.ps,id:x.id,usd:x.usd,cls:x.cls||r.cls,has_snap:true
    });
  }).sort((a,b)=>b.lv-a.lv||(b.ps||0)-(a.ps||0)||String(a.name).localeCompare(String(b.name))||String(a.server).localeCompare(String(b.server)));
}
function servers(rows){
  return [...new Set(rows.map(r=>r.server).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}
LV.tool=function(){
  const G=document.getElementById('lvg');if(!G||LV._t)return;LV._t=1;
  if(!document.getElementById('lvrkst')){
    const y=document.createElement('style');y.id='lvrkst';
    y.textContent='#lvg{max-width:100%;box-sizing:border-box;overflow-x:hidden}#lvg .rk{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;min-width:22px;margin:0 8px 0 0;box-sizing:border-box;padding:0;line-height:1;border-radius:50%;border:1px solid rgba(232,200,114,.85);background:rgba(40,10,40,.85);color:#ffe9b0;font-weight:800;font-size:11px;font-variant-numeric:tabular-nums;box-shadow:0 1px 3px rgba(0,0,0,.5)}#lvg [data-i]{align-items:center}#lvg [data-open]{cursor:pointer}.lvsvt{display:inline-block;font:inherit;font-size:11px;font-weight:600;line-height:1.2;color:#e8c872;background:rgba(42,16,48,.75);border:1px solid rgba(232,200,114,.5);border-radius:999px;padding:2px 7px;margin:0 0 0 4px;vertical-align:1px;cursor:pointer;-webkit-tap-highlight-color:transparent}.lvsvt:active{background:rgba(90,37,80,.85);border-color:#e8c872}.lvtag{display:inline-block;font-size:11px;font-weight:700;color:#e8c872;margin-left:6px}#lvg .lvrow{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;max-width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #3a2040;color:#f2e8f2;padding:8px 2px;font-size:13px;box-sizing:border-box}#lvg .lvleft{display:flex;align-items:center;min-width:0;flex:1}#lvg .lvname{min-width:0;overflow-wrap:anywhere}#lvg .lvright{white-space:nowrap;text-align:right;flex:none}#plv select,#lvsv{max-width:100%;box-sizing:border-box}';
    document.head.appendChild(y);
  }
  let srv='',shown=25;
  const svt=s=>s?`<button type="button" data-sv="${E(s)}" class="lvsvt" title="Top level on ${E(s)}">${E(s)}</button>`:'';
  const bindSv=el=>{if(!el)return;el.querySelectorAll('[data-sv]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();goServer(b.dataset.sv)})};
  const goServer=s=>{if(!s)return;srv=s;shown=25;draw().then(()=>{try{G.scrollIntoView({block:'start'})}catch(e){}})};
  const openRow=r=>{
    if(r.live&&r.id&&window.T20&&window.D){T20.solo(r.id,D.listings);return}
    if(r.id&&window.soloSold){soloSold(r.id,r.name||'')}
  };
  const row=(r,i)=>{
    const open=r.live||(r.id&&r.has_snap);
    const sale=r.live?`<span class="lvtag">For sale${r.usd!=null?' $'+fm(r.usd):''}</span>`:'';
    const cls=r.cls?`<small style="color:#b9a3bd">${E(r.cls)}</small>`:'';
    return `<div class="lvrow"${open?' data-open="1"':''} data-i="${i}" role="${open?'button':'listitem'}" ${open?'tabindex="0"':''}><span class="lvleft"><span class="rk">${i+1}</span><span class="lvname">${E(r.name)} ${svt(r.server)}${sale}${cls?'<br>'+cls:''}</span></span><span class="lvright"><b style="color:#e8c872">Lv ${fm(r.lv)}</b>${r.ps?`<br><small style="color:#b9a3bd">${fm(r.ps)} power</small>`:''}</span></div>`;
  };
  const draw=()=>LV.load().then(J=>{
    if(!J||!J.rows){G.innerHTML='<div style="font-size:13px;color:#b9a3bd;padding:8px 0">Level data is not available yet.</div>';return}
    const all=merge(J.rows),T=all.filter(r=>!srv||r.server===srv).slice(0,100),S=servers(all),n=Math.min(shown,T.length);
    const opts='<option value="">All servers</option>'+S.map(s=>`<option value="${E(s)}"${s===srv?' selected':''}>${E(s)}</option>`).join('');
    const pick=`<label style="display:block;margin:4px 0 8px;font-size:12px;color:#b9a3bd">Server<select id="lvsv" style="display:block;width:100%;max-width:100%;box-sizing:border-box;margin-top:4px;padding:9px 12px;border-radius:10px;border:1px solid #5a2550;background:#1a0f1e;color:#f2e8f2;font-size:15px">${opts}</select></label>`;
    const title=srv
      ?`<img class="spico lg" src="${SP}" alt="" width="63" height="63" decoding="async" loading="lazy"> Level · ${E(srv)}`
      :`<img class="spico lg" src="${SP}" alt="" width="63" height="63" decoding="async" loading="lazy"> Level`;
    const more=T.length>n?`<button data-more style="display:block;width:100%;max-width:100%;box-sizing:border-box;margin:8px 0 2px;padding:9px 12px;border-radius:10px;border:1px solid #5a3a5e;background:#1c1020;color:#e8c872;font:inherit;font-size:13px;font-weight:600">Show more (${n} of ${T.length})</button>`:'';
    const empty=srv
      ?'<div style="font-size:13px;color:#b9a3bd;padding:8px 0">No characters from this server in our marketplace records yet.</div>'
      :'<div style="font-size:13px;color:#b9a3bd;padding:8px 0">No marketplace level records yet.</div>';
    const intro='Highest level among characters we have seen on the public marketplace, not the official in-game Level ranking.';
    const foot=srv
      ?`Highest level on ${E(srv)} among the ${fm(all.length)} characters in our marketplace records. Official rank pages only publish Power, Class, and Clan lists. Levels for characters that are no longer listed are from the last time we saw them. When two characters share a level, we rank by power at last sighting.`
      :`Top 100 of ${fm(all.length)} characters in our marketplace records (Hofgamer and XDRACO listings, sales, and saved snapshots). Official rank pages only publish Power, Class, and Clan lists. The in-game Level ranking described in the official ranking guide is not posted there. Levels for characters that are no longer listed are from the last time we saw them. When two characters share a level, we rank by power at last sighting. Official in-game ties use accumulated EXP, which is not published.`+(J.updated?` Updated ${E(J.updated)} PT.`:``);
    G.innerHTML='<div style="font-weight:700;color:#e8c872;font-size:14px;margin-bottom:4px;display:flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0">'+title+'</div><div style="font-size:12px;color:#b9a3bd;margin:0 0 8px;overflow-wrap:anywhere">'+intro+'</div>'+pick+(T.length?T.slice(0,n).map((r,i)=>row(r,i)).join('')+more:empty)+`<div style="font-size:11px;color:#b9a3bd;margin-top:8px;overflow-wrap:anywhere">${foot}</div>`;
    const sel=G.querySelector('#lvsv');if(sel)sel.onchange=()=>{srv=sel.value;shown=25;draw()};
    const mb=G.querySelector('[data-more]');if(mb)mb.onclick=()=>{shown=Math.min(shown+25,100);draw()};
    G.querySelectorAll('[data-open]').forEach((b,idx)=>{
      const list=T.slice(0,n);
      b.onclick=()=>{const r=list[+b.dataset.i];if(r)openRow(r)};
    });
    bindSv(G);
  });
  G.innerHTML='<div style="font-size:13px;color:#b9a3bd;padding:8px 0">Loading level ranking...</div>';
  draw();
  let n=0;const w=setInterval(()=>{n++;if((window.D&&D.listings)||n>40){clearInterval(w);if(window.D&&D.listings)draw()}},200);
};
const ti=()=>{if(document.getElementById('lvg'))LV.tool();else setTimeout(ti,500)};ti();
})();
