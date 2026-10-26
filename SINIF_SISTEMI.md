# 🏫 Sınıf Sistemi — iş akışı

| Adım | Kim | Nerede |
|---|---|---|
| 1. Öğrenci kaydı (elle veya kabul edilen başvurudan) | Öğrenci İşleri | **Qad · Tescîl · Bername** (alanı aç) / Serlêdan · Çocuk Akademisi → Serlêdan / Zarok |
| 2. Öğretmen kaydı (alana eklenir) | Öğrenci İşleri | **Qad · Tescîl · Bername** → alan → Mamoste · Çocuk Akademisi → Mamoste |
| 3. **Alan sınıfları** — ör. Sinema'ya kaydedilen öğrencilerden "1. Sınıf", "A Grubu"; öğrenciler listeden seçilir (sınıfsızlar ayrıca gösterilir) | Öğrenci İşleri | **Sınıf ve Atölye** → 🎨 Alan sınıfları → alan seç → ➕ Yeni sınıf |
| 4. Sınıfa **sınıf öğretmeni** atama (bir veya birkaç) | Öğrenci İşleri | Sınıf formunda öğretmen seçimi |
| 4b. **Sınıfa ders programı** — sınıf kartı → 📅 "Ders ekle" (veya Program'da ders eklerken **Sınıf** seçimi). Ders yalnız o sınıfın öğrencilerine görünür; öğretmenin yoklama listesi o sınıftır. Sınıfsız ders eskisi gibi alanın tüm öğrencilerine açıktır | Öğrenci İşleri | Sınıf kartı · Program |
| 4c. **Genel sınıflar** — tüm alanların girdiği dersler için; öğrenciler tüm alanlardan seçilir (alan çipleriyle süzülür), öğretmen atanır, ders programı verilir | Öğrenci İşleri | 🌐 Genel sınıflar |
| 4d. **Atölye** — dışarıdan gelen eğitmenle tek seferlik ders: ad, tarih, saat, yer, (dış) eğitmen, sorumlu öğretmen; her alandan öğrenci seçilir → o günün programına otomatik eklenir → 📋 yoklama girilir → 🔒 kapatılır (yoklama raporlara işlenir, ders programdan kalkar, atölye arşivde kalır) | Öğrenci İşleri | 🛠 Atölye |
| 5. Öğretmen kendi sınıfına **duyuru / ödev / belge** gönderir | Sınıf öğretmeni | Ana uygulama → **🏫 Sınıfım** · Çocuk uygulaması → **Duyurular** |
| 6. Öğrenci / veli kendi sınıfının paylaşımlarını görür | Öğrenci · Veli | **🏫 Sınıfım** · Bugün + Duyurular |
| 7. Alan bazlı veya genel duyuru | Yönetici · Öğrenci İşleri | Duyurular (alan seçimi) |
| 8. Raporlar — **alan · sınıf · öğretmen · öğrenci** filtreli | Yönetici · Öğrenci İşleri | Rapor → Liste |
| 9. Anketler — **Anket Stüdyosu** (yalnız Öğrenci İşleri): şablonla başla, soru türleri (5'li katılım, 1–10 puan, tek/çoklu seçim, evet/hayır, yazılı), zorunlu soru, önizleme, son gün, anonim. Hedef: **tüm öğrenciler / tüm öğretmenler** + alan filtresi; Çocuk Akademisi'nde **veliler / öğretmenler** + alan. Sonuçlar grafikli, katılım oranı, CSV/PDF | Öğrenci İşleri (oluşturur) · Yönetici (yalnız sonuçları görür: Rapor → Ankêt) | Ankêt (🎓 · 👩‍🏫 · 🎼) |
| 9b. **Çocuk Akademisi raporu** — çocuk/aile/kardeşli aile, sınıf + sınıf öğretmeni, alan dağılımı, başvurular, devam (7/30/90/365 gün), CSV | Yönetici · Öğrenci İşleri | Rapor → 🎼 Akademiya Zarokan |
| 10. Kardeşler | Öğrenci İşleri | Çocuk Akademisi → Dêûbav "➕ Kardeş" · çocuk kartında 👨‍👧 "listeden kardeş eşleştir" · başvuru kabulünde otomatik öneri |

## Kısıtlar (değişmedi + yeni)
- Öğretmen **yalnızca sınıf öğretmeni olduğu sınıfa** ve **kendi adıyla** paylaşım yapabilir (Firestore kuralı denetler)
- Öğrenci/veli kendi sınıfını değiştiremez; sınıf ve sınıf öğretmeni yalnızca Öğrenci İşleri/Yönetici tarafından yazılır
- Veli yetişkin akademinin paylaşımlarını, yetişkin öğrenci çocuk akademisinin paylaşımlarını göremez
- Dosya: görseller sıkıştırılır, PDF en fazla 600 KB (Storage açılınca büyük dosyalar oraya taşınabilir)

## Veriler
- `classes/{id}` (ana akademi): `kind` (area | general | workshop), `name`, `area` (genel/atölyede `genel`), `studentNos[]`, `teacherNos[]`, `teacherNames[]`;
  atölyede ek: `date`, `start`, `end`, `loc`, `guest`, `lessonId`, `status` (open | closed), `attSummary`.
  Eski düzendeki `classes/{alan}_{seviye}` belgeleri panodaki **♻ Dönüştür** ile yeni düzene geçer.
- `schedule/{id}.classId`: dersin bağlı olduğu sınıf (boşsa alanın tamamı). Atölye dersi: `schedule/ws_{sınıf}`
- `attendance/{dersId}-{tarih}`: atölye yoklaması da aynı biçimde (`classId` ile)
- `kidClasses/L{seviye}` (çocuk akademisi, değişmedi): `teacherNos`, `teacherNames`; çocuğun sınıfı kendi `classLevel` alanı
- `kidSurveys` (`targetType`: guardians | kidteachers, `targetAreas`) · `kidSurveyResponses/{anket}_{no}` (`role`, `no`, `name`, `areas`; kişi başına bir yanıt; yalnız kendi adına ve kendisine yönelik ankete; yanıtları yalnız Öğrenci İşleri/Yönetici okur)
- Tüm anket verilerini silmek: GitHub → Actions → **Anket verilerini sil** → onaya `SİL`
- `classPosts`, `kidClassPosts`: `classId, type (duyuru|odev|belge), title, body, due, files[], teacherNo, teacherName` (`classPosts`'ta ayrıca `className`)
- Öğrenci birden çok sınıfta olabilir (alan sınıfı + genel sınıf + açık atölye): hepsinin paylaşımlarını ve derslerini görür

## Kim ne yapar
- **Öğrenci İşleri:** öğrenci ve öğretmen kaydı, sınıf açma (bir sınıfa birden çok sınıf öğretmeni atanabilir —
  sınıf öğretmeni programı beklemeden sınıfa duyuru/ödev/belge gönderir), atölye. Ders programını yalnızca **görür**.
- **Bölüm sorumlusu** (genel sorumlu: tüm bölümler · çocuk akademisi sorumlusu: kendi dersi):
  ders programı + öğretmen ataması, "ders yapılmadı" işareti, öğrenci izni. Firestore kuralı yalnız kendi bölümüne izin verir.
- **Yönetici:** her şey; raporlarda öğretmen devamı (neden + işaretleyen) ve öğrenci izinleri.

## Program, "Dersi başlat", yoklama
- **Ders ekleme (sorumlu):** sınıf → ders adı → öğretmen → takvimden gün → saat. **Her hafta tekrarlansın** işaretliyse
  o günden itibaren her hafta aynı gün/saatte (dönem seçilirse dönem sonuna kadar); işaretsizse yalnız o gün.
  Öğrenciler gelecekteki derslerini programda görür. Takvim uygulamanın dilinde açılır (`DateInput`).
- **Dersi başlat (öğretmen):** saat/gün sınırı yok; başlangıç anı `attendance/{ders}-{tarih}.startedAt`.
  - **QR ile al (kart):** öğrencinin yaka kartı okutulur; başlangıçtan **15 dk** sonra okutulan **geç** yazılır, kayıt anında yapılır.
  - **Ders QR'ı:** öğrenciler kendi telefonuyla okutur (aynı 15 dk kuralı). Elle ✓ / ⏱ / ✗ işareti öğretmenin seçimidir.
  - Çocuk akademisi: öğretmen derste "Dersi başlat" der; 15 dk sonra "geldi" işaretlenen çocuk **geç** yazılır.
- **Öğrenci izni (sorumlu):** öğrenci + tarih aralığı + neden (`studentLeaves`). İzinli öğrenci o günlerde yoklama
  listesinde görünmez, yoklamaya `leave` yazılır (devamsızlık sayılmaz); neden Rapor → **Öğrenci izinleri**'nde.
- **Ders yapılmadı (sorumlu):** program → dersin 🚫 düğmesi → tarih + neden (**devamsız / raporlu / mazeretli**) + açıklama;
  o dersin öğretmenine yazılır.
- **Öğretmen devamı raporu:** Rapor → **Öğretmen devamı**: bu hafta / 30 gün / dönem; her öğretmen için ✅ işlendi · 🚫/🏥/📝 · ⚠ kayıt yok (yoklama alınmamış), CSV.

## Kartlar: kim nereden ne gönderir (tek iş, tek yer)
| Kart | Öğretmen | Öğrenci |
|---|---|---|
| 📢 Duyurular | Gelen (yönetim + bölüm sorumlusu) · **yalnız kendi sınıflarına** duyuru (dosyasız; `classPosts` type `duyuru`) | Okul duyuruları + kendi sınıfının duyuruları |
| 🏫 Sınıfım | **Ödev & Belge** (dosyalı) · **Mesaj** (toplu ya da birebir, dosyasız) | Ödev ve belgeler |
| 📝 Öğrenci Değerlendirmesi | Her hafta öğrencilerini 4 ölçütte (1–5) + not | — |
| ⭐ Öğretmen Değerlendirmesi | — | Her hafta öğretmenlerini 4 ölçütte (1–5), isimsiz |
| 📊 Anket | Yönetim/sorumlu anketleri | Yönetim/sorumlu anketleri |

- Öğretmen alan geneline duyuru **yazamaz** (kural); dosya/belge yalnızca Sınıfım → Ödev & Belge'den gider.
- Öğretmen ve öğrenci hiçbir rapor sonucu görmez (devam yüzdesi, risk, değerlendirme puanı). Elle devam yüzdesi değiştirme kaldırıldı.
- Hatırlatma: ana ekranda "bu haftanın değerlendirmesi bekliyor" + her Cuma 15:00 telefona bildirim (`evalReminder`).

## Değerlendirme verileri
- `studentEvals/{pazartesi}_{öğretmenNo}_{öğrenciNo}`: `{wk, teacherNo, teacherName, studentNo, studentName, area, classId, c:{p,g,h,b}, note}` — okur: yönetici, bölüm sorumlusu, yazan öğretmen.
- `teacherEvals/{pazartesi}_{öğrenciNo}_{öğretmenNo}`: `{wk, studentNo, teacherNo, teacherName, area, c:{e,h,r,f}, note}` — okur: yönetici, bölüm sorumlusu, gönderen öğrenci. Öğretmen okuyamaz; raporda öğrenci adı gösterilmez.

## Raporlar (yalnız yönetici + bölüm sorumlusu)
Amadebûn (devam; öğrenciye dokununca gerçek 8 haftalık grafik + son dersler + değerlendirmeler) · Tarih aralığı · Öğrenci değerlendirmesi · Öğretmen değerlendirmesi · Anket (filtre: öğrenci/öğretmen anketi, açık/kapalı, alan; ekranda sonuç özeti) · Öğretmen derse katılım · İzinler. Öğrenci İşleri panelinde rapor yoktur.
