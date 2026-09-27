# Üçüncü taraf kütüphaneler (depoda barındırılır)

CDN yerine buradan yüklenir: dış sunucu ele geçirilse bile uygulamaya kod enjekte edilemez
(tedarik zinciri saldırısı) ve sıkı Content-Security-Policy (`script-src 'self'`) mümkün olur.
Sürümler sabittir; güncellerken npm paketinden kopyalayın.

| Dosya | Paket | Lisans |
|---|---|---|
| react.production.min.js | react@18.2.0 (umd) | MIT |
| react-dom.production.min.js | react-dom@18.2.0 (umd) | MIT |
| babel.min.js | @babel/standalone@7.22.5 (yalnızca derleme önbelleği boşken) | MIT |
| qrcode.min.js | qrcodejs@1.0.0 | MIT |
| html2canvas.min.js | html2canvas@1.4.1 | MIT |
| jspdf.umd.min.js | jspdf@2.5.1 | MIT |
| jsQR.js | jsqr@1.4.0 | Apache-2.0 |
| email.min.js | @emailjs/browser@4.4.1 | BSD-3-Clause |
