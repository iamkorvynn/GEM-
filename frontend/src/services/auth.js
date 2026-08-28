/**
 * auth.js — Mock GeM SSO Pass-through
 *
 * In production: officer identity would arrive automatically from the parent
 * GeM session (SSO / government employee ID). No separate login is needed.
 *
 * For the hackathon prototype: we simulate that pass-through by letting the
 * officer select their identity from a list of pre-seeded government officer
 * profiles. Nothing is sent to a backend — identity is held in sessionStorage
 * so it resets cleanly on browser close (mirrors a real SSO session lifecycle).
 */

const SESSION_KEY = 'gem_officer_session';

/** Persist the selected officer identity for this browser session. */
export function saveSession(officer) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(officer));
}

/** Load the officer identity from the current session (null if not selected). */
export function loadSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Clear the session (simulates GeM SSO sign-out / session expiry). */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
