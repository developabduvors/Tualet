const API_BASE_URL = 'http://localhost:5000/api';
const ACCESS_KEY = 'toilet_finder_access_token';
const REFRESH_KEY = 'toilet_finder_refresh_token';

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function rawFetch(path, options, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) return null;
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  let response = await rawFetch(path, options, getAccessToken());

  // /auth/login, /auth/register, /auth/refresh — bularda refresh urinish ma'nosiz.
  const isAuthEndpoint =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint) {
    const newAccessToken = await tryRefresh();
    if (newAccessToken) {
      response = await rawFetch(path, options, newAccessToken);
    }
  }

  if (response.status === 401) {
    clearTokens();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Sessiya tugadi, qayta kiring');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export { API_BASE_URL, request, setTokens, clearTokens, getAccessToken };
