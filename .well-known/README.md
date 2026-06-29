# Digital Asset Links (Play Store TWA)

`assetlinks.json`, Android uygulamanızın (TWA) bu siteyle eşleştiğini
Google'a doğrular. Olmadan TWA içinde tarayıcı adres çubuğu görünür ve
doğrulama başarısız olur.

## Yapılması gerekenler

1. **Paket adı**: `com.aramtigran.akademi` (manifest/Bubblewrap ile aynı olmalı).
2. **SHA-256 parmak izi**: Uygulamanızın imza sertifikasından alın.
   - Google Play **App Signing** kullanıyorsanız parmak izini
     **Play Console > Setup > App integrity > App signing key certificate**
     sayfasından kopyalayın.
   - Yerel keystore için:
     ```
     keytool -list -v -keystore my-release-key.jks -alias my-alias
     ```
   Çıkan `SHA256` değerini `assetlinks.json` içindeki
   `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` yerine yapıştırın.
3. Yayınlandıktan sonra şu adresin erişilebilir olduğunu doğrulayın:
   `https://akademiyaramtigran.github.io/.well-known/assetlinks.json`
4. Doğrulama testi:
   `https://developers.google.com/digital-asset-links/tools/generator`

## Notlar
- APK/AAB üretimi için **Bubblewrap** veya **PWABuilder** kullanın.
- Birden fazla imza (debug + release) varsa diziye birden fazla
  parmak izi ekleyebilirsiniz.
