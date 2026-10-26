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
  ku: { msg: "💬 Peyama nû", ann: "📢 Ragihandin", post: "📝 Ji sinifê", in: "🟢 {0} ket dersê", out: "🏠 {0} hate teslîmkirin", kidmsg: "💬 Peyam ji akademiyê", gmsg: "💬 Peyama dêûbavan" },
  tr: { msg: "💬 Yeni mesaj", ann: "📢 Duyuru", post: "📝 Sınıftan yeni", in: "🟢 {0} derse girdi", out: "🏠 {0} teslim edildi", kidmsg: "💬 Akademiden mesaj", gmsg: "💬 Veli mesajı" },
  en: { msg: "💬 New message", ann: "📢 Announcement", post: "📝 New from class", in: "🟢 {0} arrived at class", out: "🏠 {0} was picked up", kidmsg: "💬 Message from the academy", gmsg: "💬 Parent message" }
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
  } else if (m.toRole === "head" && m.toArea) docs = (await tokens("aat", "area", m.toArea)).filter(d => d.get("role") === "head");
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
  await push(docs, l => ({ title: tx(l, r.type === "out" ? "out" : "in", r.kidName || ""), body: time }), "/zarok/app/", "zarok-att-" + (r.kidId || ""));
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
  await push(docs, l => ({ title: tx(l, "post") + (p.className ? " · " + p.className : ""), body: p.title || "" }), "/zarok/app/", "zarok-post");
});

// Çocuk akademisi: mesaj (akademi → veli, veli → çocuk öğretmenleri)
exports.pushKidMessage = onDocumentCreated("kidMessages/{id}", async (ev) => {
  const m = ev.data && ev.data.data(); if (!m) return;
  if (m.from === "staff" && m.guardianNo) {
    const docs = await tokens("zarok", "no", m.guardianNo);
    await push(docs, l => ({ title: tx(l, "kidmsg"), body: (m.by ? m.by + ": " : "") + (m.text || "") }), "/zarok/app/", "zarok-msg");
  } else if (m.from === "guardian") {
    const docs = await tokens("zarok", "role", "kidteacher");
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
const EVTX = {
  ku: { t: "📝 Nirxandina heftane", tb: "{0} xwendekar vê heftê nehatine nirxandin", s: "⭐ Mamosteyên xwe binirxîne", sb: "Nirxandina vê heftê li bendê ye" },
  tr: { t: "📝 Haftalık değerlendirme", tb: "Bu hafta {0} öğrenciniz değerlendirilmedi", s: "⭐ Öğretmenlerini değerlendir", sb: "Bu haftanın değerlendirmesi bekliyor" },
  en: { t: "📝 Weekly evaluation", tb: "{0} students not evaluated this week", s: "⭐ Rate your teachers", sb: "This week's evaluation is pending" }
};
const evtx = (l, k, a) => String((EVTX[l] || EVTX.ku)[k]).replace("{0}", a == null ? "" : a);
function istanbulMonday() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
  d.setUTCDate(d.getUTCDate() - (dow < 0 ? 0 : dow));
  return d.toISOString().slice(0, 10);
}
exports.evalReminder = onSchedule({ schedule: "0 15 * * 5", timeZone: "Europe/Istanbul" }, async () => {
  const db = admin.firestore(); const wk = istanbulMonday();
  const [cls, sch, se, te] = await Promise.all([
    db.collection("classes").get(), db.collection("schedule").get(),
    db.collection("studentEvals").where("wk", "==", wk).get(), db.collection("teacherEvals").where("wk", "==", wk).get()]);
  const classes = cls.docs.filter(d => d.get("kind") && d.get("status") !== "closed");
  const stuOf = {}; classes.forEach(d => { stuOf[d.id] = (d.get("studentNos") || []).map(String); });
  const tStu = {}, sTch = {};   // öğretmen → öğrenciler, öğrenci → öğretmenler
  const link = (t, s) => { (tStu[t] = tStu[t] || new Set()).add(s); (sTch[s] = sTch[s] || new Set()).add(t); };
  classes.forEach(d => (d.get("teacherNos") || []).forEach(t => (stuOf[d.id] || []).forEach(s => link(String(t), s))));
  sch.docs.forEach(d => { const t = d.get("teacherNo"), c = d.get("classId"); if (t && c && stuOf[c]) stuOf[c].forEach(s => link(String(t), s)); });
  const sDone = new Set(se.docs.map(d => d.get("teacherNo") + "|" + d.get("studentNo")));
  const tDone = new Set(te.docs.map(d => d.get("studentNo") + "|" + d.get("teacherNo")));
  const tPend = {}; Object.entries(tStu).forEach(([t, ss]) => { const n = [...ss].filter(s => !sDone.has(t + "|" + s)).length; if (n) tPend[t] = n; });
  const sPend = Object.keys(sTch).filter(s => [...sTch[s]].some(t => !tDone.has(s + "|" + t)));
  const tDocs = (await tokens("aat", "no", Object.keys(tPend))).filter(d => d.get("role") === "teacher");
  for (const d of tDocs) await push([d], l => ({ title: evtx(l, "t"), body: evtx(l, "tb", tPend[String(d.get("no"))]) }), "/app/", "aat-eval");
  const sDocs = (await tokens("aat", "no", sPend)).filter(d => d.get("role") === "student");
  if (sDocs.length) await push(sDocs, l => ({ title: evtx(l, "s"), body: evtx(l, "sb") }), "/app/", "aat-eval");
});
