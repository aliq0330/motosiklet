import { getUser, getProfile, updateProfile, signOut } from '../auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { escapeHtml } from '../utils/helpers.js';
import { db } from '../supabase-client.js';

export async function renderSettings() {
  const content = document.getElementById('page-content');
  const user = getUser();
  const profile = getProfile();

  if (!user) { navigate('/login'); return; }

  content.innerHTML = `<div class="page page-sm page-enter">
    <h1 style="font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--sp-2)">Ayarlar</h1>
    <p style="color:var(--text-3);margin-bottom:var(--sp-8)">Hesap ve uygulama tercihlerinizi yönetin</p>

    <div class="settings-sections">

      <div class="settings-section">
        <div class="settings-section-title"><i class="fas fa-user"></i> Hesap Bilgileri</div>
        <form id="account-form">
          <div style="padding:var(--sp-5) var(--sp-6)">
            <div class="grid-2" style="gap:var(--sp-4)">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Ad Soyad</label>
                <input type="text" name="full_name" class="form-input" value="${escapeHtml(profile?.full_name || '')}" maxlength="60">
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Kullanıcı Adı</label>
                <div class="input-group">
                  <span class="input-icon-left">@</span>
                  <input type="text" name="username" class="form-input" value="${escapeHtml(profile?.username || '')}" pattern="[a-zA-Z0-9_]{3,20}" required>
                </div>
              </div>
            </div>
            <div class="form-group" style="margin-top:var(--sp-4);margin-bottom:0">
              <label class="form-label">Biyografi</label>
              <textarea name="bio" class="form-textarea" maxlength="200" rows="3">${escapeHtml(profile?.bio || '')}</textarea>
            </div>
            <div class="form-group" style="margin-top:var(--sp-4);margin-bottom:0">
              <label class="form-label">Şehir</label>
              <input type="text" name="location" class="form-input" value="${escapeHtml(profile?.location || '')}" placeholder="İstanbul, Türkiye">
            </div>
            <div class="form-group" style="margin-top:var(--sp-4);margin-bottom:0">
              <label class="form-label">Araç Tipi</label>
              <select name="vehicle_type" class="form-select">
                <option value="motorcycle" ${profile?.vehicle_type === 'motorcycle' ? 'selected' : ''}>🏍️ Motosiklet</option>
                <option value="bicycle" ${profile?.vehicle_type === 'bicycle' ? 'selected' : ''}>🚲 Bisiklet</option>
                <option value="both" ${profile?.vehicle_type === 'both' ? 'selected' : ''}>🔄 Her İkisi</option>
              </select>
            </div>
            <div id="account-error" class="form-error hidden" style="margin-top:var(--sp-3)"></div>
          </div>
          <div style="padding:var(--sp-4) var(--sp-6);border-top:1px solid var(--border);display:flex;justify-content:flex-end">
            <button type="submit" class="btn btn-primary" id="save-account-btn"><i class="fas fa-save"></i> Kaydet</button>
          </div>
        </form>
      </div>

      <div class="settings-section">
        <div class="settings-section-title"><i class="fas fa-envelope"></i> E-posta & Şifre</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">E-posta Adresi</div>
            <div class="settings-item-desc">${escapeHtml(user.email || '')}</div>
          </div>
        </div>
        <div style="padding:var(--sp-4) var(--sp-6);border-top:1px solid var(--border)">
          <form id="password-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Yeni Şifre</label>
              <input type="password" name="new_password" class="form-input" placeholder="Yeni şifreniz" minlength="8" autocomplete="new-password">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Şifre Tekrar</label>
              <input type="password" name="confirm_password" class="form-input" placeholder="Şifreyi tekrarlayın" autocomplete="new-password">
            </div>
            <div id="pw-error" class="form-error hidden"></div>
            <div><button type="submit" class="btn btn-outline" id="change-pw-btn"><i class="fas fa-key"></i> Şifreyi Değiştir</button></div>
          </form>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title"><i class="fas fa-bell"></i> Bildirimler</div>
        ${renderToggleItem('notif-email', 'E-posta Bildirimleri', 'Etkinlik ve takipçi bildirimleri için e-posta al', true)}
        ${renderToggleItem('notif-new-follower', 'Yeni Takipçi', 'Biri sizi takip ettiğinde bildirim al', true)}
        ${renderToggleItem('notif-event', 'Etkinlik Bildirimleri', 'Yaklaşan etkinlikler için hatırlatmalar', true)}
        ${renderToggleItem('notif-message', 'Mesaj Bildirimleri', 'Yeni mesaj geldiğinde bildirim al', true)}
        ${renderToggleItem('notif-route-comment', 'Yorum Bildirimleri', 'Rotanıza yorum yapıldığında bildirim al', false)}
      </div>

      <div class="settings-section">
        <div class="settings-section-title"><i class="fas fa-shield-alt"></i> Gizlilik</div>
        ${renderToggleItem('privacy-profile', 'Herkese Açık Profil', 'Profiliniz arama sonuçlarında görünsün', true)}
        ${renderToggleItem('privacy-routes', 'Varsayılan Rota Görünürlüğü', 'Yeni rotalar herkese açık oluştursun', true)}
        ${renderToggleItem('privacy-activity', 'Aktivite Geçmişi', 'Aktiviteleriniz takipçilerinize görünsün', true)}
      </div>

      <div class="settings-section">
        <div class="settings-section-title"><i class="fas fa-paint-brush"></i> Görünüm</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Tema</div>
            <div class="settings-item-desc">Açık veya koyu tema seçin</div>
          </div>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn btn-sm btn-outline" id="theme-light-btn" onclick="setTheme('light')"><i class="fas fa-sun"></i> Açık</button>
            <button class="btn btn-sm btn-outline" id="theme-dark-btn" onclick="setTheme('dark')"><i class="fas fa-moon"></i> Koyu</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Tehlikeli Bölge</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Hesabı Sil</div>
            <div class="settings-item-desc">Tüm verileriniz kalıcı olarak silinir, geri alınamaz</div>
          </div>
          <button class="btn btn-danger btn-sm" id="delete-account-btn"><i class="fas fa-trash"></i> Hesabı Sil</button>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Çıkış Yap</div>
            <div class="settings-item-desc">Tüm cihazlardan çıkış yapın</div>
          </div>
          <button class="btn btn-outline btn-sm" id="settings-logout-btn"><i class="fas fa-sign-out-alt"></i> Çıkış Yap</button>
        </div>
      </div>

    </div>
  </div>`;

  bindSettingsEvents();
}

function renderToggleItem(id, label, desc, checked) {
  return `<div class="settings-item">
    <div class="settings-item-info">
      <div class="settings-item-label">${label}</div>
      <div class="settings-item-desc">${desc}</div>
    </div>
    <label class="toggle-switch">
      <input type="checkbox" class="toggle-input" id="${id}" ${checked ? 'checked' : ''}>
      <span class="toggle-slider"></span>
    </label>
  </div>`;
}

function bindSettingsEvents() {
  // Account form
  document.getElementById('account-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-account-btn');
    const errEl = document.getElementById('account-error');
    const data = new FormData(e.target);
    btn.disabled = true; btn.classList.add('btn-loading');
    errEl.classList.add('hidden');
    try {
      await updateProfile({
        full_name: data.get('full_name'),
        username: data.get('username'),
        bio: data.get('bio'),
        location: data.get('location'),
        vehicle_type: data.get('vehicle_type')
      });
      toast.success('Hesap bilgileri güncellendi!');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.classList.remove('btn-loading');
    }
  });

  // Password form
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('change-pw-btn');
    const errEl = document.getElementById('pw-error');
    const data = new FormData(e.target);
    const pw = data.get('new_password');
    const conf = data.get('confirm_password');
    errEl.classList.add('hidden');
    if (pw !== conf) { errEl.textContent = 'Şifreler eşleşmiyor'; errEl.classList.remove('hidden'); return; }
    if (pw.length < 8) { errEl.textContent = 'Şifre en az 8 karakter olmalı'; errEl.classList.remove('hidden'); return; }
    btn.disabled = true; btn.classList.add('btn-loading');
    try {
      await db.auth().updateUser({ password: pw });
      toast.success('Şifre güncellendi!');
      e.target.reset();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.classList.remove('btn-loading');
    }
  });

  // Logout
  document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
    await signOut();
    navigate('/');
  });

  // Delete account
  document.getElementById('delete-account-btn')?.addEventListener('click', () => {
    toast.warning('Bu özellik yakında eklenecek. Hesap silmek için destek@motoroute.com ile iletişime geçin.');
  });

  // Theme buttons
  const currentTheme = document.documentElement.dataset.theme;
  if (currentTheme === 'light') document.getElementById('theme-light-btn')?.classList.add('btn-primary');
  else document.getElementById('theme-dark-btn')?.classList.add('btn-primary');
}

window.setTheme = function(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  document.getElementById('theme-light-btn')?.classList.toggle('btn-primary', theme === 'light');
  document.getElementById('theme-light-btn')?.classList.toggle('btn-outline', theme !== 'light');
  document.getElementById('theme-dark-btn')?.classList.toggle('btn-primary', theme === 'dark');
  document.getElementById('theme-dark-btn')?.classList.toggle('btn-outline', theme !== 'dark');
};
