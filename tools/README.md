# Araçlar

```bash
cd tools && npm install
```

| Komut | Ne yapar |
|---|---|
| `npm run rapor` | Koddan dil raporlarını üretir (`dil-raporu.html`, `dil-raporu-zazaki.html`) |
| `node dil-entegre.js rapor.json …` | Akademisyen rapor dosyalarını `app/lang-pack.js`'e işler |
| `npm run kural-testi` | Firestore + Storage kuralları, 166 senaryo (Java 11+ gerekir) |
| `npm run fonksiyon-testi` | Cloud Function `aatUser`, 17 senaryo (önce `cd ../functions && npm install`) |
| `npm run e2e` | Uçtan uca: veli, öğrenci işleri, yönetim + basın + öğretmen, kart + kapı güvenliği, saldırı senaryoları (78 adım; her test kendi temiz emülatöründe) |
| `node zarok-paketle.js zarok.aramtigran.org` | Zarok'u kendi alan adına taşımak için `dist-zarok/` üretir |

## E2E çalıştırma
Depo kökünde bir yerel sunucu açın, sonra testi başlatın:
```bash
python3 -m http.server 8765        # depo kökünde, ayrı terminal
cd tools && CHROME_PATH=/yol/chrome npm run e2e
```
Testler `?emu=1` ile uygulamaları yerel Firebase emülatörlerine bağlar (yalnızca
`localhost`'ta çalışır; canlı sitede etkisizdir). Firebase SDK CDN istekleri yerel
`node_modules/firebase` derlemelerine yönlendirilir.
