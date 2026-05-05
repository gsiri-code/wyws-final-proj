export class ApiClientError extends Error {
  readonly isUnauthorized: boolean;
  readonly status?: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    opts: { status?: number; fieldErrors?: Record<string, string[]> } = {}
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = opts.status;
    this.isUnauthorized = opts.status === 401;
    this.fieldErrors = opts.fieldErrors;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const json = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const payload = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error === "string"
          ? payload.error
          : `Request failed (${res.status})`;
    const details = payload?.details;
    const fieldErrors =
      payload && typeof payload.fieldErrors === "object"
        ? (payload.fieldErrors as Record<string, string[]>)
        : details && typeof details === "object" && "fieldErrors" in details
          ? ((details as Record<string, unknown>).fieldErrors as Record<string, string[]>)
          : undefined;
    throw new ApiClientError(message, { status: res.status, fieldErrors });
  }

  return (json as T) ?? ({} as T);
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

