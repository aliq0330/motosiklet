import { getClubs, getClub, getClubMembers, joinClub, leaveClub, isClubMember, getEvents } from '../utils/api.js';
import { formatNumber, timeAgo, escapeHtml, avatarFallback, debounce } from '../utils/helpers.js';
import { getUser } from '../auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';

let page = 0;
let loading = false;
let hasMore = true;

export async function renderClubs() {
  const content = document.getElementById('page-content');
  page = 0; hasMore = true;

  content.innerHTML = `<div class="page page-enter">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4);margin-bottom:var(--sp-6)">
      <div>
        <h1 style="font-size:var(--text-3xl);font-weight:900">Kulüpler</h1>
        <p style="color:var(--text-3);margin-top:4px">Topluluklara katıl, etkinliklere birlikte gidin</p>
      </div>
      <a href="#/create?type=club" class="btn btn-primary"><i class="fas fa-plus"></i> Kulüp Kur</a>
    </div>

    <div style="position:relative;margin-bottom:var(--sp-5)">
      <i class="fas fa-search" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-3)"></i>
      <input type="text" id="club-search" class="form-input" style="padding-left:44px;border-radius:var(--r-full)" placeholder="Kulüp ara...">
    </div>

    <div id="clubs-grid" class="grid-auto"></div>
    <div id="clubs-loading" class="page-loading hidden"><div class="spinner"></div></div>
    <div id="clubs-empty" class="empty-state hidden"><i class="fas fa-users-slash"></i><p>Kulüp bulunamadı</p><span>İlk kulübü sen kur!</span><a href="#/create?type=club" class="btn btn-primary btn-sm">Kulüp Kur</a></div>
    <div id="clubs-end" class="empty-state sm hidden"><i class="fas fa-check-circle"></i><p>Tüm kulüpler yüklendi</p></div>
  </div>`;

  await loadClubs(true);

  const debouncedSearch = debounce(async () => {
    page = 0; hasMore = true;
    await loadClubs(true, { search: document.getElementById('club-search').value.trim() });
  }, 400);
  document.getElementById('club-search')?.addEventListener('input', debouncedSearch);

  setupInfiniteScroll();
}

async function loadClubs(reset = false, opts = {}) {
  if (loading || (!hasMore && !reset)) return;
  loading = true;
  const grid = document.getElementById('clubs-grid');
  const loadingEl = document.getElementById('clubs-loading');
  const empty = document.getElementById('clubs-empty');
  const end = document.getElementById('clubs-end');

  if (reset) { page = 0; hasMore = true; if (grid) grid.innerHTML = ''; end?.classList.add('hidden'); empty?.classList.add('hidden'); }
  loadingEl?.classList.remove('hidden');

  try {
    const { data } = await getClubs({ page, limit: 12, ...opts });
    loadingEl?.classList.add('hidden');
    if (reset && !data.length) { empty?.classList.remove('hidden'); loading = false; return; }
    if (data.length < 12) { hasMore = false; end?.classList.remove('hidden'); } else page++;
    data.forEach(club => {
      const el = document.createElement('div');
      el.innerHTML = renderClubCard(club);
      grid?.appendChild(el.firstElementChild);
    });
  } catch (err) { loadingEl?.classList.add('hidden'); }
  loading = false;
}

function setupInfiniteScroll() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = content;
    if (scrollTop + clientHeight >= scrollHeight - 300 && !loading && hasMore) loadClubs();
  });
}

export async function renderClubDetail({ params }) {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="page-loading" style="min-height:400px"><div class="spinner"></div></div>`;

  try {
    const club = await getClub(params.id);
    const [members, isMember] = await Promise.all([
      getClubMembers(params.id).catch(() => []),
      isClubMember(params.id).catch(() => false)
    ]);
    renderClub(club, members, isMember);
  } catch (err) {
    content.innerHTML = `<div class="page"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Kulüp bulunamadı</p><a href="#/clubs" class="btn btn-primary btn-sm">Geri Dön</a></div></div>`;
  }
}

function renderClub(club, members, isMember) {
  const content = document.getElementById('page-content');
  const user = getUser();
  const isOwner = user?.id === club.owner_id;

  content.innerHTML = `<div class="page-full page-enter">
    <div class="club-detail-cover">
      ${club.cover_url ? `<img src="${club.cover_url}" alt="" style="width:100%;height:100%;object-fit:cover">` : ''}
    </div>

    <div class="page">
      <div class="club-detail-header">
        <div class="club-avatar-pull">
          <div class="club-avatar-box">
            ${club.avatar_url ? `<img src="${club.avatar_url}" alt="">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--primary-alpha);color:var(--primary)">${(club.name || 'K')[0].toUpperCase()}</div>`}
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-4)">
          <div>
            <div class="club-name-big">${escapeHtml(club.name)}</div>
            <div class="club-meta-row">
              <span class="club-meta-item"><i class="fas fa-users"></i>${formatNumber(club.member_count || 0)} üye</span>
              ${club.location ? `<span class="club-meta-item"><i class="fas fa-map-marker-alt"></i>${escapeHtml(club.location)}</span>` : ''}
              ${club.vehicle_type ? `<span class="club-meta-item">${club.vehicle_type === 'motorcycle' ? '🏍️' : club.vehicle_type === 'bicycle' ? '🚲' : '🔄'}</span>` : ''}
              <span class="club-meta-item"><i class="fas fa-lock-open"></i>${club.join_type === 'open' ? 'Açık Kulüp' : club.join_type === 'approval' ? 'Onay Gerekli' : 'Sadece Davet'}</span>
            </div>
          </div>
          <div style="display:flex;gap:var(--sp-2)">
            ${!isOwner ? `<button class="btn ${isMember ? 'btn-outline' : 'btn-primary'}" id="join-club-btn">
              <i class="fas ${isMember ? 'fa-user-minus' : 'fa-user-plus'}"></i>
              ${isMember ? 'Kulüpten Ayrıl' : 'Kulübe Katıl'}
            </button>` : `<span class="tag tag-primary"><i class="fas fa-crown"></i> Kulüp Kurucusu</span>`}
          </div>
        </div>
        ${club.description ? `<p style="color:var(--text-2);line-height:1.7;margin-top:var(--sp-4);font-size:var(--text-sm);max-width:720px">${escapeHtml(club.description)}</p>` : ''}
      </div>

      <div class="tabs" style="margin-bottom:var(--sp-6)">
        <button class="tab-btn active" data-tab="members">Üyeler (${members.length})</button>
        <button class="tab-btn" data-tab="about">Hakkında</button>
      </div>

      <div id="tab-members">${renderMembers(members)}</div>
      <div id="tab-about" style="display:none">
        <div class="card">
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-5)">
              <div><div style="font-size:var(--text-xs);font-weight:700;color:var(--text-3);margin-bottom:var(--sp-2)">KURUCU</div>
                <a href="#/profile/${club.owner_id}" style="display:flex;align-items:center;gap:var(--sp-2);text-decoration:none">
                  <img src="${club.profiles?.avatar_url || avatarFallback(club.profiles?.full_name || 'U')}" alt="" class="avatar avatar-sm">
                  <span style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(club.profiles?.full_name || club.profiles?.username || 'Kullanıcı')}</span>
                </a>
              </div>
              <div><div style="font-size:var(--text-xs);font-weight:700;color:var(--text-3);margin-bottom:var(--sp-2)">ÜYE SAYISI</div><div style="font-size:var(--text-2xl);font-weight:800">${formatNumber(club.member_count || 0)}</div></div>
              <div><div style="font-size:var(--text-xs);font-weight:700;color:var(--text-3);margin-bottom:var(--sp-2)">ARAÇ TİPİ</div><div>${club.vehicle_type === 'motorcycle' ? '🏍️ Motosiklet' : club.vehicle_type === 'bicycle' ? '🚲 Bisiklet' : '🔄 Her İkisi'}</div></div>
              <div><div style="font-size:var(--text-xs);font-weight:700;color:var(--text-3);margin-bottom:var(--sp-2)">KURULMA</div><div>${new Date(club.created_at).toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-members').style.display = btn.dataset.tab === 'members' ? '' : 'none';
      document.getElementById('tab-about').style.display = btn.dataset.tab === 'about' ? '' : 'none';
    });
  });

  if (!isOwner) bindJoinClub(club, isMember);
}

function renderMembers(members) {
  if (!members.length) return '<div class="empty-state sm"><i class="fas fa-user-slash"></i><p>Henüz üye yok</p></div>';
  return `<div class="grid-auto" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
    ${members.map(m => `
      <a href="#/profile/${m.user_id}" class="card" style="padding:var(--sp-4);display:flex;align-items:center;gap:var(--sp-3);text-decoration:none;transition:all .15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <img src="${m.profiles?.avatar_url || avatarFallback(m.profiles?.full_name || 'U')}" alt="" class="avatar avatar-md" onerror="this.src='${avatarFallback(m.profiles?.full_name || 'U')}'">
        <div style="min-width:0">
          <div style="font-weight:600;font-size:var(--text-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(m.profiles?.full_name || m.profiles?.username || 'Kullanıcı')}</div>
          <div style="font-size:var(--text-xs);color:var(--text-3)">@${escapeHtml(m.profiles?.username || '')} ${m.role !== 'member' ? `• ${m.role === 'admin' ? '👑 Admin' : '🛡️ Mod'}` : ''}</div>
        </div>
      </a>`).join('')}
  </div>`;
}

function bindJoinClub(club, initialMember) {
  let member = initialMember;
  document.getElementById('join-club-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const user = getUser();
    if (!user) { toast.warning('Katılmak için giriş yapın'); return; }
    btn.disabled = true;
    try {
      if (member) {
        await leaveClub(club.id);
        member = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Kulübe Katıl';
        btn.className = 'btn btn-primary';
        toast.info('Kulüpten ayrıldınız');
      } else {
        await joinClub(club.id);
        member = true;
        btn.innerHTML = '<i class="fas fa-user-minus"></i> Kulüpten Ayrıl';
        btn.className = 'btn btn-outline';
        toast.success('Kulübe katıldınız!');
      }
    } catch (err) { toast.error(err.message); }
    finally { btn.disabled = false; }
  });
}

function renderClubCard(club) {
  return `<a href="#/clubs/${club.id}" class="club-card">
    <div class="club-card-cover">
      ${club.cover_url ? `<img src="${club.cover_url}" alt="" loading="lazy">` : ''}
    </div>
    <div class="club-card-body">
      <div class="club-card-avatar">
        ${club.avatar_url ? `<img src="${club.avatar_url}" alt="">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--primary);color:white;font-size:1.25rem;font-weight:800">${(club.name || 'K')[0].toUpperCase()}</div>`}
      </div>
      <div class="club-card-name">${escapeHtml(club.name)}</div>
      <p class="club-card-desc">${escapeHtml(club.description || '')}</p>
      <div class="club-card-footer">
        <span class="club-card-members"><i class="fas fa-users"></i> ${formatNumber(club.member_count || 0)} üye</span>
        ${club.vehicle_type ? `<span class="tag tag-gray">${club.vehicle_type === 'motorcycle' ? '🏍️' : club.vehicle_type === 'bicycle' ? '🚲' : '🔄'}</span>` : ''}
      </div>
    </div>
  </a>`;
}
