// Saf mantık testi: functions/devam.js — çalıştırma: node tools/devam-testi.js
const assert = require('assert');
const D = require('../functions/devam');
let n = 0; const t = (ad, f) => { f(); n++; console.log('✅ ' + ad); };
const idx = D.studentIndex([{ id: 'F1', data: () => ({ no: '2020', name: 'Rojîn', id: 101 }) }, { id: 'F2', data: () => ({ no: '2021', name: 'Baran', id: 102 }) }]);
t('öğrenci dizini hem id hem belge kimliğiyle bulur', () => { assert.equal(idx.get('101').no, '2020'); assert.equal(idx.get('F2').no, '2021'); });
t('ders belgesi tanınır, QR / cihaz belgesi tanınmaz', () => {
  assert.deepEqual(D.lessonKey('13-2026-11-02', { records: {}, lessonId: '13' }), { lessonId: '13', date: '2026-11-02' });
  assert.equal(D.lessonKey('sess1_d_DEV', { sessionId: 's' }), null);
  assert.equal(D.lessonKey('s1_101', { studentNo: '2020' }), null);
});
t('satırlar: durum + öğrenci numarası, kayıtsız öğrenci atlanır', () => {
  const rows = D.buildRows('13-2026-11-02', { lessonId: 13, lessonName: 'Şano 1', area: 'tiyatro', takenBy: 'Hoca', records: { 101: 'off', F2: 'late', 999: 'on', 103: 'x' } }, idx);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, '13-2026-11-02-2020'); assert.equal(rows[0].data.status, 'off'); assert.equal(rows[1].data.status, 'late');
});
t('"ders yapılmadı" günü satır üretmez', () => assert.equal(D.buildRows('13-2026-11-02', { teacherAbsent: true, records: { 101: 'off' } }, idx).length, 0));
t('kesinleşme: KAYDEDİLEN her yoklama geçerli (dersi başlat / bitir yok); eski ve yeni tarih fark etmez', () => {
  assert.equal(D.isFinal({ date: '2026-12-05' }), true);
  assert.equal(D.isFinal({ date: '2026-11-05' }), true);
  assert.equal(D.isFinal({ date: '2026-12-05', endedAt: 1 }), true);
  assert.equal(D.isFinal(null), false);
  assert.equal(D.buildRows('13-2026-12-05', { lessonId: 13, date: '2026-12-05', records: { 101: 'off' } }, idx, '2026-12-05')[0].data.final, true);
  assert.equal(D.buildRows('13-2026-12-05', { lessonId: 13, date: '2026-12-05', records: { 101: 'off' } }, idx, '2026-12-05')[0].data.status, 'off');   // gelmeyen gelmedi olarak kalır
});
t('izin sonradan girilse de o günün "yok"u izinli olur; yalnız seçilen derse ya da tüm güne', () => {
  const leaves = [{ studentNo: '2020', from: '2026-12-05', to: '2026-12-06', reason: 'x' }, { studentNo: '2021', from: '2026-12-05', to: '2026-12-05', lessonIds: ['14'] }];
  const r = D.buildRows('13-2026-12-05', { lessonId: 13, date: '2026-12-05', endedAt: 1, records: { 101: 'off', 102: 'off' } }, idx, '2026-12-05', leaves);
  assert.equal(r.find(x => x.data.studentNo === '2020').data.status, 'leave');
  assert.equal(r.find(x => x.data.studentNo === '2021').data.status, 'off');      // izin başka derse özel
  const r2 = D.buildRows('13-2026-12-07', { lessonId: 13, date: '2026-12-07', endedAt: 1, records: { 101: 'off' } }, idx, '2026-12-07', leaves);
  assert.equal(r2[0].data.status, 'off');                                          // izin tarihi dışında
  const r3 = D.buildRows('13-2026-12-05', { lessonId: 13, date: '2026-12-05', endedAt: 1, records: { 101: 'on', 102: 'late' } }, idx, '2026-12-05', leaves);
  assert.deepEqual(r3.map(x => x.data.status), ['on', 'late']);                    // gelen izinli yapılmaz
});
t('ortak süzgeç: kayıtlı her ders sayılır, ders yapılmadı hariç; açık ders kavramı yok', () => {
  const docs = [{ date: '2026-12-01', endedAt: 1, records: { a: 'on' } }, { date: '2026-12-02', records: { a: 'off' } }, { date: '2026-12-03', teacherAbsent: true, records: { a: 'off' } }, { date: '2026-11-01', records: { a: 'on' } }, { date: '2026-12-04', records: {} }];
  assert.deepEqual(D.dvStatDocs(docs).map(d => d.date), ['2026-12-01', '2026-12-02', '2026-11-01']);
  assert.deepEqual(D.dvOpenDocs(docs).map(d => d.date), []);
});
t('yüzde: kayıt yoksa null (%0 DEĞİL); geç gelen gelmiş sayılır; izinli paydaya girmez', () => {
  assert.equal(D.dvPct(0, 0, 0), null); assert.equal(D.dvPct(1, 0, 3), 25); assert.equal(D.dvPct(2, 1, 1), 75); assert.equal(D.dvPct(0, 0, 2), 0);
});
t('istemci ve sunucu çekirdeği BİREBİR aynı', () => {
  const fs = require('fs'); const cut = f => { const t = fs.readFileSync(f, 'utf8'); const a = t.indexOf('/*DEVAMCORE-BEGIN*/'), b = t.indexOf('/*DEVAMCORE-END*/'); assert.ok(a >= 0 && b > a, f); return t.slice(a, b); };
  assert.equal(cut(require('path').join(__dirname, '../app/index.html')), cut(require('path').join(__dirname, '../functions/devam.js')));
});
t('bildirim: ilk kayıtta geç / yok bildirilir (katıldı bildirilmez)', () => {
  const ch = D.notifyChanges(null, { date: '2026-12-05', records: { 101: 'off', 102: 'late', 103: 'on' } }, '2026-12-05');
  assert.deepEqual(ch.map(x => x.sid + ':' + x.status).sort(), ['101:off', '102:late']);
});
t('bildirim: aynı kaydı tekrar kaydetmek yeniden bildirmez', () => {
  const before = { date: '2026-12-05', records: { 101: 'off', 102: 'on', 103: 'late' } };
  assert.deepEqual(D.notifyChanges(before, { ...before }, '2026-12-05'), []);
});
t('bildirim: kesinleşmiş derste yalnız yeni değişiklikler (aynı durum yeniden bildirilmez)', () => {
  const ch = D.notifyChanges({ date: '2026-11-01', records: { 101: 'off', 102: 'on' } }, { date: '2026-11-01', records: { 101: 'off', 102: 'late', 103: 'on', 104: 'off' } }, '2026-11-05');
  assert.deepEqual(ch.map(x => x.sid + ':' + x.status), ['102:late', '104:off']);
  assert.equal(D.notifyChanges(null, { date: '2026-11-01', records: { 1: 'on', 2: 'leave' } }, '2026-11-05').length, 0);
});
t('bildirim metinleri üç dilde', () => { ['ku', 'tr', 'en'].forEach(l => assert.ok(D.txd(l, 'off', 'Ders').includes('Ders'))); });
t('"dersi bitirin" hatırlatması artık yok: kaydedilen yoklama zaten geçerli', () => {
  const a = { date: '2026-12-05', records: { 1: 'on' } }, ls = { end: '12:00' };
  assert.equal(D.nagDue(a, ls, '2026-12-05', '12:15'), false);
  assert.equal(D.nagDue(a, ls, '2026-12-06', '08:00'), false);
});
console.log(n + ' test geçti');
