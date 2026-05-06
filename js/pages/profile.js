import { getProfile, getProfileByUsername, getRoutes, getEvents } from '../utils/api.js';
import { followUser, unfollowUser, isFollowing } from '../utils/api.js';
import { getUser, getProfile as getMyProfile, updateProfile, getAvatarUrl } from '../auth.js';
import { formatDistance, formatNumber, timeAgo, getDifficultyClass, getDifficultyLabel, escapeHtml, avatarFallback } from '../utils/helpers.js';
import { toast } from '../components/toast.js';
import { db } from '../supabase-client.js';

export async function renderProfile({ params = {} } = {}) {
  const content = document.getElementById('page-content');
  const me = getUser();
  const myProfile = getMyProfile();

  content.innerHTML = `<div class="page-loading" style="min-height:400px"><div class="spinner"></div></div>`;

  try {
    let profile;
    if (!params.id || params.id === me?.id) {
      profile = myProfile || (me?.id ? await getProfile(me.id).catch(() => null) : null);
    } else {
      profile = await getProfile(params.id).catch(() => null);
      if (!profile) profile = await getProfileByUsername(params.id).catch(() => null);
    }

    if (!profile) throw new Error('Profil bulunamadı');

    const isOwnProfile = profile.id === me?.id;
    const [routes, following] = await Promise.all([
      getRoutes({ userId: profile.id, limit: 6 }).catch(() => ({ data: [] })),
      isOwnProfile ? Promise.resolve(false) : isFollowing(profile.id).catch(() => false)
    ]);

    renderProfilePage(profile, routes.data, isOwnProfile, following);
  } catch (err) {
    content.innerHTML = `<div class="page"><div class="empty-state"><i class="fas fa-user-slash"></i><p>Profil bulunamadı</p><span>${err.message}</span><a href="#/" class="btn btn-primary btn-sm">Ana Sayfaya Dön</a></div></div>`;
  }
}

function renderProfilePage(profile, routes, isOwnProfile, isFollowed) {
  const content = document.getElementById('page-content');

  content.innerHTML = `<div class="page-full page-enter">
    <div class="profile-cover">
      ${profile.cover_url ? `<img src="${profile.cover_url}" alt="">` : ''}
      ${isOwnProfile ? `<div class="profile-cover-edit"><button class="btn btn-sm" style="background:rgba(0,0,0,.5);color:white;border:1px solid rgba(255,255,255,.3)" id="edit-cover-btn"><i class="fas fa-camera"></i> Kapak</button></div>` : ''}
    </div>

    <div class="profile-info-section">
      <div class="profile-top-row">
        <div class="profile-avatar-edit">
          <img src="${profile.avatar_url || avatarFallback(profile.full_name || profile.username)}"
               alt="" class="avatar avatar-2xl" id="profile-avatar-img"
               onerror="this.src='${avatarFallback(profile.full_name || profile.username)}'">
          ${isOwnProfile ? `<div class="avatar-edit-overlay" id="edit-avatar-btn"><i class="fas fa-camera"></i></div>` : ''}
        </div>
        <div class="follow-actions">
          ${isOwnProfile ? `
            <button class="btn btn-outline" id="edit-profile-btn"><i class="fas fa-edit"></i> Profili Düzenle</button>
            <a href="#/settings" class="btn btn-ghost"><i class="fas fa-cog"></i></a>
          ` : `
            <button class="btn ${isFollowed ? 'btn-outline' : 'btn-primary'}" id="follow-btn">
              <i class="fas ${isFollowed ? 'fa-user-check' : 'fa-user-plus'}"></i>
              ${isFollowed ? 'Takip Ediliyor' : 'Takip Et'}
            </button>
            <a href="#/messages/${profile.id}" class="btn btn-outline"><i class="fas fa-comment"></i></a>
          `}
        </div>
      </div>

      <div class="profile-display-name">${escapeHtml(profile.full_name || profile.username)}</div>
      <div class="profile-username">@${escapeHtml(profile.username)}</div>

      ${profile.bio ? `<p class="profile-bio">${escapeHtml(profile.bio)}</p>` : ''}

      <div style="display:flex;flex-wrap:wrap;gap:var(--sp-4);color:var(--text-3);font-size:var(--text-sm);margin-bottom:var(--sp-5)">
        ${profile.location ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(profile.location)}</span>` : ''}
        ${profile.vehicle_type ? `<span>${profile.vehicle_type === 'motorcycle' ? '🏍️' : profile.vehicle_type === 'bicycle' ? '🚲' : '🔄'} ${profile.vehicle_type === 'motorcycle' ? 'Motosiklet' : profile.vehicle_type === 'bicycle' ? 'Bisiklet' : 'Her İkisi'}</span>` : ''}
        <span><i class="fas fa-calendar"></i> ${new Date(profile.created_at).getFullYear()}'den beri üye</span>
      </div>

      <div class="profile-stats-row">
        <div class="profile-stat"><div class="profile-stat-val">${formatNumber(profile.follower_count || 0)}</div><div class="profile-stat-lbl">Takipçi</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${formatNumber(profile.following_count || 0)}</div><div class="profile-stat-lbl">Takip</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${formatDistance(profile.total_km)}</div><div class="profile-stat-lbl">Toplam km</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${profile.total_rides || 0}</div><div class="profile-stat-lbl">Sürüş</div></div>
      </div>

      <div class="profile-badges" id="profile-badges">${renderBadges(profile)}</div>
    </div>

    <div class="page">
      <div class="tabs" style="margin-bottom:var(--sp-6)">
        <button class="tab-btn active" data-tab="routes"><i class="fas fa-route"></i> Rotalar</button>
        <button class="tab-btn" data-tab="stats"><i class="fas fa-chart-bar"></i> İstatistikler</button>
      </div>

      <div id="tab-routes">${renderUserRoutes(routes)}</div>
      <div id="tab-stats" style="display:none">${renderUserStats(profile)}</div>
    </div>
  </div>`;

  // Edit profile modal
  if (isOwnProfile) {
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => openEditProfileModal(profile));
    document.getElementById('edit-avatar-btn')?.addEventListener('click', () => openAvatarUpload(profile));
    document.getElementById('edit-cover-btn')?.addEventListener('click', () => openCoverUpload(profile));
  }

  // Follow
  if (!isOwnProfile) {
    let followed = isFollowed;
    document.getElementById('follow-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const me = getUser();
      if (!me) { toast.warning('Takip etmek için giriş yapın'); return; }
      btn.disabled = true;
      try {
        if (followed) {
          await unfollowUser(profile.id);
          followed = false;
          btn.innerHTML = '<i class="fas fa-user-plus"></i> Takip Et';
          btn.className = 'btn btn-primary';
          toast.info('Takipten çıkıldı');
        } else {
          await followUser(profile.id);
          followed = true;
          btn.innerHTML = '<i class="fas fa-user-check"></i> Takip Ediliyor';
          btn.className = 'btn btn-outline';
          toast.success('Takip edildi!');
        }
      } catch (err) { toast.error(err.message); }
      finally { btn.disabled = false; }
    });
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-routes').style.display = btn.dataset.tab === 'routes' ? '' : 'none';
      document.getElementById('tab-stats').style.display = btn.dataset.tab === 'stats' ? '' : 'none';
    });
  });
}

function renderBadges(profile) {
  const badges = [];
  if ((profile.total_km || 0) >= 1000) badges.push({ icon: '🏆', label: '1K km' });
  if ((profile.total_km || 0) >= 5000) badges.push({ icon: '🌟', label: '5K km' });
  if ((profile.total_rides || 0) >= 10) badges.push({ icon: '🔥', label: '10 Sürüş' });
  if ((profile.follower_count || 0) >= 100) badges.push({ icon: '👥', label: '100 Takipçi' });
  if (!badges.length) return '<span style="color:var(--text-4);font-size:var(--text-sm)">Henüz rozet kazanılmadı</span>';
  return badges.map(b => `<div class="badge-item"><span class="badge-icon">${b.icon}</span><span class="badge-label">${b.label}</span></div>`).join('');
}

function renderUserRoutes(routes) {
  if (!routes.length) return '<div class="empty-state sm"><i class="fas fa-route"></i><p>Henüz rota paylaşılmadı</p></div>';
  return `<div class="grid-auto">${routes.map(r => `
    <a href="#/routes/${r.id}" class="route-card card-interactive">
      <div class="route-card-thumb">
        ${r.thumbnail_url ? `<img src="${r.thumbnail_url}" alt="" loading="lazy">` : `<div style="width:100%;height:180px;background:var(--grad-hero);display:flex;align-items:center;justify-content:center"><i class="fas fa-route" style="font-size:2rem;color:rgba(255,255,255,.3)"></i></div>`}
        <div class="route-card-overlay"><span class="route-card-distance">${formatDistance(r.distance)}</span></div>
      </div>
      <div class="route-card-body">
        <div class="route-card-title">${escapeHtml(r.title)}</div>
        <div class="route-card-meta">
          <span class="tag ${getDifficultyClass(r.difficulty)}">${getDifficultyLabel(r.difficulty)}</span>
          <span class="route-card-meta-item"><i class="fas fa-eye"></i>${r.view_count || 0}</span>
        </div>
      </div>
    </a>`).join('')}</div>`;
}

function renderUserStats(profile) {
  return `<div class="grid-2" style="gap:var(--sp-5)">
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--primary-alpha);color:var(--primary)"><i class="fas fa-road"></i></div>
      <div class="stat-card-value">${formatDistance(profile.total_km)}</div>
      <div class="stat-card-label">Toplam Mesafe</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--accent-alpha);color:var(--accent-dark)"><i class="fas fa-flag-checkered"></i></div>
      <div class="stat-card-value">${profile.total_rides || 0}</div>
      <div class="stat-card-label">Tamamlanan Sürüş</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--info-alpha);color:var(--info)"><i class="fas fa-tachometer-alt"></i></div>
      <div class="stat-card-value">${profile.avg_speed ? profile.avg_speed.toFixed(1) + ' km/s' : '-'}</div>
      <div class="stat-card-label">Ortalama Hız</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--success-alpha);color:var(--success)"><i class="fas fa-users"></i></div>
      <div class="stat-card-value">${profile.follower_count || 0}</div>
      <div class="stat-card-label">Takipçi</div>
    </div>
  </div>`;
}

function openEditProfileModal(profile) {
  const { openModal, closeModal } = window._modal;
  if (!openModal) return;

  openModal(`
    <h3 style="margin-bottom:var(--sp-6)"><i class="fas fa-user-edit" style="color:var(--primary)"></i> Profili Düzenle</h3>
    <form id="edit-profile-form">
      <div class="form-group">
        <label class="form-label">Ad Soyad</label>
        <input type="text" name="full_name" class="form-input" value="${escapeHtml(profile.full_name || '')}" maxlength="60">
      </div>
      <div class="form-group">
        <label class="form-label">Kullanıcı Adı</label>
        <div class="input-group">
          <span class="input-icon-left">@</span>
          <input type="text" name="username" class="form-input" value="${escapeHtml(profile.username || '')}" required pattern="[a-zA-Z0-9_]{3,20}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Biyografi</label>
        <textarea name="bio" class="form-textarea" maxlength="200" rows="3">${escapeHtml(profile.bio || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Şehir / Konum</label>
        <input type="text" name="location" class="form-input" value="${escapeHtml(profile.location || '')}" placeholder="İstanbul, Türkiye">
      </div>
      <div class="form-group">
        <label class="form-label">Araç Tipi</label>
        <select name="vehicle_type" class="form-select">
          <option value="motorcycle" ${profile.vehicle_type === 'motorcycle' ? 'selected' : ''}>🏍️ Motosiklet</option>
          <option value="bicycle" ${profile.vehicle_type === 'bicycle' ? 'selected' : ''}>🚲 Bisiklet</option>
          <option value="both" ${profile.vehicle_type === 'both' ? 'selected' : ''}>🔄 Her İkisi</option>
        </select>
      </div>
      <div id="edit-profile-error" class="form-error hidden" style="margin-bottom:var(--sp-3)"></div>
      <button type="submit" class="btn btn-primary btn-full" id="save-profile-btn"><i class="fas fa-save"></i> Kaydet</button>
    </form>
  `, {
    onMount: (el) => {
      el.querySelector('#edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = el.querySelector('#save-profile-btn');
        btn.disabled = true; btn.classList.add('btn-loading');
        const data = new FormData(e.target);
        try {
          await updateProfile({
            full_name: data.get('full_name'),
            username: data.get('username'),
            bio: data.get('bio'),
            location: data.get('location'),
            vehicle_type: data.get('vehicle_type')
          });
          toast.success('Profil güncellendi!');
          closeModal();
          renderProfile({});
        } catch (err) {
          const errEl = el.querySelector('#edit-profile-error');
          errEl.textContent = err.message;
          errEl.classList.remove('hidden');
          btn.disabled = false; btn.classList.remove('btn-loading');
        }
      });
    }
  });
}

function openAvatarUpload(profile) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Dosya 2MB\'dan küçük olmalı'); return; }
    const user = getUser();
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    try {
      const { error: upErr } = await db.storage().from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = db.storage().from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: publicUrl });
      document.getElementById('profile-avatar-img').src = publicUrl;
      document.getElementById('sidebar-avatar').src = publicUrl;
      toast.success('Profil fotoğrafı güncellendi!');
    } catch (err) { toast.error(err.message); }
  };
  input.click();
}

function openCoverUpload(profile) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Dosya 5MB\'dan küçük olmalı'); return; }
    const user = getUser();
    const ext = file.name.split('.').pop();
    const path = `covers/${user.id}.${ext}`;
    try {
      const { error: upErr } = await db.storage().from('covers').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = db.storage().from('covers').getPublicUrl(path);
      await updateProfile({ cover_url: publicUrl });
      toast.success('Kapak fotoğrafı güncellendi!');
    } catch (err) { toast.error(err.message); }
  };
  input.click();
}
