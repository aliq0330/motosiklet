import { getRoute, getRouteReviews, addRouteReview, saveRoute, unsaveRoute, isRouteSaved } from '../utils/api.js';
import { formatDistance, formatElevation, getDifficultyClass, getDifficultyLabel, getRoadTypeLabel, getVehicleLabel, timeAgo, generateStars, escapeHtml, avatarFallback, calculateDistance, calculateElevationGain } from '../utils/helpers.js';
import { getUser, getProfile } from '../auth.js';
import { toast } from '../components/toast.js';
import { MAP_DEFAULT } from '../config.js';

let routeMap = null;
let elevationChart = null;

export async function renderRouteDetail({ params }) {
  const content = document.getElementById('page-content');
  const id = params.id;

  content.innerHTML = `<div class="page-loading" style="min-height:400px"><div class="spinner"></div></div>`;

  try {
    const route = await getRoute(id);
    const [reviews, saved] = await Promise.all([
      getRouteReviews(id).catch(() => []),
      isRouteSaved(id).catch(() => false)
    ]);

    renderRoute(route, reviews, saved);
  } catch (err) {
    content.innerHTML = `<div class="page"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Rota bulunamadı</p><span>${err.message}</span><a href="#/discover" class="btn btn-primary btn-sm">Keşfete Dön</a></div></div>`;
  }
}

function renderRoute(route, reviews, saved) {
  const content = document.getElementById('page-content');
  const user = getUser();
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  content.innerHTML = `<div class="page-full page-enter">
    <div class="route-detail-hero">
      ${route.thumbnail_url ? `<img src="${route.thumbnail_url}" alt="${escapeHtml(route.title)}">` : `<div style="width:100%;height:100%;background:var(--grad-hero)"></div>`}
      <div class="route-detail-hero-overlay"></div>
      <div class="route-detail-hero-content">
        <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-3)">
          <span class="tag ${getDifficultyClass(route.difficulty)}">${getDifficultyLabel(route.difficulty)}</span>
          ${route.road_type ? `<span class="tag tag-gray" style="background:rgba(255,255,255,.2);color:white">${getRoadTypeLabel(route.road_type)}</span>` : ''}
          ${route.vehicle_type ? `<span class="tag" style="background:rgba(255,255,255,.2);color:white">${getVehicleLabel(route.vehicle_type)}</span>` : ''}
        </div>
        <h1 style="font-size:clamp(1.5rem,3vw,2.5rem);font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.4)">${escapeHtml(route.title)}</h1>
        <div style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-3)">
          <img src="${route.profiles?.avatar_url || avatarFallback(route.profiles?.full_name || 'U')}" alt="" class="avatar avatar-sm">
          <span style="font-weight:600">${escapeHtml(route.profiles?.username || 'Sürücü')}</span>
          ${avgRating ? `<div style="display:flex;align-items:center;gap:4px"><i class="fas fa-star" style="color:var(--warning)"></i><span>${avgRating}</span><span style="opacity:.7">(${reviews.length} yorum)</span></div>` : ''}
        </div>
      </div>
    </div>

    <div class="route-stats-strip">
      <div class="route-stat-item"><div class="route-stat-val">${formatDistance(route.distance)}</div><div class="route-stat-lbl">Mesafe</div></div>
      <div class="route-stat-item"><div class="route-stat-val">${formatElevation(route.elevation_gain)}</div><div class="route-stat-lbl">Yükseklik Kazanımı</div></div>
      <div class="route-stat-item"><div class="route-stat-val">${route.view_count || 0}</div><div class="route-stat-lbl">Görüntülenme</div></div>
      <div class="route-stat-item"><div class="route-stat-val">${route.save_count || 0}</div><div class="route-stat-lbl">Kaydedilme</div></div>
    </div>

    <div class="route-detail-grid">
      <div>
        <div style="margin-bottom:var(--sp-5)">
          <h3 style="margin-bottom:var(--sp-3);font-size:var(--text-lg)">Harita</h3>
          <div class="route-map-full" id="route-map"></div>
        </div>

        ${route.elevation_gain ? `<div style="margin-bottom:var(--sp-5)">
          <h3 style="margin-bottom:var(--sp-3);font-size:var(--text-lg)">Yükseklik Profili</h3>
          <div class="elevation-section"><canvas id="elevation-chart" height="80"></canvas></div>
        </div>` : ''}

        ${route.description ? `<div class="card" style="margin-bottom:var(--sp-5)"><div class="card-body"><h3 style="margin-bottom:var(--sp-3)">Açıklama</h3><p style="color:var(--text-2);line-height:1.7;font-size:var(--text-sm)">${escapeHtml(route.description)}</p></div></div>` : ''}

        <div style="margin-bottom:var(--sp-5)">
          <div class="section-header"><div class="section-title">Yorumlar (${reviews.length})</div></div>
          ${user ? `<div class="card" style="margin-bottom:var(--sp-4)" id="review-form-card">
            <div class="card-body">
              <h4 style="margin-bottom:var(--sp-4)">Yorum Ekle</h4>
              <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-4)" id="star-rating">
                ${[1,2,3,4,5].map(n => `<button class="star-btn" data-val="${n}" style="font-size:1.5rem;color:var(--text-4);transition:color .15s" title="${n} yıldız"><i class="fas fa-star"></i></button>`).join('')}
              </div>
              <textarea id="review-text" class="form-textarea" placeholder="Rota hakkındaki deneyiminizi paylaşın..." rows="3"></textarea>
              <button class="btn btn-primary btn-sm" style="margin-top:var(--sp-3)" id="submit-review"><i class="fas fa-paper-plane"></i> Yorum Gönder</button>
            </div>
          </div>` : `<div class="card" style="margin-bottom:var(--sp-4);text-align:center;padding:var(--sp-5)"><p style="color:var(--text-3);margin-bottom:var(--sp-3)">Yorum yapabilmek için giriş yapın</p><a href="#/login" class="btn btn-primary btn-sm">Giriş Yap</a></div>`}
          <div id="reviews-list">${reviews.length ? reviews.map(r => renderReview(r)).join('') : '<div class="empty-state sm"><i class="far fa-comment-dots"></i><p>Henüz yorum yok</p></div>'}</div>
        </div>
      </div>

      <aside>
        <div class="card" style="position:sticky;top:calc(var(--header-h) + var(--sp-4))">
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-3)">
            <button class="btn btn-primary btn-full btn-lg" id="start-ride-btn"><i class="fas fa-play-circle"></i> Sürüşe Başla</button>
            <button class="btn btn-outline btn-full" id="save-route-btn">
              <i class="${saved ? 'fas' : 'far'} fa-bookmark"></i> ${saved ? 'Kaydedildi' : 'Kaydet'}
            </button>
            <button class="btn btn-ghost btn-full" id="share-route-btn"><i class="fas fa-share-alt"></i> Paylaş</button>
          </div>

          <div class="card-footer">
            <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
              ${route.tags?.length ? `<div><div style="font-size:var(--text-xs);font-weight:600;color:var(--text-3);margin-bottom:var(--sp-2)">Etiketler</div><div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">${route.tags.map(t => `<span class="tag tag-gray">${escapeHtml(t)}</span>`).join('')}</div></div>` : ''}
              ${route.safety_score ? `<div><div style="font-size:var(--text-xs);font-weight:600;color:var(--text-3);margin-bottom:var(--sp-2)">Güvenlik Skoru</div><div class="progress-bar"><div class="progress-fill" style="width:${route.safety_score * 20}%"></div></div><div style="font-size:var(--text-xs);color:var(--text-3);margin-top:4px">${(route.safety_score * 2).toFixed(1)}/10</div></div>` : ''}
            </div>
          </div>

          <div class="card-footer" style="background:none">
            <a href="#/profile/${route.user_id}" style="display:flex;align-items:center;gap:var(--sp-3);text-decoration:none">
              <img src="${route.profiles?.avatar_url || avatarFallback(route.profiles?.full_name || 'U')}" alt="" class="avatar avatar-md">
              <div>
                <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(route.profiles?.full_name || route.profiles?.username || 'Sürücü')}</div>
                <div style="font-size:var(--text-xs);color:var(--text-3)">@${escapeHtml(route.profiles?.username || '')}</div>
              </div>
            </a>
          </div>
        </div>
      </aside>
    </div>
  </div>`;

  initRouteMap(route);
  if (route.waypoints?.length) initElevationChart(route.waypoints);
  bindRouteActions(route, saved);
}

function initRouteMap(route) {
  if (typeof L === 'undefined') return;
  const mapEl = document.getElementById('route-map');
  if (!mapEl) return;

  routeMap = L.map('route-map', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(routeMap);

  const waypoints = route.waypoints;
  if (waypoints && waypoints.length > 0) {
    const latlngs = waypoints.map(p => [p[0], p[1]]);
    const polyline = L.polyline(latlngs, { color: '#FF6B35', weight: 4, opacity: 0.85 }).addTo(routeMap);
    routeMap.fitBounds(polyline.getBounds(), { padding: [20, 20] });

    // Start marker
    L.marker(latlngs[0], { icon: L.divIcon({ className: '', html: '<div style="background:#10B981;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid white">S</div>', iconSize: [28,28], iconAnchor: [14,14] }) }).addTo(routeMap).bindPopup('Başlangıç');
    // End marker
    L.marker(latlngs[latlngs.length - 1], { icon: L.divIcon({ className: '', html: '<div style="background:#EF4444;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid white">B</div>', iconSize: [28,28], iconAnchor: [14,14] }) }).addTo(routeMap).bindPopup('Bitiş');
  } else {
    routeMap.setView(MAP_DEFAULT.center, MAP_DEFAULT.zoom);
  }
}

function initElevationChart(waypoints) {
  const canvas = document.getElementById('elevation-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  const elevations = waypoints.map(p => p[2] || 0);
  const labels = waypoints.map((_, i) => i % Math.ceil(waypoints.length / 20) === 0 ? `${Math.round(i * (calculateDistance(waypoints) / waypoints.length) * 10) / 10}km` : '');
  const ctx = canvas.getContext('2d');
  elevationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: elevations,
        fill: true,
        backgroundColor: 'rgba(255,107,53,0.15)',
        borderColor: '#FF6B35',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${Math.round(ctx.raw)}m` } } },
      scales: {
        x: { display: false },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => `${v}m`, font: { size: 10 } } }
      }
    }
  });
}

function renderReview(r) {
  return `<div class="card" style="margin-bottom:var(--sp-3)">
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
        <img src="${r.profiles?.avatar_url || avatarFallback(r.profiles?.full_name || 'U')}" alt="" class="avatar avatar-sm">
        <div style="flex:1">
          <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(r.profiles?.full_name || r.profiles?.username || 'Kullanıcı')}</div>
          <div style="font-size:var(--text-xs);color:var(--text-3)">${timeAgo(r.created_at)}</div>
        </div>
        <div>${generateStars(r.rating)}</div>
      </div>
      ${r.comment ? `<p style="font-size:var(--text-sm);color:var(--text-2);line-height:1.6">${escapeHtml(r.comment)}</p>` : ''}
    </div>
  </div>`;
}

function bindRouteActions(route, initialSaved) {
  let saved = initialSaved;

  // Save button
  document.getElementById('save-route-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const user = getUser();
    if (!user) { toast.warning('Kaydetmek için giriş yapın'); return; }
    btn.disabled = true;
    try {
      if (saved) {
        await unsaveRoute(route.id);
        saved = false;
        btn.innerHTML = '<i class="far fa-bookmark"></i> Kaydet';
        toast.success('Rota kaydedilenlerden kaldırıldı');
      } else {
        await saveRoute(route.id);
        saved = true;
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Kaydedildi';
        toast.success('Rota kaydedildi!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // Share
  document.getElementById('share-route-btn')?.addEventListener('click', async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: route.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.info('Bağlantı kopyalandı');
      }
    } catch {}
  });

  // Start ride
  document.getElementById('start-ride-btn')?.addEventListener('click', () => {
    if (route.waypoints?.length) {
      const [lat, lng] = route.waypoints[0];
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  });

  // Star rating
  let selectedRating = 0;
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('mouseover', () => highlightStars(parseInt(btn.dataset.val)));
    btn.addEventListener('mouseleave', () => highlightStars(selectedRating));
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.val);
      highlightStars(selectedRating);
    });
  });

  // Submit review
  document.getElementById('submit-review')?.addEventListener('click', async () => {
    const user = getUser();
    if (!user) { toast.warning('Yorum için giriş yapın'); return; }
    if (!selectedRating) { toast.warning('Lütfen bir puan seçin'); return; }
    const text = document.getElementById('review-text')?.value.trim();
    const btn = document.getElementById('submit-review');
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      await addRouteReview(route.id, selectedRating, text);
      toast.success('Yorumunuz eklendi!');
      const reviews = await getRouteReviews(route.id);
      document.getElementById('reviews-list').innerHTML = reviews.map(r => renderReview(r)).join('');
      document.getElementById('review-text').value = '';
      selectedRating = 0;
      highlightStars(0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  });
}

function highlightStars(val) {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.style.color = parseInt(btn.dataset.val) <= val ? 'var(--warning)' : 'var(--text-4)';
  });
}
