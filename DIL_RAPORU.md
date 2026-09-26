# 🗣 Dil Sistemi ve Akademisyen Raporları

Sistem (mobil uygulama + ana sayfa) artık **4 dil** destekler:

| Kod | Dil | Durum |
|---|---|---|
| `ku` | Kurmancî | Ana dil — akademisyen **düzeltme** raporu açık |
| `zza` | Zazakî (Kirmanckî) | Akademisyen **çeviri** raporu açık; boş satırlar Kurmancî görünür |
| `tr` | Türkçe | Tamamlandı (817 uygulama metni + site) |
| `en` | English | Tamamlandı (kodda) |

Dil seçimi her yerde tam isimli açılır menüdür (Kurmancî · Zazakî · Türkçe · English).
Zazakî kodu uluslararası standart **`zza`** (ISO 639-3). Almanca (`de`) tamamen kaldırıldı. Eskiden Almanca seçmiş kullanıcılar otomatik
Kurmancî'ye döner.

## Rapor bağlantıları (akademisyenlere gönderin)

- **Kurmancî düzeltme raporu:** https://akademiyaramtigran.github.io/dil-raporu.html
- **Zazakî çeviri raporu:** https://akademiyaramtigran.github.io/dil-raporu-zazaki.html

Her rapor **1228 satır**dır ve koddan otomatik çıkarılmıştır (hiçbir ekran
atlanmaz): uygulamadaki tüm metinler + ana sayfa + sanat alanı adları +
**Akademiya Zarokan** (yönetim paneli, veli uygulaması, tanıtım/başvuru sayfası).
Satırlar 16 bölüme ayrılmıştır. Kurmancî raporunda Türkçe kalmış olabilecek ifadeler
"⚠ Türkçe kalmış olabilir" filtresiyle ayrıca görülebilir.

Akademisyen tarafında:
1. Adını yazar, sarı kutuları doldurur (tarayıcıda otomatik saklanır).
2. **📤 Gönder** → `dil-zazaki-2026-..json` / `dil-kurmanci-2026-..json` dosyası oluşur
   (telefonda doğrudan WhatsApp/e-posta paylaşımı açılır).
3. Birden fazla akademisyen: biri dosyayı **📥 Yükle** ile açıp devam edebilir.

## Entegrasyon (dosya gelince)

```bash
node tools/dil-entegre.js dil-zazaki-2026-10-01.json dil-kurmanci-2026-10-01.json
cd tools && npm install && node dil-rapor-uret.js   # raporları güncelle (dolu satırlar görünür)
git add app/lang-pack.js dil-raporu*.html && git commit -m "Dil: akademisyen raporları işlendi" && git push
```

Ya da dosyaları Claude'a verin: "bu raporları entegre et" demeniz yeterli.

`dil-entegre.js` güvenlik kontrolü yapar: `{0}` yer tutucuları uyuşmayan veya
HTML/JS içeren satırlar atlanır ve listelenir.

## Teknik yapı

- Kodda metinler Kurmancî kaynakla yazılır: `lang==="en" ? "English" : K("Kurmancî")`.
- `K()` çalışma anında `app/lang-pack.js` → `AAT_TX[dil][kurmancîMetin]` karşılığını
  döndürür; yoksa Kurmancî'yi (veya `AAT_TX.ku` düzeltmesini) gösterir.
- Kurmancî düzeltmeleri kaynak kodu değiştirmeden `AAT_TX.ku` üzerinden uygulanır.
- Site: `SITE_T` sözlüğü + `AAT_SITE` / `AAT_SITE_AREA` birleşimi.
- Basın paneli haber çevirisi sekmeleri: **KU · ZZA · TR · EN**.
- Akademiya Zarokan: sayfalardaki `zt` / `zs` sözlükleri + `AAT_ZAROK` / `AAT_ZAROK_SITE` birleşimi.
- Anket soruları: Kurmancî + Zazakî + Türkçe + English alanları.
- Kod değişince `tools/dil-rapor-uret.js` yeniden çalıştırılır; yeni metinler rapora
  kendiliğinden eklenir.
