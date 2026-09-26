# Çocuk Akademisi (Akademiya Zarokan) — Uygulama Planı

Mevcut sistemin (başvuru, kayıt, program, QR yoklama, duyuru, mesaj, rapor) aynısı,
çocuklara ve velilere uygun bir arayüzle.

## 1. Adres (domain) yapısı

| Seçenek | Adres | Artı / Eksi |
|---|---|---|
| **Önerilen** | `akademiyaramtigran.github.io/zarok/` (site) + `/zarok/app/` (veli uygulaması) | Aynı depo, aynı Firebase, ek maliyet yok; hemen yapılabilir. |
| Özel alan adı | `zarok.aramtigran.org` | Daha akılda kalıcı. Alan adı alınıp GitHub Pages'e `CNAME` ile bağlanır; ana site `aramtigran.org` olur. |

Ana sayfaya "👧 Akademiya Zarokan" kartı + menü bağlantısı eklenir.

## 2. Hesap modeli — çocuğun kendi hesabı OLMAZ

Çocuklar (özellikle 13 yaş altı) için ayrı giriş açmak KVKK açısından risklidir.
Doğru model: **giriş = veli**, çocuk verisi veliye bağlıdır.

```
veli (guardian)  ── 1..n ──►  çocuk (kid)  ── n..1 ──►  grup / ders
  <veliNo>@veli.aat              kids/{id}                 schedule (program:"zarok")
  idx_guardians/{veliNo}         guardianNos: [..]
```

- Bir veli birden fazla çocuğu görebilir; bir çocuğun iki velisi olabilir (anne + baba).
- Mevcut `idx_staff` sistemi aynen kullanılır; öğretmenler hem yetişkin hem çocuk
  gruplarını görebilir (`program` alanıyla ayrılır).
- Kurallar (özet): veli yalnızca `guardianNos` dizisinde kendi numarası olan çocukları
  okur; çocuk kaydını yalnızca personel yazar; veli yalnızca iletişim/izin alanlarını
  güncelleyebilir.

## 3. Başvuru (site `/zarok/`)

Formu **veli doldurur**. Alanlar:

- Çocuk: ad-soyad, doğum tarihi (yaş grubu otomatik: 5–7 · 8–10 · 11–14), ilgi alanı
  (muzîk, şano, dans, wênesazî, …), okul/sınıf (isteğe bağlı)
- Veli: ad-soyad, yakınlık, telefon, e-posta; **ikinci acil durum kişisi**
- Sağlık: alerji / kronik durum / ilaç (isteğe bağlı, yalnızca öğretmen görür)
- **Açık rıza kutuları** (zorunlu olmayanlar ayrı): KVKK aydınlatma okundu ✔ ·
  fotoğraf/video çekimi ✔/✖ · sitede paylaşım ✔/✖
- Belgeler: çocuğun nüfus kayıt örneği, veli kimliği (mevcut belge yükleme altyapısı)

Öğrenci İşleri panelinde **"Zarok"** sekmesi: başvuru → kabul → çocuk kaydı + veli hesabı
tek tıkla (mevcut "Kabul et & Kaydet" akışı, e-postayla veli giriş bilgisi).

## 4. Veli uygulaması (giriş sonrası)

Ana ekran, çocuk seçici üstte (birden fazla çocuk varsa fotoğraflı sekmeler):

1. **Bugün** — çocuğun bugünkü dersi, saati, öğretmeni; "🟢 Derse girdi 14:02" /
   "🏠 Dersten çıktı 15:30" bildirimleri
2. **Program** — haftalık program (büyük kartlar)
3. **Devam** — takvim görünümü, devam oranı
4. **Gelişim** — öğretmen değerlendirmesi (yıldız / emoji ölçeği + kısa not), dönem raporu PDF
5. **Duyurular** ve **Öğretmene mesaj** (yalnızca veli ↔ öğretmen; çocuklar arası mesaj yok)
6. **İzinler** — fotoğraf rızası, **teslim alabilecek kişiler** listesi, sağlık bilgisi
7. **Belgeler / ödemeler** (ileride)

### QR yoklama çocuklarda ters çalışır
Çocuğun telefonu yok: **öğretmen, çocuğun kartındaki QR'ı okutur** (mevcut
`TeacherCardScanner` bileşeni). Okutunca veliye anlık bildirim gider. Çıkışta da okutulursa
"teslim edildi" kaydı oluşur — güvenlik açısından velilerin en çok değer vereceği özellik.

## 5. Çocuk modu (ebeveyn kilitli ekran)

Veli isterse telefonu çocuğa verip **"Zarok modu"**nu açar:

- Büyük, renkli kartlar: "Bugün hangi ders?", "Ödevim / çalışmam", "Rozetlerim ⭐",
  "Resim/şarkı galerim" (yalnızca kendi içerikleri)
- Metin çok az, simge + tek kelime; Kurmancî varsayılan, dokununca sesli okuma (TTS)
- **Çıkış ebeveyn kilidiyle**: 4 haneli veli PIN'i veya "7 × 8 = ?" gibi yetişkin sorusu
- Çocuk modunda mesajlaşma, ayarlar, profil düzenleme **yok**

## 6. Arayüz dili (tasarım)

| Öğe | Yetişkin uygulaması | Zarok |
|---|---|---|
| Palet | Petrol & Şampanya | Aynı marka tabanı + canlı vurgu (mercan, güneş sarısı, çimen yeşili) |
| Yazı | Inter | Yuvarlak font (ör. Nunito / Baloo 2), 18px+ gövde |
| Dokunma alanı | 44px | **56px+** |
| Kart köşesi | 10–14px | 20–24px, hafif gölge |
| Simgeler | Emoji/ince | Dolgulu, renkli, etiketli |
| Geri bildirim | Toast | Animasyon + ses (kapatılabilir) + rozet |

Teknik olarak mevcut kod `APP_MODE = "zarok"` bayrağıyla temayı, menüleri ve rolleri
değiştirir; iki ayrı 1,5 MB'lık dosya bakımı yapılmaz. (Öncesinde tek dosyanın modüllere
bölünmesi ve ön-derleme önerilir — bkz. `PRODUCTION_CHECKLIST.md` bölüm D.)

## 7. KVKK / çocuk güvenliği (zorunlu)

- **Veli açık rızası**: metin sürümü + tarih + IP/cihaz kaydıyla saklanır; geri alınabilir.
- Veri en aza indirme: çocukta e-posta/telefon tutulmaz; sağlık bilgisi yalnızca ilgili öğretmen.
- Fotoğraflar varsayılan **kapalı**; sitede paylaşım yalnızca rıza ✔ olan çocuklarda
  (Basın paneli yüklerken rızası olmayan çocuk etiketlenirse uyarır).
- Saklama süresi: kayıt bitiminden X yıl sonra otomatik silme; veli "verilerimi sil" talebi.
- Personel erişim kaydı (kim hangi çocuk kaydını açtı).
- Ayrı Firestore koleksiyonları (`kids`, `guardians`, `kidApplications`) ve ayrı
  kural bloğu — yetişkin öğrenci verisiyle karışmaz.

## 8. Aşamalar

| Faz | İçerik | Süre (tahmini) |
|---|---|---|
| 1 | `/zarok/` tanıtım sayfası + veli başvuru formu + Öğrenci İşleri "Zarok" sekmesi + kurallar | 1–2 hafta |
| 2 | Veli hesabı + veli uygulaması (Bugün, Program, Devam, Duyuru) + öğretmen QR okutma → veli bildirimi | 2–3 hafta |
| 3 | Mesajlaşma, izinler/teslim listesi, gelişim raporu, çocuk modu + ebeveyn kilidi | 2–3 hafta |
| 4 | Dil raporlarına Zarok metinlerinin eklenmesi (aynı araçlarla otomatik) | Faz 1–3 ile birlikte |

Onay verirseniz Faz 1'den başlanabilir.
