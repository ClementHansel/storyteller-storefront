// ============================================================
// Zenvix Token Manager
// Handles accessToken (sessionStorage) and refresh flow
// ============================================================

const ACCESS_TOKEN_KEY = "zenvix_access_token";
let memoryRefreshToken: string | null = null;

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
  return memoryRefreshToken;
}

export function setRefreshToken(token: string): void {
  memoryRefreshToken = token;
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    memoryRefreshToken = null;
  } catch {
    // silent
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
