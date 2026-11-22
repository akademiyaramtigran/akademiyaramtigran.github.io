// Öğrenci devam kaydı (studentAtt) — ders yoklaması kaydedilince her öğrenci için KENDİNE ait küçük bir kayıt yazılır.
// Öğrenci yalnız kendi kayıtlarını okur (ders belgesi sınıf arkadaşlarını da içerdiğinden öğrenciye açık DEĞİL).
// Saf mantık burada; tetikleyiciler functions/index.js içinde.
const STATUS = { on: "on", late: "late", off: "off", leave: "leave" };
const LESSON_DOC = /^(.+)-(\d{4}-\d{2}-\d{2})$/;

// attendance/{id} ders belgesi mi? (QR okutma / cihaz belgeleri değil)
function lessonKey(id, d) {
  if (!d || !d.records || typeof d.records !== "object") return null;
  const m = LESSON_DOC.exec(String(id || ""));
  if (!m) return null;
  return { lessonId: String(d.lessonId != null ? d.lessonId : m[1]), date: String(d.date || m[2]) };
}

// students koleksiyonundan: kayıt anahtarı (id ya da belge kimliği) → { no, name }
function studentIndex(docs) {
  const m = new Map();
  docs.forEach(x => {
    const v = x.data ? x.data() : x; const did = x.id;
    if (!v || !v.no) return;
    const rec = { no: String(v.no), name: String(v.name || "") };
    if (v.id != null) m.set(String(v.id), rec);
    if (did) m.set(String(did), rec);
  });
  return m;
}

// Bugünün tarihi (İstanbul) — YYYY-MM-DD
const istToday = (ms) => new Date(ms == null ? Date.now() : ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
// Yoklama KESİNLEŞTİ mi? Ders bitirildi (endedAt) ya da gün geçti. Ders sürerken öğretmen "Kaydet"e basınca okutmayan herkes
// geçici olarak "yok" yazılır — bu kesin değildir, öğrenciye "gelmedi" bildirimi gitmez / ekranda "bekliyor" görünür.
// (Yeni kural: gün geçmesi artık kesinleştirmez — öğretmen "Dersi bitir" demeli; eski kayıtlar DV_CUTOFF öncesi sayılır.)
/*DEVAMCORE-BEGIN*/
// ── DEVAM ORTAK HESABI (istemci: app/index.html · sunucu: functions/devam.js — iki metin BİREBİR aynı olmalı; tools/devam-testi.js denetler) ──
// Kural: bir yoklama yalnız KESİNLEŞTİKTEN sonra (öğretmen "Dersi bitir" dedi / sorumlu-yönetici düzeltti-kapattı) raporlara,
// analize, uyarılara ve öğrenci ekranına sayılır. Devam eden ders görünmez. İzin sonradan girilse bile o günün "yok"u "izinli" olur.
// bu tarihten ÖNCEKİ yoklamalar (eski kayıtlar) "dersi bitir" olmadan da kesin sayılır (test ortamında geçersiz kılınabilir)
const DV_CUTOFF = (typeof globalThis !== "undefined" && globalThis.__DV_CUTOFF) || (typeof process !== "undefined" && process.env && process.env.DV_CUTOFF) || "2026-11-22";
const dvClosed = a => !!(a && (a.endedAt || a.closedBy || String(a.date || "") < DV_CUTOFF));
const dvPct = (on, late, off) => { const n = (on || 0) + (late || 0) + (off || 0); return n ? Math.round(((on || 0) + (late || 0)) / n * 100) : null; };
const dvLeaveCovers = (l, date, lessonId) => { if (!l || String(l.from || "") > String(date) || String(date) > String(l.to || "")) return false; const ids = l.lessonIds; return !ids || !ids.length || ids.map(String).includes(String(lessonId)); };
function dvRecords(a, leaves, noOfKey) {
  const out = {}, date = String(a.date || "");
  Object.entries(a.records || {}).forEach(([k, v]) => {
    if (v === "off") { const no = noOfKey ? noOfKey(k) : null;
      if (no != null && (leaves || []).some(l => !l.kid && String(l.studentNo) === String(no) && dvLeaveCovers(l, date, a.lessonId))) v = "leave"; }
    out[k] = v; });
  return out;
}
const dvStatDocs = (docs, leaves, noOfKey) => (docs || []).filter(a => a && a.date && a.records && !a.teacherAbsent && Object.keys(a.records).length && dvClosed(a))
  .map(a => ({ ...a, records: dvRecords(a, leaves, noOfKey) }));
const dvOpenDocs = docs => (docs || []).filter(a => a && a.date && a.records && !a.teacherAbsent && Object.keys(a.records).length && !dvClosed(a));
/*DEVAMCORE-END*/
function isFinal(att) { return dvClosed(att); }

// Belgeden satırlar: [{ id, data }]
function buildRows(attId, att, idx, today, leaves) {
  const k = lessonKey(attId, att); if (!k || att.teacherAbsent) return [];
  const fin = isFinal(att, today);
  const rows = [];
  const recs = dvRecords({ ...att, date: k.date, lessonId: k.lessonId }, leaves, sid => { const st = idx.get(String(sid)); return st ? st.no : null; });
  for (const [sid, v] of Object.entries(recs)) {
    const status = STATUS[v]; const st = idx.get(String(sid));
    if (!status || !st) continue;
    rows.push({
      id: k.lessonId + "-" + k.date + "-" + st.no,
      data: { studentNo: st.no, lessonId: k.lessonId, lessonFire: String(att.lessonFire || k.lessonId), lessonName: String(att.lessonName || ""),
        area: String(att.area || ""), date: k.date, status, final: fin, teacherName: String(att.takenBy || att.teacherName || "") }
    });
  }
  return rows;
}

// Bildirim gereken değişiklikler: yeni duruma "geç" ya da "yok" girenler (öncekiyle aynıysa yeniden bildirilmez)
function notifyChanges(before, after, today) {
  const out = [];
  if (!isFinal(after, today)) return out;                       // ders sürerken bildirim yok
  const b = isFinal(before, today) ? ((before && before.records) || {}) : {};   // yeni kesinleşti → bütün geç/yok bildirilir
  for (const [sid, v] of Object.entries((after && after.records) || {})) if ((v === "off" || v === "late") && b[sid] !== v) out.push({ sid, status: v });
  return out;
}

const TXD = {
  ku: { t: "📋 Amadebûn", late: "{0}: Tu dereng hatî ⏱ — heke şaş be îtîraz bike", off: "{0}: Tu nehatî ❌ — heke şaş be îtîraz bike" },
  tr: { t: "📋 Yoklama", late: "{0}: Geç kaldın ⏱ — yanlışsa itiraz et", off: "{0}: Gelmedi yazıldın ❌ — yanlışsa itiraz et" },
  en: { t: "📋 Attendance", late: "{0}: marked late ⏱ — object if this is wrong", off: "{0}: marked absent ❌ — object if this is wrong" }
};
const txd = (lang, k, a) => String((TXD[lang] || TXD.ku)[k]).replace("{0}", a == null ? "" : a);

// "Lütfen dersinizi bitirin" hatırlatması gerekiyor mu? (yoklama var, ders kapanmamış, ders saati + 15 dk geçti ya da gün geçti)
function nagDue(att, ls, today, hm) {
  if (!att || !ls || att.teacherAbsent || !att.records || !Object.keys(att.records).length || dvClosed(att)) return false;
  if (String(att.date) > today) return false;
  if (String(att.date) < today) return true;
  const e = String(ls.end || ""); if (!/^\d{1,2}:\d{2}$/.test(e) || !/^\d{1,2}:\d{2}$/.test(String(hm))) return false;
  const [h, m] = e.split(":").map(Number), [ch, cm] = String(hm).split(":").map(Number);
  return ch * 60 + cm >= h * 60 + m + 15;
}
module.exports = { nagDue, lessonKey, studentIndex, buildRows, notifyChanges, isFinal, istToday, txd, STATUS, dvClosed, dvPct, dvLeaveCovers, dvRecords, dvStatDocs, dvOpenDocs, DV_CUTOFF };
