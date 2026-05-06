const routes = new Map();
let currentRoute = null;
let notFoundHandler = null;

export function addRoute(path, handler) {
  routes.set(path, handler);
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path, replace = false) {
  const hash = '#' + path;
  if (replace) {
    history.replaceState(null, '', hash);
  } else {
    history.pushState(null, '', hash);
  }
  handleRoute();
}

function getHashPath() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return '/';
  return hash.slice(1).split('?')[0] || '/';
}

function getHashParams() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return {};
  const qs = hash.slice(qIdx + 1);
  const params = {};
  qs.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return params;
}

function matchRoute(path) {
  // Exact match first
  if (routes.has(path)) {
    return { handler: routes.get(path), params: {} };
  }
  // Pattern match
  for (const [pattern, handler] of routes) {
    if (!pattern.includes(':')) continue;
    const parts = pattern.split('/');
    const pathParts = path.split('/');
    if (parts.length !== pathParts.length) continue;
    const params = {};
    let match = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) {
        params[parts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (parts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return { handler, params };
  }
  return null;
}

async function handleRoute() {
  const path = getHashPath();
  const queryParams = getHashParams();

  if (currentRoute === path + window.location.hash.split('?')[1]) return;
  currentRoute = path;

  const matched = matchRoute(path);
  if (matched) {
    try {
      await matched.handler({ params: matched.params, query: queryParams });
    } catch (err) {
      console.error('Route error:', err);
    }
  } else if (notFoundHandler) {
    notFoundHandler({ path });
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Handle GitHub Pages redirect
  const search = window.location.search;
  if (search) {
    const redirectPath = search.slice(1).replace(/~and~/g, '&');
    history.replaceState(null, '', '#' + redirectPath);
  }
  handleRoute();
}

export function getCurrentPath() {
  return getHashPath();
}
