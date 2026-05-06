import { getConversations, getMessages, sendMessage } from '../utils/api.js';
import { timeAgo, escapeHtml, avatarFallback } from '../utils/helpers.js';
import { getUser } from '../auth.js';
import { db } from '../supabase-client.js';
import { toast } from '../components/toast.js';

let realtimeChannel = null;
let currentPartnerId = null;

export async function renderMessages({ params = {} } = {}) {
  const content = document.getElementById('page-content');
  const user = getUser();
  if (!user) { content.innerHTML = `<div class="page"><div class="empty-state"><i class="fas fa-lock"></i><p>Mesajlaşmak için giriş yapın</p><a href="#/login" class="btn btn-primary btn-sm">Giriş Yap</a></div></div>`; return; }

  content.innerHTML = `<div class="messages-layout page-enter" id="messages-layout">
    <div class="msg-list-panel">
      <div class="msg-list-header">
        <h2>Mesajlar</h2>
        <div class="msg-search">
          <i class="fas fa-search msg-search-icon"></i>
          <input type="text" class="msg-search-input" placeholder="Konuşma ara..." id="conv-search">
        </div>
      </div>
      <div id="conv-list"><div class="page-loading"><div class="spinner"></div></div></div>
    </div>
    <div class="msg-chat-panel" id="msg-chat-panel">
      <div class="no-chat-selected" id="no-chat">
        <i class="fas fa-comment-dots"></i>
        <p>Konuşma seçin</p>
        <span style="font-size:var(--text-sm)">Sol taraftan bir konuşma seçin veya yeni bir mesaj başlatın</span>
      </div>
    </div>
  </div>`;

  await loadConversations();

  if (params.id) {
    openChat(params.id);
  }
}

async function loadConversations() {
  const list = document.getElementById('conv-list');
  if (!list) return;

  try {
    const convs = await getConversations();
    if (!convs.length) {
      list.innerHTML = '<div class="empty-state sm"><i class="fas fa-comment-slash"></i><p>Konuşma yok</p><span>Kullanıcı profilinden mesaj başlatın</span></div>';
      return;
    }
    list.innerHTML = convs.map(conv => renderConvItem(conv)).join('');
    list.querySelectorAll('.conv-item').forEach(item => {
      item.addEventListener('click', () => {
        list.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        openChat(item.dataset.partnerId);
        document.getElementById('messages-layout')?.classList.add('chat-open');
      });
    });
  } catch (err) {
    list.innerHTML = '<div class="empty-state sm"><i class="fas fa-exclamation-circle"></i><p>Yüklenemedi</p></div>';
  }
}

function renderConvItem(conv) {
  const { partner, lastMessage, unread } = conv;
  return `<div class="conv-item" data-partner-id="${partner.id}">
    <div style="position:relative;flex-shrink:0">
      <img src="${partner.avatar_url || avatarFallback(partner.full_name || partner.username)}" alt="" class="avatar avatar-md"
           onerror="this.src='${avatarFallback(partner.full_name || partner.username)}'">
    </div>
    <div class="conv-info">
      <div class="conv-name">
        <span>${escapeHtml(partner.full_name || partner.username || 'Kullanıcı')}</span>
        <span class="conv-time">${timeAgo(lastMessage.created_at)}</span>
      </div>
      <div class="conv-last-msg">
        <span>${escapeHtml(lastMessage.content?.substring(0, 40) || '')}${lastMessage.content?.length > 40 ? '...' : ''}</span>
        ${unread > 0 ? `<span class="conv-unread">${unread}</span>` : ''}
      </div>
    </div>
  </div>`;
}

async function openChat(partnerId) {
  currentPartnerId = partnerId;
  const panel = document.getElementById('msg-chat-panel');
  if (!panel) return;

  const user = getUser();
  panel.innerHTML = `<div class="chat-header" id="chat-header">
    <button class="icon-btn show-sm" id="back-to-list" style="display:none"><i class="fas fa-arrow-left"></i></button>
    <div style="display:flex;align-items:center;gap:var(--sp-3);flex:1">
      <div id="chat-partner-avatar" style="width:40px;height:40px;border-radius:50%;background:var(--surface-3);flex-shrink:0"></div>
      <div class="chat-header-info">
        <div class="chat-header-name" id="chat-partner-name">Yükleniyor...</div>
        <div class="chat-header-status">Çevrimiçi</div>
      </div>
    </div>
    <a id="view-profile-btn" href="#/profile/${partnerId}" class="btn btn-ghost btn-xs"><i class="fas fa-user"></i> Profil</a>
  </div>
  <div class="chat-messages" id="chat-messages"><div class="page-loading"><div class="spinner"></div></div></div>
  <div class="chat-input-area">
    <textarea class="chat-textarea" id="chat-input" placeholder="Mesajınızı yazın..." rows="1"></textarea>
    <button class="chat-send-btn" id="chat-send-btn" disabled><i class="fas fa-paper-plane"></i></button>
  </div>`;

  // Back button on mobile
  const backBtn = document.getElementById('back-to-list');
  if (window.innerWidth <= 768) { backBtn.style.display = 'flex'; }
  backBtn?.addEventListener('click', () => {
    document.getElementById('messages-layout')?.classList.remove('chat-open');
  });

  try {
    const messages = await getMessages(partnerId);
    renderMessages_chat(messages, user.id);

    // Load partner profile
    const { data: partner } = await db.from('profiles').select('*').eq('id', partnerId).single();
    if (partner) {
      document.getElementById('chat-partner-name').textContent = partner.full_name || partner.username;
      document.getElementById('chat-partner-avatar').innerHTML = `<img src="${partner.avatar_url || avatarFallback(partner.full_name || 'U')}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover" onerror="this.src='${avatarFallback(partner.full_name || 'U')}'">`;
    }
  } catch (err) {
    document.getElementById('chat-messages').innerHTML = '<div class="empty-state sm"><i class="fas fa-exclamation-circle"></i><p>Mesajlar yüklenemedi</p></div>';
  }

  setupChatInput(partnerId, user.id);
  setupRealtimeMessages(partnerId, user.id);
}

function renderMessages_chat(messages, myId) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  if (!messages.length) {
    container.innerHTML = '<div class="empty-state sm"><i class="fas fa-comment"></i><p>Henüz mesaj yok</p><span>İlk mesajı gönder!</span></div>';
    return;
  }

  let html = '';
  let lastDate = null;

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('tr-TR');
    if (msgDate !== lastDate) {
      html += `<div class="chat-date-divider">${msgDate}</div>`;
      lastDate = msgDate;
    }
    const isMe = msg.sender_id === myId;
    html += `<div class="msg-group ${isMe ? 'outgoing' : 'incoming'}">
      <div class="msg-bubble ${isMe ? 'outgoing' : 'incoming'}">
        ${escapeHtml(msg.content)}
        <div class="msg-meta">${new Date(msg.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}${isMe ? ' <i class="fas fa-check" style="font-size:9px"></i>' : ''}</div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function setupChatInput(partnerId, myId) {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  if (!input || !sendBtn) return;

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage_action(partnerId, myId);
    }
  });

  sendBtn.addEventListener('click', () => sendMessage_action(partnerId, myId));
}

async function sendMessage_action(partnerId, myId) {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const content = input?.value.trim();
  if (!content) return;

  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  try {
    const msg = await sendMessage(partnerId, content);
    appendMessage(msg, myId);
  } catch (err) {
    toast.error('Mesaj gönderilemedi');
    if (input) { input.value = content; sendBtn.disabled = false; }
  }
}

function appendMessage(msg, myId) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const emptyState = container.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const isMe = msg.sender_id === myId;
  const div = document.createElement('div');
  div.className = `msg-group ${isMe ? 'outgoing' : 'incoming'}`;
  div.innerHTML = `<div class="msg-bubble ${isMe ? 'outgoing' : 'incoming'}">
    ${escapeHtml(msg.content)}
    <div class="msg-meta">${new Date(msg.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}${isMe ? ' <i class="fas fa-check" style="font-size:9px"></i>' : ''}</div>
  </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function setupRealtimeMessages(partnerId, myId) {
  if (realtimeChannel) db.removeChannel(realtimeChannel);

  realtimeChannel = db.channel(`messages-${myId}-${partnerId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: `receiver_id=eq.${myId}`
    }, (payload) => {
      if (payload.new.sender_id === partnerId && currentPartnerId === partnerId) {
        appendMessage(payload.new, myId);
        loadConversations();
      }
    })
    .subscribe();
}
