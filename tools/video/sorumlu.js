// Bölüm sorumlusu kılavuz videosu (sessiz, Kürtçe + Türkçe altyazı, demo veri). Çalıştırma: tools/video/README.md
const { put, signUp, recorder, login } = require('./lib');
(async () => {
  const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const DAYS = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'];
  const today = new Date(), KUD = DAYS[today.getDay()];
  const back = n => ymd(new Date(Date.now() - n * 86400000));
  // ── Demo veri ──
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'muzik' }); await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Muzîkê', area: 'muzik', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T1', { id: 'T1', no: '50202601', name: 'Mamoste Dilovan', area: 'muzik' });
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' }); await put('teachers/T2', { id: 'T2', no: '50202602', name: 'Mamoste Stran', area: 'muzik' });
  const sts = [['20202601', 'Rojîn Aram'], ['20202602', 'Baran Şêx'], ['20202603', 'Hêlîn Dem'], ['20202604', 'Azad Roj'], ['20202605', 'Zelal Kaya'], ['20202606', 'Cuma Tekin']];
  for (const [i, [no, name]] of sts.entries()) { await put('idx_students/' + no, { no }); await put('students/S' + (i + 1), { no, name, area: 'muzik', fireId: 'S' + (i + 1), id: 100 + i + 1 }); }
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'muzik', studentNos: ['20202601', '20202602', '20202603'], teacherNos: ['50202601'], teacherNames: ['Mamoste Dilovan'] });
  await put('schedule/L1', { id: 11, fireId: 'L1', classId: 'C1', area: 'muzik', name: 'Solfej', lessonType: 'main', day: KUD, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Ode 2' });
  await put('schedule/L2', { id: 12, fireId: 'L2', classId: 'C1', area: 'muzik', name: 'Teorî', lessonType: 'main', day: DAYS[(today.getDay() + 2) % 7], start: '10:00', end: '11:00', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Ode 1' });
  const att = (id, date, recs) => put('attendance/' + id + '-' + date, { lessonId: String(id), lessonFire: 'L' + (id - 10), lessonName: id === 11 ? 'Solfej' : 'Teorî', area: 'muzik', classId: 'C1', date, records: recs });
  await att(11, back(7), { S1: 'off', S2: 'late', S3: 'on' }); await att(11, back(14), { S1: 'on', S2: 'on', S3: 'leave' }); await att(11, back(21), { S1: 'off', S2: 'on', S3: 'on' });
  await put('messages/M1', { id: 1, from: 'Rojîn Aram', fromType: 'student', fromNo: '20202601', senderId: 's_1', to: 'Berpirsê beşê', subject: 'Îtiraza amadebûnê: Solfej', body: 'Ez di wê dersê de bûm, nîşana “nehat” şaş e.', toRole: 'head', toArea: 'muzik', type: 'question', read: false, time: back(1) + ' 10:30', isStudentFeedback: true, createdAt: new Date(Date.now() - 3600000) });

  const R = await recorder({ out: process.env.VIDEO_OUT, width: 430, height: 860, name: 'sorumlu' });
  const { page: p, wait, step } = R;
  const go = k => p.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const click = (t, root = 'button') => p.evaluate(([t, root]) => { const b = [...document.querySelectorAll(root)].filter(x => x.textContent.includes(t) && x.offsetParent).pop(); if (!b) throw new Error('yok: ' + t); b.scrollIntoView({ block: 'center' }); b.click(); }, [t, root]);
  const tab = (n, ku, tr, k, extra) => step(n + ' · ' + ku, n + ' · ' + tr, { pre: 2000, act: async () => { await go(k); await wait(1800); if (extra) await extra(); }, post: 1500 });
  await login(p, '96000001', 'Head1234');
  await step('Rêbera Berpirsên Beşan', 'Bölüm sorumlusu kullanım kılavuzu', { pre: 3200, post: 300 });
  await step('1 · Têketin: wekî mamoste bi jimara berpirsê xwe', '1 · Giriş: sorumlu numaranızla, "Mamoste" bölümünden', { ring: 'input.inp', pre: 2800, act: async () => { await p.getByText('Têkeve', { exact: true }).last().click(); await wait(6500); }, post: 500 });
  await step('2 · Panel: her kart karekî ye û mînakek heye', '2 · Panel: her kart bir bölümdür, hepsinde örnek var', { pre: 3800 });
  // 3 Ragihandin
  await tab('3', 'Ragihandin: ji xwendekarên beşa xwe re', 'Duyuru: kendi bölümünüzün öğrencilerine', 'announce');
  await step('Mînak: sernav û nivîs binivîse, paşê Bişîne', 'Örnek: başlık ve metni yazın, sonra Gönderin', { pre: 1500, act: async () => { await p.locator('input[placeholder^="Sernav"]').first().fill('Konsera Dawiya Hefteyê'); await p.locator('textarea').first().fill('Roja Şemiyê saet 15:00 di salonê de konser heye. Hemû xwendekar bên.'); }, post: 2500 });
  await step('Bişîne', 'Gönder', { pre: 1200, act: async () => { await click('Bişîne'); await wait(1500); }, post: 2200 });
  // 4 Peyam
  await tab('4', 'Peyam: îtirazên xwendekaran û peyamên mamosteyan', 'Mesaj: öğrenci itirazları ve öğretmen mesajları', 'messages');
  await step('Mînak: peyama îtirazê veke û bersiv bide', 'Örnek: itiraz mesajını açın ve yanıt yazın', { pre: 1400, act: async () => { await p.evaluate(() => { const e = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Îtiraza amadebûnê') && d.getAttribute('style') && /cursor/.test(d.getAttribute('style'))).pop(); e && e.click(); }); await wait(900); await p.locator('#hm-reply').fill('Spas, em amadebûna Solfejê kontrol dikin û rast dikin.'); }, post: 2400 });
  await step('Bersiv bide', 'Yanıtı gönderin', { pre: 1200, act: async () => { await click('Bersiv bide'); await wait(1500); }, post: 1800 });
  await step('🗑 Jê bibe: peyam ji gihîştiyan tê rakirin', '🗑 Sil: mesaj gelen kutusundan kaldırılır', { ring: '[data-msg-del]', pre: 2400, act: async () => { await p.click('[data-msg-del]'); await wait(1500); }, post: 1600 });
  // 5 Hişyarî
  await tab('5', 'Hişyarî: yoklama girilmedi, devamsızlık, nirxandin', 'Uyarılar: yoklama girilmedi, devamsızlık, değerlendirme', 'alerts');
  await step('Mînak: “Amadebûnê bike / rast bike” – berpirsê beşê bi xwe jî rast dike', 'Örnek: "Yoklamayı gir / düzelt" – bölüm sorumlusu kendisi de düzeltir', { ring: '[data-alert-fix]', pre: 2600, act: async () => { await p.locator('[data-alert-fix]').first().click(); await wait(1500); }, post: 2600 });
  await step('Hat · Dereng · Nehat · Destûrî hilbijêre û Tomar bike', 'Geldi · Geç · Gelmedi · İzinli seçin ve Kaydedin', { pre: 2000, act: async () => { await p.evaluate(() => { const r = [...document.querySelectorAll('[data-fix-row]')]; const f = n => r.find(x => x.textContent.includes(n)); const a = f('Rojîn'); a && a.querySelector('[data-fv="on"]') && a.querySelector('[data-fv="on"]').click(); }); await wait(600); await p.locator('[data-fix-save]').click(); await wait(1800); }, post: 1800 });
  // 6 Program
  await tab('6', 'Bernameya Dersan: ders, roj, saet û mamoste', 'Ders programı: ders, gün, saat ve öğretmen', 'schedule');
  await step('👥 Berpirsiyarê rojê: ji bo tenê yek rojê kesek din (an jî tu) amadebûnê digire', '👥 Günlük görevlendirme: yalnız bir gün için başka biri (ya da siz) yoklamayı alır', { ring: '[data-sub-lesson]', pre: 3600, act: async () => { await p.locator('[data-sub-lesson]').first().click(); await wait(1000); }, post: 1200 });
  await step('Mînak: Mamoste Stran îro li şûna Mamoste Dilovan e', 'Örnek: Mamoste Stran bugün Mamoste Dilovan yerine', { pre: 1400, act: async () => { await p.selectOption('[data-sub-teacher]', '50202602'); await wait(800); await p.click('[data-sub-save]'); await wait(1500); }, post: 2600 });
  await step('Mamosteyê dersê yê esasî nayê guhertin; tenê wê rojê', 'Dersin asıl öğretmeni değişmez; yalnızca o gün için', { pre: 3000, act: async () => { await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /^(✕|×|Girtin)$/.test((b.textContent || '').trim()) && b.offsetParent); x && x.click(); }); await wait(600); } });
  // 7 Mêvan, izin
  await tab('7', 'Amadebûna dersên mêvan: mînak şêwirmendê derve', 'Misafir ders yoklaması: örnek dışarıdan gelen eğitmen', 'gatt');
  await tab('8', 'Destûra Xwendekaran: mînak Rojîn ji bo rojekê destûr girt', 'Öğrenci izni: örnek Rojîn bir gün için izin aldı', 'leaves');
  // 9 Sınıf + atölye
  await tab('9', 'Sinif: sinifa nû çêke û mamosteyê sinifê diyar bike', 'Sınıf: yeni sınıf açın ve sınıf öğretmenini atayın', 'classes');
  await step('Mînak: “Koroya Dawiya Hefteyê” – mamoste û xwendekar hilbijêre', 'Örnek: "Hafta Sonu Korosu" – öğretmen ve öğrenci seçin', { pre: 1400, act: async () => { await click('➕ Sinifa nû'); await wait(700); await p.locator('input[aria-label="Navê sinifê"]').fill('Koroya Dawiya Hefteyê'); await p.locator('label', { hasText: 'Mamoste Stran' }).locator('input[type=checkbox]').check(); await p.locator('label', { hasText: 'Azad Roj' }).locator('input[type=checkbox]').check(); await p.locator('label', { hasText: 'Zelal Kaya' }).locator('input[type=checkbox]').check(); }, post: 2400 });
  await step('Atolye: bi nîşankirina vê qutiyê sinif ji akademiyê tê veqetandin', 'Atölye: bu kutuyu işaretleyin; sınıf akademiden ayrılır', { ring: 'input[data-class-ws]', pre: 2200, act: async () => { await p.locator('input[data-class-ws]').check(); }, post: 3000 });
  await step('Xwendekarên wê xwe bi xwe dibin xwendekarên atolyeyê û ji lîsteyên akademiyê derdikevin', 'Öğrencileri otomatik atölye öğrencisi olur; akademi listelerinde görünmez', { pre: 3800 });
  await step('Tomar bike', 'Kaydedin', { pre: 1200, act: async () => { await click('💾 Tomar bike'); await wait(1800); }, post: 2200 });
  // 10 nirxandin
  await tab('10', 'Formên nirxandinê: pirsên 1–10 ji mamoste û xwendekaran re', 'Değerlendirme formları: öğretmen ve öğrencilere 1–10 soruları', 'evalforms');
  // 11 Rapor
  await tab('11', 'Rapor: gav bi gav hilbijêre', 'Rapor: adım adım seçin', 'reports');
  await step('Çarçove: Akademî an Atolye', 'Kapsam: Akademi ya da Atölye', { ring: '[data-rw-scope]', pre: 3000 });
  await step('Cureyê raporê: Amadebûn', 'Rapor türü: Devam', { pre: 1200, act: async () => { await p.evaluate(() => document.querySelector('[data-rw-type="devam"]').click()); await wait(1500); }, post: 2000 });
  await step('Mînak: Mamoste Dilovan hilbijêre – tenê dersên wî tên nîşandan', 'Örnek: Mamoste Dilovan seçin – yalnızca dersleri listelenir', { ring: '[data-rep-teacher]', pre: 2200, act: async () => { await p.selectOption('[data-rep-teacher]', '50202601').catch(() => {}); await wait(1500); }, post: 2200 });
  await step('PDF û Excel: ji bo her dersê navên yên nehatî, derengmayî û destûrî tên nivîsîn', 'PDF ve Excel: her ders için gelmeyen, geç gelen ve izinli öğrencilerin adları yazılır', { ring: '[data-rw-csv]', pre: 4500 });
  await step('Atolye: heman rapor ji bo xwendekarên atolyeyê', 'Atölye: aynı rapor atölye öğrencileri için', { pre: 1400, act: async () => { await p.evaluate(() => { const b = document.querySelector('[data-rw-new]'); b && b.click(); }); await wait(900); await p.evaluate(() => { const b = document.querySelector('[data-rw-scope="ws"]'); b && b.click(); }); await wait(900); await p.evaluate(() => document.querySelector('[data-rw-type="devam"]').click()); await wait(1200); }, post: 2600 });
  // 12 Profil + öğretmen modu
  await tab('12', 'Profîl: agahiyên xwe û şîfreyê biguherîne', 'Profil: bilgilerinizi ve şifrenizi değiştirin', 'profile');
  await step('Berpirsê beşê dikare wekî mamoste jî ders bide: “Panela Mamoste”', 'Bölüm sorumlusu öğretmen olarak da ders verebilir: "Panela Mamoste"', { pre: 3800, post: 500 });
  await step('Spas! Hemû tişt di vê panelê de ye', 'Teşekkürler! Her şey bu panelde', { pre: 3500, post: 500 });
  console.log('VIDEO', await R.finish());
})().catch(e => { console.error('VIDEO HATA', e); process.exit(1); });
