import { initAuth, onAuthChange, getUser, getProfile, getAvatarUrl, signOut } from './auth.js';
import { initRouter, addRoute, setNotFound, navigate, getCurrentPath } from './router.js';
import { initModal, closeModal } from './components/modal.js';
import { initNotifications, setupNotificationPanel, refreshNotifications } from './components/notifications.js';
import { search } from './utils/api.js';
import { debounce, escapeHtml, avatarFallback } from './utils/helpers.js';

import { renderAuthPage } from './pages/auth-page.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderDiscover } from './pages/discover.js';
import { renderRouteDetail } from './pages/route-detail.js';
import { renderEvents, renderEventDetail } from './pages/events.js';
import { renderCreate } from './pages/create.js';
import { renderProfile } from './pages/profile.js';
import { renderClubs, renderClubDetail } from './pages/clubs.js';
import { renderMessages } from './pages/messages.js';
import { renderSettings } from './pages/settings.js';

// Expose modal globally for profile page usage
import * as modal from './components/modal.js';
window._modal = modal;

const PAGE_TITLES = {
  '/': 'Ana Sayfa',
  '/discover': 'Keşfet',
  '/events': 'Etkinlikler',
  '/clubs': 'Kulüpler',
  '/messages': 'Mesajlar',
  '/create': 'Oluştur',
  '/profile': 'Profilim',
  '/settings': 'Ayarlar'
};

let authReady = false;

async function boot() {
  applyStoredTheme();

  const fill = document.getElementById('loading-fill');
  let progress = 0;
  const progInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15, 85);
    if (fill) fill.style.width = progress + '%';
  }, 150);

  // Timeout guard: never stay on loading screen longer than 7s
  try {
    await Promise.race([
      initAuth(),
      new Promise(resolve => setTimeout(resolve, 7000))
    ]);
  } catch {}

  clearInterval(progInterval);
  if (fill) fill.style.width = '100%';

  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.classList.add('fade-out');
      setTimeout(() => { ls.style.display = 'none'; }, 600);
    }
    authReady = true;
    handleAuthState(getUser(), getProfile());
  }, 400);

  onAuthChange(handleAuthState);
  setupRoutes();
  initModal();
  initSidebar();
  initSearch();
  initThemeToggle();
  registerServiceWorker();
  initRouter();
}

function handleAuthState(user, profile) {
  const app = document.getElementById('app');
  const authContainer = document.getElementById('auth-container');
  const path = getCurrentPath();

  if (user) {
    app?.classList.remove('hidden');
    authContainer?.classList.add('hidden');
    updateSidebarUser(profile);
    initNotifications();
    setupNotificationPanel();
    setupLogout();

    if (path === '/login' || path === '/signup' || path === '/forgot') {
      navigate('/', true);
    }
  } else {
    app?.classList.add('hidden');
    authContainer?.classList.remove('hidden');

    const isAuthPath = ['/login', '/signup', '/forgot'].includes(path);
    renderAuthPage(isAuthPath ? path.slice(1) : 'login');
  }
}

function setupRoutes() {
  const protected_route = (handler) => (ctx) => {
    if (!getUser()) { renderAuthPage('login'); return; }
    return handler(ctx);
  };

  addRoute('/', protected_route(async () => {
    setPageTitle('Ana Sayfa');
    setActiveNav('/');
    await renderDashboard();
  }));

  addRoute('/discover', async (ctx) => {
    setPageTitle('Keşfet');
    setActiveNav('/discover');
    await renderDiscover(ctx);
  });

  addRoute('/routes/:id', async (ctx) => {
    setPageTitle('Rota Detay');
    await renderRouteDetail(ctx);
  });

  addRoute('/events', async (ctx) => {
    setPageTitle('Etkinlikler');
    setActiveNav('/events');
    await renderEvents(ctx);
  });

  addRoute('/events/:id', async (ctx) => {
    setPageTitle('Etkinlik Detay');
    await renderEventDetail(ctx);
  });

  addRoute('/create', protected_route(async (ctx) => {
    setPageTitle('Oluştur');
    setActiveNav('/create');
    await renderCreate(ctx);
  }));

  addRoute('/clubs', async (ctx) => {
    setPageTitle('Kulüpler');
    setActiveNav('/clubs');
    await renderClubs(ctx);
  });

  addRoute('/clubs/:id', async (ctx) => {
    setPageTitle('Kulüp');
    await renderClubDetail(ctx);
  });

  addRoute('/profile', protected_route(async () => {
    setPageTitle('Profilim');
    setActiveNav('/profile');
    await renderProfile({});
  }));

  addRoute('/profile/:id', async (ctx) => {
    setPageTitle('Profil');
    await renderProfile(ctx);
  });

  addRoute('/messages', protected_route(async (ctx) => {
    setPageTitle('Mesajlar');
    setActiveNav('/messages');
    await renderMessages(ctx);
  }));

  addRoute('/messages/:id', protected_route(async (ctx) => {
    setPageTitle('Mesajlar');
    setActiveNav('/messages');
    await renderMessages(ctx);
  }));

  addRoute('/settings', protected_route(async () => {
    setPageTitle('Ayarlar');
    setActiveNav('/settings');
    await renderSettings();
  }));

  addRoute('/login', () => {
    if (getUser()) { navigate('/', true); return; }
    document.getElementById('app')?.classList.add('hidden');
    document.getElementById('auth-container')?.classList.remove('hidden');
    renderAuthPage('login');
  });

  addRoute('/signup', () => {
    if (getUser()) { navigate('/', true); return; }
    document.getElementById('app')?.classList.add('hidden');
    document.getElementById('auth-container')?.classList.remove('hidden');
    renderAuthPage('signup');
  });

  setNotFound(({ path }) => {
    const content = document.getElementById('page-content');
    if (content) content.innerHTML = `<div class="page"><div class="empty-state"><i class="fas fa-map-signs"></i><p>Sayfa bulunamadı</p><span>${escapeHtml(path)}</span><a href="#/" class="btn btn-primary btn-sm">Ana Sayfaya Dön</a></div></div>`;
  });
}

function setPageTitle(title) {
  document.getElementById('page-title').textContent = title;
  document.title = `${title} – MotoRoute`;
}

function setActiveNav(route) {
  document.querySelectorAll('.nav-item[data-r], .mob-item[data-r]').forEach(el => {
    el.classList.toggle('active', el.dataset.r === route);
  });
}

function updateSidebarUser(profile) {
  if (!profile) return;
  const avatar = document.getElementById('sidebar-avatar');
  const uname = document.getElementById('sidebar-uname');
  const handle = document.getElementById('sidebar-handle');

  if (avatar) {
    avatar.src = profile.avatar_url || avatarFallback(profile.full_name || profile.username || 'U');
    avatar.onerror = () => { avatar.src = avatarFallback(profile.full_name || 'U'); };
  }
  if (uname) uname.textContent = profile.full_name || profile.username || 'Kullanıcı';
  if (handle) handle.textContent = '@' + (profile.username || '');
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuToggle = document.getElementById('menu-toggle');
  const closeBtn = document.getElementById('sidebar-toggle-close');

  const openSidebar = () => {
    sidebar?.classList.add('open');
    overlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    overlay?.classList.add('hidden');
    document.body.style.overflow = '';
  };

  menuToggle?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // Close sidebar on nav click (mobile)
  sidebar?.querySelectorAll('.nav-item[data-r]').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  // Sidebar create button
  document.getElementById('sidebar-create-btn')?.addEventListener('click', () => {
    closeSidebar();
    navigate('/create');
  });
}

function setupLogout() {
  const logoutBtns = document.querySelectorAll('#logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      await signOut();
      navigate('/', true);
    });
  });
}

function initSearch() {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!input || !dropdown) return;

  const debouncedSearch = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { dropdown.classList.add('hidden'); return; }

    try {
      const results = await search(q);
      const hasResults = results.routes.length || results.events.length || results.users.length || results.clubs.length;

      if (!hasResults) {
        dropdown.innerHTML = '<div class="search-section-title">Sonuç bulunamadı</div>';
        dropdown.classList.remove('hidden');
        return;
      }

      let html = '';
      if (results.routes.length) {
        html += `<div class="search-section-title">Rotalar</div>`;
        html += results.routes.map(r => `<a href="#/routes/${r.id}" class="search-item" onclick="closeSearchDropdown()">
          <div class="search-item-icon" style="background:var(--primary-alpha);color:var(--primary)"><i class="fas fa-route"></i></div>
          <div class="search-item-info"><div class="search-item-name">${escapeHtml(r.title)}</div><div class="search-item-sub">${r.distance ? r.distance.toFixed(1) + ' km' : ''}</div></div>
        </a>`).join('');
      }
      if (results.events.length) {
        html += `<div class="search-section-title">Etkinlikler</div>`;
        html += results.events.map(e => `<a href="#/events/${e.id}" class="search-item" onclick="closeSearchDropdown()">
          <div class="search-item-icon" style="background:var(--accent-alpha);color:var(--accent-dark)"><i class="fas fa-calendar-alt"></i></div>
          <div class="search-item-info"><div class="search-item-name">${escapeHtml(e.title)}</div><div class="search-item-sub">${e.location_name ? escapeHtml(e.location_name) : ''}</div></div>
        </a>`).join('');
      }
      if (results.users.length) {
        html += `<div class="search-section-title">Kullanıcılar</div>`;
        html += results.users.map(u => `<a href="#/profile/${u.id}" class="search-item" onclick="closeSearchDropdown()">
          <img src="${u.avatar_url || avatarFallback(u.full_name || u.username)}" alt="" class="avatar avatar-sm" style="border-radius:50%;width:36px;height:36px;flex-shrink:0">
          <div class="search-item-info"><div class="search-item-name">${escapeHtml(u.full_name || u.username)}</div><div class="search-item-sub">@${escapeHtml(u.username || '')}</div></div>
        </a>`).join('');
      }
      if (results.clubs.length) {
        html += `<div class="search-section-title">Kulüpler</div>`;
        html += results.clubs.map(c => `<a href="#/clubs/${c.id}" class="search-item" onclick="closeSearchDropdown()">
          <div class="search-item-icon" style="background:var(--info-alpha);color:var(--info)"><i class="fas fa-users"></i></div>
          <div class="search-item-info"><div class="search-item-name">${escapeHtml(c.name)}</div><div class="search-item-sub">${c.member_count || 0} üye</div></div>
        </a>`).join('');
      }

      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');
    } catch {}
  }, 350);

  input.addEventListener('input', debouncedSearch);
  input.addEventListener('focus', () => { if (input.value.length >= 2) dropdown.classList.remove('hidden'); });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search')) dropdown.classList.add('hidden');
  });

  window.closeSearchDropdown = () => {
    dropdown.classList.add('hidden');
    input.value = '';
  };
}

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

function applyStoredTheme() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

// Start the app
boot();
