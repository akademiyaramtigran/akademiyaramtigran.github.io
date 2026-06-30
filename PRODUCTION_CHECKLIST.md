# Üretim (200 kullanıcı) — Yayın Kontrol Listesi

## ✅ Kodda yapıldı (canlı)
- PWA: offline, kurulum, splash, **otomatik güncelleme bildirimi**
- Oturum kalıcılığı (refresh'te girişte kalır) + geri tuşu çıkış yaptırmıyor
- Firestore **yazma** güvenlik kuralları (rol = e-posta uzantısı)
- **İlk girişte zorunlu şifre değişimi** (varsayılan "1234" tespit edilir)
- Profil fotoğrafları **Firebase Storage**'a (base64 fallback'li)

## ⚙️ Senin Firebase Console'da yapman gerekenler

1. **Firestore kuralları** — `firestore.rules` → Console → Firestore → Rules → Publish.
   (Rules Playground'da test et; bkz. `FIREBASE_SECURITY.md`.)
2. **Storage'ı aç + kuralları yayınla** — Console → Storage → Get started →
   `storage.rules` → Publish. (Genelde Blaze ister.)
3. **Blaze planına geç** — Console → Upgrade. 200 aktif kullanıcı Spark (ücretsiz)
   okuma/yazma limitlerini aşar. **Bütçe alarmı** kur (ör. aylık üst sınır).
4. **Otomatik yedek** — Firestore'u düzenli dışa aktar:
   - Console → Firestore → **Import/Export** (manuel), veya
   - Zamanlı yedek: `gcloud firestore export gs://<bucket>` + Cloud Scheduler.
5. **E-posta/Auth** — Authentication → Sign-in method → **Email/Password açık**.
6. **Varsayılan şifreler** — Tüm hesaplar "1234" ile kuruluyorsa, ilk giriş
   zorunlu değişimi devreye girer; kullanıcılara ilk şifrelerinin "1234" olduğunu
   bildir.

## ⏳ Sonraki adım (test gerektirir — körlemesine yapılmamalı)

**Okuma izolasyonu (#1, gizlilik).** Şu an giriş yapan her kullanıcı tüm
öğrenci/öğretmen kayıtlarını (PII + şifre hash'i) okuyabiliyor. Düzeltmek için
istemci, role göre sorgu yapmalı:
- Öğrenci: yalnızca kendi dokümanı + ders programı + duyurular,
- Öğretmen: kendi alanının öğrencileri,
- Yönetici: tümü.

ve ardından Firestore **okuma** kuralları buna göre daraltılmalı. Bu değişiklik
girişi/panelleri etkilediğinden, **her rol için canlı test** ile (mevcut gevşek
okuma kuralı güvenlik ağı olarak dururken) kademeli yapılmalı. Hazır olduğunda
birlikte adım adım uygularız.

## Notlar
- `attendance`/`messages` yazımı hâlâ "giriş yapan herkes"; istenirse öğrencinin
  yalnızca kendi kaydını yazmasına daraltılabilir.
- Şifre hash'i tuzsuz SHA-256; okuma izolasyonu yapılınca risk büyük ölçüde düşer.
