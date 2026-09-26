# Yayın ve Güvenlik Raporu — Akademîya Aram Tîgran

_Tarama tarihi: 26.09.2026 · Kapsam: app/, ana sayfa, Firestore/Storage kuralları, dil sistemi._
_Depolama/plan satın alma kalemleri isteğiniz üzerine bu rapora dahil edilmedi._

## A. Bu taramada DÜZELTİLENLER

| # | Önem | Bulgu | Durum |
|---|---|---|---|
| 1 | 🔴 Kritik | Herkes `x@ogretmen.aat` hesabı açıp **tüm öğrenci/öğretmen verisini okuyup silebiliyordu** (rol yalnızca e-posta uzantısından okunuyordu). | ✅ Kurallar v4: üyelik dizini (`idx_staff`, `idx_students`). Emülatörde 34/34 test. |
| 2 | 🔴 Kritik | Her öğretmen kendi kaydına `isAdmin:true` yazıp **yönetici olabiliyor**, başka öğretmenleri silebiliyordu. | ✅ Öğretmen kayıtları yalnızca yönetici seviyesine (`lvl`) açık. |
| 3 | 🟠 Yüksek | Sahte öğrenci hesabı tüm mesajları okuyup, yoklama yazabiliyordu. | ✅ Ortak koleksiyonlar yalnızca dizindeki üyelere. |
| 4 | 🟠 Yüksek | Öğrenci kendi kaydında alan/sınıf/burs değiştirebiliyordu. | ✅ Kendi kaydında yalnızca profil alanları (foto, tel, e-posta, adres, bio, şifre). |
| 5 | 🟠 Yüksek | `roles` koleksiyonuna her kullanıcı kendi rolünü yazabiliyordu. | ✅ Yalnızca yönetici seviyesi. |
| 6 | 🟠 Yüksek | Storage: sahte personel haber medyası yükleyebiliyor; başvuru klasörüne dönem kapalıyken bile dosya atılabiliyordu. | ✅ Storage v2: dizin kontrolü + dönem açık kontrolü + tür/boyut sınırları. |
| 7 | 🟡 Orta | Yönetici şifre belirlerken 4 karakter kabul ediliyordu; Firebase Auth en az 6 ister → hesap senkronu bozuluyordu. | ✅ En az 6 karakter + uyarı. |
| 8 | 🟡 Orta | Hata ekranı bileşen yığınını (component stack) kullanıcıya gösteriyordu; Almanca satır ve yanlış bayrak (🇰🇷 Güney Kore). | ✅ Temizlendi. |
| 9 | 🟡 Orta | Uygulama kodunda eski, **güvensiz** kural örneği (herkes her şeyi yazar) yorum olarak duruyordu. | ✅ Kaldırıldı. |
| 10 | ⚪ Düşük | `<meta>` ile verilemeyen başlıklar (X-Frame-Options, frame-ancestors) konsola hata basıyordu. | ✅ Kaldırıldı; `referrer` doğru biçime çevrildi. |
| 11 | ⚪ Dil | Türkçe ve Zazakî seçilince satır içi metinler Kurmancî kalıyordu; Almanca kalıntıları (ör. "Massenversand"). | ✅ 4 dil, 818 Türkçe metin, dil paketi + raporlar. |

**Yayın sırası için mutlaka okuyun:** `FIREBASE_SECURITY.md` → "YAYIN SIRASI" (5 adım).

## B. Sistemi aktif etmeden ÖNCE yapılması gerekenler

1. **Kuralları yayınla** — `FIREBASE_SECURITY.md` adımları (dizin → kurallar → yönetici girişi).
2. **API anahtarı kısıtlaması** — Google Cloud Console → APIs & Services → Credentials →
   Browser key → *Application restrictions: HTTP referrers* →
   `https://akademiyaramtigran.github.io/*` (+ varsa özel alan adı).
3. **Auth yetkili alan adları** — Firebase Console → Authentication → Settings →
   Authorized domains: yalnızca `akademiyaramtigran.github.io` (+ özel alan adı) kalsın.
4. **App Check** — reCAPTCHA v3 site anahtarı al, `app/index.html` içindeki
   `APPCHECK_SITE_KEY` yerine yaz; Console'da Firestore/Storage için *Enforce*.
5. **EmailJS** — Dashboard → Account → Security: *Allowed origins* =
   `akademiyaramtigran.github.io`. (Aksi hâlde herkes sizin hesabınızdan e-posta
   gönderebilir; şablonlar giriş şifresi taşıyor.)
6. **Play Store (TWA)** — `.well-known/assetlinks.json` içindeki
   `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` gerçek imza parmak iziyle değişmeli.
7. **Gizlilik politikası** — uygulama içi metin kısa; KVKK aydınlatma metni (veri
   sorumlusu, amaç, saklama süresi, başvuru yolu) tam hâliyle sitede ayrı sayfa olmalı.
   Çocuk akademisi açılacaksa **veli açık rızası** ayrıca gerekir (bkz. `COCUK_AKADEMISI_PLANI.md`).

## C. Kalan riskler (sunucu tarafı işlev gerektirir — sonraki adım)

| Önem | Risk | Önerilen çözüm |
|---|---|---|
| 🟠 | **Düz metin şifreler** (`_plainPass`) öğrenci/öğretmen belgesinde; tüm personel görebilir. Tarayıcı, başkasının Auth hesabını ancak eski şifreyle silip değiştirebildiği için tutuluyor. | Cloud Functions (Admin SDK): `kullaniciOlustur / kullaniciSil / sifreBelirle`. Sonra `_plainPass` ve `passHash` alanları silinir; şifre yalnızca e-postayla iletilir. |
| 🟠 | Herkese açık **hesap açma** hâlâ açık (zararsız hâle getirildi ama kaynak tüketir). | Cloud Functions'a geçince Authentication → Settings → *Enable create (sign-up)* kapatılır. |
| 🟡 | Üye bir öğrenci teknik olarak tüm mesajları okuyabilir / başkası adına yoklama yazabilir (uygulama filtreliyor, kural filtrelemiyor). | Mesaj ve yoklama belgelerine sahip alanı (`fromNo`, `toNo`, `studentNo`) ve sorgulara `where` eklenip kurallar daraltılır. |
| 🟡 | Cihaz kilidi ve 5 deneme kilidi yalnızca **istemci tarafında** (atlatılabilir). Firebase'in kendi kaba kuvvet koruması var. | Önemli değil; App Check ile birlikte yeterli. |
| 🟡 | Profil fotoğrafı yolu kişiye bağlı değil: bir üye başkasının `photos/...` dosyasının üzerine yazabilir. | Yolu `photos/{no}/...` yapıp kuralda `prefix()==no` kontrolü. |

## D. Performans / yayın kalitesi

- **Tarayıcıda derleme:** Uygulama her soğuk açılışta ~1 MB JSX'i Babel ile telefonda
  derliyor (sunucu CPU'sunda 1,6 sn → orta seviye telefonda tahminen 4–8 sn) ve
  1,5 MB `babel.min.js` indiriyor. **Öneri:** bir derleme adımı (`tools/derle.js`) ile
  JSX önceden derlenip yayınlanır → açılış 3–5 kat hızlanır, CSP'den `unsafe-eval`
  kalkar. Kaynak dosya aynen kalır; yayın öncesi tek komut.
- **Tek dosya (1,5 MB):** Bakımı zorlaştırıyor; çocuk akademisi gibi ikinci bir arayüz
  eklenmeden önce ekranların modüllere bölünmesi önerilir.
- Service Worker önbellek sürümü `v14`'e yükseltildi (dil paketi dahil).

## E. Test edilenler

- Firestore + Storage kuralları: emülatörde 34 senaryo (`tools/kural-testi.js`) — yeni
  kurallarla 34/34; eski kurallarla 11 senaryo açık verdi.
- Dizin eşitleme fonksiyonu: emülatörde yalnızca `idx_staff/1000` varken tüm dizini
  kurduğu, silinmiş kaydı kaldırdığı doğrulandı.
- Uygulama: Chromium'da KU / ZZ / TR / EN giriş ve ayar ekranları, canlı dil geçişi.
- Site: ZZ / TR dil geçişi. Dil raporu: doldur → dışa aktar → `dil-entegre.js` →
  uygulamada Zazakî metnin göründüğü uçtan uca doğrulandı.
- **Test edilemeyen:** gerçek Firebase'e bağlı giriş sonrası paneller (bu ortamdan
  Firebase'e erişim yok). Kurallar yayınlandıktan sonra `FIREBASE_SECURITY.md` → adım 6
  duman testi yapılmalı.
