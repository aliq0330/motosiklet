# MotoRoute - Claude Code Talimatları

## Zorunlu Git Kuralı

**Her branch'te yapılan değişiklik, commit sonrasında MUTLAKA `main` branch'e de taşınmalıdır.**

### Standart Çalışma Akışı

Her değişiklikten sonra şu adımları takip et:

```bash
# 1. Değişiklikleri mevcut branch'e commit et
git add <dosyalar>
git commit -m "açıklama"
git push origin <branch-adı>

# 2. main branch'e de taşı
git checkout main
git merge <branch-adı> --ff-only
git push origin main

# 3. Çalışma branch'ine geri dön
git checkout <branch-adı>
```

### Kısa Yol (tek komut)
```bash
git push origin HEAD:main
```

## Proje Hakkında

**MotoRoute** — Motosiklet ve bisiklet topluluğu platformu.

- **Teknoloji**: Vanilla JS (ES Modules), Supabase, Leaflet.js
- **Hosting**: GitHub Pages (`https://aliq0330.github.io/motosiklet/`)
- **Backend**: Supabase (Auth, DB, Realtime, Storage)

## Dosya Yapısı

```
css/          → Stil dosyaları (variables, main, components, pages, animations)
js/
  app.js      → Ana giriş noktası, router, auth
  config.js   → Supabase URL & Key (buraya dokunma, canlı key var)
  auth.js     → Authentication
  router.js   → Hash-based SPA router
  pages/      → Sayfa modülleri
  components/ → Toast, Modal, Notifications
  utils/      → API çağrıları, helpers
```

## Önemli Notlar

- `js/config.js` dosyasındaki Supabase bilgilerini **silme veya değiştirme**
- Tüm sayfalar `#/path` hash routing ile çalışır
- Yeni sayfa eklerken `js/app.js` içindeki `setupRoutes()` fonksiyonuna route ekle
- CSS değişkenleri `css/variables.css` içinde tanımlı, buradan yönet
