import { signIn, signUp, signInWithGoogle, resetPassword } from '../auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';

export function renderAuthPage(mode = 'login') {
  const container = document.getElementById('auth-form-inner');
  if (!container) return;

  if (mode === 'signup') renderSignup(container);
  else if (mode === 'forgot') renderForgotPassword(container);
  else renderLogin(container);
}

/* ===== LOGIN ===== */
function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-form-title">Hoş Geldiniz!</div>
    <p class="auth-form-sub">Hesabınıza giriş yapın</p>

    <button type="button" class="social-btn" id="google-signin-btn">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google ile Devam Et
    </button>

    <div class="auth-divider">veya</div>

    <form id="login-form" novalidate>
      <div class="form-group">
        <label class="form-label">E-posta</label>
        <div class="input-group">
          <i class="fas fa-envelope input-icon-left"></i>
          <input type="email" name="email" class="form-input" placeholder="ornek@email.com"
                 required autocomplete="email" inputmode="email">
        </div>
      </div>
      <div class="form-group">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2)">
          <label class="form-label" style="margin-bottom:0">Şifre</label>
          <button type="button" class="btn btn-ghost btn-xs" id="forgot-link" style="font-size:0.75rem;padding:2px 6px">Şifremi Unuttum</button>
        </div>
        <div class="input-group">
          <i class="fas fa-lock input-icon-left"></i>
          <input type="password" name="password" class="form-input" placeholder="••••••••"
                 required autocomplete="current-password" id="login-pw-input">
          <button type="button" class="input-icon-right icon-btn" id="toggle-pw" tabindex="-1">
            <i class="fas fa-eye" id="pw-eye-icon"></i>
          </button>
        </div>
      </div>

      <div id="login-error" class="form-error hidden" style="margin-bottom:var(--sp-3)">
        <i class="fas fa-exclamation-circle"></i> <span id="login-error-text"></span>
      </div>

      <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-submit-btn">
        <i class="fas fa-sign-in-alt"></i> Giriş Yap
      </button>
    </form>

    <p class="auth-switch">Hesabınız yok mu?
      <button type="button" class="btn btn-ghost" id="to-signup-btn"
              style="font-weight:700;color:var(--primary);padding:0;font-size:inherit">
        Kayıt Olun
      </button>
    </p>
  `;

  // Şifre göster/gizle
  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    const inp = document.getElementById('login-pw-input');
    const icon = document.getElementById('pw-eye-icon');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    icon.className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });

  // Google
  document.getElementById('google-signin-btn')?.addEventListener('click', async () => {
    try { await signInWithGoogle(); } catch (e) { toast.error(e.message); }
  });

  // Şifremi unuttum
  document.getElementById('forgot-link')?.addEventListener('click', () => renderForgotPassword(container));

  // Kayıt ol
  document.getElementById('to-signup-btn')?.addEventListener('click', () => renderSignup(container));

  // Form submit
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-submit-btn');
    const errEl = document.getElementById('login-error');
    const errText = document.getElementById('login-error-text');
    const fd = new FormData(e.target);

    errEl?.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      await signIn(fd.get('email'), fd.get('password'));
    } catch (err) {
      if (errText) errText.textContent = translateAuthError(err.message);
      errEl?.classList.remove('hidden');
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
    }
  });
}

/* ===== SIGNUP ===== */
function renderSignup(container) {
  container.innerHTML = `
    <div class="auth-form-title">Hesap Oluştur</div>
    <p class="auth-form-sub">Topluluğa ücretsiz katılın</p>

    <button type="button" class="social-btn" id="google-signup-btn">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google ile Kayıt Ol
    </button>

    <div class="auth-divider">veya</div>

    <form id="signup-form" novalidate>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)">
        <div class="form-group">
          <label class="form-label">Ad Soyad</label>
          <input type="text" name="fullName" class="form-input" placeholder="Adınız Soyadınız"
                 required autocomplete="name">
        </div>
        <div class="form-group">
          <label class="form-label">Kullanıcı Adı</label>
          <div class="input-group">
            <span class="input-icon-left" style="font-size:0.85rem;font-weight:600">@</span>
            <input type="text" name="username" class="form-input" placeholder="kullanici"
                   required pattern="[a-zA-Z0-9_]{3,20}" autocomplete="username">
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">E-posta</label>
        <div class="input-group">
          <i class="fas fa-envelope input-icon-left"></i>
          <input type="email" name="email" class="form-input" placeholder="ornek@email.com"
                 required autocomplete="email" inputmode="email">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Şifre <span class="form-hint" style="font-weight:400">(en az 8 karakter)</span></label>
        <div class="input-group">
          <i class="fas fa-lock input-icon-left"></i>
          <input type="password" name="password" class="form-input" placeholder="••••••••"
                 required minlength="8" autocomplete="new-password" id="signup-pw-input">
          <button type="button" class="input-icon-right icon-btn" id="toggle-pw2" tabindex="-1">
            <i class="fas fa-eye" id="pw2-eye-icon"></i>
          </button>
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

      <div id="signup-error" class="form-error hidden" style="margin-bottom:var(--sp-3)">
        <i class="fas fa-exclamation-circle"></i> <span id="signup-error-text"></span>
      </div>

      <button type="submit" class="btn btn-primary btn-full btn-lg" id="signup-submit-btn">
        <i class="fas fa-user-plus"></i> Hesap Oluştur
      </button>
    </form>

    <p class="auth-switch">Zaten hesabınız var mı?
      <button type="button" class="btn btn-ghost" id="to-login-btn"
              style="font-weight:700;color:var(--primary);padding:0;font-size:inherit">
        Giriş Yapın
      </button>
    </p>
  `;

  document.getElementById('toggle-pw2')?.addEventListener('click', () => {
    const inp = document.getElementById('signup-pw-input');
    const icon = document.getElementById('pw2-eye-icon');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    icon.className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });

  document.getElementById('google-signup-btn')?.addEventListener('click', async () => {
    try { await signInWithGoogle(); } catch (e) { toast.error(e.message); }
  });

  document.getElementById('to-login-btn')?.addEventListener('click', () => renderLogin(container));

  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signup-submit-btn');
    const errEl = document.getElementById('signup-error');
    const errText = document.getElementById('signup-error-text');
    const fd = new FormData(e.target);

    // Client-side validation
    if (!fd.get('fullName')?.trim()) {
      showError(errEl, errText, 'Ad Soyad alanı zorunludur.');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(fd.get('username'))) {
      showError(errEl, errText, 'Kullanıcı adı 3-20 karakter, sadece harf/rakam/alt çizgi.');
      return;
    }
    if (fd.get('password').length < 8) {
      showError(errEl, errText, 'Şifre en az 8 karakter olmalıdır.');
      return;
    }

    errEl?.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      await signUp(fd.get('email'), fd.get('password'), fd.get('username'), fd.get('fullName'));
      container.innerHTML = `
        <div style="text-align:center;padding:32px 0">
          <div style="font-size:4rem;margin-bottom:16px">📧</div>
          <h2 style="margin-bottom:12px;font-size:1.5rem">E-postanızı Kontrol Edin</h2>
          <p style="color:var(--text-3);margin-bottom:8px;font-size:0.9rem">
            <strong>${fd.get('email')}</strong> adresine doğrulama maili gönderdik.
          </p>
          <p style="color:var(--text-3);margin-bottom:28px;font-size:0.85rem">
            Spam klasörünü de kontrol etmeyi unutmayın.
          </p>
          <button type="button" class="btn btn-primary" id="back-to-login-btn">
            <i class="fas fa-arrow-left"></i> Giriş Sayfasına Dön
          </button>
        </div>`;
      document.getElementById('back-to-login-btn')?.addEventListener('click', () => renderLogin(container));
    } catch (err) {
      showError(errEl, errText, translateAuthError(err.message));
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Hesap Oluştur';
    }
  });
}

/* ===== FORGOT PASSWORD ===== */
function renderForgotPassword(container) {
  container.innerHTML = `
    <div class="auth-form-title">Şifremi Unuttum</div>
    <p class="auth-form-sub">E-posta adresinize sıfırlama bağlantısı gönderelim.</p>

    <form id="forgot-form" novalidate>
      <div class="form-group">
        <label class="form-label">E-posta Adresi</label>
        <div class="input-group">
          <i class="fas fa-envelope input-icon-left"></i>
          <input type="email" name="email" class="form-input" placeholder="ornek@email.com"
                 required autocomplete="email" inputmode="email">
        </div>
      </div>

      <div id="forgot-error" class="form-error hidden" style="margin-bottom:var(--sp-3)">
        <i class="fas fa-exclamation-circle"></i> <span id="forgot-error-text"></span>
      </div>

      <button type="submit" class="btn btn-primary btn-full btn-lg" id="forgot-submit-btn">
        <i class="fas fa-paper-plane"></i> Sıfırlama Bağlantısı Gönder
      </button>
    </form>

    <p class="auth-switch">
      <button type="button" class="btn btn-ghost" id="back-to-login-link"
              style="font-weight:600;color:var(--primary);padding:0;font-size:0.9rem">
        <i class="fas fa-arrow-left"></i> Giriş Sayfasına Dön
      </button>
    </p>
  `;

  document.getElementById('back-to-login-link')?.addEventListener('click', () => renderLogin(container));

  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('forgot-submit-btn');
    const errEl = document.getElementById('forgot-error');
    const errText = document.getElementById('forgot-error-text');
    const fd = new FormData(e.target);

    errEl?.classList.add('hidden');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.textContent = '';

    try {
      await resetPassword(fd.get('email'));
      container.innerHTML = `
        <div style="text-align:center;padding:32px 0">
          <div style="font-size:4rem;margin-bottom:16px">✅</div>
          <h2 style="margin-bottom:12px;font-size:1.5rem">Bağlantı Gönderildi</h2>
          <p style="color:var(--text-3);margin-bottom:28px;font-size:0.9rem">
            E-postanızı kontrol edin ve şifrenizi sıfırlayın.
          </p>
          <button type="button" class="btn btn-primary" id="back-btn">
            <i class="fas fa-arrow-left"></i> Giriş Sayfasına Dön
          </button>
        </div>`;
      document.getElementById('back-btn')?.addEventListener('click', () => renderLogin(container));
    } catch (err) {
      showError(errEl, errText, translateAuthError(err.message));
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Sıfırlama Bağlantısı Gönder';
    }
  });
}

/* ===== HELPERS ===== */
function showError(el, textEl, msg) {
  if (!el || !textEl) return;
  textEl.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function translateAuthError(msg) {
  const map = {
    'Invalid login credentials': 'E-posta veya şifre hatalı.',
    'Email not confirmed': 'E-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.',
    'User already registered': 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır.',
    'Invalid email': 'Geçersiz e-posta adresi.',
    'Email rate limit exceeded': 'Çok fazla deneme. Lütfen birkaç dakika bekleyin.',
    'signup is disabled': 'Kayıt şu anda kapalı.',
  };
  for (const [key, val] of Object.entries(map)) {
    if (msg?.includes(key)) return val;
  }
  return msg || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
