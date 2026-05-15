const API_BASE_URL = '/api';

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

export async function getSession() {
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Sessiyani olishda xato');
  }

  return response.json();
}

async function getCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
}

/* ────────────  Google OAuth  ──────────── */

export async function beginGoogleAuth(callbackUrl = window.location.origin) {
  const csrfToken = await getCsrfToken();
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${API_BASE_URL}/auth/signin/google`;
  form.style.display = 'none';

  const csrfInput = document.createElement('input');
  csrfInput.name = 'csrfToken';
  csrfInput.value = csrfToken;
  form.appendChild(csrfInput);

  const callbackInput = document.createElement('input');
  callbackInput.name = 'callbackUrl';
  callbackInput.value = callbackUrl;
  form.appendChild(callbackInput);

  document.body.appendChild(form);
  form.submit();
}

/* ────────────  Oddiy email/parol  ──────────── */

export async function registerWithCredentials(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.error || 'Ro\'yxatdan o\'tishda xato');
  }

  return data;
}

export async function loginWithCredentials(email, password) {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_BASE_URL}/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${window.location.origin}`,
    }),
  });

  // Session tekshirish
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Email yoki parol noto\'g\'ri');
  }
  return session;
}

/* ────────────  Sign Out  ──────────── */

export async function signOutSession(callbackUrl = `${window.location.origin}/`) {
  const csrfToken = await getCsrfToken();
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${API_BASE_URL}/auth/signout?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  form.style.display = 'none';

  const csrfInput = document.createElement('input');
  csrfInput.name = 'csrfToken';
  csrfInput.value = csrfToken;
  form.appendChild(csrfInput);

  document.body.appendChild(form);
  form.submit();
}
