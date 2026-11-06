// Öğretmen kılavuz videosu (sessiz, Kürtçe + Türkçe altyazı, demo veri). Çalıştırma: tools/video/README.md
const { put, signUp, recorder, login } = require('./lib');
(async () => {
  const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const DAYS = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'];
  const today = new Date(), TODAY = ymd(today), KUD = DAYS[today.getDay()], YKUD = DAYS[(today.getDay() + 6) % 7];
  // ── Demo veri ──
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T1', { id: 'T1', no: '50202601', name: 'Mamoste Dilovan', area: 'muzik' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' }); await put('teachers/T2', { id: 'T2', no: '50202602', name: 'Mamoste Stran', area: 'muzik' });
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'muzik' }); await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Muzîkê', area: 'muzik', isHead: true });
  await put('idx_staff/96000002', { no: '96000002', lvl: 'head', area: 'genel' }); await put('teachers/HG', { id: 'HG', no: '96000002', name: 'Berpirsê Giştî', area: 'genel', isHead: true });
  const sts = [['20202601', 'Rojîn Aram'], ['20202602', 'Baran Şêx'], ['20202603', 'Hêlîn Dem'], ['20202604', 'Azad Roj'], ['20202605', 'Zelal Kaya']];
  for (const [i, [no, name]] of sts.entries()) { await put('idx_students/' + no, { no }); await put('students/S' + (i + 1), { no, name, area: 'muzik', fireId: 'S' + (i + 1) }); }
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'muzik', studentNos: sts.map(s => s[0]), teacherNos: ['50202601'], teacherNames: ['Mamoste Dilovan'] });
  await put('schedule/L1', { id: 11, fireId: 'L1', classId: 'C1', area: 'muzik', name: 'Solfej', lessonType: 'main', day: KUD, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Ode 2' });
  await put('schedule/L2', { id: 12, fireId: 'L2', classId: 'C1', area: 'muzik', name: 'Teorî', lessonType: 'main', day: YKUD, start: '10:00', end: '11:00', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Ode 1' });
  await put('schedule/L3', { id: 13, fireId: 'L3', classId: 'C1', area: 'muzik', name: 'Koro', lessonType: 'main', day: KUD, start: '00:10', end: '23:50', teacherNo: '50202602', teacherName: 'Mamoste Stran', loc: 'Salon' });
  await put('lessonSubs/L3_' + TODAY, { lessonFire: 'L3', date: TODAY, teacherNo: '50202601', teacherName: 'Mamoste Dilovan', area: 'muzik', byNo: '96000001' });

  const R = await recorder({ out: process.env.VIDEO_OUT, width: 430, height: 860, name: 'ogretmen' });
  const { page: p, wait, step } = R;
  const go = k => p.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  await login(p, '50202601', 'Tea12345');
  await step('Rêbera Mamosteyan', 'Öğretmen kullanım kılavuzu', { pre: 3200, post: 300 });
  await step('1 · Têketin: jimara û şîfreya xwe binivîse', '1 · Giriş: numaranızı ve şifrenizi yazın', { ring: 'input.inp', pre: 2600, post: 800 });
  await step('', '', { pre: 200, act: async () => { await p.getByText('Têkeve', { exact: true }).last().click(); await wait(6500); }, post: 300 });
  await step('2 · Panela mamoste: pêşî Kurte vekin', '2 · Öğretmen paneli: önce Özet (Kurte) bölümünü açın', { ring: '.pano-tile[data-key="home"]', pre: 2600, act: async () => { await go('home'); await wait(1800); }, post: 600 });
  await step('Dersên ku amadebûna wan nehatiye girtin li vir xuya dibin', 'Yoklaması girilmemiş dersler burada görünür', { ring: '[data-noatt-card]', pre: 3200 });
  await step('3 · Amadebûna dersek bi destan bigire (mînak: Teorî)', '3 · Yoklamayı elle girme (örnek: Teorî dersi)', { ring: '[data-noatt-fix]', pre: 2800, act: async () => { await p.locator('[data-noatt-fix]').first().click(); await wait(1500); }, post: 500 });
  await step('Ji bo her xwendekar: Hat · Dereng · Nehat · Destûrî', 'Her öğrenci için: Geldi · Geç · Gelmedi · İzinli', { pre: 3500 });
  await step('Rojîn nehat, Baran dereng hat', 'Rojîn gelmedi, Baran geç geldi', { pre: 1600, act: async () => { await p.evaluate(() => { const rows = [...document.querySelectorAll('[data-fix-row]')]; const r = n => rows.find(x => x.textContent.includes(n)); const rr = r('Rojîn'), bb = r('Baran'); if (rr) { const b = rr.querySelector('[data-fv="off"]'); b && b.click(); } if (bb) { const b = bb.querySelector('[data-fv="late"]'); b && b.click(); } }); await wait(900); }, post: 1500 });
  await step('Tomar bike: yek carî li jêr', 'Kaydet: listenin altındaki tek düğme', { ring: '[data-fix-save]', pre: 2400, act: async () => { await p.locator('[data-fix-save]').click(); await wait(1800); }, post: 800 });
  await step('4 · Roja îro: dersê dest pê bike', '4 · Bugünün dersi: dersi başlatın', { pre: 2200, act: async () => { await go('attendance'); await wait(1500); } });
  await step('Dersa xwe hilbijêre (Solfej)', 'Dersinizi seçin (Solfej)', { pre: 2000, act: async () => { await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Solfej') && x.textContent.includes('📅')); b && b.click(); }); await wait(1200); } });
  await step('QR vebike: xwendekar bi têlefona xwe dixwînin', 'QR kodu açın: öğrenciler telefonlarıyla okutur', { pre: 3200 });
  await step('Kê nexwendibe, bi dest nîşan bike: Hat · Dereng · Nehat', 'Okutmayanları elle işaretleyin: Geldi · Geç · Gelmedi', { pre: 1500, act: async () => { await p.evaluate(() => { const rows = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Hêlîn Dem') && d.querySelectorAll('.att-btn').length === 3); const row = rows.pop(); row && row.querySelectorAll('.att-btn')[1].click(); }); await wait(1000); }, post: 1600 });
  await step('Tomar bike: hemû forma yek e û li jêr e', 'Kaydet: her ekranda aynı ve listenin altında', { pre: 2600, post: 1200 });
  await step('5 · Dema ku dersek ji te re hat girêdan (Koro)', '5 · Size günlük görev verilen ders (Koro)', { pre: 2400, act: async () => { await go('home'); await wait(1500); } });
  await step('Berpirsê beşê te ji bo îro wekî berpirsiyar danî: ders tenê îro di bernameya te de ye', 'Bölüm sorumlusu sizi bugün için görevlendirdi: ders yalnız bugün programınızda görünür', { pre: 4200 });
  await step('6 · Sinifa Min: erk, belge û peyam', '6 · Sınıfım: ödev, belge ve mesaj', { pre: 2200, act: async () => { await go('myclass'); await wait(1800); } });
  await step('Erk û belge: ji tevahiya sinifê re an tenê ji xwendekarên taybet re', 'Ödev ve belge: tüm sınıfa ya da yalnızca seçtiğiniz öğrencilere', { ring: '[data-post-to]', pre: 3200 });
  await step('Mînak: tenê ji Rojîn û Baran re erka taybet', 'Örnek: yalnızca Rojîn ve Baran\'a özel ödev', { pre: 1400, act: async () => { await p.click('[data-to="pick"]'); await wait(500); await p.locator('[data-pick-st="20202601"] input').check(); await p.locator('[data-pick-st="20202602"] input').check(); await p.locator('input[placeholder="Sernav"]').fill('Gama Do major'); await p.locator('textarea').first().fill('Her roj 15 deqe bixebitin.'); }, post: 3000 });
  await step('Peyam: bi rêveber, berpirsan û mamosteyên beşa xwe re biaxive', 'Mesaj: yönetici, sorumlular ve bölümünüzdeki öğretmenlerle yazışın', { pre: 1500, act: async () => { await p.click('[data-hub-tab="messages"]'); await wait(800); await p.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await wait(900); }, post: 1500 });
  await step('Wergir: Rêveber · Berpirsê beşê · Berpirsê giştî · Mamosteyên beşa min · Xwendekar', 'Alıcı: Yönetici · Bölüm sorumlusu · Genel sorumlu · Bölümümün öğretmenleri · Öğrenci', { pre: 4200 });
  await step('Tenê bi xwendekarên sinifa xwe re diaxive', 'Öğrencilerle yalnız kendi sınıfınızın öğrencileri arasından yazışırsınız', { pre: 3200 });
  await step('7 · Xwendekarên Min', '7 · Öğrencilerim', { pre: 1800, act: async () => { await go('students'); await wait(1800); } });
  await step('Tenê xwendekarên sinifên te tên nîşandan', 'Yalnızca sınıflarınızdaki öğrenciler listelenir', { pre: 3200 });
  await step('Spas! Pirsgirêk hebe, bi berpirsê beşê re biaxive', 'Teşekkürler! Sorunuz olursa bölüm sorumlunuza yazın', { pre: 3500, post: 500 });
  console.log('VIDEO', await R.finish());
})().catch(e => { console.error('VIDEO HATA', e); process.exit(1); });
