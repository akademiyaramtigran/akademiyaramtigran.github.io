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
t('kesinleşme: ders bitti ya da gün geçti; ders sürerken kesin değil', () => {
  assert.equal(D.isFinal({ date: '2026-11-05' }, '2026-11-05'), false);
  assert.equal(D.isFinal({ date: '2026-11-05', endedAt: 1 }, '2026-11-05'), true);
  assert.equal(D.isFinal({ date: '2026-11-04' }, '2026-11-05'), true);
  assert.equal(D.buildRows('13-2026-11-05', { lessonId: 13, date: '2026-11-05', records: { 101: 'off' } }, idx, '2026-11-05')[0].data.final, false);
  assert.equal(D.buildRows('13-2026-11-05', { lessonId: 13, date: '2026-11-05', endedAt: 5, records: { 101: 'off' } }, idx, '2026-11-05')[0].data.final, true);
});
t('bildirim: DERS SÜRERKEN (Kaydet ile geçici "yok") bildirim yok', () => {
  const ch = D.notifyChanges(null, { date: '2026-11-05', records: { 101: 'off', 102: 'late' } }, '2026-11-05');
  assert.equal(ch.length, 0);
});
t('bildirim: ders bitince (endedAt geldi) bütün geç/yok bir kez bildirilir; katıldı bildirilmez', () => {
  const before = { date: '2026-11-05', records: { 101: 'off', 102: 'on', 103: 'late' } };
  const after = { ...before, endedAt: 9 };
  assert.deepEqual(D.notifyChanges(before, after, '2026-11-05').map(x => x.sid + ':' + x.status).sort(), ['101:off', '103:late']);
});
t('bildirim: kesinleşmiş derste yalnız yeni değişiklikler (aynı durum yeniden bildirilmez)', () => {
  const ch = D.notifyChanges({ date: '2026-11-01', records: { 101: 'off', 102: 'on' } }, { date: '2026-11-01', records: { 101: 'off', 102: 'late', 103: 'on', 104: 'off' } }, '2026-11-05');
  assert.deepEqual(ch.map(x => x.sid + ':' + x.status), ['102:late', '104:off']);
  assert.equal(D.notifyChanges(null, { date: '2026-11-01', records: { 1: 'on', 2: 'leave' } }, '2026-11-05').length, 0);
});
t('bildirim metinleri üç dilde', () => { ['ku', 'tr', 'en'].forEach(l => assert.ok(D.txd(l, 'off', 'Ders').includes('Ders'))); });
console.log(n + ' test geçti');
