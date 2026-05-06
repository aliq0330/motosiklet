import { getRoutes } from '../utils/api.js';
import { formatDistance, formatElevation, getDifficultyClass, getDifficultyLabel, debounce, escapeHtml, avatarFallback } from '../utils/helpers.js';
import { MAP_DEFAULT } from '../config.js';

let map = null;
let markers = [];
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentFilters = {};

export async function renderDiscover({ query = {} } = {}) {
  const content = document.getElementById('page-content');
  currentPage = 0;
  hasMore = true;
  currentFilters = {};

  content.innerHTML = `<div class="page-full page-enter" id="discover-page">
    <div class="discover-hero">
      <h1>Rotaları Keşfet</h1>
      <p>Binlerce sürücü tarafından paylaşılan en iyi rotaları bul</p>
      <div class="discover-search-bar">
        <input type="text" class="discover-search-input" id="discover-search" placeholder="Rota ara...">
        <button class="discover-search-btn" id="discover-search-btn"><i class="fas fa-search"></i> Ara</button>
      </div>
    </div>

    <div class="page" style="padding-top:0">
      <div class="discover-controls">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4)">
          <div class="filter-bar" style="padding:0;flex:1">
            <button class="filter-chip active" data-filter="all">Tümü</button>
            <button class="filter-chip" data-filter="motorcycle"><i class="fas fa-motorcycle"></i> Motosiklet</button>
            <button class="filter-chip" data-filter="bicycle"><i class="fas fa-bicycle"></i> Bisiklet</button>
            <select class="filter-select" id="difficulty-filter">
              <option value="">Tüm Zorluklar</option>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
              <option value="expert">Uzman</option>
            </select>
            <select class="filter-select" id="road-filter">
              <option value="">Tüm Yol Tipleri</option>
              <option value="asphalt">Asfalt</option>
              <option value="offroad">Off-Road</option>
              <option value="mixed">Karma</option>
            </select>
          </div>
          <div class="discover-view-toggle">
            <button class="view-toggle-btn active" id="list-view-btn"><i class="fas fa-th-large"></i></button>
            <button class="view-toggle-btn" id="map-view-btn"><i class="fas fa-map"></i></button>
          </div>
        </div>
      </div>

      <div id="discover-map-section" class="discover-map-section hidden">
        <div id="discover-map" style="width:100%;height:100%"></div>
      </div>

      <div id="routes-grid" class="grid-auto"></div>
      <div id="routes-loading" class="page-loading hidden"><div class="spinner"></div></div>
      <div id="routes-end" class="empty-state sm hidden"><i class="fas fa-check-circle"></i><p>Tüm rotalar yüklendi</p></div>
      <div id="routes-empty" class="empty-state hidden">
        <i class="fas fa-route"></i>
        <p>Rota bulunamadı</p>
        <span>Farklı filtreler deneyebilirsiniz</span>
      </div>
    </div>
  </div>`;

  setupFilters();
  await loadRoutes(true);
  setupInfiniteScroll();
  setupViewToggle();
}

function setupFilters() {
  const searchInput = document.getElementById('discover-search');
  const searchBtn = document.getElementById('discover-search-btn');
  const debouncedSearch = debounce(async () => {
    currentFilters.search = searchInput.value.trim() || undefined;
    currentPage = 0;
    hasMore = true;
    await loadRoutes(true);
  }, 400);

  searchInput?.addEventListener('input', debouncedSearch);
  searchBtn?.addEventListener('click', debouncedSearch);

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      currentFilters.vehicleType = f === 'all' ? undefined : f;
      currentPage = 0;
      hasMore = true;
      await loadRoutes(true);
    });
  });

  document.getElementById('difficulty-filter')?.addEventListener('change', async (e) => {
    currentFilters.difficulty = e.target.value || undefined;
    currentPage = 0;
    hasMore = true;
    await loadRoutes(true);
  });

  document.getElementById('road-filter')?.addEventListener('change', async (e) => {
    currentFilters.roadType = e.target.value || undefined;
    currentPage = 0;
    hasMore = true;
    await loadRoutes(true);
  });
}

async function loadRoutes(reset = false) {
  if (isLoading || (!hasMore && !reset)) return;
  isLoading = true;
  const grid = document.getElementById('routes-grid');
  const loading = document.getElementById('routes-loading');
  const empty = document.getElementById('routes-empty');
  const end = document.getElementById('routes-end');

  if (reset) {
    currentPage = 0;
    hasMore = true;
    if (grid) grid.innerHTML = '';
    end?.classList.add('hidden');
    empty?.classList.add('hidden');
  }

  loading?.classList.remove('hidden');

  try {
    const { data, count } = await getRoutes({ page: currentPage, limit: 12, ...currentFilters });

    loading?.classList.add('hidden');

    if (reset && data.length === 0) {
      empty?.classList.remove('hidden');
      isLoading = false;
      return;
    }

    if (data.length < 12) { hasMore = false; end?.classList.remove('hidden'); }
    else { currentPage++; }

    data.forEach(route => {
      const card = document.createElement('div');
      card.innerHTML = renderRouteCard(route);
      grid?.appendChild(card.firstElementChild);
    });

    if (map) updateMapMarkers(data);
  } catch (err) {
    loading?.classList.add('hidden');
    console.error('Routes load error:', err);
    if (empty) {
      empty.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>Rotalar yüklenemedi</p><span>${err?.message || 'Bağlantı hatası'}</span>`;
      empty.classList.remove('hidden');
    }
  }

  isLoading = false;
}

function setupInfiniteScroll() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = content;
    if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoading && hasMore) {
      loadRoutes(false);
    }
  });
}

function setupViewToggle() {
  const listBtn = document.getElementById('list-view-btn');
  const mapBtn = document.getElementById('map-view-btn');
  const mapSection = document.getElementById('discover-map-section');

  listBtn?.addEventListener('click', () => {
    listBtn.classList.add('active');
    mapBtn?.classList.remove('active');
    mapSection?.classList.add('hidden');
  });

  mapBtn?.addEventListener('click', () => {
    mapBtn.classList.add('active');
    listBtn?.classList.remove('active');
    mapSection?.classList.remove('hidden');
    if (!map) initDiscoverMap();
    else { map.invalidateSize(); }
  });
}

function initDiscoverMap() {
  if (typeof L === 'undefined') return;
  map = L.map('discover-map').setView(MAP_DEFAULT.center, MAP_DEFAULT.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
}

function updateMapMarkers(routes) {
  if (!map) return;
  markers.forEach(m => m.remove());
  markers = [];
  routes.forEach(route => {
    if (route.waypoints?.length) {
      const [lat, lng] = route.waypoints[0];
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:var(--primary);color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:var(--shadow-md);border:2px solid white">${Math.round(route.distance || 0)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map)
        .bindPopup(`<strong>${route.title}</strong><br>${formatDistance(route.distance)}<br><a href="#/routes/${route.id}">Detaya Git →</a>`);
      markers.push(marker);
    }
  });
}

function renderRouteCard(r) {
  return `<a href="#/routes/${r.id}" class="route-card card-interactive">
    <div class="route-card-thumb">
      ${r.thumbnail_url ? `<img src="${r.thumbnail_url}" alt="${escapeHtml(r.title)}" loading="lazy">` : `<div class="route-card-thumb-placeholder" style="background:var(--grad-hero);display:flex;align-items:center;justify-content:center;width:100%;height:100%"><i class="fas fa-route" style="font-size:2rem;color:rgba(255,255,255,.3)"></i></div>`}
      <div class="route-card-overlay"><span class="route-card-distance">${formatDistance(r.distance)}</span></div>
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
        <div class="route-card-rating"><i class="fas fa-star" style="color:var(--warning)"></i> ${r.rating_avg ? Number(r.rating_avg).toFixed(1) : 'Yeni'}</div>
      </div>
    </div>
  </a>`;
}
