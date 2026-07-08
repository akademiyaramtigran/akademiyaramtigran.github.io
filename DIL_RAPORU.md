# 🗣 Dil Raporu — Akademîya Aram Tîgran Sistemi

Bu rapor, sistemde (mobil uygulama + ana sayfa) kullanıcının gördüğü **bütün metin
alanlarını** listeler. Her satırda:

| Sütun | Anlamı |
|---|---|
| **Kod** | Yazılımdaki anahtar (değişmez — güncellemede referans olarak kullanılır) |
| **Şu anki Kurdî** | Sistemde şu an görünen Kürtçe metin |
| **Türkçe karşılığı** | Metnin Türkçe anlamı (akademisyenlerin değerlendirmesi için) |
| **Yeni Kurdî** | ✍️ **Akademisyenlerin dolduracağı sütun** — boş bırakılan satır "olduğu gibi kalsın" demektir |

> **Kullanım:** Akademisyenler "Yeni Kurdî" sütununu doldurup raporu geri verir;
> tüm sistem tek seferde bu rapora göre güncellenir. Kod sütunu olmayan satırlarda
> "Şu anki Kurdî" metni referanstır.

---

## 1. Giriş Ekranı (Têketin)

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| appName | AKADEMÎYA ARAM TÎGRAN | ARAM TİGRAN AKADEMİSİ | |
| appSub | Pergala Rêveberiya Zanistê | Yönetim Bilgi Sistemi | |
| selectRole | Cureya têketinê hilbijêre | Giriş türünü seç | |
| roleStudent | Xwendekar | Öğrenci | |
| roleStudentSub | Jimara xwendekarê | Öğrenci numarası | |
| roleTeacher | Mamoste | Öğretmen | |
| roleTeacherSub | Jimara mamoste | Öğretmen numarası | |
| labelStudentNo | Jimara Xwendekarê | Öğrenci Numarası | |
| labelUsername | Jimara Mamoste | Öğretmen Numarası | |
| labelPass | Şîfre | Şifre | |
| btnLogin | Têkeve | Giriş Yap | |
| btnForgot | Şîfre ji bîr kir? | Şifreni mi unuttun? | |
| errLogin | Hejmar an şîfre xelet e. | Numara veya şifre hatalı. | |
| — | Hesab … deqe kilî ye | Hesap … dakika kilitli | |

## 2. Şifremi Unuttum / Şifre Sıfırlama

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| forgotTitle | Şîfre ji Bîr Kir | Şifremi Unuttum | |
| — | Jimara Xwendekar / Mamoste | Öğrenci / Öğretmen Numarası | |
| — | Jimara xwe binivîse | Numaranı yaz | |
| — | ⚠ Jimare nehat dîtin | ⚠ Numara bulunamadı | |
| — | Berdewam bike | Devam et | |
| — | ← Vegere | ← Geri dön | |
| — | ⚠ E-posta tomarkirî nîne. Ji rêveberê re bibêje. | ⚠ Kayıtlı e-posta yok. Yöneticiye bildir. | |
| — | E-posta tê şandin... | E-posta gönderiliyor... | |
| — | ✅ Girêdan hat şandin! | ✅ Bağlantı gönderildi! | |
| — | Emaila xwe kontrol bike û girêdanê bitikîne da ku şîfreya nû saz bikî. | E-postanı kontrol et ve yeni şifre belirlemek için bağlantıya tıkla. | |
| — | E-posta şandin neçû. Rêveber têkilî bike. | E-posta gönderilemedi. Yöneticiyle iletişime geç. | |
| forgotEmail | Navnîşana E-Postê | E-Posta Adresi | |
| forgotPhone | Hejmara Têlefonê | Telefon Numarası | |
| forgotSendEmail | Girêdana E-Postê Bişîne | E-Posta Bağlantısı Gönder | |
| forgotSendSMS | Koda SMS Bişîne | SMS Kodu Gönder | |
| forgotEmailSent | Koda verastkirinê hat şandin! | Doğrulama kodu gönderildi! | |
| forgotCodeLabel | Koda Verastkirinê | Doğrulama Kodu | |
| forgotVerify | Rast bike | Doğrula | |
| forgotNewPass | Şîfreya Nû | Yeni Şifre | |
| forgotConfirmPass | Şîfreya Nû Dubare Bike | Yeni Şifreyi Tekrarla | |
| forgotSave | Şîfreya Nû Tomar Bike | Yeni Şifreyi Kaydet | |
| forgotSuccess | Şîfre hate guhertin! | Şifre değiştirildi! | |
| forgotBack | Vegere | Geri | |
| forgotCodeSent | Kod hat şandin → | Kod gönderildi → | |
| — | Rêveber şîfreyê sıfırla bike | Yönetici şifre sıfırlama | |
| — | Şîfreya Nû (Otomatîk) | Yeni Şifre (Otomatik) | |
| — | Ev şîfre ji bo têketinê bide bikarhêner | Bu şifreyi giriş için kullanıcıya ver | |
| — | ✅ Şîfre hate guhertin! | ✅ Şifre sıfırlandı! | |
| — | Naha dikare bi şîfreya nû têkeve. | Artık yeni şifreyle giriş yapabilir. | |

## 3. Yönetici Paneli (Rêveberî)

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| adminPanel | Panela Rêveberiyê | Yönetici Paneli | |
| areas | Qadên Hunerê | Sanat Alanları | |
| totalStudents | Xwendekar | Öğrenci (sayısı) | |
| totalTeachers | Mamoste | Öğretmen (sayısı) | |
| pendingApproval | Peywirên Bendewar | Bekleyen Görevler / Onaylar | |
| activePrograms | Bernameyên Çalak | Aktif Programlar | |
| areaCard_student | Xwendekar Tescîl Bike | Öğrenci Kaydet | |
| areaCard_teacher | Mamoste Tescîl Bike | Öğretmen Kaydet | |
| areaCard_schedule | Bernameya Qadê | Alan Programı | |
| areaStudents | Xwendekarên Qadê | Alan Öğrencileri | |
| areaTeachers | Mamoste / Hînkar | Öğretmenler / Eğitmenler | |
| areaSchedule | Bernameya Dersê | Ders Programı | |
| addStudent | Xwendekarekî Nû | Yeni Öğrenci | |
| addTeacher | Mamosteyekî Nû | Yeni Öğretmen | |
| addLesson | Dersekî Nû | Yeni Ders | |
| fullName | Nav û Nasname | Ad Soyad | |
| artField | Qada Hunerê | Sanat Alanı | |
| regYear | Sala Tescîlê | Kayıt Yılı | |
| scholarship | Burs | Burs | |
| noScholarship | Burs Tune | Burs Yok | |
| fullScholarship | Bursê Tevahî | Tam Burs | |
| sch75 / sch50 / sch25 | %75 / %50 / %25 Burs | %75 / %50 / %25 Burs | |
| studentNoPreview | Jimara Xwendekarê (Pêşdîtin) | Öğrenci Numarası (Önizleme) | |
| saveStudent | Xwendekar Tescîl Bike | Öğrenci Kaydet | |
| username | Navê Bikarhêner | Kullanıcı Adı | |
| password | Şîfre (destpêkê: 1234) | Şifre (başlangıç: 1234) | |
| saveTeacher | Mamoste Tescîl Bike | Öğretmen Kaydet | |
| deleteStudent | Xwendekar Jê Bibe | Öğrenciyi Sil | |
| deleteTeacher | Mamoste Jê Bibe | Öğretmeni Sil | |
| studentDetails | Agahiyên Xwendekarê | Öğrenci Bilgileri | |
| teacherDetails | Agahiyên Mamoste | Öğretmen Bilgileri | |

## 4. Ders Programı (Bername)

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| day | Roj | Gün | |
| lessonName | Navê Dersê | Ders Adı | |
| startTime | Destpêk | Başlangıç | |
| endTime | Dawî | Bitiş | |
| location | Cih | Yer / Konum | |
| addToSchedule | Bernameyê Zêde Bike | Programa Ekle | |
| weeklySchedule | Bernameya Hefteyê | Haftalık Program | |
| deleteLesson | Ders Jê Bibe | Dersi Sil | |
| editLesson | Dersa Biguherîne | Dersi Düzenle | |
| saveLesson | Dersa Tomar Bike | Dersi Kaydet | |
| mainLesson | Dersa Sereke | Ana Ders | |
| extraLesson | Dersên Zêde / Atolye | Ek Dersler / Atölye | |
| mainLessons | Dersên Sereke | Ana Dersler | |
| extraLessons | Dersên Zêde / Atolye | Ek Dersler / Atölyeler | |
| mainLessonHint | Her hefte yek roj dubare dibe — tenê roj hilbijêre | Her hafta aynı gün tekrarlar — sadece günü seç | |
| extraLessonHint | Tarîxên taybet yên vê dersê zêde bike — atolye, kurs, îmtîhan... | Bu dersin özel tarihlerini ekle — atölye, kurs, sınav... | |
| lessonDates | Tarîxên Dersê | Ders Tarihleri | |
| noDatesYet | Hîn tarîx nehatiye zêdekirin | Henüz tarih eklenmedi | |
| addAtLeastOneDate | Herî kêm yek tarîx zêde bike | En az bir tarih ekle | |
| dateAlreadyAdded | Ev tarîx berê hatibû zêdekirin | Bu tarih daha önce eklenmişti | |
| noMainLessons | Dersa sereke tune | Ana ders yok | |
| noExtraLessons | Dersên zêde / atolye tune | Ek ders / atölye yok | |
| noExtraLessonsDesc | Atolye, kurs yan jî tarîxên taybet yên dersê li vir tomar bike | Atölye, kurs veya özel tarihli dersleri buraya kaydet | |
| addMainLesson | Dersa Sereke Zêde Bike | Ana Ders Ekle | |
| addExtraLesson | Dersa Zêde Bike | Ek Ders Ekle | |
| todayLabel | Îroj | Bugün | |
| pastLabel | Borî | Geçmiş | |
| upcomingLabel | Bê | Gelecek | |
| upcomingExtras | Dersên Zêde / Atolye | Yaklaşan Ek Dersler | |
| mainLessonsWeekly | Dersên Sereke — Heftane | Ana Dersler — Haftalık | |
| extraBadge | Zêde | Ek | |
| datesLabel | tarîx | tarih | |
| todaySchedule | Bernameya Îroyîn | Bugünün Programı | |
| todayLessons | Dersên Îroyîn | Bugünün Dersleri | |

### Haftanın Günleri

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Dûşem | Pazartesi | |
| Sêşem | Salı | |
| Çarşem | Çarşamba | |
| Pêncşem | Perşembe | |
| Înî | Cuma | |
| Şemî | Cumartesi | |
| Yekşem | Pazar | |

## 5. Duyurular (Ragihandin)

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| announcements | Ragihandin | Duyurular | |
| sendAnn | Ragihandinek Bişîne | Duyuru Gönder | |
| target | Armanc | Hedef (kime) | |
| allStudents | Hemû Xwendekar | Tüm Öğrenciler | |
| teachers | Mamoste | Öğretmenler | |
| annTitle | Sernav | Başlık | |
| annMessage | Peyam | Mesaj | |
| send | Bişîne | Gönder | |

## 6. Öğretmen Paneli

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| myStudents | Xwendekarên Min | Öğrencilerim | |
| activeLesson | Dersa Çalak | Aktif Ders | |
| ongoing | Berdewam e | Devam ediyor | |
| qrScan | QR Bixwîne | QR Okut | |
| attendanceList | Lîsteya Amadebûnê | Yoklama Listesi | |
| attended | Beşdarbu | Katıldı (Var) | |
| absent | Tunebû | Katılmadı (Yok) | |
| late | Dereng | Geç geldi | |
| saveAttendance | Tomar bike | Yoklamayı Kaydet | |
| attendanceSaved | Amadekarî hate tomarkirin | Yoklama kaydedildi | |
| qrScanTeacher | QR Xwendekar Bixwîne | Öğrenci QR'ını Okut | |
| scanFrame | Koda QR ya xwendekarê bixwîne | Öğrencinin QR kodunu okut | |
| scanned | Tescîl kir | Kaydedildi | |
| noStudentFound | Xwendekar nehat dîtin | Öğrenci bulunamadı | |

## 7. Öğrenci Paneli

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| home | Mal | Ana Sayfa | |
| attendance | Amadebûn | Devamlılık / Yoklama | |
| profile | Profîl | Profil | |
| myQR | QR-a Min | QR Kodum | |
| mySchedule | Bernameya Min | Programım | |
| myAttendance | Amadebûna Min | Devamlılığım | |
| overallAvg | Navgîna giştî | Genel ortalama | |
| thisTermAtt | Amadebûna Semesterê | Dönem devamlılığı | |
| absenceCount | Rojan tunebûm | Gelmediğim günler | |
| qrHint | Ji bo tescîla dersê ji mamosteyê re bixwîne | Ders kaydı için öğretmenin cihazına okut | |

## 8. QR ile Derse Giriş (Öğrenci)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Têketina Dersê | Derse Giriş | |
| Koda QR ya mamosteyê bixwîne | Öğretmenin QR kodunu okut | |
| Koda bi destan binivîse | Kodu elle yaz | |
| Dîsa biceribîne | Tekrar dene | |
| Wêne bigire & bixwîne | Fotoğraf çek ve okut | |
| Kamera tê destpêkirin… | Kamera başlatılıyor… | |
| Bişîne | Gönder | |
| Vegere kamerayê | Kameraya dön | |
| Têketin Hate Pejirandin! | Giriş Onaylandı! | |
| Têketin Pêk Nehat | Giriş Başarısız | |
| Civîna dersê ya çalak nehat dîtin. | Aktif ders oturumu bulunamadı. | |
| Civîna dersê hatiye girtin. | Ders oturumu kapatılmış. | |
| Dema QR ya dersê derbas bûye. | Ders QR'ının süresi geçmiş. | |
| Koda QR ya şaş an dem bûye. | QR kodu hatalı veya süresi dolmuş. | |
| Berê ketina vê dersê qeyd kir. | Bu derse zaten giriş yaptın. | |
| 📍 Tu ji dersê re dûr î — nêziktir bibe. | 📍 Dersten uzaktasın — yaklaş. | |
| 📍 Ji bo têketinê cih lazim e — GPS-ê veke. | 📍 Giriş için konum gerekli — GPS'i aç. | |
| 🚫 Tu ne xwendekarê vê dersê yî. | 🚫 Bu dersin öğrencisi değilsin. | |
| Ewlekariya Dersê | Ders Güvenliği | |
| Ji bo ketin dersê, nasnameya xwe piştrast bike | Derse girmek için kimliğini doğrula | |
| Tiliya Destê / Rûnasîn | Parmak İzi / Yüz Tanıma | |
| Şîfreya Hesabê Binivîse | Hesap Şifreni Gir | |
| Şîfreya ku bi têketinê bikar tîni binivîse | Girişte kullandığın şifreyi yaz | |
| Piştrast Bike | Doğrula | |
| Şîfreya Hesabê Bikar Bîne | Hesap Şifresini Kullan | |
| ✓ Nasname piştrast bû! | ✓ Kimlik doğrulandı! | |
| Şaşitî çêbû. Ji nû ve biceribîne. | Hata oluştu. Yeniden dene. | |

## 9. Kimlik Kartı (Kart)

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| generateCard | Karta Nasnameyê Çêke | Kimlik Kartı Oluştur | |
| studentCard | Karta Xwendekarê | Öğrenci Kimlik Kartı | |
| cardArea | Qad | Alan | |
| cardYear | Sal | Yıl | |
| printCard | Çap Bike | Yazdır | |
| download | Dakêşin | İndir | |
| — | 📥 Kart tê amadekirin… | 📥 Kart hazırlanıyor… | |
| — | ⚠ Dakêşan bi ser neket | ⚠ İndirme başarısız | |
| — | ✅ Kart hat tomarkirin (HD) | ✅ Kart kaydedildi (HD) | |
| — | ✅ PDF ya çapxaneyê hat tomarkirin | ✅ Matbaa PDF'i kaydedildi | |

## 10. Profil Alanları

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| phone | Hejmara Têlefonê | Telefon Numarası | |
| emailLabel | E-Posta | E-Posta | |
| dobLabel | Dîroka Jidayikbûnê | Doğum Tarihi | |
| addressLabel | Navnîşan | Adres | |
| bioLabel | Danasîn | Tanıtım / Özgeçmiş | |
| photoUpload | Wêne Barkirin | Fotoğraf Yükle | |
| detailedProfile | Agahiyên Profîlê | Profil Bilgileri | |
| idInfoTitle | Agahiyên Nasnameyê | Kimlik Bilgileri | |
| idNumber | Jimara Nasnameyê | Kimlik Numarası | |
| birthPlace | Cihê Jidayikbûnê | Doğum Yeri | |
| nationality | Netewe | Uyruk / Millet | |
| motherName | Navê Dayikê | Anne Adı | |
| fatherName | Navê Bavê | Baba Adı | |
| docTitle | Belgeyên Serlêdanê | Başvuru Belgeleri | |
| uploadDoc | Belge Barkirin | Belge Yükle | |

## 11. Şifre Değiştirme

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| 🔒 Şîfre Biguherîne | 🔒 Şifre Değiştir | |
| Şîfreya Niha | Mevcut Şifre | |
| Şîfreya Nû | Yeni Şifre | |
| Şîfreya Nû (Dubare) | Yeni Şifre (Tekrar) | |
| Hemû qadan dagire | Tüm alanları doldur | |
| Herî kêm 8 tîp, tîpa mezin û hejmar lazim e | En az 8 karakter, büyük harf ve rakam gerekli | |
| Şîfreyên nû li hev nayên | Yeni şifreler uyuşmuyor | |
| Şîfreya niha xelet e | Mevcut şifre hatalı | |
| Şîfre Tomar Bike | Şifreyi Kaydet | |
| Şîfre hate guhertin! | Şifre değiştirildi! | |
| Naha dikari bi şîfreya nû têkevi. | Artık yeni şifrenle giriş yapabilirsin. | |

## 12. Anketler (Ankêt)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| 👨‍🏫 Mamoste Ankêtê | 👨‍🏫 Öğretmen Anketi | |
| 🎓 Xwendekar Ankêtê | 🎓 Öğrenci Anketi | |
| Pirsên Ankêtê | Anket Soruları | |
| Ankêta Nû Biafirîne | Yeni Anket Oluştur | |
| Ankêtên Hazir | Hazır Anketler | |
| Sernava Ankêtê | Anket Başlığı | |
| Danasîn (vebijarkî) | Açıklama (isteğe bağlı) | |
| Kî Beşdar Dibe? | Kimler Katılıyor? | |
| Qadên Bijartî | Seçili Alanlar | |
| Pirsê Zêde Bike | Soru Ekle | |
| Nivîsa Pirsê | Soru Metni | |
| Cureya Pirsê | Soru Türü | |
| Pûan (1-10) | Puan (1-10) | |
| Nivîs Azad | Serbest Metin | |
| Çend Vebijark | Çoktan Seçmeli | |
| Vebijark | Seçenekler | |
| Çalak Bike | Etkinleştir | |
| Rawestîne | Durdur | |
| ✅ Çalak / ⏸ Neçalak | ✅ Aktif / ⏸ Pasif | |
| Encaman Bibîne | Sonuçları Gör | |
| Hîn ankêt nehatiye çêkirin | Henüz anket oluşturulmadı | |
| Agahî | Bilgi | |
| Hedef | Hedef | |
| Encam Cureyê | Sonuç Türü | |
| Pirsên | Sorular | |
| Pêştir → | İleri → | |
| Rêjeya % (yüzdelik) | Yüzde % oranı | |
| Pûan (puan sistemi) | Puan sistemi | |
| Sual – Cewab | Soru – Cevap | |
| Tevlihev (hemû) | Karma (tümü) | |
| Belge an wêne piştgirî? | Belge/görsel yüklemeye izin verilsin mi? | |
| Her pirsê ji 100'ê tê nirxandin û encam wekî % nîşan tê dan | Her soru 100 üzerinden değerlendirilir, sonuç % olarak gösterilir | |
| Her pirsê xalên xwe hene, encam wekî pûan hatiye berhevkirin | Her sorunun kendi puanı vardır, sonuç puan olarak toplanır | |
| Xwendekarên bersivên nivîskî didin, encam wekî nivîs tê berhevkirin | Öğrenciler yazılı cevap verir, sonuçlar metin olarak toplanır | |
| Pûan, rêje û nivîs bi hev re dikarin bibin ankêtê | Puan, yüzde ve metin bir arada olabilir | |
| Hîn encam tune | Henüz sonuç yok | |
| Hûrgulî | Detaylar | |

## 13. Haftalık Değerlendirme (Öğrenci)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Nirxandina Hefteyê | Haftalık Değerlendirme | |
| Ders | Ders | |
| ✓ Nirxandin hate şandin | ✓ Değerlendirme gönderildi | |
| Nûve bike | Güncelle | |
| Ji %0 heya %100 — sirbike | %0'dan %100'e — kaydır | |
| Bernameya ders tune | Ders programı yok | |
| Hîn pirsên ankêtê nehatine destnîşankirin | Henüz anket sorusu belirlenmedi | |

## 14. Haftalık Rapor & Uyarılar (Yönetici)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Raporta Hefteyê | Haftalık Rapor | |
| Hefteya | Haftası | |
| Hemû Qadan | Tüm Alanlar | |
| Rewşa Amadebûnê | Devamlılık Durumu | |
| Kêm (<50%) | Düşük (<%50) | |
| Navîn (50–79%) | Orta (%50–79) | |
| Baş (≥80%) | İyi (≥%80) | |
| Encamên Nirxandinê | Değerlendirme Sonuçları | |
| Ev hefte bersiv tune | Bu hafta cevap yok | |
| PDF Dakêşe | PDF İndir | |
| Çap bike | Yazdır | |
| Navgîn | Ortalama | |
| Hişyarî — Xwendekarên Binê %50 | Uyarı — %50 Altındaki Öğrenciler | |
| Tu xwendekar binê %50 nîne | %50 altında öğrenci yok | |
| Agahdarî û Hişyarî | Bildirimler ve Uyarılar | |
| Tu hişyarî tune | Uyarı yok | |
| Hemû xwendî bimîne | Tümünü okundu işaretle | |
| Hemû jê bibe | Tümünü sil | |
| Nirxandina kêm | Düşük değerlendirme puanı | |
| Amadebûna kêm | Düşük devamlılık | |

## 15. Öneri & Şikayet (Öğrenci)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| 💡 Pêşniyar û Gilî | 💡 Öneri ve Şikayet | |
| 💡 Pêşniyar | 💡 Öneri | |
| ⚠️ Gilî | ⚠️ Şikayet | |
| ❓ Pirsek | ❓ Soru | |
| Sernavê Peyamê | Mesaj Başlığı | |
| Peyama Te | Mesajın | |
| Nenas bişîne (nav nayê xuyang kirin) | İsimsiz gönder (ad görünmez) | |
| ✅ Peyama te hat şandin! Rêveber dê bersivê bide. | ✅ Mesajın gönderildi! Yönetici cevaplayacak. | |
| Sernav û peyamê dagire | Başlık ve mesajı doldur | |
| Peyamên Berê | Önceki Mesajlar | |
| Hîn pêşniyar nehatiye şandin | Henüz öneri gönderilmedi | |
| Peyamên te rasterast li qutiya peyaman ya rêveber dikeve. | Mesajların doğrudan yöneticinin mesaj kutusuna düşer. | |

## 16. Basın Paneli & Site Haberleri (Çapemenî)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Çapemenî | Basın | |
| Nûçeyên malperê birêve dibe | Site haberlerini yönetir | |
| 📰 Nûçeyên Malperê | 📰 Site Haberleri | |
| Ev nûçe li ser rûpela sereke (malper) ji her kesî re xuya dibin. | Bu haberler ana sayfada herkese açık görünür. | |
| Sernav | Başlık | |
| Nivîs | Metin | |
| Girêdana YouTube (vebijarkî) | YouTube bağlantısı (isteğe bağlı) | |
| 📷 Wêne hilbijêre (vebijarkî) | 📷 Görsel seç (isteğe bağlı) | |
| 📤 Biweşîne | 📤 Yayınla | |
| Nûçeyên weşandî | Yayınlanan haberler | |
| Hîn nûçe tune. Ya yekem biweşîne! | Henüz haber yok. İlkini yayınla! | |
| Jê bibe | Sil | |
| ⚠ Sernav pêwîst e | ⚠ Başlık gerekli | |
| ✅ Nûçe hate weşandin | ✅ Haber yayınlandı | |
| 🗑 Hate jêbirin | 🗑 Silindi | |
| ❌ Çewtî — dîsa biceribîne | ❌ Hata — tekrar dene | |

## 17. Özel Kartlar (Basın & Öğrenci İşleri kayıt ekranı)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Karûbarên Xwendekaran | Öğrenci İşleri | |
| Serlêdanên tomarkirinê birêve dibe | Kayıt başvurularını yönetir | |
| 📇 Kartên Taybet | 📇 Özel Kartlar (Personel Kartları) | |
| Ev kart ji beşa MAMOSTE têkevin û tenê erka xwe dibînin. | Bu kartlar ÖĞRETMEN bölümünden giriş yapar, sadece kendi görevini görür. | |
| ➕ Kartê Tescîl Bike | ➕ Kart Kaydet | |
| Kartên tescîlkirî | Kayıtlı kartlar | |
| Hîn kart tune. | Henüz kart yok. | |
| 🔑 Şîfreya nû çêke | 🔑 Yeni şifre oluştur | |
| Şîfreya nû — bide bikarhêner: | Yeni şifre — kullanıcıya ver: | |

## 18. Öğrenci İşleri Paneli — Başvuru Yönetimi

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| ⚙️ Mîhengên Serlêdanê | ⚙️ Başvuru Ayarları | |
| Serlêdan VEKIRÎ ye | Başvurular AÇIK | |
| Serlêdan GIRTÎ ye | Başvurular KAPALI | |
| Destpêk (vebijarkî) | Başlangıç (isteğe bağlı) | |
| Dawî (vebijarkî) | Bitiş (isteğe bağlı) | |
| Nîşeya li ser malperê (vebijarkî) | Sitede gösterilecek not (isteğe bağlı) | |
| 📄 Belgeyên Pêwîst | 📄 İstenen Belgeler | |
| Ev belge li ser malperê xuya dibin; serlêder her yekê cuda bar dike. | Bu belgeler sitede görünür; başvuran her birini ayrı yükler. | |
| Navê belgeyê (ör. Forma Tomarkirinê) | Belge adı (örn. Kayıt Formu) | |
| 📎 Şablona vala (wêne/PDF — vebijarkî) | 📎 Boş şablon (görsel/PDF — isteğe bağlı) | |
| ➕ Belgeyê Zêde Bike | ➕ Belge Ekle | |
| Hîn belge nehatiye danîn. | Henüz belge tanımlanmadı. | |
| ⚠ Dosya pir mezin e (max ~600KB) | ⚠ Dosya çok büyük (en fazla ~600KB) | |
| 📋 Serlêdan | 📋 Başvurular | |
| 📄 Lîsteya PDF | 📄 PDF Listesi | |
| Hîn serlêdan tune. | Henüz başvuru yok. | |
| Hemû | Tümü | |
| Nû | Yeni | |
| Qebûl | Kabul | |
| Red | Ret | |
| ✅ Qebûl û Tescîl | ✅ Kabul Et ve Kaydet | |
| ❌ Red bike | ❌ Reddet | |
| Belgeyên barkirî | Yüklenen belgeler | |
| Têlefon | Telefon | |
| Roja jidayikbûnê | Doğum tarihi | |
| Nîşe | Not | |
| ✅ Xwendekar Tescîl Bû | ✅ Öğrenci Kaydedildi | |
| Van agahiyan bide xwendekar — ji beşa XWENDEKAR têkeve. | Bu bilgileri öğrenciye ver — ÖĞRENCİ bölümünden giriş yapar. | |
| Berê tescîl bûye | Zaten kayıtlı | |

## 19. Genel / Ortak Kısa İfadeler

| Kod | Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|
| yes / no | Erê / Na | Evet / Hayır | |
| edit | Biguherîne | Düzenle | |
| back | Vegere | Geri | |
| close | Bigire | Kapat | |
| save | Tomar bike | Kaydet | |
| cancel | Betal bike | İptal | |
| search | Bigere | Ara | |
| noData | Agahî tune | Veri yok | |
| loading | Tê barkirin... | Yükleniyor... | |
| error | Çewtiyek çêbû | Bir hata oluştu | |
| success | Hat tomarkirin | Kaydedildi | |
| confirm | Piştrast bike? | Emin misin? | |
| confirmDeleteMsg | Ev çalakî nayê paşvekirin. | Bu işlem geri alınamaz. | |
| today | Îro | Bugün | |
| allAreas / allFields | Hemû Qad | Tüm Alanlar | |
| week | Hefteya | Hafta | |
| results | Encam | Sonuçlar | |
| active / inactive | Çalak / Ne çalak | Aktif / Pasif | |
| waiting | Çaverê | Bekliyor | |
| done | Qediya | Tamamlandı | |
| logout | Derkeve | Çıkış Yap | |
| refresh | Nûkirin | Yenile | |
| lessons | Ders | Dersler | |
| grade | Not | Not (puan) | |
| report | Rapor | Rapor | |
| message | Peyam | Mesaj | |
| settings | Mîheng | Ayarlar | |
| survey | Ankêt | Anket | |
| area | Qad | Alan | |
| commonArea | Hemû Xwendekar | Tüm Öğrenciler (Ortak Alan) | |
| commonAreaDesc | Dersên Hevpar ên Akademiyê | Akademinin Ortak Dersleri | |
| commonAreaSub | Hemû xwendekarên akademiyê dikarin beşdar bibin | Akademinin tüm öğrencileri katılabilir | |

## 20. Sanat Alanları (Qadên Hunerê)

| Anahtar | Şu anki Kurdî (ad) | Şu anki Kurdî (açıklama) | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|---|---|
| sinema | Sînema | Sînema û Dîroka Fîlimê | Sinema — Sinema ve Film Tarihi | |
| muzik | Muzîk | Teoriya Muzîkê û Performans | Müzik — Müzik Teorisi ve Performans | |
| tiyatro | Şano | Hunera Şanoyê û Performans | Tiyatro — Tiyatro Sanatı ve Performans | |
| dans | Dans | Dansên Klasîk û Modern | Dans — Klasik ve Modern Danslar | |
| edebiyat | Wêje | Nivîsandina Afirîner û Wêje | Edebiyat — Yaratıcı Yazarlık ve Edebiyat | |
| resim | Wênesazî | Wênesazî û Hunera Dîtbarî | Resim — Resim ve Görsel Sanatlar | |
| (ortak) | Dersên Hevpar | Dersên Hevpar ên Akademiyê | Ortak Dersler | |

## 21. PWA / Uygulama Kurulumu

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| 📲 Malpera Serê Zêde Bike | 📲 Ana Ekrana Ekle | |
| Wek sepekê dixebite, offline piştgirî | Uygulama gibi çalışır, çevrimdışı destekli | |
| Zêde Bike | Ekle / Kur | |
| Paşê | Sonra | |
| Rojbûna te pîroz be! 🎉 | Doğum günün kutlu olsun! 🎉 | |
| Em hemû kêfxweş in! | Hepimiz seninle seviniyoruz! | |
| Xweş hatî | Hoş geldin | |

## 22. Ana Sayfa — Malper (akademiyaramtigran.github.io)

| Şu anki Kurdî | Türkçe karşılığı | Yeni Kurdî |
|---|---|---|
| Akademîya Aram Tîgran — Dibistana Hunerê | Aram Tigran Akademisi — Sanat Okulu | |
| DIBISTANA HUNERÊ · 2010 | SANAT OKULU · 2010 | |
| Nûçe û Çalakî | Haberler ve Etkinlikler | |
| Nûçe | Haberler | |
| Qadên Hunerê | Sanat Alanları | |
| Derbarê Akademiyê | Akademi Hakkında | |
| Em kî ne | Biz Kimiz | |
| Damezrandin | Kuruluş | |
| Ji sala 2010'an ve | 2010 yılından beri | |
| Perwerde | Eğitim | |
| Serlêdan | Başvuru | |
| Serlêdana Xwendekariyê | Öğrencilik Başvurusu | |
| Tomarkirin | Kayıt | |
| Têketina Sîstemê | Sisteme Giriş | |
| MENÛ | MENÜ | |
| Girêdan | Bağlantılar | |
| Parzûna Qadê | Alan Filtresi | |
| Vîdyo | Video | |
| Nav û paşnav * | Ad ve soyad * | |
| Roja jidayikbûnê | Doğum tarihi | |
| Têlefon * | Telefon * | |
| Qada hunerê * | Sanat alanı * | |
| Nîşe (vebijarkî) | Not (isteğe bağlı) | |
| Belgeyên pêwîst * | İstenen belgeler * | |
| ⬇ Belgeyên ku divê werin dagirtin: | ⬇ Doldurulması gereken belgeler: | |
| 📎 Bar bike | 📎 Yükle | |
| 🔄 Biguherîne | 🔄 Değiştir | |
| necar / ✅ barkir | yüklenmedi / ✅ yüklendi | |
| 📨 Serlêdanê Bişîne | 📨 Başvuruyu Gönder | |
| ⚠ Nav û têlefon pêwîst in. | ⚠ Ad ve telefon zorunludur. | |
| ⚠ Ev belge kêm in: … | ⚠ Şu belgeler eksik: … | |
| ⏳ Tê şandin… | ⏳ Gönderiliyor… | |
| Serlêdana te hate wergirtin! | Başvurun alındı! | |
| Karûbarên xwendekaran dê bi te re têkilî deyne. | Öğrenci işleri seninle iletişime geçecek. | |
| ❌ Neçû — dîsa biceribîne. | ❌ Gönderilemedi — tekrar dene. | |
| Serlêdan niha girtî ye. Dema tomarkirinê li vir tê ragihandin. | Başvurular şu an kapalı. Kayıt dönemi burada duyurulacak. | |

---

## Notlar

1. **Kapsam:** Rapor, ana çeviri sözlüğünün tamamını (196 anahtar), panellerin
   içindeki yerel sözlükleri ve ana sayfa metinlerini kapsar. Uygulamada İngilizce
   ve Almanca çeviriler de vardır; Kürtçe düzeltmeleri alındığında istenirse
   EN/DE de buna göre elden geçirilir.
2. **Emoji ve işaretler** (📄, ✅, ⚠ …) metnin parçası değildir; yalnızca Kürtçe
   kısmı değerlendirilmelidir.
3. **Değişken içeren metinler** ("Hesab … deqe kilî ye" gibi) cümle kalıbı olarak
   değerlendirilmeli; "…" kısmı sistemce doldurulur.
4. **Güncelleme süreci:** "Yeni Kurdî" sütunu doldurulmuş rapor bana geri
   verildiğinde tüm sistem tek seferde güncellenir; boş bırakılan satırlar
   olduğu gibi kalır.
