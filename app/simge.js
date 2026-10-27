/* ── Ortak çizgi simge tablosu (ana uygulama + Çocuk Akademisi) ───────────────
   Emoji → simge adı (M), simge adı → SVG çizimi (P, 24×24, çizgi), renk tonu (T).
   Yeni emoji eklemek için yalnızca map(...) satırı eklenir. */
(function(){
  var P={
    warn:"M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
    ok:"M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
    check:"M20 6 9 17l-5-5",
    err:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM15 9l-6 6M9 9l6 6",
    close:"M18 6 6 18M6 6l12 12",
    school:"M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6",
    grad:"M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5M22 10v6",
    list:"M9 3h6v4H9zM15 5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3M9 12h6M9 16h4",
    plus:"M12 5v14M5 12h14",
    cal:"M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18",
    user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    lock:"M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
    unlock:"M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 7.9-1",
    save:"M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 3v5h8M7 21v-7h10v7",
    camera:"M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    trash:"M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
    wait:"M6 2h12M6 22h12M7 2v4l5 6 5-6V2M7 22v-4l5-6 5 6v4",
    file:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
    clip:"m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 1 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5",
    upload:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    download:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    msg:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    note:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 8h8M8 12h5",
    edit:"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    chart:"M3 3v18h18M18 17V9M13 17V5M8 17v-3",
    dot:"M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
    shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    globe:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
    pin:"M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    ann:"m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6",
    ban:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4.9 4.9l14.2 14.2",
    music:"M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    mask:"M4 4h16v7a8 8 0 0 1-16 0zM8.5 9h.01M15.5 9h.01M9 14a4 4 0 0 0 6 0",
    film:"M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4",
    palette:"M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2zM7.5 11.5h.01M10 7h.01M15 7h.01",
    image:"M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM21 15l-5-5L5 21",
    undo:"M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
    clock:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
    mail:"M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
    key:"M8 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM11.5 12.5 21 3M17 7l3 3M15 9l2 2",
    settings:"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
    eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    eyeoff:"M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2",
    star:"M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
    refresh:"M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5",
    info:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01",
    help:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
    pause:"M7 4h3v16H7zM14 4h3v16h-3z",
    stop:"M6 6h12v12H6z",
    prev:"M19 20 9 12l10-8zM5 19V5",
    tag:"M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01",
    inbox:"M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z",
    search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    book:"M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z",
    idcard:"M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 16a3 3 0 0 1 6 0M14 10h5M14 14h4",
    phone:"M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
    news:"M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2zM18 8h2a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h4",
    gift:"M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3a2 2 0 0 0 0 4c2 0 4 1 4 1zM12 8s1.5-5 4-5a2 2 0 0 1 0 4c-2 0-4 1-4 1z",
    spark:"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
    wifi:"M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01",
    folder:"M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
    bell:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
    home:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    heart:"M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z",
    tap:"M9 11V5a1.5 1.5 0 0 1 3 0v5M12 10V8.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 15a1.5 1.5 0 0 1 2.5-1.6L9 16",
    print:"M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
    swap:"M8 7l-5 5 5 5M16 7l5 5-5 5M3 12h18",
    hash:"M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
    ticket:"M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4zM14 6v12",
    target:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    trophy:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4",
    up:"M7 10v11M14 5.9 13 10h5.8a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.4 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3l4-8a3 3 0 0 1 3 3.9z",
    down:"M17 14V3M10 18.1 11 14H5.2a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 6.6 3H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3l-4 8a3 3 0 0 1-3-3.9z",
    dance:"M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8v6l-3 7M12 14l3 7M7 10l5-2 5 2",
    mic:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
    boxon:"M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM9 12l2 2 4-4",
    box:"M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
    sun:"M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    moon:"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    leaf:"M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16zM4 21c3-3 6-6 9-8",
    snow:"M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9",
    flask:"M9 2h6M10 2v7L4 20a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 20l-6-11V2",
    link:"M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
    bolt:"M13 2 3 14h9l-1 8 10-12h-9z"
  };
  var M={}, T={};
  function map(chars,n,tone){ Array.from(chars).forEach(function(c){ M[c]=n; if(tone) T[c]=tone; }); }
  map("⚠","warn","warn"); map("✅","ok","ok"); map("✓✔","check"); map("❌✗","err","err"); map("✕✖","close");
  map("🏫🏛","school"); map("🎓","grad"); map("📋","list"); map("➕","plus"); map("📅📆🗓","cal");
  map("👨👩👧👦👤🚸","user"); map("🔒🔐","lock"); map("🔓","unlock"); map("💾","save"); map("📷📸","camera");
  map("🗑","trash"); map("⏳⌛","wait"); map("📄📕📃","file"); map("📎","clip"); map("📤","upload"); map("📥","download");
  map("💬","msg"); map("📝","note"); map("✏✍","edit"); map("📊📈📉","chart"); map("🟢","dot","ok"); map("🔴","dot","err");
  map("🟡🟠","dot","warn"); map("⚪🔘","dot","mute"); map("🛡","shield"); map("🌐🌍","globe"); map("📍","pin"); map("📢📣","ann");
  map("🚫⛔","ban","err"); map("🎼🎵🎶","music"); map("🎭","mask"); map("🎬🎞","film"); map("🎨","palette"); map("🖼","image");
  map("↩","undo"); map("⏱⏰🕐🕒","clock"); map("✉📬📧📩📨","mail"); map("🔑","key"); map("⚙🛠🔧","settings"); map("👁","eye");
  map("🙈🕶","eyeoff"); map("⭐🌟","star","star"); map("🔄♻🔁","refresh"); map("💡","note"); map("❓❔","help"); map("⏸","pause");
  map("⏹","stop"); map("⏮","prev"); map("🏷","tag"); map("📭","inbox"); map("🔎🔍🔬","search"); map("📚📖","book");
  map("🪪📇","idcard"); map("📱📲☎","phone"); map("📰","news"); map("🎂🎉🎈🎁","gift"); map("✨","spark"); map("📡","wifi");
  map("🗂📁📂","folder"); map("🔔","bell"); map("🏠","home"); map("🏥🩺","heart"); map("👆","tap"); map("🖨","print");
  map("↔","swap"); map("🔢","hash"); map("🎟","ticket"); map("🎯","target"); map("🏆","trophy"); map("👍","up"); map("👎","down");
  map("💃","dance"); map("🎤","mic"); map("☑","boxon"); map("☐","box"); map("☀","sun"); map("🌙🌓","moon"); map("🌱🍂","leaf");
  map("❄","snow"); map("🧪","flask"); map("🔗","link"); map("ℹ","info"); map("⚡🚀","bolt");
  var RE=/(?:\p{Extended_Pictographic}|[✓✗↩↔])(?:\uFE0F|\u200D\p{Extended_Pictographic}\uFE0F?|[\u{1F3FB}-\u{1F3FF}])*/gu;
  var Q=/[\u2190-\u2BFF]|[\uD83C-\uD83E]/;
  function first(x){ return String.fromCodePoint(x.codePointAt(0)); }
  function strip(s){
    if(typeof s!=="string"||!Q.test(s)) return s;
    return s.replace(RE,function(x){ return M[first(x)]?"":x; }).replace(/^\s+/,"").replace(/ {2,}/g," ");
  }
  window.AAT_SIMGE={P:P,M:M,T:T,RE:RE,Q:Q,first:first,strip:strip};
})();
