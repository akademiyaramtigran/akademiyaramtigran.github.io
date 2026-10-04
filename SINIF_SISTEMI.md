# 🏫 Sınıf Sistemi — iş akışı

| Adım | Kim | Nerede |
|---|---|---|
| 1. Öğrenci kaydı (elle veya kabul edilen başvurudan) | Öğrenci İşleri | Tescîl / Serlêdan · Çocuk Akademisi → Serlêdan / Zarok |
| 2. Öğretmen kaydı | Öğrenci İşleri | Tescîl · Çocuk Akademisi → Mamoste |
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
