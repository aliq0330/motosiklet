import { getDashboardFeed, getRoutes, getEvents } from '../utils/api.js';
import { getProfile, getUser } from '../auth.js';
import { formatDistance, formatElevation, getDifficultyClass, getDifficultyLabel, timeAgo, formatDate, avatarFallback, escapeHtml } from '../utils/helpers.js';
import { navigate } from '../router.js';

export async function renderDashboard() {
  const content = document.getElementById('page-content');
  const user = getUser();
  const profile = getProfile();

  content.innerHTML = `<div class="page page-enter" id="dashboard-page">
    <div class="dashboard-grid">
      <div class="dashboard-main-col">
        <div class="dashboard-welcome" id="welcome-banner">
          <div class="welcome-content">
            <p class="welcome-greeting">Merhaba 👋</p>
            <h2 class="welcome-name">${escapeHtml(profile?.full_name || profile?.username || 'Sürücü')}</h2>
            <p style="opacity:.75;margin-bottom:var(--sp-5)">Bugün nereye gidiyoruz?</p>
            <div class="welcome-stats" id="welcome-stats">
              <div class="welcome-stat"><div class="welcome-stat-val" id="ws-km">-</div><div class="welcome-stat-lbl">Toplam km</div></div>
              <div class="welcome-stat"><div class="welcome-stat-val" id="ws-rides">-</div><div class="welcome-stat-lbl">Sürüş</div></div>
              <div class="welcome-stat"><div class="welcome-stat-val" id="ws-routes">-</div><div class="welcome-stat-lbl">Rota</div></div>
            </div>
            <div class="hero-actions" style="margin-top:var(--sp-5)">
              <a href="#/create?type=route" class="btn btn-primary"><i class="fas fa-route"></i> Rota Oluştur</a>
              <a href="#/discover" class="btn btn-outline" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);color:white"><i class="fas fa-compass"></i> Keşfet</a>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <a href="#/create?type=route" class="quick-action-card">
            <div class="quick-action-icon" style="background:var(--primary-alpha);color:var(--primary)"><i class="fas fa-route"></i></div>
            <div class="quick-action-label">Rota Oluştur</div>
          </a>
          <a href="#/create?type=event" class="quick-action-card">
            <div class="quick-action-icon" style="background:var(--accent-alpha);color:var(--accent-dark)"><i class="fas fa-calendar-plus"></i></div>
            <div class="quick-action-label">Etkinlik Oluştur</div>
          </a>
          <a href="#/discover" class="quick-action-card">
            <div class="quick-action-icon" style="background:var(--info-alpha);color:var(--info)"><i class="fas fa-compass"></i></div>
            <div class="quick-action-label">Rotaları Keşfet</div>
          </a>
          <a href="#/clubs" class="quick-action-card">
            <div class="quick-action-icon" style="background:var(--success-alpha);color:var(--success)"><i class="fas fa-users"></i></div>
            <div class="quick-action-label">Kulüpler</div>
          </a>
        </div>

        <div id="feed-section">
          <div class="section-header"><div><div class="section-title">Yaklaşan Etkinlikler</div></div><a href="#/events" class="section-link">Tümünü Gör <i class="fas fa-arrow-right"></i></a></div>
          <div id="upcoming-events"><div class="page-loading"><div class="spinner"></div></div></div>

          <div class="section-header" style="margin-top:var(--sp-8)"><div><div class="section-title">Keşfet</div><div class="section-sub">Popüler rotalar</div></div><a href="#/discover" class="section-link">Tümünü Gör <i class="fas fa-arrow-right"></i></a></div>
          <div id="popular-routes" class="grid-auto"><div class="page-loading"><div class="spinner"></div></div></div>

          <div class="section-header" style="margin-top:var(--sp-8)" id="feed-header"><div><div class="section-title">Akış</div><div class="section-sub">Takip ettiklerinizden güncellemeler</div></div></div>
          <div id="activity-feed"><div class="page-loading"><div class="spinner"></div></div></div>
        </div>
      </div>

      <aside class="dashboard-sidebar-col">
        <div class="card" style="margin-bottom:var(--sp-5)">
          <div class="card-header"><span style="font-weight:700">Profilim</span><a href="#/profile" class="btn btn-ghost btn-xs">Düzenle</a></div>
          <div class="card-body" style="text-align:center;padding-top:var(--sp-6)">
            <img src="${profile?.avatar_url || avatarFallback(profile?.full_name || 'U')}" alt="" class="avatar avatar-xl" style="margin:0 auto var(--sp-4)" onerror="this.src='${avatarFallback(profile?.full_name || 'U')}'">
            <div style="font-weight:700;font-size:var(--text-lg)">${escapeHtml(profile?.full_name || profile?.username || '-')}</div>
            <div style="color:var(--text-3);font-size:var(--text-sm);margin-bottom:var(--sp-4)">@${escapeHtml(profile?.username || '-')}</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-3);text-align:center;padding:var(--sp-4) 0;border-top:1px solid var(--border)">
              <div><div style="font-weight:800;font-size:var(--text-lg)">${profile?.follower_count || 0}</div><div style="font-size:var(--text-xs);color:var(--text-3)">Takipçi</div></div>
              <div><div style="font-weight:800;font-size:var(--text-lg)">${profile?.following_count || 0}</div><div style="font-size:var(--text-xs);color:var(--text-3)">Takip</div></div>
              <div><div style="font-weight:800;font-size:var(--text-lg)">${profile?.total_rides || 0}</div><div style="font-size:var(--text-xs);color:var(--text-3)">Sürüş</div></div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom:var(--sp-5)">
          <div class="card-header"><span style="font-weight:700">İstatistikler</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
              <div class="stat-card" style="padding:var(--sp-4)">
                <div style="display:flex;align-items:center;gap:var(--sp-3)">
                  <div class="stat-card-icon" style="background:var(--primary-alpha);color:var(--primary);margin-bottom:0"><i class="fas fa-road"></i></div>
                  <div><div class="stat-card-value" style="font-size:var(--text-xl)">${formatDistance(profile?.total_km)}</div><div class="stat-card-label">Toplam Mesafe</div></div>
                </div>
              </div>
              <div class="stat-card" style="padding:var(--sp-4)">
                <div style="display:flex;align-items:center;gap:var(--sp-3)">
                  <div class="stat-card-icon" style="background:var(--accent-alpha);color:var(--accent-dark);margin-bottom:0"><i class="fas fa-tachometer-alt"></i></div>
                  <div><div class="stat-card-value" style="font-size:var(--text-xl)">${profile?.avg_speed ? profile.avg_speed.toFixed(1) + ' km/s' : '-'}</div><div class="stat-card-label">Ortalama Hız</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span style="font-weight:700">Hızlı Linkler</span></div>
          <div style="padding:var(--sp-2)">
            <a href="#/discover" class="dropdown-item"><i class="fas fa-compass"></i> Rotaları Keşfet</a>
            <a href="#/events" class="dropdown-item"><i class="fas fa-calendar-alt"></i> Etkinlikler</a>
            <a href="#/clubs" class="dropdown-item"><i class="fas fa-users"></i> Kulüpler</a>
            <a href="#/messages" class="dropdown-item"><i class="fas fa-comment-dots"></i> Mesajlar</a>
            <a href="#/settings" class="dropdown-item"><i class="fas fa-cog"></i> Ayarlar</a>
          </div>
        </div>
      </aside>
    </div>
  </div>`;

  if (profile) {
    document.getElementById('ws-km').textContent = formatDistance(profile.total_km);
    document.getElementById('ws-rides').textContent = profile.total_rides || 0;
  }

  loadDashboardData(user);
}

async function loadDashboardData(user) {
  const errHtml = (icon, msg) => `<div class="empty-state sm"><i class="fas fa-${icon}"></i><p>${msg}</p></div>`;

  const [popularResult, upcomingResult] = await Promise.all([
    getRoutes({ limit: 6 }).catch(e => {
      console.error('Routes fetch error:', e);
      return { data: [], _error: true };
    }),
    getEvents({ limit: 4, upcoming: true }).catch(e => {
      console.error('Events fetch error:', e);
      return { data: [], _error: true };
    })
  ]);

  const evEl = document.getElementById('upcoming-events');
  const rtEl = document.getElementById('popular-routes');
  if (upcomingResult._error && evEl) {
    evEl.innerHTML = errHtml('exclamation-circle', 'Etkinlikler yüklenemedi');
  } else {
    renderUpcomingEvents(upcomingResult.data);
  }
  if (popularResult._error && rtEl) {
    rtEl.innerHTML = errHtml('exclamation-circle', 'Rotalar yüklenemedi');
  } else {
    renderPopularRoutes(popularResult.data);
  }

  if (user) {
    const feedResult = await getDashboardFeed(user.id).catch(e => {
      console.error('Feed fetch error:', e);
      return { routes: [], _error: true };
    });
    const feedEl = document.getElementById('activity-feed');
    if (feedResult._error && feedEl) {
      feedEl.innerHTML = errHtml('exclamation-circle', 'Akış yüklenemedi');
    } else {
      renderFeed(feedResult.routes || []);
    }
    const ws = document.getElementById('ws-routes');
    if (ws) ws.textContent = (feedResult.routes || []).filter(r => r.user_id === user.id).length;
  }
}

function renderUpcomingEvents(events) {
  const el = document.getElementById('upcoming-events');
  if (!el) return;
  if (!events.length) {
    el.innerHTML = '<div class="empty-state sm"><i class="fas fa-calendar-times"></i><p>Yaklaşan etkinlik yok</p><span>Yeni etkinlikler için keşfet sayfasına bakın</span><a href="#/events" class="btn btn-primary btn-sm">Etkinliklere Git</a></div>';
    return;
  }
  el.innerHTML = `<div class="scroll-x"><div class="scroll-x-inner">${events.map(ev => renderEventCard(ev)).join('')}</div></div>`;
}

function renderPopularRoutes(routes) {
  const el = document.getElementById('popular-routes');
  if (!el) return;
  if (!routes.length) {
    el.innerHTML = '<div class="empty-state sm"><i class="fas fa-route"></i><p>Rota bulunamadı</p></div>';
    return;
  }
  el.innerHTML = routes.map(r => renderRouteCard(r)).join('');
}

function renderFeed(routes) {
  const el = document.getElementById('activity-feed');
  if (!el) return;
  if (!routes.length) {
    el.innerHTML = '<div class="empty-state sm"><i class="fas fa-stream"></i><p>Akış boş</p><span>Rota paylaşan kullanıcıları takip edin</span><a href="#/discover" class="btn btn-primary btn-sm">Keşfet</a></div>';
    return;
  }
  el.innerHTML = routes.slice(0, 8).map(r => `
    <div class="activity-item">
      <div class="activity-avatar-wrap">
        <img src="${r.profiles?.avatar_url || avatarFallback(r.profiles?.full_name || 'U')}" alt="" class="avatar avatar-md" onerror="this.src='${avatarFallback(r.profiles?.full_name || 'U')}'">
        <div class="activity-type-icon" style="background:var(--primary);color:white"><i class="fas fa-route"></i></div>
      </div>
      <div class="activity-content">
        <div class="activity-text"><strong>${escapeHtml(r.profiles?.full_name || r.profiles?.username || 'Sürücü')}</strong> yeni bir rota paylaştı</div>
        <div class="activity-time">${timeAgo(r.created_at)}</div>
        <a href="#/routes/${r.id}" class="activity-preview" style="text-decoration:none">
          <div class="activity-preview-inner">
            <div style="width:40px;height:40px;background:var(--primary-alpha);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;color:var(--primary);flex-shrink:0"><i class="fas fa-route"></i></div>
            <div>
              <div class="activity-preview-title">${escapeHtml(r.title)}</div>
              <div class="activity-preview-sub">${formatDistance(r.distance)} • <span class="tag tag-${getDifficultyClass(r.difficulty).replace('diff-','')}" style="font-size:10px;padding:1px 6px">${getDifficultyLabel(r.difficulty)}</span></div>
            </div>
          </div>
        </a>
      </div>
    </div>
  `).join('');
}

function renderRouteCard(r) {
  return `<a href="#/routes/${r.id}" class="route-card card-interactive">
    <div class="route-card-thumb">
      ${r.thumbnail_url ? `<img src="${r.thumbnail_url}" alt="${escapeHtml(r.title)}" loading="lazy">` : `<div class="route-card-thumb-placeholder"><svg width="60" height="40" viewBox="0 0 100 70" fill="none"><circle cx="20" cy="55" r="14" stroke="rgba(255,255,255,.3)" stroke-width="6"/><circle cx="80" cy="55" r="14" stroke="rgba(255,255,255,.3)" stroke-width="6"/><path d="M34 55L40 32L56 40L60 18L82 42L82 55" stroke="rgba(255,255,255,.3)" stroke-width="6" fill="none" stroke-linejoin="round"/></svg></div>`}
      <div class="route-card-overlay"><span class="route-card-distance">${formatDistance(r.distance)}</span></div>
      <div class="route-card-actions">
        <button class="route-action-btn" onclick="event.preventDefault();event.stopPropagation()" title="Kaydet"><i class="far fa-bookmark"></i></button>
      </div>
    </div>
    <div class="route-card-body">
      <div class="route-card-title">${escapeHtml(r.title)}</div>
      <div class="route-card-meta">
        <span class="route-card-meta-item"><i class="fas fa-mountain"></i>${formatElevation(r.elevation_gain)}</span>
        <span class="tag ${getDifficultyClass(r.difficulty)}">${getDifficultyLabel(r.difficulty)}</span>
        ${r.road_type ? `<span class="tag tag-gray">${r.road_type === 'asphalt' ? 'Asfalt' : r.road_type === 'offroad' ? 'Off-Road' : 'Karma'}</span>` : ''}
      </div>
      <div class="route-card-footer">
        <div class="route-card-author">
          <img src="${r.profiles?.avatar_url || avatarFallback(r.profiles?.full_name || 'U')}" alt="" class="avatar avatar-xs" onerror="this.src='${avatarFallback(r.profiles?.full_name || 'U')}'">
          <span class="route-card-author-name">${escapeHtml(r.profiles?.username || 'Sürücü')}</span>
        </div>
        <div class="route-card-rating"><i class="fas fa-star"></i> ${r.rating_avg ? Number(r.rating_avg).toFixed(1) : 'Yeni'}</div>
      </div>
    </div>
  </a>`;
}

function renderEventCard(ev) {
  const date = new Date(ev.date);
  return `<a href="#/events/${ev.id}" class="event-card" style="min-width:260px;max-width:260px">
    <div class="event-card-cover" style="background:var(--grad-hero)">
      ${ev.cover_image ? `<img src="${ev.cover_image}" alt="" loading="lazy">` : ''}
      <div class="event-card-date-badge">
        <div class="event-date-day">${date.getDate()}</div>
        <div class="event-date-month">${date.toLocaleDateString('tr-TR',{month:'short'})}</div>
      </div>
    </div>
    <div class="event-card-body">
      <div class="event-card-title">${escapeHtml(ev.title)}</div>
      <div class="event-card-meta">
        ${ev.location_name ? `<div class="event-card-meta-row"><i class="fas fa-map-marker-alt"></i>${escapeHtml(ev.location_name)}</div>` : ''}
        <div class="event-card-meta-row"><i class="fas fa-clock"></i>${date.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div class="event-card-footer">
        <span class="tag tag-accent">${ev.participant_count || 0} Katılımcı</span>
        ${ev.difficulty ? `<span class="tag ${getDifficultyClass(ev.difficulty)}">${getDifficultyLabel(ev.difficulty)}</span>` : ''}
      </div>
    </div>
  </a>`;
}

export { renderRouteCard, renderEventCard };
