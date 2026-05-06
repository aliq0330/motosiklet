const ICONS = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation', info: 'fa-info' };

export function showToast(message, type = 'info', title = '', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${ICONS[type] || 'fa-info'}"></i></div>
    <div class="toast-body">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" aria-label="Kapat"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  const close = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', close);

  if (duration > 0) setTimeout(close, duration);

  return { close };
}

export const toast = {
  success: (msg, title) => showToast(msg, 'success', title || 'Başarılı'),
  error: (msg, title) => showToast(msg, 'error', title || 'Hata', 6000),
  warning: (msg, title) => showToast(msg, 'warning', title || 'Uyarı'),
  info: (msg, title) => showToast(msg, 'info', title || 'Bilgi')
};
