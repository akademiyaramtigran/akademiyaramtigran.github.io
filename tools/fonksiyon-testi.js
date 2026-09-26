// Cloud Functions testi (Auth + Firestore + Functions emülatörü). Çalıştırma:
//   cd tools && npm install && npm run fonksiyon-testi   (önce: cd ../functions && npm install)
const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');
(async()=>{
  const P='aram2026-a9fd7';
  // seed via admin REST: use firestore emulator bypass header
  const seed=async(path,fields)=>{await fetch(`http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents/${path}`,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer owner'},body:JSON.stringify({fields})});};
  await seed('idx_staff/1000',{no:{stringValue:'1000'},lvl:{stringValue:'admin'}});
  await seed('idx_staff/11202601',{no:{stringValue:'11202601'},lvl:{stringValue:'teacher'}});
  const mk=(n)=>{const a=initializeApp({apiKey:'x',projectId:P,authDomain:'x'},n);const au=getAuth(a);connectAuthEmulator(au,'http://127.0.0.1:9099',{disableWarnings:true});const f=getFunctions(a,'europe-west1');connectFunctionsEmulator(f,'127.0.0.1',5001);return {au,fn:httpsCallable(f,'aatUser')};};
  const A=mk('a'), T=mk('t'), X=mk('x');
  await createUserWithEmailAndPassword(A.au,'1000@ogretmen.aat','Admin123');
  await createUserWithEmailAndPassword(T.au,'11202601@ogretmen.aat','Teach123');
  const out=[];const t=async(n,p,ok)=>{try{const r=await p;out.push((ok?'✅ ':'❌ ')+n+' '+JSON.stringify(r.data));}catch(e){out.push((ok?'❌ ':'✅ ')+n+' → '+e.code);}};
  await t('Yönetici öğrenci oluşturur',A.fn({action:'create',no:'10202601',role:'student',password:'Abc12345'}),true);
  const S=mk('s');await t('Öğrenci yeni şifreyle girer',signInWithEmailAndPassword(S.au,'10202601@ogrenci.aat','Abc12345').then(u=>({data:u.user.email})),true);
  await t('Yönetici eski şifre OLMADAN şifre değiştirir',A.fn({action:'setPassword',no:'10202601',role:'student',password:'Yeni9999'}),true);
  const S2=mk('s2');await t('Öğrenci YENİ şifreyle girer',signInWithEmailAndPassword(S2.au,'10202601@ogrenci.aat','Yeni9999').then(u=>({data:'ok'})),true);
  await t('Yönetici veli hesabı oluşturur',A.fn({action:'create',no:'92026001',role:'guardian',password:'Veli1234'}),true);
  await t('Öğretmen fonksiyonu ÇAĞIRAMAZ',T.fn({action:'delete',no:'10202601',role:'student'}),false);
  await t('Girişsiz çağrı REDDEDİLİR',X.fn({action:'create',no:'1',role:'teacher',password:'123456'}),false);
  await t('Kısa şifre reddedilir',A.fn({action:'setPassword',no:'10202601',role:'student',password:'123'}),false);
  await t('Yönetici öğrenciyi siler',A.fn({action:'delete',no:'10202601',role:'student'}),true);
  const S3=mk('s3');await t('Silinen öğrenci giremez',signInWithEmailAndPassword(S3.au,'10202601@ogrenci.aat','Yeni9999').then(()=>({data:'girdi'})),false);
  console.log(out.join('\n'));process.exit(0);
})();
