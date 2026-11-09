// Güvenlik kuralı testleri (Firestore + Storage emülatörü). Çalıştırma:
//   cd tools && npm install && npm run kural-testi     (Java 11+ gerekir)
const fs = require('fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc, deleteField } = require('firebase/firestore');
const { ref, uploadString, uploadBytes, getBytes, listAll } = require('firebase/storage');

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
    await setDoc(doc(db, 'idx_students/10202601'), { no: '10202601', area: 'sinema' });
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
    await setDoc(doc(db, 'messages/MA1'), { recipientGroup: 'area_sinema', recipientNo: null, subject: 'sinema duyurusu' });
    await setDoc(doc(db, 'messages/MA2'), { recipientGroup: 'area_muzik', recipientNo: null, subject: 'müzik duyurusu' });
    await setDoc(doc(db, 'messages/M5'), { recipientGroup: 'allTeachers', recipientNo: null, subject: 'öğretmenlere' });
    await setDoc(doc(db, 'studentSurveyResponses/R2'), { studentNo: '10202602', answers: {} });
    await setDoc(doc(db, 'applications/AP1'), { name: 'Başvuran', phone: '1', status: 'new' });
    await setDoc(doc(db, 'devices/10202602'), { no: '10202602' });
    // Kartlar + kapı güvenliği
    await setDoc(doc(db, 'idx_staff/97202601'), { no: '97202601', lvl: 'gate' });
    await setDoc(doc(db, 'teachers/TG'), { no: '97202601', name: 'Ewlehî', isGate: true });
    await setDoc(doc(db, 'cards/' + 'a'.repeat(32)), { kind: 'student', no: '10202601', ref: 'S1', name: 'Xwendekar', active: true });
    await setDoc(doc(db, 'cards/' + 'b'.repeat(32)), { kind: 'kid', no: '82026001', ref: 'K1', name: 'Zarok A', active: true });
    await setDoc(doc(db, 'cards/' + 'c'.repeat(32)), { kind: 'student', no: '10202602', ref: 'S2', name: 'Din', active: false });
    await setDoc(doc(db, 'gateLog/G1'), { by: '11202601', ok: true, date: '2026-09-27' });
    // Bölüm sorumlusu (Tiyatro)
    await setDoc(doc(db, 'idx_staff/96202601'), { no: '96202601', lvl: 'head', area: 'tiyatro' });
    await setDoc(doc(db, 'teachers/TH'), { no: '96202601', name: 'Berpirs', isHead: true, area: 'tiyatro' });
    await setDoc(doc(db, 'announcements/AH1'), { title: 'x', senderRole: 'head', senderNo: '96202601', senderArea: 'tiyatro', targets: ['tiyatro'] });
    await setDoc(doc(db, 'announcements/AT1'), { title: 'öğretmenin', senderRole: 'teacher', targets: ['muzik'] });
    await setDoc(doc(db, 'messages/MH1'), { toRole: 'head', toArea: 'tiyatro', fromType: 'student', subject: 's', read: false });
    await setDoc(doc(db, 'messages/MH2'), { toRole: 'head', toArea: 'tiyatro', fromType: 'student', fromNo: '10202601', subject: 'cevap bekliyor' });
    await setDoc(doc(db, 'messages/MH3'), { toRole: 'head', toArea: 'muzik', fromType: 'student', fromNo: '10202602', subject: 'başka bölüm' });
    // Genel sorumlu + çocuk akademisi (Drama) sorumlusu
    await setDoc(doc(db, 'idx_staff/96202602'), { no: '96202602', lvl: 'head', area: 'genel' });
    await setDoc(doc(db, 'idx_staff/96202603'), { no: '96202603', lvl: 'head', area: 'drama' });
    await setDoc(doc(db, 'kids/K3'), { no: '82026003', name: 'Zarok D', area: 'drama', guardianNos: ['92026001'] });
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
  await t('Öğretmen alan geneline duyuru YAZAMAZ (yalnız sınıfına)', addDoc(collection(teacher, 'announcements'), { t: 1 }), false);
  await t('Basın/öğrenci işleri duyuru yazar', addDoc(collection(as('98202601@ogretmen.aat'), 'announcements'), { t: 1 }), true);
  await t('Öğrenci kendi kaydını sorgular (no==)', getDocs(query(collection(student, 'students'), where('no', '==', '10202601'))), true);
  await t('Öğrenci başka öğrenciyi OKUYAMAZ', getDoc(doc(student, 'students/S2')), false);
  await t('Öğrenci tüm listeyi OKUYAMAZ', getDocs(collection(student, 'students')), false);
  await t('Öğrenci kendi telefonunu düzenler', updateDoc(doc(student, 'students/S1'), { phone: '555' }), true);
  await t('Öğrenci kendi ALANINI değiştiremez', updateDoc(doc(student, 'students/S1'), { area: 'muzik' }), false);
  await t('Öğrenci program okur', getDocs(collection(student, 'schedule')), true);
  // QR yoklama: oturum açık + süresi dolmamış + dönen kod geçerli olmalı; ders/tarih oturumla aynı
  const now = Date.now();
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    await setDoc(doc(db, 'qrSessions/s1'), { lessonId: 'L1', lessonDate: '2026-11-02', openedAtMs: now, expiresAt: now + 3600000, active: true });
    await setDoc(doc(db, 'qrCodes/s1'), { codes: ['ABC123'] });
    await setDoc(doc(db, 'qrSessions/s2'), { lessonId: 'L1', lessonDate: '2026-11-02', openedAtMs: now, expiresAt: now + 3600000, active: false });
    await setDoc(doc(db, 'qrCodes/s2'), { codes: ['ABC123'] });
    await setDoc(doc(db, 'qrSessions/s3'), { lessonId: 'L1', lessonDate: '2026-11-02', openedAtMs: now - 7200000, expiresAt: now - 60000, active: true });
    await setDoc(doc(db, 'qrCodes/s3'), { codes: ['ABC123'] });
    await setDoc(doc(db, 'qrSessions/s4'), { lessonId: 'L1', lessonDate: '2026-11-02', openedAtMs: now - 1800000, expiresAt: now + 3600000, active: true });
    await setDoc(doc(db, 'qrCodes/s4'), { codes: ['ABC123'] });
    await setDoc(doc(db, 'attendance/s0_S2'), { sessionId: 's0', studentNo: '10202602', studentId: 'S2' });
    await setDoc(doc(db, 'studentAtt/L1-2026-11-02-10202601'), { studentNo: '10202601', lessonId: 'L1', lessonFire: 'L1', lessonName: 'Ders', area: 'sinema', date: '2026-11-02', status: 'off' });
    await setDoc(doc(db, 'studentAtt/L1-2026-11-02-10202602'), { studentNo: '10202602', lessonId: 'L1', lessonFire: 'L1', lessonName: 'Ders', area: 'sinema', date: '2026-11-02', status: 'off' });
    await setDoc(doc(db, 'studentAtt/L1-2026-11-03-10202601'), { studentNo: '10202601', lessonId: 'L1', lessonFire: 'L1', lessonName: 'Ders', area: 'sinema', date: '2026-11-03', status: 'on' });
    await setDoc(doc(db, 'attendance/sx_DEL'), { sessionId: 'sx', studentNo: '10202602', studentId: 'S2' });
    await setDoc(doc(db, 'attendance/L1-2026-11-02'), { lessonId: 'L1', date: '2026-11-02', records: { S2: 'on' } });
  });
  const ci = (sid, o = {}) => ({ sessionId: sid, studentId: 'S1', studentFire: 'S1', studentName: 'X', studentNo: '10202601', qrLessonId: 'L1', qrDate: '2026-11-02',
    time: 't', late: false, teacherName: 'M', lessonName: 'D', area: 'sinema', code: 'ABC123', ...o });
  await t('Öğrenci KENDİ yoklamasını yazar (QR, geçerli kod)', setDoc(doc(student, 'attendance/s1_S1'), ci('s1')), true);
  await t('Öğrenci aynı QR\'ı tekrar okutabilir', setDoc(doc(student, 'attendance/s1_S1'), ci('s1'), { merge: true }), true);
  await t('QR: YANLIŞ kodla yoklama verilemez (eve gönderilen fotoğraf)', setDoc(doc(student, 'attendance/s1_S1b'), ci('s1', { code: 'ZZZ999' })), false);
  await t('QR: kapalı oturuma yoklama verilemez', setDoc(doc(student, 'attendance/s2_S1'), ci('s2')), false);
  await t('QR: süresi dolmuş oturuma yoklama verilemez', setDoc(doc(student, 'attendance/s3_S1'), ci('s3')), false);
  await t('QR: olmayan oturuma yoklama verilemez', setDoc(doc(student, 'attendance/s9_S1'), ci('s9')), false);
  await t('QR: belge kimliği oturumla eşleşmeli', setDoc(doc(student, 'attendance/s4_S1'), ci('s1')), false);
  await t('QR: başka derse/tarihe yazamaz', setDoc(doc(student, 'attendance/s1_S1c'), ci('s1', { qrLessonId: 'L2' })), false);
  await t('QR: 30. dakikada "zamanında" yazamaz', setDoc(doc(student, 'attendance/s4_S1'), ci('s4')), false);
  await t('QR: 30. dakikada "geç" yazar', setDoc(doc(student, 'attendance/s4_S1'), ci('s4', { late: true })), true);
  await t('QR: fazladan alan (records) eklenemez', setDoc(doc(student, 'attendance/s1_S1d'), ci('s1', { records: { S1: 'on' } })), false);
  await t('Öğrenci BAŞKASI adına yoklama yazamaz', setDoc(doc(student, 'attendance/s1_S2'), ci('s1', { studentNo: '10202602', studentId: 'S2' })), false);
  await t('QR: kendi numarasıyla BAŞKASININ öğrenci kimliğine yoklama yazılamaz', setDoc(doc(student, 'attendance/s1_S2'), ci('s1', { studentId: 'S2' })), false);
  await t('QR: başkasının kayıt kimliği (studentFire) kullanılamaz', setDoc(doc(student, 'attendance/s1_S2'), ci('s1', { studentId: 'S2', studentFire: 'S2' })), false);
  await t('QR: studentFire olmadan yoklama verilemez', setDoc(doc(student, 'attendance/s1_S1'), ci('s1', { studentFire: '' })), false);
  await t('Öğrenci kendi kaydında id değiştiremez', updateDoc(doc(student, 'students/S1'), { id: 'S2' }), false);
  await t('Öğrenci eski kaydına fireId (KENDİ belge kimliği) ekleyebilir', updateDoc(doc(student, 'students/S1'), { fireId: 'S1' }), true);
  await t('Öğrenci kendi kaydından id alanını kaldırabilir (uygulama kaydı)', updateDoc(doc(student, 'students/S1'), { id: deleteField() }), true);
  await t('Öğretmen kendi kaydında id değiştiremez', updateDoc(doc(teacher, 'teachers/T2'), { id: 'T1' }), false);
  await t('Öğrenci kendi kaydında fireId değiştiremez', updateDoc(doc(student, 'students/S1'), { fireId: 'S2' }), false);
  await t('Öğrenci DERS yoklama belgesi (records) YAZAMAZ', setDoc(doc(student, 'attendance/L1-2026-11-03'), { lessonId: 'L1', date: '2026-11-03', records: { S1: 'on' } }), false);
  await t('Öğrenci ders yoklamasını DEĞİŞTİREMEZ', updateDoc(doc(student, 'attendance/L1-2026-11-02'), { records: { S1: 'on', S2: 'off' } }), false);
  await t('Öğrenci yoklama SİLEMEZ', deleteDoc(doc(student, 'attendance/s1_S1')), false);
  // Öğrenci devam kaydı + itiraz
  const oD = (x) => ({ studentNo: '10202601', studentName: 'Xwendekar', lessonId: 'L1', lessonFire: 'L1', lessonName: 'Ders', area: 'sinema', date: '2026-11-02', status: 'off', note: 'Ben derstim', createdAt: new Date(), ...(x || {}) });
  await t('Devam: öğrenci KENDİ devam kayıtlarını sorgular', getDocs(query(collection(student, 'studentAtt'), where('studentNo', '==', '10202601'))), true);
  await t('Devam: öğrenci BAŞKASININ devam kaydını OKUYAMAZ', getDoc(doc(student, 'studentAtt/L1-2026-11-02-10202602')), false);
  await t('Devam: öğrenci tüm devam kayıtlarını LİSTELEYEMEZ', getDocs(collection(student, 'studentAtt')), false);
  await t('Devam: öğrenci devam kaydını DEĞİŞTİREMEZ', updateDoc(doc(student, 'studentAtt/L1-2026-11-02-10202601'), { status: 'on' }), false);
  await t('Devam: öğrenci devam kaydı YAZAMAZ', setDoc(doc(student, 'studentAtt/L9-2026-11-02-10202601'), { studentNo: '10202601', status: 'on' }), false);
  await t('Devam: öğretmen devam kaydını OKUR', getDoc(doc(teacher, 'studentAtt/L1-2026-11-02-10202601')), true);
  await t('Devam: öğretmen devam kaydını DEĞİŞTİREMEZ (sunucu yazar)', updateDoc(doc(teacher, 'studentAtt/L1-2026-11-02-10202601'), { status: 'on' }), false);
  await t('İtiraz: öğrenci KENDİ "yok" kaydına notla itiraz eder', setDoc(doc(student, 'attObjections/L1-2026-11-02-10202601'), oD()), true);
  await t('İtiraz: aynı kayda ikinci kez yazamaz (güncelleme yok)', updateDoc(doc(student, 'attObjections/L1-2026-11-02-10202601'), { note: 'yeni not' }), false);
  await t('İtiraz: "katıldı" yazılı kayda itiraz edilemez', setDoc(doc(student, 'attObjections/L1-2026-11-03-10202601'), oD({ date: '2026-11-03', status: 'on' })), false);
  await t('İtiraz: BAŞKASININ kaydına itiraz edilemez', setDoc(doc(student, 'attObjections/L1-2026-11-02-10202602'), oD({ studentNo: '10202602' })), false);
  await t('İtiraz: notsuz itiraz edilemez', setDoc(doc(student, 'attObjections/L1-2026-11-02-10202601'), oD({ note: '' })), false);
  await t('İtiraz: olmayan kayda itiraz edilemez', setDoc(doc(student, 'attObjections/L7-2026-11-02-10202601'), oD({ lessonId: 'L7' })), false);
  await t('İtiraz: öğretmen itirazı okur', getDoc(doc(teacher, 'attObjections/L1-2026-11-02-10202601')), true);
  await t('İtiraz: öğretmen itiraz YAZAMAZ', setDoc(doc(teacher, 'attObjections/L1-2026-11-02-10202602'), oD({ studentNo: '10202602' })), false);
  await t('Öğretmen yoklama kaydı SİLEMEZ', deleteDoc(doc(teacher, 'attendance/s0_S2')), false);
  await t('Öğrenci işleri normal ders yoklama kaydı SİLEMEZ (yalnız atölye)', deleteDoc(doc(as('98202601@ogretmen.aat'), 'attendance/sx_DEL')), false);
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), 'attendance/wsx-2026-11-02'), { lessonId: 'wsx', area: 'genel', classId: 'ws_k1', date: '2026-11-02', records: {} }); });
  await t('Öğrenci işleri atölye yoklama kaydını SİLEMEZ (bölüm sorumlusu siler)', deleteDoc(doc(as('98202601@ogretmen.aat'), 'attendance/wsx-2026-11-02')), false);
  await t('Yönetici yoklama kaydı siler', deleteDoc(doc(admin, 'attendance/sx_DEL')), true);
  await t('Öğrenci KENDİ QR kaydını okur', getDoc(doc(student, 'attendance/s1_S1')), true);
  await t('Öğrenci BAŞKASININ yoklamasını OKUYAMAZ', getDoc(doc(student, 'attendance/s0_S2')), false);
  await t('Öğrenci ders yoklama belgesini OKUYAMAZ', getDoc(doc(student, 'attendance/L1-2026-11-02')), false);
  await t('Öğrenci tüm yoklamayı OKUYAMAZ', getDocs(collection(student, 'attendance')), false);
  await t('Öğrenci geçerli QR kodlarını OKUYAMAZ', getDoc(doc(student, 'qrCodes/s1')), false);
  await t('Öğrenci QR kodu YAZAMAZ', setDoc(doc(student, 'qrCodes/s1'), { codes: ['X'] }), false);
  await t('Öğretmen QR kodlarını yazar', setDoc(doc(teacher, 'qrCodes/s5'), { codes: ['Q1'] }), true);
  await t('Öğretmen yoklamayı okur', getDoc(doc(teacher, 'attendance/s0_S2')), true);
  // Bir telefon, bir derste tek öğrenci: cihaz kaydını ilk yazan sahiplenir
  const student2 = as('10202602@ogrenci.aat');
  await t('Öğrenci derste telefonunu sahiplenir', setDoc(doc(student, 'attendance/s1_d_DEV1'), { sessionId: 's1', studentNo: '10202601', deviceClaim: true }, { merge: true }), true);
  await t('Aynı öğrenci aynı telefondan tekrar okutabilir', setDoc(doc(student, 'attendance/s1_d_DEV1'), { sessionId: 's1', studentNo: '10202601', deviceClaim: true }, { merge: true }), true);
  await t('Başka öğrenci AYNI telefonla aynı derse yoklama veremez', setDoc(doc(student2, 'attendance/s1_d_DEV1'), { sessionId: 's1', studentNo: '10202602', deviceClaim: true }, { merge: true }), false);
  await t('Kapalı oturumda telefon sahiplenilemez', setDoc(doc(student, 'attendance/s2_d_DEV1'), { sessionId: 's2', studentNo: '10202601', deviceClaim: true }), false);
  await t('Öğrenci KENDİ öğrenci kaydını SİLEMEZ', deleteDoc(doc(student, 'students/S1')), false);
  await t('Öğrenci rapor arşivini OKUYAMAZ', getDoc(doc(student, 'config/reportArchive')), false);
  await t('Öğretmen rapor arşivini okur', getDoc(doc(teacher, 'config/reportArchive')), true);
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
  await t('Çocuk öğretmeni genel duyuru gönderemez (yalnız sınıfına)', addDoc(collection(kt, 'kidAnnouncements'), { title: 'x' }), false);
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
  // ── Kartlar + kapı güvenliği ──
  const gate = as('97202601@ogretmen.aat'), TA = 'cards/' + 'a'.repeat(32), TB = 'cards/' + 'b'.repeat(32);
  const today = new Date().toISOString().slice(0, 10);
  await t('Kapı görevlisi kartı anahtarla doğrular', getDoc(doc(gate, TA)), true);
  await t('Kapı görevlisi kartları LİSTELEYEMEZ (tahmin/tarama yok)', getDocs(collection(gate, 'cards')), false);
  await t('Kapı görevlisi öğrencileri OKUYAMAZ', getDocs(collection(gate, 'students')), false);
  await t('Kapı görevlisi öğretmen listesini OKUYAMAZ', getDocs(collection(gate, 'teachers')), false);
  await t('Kapı görevlisi kendi kaydını okur (giriş)', getDocs(query(collection(gate, 'teachers'), where('no', '==', '97202601'))), true);
  await t('Kapı görevlisi mesajları OKUYAMAZ', getDocs(collection(gate, 'messages')), false);
  await t('Kapı görevlisi çocuk kayıtlarını OKUYAMAZ', getDocs(collection(gate, 'kids')), false);
  await t('Kapı görevlisi başvuruları OKUYAMAZ', getDocs(collection(gate, 'applications')), false);
  await t('Kapı görevlisi duyuru YAZAMAZ', addDoc(collection(gate, 'announcements'), { t: 1 }), false);
  await t('Kapı görevlisi kart ÇIKARAMAZ', setDoc(doc(gate, 'cards/' + 'd'.repeat(32)), { kind: 'student', active: true }), false);
  await t('Kapı görevlisi giriş kaydı yazar (kendi adına)', addDoc(collection(gate, 'gateLog'), { token: 'a'.repeat(32), no: '10202601', kind: 'student', name: 'X', ok: true, by: '97202601', byName: 'E', date: today, place: 'gate' }), true);
  await t('Kapı görevlisi BAŞKASI adına kayıt yazamaz', addDoc(collection(gate, 'gateLog'), { token: 'x', ok: true, by: '11202601', date: today, place: 'gate' }), false);
  await t('Giriş kaydına fazladan alan eklenemez', addDoc(collection(gate, 'gateLog'), { token: 'x', ok: true, by: '97202601', date: today, place: 'gate', admin: true }), false);
  await t('Kapı görevlisi kendi bugünkü kayıtlarını okur', getDocs(query(collection(gate, 'gateLog'), where('by', '==', '97202601'), where('date', '==', today))), true);
  await t('Kapı görevlisi başkasının kayıtlarını OKUYAMAZ', getDoc(doc(gate, 'gateLog/G1')), false);
  await t('Giriş kaydı DEĞİŞTİRİLEMEZ', updateDoc(doc(gate, 'gateLog/G1'), { ok: false }), false);
  await t('Öğretmen kartı doğrular (derse giriş)', getDoc(doc(teacher, TA)), true);
  await t('Öğretmen kart ÇIKARAMAZ', setDoc(doc(teacher, 'cards/' + 'e'.repeat(32)), { kind: 'student', active: true }), false);
  await t('Öğrenci kart okuyamaz', getDoc(doc(student, TA)), false);
  await t('Öğrenci kendi kart anahtarını DEĞİŞTİREMEZ', updateDoc(doc(student, 'students/S1'), { cardToken: 'f'.repeat(32) }), false);
  await t('Veli kart okuyamaz', getDoc(doc(veli, TB)), false);
  await t('Girişsiz kart okuyamaz', getDoc(doc(anon, TA)), false);
  await t('Çocuk öğretmeni çocuk kartını doğrular', getDoc(doc(kt, TB)), true);
  await t('Çocuk öğretmeni yetişkin kartını OKUYAMAZ', getDoc(doc(kt, TA)), false);
  await t('Öğrenci işleri kart çıkarır', setDoc(doc(reg, 'cards/' + 'e'.repeat(32)), { kind: 'student', no: '10202602', active: true }), true);
  await t('Öğrenci işleri kartı iptal eder', updateDoc(doc(reg, 'cards/' + 'e'.repeat(32)), { active: false }), true);
  await t('Öğrenci işleri öğrenciye kart anahtarı yazar', updateDoc(doc(reg, 'students/S2'), { cardToken: 'e'.repeat(32) }), true);
  await t('Öğrenci işleri giriş kayıtlarını okur', getDocs(collection(reg, 'gateLog')), true);
  await t('Öğrenci işleri güvenlik kartı (isGate) AÇAMAZ', setDoc(doc(reg, 'teachers/TQ'), { no: '97202699', name: 'x', isGate: true }), false);
  await t('Öğrenci işleri dizine "gate" yazamaz', setDoc(doc(reg, 'idx_staff/97202699'), { no: '97202699', lvl: 'gate' }), false);
  // Mesaj gizliliği
  await t('Öğrenci KENDİNE gelen özel mesajları sorgular', getDocs(query(collection(student, 'messages'), where('recipientNo', '==', '10202601'))), true);
  await t('Öğrenci BAŞKASININ özel mesajını okuyamaz', getDoc(doc(student, 'messages/M3')), false);
  await t('Öğrenci toplu öğrenci mesajlarını sorgular', getDocs(query(collection(student, 'messages'), where('recipientGroup', 'in', ['allStudents', 'all', 'area_sinema']))), true);
  await t('Öğrenci KENDİ bölümünün toplu mesajını okur', getDoc(doc(student, 'messages/MA1')), true);
  await t('Öğrenci BAŞKA bölümün toplu mesajını OKUYAMAZ', getDoc(doc(student, 'messages/MA2')), false);
  await t('Öğrenci başka bölümün toplu mesajlarını SORGULAYAMAZ', getDocs(query(collection(student, 'messages'), where('recipientGroup', 'in', ['allStudents', 'all', 'area_muzik']))), false);
  await t('Öğrenci öğretmenlere yönelik toplu mesajı okuyamaz', getDoc(doc(student, 'messages/M5')), false);
  await t('Öğrenci tüm mesajları listeleyemez', getDocs(collection(student, 'messages')), false);
  await t('Öğrenci yönetime geri bildirim gönderir', addDoc(collection(student, 'messages'), { fromType: 'student', fromNo: '10202601', toRole: 'admin', subject: 's', body: 'b' }), true);
  await t('Öğrenci İSİMSİZ geri bildirim gönderir', addDoc(collection(student, 'messages'), { fromType: 'student', anonymous: true, fromId: null, toRole: 'admin', subject: 's', body: 'b' }), true);
  await t('Öğrenci numarasız + isimsiz OLMAYAN mesaj gönderemez (sahte ad)', addDoc(collection(student, 'messages'), { fromType: 'student', from: 'Başka Öğrenci', toRole: 'admin', subject: 's', body: 'b' }), false);
  await t('Öğrenci BAŞKASININ numarasıyla mesaj gönderemez', addDoc(collection(student, 'messages'), { fromType: 'student', fromNo: '10202602', toRole: 'admin', subject: 's', body: 'b' }), false);
  await t('Öğrenci YÖNETİCİ adına toplu mesaj gönderemez', addDoc(collection(student, 'messages'), { fromType: 'admin', senderId: 'admin', recipientGroup: 'allStudents', subject: 'Şifrenizi girin', body: 'x' }), false);
  await t('Öğrenci başka öğrencinin mesajını SİLEMEZ', deleteDoc(doc(student, 'messages/M3')), false);
  await t('Öğrenci kendi mesajını okundu işaretler', updateDoc(doc(student, 'messages/M2'), { read: true }), true);
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
  // Mesaj / ödev ekleri: attachments/<uid>/…
  const pdf = 'data:application/pdf;base64,JVBERi0=';
  await t('Storage ek: öğrenci KENDİ klasörüne PDF yükler', uploadString(ref(st('10202601@ogrenci.aat'), 'attachments/uid-10202601@ogrenci.aat/a.pdf'), pdf, 'data_url'), true);
  await t('Storage ek: öğretmen Word yükler', uploadString(ref(st('11202601@ogretmen.aat'), 'attachments/uid-11202601@ogretmen.aat/b.docx'), 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEs=', 'data_url'), true);
  await t('Storage ek: öğretmen ses dosyası yükler', uploadString(ref(st('11202601@ogretmen.aat'), 'attachments/uid-11202601@ogretmen.aat/c.mp3'), 'data:audio/mpeg;base64,SUQz', 'data_url'), true);
  await t('Storage ek: BAŞKASININ klasörüne yükleyemez', uploadString(ref(st('10202601@ogrenci.aat'), 'attachments/uid-11202601@ogretmen.aat/x.pdf'), pdf, 'data_url'), false);
  await t('Storage ek: üye BAĞLANTISI bilinen eki okur', getBytes(ref(st('10202601@ogrenci.aat'), 'attachments/uid-11202601@ogretmen.aat/b.docx')), true);
  await t('Storage ek: başkalarının ek klasörü LİSTELENEMEZ', listAll(ref(st('10202601@ogrenci.aat'), 'attachments/uid-11202601@ogretmen.aat')), false);
  await t('Storage: fotoğraf klasörü LİSTELENEMEZ', listAll(ref(st('11202601@ogretmen.aat'), 'photos/students')), false);
  await t('Storage: profil fotoğrafı olarak SVG yüklenemez', uploadString(ref(st('10202601@ogrenci.aat'), 'photos/students/S1.svg'), 'data:image/svg+xml;base64,PHN2Zz4=', 'data_url'), false);
  await t('Storage ek: HTML yüklenemez', uploadString(ref(st('11202601@ogretmen.aat'), 'attachments/uid-11202601@ogretmen.aat/x.html'), 'data:text/html;base64,PHNjcmlwdD4=', 'data_url'), false);
  await t('Storage ek: SVG yüklenemez', uploadString(ref(st('11202601@ogretmen.aat'), 'attachments/uid-11202601@ogretmen.aat/x.svg'), 'data:image/svg+xml;base64,PHN2Zz4=', 'data_url'), false);
  await t('Storage ek: 20 MB üstü yüklenemez', uploadBytes(ref(st('11202601@ogretmen.aat'), 'attachments/uid-11202601@ogretmen.aat/big.pdf'), new Uint8Array(20 * 1024 * 1024 + 10), { contentType: 'application/pdf' }), false);
  await t('Storage ek: sahte personel yükleyemez', uploadString(ref(st('9999@ogretmen.aat'), 'attachments/uid-9999@ogretmen.aat/a.pdf'), pdf, 'data_url'), false);
  await t('Storage ek: veli (çocuk akademisi) yükleyemez', uploadString(ref(st('92026001@veli.aat'), 'attachments/uid-92026001@veli.aat/a.pdf'), pdf, 'data_url'), false);
  await t('Storage ek: girişsiz yükleyemez', uploadString(ref(env.unauthenticatedContext().storage(), 'attachments/x/a.pdf'), pdf, 'data_url'), false);
  await t('Storage ek: öğrenci öğretmenin ekini okur', getBytes(ref(st('10202601@ogrenci.aat'), 'attachments/uid-11202601@ogretmen.aat/b.docx')), true);
  await t('Storage ek: girişsiz okuyamaz', getBytes(ref(env.unauthenticatedContext().storage(), 'attachments/uid-11202601@ogretmen.aat/b.docx')), false);
  await t('Storage: girişsiz başvuru EXE yükleyemez', uploadString(ref(env.unauthenticatedContext().storage(), 'applications/a.exe'), 'data:application/octet-stream;base64,TVo=', 'data_url'), false);
  await env.withSecurityRulesDisabled(async c => { const f = c.firestore(); await setDoc(doc(f, 'messages/MHD1'), { toRole: 'head', toArea: 'tiyatro', subject: 'itiraz', fromType: 'student' }); await setDoc(doc(f, 'messages/MHD2'), { toRole: 'head', toArea: 'muzik', subject: 'x', fromType: 'student' }); await setDoc(doc(f, 'messages/MHD3'), { recipientNo: '96202601', subject: 'y' }); });
  await t('Mesaj: tiyatro sorumlusu kendi bölümüne gelen itiraz mesajını siler', deleteDoc(doc(as('96202601@ogretmen.aat'), 'messages/MHD1')), true);
  await t('Mesaj: sorumlu kendisine yazılan mesajı siler', deleteDoc(doc(as('96202601@ogretmen.aat'), 'messages/MHD3')), true);
  await t('Mesaj: tiyatro sorumlusu başka bölümün mesajını SİLEMEZ', deleteDoc(doc(as('96202601@ogretmen.aat'), 'messages/MHD2')), false);
  // Sınıflar (ana akademi + çocuk akademisi)
  const cReg = as('98202601@ogretmen.aat'), cTch = as('11202601@ogretmen.aat'), cStu = as('10202601@ogrenci.aat'), cVel = as('92026001@veli.aat'), cKidT = as('72026001@zmamoste.aat');
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), 'classes/muzik_1'), { kind: 'area', area: 'muzik', level: 1, teacherNos: [], teacherNames: [] }); });
  await t('Sınıf: öğrenci işleri bölüm sınıfı YAZAMAZ (sınıflar bölüm sorumlusunda)', setDoc(doc(cReg, 'classes/muzik_1'), { kind: 'area', area: 'muzik', level: 1, teacherNos: ['11202601'], teacherNames: ['Mamoste'] }), false);
  await t('Sınıf: öğrenci işleri atölye AÇAMAZ (atölye bölüm sorumlusunda)', setDoc(doc(cReg, 'classes/ws_k1'), { kind: 'workshop', area: 'genel', name: 'Atölye', studentNos: [], teacherNos: [] }), false);
  await t('Sınıf: yönetici sınıf yazar', setDoc(doc(admin, 'classes/muzik_1'), { kind: 'area', area: 'muzik', level: 1, teacherNos: ['11202601'], teacherNames: ['Mamoste'] }), true);
  const bhd = as('96202601@ogretmen.aat'), ghd = as('96202602@ogretmen.aat');
  await t('Sınıf: tiyatro sorumlusu KENDİ bölümüne sınıf açar', setDoc(doc(bhd, 'classes/tiyatro_1'), { kind: 'area', area: 'tiyatro', name: '1', studentNos: [], teacherNos: ['11202601'], teacherNames: ['M'] }), true);
  await t('Sınıf: tiyatro sorumlusu BAŞKA bölüme sınıf açamaz', setDoc(doc(bhd, 'classes/muzik_9'), { kind: 'area', area: 'muzik', name: '9', studentNos: [] }), false);
  await t('Sınıf: tiyatro sorumlusu KENDİ bölümünde atölye işaretli sınıf açar', setDoc(doc(bhd, 'classes/ws_t1'), { kind: 'area', workshop: true, area: 'tiyatro', name: 'At', studentNos: [], teacherNos: [] }), true);
  await t('Sınıf: tiyatro sorumlusu başka bölümün atölye sınıfını AÇAMAZ', setDoc(doc(bhd, 'classes/ws_m1'), { kind: 'area', workshop: true, area: 'muzik', name: 'At', studentNos: [], teacherNos: [] }), false);
  await t('Sınıf: genel sorumlu atölye AÇAMAZ', setDoc(doc(ghd, 'classes/ws_g1'), { kind: 'workshop', area: 'genel', name: 'At', studentNos: [], teacherNos: [] }), false);
  await t('Sınıf: tiyatro sorumlusu genel sınıf AÇAMAZ', setDoc(doc(bhd, 'classes/gen_1'), { kind: 'general', area: 'genel', name: 'G', studentNos: [] }), false);
  await t('Sınıf: tiyatro sorumlusu başka bölümün sınıfını DEĞİŞTİREMEZ', updateDoc(doc(bhd, 'classes/muzik_1'), { teacherNos: [] }), false);
  await t('Sınıf: tiyatro sorumlusu kendi sınıfını siler', deleteDoc(doc(bhd, 'classes/tiyatro_1')), true);
  await t('Sınıf: genel sorumlu genel sınıf açar', setDoc(doc(ghd, 'classes/gen_1'), { kind: 'general', area: 'genel', name: 'G', studentNos: [] }), true);
  await t('Sınıf: genel sorumlu bölüm sınıfına DOKUNAMAZ (yalnız genel sınıf)', updateDoc(doc(ghd, 'classes/muzik_1'), { teacherNos: ['11202601'] }), false);
  await t('Sınıf: öğretmen sınıf YAZAMAZ (kayıtlı sınıfa dokunamaz)', updateDoc(doc(cTch, 'classes/muzik_1'), { teacherNos: [] }), false);
  await t('Sınıf: öğretmen sınıfları okur', getDocs(collection(cTch, 'classes')), true);
  await t('Sınıf: öğrenci sınıf öğretmenini okur', getDoc(doc(cStu, 'classes/muzik_1')), true);
  await t('Sınıf: öğretmen sınıf YAZAMAZ', setDoc(doc(cTch, 'classes/muzik_1'), { teacherNos: [] }), false);
  await t('Sınıf: öğrenci sınıf YAZAMAZ', setDoc(doc(cStu, 'classes/muzik_2'), { teacherNos: ['x'] }), false);
  await t('Sınıf: öğrenci KENDİ sınıfını değiştiremez', updateDoc(doc(cStu, 'students/S1'), { classLevel: 4 }), false);
  await t('Sınıf: veli akademi sınıflarını OKUYAMAZ', getDocs(collection(cVel, 'classes')), false);
  await t('Sınıf: girişsiz okuyamaz', getDocs(collection(env.unauthenticatedContext().firestore(), 'classes')), false);
  await t('Çocuk sınıfı: öğrenci işleri sınıf YAZAMAZ (sınıflar çocuk bölüm sorumlusunda)', setDoc(doc(cReg, 'kidClasses/L1'), { level: 1, teacherNos: ['72026001'], teacherNames: ['Mamoste Hêvî'] }), false);
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), 'kidClasses/L1'), { level: 1, teacherNos: ['72026001'], teacherNames: ['Mamoste Hêvî'] }); });
  await t('Çocuk sınıfı: veli okur (sınıf öğretmeni adı)', getDoc(doc(cVel, 'kidClasses/L1')), true);
  await t('Çocuk sınıfı: çocuk öğretmeni okur', getDocs(collection(cKidT, 'kidClasses')), true);
  await t('Çocuk sınıfı: veli YAZAMAZ', setDoc(doc(cVel, 'kidClasses/L1'), { teacherNos: [] }), false);
  await t('Çocuk sınıfı: çocuk öğretmeni YAZAMAZ', setDoc(doc(cKidT, 'kidClasses/L2'), { teacherNos: ['72026001'] }), false);
  await t('Çocuk sınıfı: veli çocuğunun sınıfını değiştiremez', updateDoc(doc(cVel, 'kids/K1'), { classLevel: 3 }), false);
  await t('Çocuk sınıfı: öğrenci (yetişkin) okuyamaz', getDocs(collection(cStu, 'kidClasses')), false);
  await t('Çocuk sınıfı: öğrenci işleri çocuğun sınıfını değiştirir', updateDoc(doc(cReg, 'kids/K1'), { classLevel: 2 }), true);
  // Sınıf paylaşımları (duyuru/ödev/belge)
  const cT2 = as('11202601@ogretmen.aat'), cT3 = as('21202601@ogretmen.aat'), cS = as('10202601@ogrenci.aat'), cV = as('92026001@veli.aat'), cKT = as('72026001@zmamoste.aat'), cR = as('98202601@ogretmen.aat');
  const post = (no, cid, x) => ({ classId: cid, area: 'muzik', level: 1, type: 'odev', title: 'Erk', body: '', due: '', files: [], teacherNo: no, teacherName: 'M', createdAt: new Date(), priv: !!(x && 'studentNos' in x), ...(x || {}) });
  await t('Paylaşım: sınıf öğretmeni KENDİ sınıfına ödev gönderir', setDoc(doc(cT2, 'classPosts/P1'), post('11202601', 'muzik_1')), true);
  await t('Paylaşım: öğretmen BAŞKA sınıfa gönderemez', setDoc(doc(cT3, 'classPosts/P2'), post('21202601', 'muzik_1')), false);
  await t('Paylaşım: öğretmen başkası adına gönderemez', setDoc(doc(cT3, 'classPosts/P3'), post('11202601', 'muzik_1')), false);
  await t('Paylaşım: olmayan sınıfa gönderilemez', setDoc(doc(cT2, 'classPosts/P4'), post('11202601', 'sinema_3')), false);
  await t('Paylaşım: geçersiz tür reddedilir', setDoc(doc(cT2, 'classPosts/P5'), post('11202601', 'muzik_1', { type: 'x' })), false);
  await t('Paylaşım: seçilen öğrencilere (studentNos) gönderilir', setDoc(doc(cT2, 'classPosts/P7'), post('11202601', 'muzik_1', { studentNos: ['10202601'] })), true);
  await t('Paylaşım: studentNos liste değilse reddedilir', setDoc(doc(cT2, 'classPosts/P8'), post('11202601', 'muzik_1', { studentNos: '10202601' })), false);
  await t('Paylaşım: boş studentNos reddedilir', setDoc(doc(cT2, 'classPosts/P9'), post('11202601', 'muzik_1', { studentNos: [] })), false);
  await t('Paylaşım: öğrenci okur', getDoc(doc(cS, 'classPosts/P1')), true);
  await t('Paylaşım: seçilen öğrenci kendine gönderileni okur', getDoc(doc(cS, 'classPosts/P7')), true);
  await t('Paylaşım: SEÇİLMEYEN öğrenci özel paylaşımı OKUYAMAZ', getDoc(doc(as('10202602@ogrenci.aat'), 'classPosts/P7')), false);
  await t('Paylaşım: priv işareti yanlışsa reddedilir', setDoc(doc(cT2, 'classPosts/P10'), post('11202601', 'muzik_1', { studentNos: ['10202601'], priv: false })), false);
  await t('Paylaşım: öğrenci sınıf geneli sorgusu (priv==false)', getDocs(query(collection(cS, 'classPosts'), where('classId', 'in', ['muzik_1']), where('priv', '==', false))), true);
  await t('Paylaşım: öğrenci kendine gelenleri sorgular', getDocs(query(collection(cS, 'classPosts'), where('studentNos', 'array-contains', '10202601'))), true);
  await t('Paylaşım: öğrenci TÜM paylaşımları sorgulayamaz', getDocs(collection(cS, 'classPosts')), false);
  await t('Paylaşım: öğrenci YAZAMAZ', setDoc(doc(cS, 'classPosts/P6'), post('10202601', 'muzik_1')), false);
  await t('Paylaşım: başka öğretmen SİLEMEZ', deleteDoc(doc(cT3, 'classPosts/P1')), false);
  await t('Paylaşım: veli akademi paylaşımlarını OKUYAMAZ', getDoc(doc(cV, 'classPosts/P1')), false);
  await t('Paylaşım: öğretmen kendi paylaşımını siler', deleteDoc(doc(cT2, 'classPosts/P1')), true);
  await t('Çocuk paylaşımı: sınıf öğretmeni gönderir', setDoc(doc(cKT, 'kidClassPosts/Q1'), post('72026001', 'L1')), true);
  await t('Çocuk paylaşımı: sınıfı olmayan öğretmen gönderemez', setDoc(doc(cKT, 'kidClassPosts/Q2'), post('72026001', 'L2')), false);
  await t('Çocuk paylaşımı: ders hazırlığı (sınıf öğretmeni olmayan sınıf + o sınıfın dersi)', Promise.all([
    setDoc(doc(admin, 'kidClasses/L3'), { kind: 'area', name: '3', teacherNos: [] }),
    setDoc(doc(admin, 'kidSchedule/KS1'), { classId: 'L3', teacherNo: '72026001', title: 'Ders' }),
    setDoc(doc(admin, 'kidSchedule/KS2'), { classId: 'L3', teacherNo: '72026099', title: 'Ders' })]), true);
  await t('Çocuk paylaşımı: sınıfa DERS VEREN öğretmen gönderir', setDoc(doc(cKT, 'kidClassPosts/Q4'), post('72026001', 'L3', { lessonId: 'KS1' })), true);
  await t('Çocuk paylaşımı: başkasının dersiyle gönderemez', setDoc(doc(cKT, 'kidClassPosts/Q5'), post('72026001', 'L3', { lessonId: 'KS2' })), false);
  await t('Çocuk paylaşımı: ders başka sınıfın ise gönderemez', setDoc(doc(cKT, 'kidClassPosts/Q6'), post('72026001', 'L2', { lessonId: 'KS1' })), false);
  await t('Çocuk paylaşımı: veli okur', getDoc(doc(cV, 'kidClassPosts/Q1')), true);
  await t('Çocuk paylaşımı: veli YAZAMAZ', setDoc(doc(cV, 'kidClassPosts/Q3'), post('92026001', 'L1')), false);
  await t('Çocuk paylaşımı: yetişkin öğrenci okuyamaz', getDoc(doc(cS, 'kidClassPosts/Q1')), false);
  await t('Çocuk paylaşımı: öğrenci işleri siler', deleteDoc(doc(cR, 'kidClassPosts/Q1')), true);
  // Anlık bildirim cihaz kayıtları
  {
    const pS = as('10202601@ogrenci.aat'), pT = as('11202601@ogretmen.aat'), pV = as('92026001@veli.aat'), pK = as('72026001@zmamoste.aat');
    const U = { S: 'uid-10202601@ogrenci.aat', T: 'uid-11202601@ogretmen.aat', V: 'uid-92026001@veli.aat', K: 'uid-72026001@zmamoste.aat' };
    const tok = (ctx, no, role, app, x) => ({ uid: ctx === pS ? U.S : ctx === pT ? U.T : ctx === pV ? U.V : U.K, no, role, app, lang: 'tr', area: '', updatedAt: new Date(), ...(x || {}) });
    await t('Bildirim: öğrenci kendi cihazını kaydeder', setDoc(doc(pS, 'pushTokens/TS1'), tok(pS, '10202601', 'student', 'aat')), true);
    await t('Bildirim: öğrenci öğretmen rolüyle kaydolamaz', setDoc(doc(pS, 'pushTokens/TS2'), tok(pS, '10202601', 'teacher', 'aat')), false);
    await t('Bildirim: başkasının numarasıyla kaydolunamaz', setDoc(doc(pS, 'pushTokens/TS3'), tok(pS, '10202602', 'student', 'aat')), false);
    await t('Bildirim: öğretmen kaydolur', setDoc(doc(pT, 'pushTokens/TT1'), tok(pT, '11202601', 'teacher', 'aat')), true);
    await t('Bildirim: öğretmen kendini SORUMLU diye kaydedemez', setDoc(doc(pT, 'pushTokens/TT2'), tok(pT, '11202601', 'head', 'aat', { area: 'tiyatro' })), false);
    await t('Bildirim: öğretmen kendini YÖNETİCİ diye kaydedemez', setDoc(doc(pT, 'pushTokens/TT3'), tok(pT, '11202601', 'admin', 'aat')), false);
    await t('Bildirim: öğretmen kendini ÖĞRENCİ İŞLERİ diye kaydedemez', setDoc(doc(pT, 'pushTokens/TT4'), tok(pT, '11202601', 'registrar', 'aat')), false);
    {
      const pH = as('96202601@ogretmen.aat'), pR = as('98202601@ogretmen.aat');
      await t('Bildirim: sorumlu kendi bölümüyle kaydolur', setDoc(doc(pH, 'pushTokens/TH1'), tok(pH, '96202601', 'head', 'aat', { uid: 'uid-96202601@ogretmen.aat', area: 'tiyatro' })), true);
      await t('Bildirim: sorumlu BAŞKA bölümle kaydolamaz', setDoc(doc(pH, 'pushTokens/TH2'), tok(pH, '96202601', 'head', 'aat', { uid: 'uid-96202601@ogretmen.aat', area: 'muzik' })), false);
      await t('Bildirim: öğrenci işleri kendi rolüyle kaydolur', setDoc(doc(pR, 'pushTokens/TR1'), tok(pR, '98202601', 'registrar', 'aat', { uid: 'uid-98202601@ogretmen.aat' })), true);
    }
    await t('Bildirim: veli çocuk uygulamasına kaydolur', setDoc(doc(pV, 'pushTokens/TV1'), tok(pV, '92026001', 'guardian', 'zarok')), true);
    await t('Bildirim: veli öğretmen rolü alamaz', setDoc(doc(pV, 'pushTokens/TV2'), tok(pV, '92026001', 'kidteacher', 'zarok')), false);
    await t('Bildirim: çocuk öğretmeni kaydolur', setDoc(doc(pK, 'pushTokens/TK1'), tok(pK, '72026001', 'kidteacher', 'zarok')), true);
    await t('Bildirim: başkasının cihaz kaydını okuyamaz', getDoc(doc(pT, 'pushTokens/TS1')), false);
    await t('Bildirim: başkasının cihaz kaydını ele geçiremez', setDoc(doc(pT, 'pushTokens/TS1'), tok(pT, '11202601', 'teacher', 'aat')), false);
    await t('Bildirim: kendi kaydını siler', deleteDoc(doc(pS, 'pushTokens/TS1')), true);
    await t('Bildirim: fazladan alan reddedilir', setDoc(doc(pV, 'pushTokens/TV3'), tok(pV, '92026001', 'guardian', 'zarok', { x: 1 })), false);
  }
  // Çocuk Akademisi anketleri (veliler / çocuk öğretmenleri)
  // ── Bölüm sorumlusu: kendi bölümüne duyuru, personele mesaj, öğrenciye MESAJ YOK, raporları okur ──
  const head = as('96202601@ogretmen.aat');
  // Değerlendirme formları + cevaplar
  {
    const fH = as('96202601@ogretmen.aat'), fKH = as('96202603@ogretmen.aat'), fT = as('11202601@ogretmen.aat'), fS = as('10202601@ogrenci.aat'),
      fV = as('92026001@veli.aat'), fKT = as('72026001@zmamoste.aat');
    const form = (x) => ({ title: 'Heftane', academy: 'aat', direction: 't2s', area: 'tiyatro', period: 'weekly', active: true, ownerNo: '96202601',
      questions: [{ id: 'q1', text: 'Beşdarî', type: 'score', required: true }], ...(x || {}) });
    await t('Form: sorumlu kendi bölümüne form açar', setDoc(doc(fH, 'evalForms/F1'), form()), true);
    await t('Form: sorumlu öğrenci→öğretmen formu açar', setDoc(doc(fH, 'evalForms/F2'), form({ direction: 's2t' })), true);
    await t('Form: sorumlu BAŞKA bölüme form açamaz', setDoc(doc(fH, 'evalForms/F3'), form({ area: 'muzik' })), false);
    await t('Form: sorumlu başkası adına açamaz', setDoc(doc(fH, 'evalForms/F4'), form({ ownerNo: '1000' })), false);
    await t('Form: ana sorumlu çocuk formu açamaz', setDoc(doc(fH, 'evalForms/F5'), form({ academy: 'kid', direction: 't2k' })), false);
    await t('Form: sorusuz form reddedilir', setDoc(doc(fH, 'evalForms/F6'), form({ questions: [] })), false);
    await t('Form: öğretmen form AÇAMAZ', setDoc(doc(fT, 'evalForms/F7'), form({ ownerNo: '11202601' })), false);
    await t('Form: çocuk sorumlusu kendi dersine form açar', setDoc(doc(fKH, 'evalForms/K1'), form({ academy: 'kid', direction: 'g2t', area: 'drama', ownerNo: '96202603' })), true);
    await setDoc(doc(fKH, 'evalForms/K2'), form({ academy: 'kid', direction: 't2k', area: 'drama', ownerNo: '96202603' }));
    await t('Form: öğrenci formları okur', getDoc(doc(fS, 'evalForms/F1')), true);
    await t('Form: sahte (dizinde olmayan) hesap formları OKUYAMAZ', getDoc(doc(as('5555@ogrenci.aat'), 'evalForms/F1')), false);
    const resp = (fid, per, rater, target, dir, x) => ({ formId: fid, period: per, raterNo: rater, raterRole: 'r', targetNo: target, targetName: 'N', area: 'tiyatro', classId: '',
      academy: 'aat', direction: dir, answers: { q1: 8 }, score10: 8, at: new Date(), ...(x || {}) });
    await t('Cevap: öğretmen öğrenciyi değerlendirir (t2s)', setDoc(doc(fT, 'evalResponses/F1_2026-11-02_11202601_10202601'), resp('F1', '2026-11-02', '11202601', '10202601', 't2s')), true);
    await t('Cevap: soru başına kişiye not (notes) kaydedilir', setDoc(doc(fT, 'evalResponses/F1_2026-11-02_11202601_10202601'), resp('F1', '2026-11-02', '11202601', '10202601', 't2s', { notes: { q1: 'Ders tê de beşdar nabe' } })), true);
    await t('Cevap: notes harita değilse reddedilir', setDoc(doc(fT, 'evalResponses/F1_2026-11-02_11202601_10202601'), resp('F1', '2026-11-02', '11202601', '10202601', 't2s', { notes: 'x' })), false);
    await t('Cevap: öğrenci t2s formunu dolduramaz', setDoc(doc(fS, 'evalResponses/F1_2026-11-02_10202601_11202601'), resp('F1', '2026-11-02', '10202601', '11202601', 't2s')), false);
    await t('Cevap: öğrenci öğretmeni değerlendirir (s2t)', setDoc(doc(fS, 'evalResponses/F2_2026-11-02_10202601_11202601'), resp('F2', '2026-11-02', '10202601', '11202601', 's2t')), true);
    await t('Cevap: başkası adına yazılamaz', setDoc(doc(fT, 'evalResponses/F1_2026-11-02_10202601_x'), resp('F1', '2026-11-02', '10202601', 'x', 't2s')), false);
    await t('Cevap: belge kimliği uymazsa reddedilir', setDoc(doc(fT, 'evalResponses/X1'), resp('F1', '2026-11-02', '11202601', '10202601', 't2s')), false);
    await t('Cevap: 10 üstü puan reddedilir', setDoc(doc(fT, 'evalResponses/F1_2026-11-03_11202601_10202601'), resp('F1', '2026-11-03', '11202601', '10202601', 't2s', { score10: 11 })), false);
    await t('Cevap: yön formla uyuşmazsa reddedilir', setDoc(doc(fT, 'evalResponses/F1_2026-11-04_11202601_10202601'), resp('F1', '2026-11-04', '11202601', '10202601', 's2t')), false);
    await t('Cevap: öğrenci OLMAYAN kişiyi (sahte hedef) değerlendiremez', setDoc(doc(fS, 'evalResponses/F2_2026-11-02_10202601_55555555'), resp('F2', '2026-11-02', '10202601', '55555555', 's2t')), false);
    await t('Cevap: öğretmen kayıtsız öğrenciyi değerlendiremez', setDoc(doc(fT, 'evalResponses/F1_2026-11-05_11202601_55555555'), resp('F1', '2026-11-05', '11202601', '55555555', 't2s')), false);
    await t('Cevap: akademi formla uyuşmazsa reddedilir', setDoc(doc(fT, 'evalResponses/F1_2026-11-06_11202601_10202601'), resp('F1', '2026-11-06', '11202601', '10202601', 't2s', { academy: 'kid' })), false);
    await t('Cevap: veli çocuk öğretmenini değerlendirir (g2t)', setDoc(doc(fV, 'evalResponses/K1_2026-11-02_92026001_72026001'), resp('K1', '2026-11-02', '92026001', '72026001', 'g2t', { academy: 'kid' })), true);
    await t('Cevap: çocuk öğretmeni çocuğu değerlendirir (t2k)', setDoc(doc(fKT, 'evalResponses/K2_2026-11-02_72026001_k1'), resp('K2', '2026-11-02', '72026001', 'k1', 't2k', { academy: 'kid' })), true);
    await t('Cevap: öğretmen başkasının cevabını okuyamaz', getDoc(doc(fT, 'evalResponses/F2_2026-11-02_10202601_11202601')), false);
    await t('Cevap: sorumlu cevapları okur', getDoc(doc(fH, 'evalResponses/F2_2026-11-02_10202601_11202601')), true);
    await updateDoc(doc(fH, 'evalForms/F1'), { active: false });
    await t('Cevap: duraklatılan forma yazılamaz', setDoc(doc(fT, 'evalResponses/F1_2026-11-09_11202601_10202601'), resp('F1', '2026-11-09', '11202601', '10202601', 't2s')), false);
  }
  // Uyarı merkezi: "ilgilenildi" işaretleri
  const ackD = (byNo, x) => ({ key: 'abs_1_L1', kind: 'abs', count: 3, note: 'Veliyle görüşüldü', by: 'X', byNo, at: new Date(), ...(x || {}) });
  await t('Uyarı: bölüm sorumlusu kendi adıyla işaretler', setDoc(doc(head, 'alertAcks/abs_1_L1'), ackD('96202601')), true);
  await t('Uyarı: sorumlu başkası adına işaretleyemez', setDoc(doc(head, 'alertAcks/abs_2_L1'), ackD('11202601')), false);
  await t('Uyarı: yönetici işaretler', setDoc(doc(admin, 'alertAcks/abs_3_L1'), ackD('1000')), true);
  await t('Uyarı: öğretmen işaretleyemez', setDoc(doc(teacher, 'alertAcks/abs_4_L1'), ackD('11202601')), false);
  await t('Uyarı: öğrenci işleri artık işaretleyemez (uyarılar yönetici + sorumlularda)', setDoc(doc(as('98202601@ogretmen.aat'), 'alertAcks/man_st_101_2026-10'), ackD('98202601')), false);
  await t('Uyarı: öğrenci işleri başkası adına işaretleyemez', setDoc(doc(as('98202601@ogretmen.aat'), 'alertAcks/man_st_102_2026-10'), ackD('1000')), false);
  await t('Uyarı: öğrenci işleri işaretleri okuyamaz', getDoc(doc(as('98202601@ogretmen.aat'), 'alertAcks/man_st_101_2026-10')), false);
  await t('Uyarı: öğretmen işaretleri okuyamaz', getDoc(doc(teacher, 'alertAcks/abs_1_L1')), false);
  await t('Uyarı: öğrenci okuyamaz', getDoc(doc(student, 'alertAcks/abs_1_L1')), false);
  await t('Uyarı: fazladan alan reddedilir', setDoc(doc(head, 'alertAcks/abs_5_L1'), ackD('96202601', { x: 1 })), false);
  await t('Uyarı: 500 karakterden uzun not reddedilir', setDoc(doc(head, 'alertAcks/abs_6_L1'), ackD('96202601', { note: 'a'.repeat(501) })), false);

  const hAnn = x => ({ title: 'Prova', msg: 'Şemî', senderRole: 'head', senderNo: '96202601', senderArea: 'tiyatro', targets: ['tiyatro'], ...(x || {}) });
  await t('B.sorumlusu: kendi bölümüne duyuru gönderir', addDoc(collection(head, 'announcements'), hAnn()), true);
  await t('B.sorumlusu: BAŞKA bölüme duyuru gönderemez', addDoc(collection(head, 'announcements'), hAnn({ targets: ['muzik'], senderArea: 'muzik' })), false);
  await t('B.sorumlusu: herkese duyuru gönderemez', addDoc(collection(head, 'announcements'), hAnn({ targets: ['all'] })), false);
  await t('B.sorumlusu: başkası adına duyuru gönderemez', addDoc(collection(head, 'announcements'), hAnn({ senderNo: '1000' })), false);
  await t('B.sorumlusu: kendi duyurusunu siler', deleteDoc(doc(head, 'announcements/AH1')), true);
  await t('B.sorumlusu: başkasının duyurusunu SİLEMEZ', deleteDoc(doc(head, 'announcements/AT1')), false);
  const hMsg = x => ({ fromType: 'head', senderNo: '96202601', subject: 'Belge', body: 'b', recipientGroup: null, ...(x || {}) });
  await t('B.sorumlusu: yöneticiye mesaj gönderir', addDoc(collection(head, 'messages'), hMsg({ recipientId: 'admin', recipientNo: null })), true);
  await t('B.sorumlusu: öğretmene mesaj gönderir', addDoc(collection(head, 'messages'), hMsg({ recipientId: 't_T2', recipientNo: '11202601' })), true);
  await t('B.sorumlusu: öğrenciye MESAJ GÖNDEREMEZ', addDoc(collection(head, 'messages'), hMsg({ recipientId: 's_S1', recipientNo: '10202601' })), false);
  await t('B.sorumlusu: öğrencilere toplu mesaj GÖNDEREMEZ', addDoc(collection(head, 'messages'), hMsg({ recipientGroup: 'allStudents' })), false);
  await t('B.sorumlusu: başkası adına mesaj gönderemez', addDoc(collection(head, 'messages'), hMsg({ senderNo: '1000', recipientId: 'admin', recipientNo: null })), false);
  await t('B.sorumlusu: gelen mesajı okundu işaretler', updateDoc(doc(head, 'messages/MH1'), { read: true }), true);
  await t('B.sorumlusu: mesaj içeriğini DEĞİŞTİREMEZ', updateDoc(doc(head, 'messages/MH1'), { subject: 'y' }), false);
  await t('B.sorumlusu: kendi bölümüne gelen mesajı siler', deleteDoc(doc(head, 'messages/MH1')), true);
  await t('B.sorumlusu: rapor için öğrencileri okur', getDocs(collection(head, 'students')), true);
  await t('B.sorumlusu: yoklama okur', getDocs(collection(head, 'attendance')), true);
  await t('B.sorumlusu: ders belgesi olmayan (lessonFire yok) yoklama yazamaz', addDoc(collection(head, 'attendance'), { studentNo: '10202601' }), false);
  // Ders programı: bölüm sorumlusu kendi bölümünün derslerini yönetir; Öğrenci İşleri yalnız atölye dersini
  await t('B.sorumlusu: kendi bölümüne ders ekler', setDoc(doc(head, 'schedule/SH1'), { area: 'tiyatro', name: 'Şano', teacherNo: '11202601' }), true);
  await t('B.sorumlusu: kendi dersinin öğretmenini değiştirir', updateDoc(doc(head, 'schedule/SH1'), { teacherNo: '21202601' }), true);
  await t('B.sorumlusu: dersi başka bölüme TAŞIYAMAZ', updateDoc(doc(head, 'schedule/SH1'), { area: 'muzik' }), false);
  await t('B.sorumlusu: başka bölüme ders EKLEYEMEZ', setDoc(doc(head, 'schedule/SH2'), { area: 'muzik', name: 'x' }), false);
  await t('B.sorumlusu: bölümsüz ders EKLEYEMEZ', addDoc(collection(head, 'schedule'), { name: 'x' }), false);
  await setDoc(doc(admin, 'schedule/SM1'), { area: 'muzik', name: 'Piyano' });
  await t('B.sorumlusu: başka bölümün dersini SİLEMEZ', deleteDoc(doc(head, 'schedule/SM1')), false);
  await t('Öğretmen ders programı YAZAMAZ', setDoc(doc(teacher, 'schedule/ST1'), { area: 'muzik', name: 'x' }), false);
  await t('Öğretmen ders SİLEMEZ', deleteDoc(doc(teacher, 'schedule/SM1')), false);
  await t('Öğrenci İşleri haftalık ders YAZAMAZ (program bölüm sorumlularında)', setDoc(doc(as('98202601@ogretmen.aat'), 'schedule/SR1'), { area: 'muzik', name: 'x' }), false);
  await setDoc(doc(admin, 'schedule/SR1'), { area: 'muzik', name: 'x' });
  await t('Öğrenci İşleri haftalık ders SİLEMEZ', deleteDoc(doc(as('98202601@ogretmen.aat'), 'schedule/SR1')), false);
  await t('Öğrenci İşleri atölye dersini yazamaz (ws_)', setDoc(doc(as('98202601@ogretmen.aat'), 'schedule/ws_W1'), { area: 'genel', name: 'Atolye', lessonType: 'extra' }), false);
  await t('Tiyatro sorumlusu kendi atölye dersini yazar (ws_)', setDoc(doc(as('96202601@ogretmen.aat'), 'schedule/ws_W2'), { area: 'tiyatro', name: 'Atolye', lessonType: 'extra' }), true);
  await t('Yönetici her bölüme ders yazar', setDoc(doc(admin, 'schedule/SA1'), { area: 'dans', name: 'x' }), true);
  await t('Genel sorumlu: başka bölüme ders YAZAMAZ (yalnız genel alan)', setDoc(doc(as('96202602@ogretmen.aat'), 'schedule/SG1'), { area: 'dans', name: 'x' }), false);
  await t('Genel sorumlu: GENEL alana ders yazar', setDoc(doc(as('96202602@ogretmen.aat'), 'schedule/SG2'), { area: 'genel', name: 'Ortak' }), true);
  await t('Genel sorumlu: başka bölümün dersini SİLEMEZ', deleteDoc(doc(as('96202602@ogretmen.aat'), 'schedule/SA1')), false);
  await t('B.sorumlusu: kendi dersini siler', deleteDoc(doc(head, 'schedule/SH1')), true);
  // Ders yapılmadı işareti (attendance): yalnız kendi bölümü, yalnız işaret alanları
  await env.withSecurityRulesDisabled(async c => { const db = c.firestore();
    await setDoc(doc(db, 'schedule/SH9'), { area: 'tiyatro', name: 'Şano', teacherNo: '11202601' });
    await setDoc(doc(db, 'schedule/SH8'), { area: 'tiyatro', name: 'Şano 2', teacherNo: '11202601' });
    await setDoc(doc(db, 'schedule/SM1'), { area: 'muzik', name: 'Stran', teacherNo: '11202602' });
    await setDoc(doc(db, 'schedule/SM2'), { area: 'muzik', name: 'Stran 2', teacherNo: '11202602' });
    await setDoc(doc(db, 'schedule/SM3'), { area: 'tiyatro', name: 'Şano 3', teacherNo: '11202601' });
    await setDoc(doc(db, 'attendance/SM2-2026-10-26'), { lessonId: 'SM2', lessonFire: 'SM2', area: 'muzik', date: '2026-10-26', records: { S1: 'on' }, startedAt: 1 }); });
  const absMark = { teacherAbsent: true, absenceKind: 'sick', absenceNote: 'Nexweş', absenceBy: 'Berpirs' };
  await t('B.sorumlusu: kendi dersine "ders yapılmadı" işler', setDoc(doc(head, 'attendance/SH9-2026-10-26'),
    { lessonId: 'SH9', lessonFire: 'SH9', lessonName: 'Şano', area: 'tiyatro', classId: null, teacherName: 'M', date: '2026-10-26', records: {}, ...absMark }), true);
  await t('B.sorumlusu: işareti kaldırır', updateDoc(doc(head, 'attendance/SH9-2026-10-26'), { teacherAbsent: false, absenceKind: null, absenceNote: null }), true);
  await t('B.sorumlusu (öğretmen olarak): yoklama kaydını (records) değiştirir', updateDoc(doc(head, 'attendance/SH9-2026-10-26'), { records: { S1: 'on' } }), true);
  await t('B.sorumlusu (öğretmen olarak): yeni belgede yoklama yazar', setDoc(doc(head, 'attendance/SH8-2026-10-26'), { lessonId: 'SH8', lessonFire: 'SH8', area: 'tiyatro', date: '2026-10-26', records: { S1: 'on' }, ...absMark }), true);
  await t('B.sorumlusu: BAŞKA bölümün dersine işaret koyamaz', setDoc(doc(head, 'attendance/SM1-2026-10-26'), { lessonId: 'SM1', lessonFire: 'SM1', area: 'muzik', date: '2026-10-26', records: {}, ...absMark }), false);
  await t('B.sorumlusu: başka bölümün yoklamasını düzeltemez (alanı değiştirip kaçamaz)', updateDoc(doc(head, 'attendance/SM2-2026-10-26'), { ...absMark, area: 'tiyatro' }), false);
  const lv = x => ({ studentNo: '10202601', studentId: 'S1', studentName: 'Ö', area: 'tiyatro', from: '2026-10-26', to: '2026-10-27', reason: 'Nexweşî', by: 'B', byNo: '96202601', kid: false, ...(x || {}) });
  await t('B.sorumlusu: kendi bölümünün öğrencisine izin işler', setDoc(doc(head, 'studentLeaves/L1'), lv()), true);
  await t('B.sorumlusu: başka bölüme izin işleyemez', setDoc(doc(head, 'studentLeaves/L2'), lv({ area: 'muzik' })), false);
  await t('B.sorumlusu: başkası adına izin işleyemez', setDoc(doc(head, 'studentLeaves/L3'), lv({ byNo: '1000' })), false);
  await t('B.sorumlusu: nedensiz izin işleyemez', setDoc(doc(head, 'studentLeaves/L4'), lv({ reason: '' })), false);
  await t('B.sorumlusu: çocuk izni işleyemez', setDoc(doc(head, 'studentLeaves/L5'), lv({ kid: true })), false);
  await t('B.sorumlusu: derse özel izin işler (lessonIds + lessonNames)', setDoc(doc(head, 'studentLeaves/L6'), lv({ lessonIds: ['L1'], lessonNames: ['Şano 14:00'] })), true);
  await t('B.sorumlusu: derse özel izinde liste dışı tür reddedilir', setDoc(doc(head, 'studentLeaves/L7'), lv({ lessonIds: 'L1' })), false);
  await t('Öğretmen izinleri okur', getDoc(doc(teacher, 'studentLeaves/L1')), true);
  await t('Öğretmen izin İŞLEYEMEZ', setDoc(doc(teacher, 'studentLeaves/L6'), lv({ byNo: '11202601' })), false);
  await t('Öğrenci izinleri OKUYAMAZ', getDoc(doc(student, 'studentLeaves/L1')), false);
  await t('B.sorumlusu: kendi işlediği izni siler', deleteDoc(doc(head, 'studentLeaves/L1')), true);
  await t('Ç.sorumlu: kendi dersinin çocuğuna izin işler', setDoc(doc(as('96202603@ogretmen.aat'), 'studentLeaves/K1'), lv({ area: 'drama', kid: true, byNo: '96202603' })), true);
  await t('Ç.sorumlu: ana akademi izni işleyemez', setDoc(doc(as('96202603@ogretmen.aat'), 'studentLeaves/K2'), lv({ area: 'drama', byNo: '96202603' })), false);
  await t('Öğretmen dersi başlatır (startedAt)', setDoc(doc(teacher, 'attendance/SM3-2026-10-26'), { lessonId: 'SM3', lessonFire: 'SM3', date: '2026-10-26', area: 'tiyatro', startedAt: Date.now() }, { merge: true }), true);
  // ── Yoklama yetkisi: dersin öğretmeni · o günün görevlisi · dersin bölüm sorumlusu ──
  {
    await env.withSecurityRulesDisabled(async c => { const db = c.firestore();
      await setDoc(doc(db, 'idx_staff/11202602'), { no: '11202602', lvl: 'teacher' });
      await setDoc(doc(db, 'schedule/AT1'), { area: 'tiyatro', name: 'Ders A', teacherNo: '11202601' });
      await setDoc(doc(db, 'schedule/AT2'), { area: 'muzik', name: 'Ders M', teacherNo: '11202602' });
      await setDoc(doc(db, 'schedule/AG1'), { area: 'genel', name: 'Ortak', teacherNo: '11202601' });
      await setDoc(doc(db, 'attendance/AT1-2026-11-02'), { lessonId: 'AT1', lessonFire: 'AT1', area: 'tiyatro', date: '2026-11-02', records: { S1: 'off' } }); });
    const tOwn = as('11202601@ogretmen.aat'), tOther = as('11202602@ogretmen.aat'), tHead = as('96202601@ogretmen.aat'), tGen = as('96202602@ogretmen.aat'), tAdm = admin, tReg = as('98202601@ogretmen.aat');
    const at = (lid, extra) => ({ lessonId: lid, lessonFire: lid, area: 'tiyatro', date: '2026-11-02', records: { S1: 'on' }, ...(extra || {}) });
    await t('Yoklama: dersin öğretmeni yazar', setDoc(doc(tOwn, 'attendance/AT1-2026-11-02'), at('AT1')), true);
    await t('Yoklama: dersin öğretmeni mevcut kaydı düzeltir', updateDoc(doc(tOwn, 'attendance/AT1-2026-11-02'), { records: { S1: 'late' } }), true);
    await t('Yoklama: BAŞKA öğretmen yazamaz', setDoc(doc(tOther, 'attendance/AT1-2026-11-02'), at('AT1')), false);
    await t('Yoklama: başka öğretmen mevcut kaydı düzeltemez', updateDoc(doc(tOther, 'attendance/AT1-2026-11-02'), { records: { S1: 'off' } }), false);
    await t('Yoklama: öğretmen ders belgesi (lessonFire) olmadan yazamaz', setDoc(doc(tOwn, 'attendance/AT1-2026-11-09'), { lessonId: 'AT1', date: '2026-11-09', records: {} }), false);
    await t('Yoklama: öğretmen başkasının dersini kendi dersi gibi gösteremez (lessonFire = başkasının)', setDoc(doc(tOwn, 'attendance/AT2-2026-11-02'), at('AT2', { area: 'muzik' })), false);
    await t('Yoklama: dersin bölüm sorumlusu (tiyatro) yazar / düzeltir', setDoc(doc(tHead, 'attendance/AT1-2026-11-02'), at('AT1', { records: { S1: 'off' } })), true);
    await t('Yoklama: başka bölümün sorumlusu (tiyatro) müzik dersine yazamaz', setDoc(doc(tHead, 'attendance/AT2-2026-11-02'), at('AT2', { area: 'muzik' })), false);
    await t('Yoklama: genel sorumlu bölüm dersine YAZAMAZ (bölüm sorumlusu yetkisi yok)', setDoc(doc(tGen, 'attendance/AT1-2026-11-02'), at('AT1')), false);
    await t('Yoklama: genel sorumlu düzeltme de YAPAMAZ', updateDoc(doc(tGen, 'attendance/AT1-2026-11-02'), { records: { S1: 'on' } }), false);
    await t('Yoklama: yönetici öğrenci kaydını (records) DÜZELTEMEZ', updateDoc(doc(tAdm, 'attendance/AT1-2026-11-02'), { records: { S1: 'on' } }), false);
    await t('Yoklama: yönetici yeni yoklama YAZAMAZ', setDoc(doc(tAdm, 'attendance/AT1-2026-11-16'), at('AT1')), false);
    await t('Yoklama: yönetici "ders yapılmadı" işareti koyabilir', setDoc(doc(tAdm, 'attendance/AT1-2026-11-23'), { lessonId: 'AT1', lessonFire: 'AT1', area: 'tiyatro', date: '2026-11-23', records: {}, teacherAbsent: true, absenceKind: 'sick' }, { merge: true }), true);
    await t('Yoklama: Öğrenci İşleri yoklama YAZAMAZ', setDoc(doc(tReg, 'attendance/AT1-2026-11-30'), at('AT1', { date: '2026-11-30' })), false);
    // Günlük görevlendirme
    const sub = x => ({ lessonFire: 'AT1', date: '2026-12-07', teacherNo: '11202602', teacherName: 'Ö2', area: 'tiyatro', byNo: '96202601', ...(x || {}) });
    await t('Görevlendirme: dersin bölüm sorumlusu o gün için başka öğretmeni görevlendirir', setDoc(doc(tHead, 'lessonSubs/AT1_2026-12-07'), sub()), true);
    await t('Görevlendirme: kendini de görevlendirebilir (bölüm sorumlusu)', setDoc(doc(tHead, 'lessonSubs/AT1_2026-12-14'), sub({ date: '2026-12-14', teacherNo: '96202601' })), true);
    await t('Görevlendirme: başka bölümün dersine görevlendirme YAPAMAZ', setDoc(doc(tHead, 'lessonSubs/AT2_2026-12-07'), sub({ lessonFire: 'AT2' })), false);
    await t('Görevlendirme: yönetici görevlendirme YAPAMAZ (kendini de atayamaz)', setDoc(doc(tAdm, 'lessonSubs/AT1_2026-12-21'), sub({ date: '2026-12-21', teacherNo: '1000' })), false);
    await t('Görevlendirme: öğretmen görevlendirme yapamaz', setDoc(doc(tOwn, 'lessonSubs/AT1_2026-12-21'), sub({ date: '2026-12-21' })), false);
    await t('Görevlendirme: belge kimliği ders_tarih olmalı', setDoc(doc(tHead, 'lessonSubs/KOTU'), sub({ date: '2026-12-28' })), false);
    await t('Görevlendirme: genel sorumlu yalnız genel alan derslerine görevlendirme yapar', setDoc(doc(tGen, 'lessonSubs/AG1_2026-12-07'), sub({ lessonFire: 'AG1', area: 'genel', byNo: '96202602', teacherNo: '96202602' })), true);
    await t('Görevlendirme: genel sorumlu bölüm dersine görevlendirme yapamaz', setDoc(doc(tGen, 'lessonSubs/AT1_2026-12-28'), sub({ date: '2026-12-28', byNo: '96202602' })), false);
    await t('Görevlendirme: personel okur', getDoc(doc(tOwn, 'lessonSubs/AT1_2026-12-07')), true);
    await t('Görevlendirme: öğrenci okuyamaz', getDoc(doc(student, 'lessonSubs/AT1_2026-12-07')), false);
    await t('Yoklama: o günün görevlisi (başka bölüm öğretmeni) görev gününde yazar', setDoc(doc(tOther, 'attendance/AT1-2026-12-07'), at('AT1', { date: '2026-12-07' })), true);
    await t('Yoklama: görevli başka bir günde yazamaz', setDoc(doc(tOther, 'attendance/AT1-2026-12-08'), at('AT1', { date: '2026-12-08' })), false);
    await t('Yoklama: görevlendirilen genel sorumlu o gün öğretmen olarak yazar', setDoc(doc(tGen, 'attendance/AT1-2026-12-14'), at('AT1', { date: '2026-12-14' })), false);
    await t('Yoklama: görevlendirilen bölüm sorumlusu (kendi dersi, kendine görevli) yazar', setDoc(doc(tHead, 'attendance/AT1-2026-12-14'), at('AT1', { date: '2026-12-14' })), true);
    await t('Görevlendirmeyi bölüm sorumlusu siler', deleteDoc(doc(tHead, 'lessonSubs/AT1_2026-12-07')), true);
    await t('Yoklama: görevlendirme silinince eski görevli yazamaz', setDoc(doc(tOther, 'attendance/AT1-2026-12-07'), at('AT1', { date: '2026-12-07' })), false);
  }
  await t('B.sorumlusu: öğrenci EKLEYEMEZ', addDoc(collection(head, 'students'), { no: '1', name: 'x' }), false);
  await t('B.sorumlusu: öğrenci istatistiği YAZAMAZ', setDoc(doc(head, 'studentStats/S1'), { x: 1 }), false);
  await t('Eski istatistik tablosu: öğretmen de YAZAMAZ', setDoc(doc(teacher, 'studentStats/S1'), { att: 1 }), false);
  await t('B.sorumlusu: kendi bölümünü/yetkisini değiştiremez', updateDoc(doc(head, 'teachers/TH'), { area: 'muzik' }), false);
  await t('B.sorumlusu: kendini yönetici yapamaz', updateDoc(doc(head, 'teachers/TH'), { isAdmin: true }), false);
  await t('B.sorumlusu: dizine yazamaz', setDoc(doc(head, 'idx_staff/96202601'), { no: '96202601', lvl: 'admin' }), false);
  // Cevap: yalnızca kendisine (bölümüne) yazmış öğrenciye
  const rep = x => hMsg({ subject: 'Re', recipientId: 's_S1', recipientNo: '10202601', replyTo: 'MH2', ...(x || {}) });
  await t('B.sorumlusu: kendisine yazan öğrenciye CEVAP verir', addDoc(collection(head, 'messages'), rep()), true);
  await t('B.sorumlusu: cevabı BAŞKA öğrenciye yönlendiremez', addDoc(collection(head, 'messages'), rep({ recipientNo: '10202602' })), false);
  await t('B.sorumlusu: başka bölüme yazılmış mesaja cevap veremez', addDoc(collection(head, 'messages'), rep({ replyTo: 'MH3', recipientNo: '10202602' })), false);
  await t('B.sorumlusu: uydurma mesaja "cevap" diye yazamaz', addDoc(collection(head, 'messages'), rep({ replyTo: 'YOK' })), false);
  await t('Öğrenci gönderen numarasını başkası gibi gösteremez', addDoc(collection(student, 'messages'), { fromType: 'student', senderId: 'S1', toRole: 'head', toArea: 'sinema', fromNo: '10202602', subject: 's', body: 'b' }), false);
  // Bölüm sorumlusu AYNI ZAMANDA öğretmen: QR / günlük / sınıf paylaşımı / öğrenciye öğretmen mesajı / değerlendirme
  await env.withSecurityRulesDisabled(async c => { const db = c.firestore();
    await setDoc(doc(db, 'schedule/HT1'), { id: 'HT1', area: 'tiyatro', name: 'Şano', classId: 'HC1', teacherNo: '96202601', lessonType: 'main' });
    await setDoc(doc(db, 'classes/HC1'), { kind: 'area', area: 'tiyatro', name: '1', studentNos: ['10202601'], teacherNos: [] });
    await setDoc(doc(db, 'evalForms/HF1'), { title: 'T', academy: 'aat', direction: 't2s', area: 'tiyatro', period: 'weekly', active: true, ownerNo: '96202601', questions: [{ id: 'q1', text: 'x', type: 'score', required: true }] });
    await setDoc(doc(db, 'evalForms/HF2'), { title: 'S', academy: 'aat', direction: 's2t', area: 'tiyatro', period: 'weekly', active: true, ownerNo: '96202601', questions: [{ id: 'q1', text: 'x', type: 'score', required: true }] });
    await setDoc(doc(db, 'idx_staff/96202699'), { no: '96202699', lvl: 'head', area: 'muzik' });
    await setDoc(doc(db, 'idx_staff/96202604'), { no: '96202604', lvl: 'head', area: 'ziman' });
    await setDoc(doc(db, 'cards/' + 'k'.repeat(32)), { kind: 'kid', no: '82026003', ref: 'K3', name: 'Zarok D', active: true }); });
  await t('B.sorumlusu (öğretmen olarak): ders QR oturumu açar', setDoc(doc(head, 'qrSessions/HQ1'), { lessonId: 'HT1', active: true, expiresAt: Date.now() + 3600000, openedAtMs: Date.now() }), true);
  await t('B.sorumlusu (öğretmen olarak): dönen QR kodu yazar', setDoc(doc(head, 'qrCodes/HQ1'), { codes: ['A1'] }), true);
  await t('B.sorumlusu (öğretmen olarak): ders günlüğü yazar', setDoc(doc(head, 'teacherLessonLogs/HL1'), { sessionId: 'HQ1', teacherId: 'x' }), true);
  await t('B.sorumlusu (öğretmen olarak): kendi dersinin sınıfına ödev paylaşır', setDoc(doc(head, 'classPosts/HP1'), { teacherNo: '96202601', classId: 'HC1', lessonId: 'HT1', title: 'Ödev', type: 'odev', body: 'x' }), true);
  await t('B.sorumlusu: DERSİ OLMAYAN sınıfa paylaşım yapamaz', setDoc(doc(head, 'classPosts/HP2'), { teacherNo: '96202601', classId: 'HC9', lessonId: 'HT9', title: 'Ödev', type: 'odev', body: 'x' }), false);
  await t('B.sorumlusu (öğretmen olarak): öğrencisine öğretmen mesajı yazar', addDoc(collection(head, 'messages'), { fromType: 'teacher', senderId: 'T9', recipientId: 's_S1', recipientNo: '10202601', recipientGroup: null, subject: 's', body: 'b' }), true);
  await t('B.sorumlusu: öğretmen mesajıyla yönetici adına toplu mesaj YAZAMAZ', addDoc(collection(head, 'messages'), { fromType: 'teacher', senderId: 'admin', recipientGroup: 'allStudents', subject: 's', body: 'b' }), false);
  await t('B.sorumlusu: kayıtsız öğrenciye öğretmen mesajı YAZAMAZ', addDoc(collection(head, 'messages'), { fromType: 'teacher', senderId: 'T9', recipientNo: '99999999', recipientGroup: null, subject: 's', body: 'b' }), false);
  await t('B.sorumlusu (öğretmen olarak): öğrenci değerlendirmesi (t2s) doldurur', setDoc(doc(head, 'evalResponses/HF1_2026-11-02_96202601_10202601'), { formId: 'HF1', period: '2026-11-02', raterNo: '96202601', raterRole: 'head', targetNo: '10202601', targetName: 'N', area: 'tiyatro', classId: '', academy: 'aat', direction: 't2s', answers: { q1: 8 }, score10: 8, at: new Date() }), true);
  await t('Öğrenci SORUMLUYU öğretmen değerlendirmesinde HEDEF alamaz (s2t)', setDoc(doc(as('10202601@ogrenci.aat'), 'evalResponses/HF2_2026-11-02_10202601_96202601'), { formId: 'HF2', period: '2026-11-02', raterNo: '10202601', raterRole: 'student', targetNo: '96202601', targetName: 'B', area: 'tiyatro', classId: '', academy: 'aat', direction: 's2t', answers: { q1: 8 }, score10: 8, at: new Date() }), false);
  await t('Öğrenci sıradan öğretmeni değerlendirebilir (s2t)', setDoc(doc(as('10202601@ogrenci.aat'), 'evalResponses/HF2_2026-11-02_10202601_11202601'), { formId: 'HF2', period: '2026-11-02', raterNo: '10202601', raterRole: 'student', targetNo: '11202601', targetName: 'M', area: 'tiyatro', classId: '', academy: 'aat', direction: 's2t', answers: { q1: 8 }, score10: 8, at: new Date() }), true);
  await t('Öğretmen bölüm sorumlusuna mesaj yazar (toRole head)', addDoc(collection(teacher, 'messages'), { fromType: 'teacher', senderId: 'T2', recipientId: 'head', toRole: 'head', toArea: 'tiyatro', recipientNo: null, recipientGroup: null, subject: 's', body: 'b' }), true);
  // Çocuk akademisi sorumlusu Öğrenci İşleri tarafından çocuk akademisine bağlanınca (idx_kidstaff) öğretmen gibi çalışır
  await t('Çocuk sorumlusu BAĞLANMADAN çocuk yoklaması yazamaz', addDoc(collection(as('96202604@ogretmen.aat'), 'kidAttendance'), { kidId: 'K3', type: 'in' }), false);
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), 'idx_kidstaff/96202604'), { no: '96202604' }); });
  await t('Çocuk sorumlusu BAĞLANINCA çocuk yoklaması yazar', addDoc(collection(as('96202604@ogretmen.aat'), 'kidAttendance'), { kidId: 'K3', type: 'in' }), true);
  await t('Bağlı çocuk sorumlusu çocuk kartını okutabilir (cards get)', getDoc(doc(as('96202604@ogretmen.aat'), 'cards/' + 'k'.repeat(32))), true);
  await t('Çocuk sorumlusu ana akademi yoklaması YAZAMAZ (yalnız ana akademi sorumlusu)', setDoc(doc(as('96202603@ogretmen.aat'), 'attendance/KZ-2026-11-02'), { lessonId: 'KZ', date: '2026-11-02', records: {} }), false);
  await t('Çocuk sorumlusu ana akademi QR oturumu AÇAMAZ', setDoc(doc(as('96202603@ogretmen.aat'), 'qrSessions/KQ1'), { lessonId: 'x' }), false);
  // Genel sorumlu
  const gen = as('96202602@ogretmen.aat');
  await t('Genel sorumlu: herkese duyuru gönderir', addDoc(collection(gen, 'announcements'), { title: 'G', senderRole: 'head', senderNo: '96202602', senderArea: 'genel', targets: ['all'] }), true);
  await t('Genel sorumlu: dersi olmayan yoklama yazamaz', addDoc(collection(gen, 'attendance'), { x: 1 }), false);
  await t('Genel sorumlu: öğrenciye (cevapsız) mesaj GÖNDEREMEZ', addDoc(collection(gen, 'messages'), { fromType: 'head', senderNo: '96202602', subject: 's', body: 'b', recipientGroup: null, recipientNo: '10202601' }), false);
  // Çocuk akademisi bölüm sorumlusu (Drama)
  const kh = as('96202603@ogretmen.aat');
  await t('Ç.sorumlu: çocukları okur (rapor)', getDocs(collection(kh, 'kids')), true);
  await t('Ç.sorumlu: veli mesajlarını okur', getDocs(collection(kh, 'kidMessages')), true);
  await t('Ç.sorumlu: kendi dersine program yazar', setDoc(doc(kh, 'kidSchedule/KH1'), { area: 'drama', title: 'Drama', day: 1, start: '15:00', end: '16:00', classId: '' }), true);
  await t('Ç.sorumlu: kendi dersini günceller', updateDoc(doc(kh, 'kidSchedule/KH1'), { teacherNo: '72026001', teacher: 'M' }), true);
  await t('Ç.sorumlu: başka dersin programını YAZAMAZ', setDoc(doc(kh, 'kidSchedule/KH2'), { area: 'solfej', title: 'S' }), false);
  await t('Ç.sorumlu: dersini başka alana taşıyamaz', updateDoc(doc(kh, 'kidSchedule/KH1'), { area: 'solfej' }), false);
  await t('Ç.sorumlu: başka dersin programını SİLEMEZ', deleteDoc(doc(kh, 'kidSchedule/KS1')), false);
  await t('Ç.sorumlu: ana akademi programını YAZAMAZ', setDoc(doc(kh, 'schedule/KX1'), { area: 'drama', name: 'x' }), false);
  await t('Ç.sorumlu: kendi dersini siler', deleteDoc(doc(kh, 'kidSchedule/KH1')), true);
  await t('Öğrenci İşleri çocuk haftalık dersi YAZAMAZ', setDoc(doc(as('98202601@ogretmen.aat'), 'kidSchedule/KR1'), { area: 'drama', title: 'x' }), false);
  await t('Öğrenci İşleri çocuk atölye dersini YAZAMAZ (ws_)', setDoc(doc(as('98202601@ogretmen.aat'), 'kidSchedule/ws_KW1'), { classId: 'KW1', title: 'Atolye', date: '2026-11-01' }), false);
  // Aşama C: çocuk sınıfı + günlük görevlendirme + yoklama yetkisi
  {
    const kh2 = as('96202603@ogretmen.aat'), kreg = as('98202601@ogretmen.aat'), kadm = admin, ktch = as('72026001@zmamoste.aat');
    await t('Ç.sorumlu: kendi bölümüne sınıf açar', setDoc(doc(kh2, 'kidClasses/KC1'), { kind: 'area', area: 'drama', name: '1', studentNos: [], teacherNos: ['72026001'] }), true);
    await t('Ç.sorumlu: kendi sınıfını günceller (sınıf öğretmeni atar)', updateDoc(doc(kh2, 'kidClasses/KC1'), { teacherNos: ['72026001'], teacherNames: ['M'] }), true);
    await t('Ç.sorumlu: başka bölüme sınıf AÇAMAZ', setDoc(doc(kh2, 'kidClasses/KC2'), { kind: 'area', area: 'solfej', name: '1' }), false);
    await t('Ç.sorumlu: sınıfı başka bölüme taşıyamaz', updateDoc(doc(kh2, 'kidClasses/KC1'), { area: 'solfej' }), false);
    await t('Ç.sorumlu: genel sınıf AÇAMAZ', setDoc(doc(kh2, 'kidClasses/KC3'), { kind: 'general', area: 'genel', name: 'G' }), false);
    await t('Yönetici çocuk sınıfı yazar', setDoc(doc(kadm, 'kidClasses/KC4'), { kind: 'general', area: 'genel', name: 'G' }), true);
    await t('Ç.sorumlu: kendi sınıfını siler', deleteDoc(doc(kh2, 'kidClasses/KC1')), true);
    await env.withSecurityRulesDisabled(async c => { const db = c.firestore(); await setDoc(doc(db, 'kidSchedule/KSD1'), { area: 'drama', title: 'Drama', teacherNo: '72026001' }); await setDoc(doc(db, 'kidSchedule/KSS1'), { area: 'solfej', title: 'S' }); });
    const ks = x => ({ lessonFire: 'KSD1', date: '2026-12-07', teacherNo: '72026001', teacherName: 'M', area: 'drama', byNo: '96202603', ...(x || {}) });
    await t('Çocuk görevlendirme: ders sorumlusu o gün için öğretmen görevlendirir', setDoc(doc(kh2, 'kidSubs/KSD1_2026-12-07'), ks()), true);
    await t('Çocuk görevlendirme: başka bölümün dersine yapamaz', setDoc(doc(kh2, 'kidSubs/KSS1_2026-12-07'), ks({ lessonFire: 'KSS1' })), false);
    await t('Çocuk görevlendirme: yönetici YAPAMAZ', setDoc(doc(kadm, 'kidSubs/KSD1_2026-12-14'), ks({ date: '2026-12-14' })), false);
    await t('Çocuk görevlendirme: Öğrenci İşleri YAPAMAZ', setDoc(doc(kreg, 'kidSubs/KSD1_2026-12-14'), ks({ date: '2026-12-14' })), false);
    await t('Çocuk görevlendirme: çocuk öğretmeni okur', getDoc(doc(ktch, 'kidSubs/KSD1_2026-12-07')), true);
    await t('Çocuk görevlendirme: veli okuyamaz', getDoc(doc(veli, 'kidSubs/KSD1_2026-12-07')), false);
    await t('Çocuk görevlendirme: sorumlu siler', deleteDoc(doc(kh2, 'kidSubs/KSD1_2026-12-07')), true);
    await t('Çocuk yoklaması: Öğrenci İşleri YAZAMAZ', addDoc(collection(kreg, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' }), false);
    await t('Çocuk yoklaması: yönetici YAZAMAZ', addDoc(collection(kadm, 'kidAttendance'), { kidId: 'K1', guardianNos: ['92026001'], type: 'in' }), false);
  }
  await t('Ç.sorumlu: kendi dersine duyuru gönderir', addDoc(collection(kh, 'kidAnnouncements'), { title: 'D', body: 'b', by: 'x', byNo: '96202603', area: 'drama' }), true);
  await t('Ç.sorumlu: BAŞKA derse duyuru gönderemez', addDoc(collection(kh, 'kidAnnouncements'), { title: 'D', body: 'b', byNo: '96202603', area: 'solfej' }), false);
  await t('Ç.sorumlu: tüm velilere (alansız) duyuru gönderemez', addDoc(collection(kh, 'kidAnnouncements'), { title: 'D', body: 'b', byNo: '96202603' }), false);
  await t('Ç.sorumlu: veliye cevap yazar', addDoc(collection(kh, 'kidMessages'), { guardianNo: '92026001', guardianName: 'V', text: 'Silav', from: 'staff', by: 'x', byNo: '96202603', read: false }), true);
  await t('Ç.sorumlu: veli adına mesaj YAZAMAZ', addDoc(collection(kh, 'kidMessages'), { guardianNo: '92026001', text: 'x', from: 'guardian', byNo: '96202603' }), false);
  await t('Ç.sorumlu: olmayan veliye yazamaz', addDoc(collection(kh, 'kidMessages'), { guardianNo: '99999999', text: 'x', from: 'staff', by: 'x', byNo: '96202603', read: false }), false);
  await t('Ç.sorumlu: çocuk yoklaması YAZAMAZ', addDoc(collection(kh, 'kidAttendance'), { kidId: 'K3', type: 'in' }), false);
  await t('Ç.sorumlu: çocuk kaydı DEĞİŞTİREMEZ', updateDoc(doc(kh, 'kids/K3'), { name: 'x' }), false);
  await t('Ç.sorumlu: ana akademiye duyuru gönderemez', addDoc(collection(kh, 'announcements'), { title: 'x', senderRole: 'head', senderNo: '96202603', senderArea: 'drama', targets: ['drama'] }), false);
  await t('Öğrenci bölüm sorumlusuna mesaj gönderir', addDoc(collection(student, 'messages'), { fromType: 'student', fromNo: '10202601', senderId: 'S1', toRole: 'head', toArea: 'sinema', subject: 's', body: 'b' }), true);
  await t('Öğretmen bölüm sorumlusu kartı AÇAMAZ', setDoc(doc(teacher, 'teachers/TX'), { no: '96202699', name: 'x', isHead: true, area: 'muzik' }), false);
  await t('Öğrenci işleri bölüm sorumlusu kartı AÇAMAZ (yalnızca yönetici)', setDoc(doc(as('98202601@ogretmen.aat'), 'teachers/TX'), { no: '96202699', name: 'x', isHead: true, area: 'muzik' }), false);
  await t('Yönetici bölüm sorumlusu kartı açar', setDoc(doc(admin, 'teachers/TX'), { no: '96202699', name: 'x', isHead: true, area: 'muzik' }), true);
  await t('Yönetici bölüm sorumlusunu dizine yazar', setDoc(doc(admin, 'idx_staff/96202699'), { no: '96202699', lvl: 'head', area: 'muzik' }), true);
  await t('Yönetici bölüm sorumluları listesini (config/heads) yazar', setDoc(doc(admin, 'config/heads'), { areas: { muzik: { name: 'x', no: '96202699' } } }), true);
  await t('Öğrenci bölüm sorumluları listesini okur', getDoc(doc(student, 'config/heads')), true);
  await t('Öğrenci config/heads YAZAMAZ', setDoc(doc(student, 'config/heads'), { areas: {} }), false);
  const sgA = as('92026001@veli.aat'), sgB = as('92026002@veli.aat'), sgR = as('98202601@ogretmen.aat'), sgK = as('72026001@zmamoste.aat'), sgS = as('10202601@ogrenci.aat'), sgT = as('11202601@ogretmen.aat');
  // Anketler kaldırıldı: hiçbir rol anket koleksiyonlarını okuyamaz/yazamaz
  for (const [nm, db0] of [['Yönetici', admin], ['Öğrenci işleri', sgR], ['B.sorumlusu', head], ['Öğrenci', student], ['Veli', sgA], ['Ç.öğretmeni', sgK]])
    for (const c of ['studentSurveys', 'studentSurveyResponses', 'surveyResponses', 'kidSurveys', 'kidSurveyResponses']) {
      await t(nm + ': ' + c + ' YAZAMAZ (anket kapalı)', setDoc(doc(db0, c + '/X1'), { title: 'x', surveyId: 'x', no: '1', answers: {} }), false);
      await t(nm + ': ' + c + ' OKUYAMAZ (anket kapalı)', getDocs(collection(db0, c)), false);
    }
  // ── Eski haftalık değerlendirme (ana akademi) kapalı: yalnız sorumlunun formları ──
  {
    const tch = as('11202601@ogretmen.aat'), stu = as('10202601@ogrenci.aat'), hd = as('96202601@ogretmen.aat'), adm = as('1000@ogretmen.aat');
    const W = '2026-10-26';
    const se = { wk: W, teacherNo: '11202601', teacherName: 'M', studentNo: '10202601', studentName: 'X', area: 'sinema', c: { p: 4, g: 3, h: 5, b: 4 }, note: '' };
    const te = { wk: W, studentNo: '10202601', teacherNo: '11202601', teacherName: 'M', area: 'sinema', c: { e: 5, h: 4, r: 5, f: 4 }, note: '' };
    await t('Eski değ: öğretmen haftalık değerlendirme YAZAMAZ', setDoc(doc(tch, 'studentEvals/' + W + '_11202601_10202601'), se), false);
    await t('Eski değ: öğrenci haftalık öğretmen değerlendirmesi YAZAMAZ', setDoc(doc(stu, 'teacherEvals/' + W + '_10202601_11202601'), te), false);
    await t('Eski değ: yönetici de YAZAMAZ', setDoc(doc(adm, 'studentEvals/X'), se), false);
    await t('Eski değ: sorumlu OKUYAMAZ', getDocs(collection(hd, 'studentEvals')), false);
    await t('Eski değ: yönetici okur (temizlik)', getDocs(collection(adm, 'teacherEvals')), true);
  }
  // ── Çocuk akademisi: eski haftalık değerlendirme kapalı + duyuru ──
  {
    const kt = as('72026001@zmamoste.aat'), g1 = as('92026001@veli.aat'), g2 = as('92026002@veli.aat'), kh = as('96202603@ogretmen.aat'), adm = as('1000@ogretmen.aat'), reg = as('98202601@ogretmen.aat');
    const W = '2026-10-26';
    const ke = x => ({ wk: W, teacherNo: '72026001', teacherName: 'H', kidId: 'K1', kidNo: '82026001', kidName: 'Z', area: 'drama', c: { p: 4, g: 3, h: 5, b: 4 }, note: '', ...(x || {}) });
    const ge = x => ({ wk: W, guardianNo: '92026001', teacherNo: '72026001', teacherName: 'H', area: 'drama', c: { e: 5, h: 4, r: 5, f: 4 }, note: 'x', ...(x || {}) });
    // Eski haftalık değerlendirme kapalı: yalnız sorumlunun formları
    await t('Ç.değ (eski): çocuk öğretmeni haftalık değerlendirme YAZAMAZ', setDoc(doc(kt, 'kidEvals/' + W + '_72026001_82026001'), ke()), false);
    await t('Ç.değ (eski): veli haftalık öğretmen değerlendirmesi YAZAMAZ', setDoc(doc(g1, 'kidTeacherEvals/' + W + '_92026001_72026001'), ge()), false);
    await t('Ç.değ (eski): sorumlu OKUYAMAZ', getDocs(collection(kh, 'kidEvals')), false);
    await t('Ç.değ (eski): yönetici okur (temizlik)', getDocs(collection(adm, 'kidTeacherEvals')), true);
    await t('Ç.duyuru: çocuk öğretmeni genel duyuru YAZAMAZ', addDoc(collection(kt, 'kidAnnouncements'), { title: 'x', body: 'y' }), false);
    await t('Ç.duyuru: öğrenci işleri genel duyuru yazar', addDoc(collection(reg, 'kidAnnouncements'), { title: 'x', body: 'y' }), true);
  }
  {
    const st = as('10202601@ogrenci.aat'), st2 = as('10202602@ogrenci.aat'), g1 = as('92026001@veli.aat');
    const sm = { from: 'X', fromType: 'student', fromNo: '10202601', toRole: 'teacher', toTeacherNo: '11202601', subject: 's', body: 'b', read: false };
    await t('Msj: öğrenci öğretmenine doğrudan yazar', setDoc(doc(st, 'messages/SM1'), sm), true);
    await t('Msj: öğrenci kendi gönderdiğini okur', getDocs(query(collection(st, 'messages'), where('fromNo', '==', '10202601'))), true);
    await t('Msj: başka öğrenci okuyamaz', getDoc(doc(st2, 'messages/SM1')), false);
    await t('Ç.msj: veli öğretmene doğrudan yazar', addDoc(collection(g1, 'kidMessages'), { guardianNo: '92026001', guardianName: 'A', kidId: 'K1', kidName: 'Z', text: 'x', from: 'guardian', toTeacherNo: '72026001', toName: 'H', read: false, createdAt: new Date() }), true);
    await t('Ç.msj: veli fazladan alan ekleyemez', addDoc(collection(g1, 'kidMessages'), { guardianNo: '92026001', text: 'x', from: 'guardian', isAdmin: true, read: false }), false);
  }
  {
    await env.withSecurityRulesDisabled(async c => { const db = c.firestore();
      await setDoc(doc(db, 'schedule/GS1'), { id: 'G1', area: 'tiyatro', name: 'Atolye', guestTeacher: 'Mêvan', category: 'workshop' });
      await setDoc(doc(db, 'schedule/GS2'), { id: 'G2', area: 'tiyatro', name: 'Ders', teacherNo: '11202601' });
      await setDoc(doc(db, 'schedule/GS3'), { id: 'G3', area: 'muzik', name: 'Stran', teacherNo: '11202601' }); });
    const hd = as('96202601@ogretmen.aat');
    const ga = x => ({ lessonId: 'G1', lessonFire: 'GS1', lessonName: 'A', classId: '', area: 'tiyatro', date: '2026-10-26', records: { '1': 'on' }, teacherName: 'Mêvan', takenBy: 'B', takenByNo: '96202601', ...(x || {}) });
    await t('Yoklama: sorumlu misafir dersinin yoklamasını alır', setDoc(doc(hd, 'attendance/G1-2026-10-26'), ga()), true);
    await t('Yoklama: sorumlu kendi alanındaki öğretmenli dersin yoklamasını elle girer / düzeltir', setDoc(doc(hd, 'attendance/G2-2026-10-26'), ga({ lessonId: 'G2', lessonFire: 'GS2' })), true);
    await t('Yoklama: sorumlu MEVCUT yoklamanın içeriğini düzeltir (izinli → yok)', setDoc(doc(hd, 'attendance/G2-2026-10-26'), ga({ lessonId: 'G2', lessonFire: 'GS2', records: { '1': 'off' } })), true);
    await t('Yoklama: sorumlu mevcut yoklamayı bir kez daha düzeltir (merge)', setDoc(doc(hd, 'attendance/G2-2026-10-26'), ga({ lessonId: 'G2', lessonFire: 'GS2', records: { '1': 'on', '2': 'leave' } }), { merge: true }), true);
    await t('Yoklama: sorumlu mevcut yoklamayı takenByNo farklı da olsa değiştirir', setDoc(doc(hd, 'attendance/G2-2026-10-26'), ga({ lessonId: 'G2', lessonFire: 'GS2', records: { '1': 'on' }, takenByNo: '1000' })), true);
    await t('Yoklama: sorumlu başka alanın dersine (alan alanını değiştirse de) yoklama giremez', setDoc(doc(hd, 'attendance/G3-2026-10-26'), ga({ lessonId: 'G3', lessonFire: 'GS3', area: 'tiyatro' })), false);
    await t('Yoklama: sorumlu takenByNo farklı olsa da öğretmen yetkisiyle yazar', setDoc(doc(hd, 'attendance/G2-2026-10-27'), ga({ lessonId: 'G2', lessonFire: 'GS2', date: '2026-10-27', takenByNo: '1000' })), true);
    await t('Yoklama: sorumlu programda olmayan ders belgesini yazamaz', setDoc(doc(hd, 'attendance/G9-2026-10-26'), ga({ lessonId: 'G9', lessonFire: 'GS9' })), false);
    await t('Yoklama: sorumlu (öğretmen olarak) belge kimliğini öğretmenle aynı serbestlikte yazar', setDoc(doc(hd, 'attendance/X-2026-10-26'), ga()), true);
    await t('Kart: sorumlu öğrenci kartını okutabilir', getDoc(doc(hd, 'cards/' + 'a'.repeat(32))), true);
  }
  // Kişisel silme (userHidden): herkes yalnız KENDİ gizleme listesini yazar/okur
  await t('Gizleme: öğretmen kendi listesine yazar', setDoc(doc(teacher, 'userHidden/uid-11202601@ogretmen.aat'), { msgs: ['M1'], anns: ['AH1'] }), true);
  await t('Gizleme: öğrenci kendi listesine yazar', setDoc(doc(student, 'userHidden/uid-10202601@ogrenci.aat'), { anns: ['AH1'] }), true);
  await t('Gizleme: kendi listesini okur', getDoc(doc(teacher, 'userHidden/uid-11202601@ogretmen.aat')), true);
  await t('Gizleme: başkasının listesine YAZAMAZ', setDoc(doc(teacher, 'userHidden/uid-10202601@ogrenci.aat'), { msgs: ['M1'] }), false);
  await t('Gizleme: başkasının listesini OKUYAMAZ', getDoc(doc(student, 'userHidden/uid-11202601@ogretmen.aat')), false);
  await t('Gizleme: yönetici de başkasının listesini OKUYAMAZ', getDoc(doc(admin, 'userHidden/uid-11202601@ogretmen.aat')), false);
  await t('Gizleme: tanımsız alan YAZAMAZ', setDoc(doc(teacher, 'userHidden/uid-11202601@ogretmen.aat'), { x: 1 }), false);
  await t('Gizleme: girişsiz YAZAMAZ', setDoc(doc(anon, 'userHidden/x'), { msgs: [] }), false);
  console.log(results.join('\n'));
  console.log(results.filter(r => r.startsWith('❌')).length + ' başarısız / ' + results.length);
  await env.cleanup();
  process.exit(0);
})();
