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
  await t('Öğretmen çocuk yoklaması yazar', addDoc(collection(teacher, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' }), true);
  await t('Öğretmen çocuk kaydı AÇAMAZ (yalnız yönetici)', setDoc(doc(teacher, 'kids/K9'), { no: '1', guardianNos: [] }), false);
  await t('Yönetici çocuk + veli kaydı açar', setDoc(doc(admin, 'kids/K9'), { no: '82026009', guardianNos: ['92026009'] }), true);
  await t('Site veli başvurusu gönderir', addDoc(collection(anon, 'kidApplications'), { kidName: 'Zarok', guardianName: 'Veli', phone: '05', consentKvkk: true, status: 'new' }), true);
  await t('Site KVKK onaysız başvuru gönderemez', addDoc(collection(anon, 'kidApplications'), { kidName: 'Zarok', guardianName: 'Veli', phone: '05', consentKvkk: false, status: 'new' }), false);
  await t('Site başvuruya fazladan alan ekleyemez', addDoc(collection(anon, 'kidApplications'), { kidName: 'Zarok', guardianName: 'Veli', phone: '05', consentKvkk: true, status: 'accepted' }), false);
  await t('Site veli başvurularını okuyamaz', getDocs(collection(anon, 'kidApplications')), false);
  // Site
  await t('Site haberleri herkese açık', getDoc(doc(anon, 'news/N1')), true);
  await t('Site başvuru gönderir (dönem açık)', addDoc(collection(anon, 'applications'), { name: 'A', phone: '1', status: 'new', docs: [] }), true);
  await t('Site başvuru okuyamaz', getDocs(collection(anon, 'applications')), false);
  // Storage
  const st = e => env.authenticatedContext('uid-' + e, { email: e }).storage();
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  await t('Storage: sahte personel haber medyası YÜKLEYEMEZ', uploadString(ref(st('9999@ogretmen.aat'), 'news/x.png'), png, 'data_url'), false);
  await t('Storage: öğretmen haber medyası yükler', uploadString(ref(st('11202601@ogretmen.aat'), 'news/x.png'), png, 'data_url'), true);
  await t('Storage: öğrenci profil fotoğrafı yükler', uploadString(ref(st('10202601@ogrenci.aat'), 'photos/students/S1.jpg'), png, 'data_url'), true);
  await t('Storage: öğrenci BAŞKASININ fotoğrafını yükleyemez', uploadString(ref(st('10202601@ogrenci.aat'), 'photos/students/S2.jpg'), png, 'data_url'), false);
  await t('Storage: veli başvuru belgesi yükler', uploadString(ref(env.unauthenticatedContext().storage(), 'zarok-applications/a.pdf'), 'data:application/pdf;base64,JVBERi0=', 'data_url'), true);
  await t('Storage: sahte öğrenci foto YÜKLEYEMEZ', uploadString(ref(st('7777@ogrenci.aat'), 'photos/students/S1.jpg'), png, 'data_url'), false);
  await t('Storage: girişsiz başvuru PDF yükler', uploadString(ref(env.unauthenticatedContext().storage(), 'applications/a.pdf'), 'data:application/pdf;base64,JVBERi0=', 'data_url'), true);
  await t('Storage: girişsiz başvuru EXE yükleyemez', uploadString(ref(env.unauthenticatedContext().storage(), 'applications/a.exe'), 'data:application/octet-stream;base64,TVo=', 'data_url'), false);
  console.log(results.join('\n'));
  console.log(results.filter(r => r.startsWith('❌')).length + ' başarısız / ' + results.length);
  await env.cleanup();
  process.exit(0);
})();
