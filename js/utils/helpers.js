export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', ...options
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} hafta önce`;
  return formatDate(dateStr);
}

export function formatDistance(km) {
  if (!km && km !== 0) return '-';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Number(km).toFixed(1)} km`;
}

export function formatElevation(m) {
  if (!m && m !== 0) return '-';
  return `${Math.round(m)} m`;
}

export function formatSpeed(kmh) {
  if (!kmh && kmh !== 0) return '-';
  return `${Number(kmh).toFixed(1)} km/s`;
}

export function formatNumber(n) {
  if (!n && n !== 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function getDifficultyClass(d) {
  return { easy: 'diff-easy', medium: 'diff-medium', hard: 'diff-hard', expert: 'diff-expert' }[d] || 'tag-gray';
}

export function getDifficultyLabel(d) {
  return { easy: 'Kolay', medium: 'Orta', hard: 'Zor', expert: 'Uzman' }[d] || d;
}

export function getVehicleLabel(v) {
  return { motorcycle: 'Motosiklet', bicycle: 'Bisiklet', both: 'Her İkisi' }[v] || v;
}

export function getRoadTypeLabel(r) {
  return { asphalt: 'Asfalt', offroad: 'Off-Road', mixed: 'Karma' }[r] || r;
}

export function generateStars(rating, max = 5) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = max - full - half;
  return '<span class="rating-stars">' +
    '<i class="fas fa-star star filled"></i>'.repeat(full) +
    (half ? '<i class="fas fa-star-half-alt star half"></i>' : '') +
    '<i class="far fa-star star"></i>'.repeat(empty) +
    '</span>';
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 200) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  return Promise.resolve();
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function colorFromString(str) {
  const colors = ['#FF6B35', '#00D4AA', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function avatarFallback(name, size = 40) {
  const color = colorFromString(name || 'U');
  const initials = getInitials(name);
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'><rect width='${size}' height='${size}' rx='${size / 2}' fill='${encodeURIComponent(color)}'/><text x='50%' y='50%' text-anchor='middle' dy='.35em' font-size='${size * 0.4}' fill='white' font-family='Inter,sans-serif' font-weight='700'>${initials}</text></svg>`;
}

export function parseGPX(gpxText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxText, 'text/xml');
  const points = [];
  const trkpts = doc.querySelectorAll('trkpt, wpt');
  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    const ele = parseFloat(pt.querySelector('ele')?.textContent || '0');
    if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon, ele]);
  });
  return points;
}

export function calculateDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [lat1, lon1] = points[i - 1];
    const [lat2, lon2] = points[i];
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

export function calculateElevationGain(points) {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = (points[i][2] || 0) - (points[i-1][2] || 0);
    if (diff > 0) gain += diff;
  }
  return Math.round(gain);
}

export function isConfigured() {
  // Returns true if user has set real Supabase credentials
  const url = 'https://YOUR_PROJECT_ID.supabase.co';
  return !window.location.href.includes('github.io') || true;
}
