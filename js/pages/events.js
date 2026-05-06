import { getEvents, getEvent, getEventParticipants, rsvpEvent, getUserRsvp } from '../utils/api.js';
import { formatDate, formatTime, getDifficultyClass, getDifficultyLabel, getVehicleLabel, timeAgo, escapeHtml, avatarFallback } from '../utils/helpers.js';
import { getUser } from '../auth.js';
import { toast } from '../components/toast.js';
import { MAP_DEFAULT } from '../config.js';

let eventsMap = null;
let currentPage = 0;
let isLoading = false;
let hasMore = true;

export async function renderEvents({ query = {} } = {}) {
  const content = document.getElementById('page-content');
  currentPage = 0; hasMore = true;

  content.innerHTML = `<div class="page-full page-enter">
    <div class="page">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4);margin-bottom:var(--sp-6)">
        <div>
          <h1 style="font-size:var(--text-3xl);font-weight:900">Etkinlikler</h1>
          <p style="color:var(--text-3);margin-top:var(--sp-1)">Yakındaki sürüş etkinliklerini keşfet ve katıl</p>
        </div>
        <a href="#/create?type=event" class="btn btn-primary"><i class="fas fa-calendar-plus"></i> Etkinlik Oluştur</a>
      </div>

      <div class="filter-bar" style="margin-bottom:var(--sp-5)">
        <button class="filter-chip active" data-filter="upcoming">Yaklaşanlar</button>
        <button class="filter-chip" data-filter="all">Tümü</button>
        <select class="filter-select" id="ev-vehicle-filter">
          <option value="">Tüm Araçlar</option>
          <option value="motorcycle">🏍️ Motosiklet</option>
          <option value="bicycle">🚲 Bisiklet</option>
          <option value="both">🔄 Her İkisi</option>
        </select>
        <select class="filter-select" id="ev-diff-filter">
          <option value="">Tüm Zorluklar</option>
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
          <option value="expert">Uzman</option>
        </select>
      </div>

      <div class="events-layout">
        <div>
          <div id="events-list" class="grid-auto"></div>
          <div id="events-loading" class="page-loading hidden"><div class="spinner"></div></div>
          <div id="events-empty" class="empty-state hidden"><i class="fas fa-calendar-times"></i><p>Etkinlik bulunamadı</p><span>Yakında yeni etkinlikler eklenecek</span><a href="#/create?type=event" class="btn btn-primary btn-sm">Etkinlik Oluştur</a></div>
          <div id="events-end" class="empty-state sm hidden"><i class="fas fa-check-circle"></i><p>Tüm etkinlikler yüklendi</p></div>
        </div>
        <aside class="events-map-panel">
          <div class="events-map-sticky">
            <div id="events-map" style="width:100%;height:100%"></div>
          </div>
        </aside>
      </div>
    </div>
  </div>`;

  setupEventFilters();
  await loadEvents(true, { upcoming: true });
  initEventsMap();
  setupEventsInfiniteScroll();
}

function setupEventFilters() {
  let upcoming = true;
  document.querySelectorAll('[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      upcoming = chip.dataset.filter === 'upcoming';
      currentPage = 0; hasMore = true;
      loadEvents(true, { upcoming });
    });
  });
}

async function loadEvents(reset = false, opts = {}) {
  if (isLoading || (!hasMore && !reset)) return;
  isLoading = true;
  const list = document.getElementById('events-list');
  const loading = document.getElementById('events-loading');
  const empty = document.getElementById('events-empty');
  const end = document.getElementById('events-end');

  if (reset) {
    currentPage = 0; hasMore = true;
    if (list) list.innerHTML = '';
    end?.classList.add('hidden');
    empty?.classList.add('hidden');
  }

  loading?.classList.remove('hidden');

  try {
    const { data } = await getEvents({ page: currentPage, limit: 9, ...opts });
    loading?.classList.add('hidden');

    if (reset && !data.length) { empty?.classList.remove('hidden'); isLoading = false; return; }
    if (data.length < 9) { hasMore = false; end?.classList.remove('hidden'); } else currentPage++;

    data.forEach(ev => {
      const el = document.createElement('div');
      el.innerHTML = renderEventCard(ev);
      list?.appendChild(el.firstElementChild);
    });
  } catch (err) {
    loading?.classList.add('hidden');
  }
  isLoading = false;
}

function initEventsMap() {
  const mapEl = document.getElementById('events-map');
  if (!mapEl || typeof L === 'undefined') return;
  eventsMap = L.map('events-map').setView(MAP_DEFAULT.center, 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(eventsMap);
}

function setupEventsInfiniteScroll() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = content;
    if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoading && hasMore) {
      loadEvents(false, { upcoming: document.querySelector('[data-filter="upcoming"]')?.classList.contains('active') });
    }
  });
}

export async function renderEventDetail({ params }) {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="page-loading" style="min-height:400px"><div class="spinner"></div></div>`;

  try {
    const event = await getEvent(params.id);
    const [participants, myRsvp] = await Promise.all([
      getEventParticipants(params.id).catch(() => []),
      getUserRsvp(params.id).catch(() => null)
    ]);
    renderEvent(event, participants, myRsvp);
  } catch (err) {
    content.innerHTML = `<div class="page"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Etkinlik bulunamadı</p><a href="#/events" class="btn btn-primary btn-sm">Geri Dön</a></div></div>`;
  }
}

function renderEvent(event, participants, myRsvp) {
  const content = document.getElementById('page-content');
  const date = new Date(event.date);
  const goingCount = participants.filter(p => p.status === 'going').length;

  content.innerHTML = `<div class="page-full page-enter">
    <div class="event-cover-full">
      ${event.cover_image ? `<img src="${event.cover_image}" alt="${escapeHtml(event.title)}">` : `<div style="width:100%;height:100%;background:var(--grad-hero)"></div>`}
      <div class="event-cover-overlay"></div>
      <div class="event-cover-content">
        <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-3)">
          ${event.difficulty ? `<span class="tag ${getDifficultyClass(event.difficulty)}">${getDifficultyLabel(event.difficulty)}</span>` : ''}
          ${event.vehicle_type ? `<span class="tag" style="background:rgba(255,255,255,.2);color:white">${getVehicleLabel(event.vehicle_type)}</span>` : ''}
        </div>
        <h1 style="font-size:clamp(1.5rem,3vw,2.5rem);font-weight:900">${escapeHtml(event.title)}</h1>
      </div>
    </div>

    <div class="event-detail-grid page">
      <div>
        <div class="card" style="margin-bottom:var(--sp-5)">
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-4)">
              <div style="display:flex;gap:var(--sp-3)">
                <div style="width:40px;height:40px;background:var(--primary-alpha);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;color:var(--primary);flex-shrink:0"><i class="fas fa-calendar"></i></div>
                <div><div style="font-weight:600;font-size:var(--text-sm)">Tarih</div><div style="color:var(--text-3);font-size:var(--text-xs)">${formatDate(event.date)} ${formatTime(event.date)}</div></div>
              </div>
              ${event.location_name ? `<div style="display:flex;gap:var(--sp-3)">
                <div style="width:40px;height:40px;background:var(--accent-alpha);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;color:var(--accent-dark);flex-shrink:0"><i class="fas fa-map-marker-alt"></i></div>
                <div><div style="font-weight:600;font-size:var(--text-sm)">Lokasyon</div><div style="color:var(--text-3);font-size:var(--text-xs)">${escapeHtml(event.location_name)}</div></div>
              </div>` : ''}
              <div style="display:flex;gap:var(--sp-3)">
                <div style="width:40px;height:40px;background:var(--info-alpha);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;color:var(--info);flex-shrink:0"><i class="fas fa-users"></i></div>
                <div><div style="font-weight:600;font-size:var(--text-sm)">Katılımcı</div><div style="color:var(--text-3);font-size:var(--text-xs)">${goingCount} katılıyor${event.max_participants ? ` / ${event.max_participants} max` : ''}</div></div>
              </div>
              ${event.required_equipment?.length ? `<div style="display:flex;gap:var(--sp-3)">
                <div style="width:40px;height:40px;background:var(--warning-alpha);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;color:var(--warning);flex-shrink:0"><i class="fas fa-tools"></i></div>
                <div><div style="font-weight:600;font-size:var(--text-sm)">Ekipman</div><div style="color:var(--text-3);font-size:var(--text-xs)">${event.required_equipment.join(', ')}</div></div>
              </div>` : ''}
            </div>
          </div>
        </div>

        ${event.description ? `<div class="card" style="margin-bottom:var(--sp-5)"><div class="card-body"><h3 style="margin-bottom:var(--sp-3)">Hakkında</h3><p style="color:var(--text-2);line-height:1.7;font-size:var(--text-sm)">${escapeHtml(event.description)}</p></div></div>` : ''}

        ${event.location_lat && event.location_lng ? `<div style="margin-bottom:var(--sp-5)">
          <h3 style="margin-bottom:var(--sp-3)">Buluşma Noktası</h3>
          <div style="height:250px;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--border)" id="event-map"></div>
        </div>` : ''}

        <div style="margin-bottom:var(--sp-5)">
          <div class="section-header"><div class="section-title">Katılımcılar (${goingCount})</div></div>
          ${participants.length ? `<div style="display:flex;flex-wrap:wrap;gap:var(--sp-3)">
            ${participants.filter(p => p.status === 'going').map(p => `
              <a href="#/profile/${p.user_id}" style="display:flex;align-items:center;gap:var(--sp-2);text-decoration:none;padding:var(--sp-2) var(--sp-3);background:var(--surface-2);border-radius:var(--r-full)">
                <img src="${p.profiles?.avatar_url || avatarFallback(p.profiles?.full_name || 'U')}" alt="" class="avatar avatar-xs">
                <span style="font-size:var(--text-xs);font-weight:500">${escapeHtml(p.profiles?.username || 'Kullanıcı')}</span>
              </a>`).join('')}
          </div>` : '<div class="empty-state sm"><i class="fas fa-user-slash"></i><p>Henüz katılımcı yok</p></div>'}
        </div>
      </div>

      <aside>
        <div class="card" style="position:sticky;top:calc(var(--header-h)+var(--sp-4))">
          <div class="card-body">
            <h3 style="margin-bottom:var(--sp-4)">Katılım Durumu</h3>
            <div class="rsvp-section" style="padding:0;border:none">
              <div class="rsvp-options">
                <button class="rsvp-btn going ${myRsvp === 'going' ? 'selected going' : ''}" data-status="going"><i class="fas fa-check-circle"></i>Katılıyorum</button>
                <button class="rsvp-btn maybe ${myRsvp === 'maybe' ? 'selected maybe' : ''}" data-status="maybe"><i class="fas fa-question-circle"></i>Belki</button>
                <button class="rsvp-btn not_going ${myRsvp === 'not_going' ? 'selected not_going' : ''}" data-status="not_going"><i class="fas fa-times-circle"></i>Katılmıyorum</button>
              </div>
            </div>
          </div>

          <div class="card-footer" style="background:none">
            <div style="display:flex;gap:var(--sp-3)">
              <button class="btn btn-ghost btn-full" id="share-event-btn"><i class="fas fa-share-alt"></i> Paylaş</button>
            </div>
          </div>

          <div class="card-footer">
            <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--sp-3)">Düzenleyen</div>
            <a href="#/profile/${event.created_by}" style="display:flex;align-items:center;gap:var(--sp-3);text-decoration:none">
              <img src="${event.profiles?.avatar_url || avatarFallback(event.profiles?.full_name || 'U')}" alt="" class="avatar avatar-md">
              <div>
                <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(event.profiles?.full_name || event.profiles?.username || 'Sürücü')}</div>
                <div style="font-size:var(--text-xs);color:var(--text-3)">@${escapeHtml(event.profiles?.username || '')}</div>
              </div>
            </a>
          </div>
        </div>
      </aside>
    </div>
  </div>`;

  if (event.location_lat && event.location_lng) initEventMap(event);
  bindEventActions(event, myRsvp);
}

function initEventMap(event) {
  if (typeof L === 'undefined') return;
  const map = L.map('event-map').setView([event.location_lat, event.location_lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
  L.marker([event.location_lat, event.location_lng], {
    icon: L.divIcon({ className: '', html: '<div style="background:var(--primary);color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:var(--shadow-md);border:3px solid white"><i class="fas fa-flag"></i></div>', iconSize: [36,36], iconAnchor: [18,18] })
  }).addTo(map).bindPopup(event.location_name || 'Buluşma noktası').openPopup();
}

function bindEventActions(event, initialRsvp) {
  let myRsvp = initialRsvp;
  document.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const user = getUser();
      if (!user) { toast.warning('RSVP için giriş yapın'); return; }
      const status = btn.dataset.status;
      btn.disabled = true;
      try {
        await rsvpEvent(event.id, status);
        document.querySelectorAll('.rsvp-btn').forEach(b => b.classList.remove('selected', 'going', 'maybe', 'not_going'));
        btn.classList.add('selected', status);
        myRsvp = status;
        const labels = { going: 'Katılım onaylandı!', maybe: 'Belki olarak işaretlendi', not_going: 'Katılmıyorsunuz' };
        toast.success(labels[status]);
      } catch (err) {
        toast.error(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });

  document.getElementById('share-event-btn')?.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: event.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.info('Bağlantı kopyalandı'); }
    } catch {}
  });
}

function renderEventCard(ev) {
  const date = new Date(ev.date);
  return `<a href="#/events/${ev.id}" class="event-card">
    <div class="event-card-cover">
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
