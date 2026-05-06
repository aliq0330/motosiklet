let currentModal = null;

export function openModal(content, options = {}) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;

  body.innerHTML = content;
  if (options.size === 'lg') box.style.maxWidth = '800px';
  else if (options.size === 'sm') box.style.maxWidth = '400px';
  else box.style.maxWidth = '';

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  currentModal = { overlay, onClose: options.onClose };

  if (options.onMount) options.onMount(body);

  return { close: closeModal };
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
  if (currentModal?.onClose) currentModal.onClose();
  currentModal = null;
}

export function initModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close-btn');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  closeBtn?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

export function confirmModal(message, title = 'Emin misiniz?') {
  return new Promise((resolve) => {
    openModal(`
      <div style="text-align:center; padding: 8px 0">
        <div style="font-size:3rem; margin-bottom:16px">⚠️</div>
        <h3 style="margin-bottom:12px; font-size:1.25rem">${title}</h3>
        <p style="color:var(--text-3); margin-bottom:24px; font-size:0.9rem">${message}</p>
        <div style="display:flex; gap:12px; justify-content:center">
          <button class="btn btn-outline" id="confirm-cancel">İptal</button>
          <button class="btn btn-danger" id="confirm-ok">Evet, Devam Et</button>
        </div>
      </div>
    `, {
      onMount: (el) => {
        el.querySelector('#confirm-cancel').onclick = () => { closeModal(); resolve(false); };
        el.querySelector('#confirm-ok').onclick = () => { closeModal(); resolve(true); };
      },
      onClose: () => resolve(false)
    });
  });
}
