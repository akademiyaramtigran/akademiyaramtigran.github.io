# 🪪 Öğrenci Kartları ve Kapı Güvenliği

## Kart nasıl çalışır
- Kartın arkasındaki QR'da öğrenci numarası **yoktur**; 128 bitlik, tahmin edilemez bir **kart anahtarı** vardır (`AAT1:<32 karakter>`).
  Numarayı bilen biri sahte kart üretemez; anahtarlar listelenemez (kural).
- Anahtar `cards/{anahtar}` belgesini açar: ad, numara, alan, fotoğraf, **aktif mi**.
- **Kayıp kart:** Öğrenci İşleri ♻️ ile yeni kart çıkarır → eski kart anında geçersiz olur (kapıda ⛔ "iptal").
- Kartın arkasında QR'ın altında aynı kod yazılıdır: kamera çalışmazsa elle girilir.

## Kim ne yapar
| Rol | Yapabildiği |
|---|---|
| **Öğrenci İşleri** | 🎓 Tescîl → her öğrencide 🪪 (kart çıkar + bas), ♻️ (kayıp kart), "Hemû kartên xwendekaran çap bike" (toplu) · Akademiya Zarokan → Zarok → aynı düğmeler, çocuk fotoğrafı ekleme |
| **Güvenlik** (yeni rol) | Yalnızca kapı kontrol ekranı: kartı okutur → ✅ GEÇEBİLİR / ⛔ GEÇEMEZ + fotoğraf + ad; günlük giriş listesi. **Başka hiçbir veriyi göremez** (öğrenci listesi, mesaj, başvuru…) |
| **Öğretmen** | Derste "Karta Xwendekarê Bixwîne" → kart okutulur → yoklamaya işlenir (yalnızca o dersin öğrencisi) |
| **Çocuk öğretmeni** | Çocuk uygulamasında "📇 Kartê bixwîne" → Geldi / Teslim edildi sırayla → **veliye anında bildirim** |

Güvenlik hesabı: Yönetici → Çapemenî (Basın) sekmesi → Kartên Taybet → **🛡 Ewlehî** → Kartı kaydet
(numara `97YYYYnn` + otomatik şifre). Görevli ana uygulamaya "Mamoste" girişinden girer.

## Baskı
- Baskı sayfası A4'e ön + arka yüzü yan yana dizer (CR80: 85,6 × 54 mm), kesim çizgili.
- Çift yüzlü kart yazıcısı (PVC) veya: kalın kâğıda bas → kes → arka arkaya yapıştır → lamine et.
- Yetişkin kartı: lacivert + meşale; çocuk kartı: turuncu (Akademiya Zarokan).
- Baskı sayfasının üstünde **▭ Yatay / ▯ Dikey · Yaka** seçimi var. Çocuk kartı varsayılan olarak **dikey yaka kartı**
  (54 × 85,6 mm) açılır: üstte askı deliği payı, büyük fotoğraf, ad, **sınıf**, numara ve yıl; arkada büyük QR + elle girilebilen kod.
- Çocuklarda telefon olmadığı için derse giriş/teslim yaka kartıyla yapılır: çocuk öğretmeni çocuk uygulamasında **📇 Kart**
  sekmesinden okutur. Kart yoksa ya da kamera çalışmazsa **📋 Yoklama** sekmesinde her çocuğun yanında **Hat (Geldi) / Çû (Teslim)**
  düğmeleriyle elle işaretlenir. Her iki yolla da veliye anında bildirim gider (uygulama kapalı olsa bile — bkz. anlık bildirimler).

## Kayıtlar
- Her okutma `gateLog`'a yazılır (okutan görevli, zaman, kart, sonuç). Değiştirilemez, silinemez (yalnızca yönetici).
- Öğrenci İşleri tüm kayıtları görür; görevli yalnızca kendi okuttuklarını.

## Test
`tools/e2e/kart-kapi.js` (18 adım): kart çıkar → QR'ın gerçekten anahtar taşıdığı (çözülerek) → kapıda geçerli ✅ →
numaralı sahte QR ⛔ → rastgele anahtar ⛔ → kayıp kart yenileme → eski kart ⛔ → çocuk kartı → öğretmen okutur →
veliye bildirim → çocuk öğretmeni yetişkin kartını kullanamaz.
