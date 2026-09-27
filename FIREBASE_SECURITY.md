# Firebase Güvenlik — Kurallar v5 (rol ayrımı + en az yetki)

## v5 — Rol ayrımı (27.09.2026)

| Rol | Yapabilir | Yapamaz |
|---|---|---|
| **Yönetici** | Her şey; basın / öğrenci işleri kartları; personel dizini | — |
| **Öğrenci İşleri** | Öğrenci + (sıradan) öğretmen kaydı, başvurular, Akademiya Zarokan yönetimi (çocuk, veli, çocuk öğretmeni, yoklama, program, duyuru, mesaj) | Kendini/başkasını yönetici/basın yapmak; özel kartlara dokunmak; site haberi |
| **Basın** | Site haberleri + arşiv (ana site **ve** çocuk sitesi), haber medyası | Hesap açmak, şifre değiştirmek, öğrenci/başvuru/çocuk verisi okumak |
| **Öğretmen** | Ders, yoklama, duyuru, anket; öğrenci ekleme | Öğrenci silme/düzenleme, site haberi, başvurular, çocuk verisi (bağlanmadıkça) |
| **Öğrenci** | Kendi kaydı (profil alanları), kendine gelen mesajlar, kendi anket yanıtı, QR yoklama | Başkasının mesajı/yanıtı/cihazı; yönetici adına toplu mesaj |
| **Veli** | Yalnız kendi çocuğu (izin/teslim/sağlık alanları), kendi mesajları | Diğer çocuklar, yetişkin akademi verisi |
| **Çocuk öğretmeni** | Çocuklar, veli iletişimi, yoklama, duyuru, veli mesajları | Çocuk kaydı açmak, program değiştirmek, yetişkin verisi |

Akademi öğretmeni çocuk akademisinde ders veriyorsa Öğrenci İşleri → Akademiya Zarokan →
Mamoste → "Mamosteyê akademiyê? Jimara wî/wê" alanıyla bağlanır (yeni hesap açılmaz).

Kapatılan açıklar (v5): basın/öğrenci işleri dizine `lvl:"admin"` yazıp **yönetici olabiliyordu**;
basın Cloud Function ile herkesin şifresini değiştirebiliyordu; her öğretmen site haberi yazıp
başvuru belgelerini okuyabiliyordu; öğrenci **yönetici adına tüm öğrencilere mesaj** atabiliyor,
başkalarının özel mesajlarını/anket yanıtlarını okuyup silebiliyordu. Hepsi emülatörde testli
(`tools/kural-testi.js` 132 senaryo, `tools/fonksiyon-testi.js` 17 senaryo).

---

# Kurallar v4 (üyelik dizini) — önceki sürüm notları

## Kapatılan açık (kritik)

Eski kurallar rolü **yalnızca e-posta uzantısından** anlıyordu (`@ogretmen.aat` = personel).
Firebase'in istemci API anahtarı herkese açık olduğu için (her web uygulamasında böyledir),
**herhangi biri** `9999@ogretmen.aat` gibi bir hesap açıp tüm öğrenci/öğretmen kayıtlarını
okuyabiliyor, silebiliyor, haber yükleyebiliyordu. Emülatörde doğrulandı (eski kurallarla
34 testin 11'i başarısız).

**v4 ile** yetki, yalnızca personelin yazabildiği bir dizinden gelir:

| Koleksiyon | İçerik | Kim yazar |
|---|---|---|
| `idx_staff/{no}` | `{no, lvl}` — lvl: `admin` · `registrar` · `press` · `teacher` | yönetici seviyesi |
| `idx_students/{no}` | `{no}` | yönetici seviyesi |

- Öğretmen/öğrenci eklenince, silinince uygulama dizini **otomatik** günceller.
- **Yönetici her girişte** dizini listelerle eşitler (eksikleri ekler, silinenleri kaldırır).
- Öğretmen artık kendini yönetici yapamaz, başka öğretmeni silemez/düzenleyemez.
- Öğrenci/öğretmen kendi kaydında alan, sınıf, burs, isim, yetki bayraklarını değiştiremez.
- Sahte hesaplar mesaj, yoklama, anket, program vb. hiçbir şeye erişemez.
- Storage: haber medyası yalnızca gerçek personel; başvuru belgesi yalnızca dönem açıkken;
  profil fotoğrafı yalnızca görsel ≤5MB.

## ⚠️ YAYIN SIRASI (önemli — sırayı bozmayın, ~5 dakika, sakin bir saatte yapın)

1. **Kodu yayınla** (bu commit GitHub Pages'e çıksın; uygulamada "güncelle" bildirimi gelir).
2. Firebase Console → Firestore → Data → **Start collection** `idx_staff` →
   Document ID: `1000` → alanlar: `no` (string) = `1000`, `lvl` (string) = `admin` → Save.
   (Yöneticinin numarası farklıysa onu yazın. Bu, dizindeki tek elle girilen kayıttır.)
3. `firestore.rules` → Console → Firestore → Rules → **Publish**.
4. `storage.rules` → Console → Storage → Rules → **Publish**
   (Firestore'a erişim izni sorulursa **İzin ver**).
   *(Alternatif: `firebase deploy --only firestore:rules,storage` — kökteki `firebase.json` hazır.)*
5. **Yönetici (1000) çıkış yapıp tekrar giriş yapsın**, panel açık ~10 sn beklesin →
   uygulama tüm öğretmen/öğrencileri dizine otomatik yazar.
   Console'da `idx_staff` ve `idx_students` dolmuş olmalı.
6. Duman testi: öğrenci, öğretmen, basın, öğrenci işleri hesaplarıyla birer giriş.

> 3 ile 5 arasında (1–2 dakika) öğretmen ve öğrenciler veri göremez; 5. adımdan sonra
> düzelir. Bu sıra emülatörde test edildi (yalnızca `idx_staff/1000` varken yönetici
> eşitlemesi tüm dizini kurar).

## Testler

```bash
cd tools && npm install && npm run kural-testi     # Java 11+ gerekir
```
132 senaryo: sahte hesaplar, rol yükseltme (basın/öğrenci işleri), mesaj gizliliği, öğretmen yetki yükseltme, öğrenci izolasyonu, yoklama sahipliği,
site başvurusu, Storage yüklemeleri ve **Akademiya Zarokan** (veli yalnızca kendi çocuğu,
sahte veli, başvuru doğrulama, çocuk akademisi öğretmeni, site haberleri/arşiv). Kural değiştirdiğinizde yeniden çalıştırın.

## Geri alma (acil durum)

Bir şey kırılırsa Console'da **Rules → History** sekmesinden önceki sürüme dönün
(her yayın saklanır). Tamamen açık "giriş yapan herkes" kuralına dönmeyin — o, bu
belgenin başındaki açığı geri getirir.

## Kalan riskler (sunucu tarafı gerektirir)

1. **Düz metin şifreler (`_plainPass`)** — çözüm hazır: `functions/` + `FUNCTIONS.md`
   (yayınlanıp `USE_CLOUD_FUNCTIONS = true` yapılınca artık yazılmaz).
2. **Herkese açık hesap açma (sign-up)** Firebase'de hâlâ açık (uygulama kullanıcıyı
   istemciden oluşturduğu için). v4 kuralları bunu zararsız kılar; Cloud Functions'a
   geçince Console → Authentication → Settings → User actions → **"Enable create (sign-up)"
   kapatılmalı**.
3. ✅ (v5) `messages`: öğrenci yalnızca kendine gelen özel mesajı ve öğrencilere toplu mesajı okur.
4. **App Check kapalı** (`APPCHECK_SITE_KEY` boş). reCAPTCHA v3 anahtarı alınıp
   `app/index.html` içine yazılmalı → bot/otomasyon istekleri engellenir.
