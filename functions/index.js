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

const SUFFIX = { student: "@ogrenci.aat", teacher: "@ogretmen.aat", admin: "@ogretmen.aat", guardian: "@veli.aat" };
const MANAGERS = ["admin", "registrar", "press"];
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

  // Yönetici hesaplarına yalnızca yönetici dokunabilir
  if (suffix === "@ogretmen.aat" && lvl !== "admin") {
    const t = await admin.firestore().doc("idx_staff/" + id).get();
    if (t.exists && t.get("lvl") === "admin") throw new HttpsError("permission-denied", "Yönetici hesabı");
  }

  const email = id + suffix;
  const auth = admin.auth();

  if (action === "create" || action === "setPassword") {
    if (typeof password !== "string" || password.length < 6) throw new HttpsError("invalid-argument", "Şifre en az 6 karakter");
    try {
      const u = await auth.getUserByEmail(email);
      await auth.updateUser(u.uid, { password, disabled: false });
      return { ok: true, uid: u.uid, email, existed: true };
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw new HttpsError("internal", e.message);
      const u = await auth.createUser({ email, password });
      return { ok: true, uid: u.uid, email, existed: false };
    }
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
