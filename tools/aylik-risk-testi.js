// Aylık analiz bildirimi — saf hesap testi (emülatör gerekmez). Çalıştırma: node tools/aylik-risk-testi.js  (önce: cd functions && npm install)
const { monthlyRiskCounts, kidRiskCounts } = require('../functions/risk.js');
const out = []; const ok = (n, c, x) => out.push((c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''));
const base = { students: [{ id: 101, no: '1', area: 'tiyatro' }, { id: 102, no: '2', area: 'tiyatro' }, { id: 103, no: '3', area: 'muzik' }],
  schedule: [{ id: 11, area: 'tiyatro', teacherNo: '50' }, { id: 13, area: 'genel', teacherNo: '50' }, { id: 14, area: 'muzik', teacherNo: '60' }],
  teachers: [{ no: '50', area: 'tiyatro' }, { no: '60', area: 'muzik' }], tEvals: [], efr: [], M: '2026-10' };
const c = monthlyRiskCounts({ ...base,
  att: [{ date: '2026-10-05', lessonId: '11', records: { '101': 'off', '102': 'on' } }, { date: '2026-10-12', lessonId: '11', records: { '101': 'off', '102': 'on' } },
    { date: '2026-10-13', lessonId: '13', records: { '101': 'on', '103': 'off' } }, { date: '2026-10-14', lessonId: '13', records: { '101': 'on', '103': 'off' } },
    { date: '2026-10-15', lessonId: '14', records: { '103': 'on' } }, { date: '2026-10-16', lessonId: '14', records: { '103': 'on' } },
    // Eylül: müzik öğrencisi %100 → Ekim'de düşüş yok (%50 → yine de risk değil: ≥%70 değil? %50 < %70 → risk)
    { date: '2026-09-15', lessonId: '14', records: { '103': 'on' } }, { date: '2026-09-16', lessonId: '14', records: { '103': 'on' } }],
  sEvals: [{ wk: '2026-10-05', studentNo: '2', c: { p: 2, g: 2 } }] });
ok('Tiyatro: Rojîn (devam %50) + Baran (değerlendirme 4/10) risk; Öİ sayısında yalnız devam (1)', c.tiyatro && c.tiyatro.st === 2 && c.tiyatro.ast === 1, JSON.stringify(c.tiyatro));
ok('Müzik: Jîyan %50 (genel ders dahil) + geçen aya göre 50 puan düşüş → risk', c.muzik && c.muzik.st === 1, JSON.stringify(c.muzik));
ok('Genel sorumlu: yalnız genel ders devamından (Jîyan %0) — Rojîn genelde %100, risk değil', c.genel && c.genel.st === 1, JSON.stringify(c.genel));
ok('Ders riski: Şano 1 (%50) tiyatroda; genel ders (%50) genelde', c.tiyatro.ls === 1 && c.genel.ls === 1, JSON.stringify(c));
const c2 = monthlyRiskCounts({ ...base, att: [{ date: '2026-10-05', lessonId: '11', records: { '101': 'off' } }], sEvals: [] });
ok('Tek kayıt (en az 2 gerekir) → uyarı yok', !c2.tiyatro || c2.tiyatro.st === 0, JSON.stringify(c2));
// Çocuk Akademisi: Ekim pazartesileri 5/12/19/26 — ders yapılan günler (biri geldi): 5, 12, 19
const kids = [{ _id: 'K1', no: '8001', area: 'drama' }, { _id: 'K2', no: '8002', area: 'drama' }, { _id: 'K3', no: '8003', area: 'solfej' }];
const kc = kidRiskCounts({ kids, cls: [{ _id: 'C1', studentNos: ['8001', '8002'] }], sched: [{ _id: 'S1', classId: 'C1', area: 'drama', day: 1, teacher: 'Mamoste Berfîn' }],
  att: [{ type: 'in', kidId: 'K2', date: '2026-10-05' }, { type: 'in', kidId: 'K2', date: '2026-10-12' }, { type: 'in', kidId: 'K2', date: '2026-10-19' }, { type: 'in', kidId: 'K1', date: '2026-10-19' }],
  leaves: [{ kid: true, studentNo: '8001', from: '2026-10-12', to: '2026-10-12' }], kEvals: [], gEvals: [], efr: [{ direction: 't2k', targetNo: '8002', period: '2026-10', score10: 3 }], M: '2026-10', today: '2026-11-02' });
ok('Çocuk: Dilan 1/2 (izinli gün sayılmaz) → %50 risk; Azad %100 ama değerlendirme 3/10 → risk (Öİ: yalnız devam = 1)', kc.drama && kc.drama.st === 2 && kc.drama.ast === 1, JSON.stringify(kc));
ok('Çocuk: ders ve öğretmen katılımı (4/5 = %80) risk değil; başka alan yok', kc.drama && kc.drama.ls === 0 && kc.drama.tc === 0 && !kc.solfej, JSON.stringify(kc));
console.log(out.join('\n')); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
