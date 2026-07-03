// Anonymous, persistent per-browser session id.
//
// Used to tell "the same guest reloading the Menu page" apart from
// "a different device scanning the table's QR code", so the backend can
// decide whether an already-Occupied table should still let this visitor
// in (refresh) or bounce them to the error page (someone else's session).
const SESSION_KEY = 'bakery_session_id';

export const getSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};
