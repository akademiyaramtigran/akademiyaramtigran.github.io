# Kullanım kılavuzu videoları

Sessiz, Kürtçe (üst) + Türkçe (alt) altyazılı, demo verili kılavuz videoları üretir.

```
ffmpeg Playwright için: /opt/pw-browsers/ffmpeg-1013/ffmpeg-linux (sistem ffmpeg'i, libvpx-vp9 destekli) gerekir
statik sunucu: python3 -m http.server 8765  (depo kökünde)
VIDEO_OUT=/tmp/video CHROME_PATH=<chromium> firebase emulators:exec --only auth,firestore,functions,storage --project aram2026-a9fd7 "node tools/video/ogretmen.js"
VIDEO_OUT=/tmp/video CHROME_PATH=<chromium> firebase emulators:exec --only auth,firestore,functions,storage --project aram2026-a9fd7 "node tools/video/sorumlu.js"
ffmpeg -i ogretmen.webm -c:v libx264 -pix_fmt yuv420p -crf 24 -an out.mp4
```
Altyazı metinleri `ogretmen.js` / `sorumlu.js` içindeki `step('<Kürtçe>', '<Türkçe>', …)` çağrılarındadır.
