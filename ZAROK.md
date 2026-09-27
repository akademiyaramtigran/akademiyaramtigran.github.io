# 👧 Akademiya Zarokan — Çocuk Akademisi

Yetişkin akademiyle **aynı Firebase projesi ve güvenlik altyapısı**, ayrı bir arayüz.
Giriş: **Veli** ve **Öğretmen**. Çocukların kendi hesabı yoktur.

| Parça | Adres (şimdi) | Alan adı alınınca |
|---|---|---|
| Tanıtım + veli başvuru formu | `/zarok/` | `https://zarok.aramtigran.org/` |
| Veli uygulaması (PWA) | `/zarok/app/` | `https://zarok.aramtigran.org/app/` |
| Yönetim | Ana uygulama → **Öğrenci İşleri** → **Akademiya Zarokan** bölümü (yönetici panelinde yok) | aynı |
| Site haberleri + arşiv | Ana uygulama → **Basın** → **Akademiya Zarokan** sekmesi | aynı |

> **Alan adı notu:** `.gov` / `.gov.tr` uzantıları yalnızca kamu kurumlarına verilir; özel bir
> akademi alamaz. `zarok.aramtigran.org` (veya `.com`) önerilir.

## Başvuru (akademi başvurusuyla aynı mantık)
- Öğrenci İşleri: başvuruyu aç/kapat, başlangıç–bitiş tarihi, siteye not, **istenen belgeler** (her biri ayrı yükleme; isteğe bağlı indirilebilir form şablonu)
- Veli her istenen belgeyi yüklemeden başvuru gönderilemez; Öğrenci İşleri inceler → **Qebûl û Tescîl** (numara + şifre otomatik)
- Storage paketi alınmadan da çalışır: görseller sıkıştırılıp başvuruya gömülür (PDF ≤700KB)

## Akış

```
Veli /zarok/ formunu doldurur ──► kidApplications
Öğrenci İşleri "✅ Qebûl û Tescîl" ──► guardians/{veliNo} + kids + idx_guardians + Auth hesabı
                                        (veli no: 9YYYYnnn, çocuk no: 8YYYYnnn)
                                        giriş bilgileri e-postayla (EmailJS) veya ekranda
Veli /zarok/app/ → giriş ──► Bugün · Program · Devam · Duyurular · Mesaj · İzinler
Öğrenci İşleri "✅ Hat / 🏠 Çû" ──► kidAttendance ──► veliye anında bildirim
```

## Yönetim (ana akademideki görev ayrımıyla aynı)
**Öğrenci İşleri** sekmeleri: Serlêdan · Zarok · Dêûbav · Mamoste · Amadebûn · Bername · Ragihandin · Peyam
**Basın** sekmeleri: Nûçeyên Malperê · Arşîv (çocuk sitesi)
- **Çocuk kaydı:** başvurudan tek tıkla veya elle; yeni veli hesabı ya da mevcut veliye bağlama; öğretmen atama
- **Öğretmen kaydı:** otomatik numara (7YYYYnnn) + otomatik şifre + e-posta; düzenle / 🔑 şifre yenile / sil
- **Veliler:** düzenle / 🔑 şifre yenile / sil (bağlı çocuk yoksa)
- **Site haberleri ve arşiv:** 4 dilde başlık/metin, en fazla 4 fotoğraf, YouTube bağlantısı
- Numaralar: öğretmen `7YYYYnnn` · çocuk `8YYYYnnn` · veli `9YYYYnnn`

## Öğretmen uygulaması (aynı PWA, "Mamoste" sekmesiyle giriş)
- Çocuk akademisi öğretmeni: `<no>@zmamoste.aat` (yetişkin akademinin verisini **göremez**)
- Akademi öğretmeni de kendi numarası/şifresiyle girebilir — **Öğrenci İşleri onu çocuk akademisine
  bağladıktan sonra** (Mamoste → "Mamosteyê akademiyê? Jimara wî/wê"); bağlanmamış öğretmen çocuk verisini göremez
- **Yoklama:** bugünkü derslerin çocukları, "✅ Hat / 🏠 Çû" → veliye anında bildirim
- **Çocuklar:** sağlık uyarısı, teslim listesi, veliyi tek dokunuşla arama
- **Program**, **Duyuru gönderme**, **Veli mesajlarına yanıt**

## Veli uygulaması özellikleri
- **Bugün:** çocuk derste mi / teslim edildi mi (saatle), bugünkü dersler, son duyuru
- **Program**, **Devam** (son 30 gün, yıldızlarla), **Duyurular**, **Mesaj** (öğrenci işleriyle)
- **İzinler:** teslim alabilecek kişiler listesi, fotoğraf çekim/paylaşım izni, sağlık notu
- **Çocuk modu:** telefon çocuğa verilir → büyük renkli ekran (bugünkü ders, yıldızlarım,
  resim defteri). Mesaj/ayar yok. Çıkış **veli PIN'i** ile (PIN yoksa çarpım sorusu);
  sayfa yenilense veya geri tuşuna basılsa bile mod açık kalır.
- 4 dil (Kurmancî · Zazakî · Türkçe · English, açılır menü), koyu mod, çevrimdışı açılış, ana ekrana yükleme (PWA)
- Ana akademi oturumuyla **karışmaz** (ayrı Firebase uygulama adı, ayrı PWA kapsamı)

## Güvenlik (firestore.rules → "AKADEMIYA ZAROKAN")
- Veli = `<no>@veli.aat` **ve** `idx_guardians/<no>` kaydı (yalnızca öğrenci işleri + yönetici yazar)
- Veli yalnızca `guardianNos` listesinde olduğu çocukları, onların yoklamasını ve kendi
  mesajlarını görür; yetişkin öğrenci verisine hiç erişemez
- Veli çocuk kaydında yalnızca `pickups`, `consentPhoto`, `consentShare`, `health` alanlarını değiştirebilir
- Başvuru formu yalnızca dönem açıkken, KVKK onayıyla ve sınırlı alanlarla yazılabilir
- Emülatörde test edildi: `tools/kural-testi.js` (166 senaryo) ve `tools/e2e/` (veli, öğrenci işleri,
  yönetim + basın + öğretmen; 78 adım)

## Kendi alan adına taşıma (zarok.aramtigran.org)
```bash
node tools/zarok-paketle.js zarok.aramtigran.org
```
1. DNS: `zarok` → `CNAME` → `akademiyaramtigran.github.io`
2. `dist-zarok/` içeriğini yeni bir depoya (ör. `akademiyaramtigran/zarok`) yükleyin →
   Settings → Pages → Custom domain: `zarok.aramtigran.org` → **Enforce HTTPS**
3. Firebase Console → Authentication → Settings → **Authorized domains** → `zarok.aramtigran.org`
4. `app/index.html` → `ZAROK_APP_URL = "https://zarok.aramtigran.org/app/"`;
   `index.html` → `/zarok/` bağlantıları → `https://zarok.aramtigran.org/`
5. İsterseniz `/zarok/` klasörüne eski adresten yönlendirme bırakın.

## Sonraki adımlar
- Öğretmen panelinden de "Hat / Çû" işaretleme (şu an Öğrenci İşleri panelinde)
- Çocuk kartındaki QR'ı öğretmenin okutması (mevcut kart okuyucu bileşeniyle)
- Uygulama kapalıyken **push bildirimi**: Firebase Cloud Messaging + Cloud Functions
  (şu an bildirim uygulama açıkken anında gelir)
