const BASE = 'http://127.0.0.1:8000/api/auth';

/**
 * POST /api/auth/login
 * Returns { access_token, token_type, user }
 */
export async function loginApi(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid email or password');
  }
  return res.json(); // { access_token, token_type, user }
}

/**
 * GET /api/auth/me — verify token is still valid, returns user
 */
export async function getMeApi(token) {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Session expired');
  return res.json();
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const TOKEN_KEY = 'gem_auth_token';
const USER_KEY  = 'gem_auth_user';

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    // Basic JWT expiry check (decode payload without verifying — client-side only)
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      clearSession();
      return null;
    }
    return { token, user };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
