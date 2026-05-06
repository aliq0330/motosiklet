import { getNotifications, markNotificationsRead } from '../utils/api.js';
import { timeAgo, escapeHtml, avatarFallback } from '../utils/helpers.js';
import { navigate } from '../router.js';
import { db } from '../supabase-client.js';
import { getUser } from '../auth.js';

let realtimeChannel = null;
let unreadCount = 0;

export async function initNotifications() {
  await refreshNotifications();
  setupRealtimeNotifications();
}

export async function refreshNotifications() {
  const user = getUser();
  if (!user) return;

  const notifications = await getNotifications().catch(() => []);
  unreadCount = notifications.filter(n => !n.is_read).length;

  updateNotifDot();
  renderNotifications(notifications);
}

function updateNotifDot() {
  const dot = document.getElementById('notif-dot');
  if (dot) {
    dot.classList.toggle('hidden', unreadCount === 0);
  }
}

function renderNotifications(notifications) {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (!notifications.length) {
    list.innerHTML = '<div class="empty-state sm"><i class="fas fa-bell-slash"></i><p>Bildirim yok</p></div>';
    return;
  }

  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.is_read ? '' : 'unread'}" data-link="${escapeHtml(n.link || '')}">
      <img src="${n.actor?.avatar_url || avatarFallback(n.actor?.full_name || n.actor?.username || 'U')}"
           alt="" class="notif-avatar"
           onerror="this.src='${avatarFallback(n.actor?.full_name || 'U')}'">
      <div class="notif-content">
        <div class="notif-text">${escapeHtml(n.body || n.title)}</div>
        <div class="notif-time">${timeAgo(n.created_at)}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.notif-item[data-link]').forEach(item => {
    item.addEventListener('click', () => {
      const link = item.dataset.link;
      if (link) { navigate(link); closeNotifPanel(); }
    });
  });
}

export function setupNotificationPanel() {
  const btn = document.getElementById('notif-btn');
  const panel = document.getElementById('notif-panel');
  const closeBtn = document.getElementById('notif-close-btn');
  const overlay = document.getElementById('panel-overlay');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  if (!btn || !panel) return;

  btn.addEventListener('click', () => {
    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
      closeNotifPanel();
    } else {
      panel.classList.remove('hidden');
      overlay.classList.remove('hidden');
      markAllRead();
    }
  });

  closeBtn?.addEventListener('click', closeNotifPanel);
  overlay?.addEventListener('click', closeNotifPanel);
  markAllBtn?.addEventListener('click', markAllRead);
}

function closeNotifPanel() {
  document.getElementById('notif-panel')?.classList.add('hidden');
  document.getElementById('panel-overlay')?.classList.add('hidden');
}

async function markAllRead() {
  await markNotificationsRead().catch(() => {});
  unreadCount = 0;
  updateNotifDot();
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
}

function setupRealtimeNotifications() {
  const user = getUser();
  if (!user) return;

  if (realtimeChannel) {
    db.removeChannel(realtimeChannel);
  }

  realtimeChannel = db.channel(`notifs-${user.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, async () => {
      await refreshNotifications();
    })
    .subscribe();
}

export function getUnreadCount() { return unreadCount; }
