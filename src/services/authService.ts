// ============================================================
// Zenvix Auth Service
// ============================================================

import zenvixClient from "@/lib/zenvixClient";
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "@/lib/tokenManager";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export async function registerCustomer(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await zenvixClient.post<AuthResponse>(
    "auth/register",
    payload,
  );
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  return data;
}

export async function loginCustomer(
  payload: LoginPayload,
): Promise<AuthResponse> {
  const { data } = await zenvixClient.post<AuthResponse>("auth/login", payload);
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  return data;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const { data } = await zenvixClient.post<AuthResponse>("auth/refresh", {
    refreshToken: token,
  });
  setAccessToken(data.accessToken);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  return data;
}

export function logoutCustomer(): void {
  clearTokens();
}
