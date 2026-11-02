// ════════════════════════════════════════════════════════════════════════
//  Akademîya Aram Tîgran — Cloud Functions (sunucu tarafı kullanıcı yönetimi)
//
//  Neden: Tarayıcı, başka bir kullanıcının Firebase Auth hesabını ancak o
//  kişinin ESKİ ŞİFRESİYLE değiştirip silebilir. Bu yüzden şifreler düz metin
//  (_plainPass) olarak Firestore'da tutuluyordu. Bu fonksiyon Admin SDK ile
//  çalışır; eski şifre gerekmez → _plainPass tamamen kaldırılabilir.
//
//  Yayın:   firebase deploy --only functions
//  Sonra:   app/index.html → USE_CLOUD_FUNCTIONS = true
//  Ayrıntı: FUNCTIONS.md
// ════════════════════════════════════════════════════════════════════════
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 5 });

const SUFFIX = { student: "@ogrenci.aat", teacher: "@ogretmen.aat", admin: "@ogretmen.aat", guardian: "@veli.aat", kidteacher: "@zmamoste.aat" };
// Hesap yönetimi yalnızca yönetici + öğrenci işleri (basın hesap açamaz/şifre değiştiremez)
const MANAGERS = ["admin", "registrar"];
const idxId = no => String(no || "").replace(/[^A-Za-z0-9_\-.]/g, "").toLowerCase();

// Çağıranın yetki seviyesi — Firestore kurallarıyla aynı mantık (idx_staff.lvl)
async function callerLvl(auth) {
  const email = auth && auth.token && auth.token.email;
  if (!email) return null;
  if (email === "admin@aramtigran.edu") return "admin";
  if (!/@ogretmen\.aat$/.test(email)) return null;
  const d = await admin.firestore().doc("idx_staff/" + email.split("@")[0]).get();
  return d.exists ? (d.get("lvl") || "teacher") : null;
}

exports.aatUser = onCall(async (req) => {
  const lvl = await callerLvl(req.auth);
  if (!lvl || !MANAGERS.includes(lvl)) throw new HttpsError("permission-denied", "Yetki yok");

  const { action, no, role, password } = req.data || {};
  const id = idxId(no), suffix = SUFFIX[role];
  if (!id || !suffix) throw new HttpsError("invalid-argument", "no / role hatalı");

  // Personel hesapları: öğrenci işleri yalnızca "teacher" seviyesindeki (veya henüz dizinde
  // olmayan yeni) öğretmen hesaplarına dokunabilir; yönetici / basın / öğrenci işleri
  // hesaplarına ve KENDİ hesabına dokunamaz (Firestore kurallarıyla aynı ayrım).
  if (lvl !== "admin") {
    if (role === "admin") throw new HttpsError("permission-denied", "Yönetici hesabı");
    const callerId = String(req.auth.token.email).split("@")[0].toLowerCase();
    if (suffix === "@ogretmen.aat") {
      if (id === callerId) throw new HttpsError("permission-denied", "Kendi hesabı");
      const t = await admin.firestore().doc("idx_staff/" + id).get();
      if (t.exists && (t.get("lvl") || "teacher") !== "teacher") throw new HttpsError("permission-denied", "Özel personel hesabı");
    }
  }

  const email = id + suffix;
  const auth = admin.auth();

  if (action === "create" || action === "setPassword") {
    if (typeof password !== "string" || password.length < 8 || !/[0-9]/.test(password)) throw new HttpsError("invalid-argument", "Şifre en az 8 karakter ve bir rakam");
    let u = null;
    try { u = await auth.getUserByEmail(email); }
    catch (e) { if (e.code !== "auth/user-not-found") throw new HttpsError("internal", e.message); }
    // "create" mevcut bir hesabın şifresini ASLA değiştirmez (yanlışlıkla başkasının hesabını
    // ele geçirmeyi önler) → istemci sıradaki boş numaraya geçer. Şifre yenileme yalnızca "setPassword".
    if (action === "create") {
      if (u) throw new HttpsError("already-exists", "email-already-in-use");
      const n = await auth.createUser({ email, password });
      return { ok: true, uid: n.uid, email, existed: false };
    }
    if (u) { await auth.updateUser(u.uid, { password, disabled: false }); return { ok: true, uid: u.uid, email, existed: true }; }
    const n = await auth.createUser({ email, password });
    return { ok: true, uid: n.uid, email, existed: false };
  }

  if (action === "delete") {
    try {
      const u = await auth.getUserByEmail(email);
      await auth.deleteUser(u.uid);
      await admin.firestore().doc("roles/" + u.uid).delete().catch(() => {});
      return { ok: true, email };
    } catch (e) {
      if (e.code === "auth/user-not-found") return { ok: true, email, missing: true };
      throw new HttpsError("internal", e.message);
    }
  }

  throw new HttpsError("invalid-argument", "Bilinmeyen işlem");
});

// ════════════════════════════════════════════════════════════════════════
//  Anlık bildirimler (Web Push / FCM) — uygulama kapalıyken de telefona gelir.
//  Cihazlar pushTokens/{token} belgesine kaydolur: {uid,no,role,app,lang,area}.
//  app: "aat" (ana uygulama) | "zarok" (çocuk uygulaması)
//  role: student · teacher · registrar · press · admin · gate · guardian · kidteacher
// ════════════════════════════════════════════════════════════════════════
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

const TX = {
  ku: { msg: "💬 Peyama nû", ann: "📢 Ragihandin", post: "📝 Ji sinifê", in: "🟢 {0} ket dersê", out: "🏠 {0} hate teslîmkirin", end: "🔔 Dersa {0} qediya — dikarin wî/wê bistînin", absent: "⚠ {0} îro nehat dersê", kidmsg: "💬 Peyam ji akademiyê", gmsg: "💬 Peyama dêûbavan" },
  tr: { msg: "💬 Yeni mesaj", ann: "📢 Duyuru", post: "📝 Sınıftan yeni", in: "🟢 {0} derse girdi", out: "🏠 {0} teslim edildi", end: "🔔 {0} dersi bitti — teslim alabilirsiniz", absent: "⚠ {0} bugün derse gelmedi", kidmsg: "💬 Akademiden mesaj", gmsg: "💬 Veli mesajı" },
  en: { msg: "💬 New message", ann: "📢 Announcement", post: "📝 New from class", in: "🟢 {0} arrived at class", out: "🏠 {0} was picked up", end: "🔔 {0}'s lesson has ended — ready for pickup", absent: "⚠ {0} did not come to class today", kidmsg: "💬 Message from the academy", gmsg: "💬 Parent message" }
};
const tx = (lang, k, a) => { const d = TX[lang] || TX.ku; return String(d[k] || TX.ku[k]).replace("{0}", a == null ? "" : a); };
const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

// Belirli koşula uyan cihaz kayıtları (in sorguları 30'luk parçalar)
async function tokens(app, field, values) {
  const db = admin.firestore(); let out = [];
  if (field == null) { const s = await db.collection("pushTokens").where("app", "==", app).get(); return s.docs; }
  const vals = [...new Set((Array.isArray(values) ? values : [values]).filter(v => v != null && v !== "").map(String))];
  for (let i = 0; i < vals.length; i += 30) {
    const s = await db.collection("pushTokens").where("app", "==", app).where(field, "in", vals.slice(i, i + 30)).get();
    out = out.concat(s.docs);
  }
  return out;
}
// Gönder: dile göre metin, geçersiz cihazları temizle
async function push(docs, build, link, tag) {
  const seen = new Set(), byLang = {};
  for (const d of docs) { if (seen.has(d.id)) continue; seen.add(d.id); const l = d.get("lang") || "ku"; (byLang[l] = byLang[l] || []).push(d.id); }
  const dead = [];
  for (const [lang, toks] of Object.entries(byLang)) {
    const { title, body } = build(lang);
    for (let i = 0; i < toks.length; i += 500) {
      const part = toks.slice(i, i + 500);
      const r = await admin.messaging().sendEachForMulticast({
        tokens: part,
        data: { title: cut(title, 80), body: cut(body, 180), link: link || "./", tag: tag || "aat" },
        webpush: { headers: { Urgency: "high", TTL: "86400" } }
      });
      r.responses.forEach((x, j) => { const c = x.error && x.error.code; if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token" || c === "messaging/invalid-argument") dead.push(part[j]); });
    }
  }
  await Promise.all(dead.map(t => admin.firestore().collection("pushTokens").doc(t).delete().catch(() => {})));
}
const STAFF = ["teacher", "registrar", "press", "admin", "head"];

// Deneme bildirimi: giriş yapmış kullanıcının KENDİ kayıtlı cihazlarına (Ayarlar → "Test bildirimi")
exports.pushTest = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Giriş gerekli");
  const s = await admin.firestore().collection("pushTokens").where("uid", "==", req.auth.uid).get();
  if (!s.docs.length) return { ok: false, count: 0 };
  await push(s.docs, l => ({ title: tx(l, "msg"), body: "✅ Test" }), "/app/", "aat-test");
  return { ok: true, count: s.docs.length };
});

// Ana akademi: özel / toplu mesaj
exports.pushMessage = onDocumentCreated("messages/{id}", async (ev) => {
  const m = ev.data && ev.data.data(); if (!m) return;
  let docs = [];
  if (m.recipientNo) docs = await tokens("aat", "no", m.recipientNo);
  else if (typeof m.recipientId === "string" && m.recipientId.startsWith("t_")) {
    const t = await admin.firestore().collection("teachers").doc(m.recipientId.slice(2)).get();
    if (t.exists) docs = await tokens("aat", "no", t.get("no"));
  } else if (m.toRole === "teacher" && m.toTeacherNo) docs = (await tokens("aat", "no", m.toTeacherNo)).filter(d => d.get("role") !== "student");
  else if (m.toRole === "head" && m.toArea) docs = (await tokens("aat", "area", m.toArea)).filter(d => d.get("role") === "head");
  else if (m.recipientId === "admin" || m.toRole === "admin") docs = await tokens("aat", "role", ["admin", "registrar"]);
  else if (m.recipientGroup === "all") docs = await tokens("aat");
  else if (m.recipientGroup === "allStudents") docs = await tokens("aat", "role", "student");
  else if (m.recipientGroup === "allTeachers") docs = await tokens("aat", "role", STAFF);
  else if (m.recipientGroup === "allHeads") docs = await tokens("aat", "role", "head");
  else if (m.recipientGroup === "genHead") docs = (await tokens("aat", "area", "genel")).filter(d => d.get("role") === "head");
  else if (typeof m.recipientGroup === "string" && m.recipientGroup.startsWith("area_")) {
    docs = (await tokens("aat", "area", m.recipientGroup.slice(5))).filter(d => d.get("role") === "student");
  }
  if (!docs.length) return;
  await push(docs, l => ({ title: tx(l, "msg"), body: (m.anonymous ? "" : (m.from ? m.from + ": " : "")) + (m.subject || m.body || "") }), "/app/", "aat-msg");
});

// Ana akademi: duyuru
exports.pushAnnouncement = onDocumentCreated("announcements/{id}", async (ev) => {
  const a = ev.data && ev.data.data(); if (!a) return;
  const t = a.targets || ["all"]; let docs = [];
  if (t.includes("all")) docs = await tokens("aat");
  else {
    if (t.includes("allStudents") || t.includes("students")) docs = docs.concat(await tokens("aat", "role", "student"));
    if (t.includes("teachers") || t.includes("allTeachers")) docs = docs.concat(await tokens("aat", "role", STAFF));
    const areas = t.filter(x => !["all", "allStudents", "students", "teachers", "allTeachers"].includes(x));
    if (areas.length) docs = docs.concat(await tokens("aat", "area", areas));
  }
  if (!docs.length) return;
  await push(docs, l => ({ title: tx(l, "ann"), body: a.title || a.body || "" }), "/app/", "aat-ann");
});

// Ana akademi: sınıfa ödev / belge / duyuru → sınıfın öğrencileri
exports.pushClassPost = onDocumentCreated("classPosts/{id}", async (ev) => {
  const p = ev.data && ev.data.data(); if (!p || !p.classId) return;
  const c = await admin.firestore().collection("classes").doc(p.classId).get();
  const nos = c.exists ? (c.get("studentNos") || []) : [];
  if (!nos.length) return;
  const docs = (await tokens("aat", "no", nos)).filter(d => d.get("role") === "student");
  await push(docs, l => ({ title: tx(l, p.type === "duyuru" ? "ann" : "post") + (p.className ? " · " + p.className : ""), body: p.title || "" }), "/app/", "aat-post");
});

// Çocuk akademisi: derse giriş / teslim → velilere
exports.pushKidAttendance = onDocumentCreated("kidAttendance/{id}", async (ev) => {
  const r = ev.data && ev.data.data(); if (!r || !(r.guardianNos || []).length) return;
  const docs = await tokens("zarok", "no", r.guardianNos);
  const time = r.time ? new Date(r.time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }) : "";
  const k = { out: "out", end: "end", absent: "absent" }[r.type] || "in";
  await push(docs, l => ({ title: tx(l, k, r.kidName || ""), body: r.lessonName ? r.lessonName + (time ? " · " + time : "") : time }), "/zarok/app/", "zarok-att-" + (r.kidId || ""));
});

// Çocuk akademisi: sınıfa ödev / belge / duyuru → sınıftaki çocukların velileri
exports.pushKidClassPost = onDocumentCreated("kidClassPosts/{id}", async (ev) => {
  const p = ev.data && ev.data.data(); if (!p || !p.classId) return;
  const db = admin.firestore(), c = await db.collection("kidClasses").doc(p.classId).get();
  const nos = c.exists ? (c.get("studentNos") || []).map(String) : [];
  let gnos = [];
  for (let i = 0; i < nos.length; i += 30) {
    const s = await db.collection("kids").where("no", "in", nos.slice(i, i + 30)).get();
    s.docs.forEach(k => gnos = gnos.concat(k.get("guardianNos") || []));
  }
  if (!gnos.length) return;
  const docs = await tokens("zarok", "no", gnos);
  await push(docs, l => ({ title: tx(l, p.type === "duyuru" ? "ann" : "post") + (p.className ? " · " + p.className : ""), body: p.title || "" }), "/zarok/app/", "zarok-post");
});

// Çocuk akademisi: mesaj (akademi → veli, veli → çocuk öğretmenleri)
exports.pushKidMessage = onDocumentCreated("kidMessages/{id}", async (ev) => {
  const m = ev.data && ev.data.data(); if (!m) return;
  if (m.from === "staff" && m.guardianNo) {
    const docs = await tokens("zarok", "no", m.guardianNo);
    await push(docs, l => ({ title: tx(l, "kidmsg"), body: (m.by ? m.by + ": " : "") + (m.text || "") }), "/zarok/app/", "zarok-msg");
  } else if (m.from === "guardian") {
    // Yalnızca çocuğun öğretmenlerine (sınıf öğretmeni + sınıfa ders veren); çocuk belli değilse tüm çocuk öğretmenleri
    let docs = [];
    if (m.toTeacherNo) docs = (await tokens("zarok", "no", m.toTeacherNo)).filter(d => d.get("role") === "kidteacher");
    else if (m.kidId) {
      const db = admin.firestore(), k = await db.collection("kids").doc(m.kidId).get();
      const kno = k.exists ? String(k.get("no") || "") : "";
      if (kno) {
        const cls = (await db.collection("kidClasses").where("studentNos", "array-contains", kno).get()).docs.filter(c => c.get("status") !== "closed");
        const tn = new Set(cls.flatMap(c => (c.get("teacherNos") || []).map(String)));
        for (const c of cls) (await db.collection("kidSchedule").where("classId", "==", c.id).get()).docs.forEach(l => { if (l.get("teacherNo")) tn.add(String(l.get("teacherNo"))); });
        if (tn.size) docs = (await tokens("zarok", "no", [...tn])).filter(d => d.get("role") === "kidteacher");
      }
    }
    if (!docs.length && !m.kidId) docs = await tokens("zarok", "role", "kidteacher");
    await push(docs, l => ({ title: tx(l, "gmsg"), body: (m.guardianName ? m.guardianName + ": " : "") + (m.text || "") }), "/zarok/app/", "zarok-gmsg");
  }
});

// Çocuk akademisi: duyuru → tüm veliler ve çocuk öğretmenleri
exports.pushKidAnnouncement = onDocumentCreated("kidAnnouncements/{id}", async (ev) => {
  const a = ev.data && ev.data.data(); if (!a) return;
  let docs;
  if (a.area) { // bölüm sorumlusunun duyurusu: yalnızca o dersteki çocukların velileri
    const ks = await admin.firestore().collection("kids").where("area", "==", a.area).get();
    const g = [...new Set(ks.docs.flatMap(d => (d.get("guardianNos") || []).map(String)))];
    docs = g.length ? await tokens("zarok", "no", g) : [];
  } else docs = await tokens("zarok");
  if (!docs.length) return;
  await push(docs, l => ({ title: tx(l, "ann"), body: a.title || "" }), "/zarok/app/", "zarok-ann");
});

// ── Haftalık değerlendirme hatırlatması (her Cuma 15:00, İstanbul) ──
//  Öğretmen: sınıflarındaki (sınıf öğretmeni ya da sınıfa ders veren) öğrencilerden bu hafta
//  değerlendirmediği varsa. Öğrenci: sınıfının öğretmenlerinden bu hafta değerlendirmediği varsa.
//  Hafta anahtarı uygulamayla aynı: haftanın Pazartesi tarihi (YYYY-AA-GG, İstanbul saati).
const { onSchedule } = require("firebase-functions/v2/scheduler");
// (Cuma değerlendirme hatırlatması kaldırıldı: form yayınlanınca bildirim gider — pushEvalForm)

// Değerlendirme formu yayınlanınca (oluşturulduğunda aktifse ya da duraklatılmışken yayına alınınca) değerlendirecek kişilere bildirim
//  t2s → bölümün öğretmenleri · s2t → bölümün öğrencileri · t2k → çocuk akademisi öğretmenleri · g2t → bölümdeki çocukların velileri
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const EFTX = { ku: "📝 Forma nirxandinê", tr: "📝 Değerlendirme formu", en: "📝 Evaluation form" };
const EFB = { ku: "{0} — ji kerema xwe dagire", tr: "{0} — lütfen doldurun", en: "{0} — please fill it in" };
// Formun alanına bağlı değerlendirenler: alanın öğrencilerine (sınıf / ders programı üzerinden) ders veren öğretmenler — kendi bölümü farklı olsa da
async function areaTeachers(area, all, kid) {
  const db = admin.firestore();
  const [cls, sch, ppl] = await Promise.all([db.collection(kid ? "kidClasses" : "classes").get(), db.collection(kid ? "kidSchedule" : "schedule").get(), db.collection(kid ? "kids" : "students").get()]);
  const inArea = new Set(ppl.docs.filter(d => all || d.get("area") === area).map(d => String(d.get("no") || "")));
  const clsHas = {}; cls.docs.forEach(d => { clsHas[d.id] = (d.get("studentNos") || []).some(n => inArea.has(String(n))); });
  const out = new Set();
  cls.docs.forEach(d => { if (clsHas[d.id] && d.get("status") !== "closed") (d.get("teacherNos") || []).forEach(t => out.add(String(t))); });
  sch.docs.forEach(d => { const t = d.get("teacherNo"); if (!t) return; const c = d.get("classId"); if ((c && clsHas[c]) || (!c && (all || d.get("area") === area))) out.add(String(t)); });
  return [...out];
}
exports.pushEvalForm = onDocumentWritten("evalForms/{id}", async (ev) => {
  const before = ev.data && ev.data.before && ev.data.before.exists ? ev.data.before.data() : null;
  const f = ev.data && ev.data.after && ev.data.after.exists ? ev.data.after.data() : null;
  if (!f || !f.active || (before && before.active)) return;
  const area = String(f.area || ""), all = area === "genel";
  let docs = [], app = "aat", link = "/app/";
  const uniq = arr => { const m = new Map(); arr.forEach(d => m.set(d.id, d)); return [...m.values()]; };
  if (f.direction === "t2s") {
    const byArea = (all ? await tokens("aat", "role", "teacher") : await tokens("aat", "area", area)).filter(d => d.get("role") === "teacher");
    const linked = (await tokens("aat", "no", await areaTeachers(area, all, false))).filter(d => d.get("role") === "teacher");
    docs = uniq(byArea.concat(linked));
  } else if (f.direction === "s2t") {
    docs = (all ? await tokens("aat", "role", "student") : await tokens("aat", "area", area)).filter(d => d.get("role") === "student");
  } else if (f.direction === "t2k") {
    app = "zarok"; link = "/zarok/app/";
    const byArea = (await tokens("zarok", "area", area)).filter(d => d.get("role") === "kidteacher");
    const linked = (await tokens("zarok", "no", await areaTeachers(area, false, true))).filter(d => d.get("role") === "kidteacher");
    docs = uniq(byArea.concat(linked));
  } else if (f.direction === "g2t") {
    app = "zarok"; link = "/zarok/app/";
    const ks = await admin.firestore().collection("kids").where("area", "==", area).get();
    const g = [...new Set(ks.docs.flatMap(d => (d.get("guardianNos") || []).map(String)))];
    docs = (await tokens("zarok", "no", g)).filter(d => d.get("role") === "guardian");
  }
  if (!docs.length) return;
  await push(docs, l => ({ title: EFTX[l] || EFTX.ku, body: (EFB[l] || EFB.ku).replace("{0}", f.title || "") }), link, app + "-evalform");
});

// ── Aylık analiz bildirimi: her ayın 1'i 09:05 (İstanbul) — biten ayın risk özetini
//    bölüm sorumlusuna (kendi alanı; genel sorumlu: genel dersler), yöneticiye (hepsi) ve Öğrenci İşleri'ne (yalnız devam) gönderir.
//    Risk: devam < %70 (en az 2 kayıt), değerlendirme < 5/10, önceki aya göre devamda ≥ 15 puan düşüş. Ayrıntı uygulamada: Hişyarî.
const MANTX = {
  ku: { t: "📊 Analîza mehane · {0}", b: "{0} di xeterê de — li Hişyarî binêre" , st: "xwendekar", ls: "ders", tc: "mamoste" },
  tr: { t: "📊 Aylık analiz · {0}", b: "{0} risk altında — Uyarılar'a bakın", st: "öğrenci", ls: "ders", tc: "öğretmen" },
  en: { t: "📊 Monthly analysis · {0}", b: "{0} at risk — see Alerts", st: "students", ls: "lessons", tc: "teachers" }
};
const { istanbulYm, ymShift, ymEnd, monthlyRiskCounts, kidRiskCounts } = require("./risk");
exports.monthlyAnalysis = onSchedule({ schedule: "5 9 1 * *", timeZone: "Europe/Istanbul" }, async () => {
  const db = admin.firestore(); const M = ymShift(istanbulYm(), -1), from = ymShift(M, -1) + "-01", to = ymEnd(M);
  const [st, sch, tc, at, se, te, er] = await Promise.all([db.collection("students").get(), db.collection("schedule").get(), db.collection("teachers").get(),
    db.collection("attendance").where("date", ">=", from).where("date", "<=", to).get(),
    db.collection("studentEvals").where("wk", ">=", M + "-01").where("wk", "<=", to).get(), db.collection("teacherEvals").where("wk", ">=", M + "-01").where("wk", "<=", to).get(),
    db.collection("evalResponses").where("academy", "==", "aat").get()]);
  const counts = monthlyRiskCounts({ students: st.docs.map(d => d.data()).filter(s => s.id != null), schedule: sch.docs.map(d => d.data()), teachers: tc.docs.map(d => d.data()),
    att: at.docs.map(d => d.data()), sEvals: se.docs.map(d => d.data()), tEvals: te.docs.map(d => d.data()), efr: er.docs.map(d => d.data()), M });
  // Çocuk Akademisi (alan adları ana akademiden farklı: solfej, drama, …)
  const withId = q => q.docs.map(d => ({ ...d.data(), _id: d.id }));
  const [kd, kc, ks, ka, lv, ke, kte, ker] = await Promise.all([db.collection("kids").get(), db.collection("kidClasses").get(), db.collection("kidSchedule").get(),
    db.collection("kidAttendance").where("date", ">=", from).where("date", "<=", to).get(), db.collection("studentLeaves").where("kid", "==", true).get(),
    db.collection("kidEvals").where("wk", ">=", M + "-01").where("wk", "<=", to).get(), db.collection("kidTeacherEvals").where("wk", ">=", M + "-01").where("wk", "<=", to).get(),
    db.collection("evalResponses").where("academy", "==", "kid").get()]);
  const todayIst = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const kc2 = kidRiskCounts({ kids: withId(kd), cls: withId(kc), sched: withId(ks), att: ka.docs.map(d => d.data()), leaves: lv.docs.map(d => d.data()),
    kEvals: ke.docs.map(d => d.data()), gEvals: kte.docs.map(d => d.data()), efr: ker.docs.map(d => d.data()), M, today: todayIst });
  Object.entries(kc2).forEach(([a, c]) => { counts[a] = c; });
  const [y, m] = M.split("-").map(Number);
  const mName = l => new Intl.DateTimeFormat(l === "en" ? "en-GB" : "tr-TR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  const txt = (l, c, attOnly) => { const d = MANTX[l] || MANTX.ku; const p = attOnly ? "a" : ""; const parts = [["st", c[p + "st"]], ["ls", c[p + "ls"]], ["tc", c[p + "tc"]]].filter(x => x[1]).map(x => x[1] + " " + d[x[0]]);
    return parts.length ? { title: d.t.replace("{0}", mName(l)), body: d.b.replace("{0}", parts.join(", ")) } : null; };
  const sum = attOnly => Object.values(counts).reduce((a, c) => ({ st: a.st + c.st, ls: a.ls + c.ls, tc: a.tc + c.tc, ast: a.ast + c.ast, als: a.als + c.als, atc: a.atc + c.atc }), { st: 0, ls: 0, tc: 0, ast: 0, als: 0, atc: 0 });
  const tot = sum();
  const heads = await tokens("aat", "role", "head");
  for (const d of heads) { const c = counts[String(d.get("area") || "")]; if (!c) continue; if (!txt("ku", c, false)) continue; await push([d], l => txt(l, c, false), "/app/", "aat-monthly"); }
  const admins = await tokens("aat", "role", "admin"); if (admins.length && txt("ku", tot, false)) await push(admins, l => txt(l, tot, false), "/app/", "aat-monthly");
  const regs = await tokens("aat", "role", "registrar"); if (regs.length && txt("ku", tot, true)) await push(regs, l => txt(l, tot, true), "/app/", "aat-monthly");
  return { M, counts };
});

// ── Haftalık temizlik: Pazar 03:17 (İstanbul) — eski QR oturumları/kodları/okutmaları, eski ders ve kapı kayıtları ──
const { weeklyCleanupRun } = require("./temizlik");
exports.weeklyCleanup = onSchedule({ schedule: "17 3 * * 0", timeZone: "Europe/Istanbul" }, async () => {
  const r = await weeklyCleanupRun(admin.firestore(), Date.now());
  console.log("[weeklyCleanup]", JSON.stringify(r));
});
