# Firebase Güvenlik — Firestore Kuralları

Bu repodaki `firestore.rules`, en kritik açığı kapatır: şu anki kurallar
muhtemelen **"giriş yapan herkes her koleksiyonu okuyup yazabilir"**
durumunda. Yeni kurallarla **öğrenciler** artık:

- başka öğrenci/öğretmen kayıtlarını **değiştiremez/silemez**,
- ders programı, duyuru, anket, istatistik ve uygulama ayarlarını
  (`config`) **değiştiremez**,
- kendilerine **`isAdmin: true`** verip **yönetici olamaz**.

Öğrenciler hâlâ yapabilir: kendi profilini/şifresini güncelleme, QR ile
yoklamaya giriş, anket cevabı gönderme, mesaj gönderme.

> Rol, Firebase Auth e-postasının uzantısından anlaşılır:
> `@ogrenci.aat` = öğrenci, `@ogretmen.aat` = öğretmen/yönetici.

---

## 1) Önce TEST et (yayınlamadan)

1. [Firebase Console](https://console.firebase.google.com) → projeyi aç
   (`aram2026-a9fd7`).
2. **Build → Firestore Database → Rules** sekmesi.
3. Sağ üstte **Rules Playground**'u aç ve şu senaryoları dene:

| Senaryo | Auth (email) | İşlem | Yol | Beklenen |
|---|---|---|---|---|
| Öğrenci başka öğrenciyi düzenler | `10202601@ogrenci.aat` | update | `/students/{başka}` | **Denied** |
| Öğrenci kendi şifresini değiştirir | `10202601@ogrenci.aat` | update | `/students/{kendi}` | Allowed |
| Öğrenci kendini admin yapar | `10202601@ogrenci.aat` | update (isAdmin=true) | `/students/{kendi}` | **Denied** |
| Öğretmen öğrenci ekler | `11202601@ogretmen.aat` | create | `/students/{yeni}` | Allowed |
| Öğrenci programı değiştirir | `…@ogrenci.aat` | write | `/schedule/{x}` | **Denied** |
| Öğrenci QR check-in | `…@ogrenci.aat` | write | `/attendance/{x}` | Allowed |

> "Kendi" testinde, dokümanın `no` alanı e-posta önekiyle (ör. `10202601`)
> aynı olmalı.

## 2) Yayınla

Playground sonuçları beklenen gibiyse: `firestore.rules` içeriğini
Rules editörüne **yapıştır → Publish**.

## 3) Yayından hemen sonra duman testi (gerçek uygulamada)

- Bir **öğrenci** hesabıyla gir: profil görünüyor mu, QR ile yoklamaya
  girebiliyor mu, şifre değiştirebiliyor mu?
- Bir **öğretmen** hesabıyla gir: öğrenci ekleme/düzenleme, ders programı,
  yoklama kaydı, QR açma çalışıyor mu?
- Bir **yönetici** ile gir: kullanıcı oluşturma çalışıyor mu?

Bir şey kırılırsa hemen **geri al** (aşağı).

## 4) Geri alma (acil durum)

Sorun olursa Rules editörüne aşağıdakini yapıştırıp **Publish** et —
eski (gevşek ama çalışan) duruma döner:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Kalan riskler / sonraki adımlar

- **Okuma hâlâ geniş:** Giriş yapmış her kullanıcı tüm öğrenci/öğretmen
  kayıtlarını (PII + şifre hash'leri) okuyabilir; çünkü uygulama tüm
  listeyi istemciye yüklüyor. Bunu "yalnızca kendi verisi + öğretmen
  kendi alanı" düzeyine indirmek **istemci tarafında** sorgu bazlı
  yeniden yapılandırma ister (ayrı bir iş).
- **Şifre hash'i tuzsuz SHA‑256:** Okuma kısıtlanana kadar, sızdırılan
  hash'ler (özellikle "1234" gibi varsayılanlar) kırılabilir. Varsayılan
  şifreleri ilk girişte zorunlu değiştirmek önerilir.
- `attendance` / `messages` yazımı şimdilik "giriş yapan herkes"; istenirse
  öğrencinin yalnızca kendi kaydını yazmasına daraltılabilir.
