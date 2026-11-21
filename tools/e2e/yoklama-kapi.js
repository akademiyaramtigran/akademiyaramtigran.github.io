// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E:// E2E: Yoklama kapısı — ders BAŞLATILMADAN işaretlenmez/kaydedilmez; başlatınca kaydedilir (kesin değil); kapatılmayan ders için öğretmene "dersi bitirin" uyarısı
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const TD = new Date().toISOString().slice(0, 10); const todayKu = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102]]) { await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  await put('schedule/LA', { id: 'LA', fireId: 'LA', area: 'tiyatro', classId: 'C1', name: 'Şano Yeni', day: todayKu, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  await put('schedule/LO', { id: 'LO', fireId: 'LO', area: 'tiyatro', classId: 'C1', name: 'Şano Açık', day: todayKu, start: '00:01', end: '00:02', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  await put('attendance/LO-' + TD, { lessonId: 'LO', lessonFire: 'LO', lessonName: 'Şano Açık', area: 'tiyatro', date: TD, startedAt: Date.now() - 3600000, records: { 101: 'on', 102: 'off' } });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const getDoc = id => fetch(`${FS}/attendance/${id}`, { headers: H }).then(r => r.json());
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('50202601'); await p.locator('input[type=password]').first().fill('Tea12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  // Ders kapatılmadı kartı (ders saati geçti, yoklama var)
  ok('Kapatılmamış ders için "dersi bitirin" uyarısı çıkar', (await p.locator('[data-noclose-card]').count()) === 1 && (await p.locator('[data-noclose-end]').count()) >= 1);
  await p.locator('[data-noclose-end]').first().click(); await p.waitForTimeout(2000);
  const lo = await getDoc('LO-' + TD);
  ok('Uyarıdan "Dersi bitir" deyince ders kesinleşir (endedAt)', !!(lo.fields && lo.fields.endedAt));
  ok('Kapatılınca uyarı kartı kalkar', (await p.locator('[data-noclose-card]').count()) === 0);
  // Yoklama kapısı
  await goA(p, 'attendance'); await p.waitForTimeout(1500);
  await p.click('[data-att-lesson="LA"]'); await p.waitForTimeout(1000);
  await p.locator('[data-att-mark="on"]').first().click(); await p.waitForTimeout(600);
  const t1 = await p.evaluate(() => document.body.innerText);
  ok('Başlatılmadan işaretlenemez: "önce dersi başlat" uyarısı', t1.includes('Pêşî dersê dest pê bike'));
  const a0 = await getDoc('LA-' + TD);
  ok('Başlatılmadan hiçbir yoklama kaydı yazılmadı', !(a0.fields && a0.fields.records));
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Dersê Dest Pê Bike'))[0].click()); await p.waitForTimeout(2000);
  await p.locator('[data-att-mark="on"]').first().click(); await p.waitForTimeout(400);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && /Tomar bike|Tomar/.test(x.textContent)).pop().click()); await p.waitForTimeout(2500);
  const a1 = await getDoc('LA-' + TD);
  ok('Başlatınca yoklama kaydedilir ama KESİNLEŞMEZ (dersi bitirene kadar sayılmaz)', !!(a1.fields && a1.fields.records) && !(a1.fields && a1.fields.endedAt));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
