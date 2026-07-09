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