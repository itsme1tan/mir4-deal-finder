/* Tidy nav: bottom tab bar + sheets (preview) */
(function(){
const css=`#tnav{position:fixed;left:0;right:0;bottom:0;z-index:1100;display:flex;background:rgba(20,8,22,.96);border-top:1px solid #5a2550;padding:4px 6px calc(4px + env(safe-area-inset-bottom));backdrop-filter:blur(6px)}
#tnav button{flex:1;background:none;border:0;color:#b9a3bd;font-size:11px;padding:5px 0;display:flex;flex-direction:column;align-items:center;gap:1px;border-radius:10px}
#tnav button i{font-style:normal;font-size:17px;line-height:1.1}
#tnav button.on{color:#e8c872;background:rgba(107,42,90,.35)}
body{padding-bottom:64px}
#cbar{bottom:56px!important;border-radius:14px 14px 0 0}
#bycls,#mbtn,.ctl .qs,#ninfo,#ninfo+span{display:none!important}
#tsh{position:fixed;inset:0;z-index:1200;display:none}#tsh.show{display:block}
#tsh .bg{position:absolute;inset:0;background:rgba(8,3,10,.55)}
#tsh .pn{position:absolute;left:0;right:0;bottom:0;background:#1c0b20;border-top:1px solid #e8c87255;border-radius:16px 16px 0 0;padding:8px 16px calc(18px + env(safe-area-inset-bottom));max-height:70vh;overflow:auto;box-shadow:0 -6px 24px rgba(0,0,0,.5)}
#tsh .gr{width:36px;height:4px;background:#5a2550;border-radius:4px;margin:2px auto 10px}
#tsh h4{margin:12px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#b9a3bd;font-weight:600}
#tsh .row{display:flex;flex-wrap:wrap;gap:6px}
#tsh .ch{background:#26142b;color:#f2e8f2;border:1px solid #4a2348;border-radius:999px;padding:7px 12px;font-size:13px;text-decoration:none}
#tsh .ch.on{border-color:#e8c872;color:#e8c872;background:#3a1640}
#tsh .it{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-bottom:1px solid #3a1a3c;color:#f2e8f2;padding:12px 2px;font-size:14px;text-align:left;text-decoration:none}
#tsh .it small{display:block;color:#b9a3bd;font-size:11px;margin-top:2px}
#tsh .it:last-child{border-bottom:0!important}#tsh .it{border:0!important;border-bottom:1px solid #3a1a3c!important;border-radius:0!important;box-shadow:none!important;outline:none;margin:0}#tsh .it>b{width:24px;text-align:center;font-weight:400;font-size:16px;color:#e8c872;flex:none}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const nav=document.createElement('nav');nav.id='tnav';
nav.innerHTML='<button data-t="top" class="on"><i>🏆</i>Top</button><button data-t="browse"><i>📋</i>Browse</button><button data-t="more"><i>☰</i>More</button>';
document.body.appendChild(nav);
const sh=document.createElement('div');sh.id='tsh';sh.innerHTML='<div class="bg"></div><div class="pn"></div>';document.body.appendChild(sh);
const pn=sh.querySelector('.pn');
function close(){sh.classList.remove('show');mark(document.body.classList.contains('simple')?'top':'browse')}
sh.querySelector('.bg').onclick=close;
function mark(t){nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t==t))}
function browse(){document.body.classList.remove('simple');
 const cur=(document.getElementById('fsort')||{}).value, fc=document.getElementById('fcls');
 const sorts=[...document.querySelectorAll('.ctl .qs [data-s]')].map(b=>`<button class="ch${b.dataset.s==cur?' on':''}" data-s="${b.dataset.s}">${b.textContent}</button>`).join('');
 const cls=fc?[...fc.options].map(o=>`<button class="ch${o.value==fc.value?' on':''}" data-c="${o.value}">${o.value?o.text:'All classes'}</button>`).join(''):'';
 pn.innerHTML=`<div class="gr"></div><h4>Sort</h4><div class="row">${sorts}</div><h4>Class</h4><div class="row">${cls}</div><h4>Views</h4><div class="row"><button class="ch" id="tfull">📋 Full list</button><a class="ch" href="classes.html">🏅 Top by class</a></div>`;
 pn.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{document.querySelector('.ctl .qs [data-s="'+b.dataset.s+'"]').click();close();scrollTo(0,0)});
 pn.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{fc.value=b.dataset.c;fc.dispatchEvent(new Event('change',{bubbles:true}));fc.dispatchEvent(new Event('input',{bubbles:true}));close();scrollTo(0,0)});
 pn.querySelector('#tfull').onclick=()=>{close();scrollTo(0,0)};
 sh.classList.add('show');mark('browse')}
function more(){pn.innerHTML=`<div class="gr"></div>
<a class="it" href="changelog.html"><b>✨</b><span>What's new<small>Latest site updates</small></span></a>
<button class="it" id="thow"><b>ⓘ</b><span>How this works<small>Fair value, build score and badges</small></span></button>
<button class="it" id="tcmp"><b>⚖</b><span>Compare<small>Tick 2 to 4 characters in Browse, then tap Compare</small></span></button>`;
 pn.querySelector('#thow').onclick=()=>{document.body.classList.remove('simple');const n=document.querySelector('.note');n.classList.add('show');close();n.scrollIntoView({behavior:'smooth'})};
 pn.querySelector('#tcmp').onclick=()=>{close();browse()};
 sh.classList.add('show');mark('more')}
nav.onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.t;
 if(t=='top'){sh.classList.remove('show');document.body.classList.add('simple');scrollTo(0,0);mark('top')}
 else if(t=='browse')browse();else more()};
})();
