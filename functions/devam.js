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

// Belgeden satırlar: [{ id, data }]
function buildRows(attId, att, idx) {
  const k = lessonKey(attId, att); if (!k || att.teacherAbsent) return [];
  const rows = [];
  for (const [sid, v] of Object.entries(att.records)) {
    const status = STATUS[v]; const st = idx.get(String(sid));
    if (!status || !st) continue;
    rows.push({
      id: k.lessonId + "-" + k.date + "-" + st.no,
      data: { studentNo: st.no, lessonId: k.lessonId, lessonFire: String(att.lessonFire || k.lessonId), lessonName: String(att.lessonName || ""),
        area: String(att.area || ""), date: k.date, status, teacherName: String(att.takenBy || att.teacherName || "") }
    });
  }
  return rows;
}

// Bildirim gereken değişiklikler: yeni duruma "geç" ya da "yok" girenler (öncekiyle aynıysa yeniden bildirilmez)
function notifyChanges(before, after) {
  const out = [];
  const b = (before && before.records) || {};
  for (const [sid, v] of Object.entries((after && after.records) || {})) if ((v === "off" || v === "late") && b[sid] !== v) out.push({ sid, status: v });
  return out;
}

const TXD = {
  ku: { t: "📋 Amadebûn", late: "{0}: Tu dereng hatî ⏱ — heke şaş be îtîraz bike", off: "{0}: Tu nehatî ❌ — heke şaş be îtîraz bike" },
  tr: { t: "📋 Yoklama", late: "{0}: Geç kaldın ⏱ — yanlışsa itiraz et", off: "{0}: Gelmedi yazıldın ❌ — yanlışsa itiraz et" },
  en: { t: "📋 Attendance", late: "{0}: marked late ⏱ — object if this is wrong", off: "{0}: marked absent ❌ — object if this is wrong" }
};
const txd = (lang, k, a) => String((TXD[lang] || TXD.ku)[k]).replace("{0}", a == null ? "" : a);

module.exports = { lessonKey, studentIndex, buildRows, notifyChanges, txd, STATUS };
