// Aylık analiz bildirimi için saf hesaplar (Firestore'a dokunmaz; tools/aylik-risk-testi.js ile test edilir)
function istanbulYm() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return p.year + "-" + p.month;
}
const ymShift = (ym, k) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + k, 1)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); };
const ymEnd = ym => { const [y, m] = ym.split("-").map(Number); return ym + "-" + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0"); };
// Saf hesap (test edilebilir): ay M için alan bazında risk sayıları
// Değerlendirme yalnız sorumlunun formlarından (evalResponses); eski haftalık değerlendirme kaldırıldı
function monthlyRiskCounts({ students, schedule, teachers, att, efr, M }) {
  const P = ymShift(M, -1), mF = M + "-01", mT = ymEnd(M), pF = P + "-01", pT = ymEnd(P);
  const lsById = new Map(schedule.map(l => [String(l.id), l])), stById = new Map(students.map(s => [String(s.id), s])), stByNo = new Map(students.map(s => [String(s.no), s]));
  const tcByNo = new Map(teachers.map(t => [String(t.no), t]));
  const agg = (f, t, onlyGenel) => { const A = { st: new Map(), ls: new Map(), tc: new Map() };
    const inc = (m, k, v) => { if (!k) return; const x = m.get(k) || { on: 0, late: 0, off: 0 }; if (x[v] != null) x[v]++; m.set(k, x); };
    att.forEach(d => { if (!d.date || d.date < f || d.date > t || d.teacherAbsent || !d.records) return; const l = lsById.get(String(d.lessonId)) || {};
      if (onlyGenel && l.area !== "genel") return;
      Object.entries(d.records).forEach(([sid, v]) => { if (!stById.has(String(sid))) return; inc(A.st, String(sid), v); inc(A.ls, String(d.lessonId), v); inc(A.tc, String(l.teacherNo || ""), v); }); });
    return A; };
  const pct = x => { if (!x) return null; const n = x.on + x.late + x.off; return n >= 2 ? Math.round((x.on + x.late) / n * 100) : null; };
  const ev = { st: new Map(), tc: new Map() }; const add = (m, k, sc) => { if (!k || sc == null || isNaN(sc)) return; const x = m.get(k) || []; x.push(sc); m.set(k, x); };
  efr.forEach(r => { const p = String(r.period || ""); const dt = /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : /^\d{4}-\d{2}$/.test(p) ? p + "-01" : ""; if (!dt || dt < mF || dt > mT || r.score10 == null) return;
    if (r.direction === "t2s") { const s = stByNo.get(String(r.targetNo)); if (s) add(ev.st, String(s.id), Number(r.score10)); } else if (r.direction === "s2t") add(ev.tc, String(r.targetNo), Number(r.score10)); });
  const avg = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const risky = (a, pa, e, withEv) => { const at = pct(a), pat = pct(pa); return (at != null && at < 70) || (at != null && pat != null && pat - at >= 15) || (withEv && e != null && e < 5); };
  const C = agg(mF, mT, false), Pv = agg(pF, pT, false), CG = agg(mF, mT, true), PG = agg(pF, pT, true);
  const counts = {}; const bump = (ar, k, attOnly) => { if (!ar) return; const x = counts[ar] = counts[ar] || { st: 0, ls: 0, tc: 0, ast: 0, als: 0, atc: 0 }; x[k]++; if (attOnly) x["a" + k]++; };
  C.st.forEach((a, id) => { const s = stById.get(id); if (!s) return; if (risky(a, Pv.st.get(id), avg(ev.st.get(id)), true)) bump(s.area, "st", risky(a, Pv.st.get(id), null, false)); });
  CG.st.forEach((a, id) => { if (risky(a, PG.st.get(id), null, false)) bump("genel", "st", true); });
  C.ls.forEach((a, id) => { const l = lsById.get(id); if (l && risky(a, Pv.ls.get(id), null, false)) bump(l.area, "ls", true); });
  C.tc.forEach((a, no) => { const t = tcByNo.get(no); if (!t) return; if (risky(a, Pv.tc.get(no), avg(ev.tc.get(no)), true)) bump(t.area, "tc", risky(a, Pv.tc.get(no), null, false)); });
  return counts;
}
// Çocuk Akademisi: ders günü = o gün dersin sınıfından en az bir çocuğun "in" kaydı olan gün; izinli gün sayılmaz
function kidRiskCounts({ kids, cls, sched, att, leaves, efr, M, today }) {
  const P = ymShift(M, -1);
  const stat = (f, t) => { const end = t < today ? t : today; const came = new Set();
    att.forEach(a => { if (a.type === "in" && a.date >= f && a.date <= end) { came.add(a.date + "|k" + (a.kidId || "")); came.add(a.date + "|n" + (a.kidNo || "")); } });
    const cameK = (k, dt) => came.has(dt + "|k" + k._id) || came.has(dt + "|n" + (k.no || ""));
    const onLeave = (no, dt, lid) => leaves.some(l => l.kid && String(l.studentNo) === String(no) && l.from <= dt && dt <= l.to && (!(l.lessonIds || []).length || (l.lessonIds || []).map(String).includes(String(lid))));
    const K = { kid: new Map(), lesson: new Map(), teacher: new Map() };
    const bump = (m, k, ar) => { const o = m.get(k) || { held: 0, came: 0, leave: 0, area: ar }; m.set(k, o); return o; };
    sched.forEach(L => { const c = L.classId ? cls.find(x => x._id === L.classId) : null;
      const roster = kids.filter(k => c ? (c.studentNos || []).map(String).includes(String(k.no)) : (L.area && k.area === L.area)); if (!roster.length) return;
      const ar = L.area || roster[0].area || ""; const st0 = L.createdAt && L.createdAt.toDate ? L.createdAt.toDate().toISOString().slice(0, 10) : ""; const start = [f, st0].sort().pop();
      let dates = [];
      if (L.date) dates = [L.date].filter(x => x >= start && x <= end);
      else if (start <= end) { const dd = new Date(start + "T12:00:00Z"); while (dd.getUTCDay() !== (+L.day || 0)) dd.setUTCDate(dd.getUTCDate() + 1); for (; dd.toISOString().slice(0, 10) <= end; dd.setUTCDate(dd.getUTCDate() + 7)) dates.push(dd.toISOString().slice(0, 10)); }
      dates = dates.filter(dt => roster.some(k => cameK(k, dt)));
      const tk = String(L.teacherNo || L.teacher || "");
      roster.forEach(k => dates.forEach(dt => { const f2 = cameK(k, dt) ? "came" : onLeave(k.no, dt, L._id) ? "leave" : null;
        const xs = [bump(K.kid, String(k.no), k.area), bump(K.lesson, L._id, ar)].concat(tk ? [bump(K.teacher, tk, ar)] : []);
        xs.forEach(x => { x.held++; if (f2) x[f2]++; }); })); });
    return K; };
  const pct = x => { if (!x) return null; const n = x.held - x.leave; return n >= 2 ? Math.round(x.came / n * 100) : null; };
  const mF = M + "-01", mT = ymEnd(M), C = stat(mF, mT), Pv = stat(P + "-01", ymEnd(P));
  const ev = { kid: new Map(), teacher: new Map() }; const add = (m, k, v) => { if (!k || v == null || isNaN(v)) return; const x = m.get(k) || []; x.push(v); m.set(k, x); };
  efr.forEach(r => { const p = String(r.period || ""); const dt = /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : /^\d{4}-\d{2}$/.test(p) ? p + "-01" : ""; if (!dt || dt < mF || dt > mT || r.score10 == null) return;
    if (r.direction === "t2k") add(ev.kid, String(r.targetNo), Number(r.score10)); else if (r.direction === "g2t") add(ev.teacher, String(r.targetNo), Number(r.score10)); });
  const avg = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const counts = {}; const bump2 = (ar, k, attOnly) => { if (!ar) return; const x = counts[ar] = counts[ar] || { st: 0, ls: 0, tc: 0, ast: 0, als: 0, atc: 0 }; x[k]++; if (attOnly) x["a" + k]++; };
  const risk = (x, px, e) => { const a = pct(x), pa = pct(px); const attR = (a != null && a < 70) || (a != null && pa != null && pa - a >= 15); return { any: attR || (e != null && e < 5), att: attR }; };
  C.kid.forEach((x, no) => { const r = risk(x, Pv.kid.get(no), avg(ev.kid.get(no))); if (r.any) bump2(x.area, "st", r.att); });
  C.lesson.forEach((x, id) => { const r = risk(x, Pv.lesson.get(id), null); if (r.any) bump2(x.area, "ls", r.att); });
  C.teacher.forEach((x, id) => { const r = risk(x, Pv.teacher.get(id), avg(ev.teacher.get(id))); if (r.any) bump2(x.area, "tc", r.att); });
  return counts;
}

module.exports = { istanbulYm, ymShift, ymEnd, monthlyRiskCounts, kidRiskCounts };
