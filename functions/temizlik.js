// Haftalık temizlik (functions/index.js → weeklyCleanup). Biriken GEÇİCİ kayıtlar silinir:
//   qrSessions + qrCodes : süresi 14 günden önce dolmuş QR oturumları ve dönen kodları
//   attendance QR okutma / cihaz belgeleri ({oturum}_{öğrenci}, {oturum}_d_{cihaz}) : 180 günden eski
//     (öğretmen yoklamayı kaydederken bunlar ders belgesine işlenir; raporlar ders belgesinden okunur)
//   teacherLessonLogs : 1 yıldan eski · gateLog : 180 günden eski
//   studentStats : kaldırılan eski istatistik tablosu (tümü)
// Ders yoklama belgeleri (records), değerlendirmeler, mesajlar, duyurular SİLİNMEZ.
const DAY = 86400000;
const iso = ms => new Date(ms).toISOString();
const ymd = ms => iso(ms).slice(0, 10);

// Sorguya uyan belgeleri sayfa sayfa siler; keep(v) true dönen belge silinmez
async function purge(db, q, keep, max) {
  let n = 0, last = null;
  for (;;) {
    const sn = await (last ? q.startAfter(last) : q).limit(400).get();
    if (sn.empty) break;
    last = sn.docs[sn.docs.length - 1];
    const del = sn.docs.filter(d => !keep || !keep(d.data()));
    if (del.length) { const b = db.batch(); del.forEach(d => b.delete(d.ref)); await b.commit(); }
    n += del.length;
    if (sn.size < 400 || n >= max) break;
  }
  return n;
}

async function weeklyCleanupRun(db, nowMs) {
  const out = {};
  // QR oturumları + kodları (expiresAt: ms)
  let qs = 0, last = null;
  for (;;) {
    let q = db.collection("qrSessions").where("expiresAt", "<", nowMs - 14 * DAY).orderBy("expiresAt").limit(200);
    if (last) q = q.startAfter(last);
    const sn = await q.get();
    if (sn.empty) break;
    last = sn.docs[sn.docs.length - 1];
    const b = db.batch();
    sn.docs.forEach(d => { b.delete(d.ref); b.delete(db.doc("qrCodes/" + d.id)); });
    await b.commit(); qs += sn.size;
    if (sn.size < 200 || qs >= 20000) break;
  }
  out.qrSessions = qs;
  // QR okutma + cihaz belgeleri (time: ISO metin). Ders belgesi (records) ya da oturumsuz belge korunur.
  out.qrCheckins = await purge(db, db.collection("attendance").where("time", "<", iso(nowMs - 180 * DAY)).orderBy("time"),
    v => !v.sessionId || !!v.records, 50000);
  out.lessonLogs = await purge(db, db.collection("teacherLessonLogs").where("date", "<", ymd(nowMs - 365 * DAY)).orderBy("date"), null, 20000);
  out.gateLog = await purge(db, db.collection("gateLog").where("date", "<", ymd(nowMs - 180 * DAY)).orderBy("date"), null, 20000);
  out.studentStats = await purge(db, db.collection("studentStats"), null, 20000);
  return out;
}

module.exports = { weeklyCleanupRun };
