import { signIn, signUp, signInWithGoogle, resetPassword } from '../auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';

export function renderAuthPage(mode = 'login') {
  const container = document.getElementById('auth-form-inner');
  if (!container) return;

  if (mode === 'signup') {
    renderSignup(container);
  } else if (mode === 'forgot') {
    renderForgotPassword(container);
  } else {
    renderLogin(container);
  }
}

function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-form-title">Hoş Geldiniz!</div>
    <p class="auth-form-sub">Hesabınıza giriş yapın</p>
    <button class="social-btn" id="google-signin">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Google ile Devam Et
    </button>
    <div class="auth-divider">veya</div>
    <form id="login-form">
      <div class="form-group">
        <label class="form-label">E-posta</label>
        <div class="input-group">
          <i class="fas fa-envelope input-icon-left"></i>
          <input type="email" name="email" class="form-input" placeholder="ornek@email.com" required autocomplete="email">
        </div>
      </div>
      <div class="form-group">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label class="form-label">Şifre</label>
          <a href="#" class="btn btn-ghost btn-xs" id="forgot-link" style="font-size:0.75rem">Şifremi Unuttum</a>
        </div>
        <div class="input-group">
          <i class="fas fa-lock input-icon-left"></i>
          <input type="password" name="password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
          <button type="button" class="input-icon-right icon-btn" id="toggle-pw"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <div id="login-error" class="form-error hidden"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top:16px" id="login-btn">
        <i class="fas fa-sign-in-alt"></i> Giriş Yap
      </button>
    </form>
    <p class="auth-switch">Hesabınız yok mu? <a href="#" id="to-signup">Kayıt Olun</a></p>
  `;

  bindLoginEvents(container);
}

function bindLoginEvents(container) {
  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');
  const togglePw = container.querySelector('#toggle-pw');
  const pwInput = container.querySelector('[name="password"]');

  togglePw?.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    togglePw.innerHTML = `<i class="fas fa-eye${isText ? '' : '-slash'}"></i>`;
  });

  container.querySelector('#google-signin')?.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      toast.error(e.message);
    }
  });

  container.querySelector('#forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderForgotPassword(container);
  });

  container.querySelector('#to-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderSignup(container);
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#login-btn');
    const data = new FormData(form);
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      await signIn(data.get('email'), data.get('password'));
      // Auth state change will redirect
    } catch (err) {
      errorEl.textContent = translateAuthError(err.message);
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  });
}

function renderSignup(container) {
  container.innerHTML = `
    <div class="auth-form-title">Hesap Oluştur</div>
    <p class="auth-form-sub">Topluluğa katılmak için kayıt olun</p>
    <button class="social-btn" id="google-signup">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Google ile Kayıt Ol
    </button>
    <div class="auth-divider">veya</div>
    <form id="signup-form">
      <div class="grid-2" style="gap:12px">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Ad Soyad</label>
          <input type="text" name="fullName" class="form-input" placeholder="Adınız Soyadınız" required autocomplete="name">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Kullanıcı Adı</label>
          <div class="input-group">
            <span class="input-icon-left" style="font-size:0.85rem">@</span>
            <input type="text" name="username" class="form-input" placeholder="kullanici_adi" required autocomplete="username" pattern="[a-zA-Z0-9_]{3,20}">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">E-posta</label>
        <div class="input-group">
          <i class="fas fa-envelope input-icon-left"></i>
          <input type="email" name="email" class="form-input" placeholder="ornek@email.com" required autocomplete="email">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Şifre <span class="form-hint">(en az 8 karakter)</span></label>
        <div class="input-group">
          <i class="fas fa-lock input-icon-left"></i>
          <input type="password" name="password" class="form-input" placeholder="••••••••" required minlength="8" autocomplete="new-password">
          <button type="button" class="input-icon-right icon-btn" id="toggle-pw2"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Araç Tipi</label>
        <select name="vehicleType" class="form-select">
          <option value="motorcycle">🏍️ Motosiklet</option>
          <option value="bicycle">🚲 Bisiklet</option>
          <option value="both">🔄 Her İkisi</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <div id="signup-error" class="form-error hidden"></div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;margin:12px 0">
        <input type="checkbox" name="terms" id="terms" required style="margin-top:3px;flex-shrink:0">
        <label for="terms" style="font-size:0.8rem;color:var(--text-3);cursor:pointer">
          <a href="#" style="color:var(--primary)">Kullanım Şartları</a> ve <a href="#" style="color:var(--primary)">Gizlilik Politikası</a>'nı kabul ediyorum
        </label>
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-lg" id="signup-btn">
        <i class="fas fa-user-plus"></i> Hesap Oluştur
      </button>
    </form>
    <p class="auth-switch">Zaten hesabınız var mı? <a href="#" id="to-login">Giriş Yapın</a></p>
  `;

  const togglePw = container.querySelector('#toggle-pw2');
  const pwInput = container.querySelector('[name="password"]');
  togglePw?.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    togglePw.innerHTML = `<i class="fas fa-eye${isText ? '' : '-slash'}"></i>`;
  });

  container.querySelector('#google-signup')?.addEventListener('click', async () => {
    try { await signInWithGoogle(); } catch (e) { toast.error(e.message); }
  });

  container.querySelector('#to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderLogin(container);
  });

  const form = container.querySelector('#signup-form');
  const errorEl = container.querySelector('#signup-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#signup-btn');
    const data = new FormData(form);
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      await signUp(data.get('email'), data.get('password'), data.get('username'), data.get('fullName'));
      container.innerHTML = `
        <div style="text-align:center;padding:40px 0">
          <div style="font-size:4rem;margin-bottom:16px">📧</div>
          <h2 style="margin-bottom:12px">E-postanızı Kontrol Edin</h2>
          <p style="color:var(--text-3);margin-bottom:24px">Hesabınızı doğrulamak için size bir e-posta gönderdik.</p>
          <button class="btn btn-primary" id="back-to-login">Giriş Sayfasına Dön</button>
        </div>
      `;
      container.querySelector('#back-to-login')?.addEventListener('click', () => renderLogin(container));
    } catch (err) {
      errorEl.textContent = translateAuthError(err.message);
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  });
}

function renderForgotPassword(container) {
  container.innerHTML = `
    <div class="auth-form-title">Şifremi Unuttum</div>
    <p class="auth-form-sub">E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>
    <form id="forgot-form">
      <div class="form-group">
        <label class="form-label">E-posta</label>
        <div class="input-group">
          <i class="fas fa-envelope input-icon-left"></i>
          <input type="email" name="email" class="form-input" placeholder="ornek@email.com" required>
        </div>
      </div>
      <div id="forgot-error" class="form-error hidden" style="margin-bottom:12px"></div>
      <button type="submit" class="btn btn-primary btn-full btn-lg" id="forgot-btn">
        <i class="fas fa-paper-plane"></i> Sıfırlama Bağlantısı Gönder
      </button>
    </form>
    <p class="auth-switch"><a href="#" id="back-login"><i class="fas fa-arrow-left"></i> Giriş Sayfasına Dön</a></p>
  `;

  container.querySelector('#back-login')?.addEventListener('click', (e) => {
    e.preventDefault(); renderLogin(container);
  });

  const form = container.querySelector('#forgot-form');
  const errorEl = container.querySelector('#forgot-error');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#forgot-btn');
    const data = new FormData(form);
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      await resetPassword(data.get('email'));
      container.innerHTML = `
        <div style="text-align:center;padding:40px 0">
          <div style="font-size:4rem;margin-bottom:16px">✅</div>
          <h2 style="margin-bottom:12px">Bağlantı Gönderildi</h2>
          <p style="color:var(--text-3);margin-bottom:24px">E-postanızı kontrol edin ve şifrenizi sıfırlayın.</p>
          <button class="btn btn-primary" id="back-to-login">Giriş Sayfasına Dön</button>
        </div>
      `;
      container.querySelector('#back-to-login')?.addEventListener('click', () => renderLogin(container));
    } catch (err) {
      errorEl.textContent = translateAuthError(err.message);
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  });
}

function translateAuthError(msg) {
  const errors = {
    'Invalid login credentials': 'E-posta veya şifre hatalı.',
    'Email not confirmed': 'E-posta adresinizi doğrulayın.',
    'User already registered': 'Bu e-posta adresi zaten kayıtlı.',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı.',
    'Invalid email': 'Geçersiz e-posta adresi.'
  };
  return errors[msg] || msg || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
