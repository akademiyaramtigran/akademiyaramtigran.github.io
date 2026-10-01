# 💳 Alımlar ve Yayın Öncesi Kurulum Rehberi

Sıra: **1 → 6** şimdi yapılır. **Alan adı (7)** en son alınır, sonra yayına başlanır.
Tüm adımlar telefondan tarayıcıyla yapılabilir (masaüstü görünümü önerilir).

| # | İş | Ücret | Kim yapar |
|---|---|---|---|
| 1 | Firebase **Blaze** planı | Kullandıkça öde (≈ ayda birkaç $) | Siz |
| 2 | **Bütçe uyarısı** | Ücretsiz | Siz |
| 3 | **Storage** (dosya depolama) açma | Blaze'e dahil | Siz |
| 4 | GitHub'a **yükleme anahtarı** ekleme | Ücretsiz | Siz |
| 5 | Fonksiyon + kuralları **tek tuşla yükleme** | Ücretsiz | Siz (1 tuş) |
| 6 | Sistemi sunucu moduna geçirme | — | Claude |
| 7 | **Alan adı** (en son) | ≈ 12–20 $/yıl | Siz + Claude |

---

## 1. Blaze planına geçin
1. Firebase Console → proje **Aram2026** → sol altta **Spark** yazan plan kutusu (ya da ⚙ → *Usage and billing* → *Details & settings*).
2. **Modify plan / Upgrade** → **Blaze (Pay as you go)**.
3. Faturalandırma hesabı oluşturun (kart bilgisi). Google bazen 300 $ deneme kredisi verir.
4. Onaylayın. Ücretsiz kotalar aynen devam eder; yalnızca aşılırsa ücret çıkar.

## 2. Bütçe uyarısı kurun (sürpriz fatura olmasın)
1. Blaze ekranında **Set budget alert** (ya da Google Cloud Console → *Billing* → *Budgets & alerts* → **Create budget**).
2. Tutar: **10 $** (ya da istediğiniz). Uyarı eşikleri: %50, %90, %100.
3. E-posta size gelir. (Uyarı harcamayı durdurmaz, haber verir.)

## 3. Storage'ı açın ve kurallarını yükleyin
1. Firebase Console → **Build → Storage** → **Get started**.
2. Mod: **Production mode** (kurallar zaten hazır).
3. Konum: **europe-west1** (Firestore ile aynı bölge).
   *Not: ücretsiz 5 GB kotası yalnızca ABD bölgelerinde; Avrupa'da GB başına birkaç kuruş — sorun değil.*
4. **Done**. Kuralları elle yapıştırmanıza gerek yok — 5. adım otomatik yükler.

## 4. GitHub'a yükleme anahtarı ekleyin (bir kez)
Bu anahtar, fonksiyonun ve kuralların sizin yerinize otomatik yüklenmesini sağlar.

**a) Anahtarı indirin**
1. Firebase Console → ⚙ **Project settings** → **Service accounts** sekmesi.
2. **Generate new private key** → **Generate key** → bir `.json` dosyası iner.
   ⚠ Bu dosya **şifre gibidir**: kimseyle paylaşmayın, WhatsApp'a atmayın.

**b) Hesaba yetki verin**
1. Aynı sayfada hesabın adı yazar: `firebase-adminsdk-…@aram2026-a9fd7.iam.gserviceaccount.com`.
2. Google Cloud Console → **IAM & Admin → IAM** → bu hesabın satırında ✏️ (Edit).
3. **Add another role** ile şu iki rolü ekleyin: **Editor** ve **Firebase Admin** → **Save**.

**c) GitHub'a ekleyin**
1. GitHub → `akademiyaramtigran/akademiyaramtigran.github.io` → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: indirdiğiniz `.json` dosyasının **tüm içeriği** (dosyayı bir not uygulamasında açıp hepsini kopyalayın).
3. **Add secret**. Sonra telefonunuzdaki `.json` dosyasını silebilirsiniz.

## 5. Tek tuşla yükleyin
1. GitHub → depo → **Actions** sekmesi → solda **Firebase'e yükle**.
2. **Run workflow** → hedef: **hepsi** → yeşil **Run workflow**.
3. 3–6 dakika sürer. Yeşil ✓ = tamam. Kırmızı ✗ olursa ekran görüntüsünü Claude'a gönderin
   (ilk yüklemede Google bazı servisleri açarken bir kez hata verebilir; **Re-run** ile tekrar deneyin).

Bundan sonra kurallarda değişiklik olursa Console'a kopyalamak yerine bu tuşu kullanırsınız
(hedef: **kurallar**).

## 6. Claude'a haber verin
"Fonksiyon yüklendi" demeniz yeterli. Claude:
- Sistemi sunucu moduna geçirir (`USE_CLOUD_FUNCTIONS = true`):
  - düz metin şifreler artık veritabanında **tutulmaz**,
  - silinen kişinin giriş hesabı gerçekten silinir ("eski hesap" uyarıları biter),
  - şifre sıfırlama eski şifre olmadan çalışır.
- Fotoğrafların Storage'a yüklendiğini (haber fotoğrafı sınırı kalkar) kontrol eder.
- Son güvenlik adımı olarak Console'da "dışarıdan hesap açmayı kapatma" ayarını size tarif eder.

---

## Diğer abonelikler — şimdilik gerekmiyor
| Hizmet | Durum | Ne zaman? |
|---|---|---|
| **EmailJS** (başvuru/şifre e-postaları) | Ücretsiz plan: ayda 200 e-posta | Ayda 200'ü aşarsanız (≈ 9–15 $/ay) |
| **App Check / reCAPTCHA** | Ayda 10.000 doğrulama ücretsiz | İstenirse yayından sonra |
| **Google Play** (25 $ bir kez) / **Apple** (99 $/yıl) | Gerekmiyor | Uygulamalar siteden "Ana ekrana ekle" ile kurulur |
| **Video** | YouTube bağlantısı önerilir | Büyük videoları Firebase'e yüklemek trafik ücreti doğurur |

## 7. En son: alan adı ve yayın
1. Alan adını alın (ör. `aramtigran.org`, ≈ 12–20 $/yıl).
2. Claude'a alan adını söyleyin; Claude şunları yapar ve size DNS kayıtlarını verir:
   - GitHub Pages özel alan adı (`CNAME`) + HTTPS,
   - sitedeki tüm bağlantıların yeni adrese çevrilmesi,
   - Firebase → *Authentication → Settings → Authorized domains* listesine yeni adın eklenmesi (sizin tek tıklamanız),
   - Çocuk Akademisi için alt alan adı (ör. `zarok.aramtigran.org`) istenirse.
3. DNS kayıtlarını alan adını aldığınız firmanın panelinde girersiniz → yayın başlar.
