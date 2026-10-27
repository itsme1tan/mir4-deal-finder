/* Shared strength score used by Top 10 (top20.js) and Top by class (classes.html). In-class percentile blend; tanks weight defense. */
window.T20S=(function(){const ALL=['Warrior','Sorcerer','Taoist','Arbalist','Lancer','Darkist'],TANK=['Taoist','Warrior','Lionheart'];
const WA=[['atk',.35],['skill_dmg',.2],['pvp_dmg',.2],['def',.1],['pvp_red',.05],['ps',.1]],WT=[['def',.25],['eva',.2],['pvp_red',.2],['atk',.1],['skill_dmg',.05],['pvp_dmg',.1],['ps',.1]];
function score(A,L){const pool=x=>{const c=A.filter(y=>y.cls==x.cls);return c.length>=3?c:A};
 const pr=(x,k)=>{const v=pool(x).map(y=>y[k]).filter(n=>n!=null);if(x[k]==null||!v.length)return 0;return v.filter(n=>n<=x[k]).length/v.length*100};
 L.forEach(x=>{const W=TANK.includes(x.cls)?WT:WA;x.t20p={};W.forEach(([k])=>x.t20p[k]=pr(x,k));x.t20=W.reduce((s,[k,w])=>s+w*x.t20p[k],0)});
 return L.sort((a,b)=>b.t20-a.t20||b.ps-a.ps)}
const pick=A=>A.filter(x=>x.usd<=25000&&x.build_score!=null);
return {ALL,TANK,score,pick}})();
