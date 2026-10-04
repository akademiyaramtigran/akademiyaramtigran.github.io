# ☁️ Cloud Functions — sunucu tarafı kullanıcı yönetimi

`functions/index.js` → tek fonksiyon: **`aatUser`** (bölge: `europe-west1`)

| İşlem | Ne yapar |
|---|---|
| `create` | Auth hesabı oluşturur (varsa şifresini günceller) |
| `setPassword` | **Eski şifre olmadan** şifre belirler |
| `delete` | Auth hesabını ve rol kaydını siler |

Yalnızca **yönetici** ve **öğrenci işleri** (`idx_staff.lvl` = admin / registrar) çağırabilir;
**basın çağıramaz**. Öğrenci işleri yalnızca öğrenci, veli, çocuk öğretmeni ve sıradan öğretmen
hesaplarına dokunabilir — yönetici / basın / öğrenci işleri hesaplarına ve kendi hesabına dokunamaz.
Emülatörde 17 senaryoyla test edildi (`tools/fonksiyon-testi.js`).

## Neden gerekli?
Tarayıcı başka bir kullanıcının Firebase Auth hesabını ancak **o kişinin eski şifresiyle**
değiştirebilir veya silebilir. Bu yüzden şu an şifreler düz metin (`_plainPass`) olarak
Firestore'da tutuluyor ve tüm personel görebiliyor. Fonksiyon açılınca:
- `_plainPass` artık **yazılmaz**; mevcutlar kaydın ilk güncellenmesinde silinir
- Silinen kullanıcının Auth hesabı gerçekten silinir ("hayalet hesap" kalmaz)
- Veli şifresi Öğrenci İşleri panelinden sıfırlanabilir (🔑)

## Kurulum (bir kez)
```bash
npm install -g firebase-tools
firebase login
cd functions && npm install && cd ..
firebase deploy --only functions
```
Uygulama **yalnızca sunucu modunda** çalışır (eski tarayıcı yolu — ikinci oturum, `kidSecrets` şifre kasası — kaldırıldı).
Fonksiyon yayında değilse kullanıcı oluşturma / şifre belirleme / silme hata verir.
Eski sürümden kalan düz metin şifre kopyalarını silmek için: GitHub → Actions → **Eski şifre kopyalarını sil** → `SİL`.

## İsteğe bağlı — son adım
Fonksiyon açıldıktan sonra Firebase Console → Authentication → Settings → User actions →
**"Enable create (sign-up)"** kapatılabilir: artık kimse istemciden hesap açamaz.
(Fonksiyonun yayında olduğundan emin olun.)

## Kurallar da buradan yayınlanabilir
```bash
firebase deploy --only firestore:rules,storage
```
