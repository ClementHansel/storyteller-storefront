// ============================================================
// Zenvix Token Manager
// Handles accessToken (sessionStorage) and refresh flow
// ============================================================

const ACCESS_TOKEN_KEY = 'zenvix_access_token';
const REFRESH_TOKEN_KEY = 'zenvix_refresh_token';

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // sessionStorage unavailable (e.g. incognito in some browsers)
  }
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // fallback silently
  }
}

export function clearTokens(): void {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // silent
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
