# 👧 Akademiya Zarokan — Çocuk Akademisi

Yetişkin akademiyle **aynı Firebase projesi ve güvenlik altyapısı**, ayrı bir arayüz ve
**yalnızca veli girişi**. Çocukların kendi hesabı yoktur.

| Parça | Adres (şimdi) | Alan adı alınınca |
|---|---|---|
| Tanıtım + veli başvuru formu | `/zarok/` | `https://zarok.aramtigran.org/` |
| Veli uygulaması (PWA) | `/zarok/app/` | `https://zarok.aramtigran.org/app/` |
| Demo (örnek verilerle) | `/zarok/app/?demo=1` · `/zarok/?demo=1` | aynı |
| Yönetim | Ana uygulama → Öğrenci İşleri → **Akademiya Zarokan** sekmesi | aynı |

> **Alan adı notu:** `.gov` / `.gov.tr` uzantıları yalnızca kamu kurumlarına verilir; özel bir
> akademi alamaz. `zarok.aramtigran.org` (veya `.com`) önerilir.

## Akış

```
Veli /zarok/ formunu doldurur ──► kidApplications
Öğrenci İşleri "✅ Qebûl û Tescîl" ──► guardians/{veliNo} + kids + idx_guardians + Auth hesabı
                                        (veli no: 9YYYYnnn, çocuk no: 8YYYYnnn)
                                        giriş bilgileri e-postayla (EmailJS) veya ekranda
Veli /zarok/app/ → giriş ──► Bugün · Program · Devam · Duyurular · Mesaj · İzinler
Öğrenci İşleri "✅ Hat / 🏠 Çû" ──► kidAttendance ──► veliye anında bildirim
```

## Veli uygulaması özellikleri
- **Bugün:** çocuk derste mi / teslim edildi mi (saatle), bugünkü dersler, son duyuru
- **Program**, **Devam** (son 30 gün, yıldızlarla), **Duyurular**, **Mesaj** (öğrenci işleriyle)
- **İzinler:** teslim alabilecek kişiler listesi, fotoğraf çekim/paylaşım izni, sağlık notu
- **Çocuk modu:** telefon çocuğa verilir → büyük renkli ekran (bugünkü ders, yıldızlarım,
  resim defteri). Mesaj/ayar yok. Çıkış **veli PIN'i** ile (PIN yoksa çarpım sorusu);
  sayfa yenilense veya geri tuşuna basılsa bile mod açık kalır.
- 4 dil (KU · ZZ · TR · EN), koyu mod, çevrimdışı açılış, ana ekrana yükleme (PWA)
- Ana akademi oturumuyla **karışmaz** (ayrı Firebase uygulama adı, ayrı PWA kapsamı)

## Güvenlik (firestore.rules → "AKADEMIYA ZAROKAN")
- Veli = `<no>@veli.aat` **ve** `idx_guardians/<no>` kaydı (yalnızca yönetici seviyesi yazar)
- Veli yalnızca `guardianNos` listesinde olduğu çocukları, onların yoklamasını ve kendi
  mesajlarını görür; yetişkin öğrenci verisine hiç erişemez
- Veli çocuk kaydında yalnızca `pickups`, `consentPhoto`, `consentShare`, `health` alanlarını değiştirebilir
- Başvuru formu yalnızca dönem açıkken, KVKK onayıyla ve sınırlı alanlarla yazılabilir
- Emülatörde test edildi: `tools/kural-testi.js` (Zarok dahil 62 senaryo) ve
  `tools/e2e/` (veli + öğrenci işleri uçtan uca, 24 adım)

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
