import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuth } from "@/hooks/useAuth";

// The session token lives in browser storage. See docs/adr/0001-session-token-in-browser-storage.md.
let sessionToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function bindSession(token: string | null, logout: () => void) {
  sessionToken = token;
  onUnauthorized = logout;
}

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export function useAxiosWithAuth() {
  const { token, logout } = useAuth();
  bindSession(token, logout);
  return api;
}
