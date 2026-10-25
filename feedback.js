// Feedback with verified Google sign-in (Firebase Auth) + Firestore.
// The web config below is public by design; security comes from the Firestore rules.
const FIREBASE_CONFIG={apiKey:'AIzaSyAos_70YIqVs1RLLgtjMyNg9bbnWgQT-pY',authDomain:'mir4-deal-finder.firebaseapp.com',projectId:'mir4-deal-finder',storageBucket:'mir4-deal-finder.firebasestorage.app',messagingSenderId:'278388644655',appId:'1:278388644655:web:19d9598855af3c5cae5fda'};
const V='13.1.0',CDN=`https://www.gstatic.com/firebasejs/${V}/`;
const MOCK=!/[?&]realfb=1/.test(location.search)&&(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||/[?&]mockfb=1/.test(location.search));
let A,F,auth,db,user=null,N;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function init(){if(auth||MOCK)return;
 const [{initializeApp},a,f]=await Promise.all([import(CDN+'firebase-app.js'),import(CDN+'firebase-auth.js'),import(CDN+'firebase-firestore.js')]);
 A=a;F=f;const app=initializeApp(FIREBASE_CONFIG);auth=a.initializeAuth(app,{persistence:[a.browserLocalPersistence],popupRedirectResolver:a.browserPopupRedirectResolver});db=f.getFirestore(app);
 await new Promise(r=>{let first=true;a.onAuthStateChanged(auth,x=>{user=x;if(first){first=false;r()}})});}
function mockUser(){const e=localStorage.mockFbUser;return e?{email:e,uid:'mock',emailVerified:true}:null}
const P=()=>N.pn,G='<div class="gr"></div>',H='<div class="fbt">💬 Feedback</div><div class="fbw">Every idea counts, thank you! 🙏</div>';
const GICON='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 12h8M16 12a4 4 0 1 1-1.2-2.8"/></svg>';
export async function open(nav){N=nav;N.show();
 try{await init()}catch(e){return err('Could not reach sign-in right now. Try again later.')}
 if(MOCK)user=mockUser();
 user?form():signin()}
function err(t){P().innerHTML=G+H+`<div class="ferr">${esc(t)}</div>`}
function signin(msg=''){P().innerHTML=G+H+`<div class="fbw" style="color:#f2e8f2;margin-top:4px">Sign in first so we can keep spam out.</div>
<button class="fgo" id="fg">${GICON} Continue with Google</button><div class="ferr" id="fx">${esc(msg)}</div>`;
 P().querySelector('#fg').onclick=google}
function google(){if(MOCK){localStorage.mockFbUser='juan@gmail.com';user=mockUser();return form()}
 const pr=new A.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
 // Called directly in the tap handler, no await before it, so Safari keeps the popup.
 A.signInWithPopup(auth,pr).then(r=>{user=r.user;form()}).catch(e=>{const c=e&&e.code||'';
  if(c=='auth/popup-closed-by-user'||c=='auth/cancelled-popup-request')return;
  signin(c=='auth/popup-blocked'?'Allow pop-ups for this site, then tap again.':'Google sign-in did not finish. Allow pop-ups for this site, then tap again.')})}
function form(){let ty='Idea';P().innerHTML=G+H+`<div class="fme">Signed in as <b>${esc(user.email)}</b><button class="flink" id="fo">Sign out</button></div>
<div class="fty"><button class="on" data-ty="Idea">💡 Idea</button><button data-ty="Bug">🐞 Bug</button><button data-ty="Other">✨ Other</button></div>
<textarea id="fbm" maxlength="2000" placeholder="What should we add, or what's wrong?"></textarea>
<input class="fin" id="fbn" maxlength="60" placeholder="Name or in-game name (optional)"><div class="ferr" id="fbe"></div><button class="fsend" id="fbs">Send</button>`;
 const p=P();p.querySelectorAll('[data-ty]').forEach(b=>b.onclick=()=>{ty=b.dataset.ty;p.querySelectorAll('[data-ty]').forEach(x=>x.classList.toggle('on',x==b))});
 p.querySelector('#fo').onclick=async()=>{if(MOCK)delete localStorage.mockFbUser;else await A.signOut(auth);user=null;signin()};
 const bs=p.querySelector('#fbs'),be=p.querySelector('#fbe');
 bs.onclick=async()=>{const m=p.querySelector('#fbm').value.trim(),n=p.querySelector('#fbn').value.trim();
  if(m.length<3){be.textContent='Write a short message first.';return}be.textContent='';bs.disabled=true;bs.textContent='Sending...';
  try{if(MOCK)await new Promise(r=>setTimeout(r,400));else{const d={type:ty,message:m,email:user.email,uid:user.uid,page:location.pathname.slice(0,100),createdAt:F.serverTimestamp()};if(n)d.name=n;await F.addDoc(F.collection(db,'feedback'),d)}
   P().innerHTML=G+`<div class="fok">${N.sv('fb')}<b>Thank you! 🙏</b><p>Got your ${ty.toLowerCase()}. Every idea counts, and I read all of them.</p><button class="fsend" id="fbx">Close</button></div>`;P().querySelector('#fbx').onclick=N.close}
  catch(e){bs.disabled=false;bs.textContent='Send';be.textContent='Could not send right now. Please try again in a bit.'}}}
