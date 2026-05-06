import { ApiClientError, fetchJson } from "@/lib/api/client";

type AuthSuccessResponse = {
  message: string;
  user: unknown;
};

export async function signIn(input: { email: string; password: string }) {
  try {
    return await fetchJson<AuthSuccessResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError("Login failed.");
  }
}

export async function signUp(input: { email: string; password: string }) {
  try {
    return await fetchJson<AuthSuccessResponse>("/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError("Sign-up failed.");
  }
}

export async function signOut() {
  try {
    return await fetchJson<{ message: string }>("/api/auth/sign-out", {
      method: "POST",
    });
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError("Sign-out failed.");
  }
}

