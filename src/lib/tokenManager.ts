// ============================================================
// Zenvix Token Manager
// Handles accessToken (localStorage) and refresh flow.
// Refresh token is stored in localStorage for session persistence.
// ============================================================

const ACCESS_TOKEN_KEY = "zenvix_access_token";
const REFRESH_TOKEN_KEY = "zenvix_refresh_token";

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // silent
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
