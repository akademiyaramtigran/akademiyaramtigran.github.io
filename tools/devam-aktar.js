// Tek seferlik aktarım: bu eğitim yılının mevcut ders yoklamalarından öğrenci devam kayıtlarını (studentAtt) üretir.
// Bildirim GÖNDERMEZ. Tekrar çalıştırmak güvenlidir (aynı kayıtların üstüne yazar).
// Çalıştırma: GitHub → Actions → "Eski yoklamaları öğrenci ekranına aktar" (FIREBASE_SERVICE_ACCOUNT gerekir).
const admin = require('firebase-admin');
const D = require('../functions/devam');
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'aram2026-a9fd7' });
const db = admin.firestore();
(async () => {
  const now = new Date(), y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1, from = y + '-09-01';
  const idx = D.studentIndex((await db.collection('students').get()).docs);
  let docs = 0, rows = 0, batch = db.batch(), n = 0, last = null;
  for (;;) {
    let q = db.collection('attendance').where('date', '>=', from).orderBy('date').limit(300);
    if (last) q = q.startAfter(last);
    const sn = await q.get(); if (sn.empty) break;
    last = sn.docs[sn.docs.length - 1];
    for (const d of sn.docs) {
      docs++;
      for (const r of D.buildRows(d.id, d.data(), idx)) {
        batch.set(db.collection('studentAtt').doc(r.id), { ...r.data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }); rows++;
        if (++n >= 400) { await batch.commit(); batch = db.batch(); n = 0; }
      }
    }
    if (sn.size < 300) break;
  }
  if (n) await batch.commit();
  console.log('Taranan yoklama belgesi: ' + docs + ' · yazılan öğrenci kaydı: ' + rows + ' (başlangıç ' + from + ')');
})().catch(e => { console.error(e); process.exit(1); });
