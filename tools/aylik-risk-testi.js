// Aylık analiz bildirimi — saf hesap testi (emülatör gerekmez). Çalıştırma: node tools/aylik-risk-testi.js  (önce: cd functions && npm install)
const { monthlyRiskCounts } = require('../functions/index.js');
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
console.log(out.join('\n')); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
