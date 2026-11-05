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
function isFinal(att, today) { return !!(att && (att.endedAt || String(att.date || "") < (today || istToday()))); }

// Belgeden satırlar: [{ id, data }]
function buildRows(attId, att, idx, today) {
  const k = lessonKey(attId, att); if (!k || att.teacherAbsent) return [];
  const fin = isFinal(att, today);
  const rows = [];
  for (const [sid, v] of Object.entries(att.records)) {
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

module.exports = { lessonKey, studentIndex, buildRows, notifyChanges, isFinal, istToday, txd, STATUS };
