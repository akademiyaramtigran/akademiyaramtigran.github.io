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
const STAFF = ["teacher", "registrar", "press", "admin"];

// Ana akademi: özel / toplu mesaj
exports.pushMessage = onDocumentCreated("messages/{id}", async (ev) => {
  const m = ev.data && ev.data.data(); if (!m) return;
  let docs = [];
  if (m.recipientNo) docs = await tokens("aat", "no", m.recipientNo);
  else if (typeof m.recipientId === "string" && m.recipientId.startsWith("t_")) {
    const t = await admin.firestore().collection("teachers").doc(m.recipientId.slice(2)).get();
    if (t.exists) docs = await tokens("aat", "no", t.get("no"));
  } else if (m.recipientId === "admin" || m.toRole === "admin") docs = await tokens("aat", "role", ["admin", "registrar"]);
  else if (m.recipientGroup === "all") docs = await tokens("aat");
  else if (m.recipientGroup === "allStudents") docs = await tokens("aat", "role", "student");
  else if (m.recipientGroup === "allTeachers") docs = await tokens("aat", "role", STAFF);
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
  await push(docs, l => ({ title: tx(l, "post") + (p.className ? " · " + p.className : ""), body: p.title || "" }), "/app/", "aat-post");
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
  const docs = await tokens("zarok");
  await push(docs, l => ({ title: tx(l, "ann"), body: a.title || "" }), "/zarok/app/", "zarok-ann");
});
