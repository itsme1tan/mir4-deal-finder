/* WEMIX 1h tag: USD change of each ask from WEMIX price movement. Display only. Hidden if data is missing or stale. */
(function(){let dl=null;const fm=n=>Math.round(n).toLocaleString();
const st=document.createElement('style');st.textContent='.w1h{font-size:10px;line-height:1.2}.w1h.up,.tr20 .p .w1h.up{color:#22c55e}.w1h.dn,.tr20 .p .w1h.dn{color:#ef4444}.w1h:empty{display:none}#w1hdr{font-size:11px;color:#9aa3b8;margin-top:2px}#w1hdr:empty{display:none}';document.head.appendChild(st);
function fill(){if(dl==null)return;document.querySelectorAll('.w1h:not([data-f])').forEach(e=>{e.dataset.f=1;const v=(+e.dataset.w||0)*dl;if(!isFinite(v)||Math.abs(v)<1){e.textContent='';return}e.className='w1h '+(v>0?'up':'dn');e.textContent=(v>0?'▲ $':'▼ $')+fm(Math.abs(v))+' (1h)';e.title='USD change of this ask from WEMIX price moving in the last hour'})}
fetch('data/wemix_price.json?'+Date.now()).then(r=>r.ok?r.json():null).then(h=>{const P=h&&h.points;if(!P||P.length<2)return;const [t,c]=P.at(-1);
 if(Date.now()/1000-t>2*3600)return; // stale: hide
 let b=null;for(const p of P)if(p[0]<=t-2700&&p[0]>=t-5400)b=p; // a point 45 to 90 min earlier
 if(!b||!(b[1]>0)||!(c>0))return;dl=c-b[1];const pc=dl/b[1]*100;
 const hd=document.createElement('div');hd.id='w1hdr';hd.innerHTML=`WEMIX $${c.toFixed(4)} <span data-f="1" class="w1h ${pc>=0?'up':'dn'}" style="font-size:11px">${pc>=0?'▲':'▼'} ${Math.abs(pc).toFixed(2)}% 1h</span>`;hd.title='Source: CoinGecko, recorded hourly';
 const m=document.getElementById('meta');m&&m.after(hd);fill();new MutationObserver(fill).observe(document.body,{childList:true,subtree:true})}).catch(()=>{})})();
