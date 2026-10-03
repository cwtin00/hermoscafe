HERMOS CAFE - FIREBASE QR MENU / FINAL

1) Firebase Realtime Database Rules:
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}

2) Firebase Authentication > Sign-in method > Email/Password aktif olmalı.
3) Authentication > Users bölümünde admin e-posta/şifre hesabı oluşturulmalı.
4) admin.html üzerinden giriş yapılır.

ADMIN PANEL:
- Kategori ekleme
- Kategori adını değiştirme
- Kategori aktif/pasif
- Kategori sırası ↑ / ↓
- Kategori silme
- Seçilen kategoriye ürün ekleme
- Ürün adı/açıklama/fiyat/fotoğraf adı düzenleme
- Ürün aktif/pasif
- Ürün sırası ↑ / ↓
- Ürün silme

ÖNEMLİ:
Canlı menünün veri kaynağı HTML değil Firebase Realtime Database'dir.
Admin panelden örneğin fiyat 100 TL yapılırsa site tekrar deploy edilse bile eski HTML fiyatına dönmez.
Deploy işlemi Firebase verisini değiştirmez.

İlk kurulumda veritabanı boşsa admin panelde “İlk menüyü aktar” butonu görünür.
Bu buton sadece veritabanı tamamen boşken başlangıç verisini aktarır.

Ürün fotoğrafları image/ klasöründedir.
Admin panelde fotoğraf alanına sadece dosya adı yazılır (ornek.webp gibi).
