# Firebase Güvenlik — Kurallar v4 (üyelik dizini)

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
62 senaryo: sahte hesaplar, öğretmen yetki yükseltme, öğrenci izolasyonu, yoklama sahipliği,
site başvurusu, Storage yüklemeleri ve **Akademiya Zarokan** (veli yalnızca kendi çocuğu,
sahte veli, başvuru doğrulama). Kural değiştirdiğinizde yeniden çalıştırın.

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
3. `messages`: üye olan her öğrenci teknik olarak tüm mesajları okuyabilir (uygulama filtreler,
   kural filtrelemez). `attendance` ✅ daraltıldı (öğrenci yalnızca kendi adına yazar).
4. **App Check kapalı** (`APPCHECK_SITE_KEY` boş). reCAPTCHA v3 anahtarı alınıp
   `app/index.html` içine yazılmalı → bot/otomasyon istekleri engellenir.
