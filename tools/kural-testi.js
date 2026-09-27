// Güvenlik kuralı testleri (Firestore + Storage emülatörü). Çalıştırma:
//   cd tools && npm install && npm run kural-testi     (Java 11+ gerekir)
const fs = require('fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } = require('firebase/firestore');
const { ref, uploadString, getBytes } = require('firebase/storage');

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'aram2026-test',
    firestore: { rules: fs.readFileSync(require('path').join(__dirname,'..','firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: fs.readFileSync(require('path').join(__dirname,'..','storage.rules'), 'utf8'), host: '127.0.0.1', port: 9199 },
  });
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    await setDoc(doc(db, 'idx_staff/1000'), { no: '1000', lvl: 'admin' });
    await setDoc(doc(db, 'idx_staff/11202601'), { no: '11202601', lvl: 'teacher' });
    await setDoc(doc(db, 'idx_students/10202601'), { no: '10202601' });
    await setDoc(doc(db, 'idx_students/10202602'), { no: '10202602' });
    await setDoc(doc(db, 'teachers/T1'), { no: '1000', name: 'Admin', isAdmin: true });
    await setDoc(doc(db, 'teachers/T2'), { no: '11202601', name: 'Mamoste', phone: '1' });
    await setDoc(doc(db, 'students/S1'), { no: '10202601', name: 'Xwendekar', area: 'sinema', phone: '1' });
    await setDoc(doc(db, 'students/S2'), { no: '10202602', name: 'Din', area: 'muzik' });
    await setDoc(doc(db, 'messages/M1'), { text: 'x' });
    await setDoc(doc(db, 'config/applications'), { open: true });
    await setDoc(doc(db, 'news/N1'), { title: 't' });
    // Zarok
    await setDoc(doc(db, 'idx_guardians/92026001'), { no: '92026001' });
    await setDoc(doc(db, 'idx_guardians/92026002'), { no: '92026002' });
    await setDoc(doc(db, 'guardians/92026001'), { no: '92026001', name: 'Veli A' });
    await setDoc(doc(db, 'kids/K1'), { no: '82026001', name: 'Zarok A', guardianNos: ['92026001'], health: '' });
    await setDoc(doc(db, 'kids/K2'), { no: '82026002', name: 'Zarok B', guardianNos: ['92026002'] });
    await setDoc(doc(db, 'kidAttendance/A1'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' });
    await setDoc(doc(db, 'kidAttendance/A2'), { kidId: 'K2', guardianNos: ['92026002'], type: 'in' });
    await setDoc(doc(db, 'kidMessages/M1'), { guardianNo: '92026002', text: 'x', from: 'guardian' });
    await setDoc(doc(db, 'config/zarok'), { open: true });
    await setDoc(doc(db, 'idx_kidstaff/72026001'), { no: '72026001' });
    await setDoc(doc(db, 'kidTeachers/72026001'), { no: '72026001', name: 'Mamoste Hêvî' });
    await setDoc(doc(db, 'kidNews/KN1'), { title: 'Nûçe' });
    // v5 rol ayrımı
    await setDoc(doc(db, 'idx_staff/99202601'), { no: '99202601', lvl: 'press' });
    await setDoc(doc(db, 'idx_staff/98202601'), { no: '98202601', lvl: 'registrar' });
    await setDoc(doc(db, 'idx_staff/21202601'), { no: '21202601', lvl: 'teacher' });
    await setDoc(doc(db, 'idx_kidstaff/21202601'), { no: '21202601' });
    await setDoc(doc(db, 'teachers/TP'), { no: '99202601', name: 'Basın', isPress: true });
    await setDoc(doc(db, 'messages/M2'), { recipientNo: '10202601', subject: 'özel' });
    await setDoc(doc(db, 'messages/M3'), { recipientNo: '10202602', subject: 'başkasına özel' });
    await setDoc(doc(db, 'messages/M4'), { recipientGroup: 'allStudents', recipientNo: null, subject: 'toplu' });
    await setDoc(doc(db, 'messages/M5'), { recipientGroup: 'allTeachers', recipientNo: null, subject: 'öğretmenlere' });
    await setDoc(doc(db, 'studentSurveyResponses/R2'), { studentNo: '10202602', answers: {} });
    await setDoc(doc(db, 'applications/AP1'), { name: 'Başvuran', phone: '1', status: 'new' });
    await setDoc(doc(db, 'devices/10202602'), { no: '10202602' });
  });
  const as = e => env.authenticatedContext('uid-' + e, { email: e }).firestore();
  const admin = as('1000@ogretmen.aat'), teacher = as('11202601@ogretmen.aat'), student = as('10202601@ogrenci.aat');
  const fakeStaff = as('9999@ogretmen.aat'), fakeStu = as('7777@ogrenci.aat'), anon = env.unauthenticatedContext().firestore();
  const results = [];
  async function t(name, p, ok) {
    try { await (ok ? assertSucceeds(p) : assertFails(p)); results.push('✅ ' + name); }
    catch (e) { results.push('❌ ' + name + ' — ' + (e.message || e).slice(0, 120)); }
  }
  // Sahte hesaplar
  await t('Sahte personel öğrencileri OKUYAMAZ', getDocs(collection(fakeStaff, 'students')), false);
  await t('Sahte personel öğrenci SİLEMEZ', deleteDoc(doc(fakeStaff, 'students/S1')), false);
  await t('Sahte personel kendini dizine YAZAMAZ', setDoc(doc(fakeStaff, 'idx_staff/9999'), { no: '9999', lvl: 'admin' }), false);
  await t('Sahte öğrenci mesajları OKUYAMAZ', getDocs(collection(fakeStu, 'messages')), false);
  await t('Sahte öğrenci yoklama YAZAMAZ', addDoc(collection(fakeStu, 'attendance'), { x: 1 }), false);
  await t('Girişsiz ziyaretçi öğrencileri okuyamaz', getDocs(collection(anon, 'students')), false);
  // Gerçek kullanıcılar
  await t('Yönetici öğrencileri okur', getDocs(collection(admin, 'students')), true);
  await t('Yönetici öğretmen ekler', setDoc(doc(admin, 'teachers/T3'), { no: '12202601', name: 'Nû' }), true);
  await t('Yönetici dizine yazar', setDoc(doc(admin, 'idx_staff/12202601'), { no: '12202601', lvl: 'teacher' }), true);
  await t('Öğretmen öğrencileri okur', getDocs(collection(teacher, 'students')), true);
  await t('Öğretmen öğretmen listesini okur', getDocs(collection(teacher, 'teachers')), true);
  await t('Öğretmen kendini YÖNETİCİ yapamaz', updateDoc(doc(teacher, 'teachers/T2'), { isAdmin: true }), false);
  await t('Öğretmen kendi telefonunu düzenler', updateDoc(doc(teacher, 'teachers/T2'), { phone: '555' }), true);
  await t('Öğretmen başka öğretmeni SİLEMEZ', deleteDoc(doc(teacher, 'teachers/T1')), false);
  await t('Öğretmen dizine YAZAMAZ', setDoc(doc(teacher, 'idx_staff/11202601'), { lvl: 'admin' }), false);
  await t('Öğretmen duyuru yazar', addDoc(collection(teacher, 'announcements'), { t: 1 }), true);
  await t('Öğrenci kendi kaydını sorgular (no==)', getDocs(query(collection(student, 'students'), where('no', '==', '10202601'))), true);
  await t('Öğrenci başka öğrenciyi OKUYAMAZ', getDoc(doc(student, 'students/S2')), false);
  await t('Öğrenci tüm listeyi OKUYAMAZ', getDocs(collection(student, 'students')), false);
  await t('Öğrenci kendi telefonunu düzenler', updateDoc(doc(student, 'students/S1'), { phone: '555' }), true);
  await t('Öğrenci kendi ALANINI değiştiremez', updateDoc(doc(student, 'students/S1'), { area: 'muzik' }), false);
  await t('Öğrenci program okur', getDocs(collection(student, 'schedule')), true);
  await t('Öğrenci KENDİ yoklamasını yazar (QR)', setDoc(doc(student, 'attendance/s1_x'), { sessionId: 's1', studentNo: '10202601' }), true);
  await t('Öğrenci BAŞKASI adına yoklama yazamaz', setDoc(doc(student, 'attendance/s1_y'), { sessionId: 's1', studentNo: '10202602' }), false);
  await t('Öğrenci yoklama SİLEMEZ', deleteDoc(doc(student, 'attendance/s1_x')), false);
  await t('Öğrenci program YAZAMAZ', addDoc(collection(student, 'schedule'), { x: 1 }), false);
  await t('Öğrenci roller YAZAMAZ', setDoc(doc(student, 'roles/uid-10202601@ogrenci.aat'), { role: 'teacher' }), false);
  // Zarok (veli)
  const veli = as('92026001@veli.aat'), fakeVeli = as('99999999@veli.aat');
  const { arrayUnion } = require('firebase/firestore');
  await t('Veli KENDİ çocuğunu okur', getDoc(doc(veli, 'kids/K1')), true);
  await t('Veli çocuklarını sorgular (array-contains)', getDocs(query(collection(veli, 'kids'), where('guardianNos', 'array-contains', '92026001'))), true);
  await t('Veli BAŞKA çocuğu okuyamaz', getDoc(doc(veli, 'kids/K2')), false);
  await t('Veli tüm çocuk listesini okuyamaz', getDocs(collection(veli, 'kids')), false);
  await t('Veli çocuğunun yoklamasını okur', getDocs(query(collection(veli, 'kidAttendance'), where('guardianNos', 'array-contains', '92026001'))), true);
  await t('Veli başka çocuğun yoklamasını okuyamaz', getDoc(doc(veli, 'kidAttendance/A2')), false);
  await t('Veli yoklama YAZAMAZ', addDoc(collection(veli, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'] }), false);
  await t('Veli teslim listesini günceller', updateDoc(doc(veli, 'kids/K1'), { pickups: ['Dayî'] }), true);
  await t('Veli çocuğa başka veli EKLEYEMEZ', updateDoc(doc(veli, 'kids/K1'), { guardianNos: arrayUnion('99999999') }), false);
  await t('Veli yetişkin öğrencileri OKUYAMAZ', getDocs(collection(veli, 'students')), false);
  await t('Veli yetişkin mesajlarını OKUYAMAZ', getDocs(collection(veli, 'messages')), false);
  await t('Veli program ve duyuru okur', getDocs(collection(veli, 'kidSchedule')), true);
  await t('Veli mesaj gönderir', addDoc(collection(veli, 'kidMessages'), { guardianNo: '92026001', text: 'Silav', from: 'guardian', read: false }), true);
  await t('Veli başka veli adına mesaj yazamaz', addDoc(collection(veli, 'kidMessages'), { guardianNo: '92026002', text: 'x', from: 'guardian' }), false);
  await t('Veli başkasının mesajını okuyamaz', getDoc(doc(veli, 'kidMessages/M1')), false);
  await t('Sahte veli çocukları OKUYAMAZ', getDocs(query(collection(fakeVeli, 'kids'), where('guardianNos', 'array-contains', '99999999'))), false);
  await t('Sahte veli program okuyamaz', getDocs(collection(fakeVeli, 'kidSchedule')), false);
  await t('Bağlanmamış akademi öğretmeni çocuk yoklaması YAZAMAZ', addDoc(collection(teacher, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' }), false);
  await t('Bağlanmamış akademi öğretmeni çocukları OKUYAMAZ', getDocs(collection(teacher, 'kids')), false);
  const linkedT = as('21202601@ogretmen.aat');
  await t('Çocuk akademisine bağlı akademi öğretmeni yoklama yazar', addDoc(collection(linkedT, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' }), true);
  await t('Çocuk akademisine bağlı akademi öğretmeni çocukları okur', getDocs(collection(linkedT, 'kids')), true);
  await t('Öğretmen çocuk kaydı AÇAMAZ (yalnız yönetici)', setDoc(doc(teacher, 'kids/K9'), { no: '1', guardianNos: [] }), false);
  await t('Yönetici çocuk + veli kaydı açar', setDoc(doc(admin, 'kids/K9'), { no: '82026009', guardianNos: ['92026009'] }), true);
  await t('Site veli başvurusu gönderir', addDoc(collection(anon, 'kidApplications'), { kidName: 'Zarok', guardianName: 'Veli', phone: '05', consentKvkk: true, status: 'new' }), true);
  await t('Site KVKK onaysız başvuru gönderemez', addDoc(collection(anon, 'kidApplications'), { kidName: 'Zarok', guardianName: 'Veli', phone: '05', consentKvkk: false, status: 'new' }), false);
  await t('Site başvuruya fazladan alan ekleyemez', addDoc(collection(anon, 'kidApplications'), { kidName: 'Zarok', guardianName: 'Veli', phone: '05', consentKvkk: true, status: 'accepted' }), false);
  await t('Site veli başvurularını okuyamaz', getDocs(collection(anon, 'kidApplications')), false);
  // Zarok öğretmeni
  const kt = as('72026001@zmamoste.aat'), fakeKt = as('79999999@zmamoste.aat');
  await t('Çocuk öğretmeni çocukları okur', getDocs(collection(kt, 'kids')), true);
  await t('Çocuk öğretmeni veli iletişimini okur', getDoc(doc(kt, 'guardians/92026001')), true);
  await t('Çocuk öğretmeni yoklama yazar', addDoc(collection(kt, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' }), true);
  await t('Çocuk öğretmeni duyuru gönderir', addDoc(collection(kt, 'kidAnnouncements'), { title: 'x' }), true);
  await t('Çocuk öğretmeni veliye yanıt yazar', addDoc(collection(kt, 'kidMessages'), { guardianNo: '92026001', text: 'y', from: 'staff' }), true);
  await t('Çocuk öğretmeni yetişkin öğrencileri OKUYAMAZ', getDocs(collection(kt, 'students')), false);
  await t('Çocuk öğretmeni yetişkin mesajlarını OKUYAMAZ', getDocs(collection(kt, 'messages')), false);
  await t('Çocuk öğretmeni çocuk kaydı AÇAMAZ', setDoc(doc(kt, 'kids/K8'), { no: '1', guardianNos: [] }), false);
  await t('Çocuk öğretmeni öğretmen ekleyemez', setDoc(doc(kt, 'kidTeachers/7'), { no: '7' }), false);
  await t('Çocuk öğretmeni program DEĞİŞTİREMEZ', addDoc(collection(kt, 'kidSchedule'), { x: 1 }), false);
  await t('Sahte çocuk öğretmeni çocukları OKUYAMAZ', getDocs(collection(fakeKt, 'kids')), false);
  await t('Yönetici çocuk öğretmeni ekler', setDoc(doc(admin, 'kidTeachers/72026002'), { no: '72026002' }), true);
  await t('Zarok haberleri herkese açık', getDoc(doc(anon, 'kidNews/KN1')), true);
  await t('Girişsiz haber YAZAMAZ', addDoc(collection(anon, 'kidNews'), { title: 'x' }), false);
  await t('Öğretmen Zarok haberi YAZAMAZ (yalnız basın)', addDoc(collection(teacher, 'kidArchive'), { year: 2020 }), false);
  await t('Veli haber YAZAMAZ', addDoc(collection(veli, 'kidNews'), { title: 'x' }), false);
  // ── v5: rol ayrımı / yetki yükseltme ──
  const press = as('99202601@ogretmen.aat'), reg = as('98202601@ogretmen.aat');
  await t('Basın kendini dizinde YÖNETİCİ yapamaz', setDoc(doc(press, 'idx_staff/99202601'), { no: '99202601', lvl: 'admin' }), false);
  await t('Basın öğretmen EKLEYEMEZ', setDoc(doc(press, 'teachers/TX'), { no: '13202601', name: 'x' }), false);
  await t('Basın öğrenci SİLEMEZ', deleteDoc(doc(press, 'students/S2')), false);
  await t('Basın öğrenci EKLEYEMEZ', setDoc(doc(press, 'students/SX'), { no: '1', name: 'x' }), false);
  await t('Basın başvuruları OKUYAMAZ', getDocs(collection(press, 'applications')), false);
  await t('Basın veli başvurularını OKUYAMAZ', getDocs(collection(press, 'kidApplications')), false);
  await t('Basın çocuk kayıtlarını OKUYAMAZ', getDocs(collection(press, 'kids')), false);
  await t('Basın site haberi yazar', addDoc(collection(press, 'news'), { title: 'x' }), true);
  await t('Basın site arşivi yazar', addDoc(collection(press, 'archive'), { year: 2010 }), true);
  await t('Basın Zarok haberi yazar', addDoc(collection(press, 'kidNews'), { title: 'x' }), true);
  await t('Basın Zarok arşivi yazar', addDoc(collection(press, 'kidArchive'), { year: 2020 }), true);
  await t('Öğretmen site haberi YAZAMAZ', addDoc(collection(teacher, 'news'), { title: 'x' }), false);
  await t('Öğretmen başvuruları OKUYAMAZ', getDocs(collection(teacher, 'applications')), false);
  await t('Öğretmen başvuru dönemini DEĞİŞTİREMEZ', setDoc(doc(teacher, 'config/applications'), { open: false }), false);
  await t('Öğretmen öğrenci ekler', setDoc(doc(teacher, 'students/S9'), { no: '11202609', name: 'Yeni' }), true);
  await t('Öğretmen öğrenci SİLEMEZ', deleteDoc(doc(teacher, 'students/S2')), false);
  await t('Öğretmen öğrencinin bursunu DEĞİŞTİREMEZ', updateDoc(doc(teacher, 'students/S2'), { burs: '%100' }), false);
  await t('Öğrenci işleri kendini YÖNETİCİ yapamaz', setDoc(doc(reg, 'idx_staff/98202601'), { no: '98202601', lvl: 'admin' }), false);
  await t('Öğrenci işleri başkasını BASIN yapamaz', setDoc(doc(reg, 'idx_staff/11202601'), { no: '11202601', lvl: 'press' }), false);
  await t('Öğrenci işleri yönetici kaydını SİLEMEZ', deleteDoc(doc(reg, 'idx_staff/1000')), false);
  await t('Öğrenci işleri öğretmen dizinine yazar', setDoc(doc(reg, 'idx_staff/13202601'), { no: '13202601', lvl: 'teacher' }), true);
  await t('Öğrenci işleri özel kart (isAdmin) AÇAMAZ', setDoc(doc(reg, 'teachers/TY'), { no: '13202602', name: 'x', isAdmin: true }), false);
  await t('Öğrenci işleri basın kartını DEĞİŞTİREMEZ', updateDoc(doc(reg, 'teachers/TP'), { name: 'y' }), false);
  await t('Öğrenci işleri öğretmen ekler', setDoc(doc(reg, 'teachers/TZ'), { no: '13202601', name: 'Mamoste' }), true);
  await t('Öğrenci işleri öğrenci bursunu düzenler', updateDoc(doc(reg, 'students/S2'), { burs: '%50' }), true);
  await t('Öğrenci işleri başvuruları okur', getDocs(collection(reg, 'applications')), true);
  await t('Öğrenci işleri çocuk kaydı açar', setDoc(doc(reg, 'kids/K7'), { no: '82026007', guardianNos: ['92026001'] }), true);
  await t('Öğrenci işleri Zarok haberi YAZAMAZ (basının işi)', addDoc(collection(reg, 'kidNews'), { title: 'x' }), false);
  await t('Site çocuk başvurusu istenen belgelerini okur', getDocs(collection(anon, 'kidApplicationTemplates')), true);
  await t('Girişsiz istenen belge YAZAMAZ', addDoc(collection(anon, 'kidApplicationTemplates'), { name: 'x' }), false);
  await t('Öğretmen istenen belge YAZAMAZ', addDoc(collection(teacher, 'kidApplicationTemplates'), { name: 'x' }), false);
  await t('Öğrenci işleri istenen belge tanımlar', addDoc(collection(reg, 'kidApplicationTemplates'), { name: 'Nasname' }), true);
  // Mesaj gizliliği
  await t('Öğrenci KENDİNE gelen özel mesajları sorgular', getDocs(query(collection(student, 'messages'), where('recipientNo', '==', '10202601'))), true);
  await t('Öğrenci BAŞKASININ özel mesajını okuyamaz', getDoc(doc(student, 'messages/M3')), false);
  await t('Öğrenci toplu öğrenci mesajlarını sorgular', getDocs(query(collection(student, 'messages'), where('recipientGroup', 'in', ['allStudents', 'all', 'area_sinema']))), true);
  await t('Öğrenci öğretmenlere yönelik toplu mesajı okuyamaz', getDoc(doc(student, 'messages/M5')), false);
  await t('Öğrenci tüm mesajları listeleyemez', getDocs(collection(student, 'messages')), false);
  await t('Öğrenci yönetime geri bildirim gönderir', addDoc(collection(student, 'messages'), { fromType: 'student', toRole: 'admin', subject: 's', body: 'b' }), true);
  await t('Öğrenci YÖNETİCİ adına toplu mesaj gönderemez', addDoc(collection(student, 'messages'), { fromType: 'admin', senderId: 'admin', recipientGroup: 'allStudents', subject: 'Şifrenizi girin', body: 'x' }), false);
  await t('Öğrenci başka öğrencinin mesajını SİLEMEZ', deleteDoc(doc(student, 'messages/M3')), false);
  await t('Öğrenci kendi mesajını okundu işaretler', updateDoc(doc(student, 'messages/M2'), { read: true }), true);
  await t('Öğrenci KENDİ anket yanıtını yazar', setDoc(doc(student, 'studentSurveyResponses/R1'), { studentNo: '10202601', answers: {} }), true);
  await t('Öğrenci başkasının anket yanıtını OKUYAMAZ', getDoc(doc(student, 'studentSurveyResponses/R2')), false);
  await t('Öğrenci başkası adına anket yanıtı YAZAMAZ', setDoc(doc(student, 'studentSurveyResponses/R3'), { studentNo: '10202602', answers: {} }), false);
  await t('Öğrenci başkasının cihaz kaydını DEĞİŞTİREMEZ', setDoc(doc(student, 'devices/10202602'), { no: 'x' }), false);
  await t('Öğrenci kendi cihaz kaydını yazar', setDoc(doc(student, 'devices/10202601'), { no: '10202601' }), true);
  await t('Öğrenci başkalarının istatistiklerini OKUYAMAZ', getDocs(collection(student, 'studentStats')), false);
  // Site
  await t('Site haberleri herkese açık', getDoc(doc(anon, 'news/N1')), true);
  await t('Site başvuru gönderir (dönem açık)', addDoc(collection(anon, 'applications'), { name: 'A', phone: '1', status: 'new', docs: [] }), true);
  await t('Site başvuru okuyamaz', getDocs(collection(anon, 'applications')), false);
  // Storage
  const st = e => env.authenticatedContext('uid-' + e, { email: e }).storage();
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  await t('Storage: sahte personel haber medyası YÜKLEYEMEZ', uploadString(ref(st('9999@ogretmen.aat'), 'news/x.png'), png, 'data_url'), false);
  await t('Storage: öğretmen haber medyası YÜKLEYEMEZ (yalnız basın)', uploadString(ref(st('11202601@ogretmen.aat'), 'news/x.png'), png, 'data_url'), false);
  await t('Storage: basın haber medyası yükler', uploadString(ref(st('99202601@ogretmen.aat'), 'news/x.png'), png, 'data_url'), true);
  await t('Storage: basın HTML dosyası yükleyemez', uploadString(ref(st('99202601@ogretmen.aat'), 'news/x.html'), 'data:text/html;base64,PHNjcmlwdD4=', 'data_url'), false);
  await t('Storage: basın SVG yükleyemez', uploadString(ref(st('99202601@ogretmen.aat'), 'news/x.svg'), 'data:image/svg+xml;base64,PHN2Zz4=', 'data_url'), false);
  await t('Storage: öğrenci profil fotoğrafı yükler', uploadString(ref(st('10202601@ogrenci.aat'), 'photos/students/S1.jpg'), png, 'data_url'), true);
  await t('Storage: öğrenci BAŞKASININ fotoğrafını yükleyemez', uploadString(ref(st('10202601@ogrenci.aat'), 'photos/students/S2.jpg'), png, 'data_url'), false);
  await t('Storage: basın Zarok haber görseli yükler', uploadString(ref(st('99202601@ogretmen.aat'), 'kid-news/a.png'), png, 'data_url'), true);
  await t('Storage: öğretmen Zarok haber görseli YÜKLEYEMEZ', uploadString(ref(st('11202601@ogretmen.aat'), 'kid-news/c.png'), png, 'data_url'), false);
  await t('Storage: girişsiz Zarok haber görseli yükleyemez', uploadString(ref(env.unauthenticatedContext().storage(), 'kid-news/b.png'), png, 'data_url'), false);
  await t('Storage: veli başvuru belgesi yükler', uploadString(ref(env.unauthenticatedContext().storage(), 'zarok-applications/a.pdf'), 'data:application/pdf;base64,JVBERi0=', 'data_url'), true);
  await t('Storage: öğretmen KENDİ fotoğrafını yükler', uploadString(ref(st('11202601@ogretmen.aat'), 'photos/teachers/T2.jpg'), png, 'data_url'), true);
  await t('Storage: öğretmen yöneticinin fotoğrafını DEĞİŞTİREMEZ', uploadString(ref(st('11202601@ogretmen.aat'), 'photos/teachers/T1.jpg'), png, 'data_url'), false);
  await t('Storage: sahte öğrenci foto YÜKLEYEMEZ', uploadString(ref(st('7777@ogrenci.aat'), 'photos/students/S1.jpg'), png, 'data_url'), false);
  await t('Storage: girişsiz başvuru PDF yükler', uploadString(ref(env.unauthenticatedContext().storage(), 'applications/a.pdf'), 'data:application/pdf;base64,JVBERi0=', 'data_url'), true);
  await t('Storage: girişsiz başvuru EXE yükleyemez', uploadString(ref(env.unauthenticatedContext().storage(), 'applications/a.exe'), 'data:application/octet-stream;base64,TVo=', 'data_url'), false);
  console.log(results.join('\n'));
  console.log(results.filter(r => r.startsWith('❌')).length + ' başarısız / ' + results.length);
  await env.cleanup();
  process.exit(0);
})();
