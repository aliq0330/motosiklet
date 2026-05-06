import { createRoute, createEvent, createClub } from '../utils/api.js';
import { parseGPX, calculateDistance, calculateElevationGain, escapeHtml } from '../utils/helpers.js';
import { getUser } from '../auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { MAP_DEFAULT } from '../config.js';

let createMap = null;
let drawnItems = null;
let routeWaypoints = [];

export async function renderCreate({ query = {} } = {}) {
  const content = document.getElementById('page-content');
  const type = query.type || 'route';

  content.innerHTML = `<div class="page page-sm page-enter">
    <div class="section-header" style="margin-bottom:var(--sp-6)">
      <div><h1 style="font-size:var(--text-3xl);font-weight:900">Oluştur</h1><p style="color:var(--text-3)">Ne oluşturmak istersiniz?</p></div>
    </div>

    <div class="create-tabs">
      <button class="create-tab ${type === 'route' ? 'active' : ''}" data-type="route"><i class="fas fa-route"></i> Rota</button>
      <button class="create-tab ${type === 'event' ? 'active' : ''}" data-type="event"><i class="fas fa-calendar-plus"></i> Etkinlik</button>
      <button class="create-tab ${type === 'club' ? 'active' : ''}" data-type="club"><i class="fas fa-users"></i> Kulüp</button>
    </div>

    <div id="create-form-area"></div>
  </div>`;

  document.querySelectorAll('.create-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.create-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadCreateForm(tab.dataset.type);
    });
  });

  loadCreateForm(type);
}

function loadCreateForm(type) {
  const area = document.getElementById('create-form-area');
  if (!area) return;

  if (createMap) { createMap.remove(); createMap = null; }
  drawnItems = null; routeWaypoints = [];

  if (type === 'route') renderRouteForm(area);
  else if (type === 'event') renderEventForm(area);
  else if (type === 'club') renderClubForm(area);
}

function renderRouteForm(area) {
  area.innerHTML = `<div class="create-form-card">
    <h2 style="margin-bottom:var(--sp-6);font-size:var(--text-xl)"><i class="fas fa-route" style="color:var(--primary)"></i> Yeni Rota Oluştur</h2>

    <div class="map-toolbar">
      <button class="map-toolbar-btn" id="draw-route-btn"><i class="fas fa-pencil-alt"></i> Çiz</button>
      <button class="map-toolbar-btn" id="clear-route-btn"><i class="fas fa-trash"></i> Temizle</button>
      <label class="map-toolbar-btn" style="cursor:pointer"><i class="fas fa-file-import"></i> GPX İçe Aktar
        <input type="file" accept=".gpx" style="display:none" id="gpx-input">
      </label>
      <span id="route-distance-preview" style="margin-left:auto;font-size:var(--text-sm);font-weight:700;color:var(--primary)"></span>
    </div>
    <div class="create-map-canvas" id="create-map"></div>

    <form id="route-form">
      <div class="grid-2" style="gap:var(--sp-4)">
        <div class="form-group">
          <label class="form-label">Rota Adı *</label>
          <input type="text" name="title" class="form-input" placeholder="Örn: Karadeniz Sahil Rotası" required maxlength="100">
        </div>
        <div class="form-group">
          <label class="form-label">Zorluk *</label>
          <select name="difficulty" class="form-select" required>
            <option value="">Seçin...</option>
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
            <option value="expert">Uzman</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Yol Tipi</label>
          <select name="road_type" class="form-select">
            <option value="">Seçin...</option>
            <option value="asphalt">Asfalt</option>
            <option value="offroad">Off-Road</option>
            <option value="mixed">Karma</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Araç Tipi</label>
          <select name="vehicle_type" class="form-select">
            <option value="motorcycle">🏍️ Motosiklet</option>
            <option value="bicycle">🚲 Bisiklet</option>
            <option value="both">🔄 Her İkisi</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Açıklama</label>
        <textarea name="description" class="form-textarea" placeholder="Rota hakkında bilgi verin, öne çıkan noktaları anlatın..." rows="4"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Etiketler <span class="form-hint">(virgülle ayırın)</span></label>
        <input type="text" name="tags" class="form-input" placeholder="doğa, sahil, dağ, tarihi...">
      </div>
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-6)">
        <label class="toggle-switch"><input type="checkbox" name="is_public" checked class="toggle-input"><span class="toggle-slider"></span></label>
        <span style="font-size:var(--text-sm)">Herkese Açık Rota</span>
      </div>
      <div id="route-form-error" class="form-error hidden" style="margin-bottom:var(--sp-4)"><i class="fas fa-exclamation-circle"></i> <span></span></div>
      <button type="submit" class="btn btn-primary btn-xl btn-full" id="create-route-btn"><i class="fas fa-save"></i> Rotayı Kaydet</button>
    </form>
  </div>`;

  initCreateMap();
  bindGpxUpload();
  bindRouteForm();
}

function initCreateMap() {
  if (typeof L === 'undefined') return;
  createMap = L.map('create-map').setView(MAP_DEFAULT.center, 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(createMap);

  if (typeof L.Draw !== 'undefined') {
    drawnItems = new L.FeatureGroup().addTo(createMap);
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems },
      draw: { polyline: { shapeOptions: { color: '#FF6B35', weight: 4 } }, marker: false, circle: false, rectangle: false, circlemarker: false, polygon: false }
    });
    createMap.addControl(drawControl);

    createMap.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      routeWaypoints = e.layer.getLatLngs().map(ll => [ll.lat, ll.lng, 0]);
      updateDistancePreview();
    });

    createMap.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.getLayers();
      if (layers.length) routeWaypoints = layers[0].getLatLngs().map(ll => [ll.lat, ll.lng, 0]);
      updateDistancePreview();
    });
  }

  document.getElementById('draw-route-btn')?.addEventListener('click', () => {
    document.querySelector('.leaflet-draw-draw-polyline')?.click();
  });

  document.getElementById('clear-route-btn')?.addEventListener('click', () => {
    drawnItems?.clearLayers();
    routeWaypoints = [];
    updateDistancePreview();
  });

  // Try geolocation
  navigator.geolocation?.getCurrentPosition(pos => {
    createMap?.setView([pos.coords.latitude, pos.coords.longitude], 10);
  }, () => {});
}

function updateDistancePreview() {
  const preview = document.getElementById('route-distance-preview');
  if (!preview) return;
  if (routeWaypoints.length > 1) {
    const dist = calculateDistance(routeWaypoints);
    preview.textContent = `${dist.toFixed(1)} km`;
  } else {
    preview.textContent = '';
  }
}

function bindGpxUpload() {
  document.getElementById('gpx-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const points = parseGPX(text);
    if (!points.length) { toast.error('GPX dosyası okunamadı'); return; }
    routeWaypoints = points;

    if (createMap && drawnItems && typeof L !== 'undefined') {
      drawnItems.clearLayers();
      const latlngs = points.map(p => [p[0], p[1]]);
      const poly = L.polyline(latlngs, { color: '#FF6B35', weight: 4 }).addTo(drawnItems);
      createMap.fitBounds(poly.getBounds(), { padding: [20, 20] });
    }
    updateDistancePreview();
    toast.success(`GPX yüklendi: ${points.length} nokta`);
  });
}

function bindRouteForm() {
  document.getElementById('route-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user) { toast.error('Giriş yapmanız gerekiyor'); navigate('/login'); return; }
    if (routeWaypoints.length < 2) { showFormError('route-form-error', 'Lütfen harita üzerinde bir rota çizin veya GPX yükleyin'); return; }

    const btn = document.getElementById('create-route-btn');
    btn.disabled = true; btn.classList.add('btn-loading');
    const data = new FormData(e.target);

    try {
      const dist = calculateDistance(routeWaypoints);
      const elevGain = calculateElevationGain(routeWaypoints);
      const tags = data.get('tags') ? data.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [];

      const route = await createRoute({
        title: data.get('title'),
        description: data.get('description') || null,
        difficulty: data.get('difficulty'),
        road_type: data.get('road_type') || null,
        vehicle_type: data.get('vehicle_type'),
        is_public: data.has('is_public'),
        distance: Math.round(dist * 10) / 10,
        elevation_gain: elevGain,
        waypoints: routeWaypoints,
        tags
      });
      toast.success('Rota oluşturuldu!');
      navigate(`/routes/${route.id}`);
    } catch (err) {
      showFormError('route-form-error', err.message);
      btn.disabled = false; btn.classList.remove('btn-loading');
    }
  });
}

function renderEventForm(area) {
  area.innerHTML = `<div class="create-form-card">
    <h2 style="margin-bottom:var(--sp-6);font-size:var(--text-xl)"><i class="fas fa-calendar-plus" style="color:var(--accent-dark)"></i> Yeni Etkinlik Oluştur</h2>
    <form id="event-form">
      <div class="form-group">
        <label class="form-label">Etkinlik Adı *</label>
        <input type="text" name="title" class="form-input" placeholder="Örn: İstanbul Boğaz Turu" required maxlength="100">
      </div>
      <div class="grid-2" style="gap:var(--sp-4)">
        <div class="form-group">
          <label class="form-label">Tarih & Saat *</label>
          <input type="datetime-local" name="date" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Bitiş Saati</label>
          <input type="datetime-local" name="end_date" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Zorluk</label>
          <select name="difficulty" class="form-select">
            <option value="">Seçin...</option>
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
            <option value="expert">Uzman</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Araç Tipi</label>
          <select name="vehicle_type" class="form-select">
            <option value="motorcycle">🏍️ Motosiklet</option>
            <option value="bicycle">🚲 Bisiklet</option>
            <option value="both">🔄 Her İkisi</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Buluşma Yeri</label>
          <input type="text" name="location_name" class="form-input" placeholder="Örn: Sultanahmet Meydanı">
        </div>
        <div class="form-group">
          <label class="form-label">Maksimum Katılımcı</label>
          <input type="number" name="max_participants" class="form-input" min="2" placeholder="Sınırsız">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Açıklama</label>
        <textarea name="description" class="form-textarea" placeholder="Etkinlik detaylarını, buluşma noktasını ve planı açıklayın..." rows="5"></textarea>
      </div>
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-6)">
        <label class="toggle-switch"><input type="checkbox" name="is_public" checked class="toggle-input"><span class="toggle-slider"></span></label>
        <span style="font-size:var(--text-sm)">Herkese Açık Etkinlik</span>
      </div>
      <div id="event-form-error" class="form-error hidden" style="margin-bottom:var(--sp-4)"><i class="fas fa-exclamation-circle"></i> <span></span></div>
      <button type="submit" class="btn btn-primary btn-xl btn-full" id="create-event-btn"><i class="fas fa-save"></i> Etkinliği Oluştur</button>
    </form>
  </div>`;

  // Set min datetime to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.querySelector('[name="date"]').min = now.toISOString().slice(0, 16);

  document.getElementById('event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user) { toast.error('Giriş yapmanız gerekiyor'); navigate('/login'); return; }
    const btn = document.getElementById('create-event-btn');
    btn.disabled = true; btn.classList.add('btn-loading');
    const data = new FormData(e.target);
    try {
      const event = await createEvent({
        title: data.get('title'),
        description: data.get('description') || null,
        date: new Date(data.get('date')).toISOString(),
        end_date: data.get('end_date') ? new Date(data.get('end_date')).toISOString() : null,
        location_name: data.get('location_name') || null,
        difficulty: data.get('difficulty') || null,
        vehicle_type: data.get('vehicle_type'),
        max_participants: data.get('max_participants') ? parseInt(data.get('max_participants')) : null,
        is_public: data.has('is_public')
      });
      toast.success('Etkinlik oluşturuldu!');
      navigate(`/events/${event.id}`);
    } catch (err) {
      showFormError('event-form-error', err.message);
      btn.disabled = false; btn.classList.remove('btn-loading');
    }
  });
}

function renderClubForm(area) {
  area.innerHTML = `<div class="create-form-card">
    <h2 style="margin-bottom:var(--sp-6);font-size:var(--text-xl)"><i class="fas fa-users" style="color:var(--secondary)"></i> Yeni Kulüp Oluştur</h2>
    <form id="club-form">
      <div class="form-group">
        <label class="form-label">Kulüp Adı *</label>
        <input type="text" name="name" class="form-input" placeholder="Örn: İstanbul Motosiklet Kulübü" required maxlength="100">
      </div>
      <div class="grid-2" style="gap:var(--sp-4)">
        <div class="form-group">
          <label class="form-label">Araç Tipi</label>
          <select name="vehicle_type" class="form-select">
            <option value="motorcycle">🏍️ Motosiklet</option>
            <option value="bicycle">🚲 Bisiklet</option>
            <option value="both">🔄 Her İkisi</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Üyelik Tipi</label>
          <select name="join_type" class="form-select">
            <option value="open">Açık (Herkese)</option>
            <option value="approval">Onay Gerekli</option>
            <option value="invite">Sadece Davet</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Şehir / Bölge</label>
        <input type="text" name="location" class="form-input" placeholder="Örn: İstanbul, Türkiye">
      </div>
      <div class="form-group">
        <label class="form-label">Açıklama *</label>
        <textarea name="description" class="form-textarea" placeholder="Kulübünüzü tanıtın, kimler için olduğunu anlatın..." rows="5" required></textarea>
      </div>
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-6)">
        <label class="toggle-switch"><input type="checkbox" name="is_public" checked class="toggle-input"><span class="toggle-slider"></span></label>
        <span style="font-size:var(--text-sm)">Herkese Açık Kulüp</span>
      </div>
      <div id="club-form-error" class="form-error hidden" style="margin-bottom:var(--sp-4)"><i class="fas fa-exclamation-circle"></i> <span></span></div>
      <button type="submit" class="btn btn-primary btn-xl btn-full" id="create-club-btn"><i class="fas fa-save"></i> Kulübü Oluştur</button>
    </form>
  </div>`;

  document.getElementById('club-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user) { toast.error('Giriş yapmanız gerekiyor'); navigate('/login'); return; }
    const btn = document.getElementById('create-club-btn');
    btn.disabled = true; btn.classList.add('btn-loading');
    const data = new FormData(e.target);
    try {
      const club = await createClub({
        name: data.get('name'),
        description: data.get('description'),
        vehicle_type: data.get('vehicle_type'),
        join_type: data.get('join_type'),
        location: data.get('location') || null,
        is_public: data.has('is_public')
      });
      toast.success('Kulüp oluşturuldu!');
      navigate(`/clubs/${club.id}`);
    } catch (err) {
      showFormError('club-form-error', err.message);
      btn.disabled = false; btn.classList.remove('btn-loading');
    }
  });
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelector('span').textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
