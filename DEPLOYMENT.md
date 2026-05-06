# MotoRoute - Deployment Guide

## 1. Supabase Kurulumu

### Proje Oluştur
1. [supabase.com](https://supabase.com) adresine gidin
2. "New Project" butonuna tıklayın
3. Proje adı: `motoroute` (veya istediğiniz bir ad)
4. Güçlü bir veritabanı şifresi belirleyin
5. Bölge: `eu-central-1` (Frankfurt) önerilir

### Veritabanı Şemasını Uygula
1. Supabase Dashboard → SQL Editor
2. `supabase-setup.sql` dosyasının tüm içeriğini yapıştırın
3. "Run" butonuna tıklayın

### API Anahtarlarını Al
1. Dashboard → Settings → API
2. **Project URL**: `https://xxxxxxxx.supabase.co`
3. **Anon/Public Key**: `eyJhbGc...` ile başlayan uzun anahtar

### `js/config.js` Dosyasını Güncelle
```js
export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

---

## 2. Google OAuth (Opsiyonel)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. "Create Credentials" → OAuth 2.0 Client ID
3. Authorized redirect URIs: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google
5. Client ID ve Client Secret'i girin

---

## 3. GitHub Pages Deployment

### Repository Ayarları
1. GitHub'da `motosiklet` adında public bir repository oluşturun
2. Settings → Pages → Source: `Deploy from a branch`
3. Branch: `main` / `(root)`

### Dosyaları Push Et
```bash
cd /home/user/motosiklet
git init
git add .
git commit -m "feat: initial MotoRoute platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/motosiklet.git
git push -u origin main
```

### URL
Site şu adreste yayınlanır:
`https://YOUR_USERNAME.github.io/motosiklet/`

---

## 4. Supabase Auth Redirect URL

Authentication → URL Configuration:
- **Site URL**: `https://YOUR_USERNAME.github.io/motosiklet/`
- **Redirect URLs**: `https://YOUR_USERNAME.github.io/motosiklet/`

---

## 5. Supabase Email Templates (Opsiyonel)

Authentication → Email Templates:
- Türkçe e-posta şablonları için özelleştirin
- Confirm signup, Magic link, Reset password şablonlarını düzenleyin

---

## 6. Rate Limiting (Supabase)

Supabase Dashboard → Authentication → Rate Limits:
- Varsayılan limitler genellikle yeterlidir
- Production için artırabilirsiniz

---

## 7. Dosya Yapısı

```
motosiklet/
├── index.html           # Ana SPA shell
├── 404.html             # GitHub Pages SPA redirect
├── manifest.json        # PWA manifest
├── service-worker.js    # PWA service worker
├── supabase-setup.sql   # Veritabanı şeması
├── css/
│   ├── variables.css    # CSS custom properties & theming
│   ├── reset.css        # CSS reset
│   ├── main.css         # Ana layout & temel stiller
│   ├── components.css   # Kart, buton, form bileşenleri
│   ├── pages.css        # Sayfa-spesifik stiller
│   └── animations.css   # Animasyonlar & geçişler
├── js/
│   ├── app.js           # Ana giriş noktası & orchestrator
│   ├── config.js        # Konfigürasyon (Supabase keys)
│   ├── supabase-client.js # Supabase singleton client
│   ├── router.js        # Hash-based SPA router
│   ├── auth.js          # Authentication state management
│   ├── pages/
│   │   ├── auth-page.js    # Login/Signup/ForgotPassword
│   │   ├── dashboard.js    # Ana sayfa & feed
│   │   ├── discover.js     # Rota keşif & filtreleme
│   │   ├── route-detail.js # Rota detay & harita
│   │   ├── events.js       # Etkinlikler & RSVP
│   │   ├── create.js       # Rota/Etkinlik/Kulüp oluşturma
│   │   ├── profile.js      # Kullanıcı profili
│   │   ├── clubs.js        # Kulüpler
│   │   ├── messages.js     # Gerçek zamanlı mesajlaşma
│   │   └── settings.js     # Hesap ayarları
│   ├── components/
│   │   ├── toast.js        # Bildirim toastları
│   │   ├── modal.js        # Modal sistemi
│   │   └── notifications.js # Bildirim paneli & realtime
│   └── utils/
│       ├── api.js          # Tüm Supabase API çağrıları
│       └── helpers.js      # Yardımcı fonksiyonlar
```

---

## 8. Özellikler Listesi

- ✅ Kullanıcı kayıt/giriş (email + Google OAuth)
- ✅ Rota oluşturma (harita üzerinde çizim + GPX import)
- ✅ Rota keşfetme (filtreler, arama, harita görünümü)
- ✅ Etkinlik oluşturma ve RSVP sistemi
- ✅ Kulüp kurma ve üyelik
- ✅ Gerçek zamanlı mesajlaşma (Supabase Realtime)
- ✅ Bildirim sistemi (realtime)
- ✅ Kullanıcı takip sistemi
- ✅ Rota yorum ve puanlama
- ✅ Profil sayfası & istatistikler
- ✅ Açık/Koyu tema desteği
- ✅ PWA (Progressive Web App)
- ✅ Mobil uyumlu tasarım
- ✅ Global arama
- ✅ GitHub Pages uyumlu SPA routing

---

## 9. Geliştirme Notları

### Gerçek Veri Entegrasyonu
- Supabase config'i güncelledikten sonra tüm özellikler gerçek veriyle çalışır
- Kayıt olan ilk kullanıcı veritabanına otomatik eklenir

### Harita Özellikleri
- Leaflet.js ile interaktif harita
- Leaflet Draw ile rota çizimi
- GPX dosyası import/export
- Gerçek koordinatlarla çalışır

### Performance
- Lazy loading (resimler)
- Infinite scroll (route/event listeleri)
- Debounced search
- Supabase query optimizasyonu

### Güvenlik
- Row Level Security (RLS) tüm tablolarda aktif
- Input sanitization (escapeHtml)
- Rate limiting (Supabase tarafında)
- HTTPS zorunlu (GitHub Pages varsayılan)
