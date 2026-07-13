// === Session persistence (localStorage) ===
//
// The whole app state autosaves to this browser's localStorage after every
// change, so an accidental refresh or crash never loses a team's work.
// Nothing is transmitted anywhere: the data exists only on this device
// until the team downloads its export file, and is erased by "Start over".

const STORAGE_KEY = 'ddt.session.v1';

function saveSession(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  } catch (err) {
    // Private-mode browsers can deny storage; the workshop still works,
    // it just won't survive a refresh.
    console.warn('Could not save session:', err);
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || !state.team || !state.team.code) return null;
    return state;
  } catch (err) {
    console.warn('Could not read saved session:', err);
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear session:', err);
  }
}

Object.assign(window, { saveSession, loadSession, clearSession });
